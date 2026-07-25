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
