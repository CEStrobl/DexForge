import argparse
import json
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.http import get_json  # noqa: E402
from pokeapi.transform import (  # noqa: E402
    transform_move,
    transform_moveset,
    transform_nature,
    transform_pokemon,
    transform_type,
)

BASE = "https://pokeapi.co/api/v2"
ALL_TYPES = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
    "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark",
    "steel", "fairy",
]
DATA_CACHE_DIR = Path(__file__).resolve().parents[2] / "backend" / "data" / "cache"

# PokeAPI's `is_default` variety for these species carries a form suffix even though it's
# just the species' ordinary/base appearance (e.g. "basculin-red-striped" is plain old
# Basculin, "tornadus-incarnate" is plain old Tornadus) — renamed to the bare species name
# so URLs/search/list-builder slugs read naturally, and so pokemon.json's keys line up with
# evolution_chains.json's species nodes, which PokeAPI already gives as bare names (without
# this, GET /api/pokemon/{slug}/evolution-family 404s for every one of these species, since
# evolution.py joins evolution_chains.json's bare "species.name" straight against
# pokemon.json's keys).
DEFAULT_VARIANT_RENAMES = {
    "basculin-red-striped": "basculin",
    "darmanitan-standard": "darmanitan",
    "frillish-male": "frillish",
    "jellicent-male": "jellicent",
    "tornadus-incarnate": "tornadus",
    "landorus-incarnate": "landorus",
    "thundurus-incarnate": "thundurus",
    "enamorus-incarnate": "enamorus",
    "keldeo-ordinary": "keldeo",
    "meloetta-aria": "meloetta",
    "pyroar-male": "pyroar",
    "meowstic-male": "meowstic",
    "aegislash-shield": "aegislash",
    "pumpkaboo-average": "pumpkaboo",
    "gourgeist-average": "gourgeist",
    "zygarde-50": "zygarde",
    "oricorio-baile": "oricorio",
    "lycanroc-midday": "lycanroc",
    "wishiwashi-solo": "wishiwashi",
    "minior-red-meteor": "minior",
    "mimikyu-disguised": "mimikyu",
    "toxtricity-amped": "toxtricity",
    "morpeko-full-belly": "morpeko",
    "indeedee-male": "indeedee",
    "urshifu-single-strike": "urshifu",
    "basculegion-male": "basculegion",
    "oinkologne-male": "oinkologne",
    "maushold-family-of-four": "maushold",
    "squawkabilly-green-plumage": "squawkabilly",
    "dudunsparce-two-segment": "dudunsparce",
}


def fetch_types(session):
    print(f"Fetching {len(ALL_TYPES)} types...")
    return {t: transform_type(get_json(f"{BASE}/type/{t}", session)) for t in ALL_TYPES}


def fetch_natures(session):
    index = get_json(f"{BASE}/nature?limit=30", session)
    print(f"Fetching {len(index['results'])} natures...")
    natures = {}
    for entry in index["results"]:
        raw = get_json(entry["url"], session)
        natures[raw["name"]] = transform_nature(raw)
    return natures


def fetch_generation_version_groups(session):
    """version_group name -> generation name, e.g. "sword-shield" -> "generation-viii".
    Derived from the 9 /generation endpoints rather than hardcoded, since version group
    slugs aren't stable enough trivia to risk getting wrong from memory."""
    print("Fetching generation -> version group map...")
    mapping = {}
    for gen_id in range(1, 10):
        raw = get_json(f"{BASE}/generation/{gen_id}", session)
        for vg in raw["version_groups"]:
            mapping[vg["name"]] = raw["name"]
    return mapping


def fetch_pokemon_and_chains(session, limit, version_group_to_generation):
    index = get_json(f"{BASE}/pokemon?limit={limit}", session)
    total = len(index["results"])
    print(f"Fetching {total} pokemon (+ species + evolution chains)...")

    pokemon_out = {}
    species_out = {}
    chains_out = {}
    abilities_pokemon = {}
    ability_urls = {}
    movesets_out = {}
    move_urls = {}

    for i, entry in enumerate(index["results"], start=1):
        raw_pokemon = get_json(entry["url"], session)
        raw_species = get_json(raw_pokemon["species"]["url"], session)
        slug = DEFAULT_VARIANT_RENAMES.get(raw_pokemon["name"], raw_pokemon["name"])
        pokemon_out[slug] = transform_pokemon(raw_pokemon, raw_species, slug)
        genus_entry = next(
            (g for g in raw_species["genera"] if g["language"]["name"] == "en"), None
        )
        species_out[slug] = {
            "capture_rate": raw_species["capture_rate"],
            "egg_groups": [g["name"] for g in raw_species["egg_groups"]],
            "gender_rate": raw_species["gender_rate"],
            "is_legendary": raw_species["is_legendary"],
            "is_mythical": raw_species["is_mythical"],
            "growth_rate": raw_species["growth_rate"]["name"],
            "base_happiness": raw_species["base_happiness"],
            "hatch_counter": raw_species["hatch_counter"],
            "genus": genus_entry["genus"] if genus_entry else "",
        }

        for ability in raw_pokemon["abilities"]:
            name = ability["ability"]["name"]
            abilities_pokemon.setdefault(name, []).append(slug)
            ability_urls[name] = ability["ability"]["url"]

        # moves.json's per-move detail is fetched separately (deduped below) — this only
        # builds the learnset (which move, by what method/level/generation), reusing the
        # `moves` array already present on the /pokemon response instead of a new call.
        moveset = transform_moveset(raw_pokemon, version_group_to_generation)
        if moveset:
            movesets_out[slug] = moveset
        for move_entry in raw_pokemon.get("moves", []):
            move_urls[move_entry["move"]["name"]] = move_entry["move"]["url"]

        chain_url = raw_species["evolution_chain"]["url"]
        chain_id = chain_url.rstrip("/").split("/")[-1]
        if chain_id not in chains_out:
            chains_out[chain_id] = get_json(chain_url, session)

        if i % 50 == 0 or i == total:
            print(f"  {i}/{total}")

    descriptions = fetch_ability_descriptions(session, ability_urls)
    abilities_out = {
        name: {"pokemon": pokemon_list, "description": descriptions.get(name, "")}
        for name, pokemon_list in abilities_pokemon.items()
    }
    moves_out = fetch_move_details(session, move_urls)

    return pokemon_out, species_out, chains_out, abilities_out, moves_out, movesets_out


def fetch_move_details(session, move_urls):
    total = len(move_urls)
    print(f"Fetching {total} move details...")
    moves = {}
    for i, (name, url) in enumerate(move_urls.items(), start=1):
        raw = get_json(url, session)
        moves[name] = transform_move(raw)
        if i % 50 == 0 or i == total:
            print(f"  {i}/{total}")
    return moves


def fetch_ability_descriptions(session, ability_urls):
    total = len(ability_urls)
    print(f"Fetching {total} ability descriptions...")
    descriptions = {}
    for i, (name, url) in enumerate(ability_urls.items(), start=1):
        raw = get_json(url, session)
        entry = next((e for e in raw["effect_entries"] if e["language"]["name"] == "en"), None)
        descriptions[name] = entry["short_effect"] if entry else ""
        if i % 50 == 0 or i == total:
            print(f"  {i}/{total}")
    return descriptions


def main():
    parser = argparse.ArgumentParser(description="Pull PokeAPI base-game data into backend/data/cache/*.json")
    parser.add_argument("--limit", type=int, default=2000, help="Max pokemon to fetch (use a small number for a smoke test)")
    args = parser.parse_args()

    DATA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({"User-Agent": "DexForge-scraper/1.0"})

    types = fetch_types(session)
    natures = fetch_natures(session)
    version_group_to_generation = fetch_generation_version_groups(session)
    pokemon, species, chains, abilities, moves, movesets = fetch_pokemon_and_chains(
        session, args.limit, version_group_to_generation
    )

    _write("types.json", types)
    _write("natures.json", natures)
    _write("pokemon.json", pokemon)
    _write("species.json", species)
    _write("evolution_chains.json", chains)
    _write("abilities.json", abilities)
    _write("moves.json", moves)
    _write("movesets.json", movesets)

    print("Done.")


def _write(filename, data):
    path = DATA_CACHE_DIR / filename
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Wrote {path} ({len(data)} entries)")


if __name__ == "__main__":
    main()
