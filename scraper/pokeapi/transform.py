def transform_pokemon(raw_pokemon: dict, raw_species: dict) -> dict:
    stats = {s["stat"]["name"]: s["base_stat"] for s in raw_pokemon["stats"]}
    return {
        "id": raw_pokemon["id"],
        "name": raw_pokemon["name"],
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
