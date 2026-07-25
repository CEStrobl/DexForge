import argparse
import json
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.http import get_json  # noqa: E402
from pokeapi.transform import transform_nature, transform_pokemon, transform_type  # noqa: E402

BASE = "https://pokeapi.co/api/v2"
ALL_TYPES = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
    "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark",
    "steel", "fairy",
]
DATA_CACHE_DIR = Path(__file__).resolve().parents[2] / "data" / "cache"


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


def fetch_pokemon_and_chains(session, limit):
    index = get_json(f"{BASE}/pokemon?limit={limit}", session)
    total = len(index["results"])
    print(f"Fetching {total} pokemon (+ species + evolution chains)...")

    pokemon_out = {}
    species_out = {}
    chains_out = {}
    abilities_pokemon = {}
    ability_urls = {}

    for i, entry in enumerate(index["results"], start=1):
        raw_pokemon = get_json(entry["url"], session)
        raw_species = get_json(raw_pokemon["species"]["url"], session)
        pokemon_out[raw_pokemon["name"]] = transform_pokemon(raw_pokemon, raw_species)
        genus_entry = next(
            (g for g in raw_species["genera"] if g["language"]["name"] == "en"), None
        )
        species_out[raw_pokemon["name"]] = {
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
            abilities_pokemon.setdefault(name, []).append(raw_pokemon["name"])
            ability_urls[name] = ability["ability"]["url"]

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

    return pokemon_out, species_out, chains_out, abilities_out


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
    parser = argparse.ArgumentParser(description="Pull PokeAPI base-game data into data/cache/*.json")
    parser.add_argument("--limit", type=int, default=2000, help="Max pokemon to fetch (use a small number for a smoke test)")
    args = parser.parse_args()

    DATA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({"User-Agent": "DexForge-scraper/1.0"})

    types = fetch_types(session)
    natures = fetch_natures(session)
    pokemon, species, chains, abilities = fetch_pokemon_and_chains(session, args.limit)

    _write("types.json", types)
    _write("natures.json", natures)
    _write("pokemon.json", pokemon)
    _write("species.json", species)
    _write("evolution_chains.json", chains)
    _write("abilities.json", abilities)

    print("Done.")


def _write(filename, data):
    path = DATA_CACHE_DIR / filename
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Wrote {path} ({len(data)} entries)")


if __name__ == "__main__":
    main()
