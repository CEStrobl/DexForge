from app.data_access.cache_reader import get_dataset

ALL_TYPES = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
    "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark",
    "steel", "fairy",
]


def get_effectiveness(types: list[str]) -> dict[str, float]:
    """Combined incoming-damage multiplier per attacking type, for a defender with the given type(s)."""
    type_data = get_dataset("types")
    multipliers = {t: 1.0 for t in ALL_TYPES}

    for defending_type in types:
        relations = type_data.get(defending_type)
        if not relations:
            continue
        for attacking_type in relations.get("double_damage_from", []):
            multipliers[attacking_type] *= 2
        for attacking_type in relations.get("half_damage_from", []):
            multipliers[attacking_type] *= 0.5
        for attacking_type in relations.get("no_damage_from", []):
            multipliers[attacking_type] *= 0

    return multipliers


def get_type_profile(type_name: str) -> dict[str, list[str]]:
    """A single type's full matchup profile: what it hits hard/weak/not-at-all
    (offense) and what hits it hard/weak/not-at-all (defense).

    The cached type data only stores the defensive relations directly (what a
    type takes double/half/no damage FROM), so the offensive side is derived
    by inverting that relation across every other type — no extra scrape needed.
    """
    type_data = get_dataset("types")
    own = type_data.get(type_name, {})

    double_to, half_to, no_to = [], [], []
    for other_type, relations in type_data.items():
        if type_name in relations.get("double_damage_from", []):
            double_to.append(other_type)
        if type_name in relations.get("half_damage_from", []):
            half_to.append(other_type)
        if type_name in relations.get("no_damage_from", []):
            no_to.append(other_type)

    return {
        "double_damage_to": sorted(double_to),
        "half_damage_to": sorted(half_to),
        "no_damage_to": sorted(no_to),
        "double_damage_from": sorted(own.get("double_damage_from", [])),
        "half_damage_from": sorted(own.get("half_damage_from", [])),
        "no_damage_from": sorted(own.get("no_damage_from", [])),
    }


def get_all_type_profiles() -> dict[str, dict[str, list[str]]]:
    return {t: get_type_profile(t) for t in ALL_TYPES}
