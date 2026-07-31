from app.data_access.cache_reader import get_dataset
from app.services.pokemon_summary import enrich
from app.services.variants import is_canonical

# Maps a Python-identifier-safe criteria key (e.g. "special_attack") to the
# hyphenated stat key PokeAPI/the scraper actually use in `mon["stats"]`.
STAT_FIELD_MAP = {
    "hp": "hp",
    "attack": "attack",
    "defense": "defense",
    "special_attack": "special-attack",
    "special_defense": "special-defense",
    "speed": "speed",
}
NUMERIC_FIELDS = ["base_stat_total", "capture_rate", "base_happiness", "hatch_counter"]


def _in_range(value, criteria: dict, prefix: str) -> bool:
    lo = criteria.get(f"{prefix}_min")
    hi = criteria.get(f"{prefix}_max")
    if lo is not None and (value is None or value < lo):
        return False
    if hi is not None and (value is None or value > hi):
        return False
    return True


def filter_pokemon(criteria: dict) -> list[dict]:
    pokemon = get_dataset("pokemon")
    species = get_dataset("species")
    entries = [p for p in pokemon.values() if is_canonical(p["name"])] if isinstance(pokemon, dict) else pokemon

    generation = criteria.get("generation")
    types = criteria.get("types")
    weak_to = criteria.get("weak_to")
    ability = criteria.get("ability")
    egg_groups = criteria.get("egg_groups")
    ev_yield_stats = criteria.get("ev_yield_stats")
    growth_rate = criteria.get("growth_rate")
    is_legendary = criteria.get("is_legendary")
    is_mythical = criteria.get("is_mythical")

    def matches(mon: dict) -> bool:
        if generation and mon.get("generation") != generation:
            return False
        if types and not set(types) & set(mon.get("types", [])):
            return False
        if ability and ability not in {a["name"] for a in mon.get("abilities", [])}:
            return False
        if egg_groups and not set(egg_groups) & set(mon.get("egg_groups", [])):
            return False
        if ev_yield_stats and not set(ev_yield_stats) & {e["stat"] for e in mon.get("ev_yield", [])}:
            return False
        if growth_rate and mon.get("growth_rate") != growth_rate:
            return False
        if is_legendary and not mon.get("is_legendary"):
            return False
        if is_mythical and not mon.get("is_mythical"):
            return False
        if weak_to:
            effectiveness = mon["type_effectiveness"]
            if not any(effectiveness.get(t, 1) > 1 for t in weak_to):
                return False
        for criteria_key, stats_key in STAT_FIELD_MAP.items():
            if not _in_range(mon["stats"].get(stats_key), criteria, criteria_key):
                return False
        for field in NUMERIC_FIELDS:
            if not _in_range(mon.get(field), criteria, field):
                return False
        return True

    enriched = (enrich(e, species) for e in entries)
    return [mon for mon in enriched if matches(mon)]
