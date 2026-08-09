def transform_pokemon(raw_pokemon: dict, raw_species: dict, slug: str) -> dict:
    stats = {s["stat"]["name"]: s["base_stat"] for s in raw_pokemon["stats"]}
    return {
        "id": raw_pokemon["id"],
        "name": slug,
        "types": [t["type"]["name"] for t in raw_pokemon["types"]],
        "stats": stats,
        "base_stat_total": sum(stats.values()),
        "ev_yield": [
            {"stat": s["stat"]["name"], "value": s["effort"]}
            for s in raw_pokemon["stats"]
            if s["effort"] > 0
        ],
        "abilities": [
            {"name": a["ability"]["name"], "is_hidden": a["is_hidden"]}
            for a in raw_pokemon["abilities"]
        ],
        "sprite": raw_pokemon["sprites"]["front_default"],
        "generation": raw_species["generation"]["name"],
        "evolution_chain_id": _chain_id_from_url(raw_species["evolution_chain"]["url"]),
        "species_slug": raw_species["name"],
        "is_default": raw_pokemon["is_default"],
    }


def transform_type(raw_type: dict) -> dict:
    relations = raw_type["damage_relations"]
    return {
        "double_damage_from": [t["name"] for t in relations["double_damage_from"]],
        "half_damage_from": [t["name"] for t in relations["half_damage_from"]],
        "no_damage_from": [t["name"] for t in relations["no_damage_from"]],
    }


def transform_nature(raw_nature: dict) -> dict:
    return {
        "name": raw_nature["name"],
        "increased_stat": raw_nature["increased_stat"]["name"] if raw_nature["increased_stat"] else None,
        "decreased_stat": raw_nature["decreased_stat"]["name"] if raw_nature["decreased_stat"] else None,
    }


def _chain_id_from_url(url: str) -> str:
    return url.rstrip("/").split("/")[-1]


def transform_move(raw_move: dict) -> dict:
    entry = next(
        (e for e in raw_move.get("effect_entries", []) if e["language"]["name"] == "en"), None
    )
    return {
        "name": raw_move["name"],
        "type": raw_move["type"]["name"],
        "category": raw_move["damage_class"]["name"] if raw_move.get("damage_class") else "status",
        "power": raw_move.get("power"),
        "accuracy": raw_move.get("accuracy"),
        "pp": raw_move.get("pp"),
        "effect": entry["short_effect"] if entry else "",
    }


# Only these four learn methods are surfaced (see Notes/movepool.md) — PokeAPI has a handful
# of exotic ones (form-change, light-ball-egg, stadium-surfing-pikachu, ...) that don't map
# cleanly onto a Level/TM/Egg/Tutor selector and are dropped rather than mis-bucketed.
LEARN_METHODS = {"level-up", "machine", "egg", "tutor"}


def transform_moveset(raw_pokemon: dict, version_group_to_generation: dict) -> list[dict]:
    """One row per (move, method, level, generation) a Pokémon can learn it in — deduped
    across version groups that share the same generation (e.g. red-blue and yellow both
    map to generation-i), since the UI selects by generation, not by version group."""
    seen = set()
    out = []
    for move_entry in raw_pokemon.get("moves", []):
        move_name = move_entry["move"]["name"]
        for detail in move_entry.get("version_group_details", []):
            method = detail["move_learn_method"]["name"]
            if method not in LEARN_METHODS:
                continue
            generation = version_group_to_generation.get(detail["version_group"]["name"])
            if not generation:
                continue
            level = detail["level_learned_at"] if method == "level-up" else 0
            key = (move_name, method, level, generation)
            if key in seen:
                continue
            seen.add(key)
            out.append({"move": move_name, "method": method, "level": level, "generation": generation})
    return out
