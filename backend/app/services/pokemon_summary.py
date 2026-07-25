from app.services.typing import get_effectiveness


def enrich(entry: dict, species: dict) -> dict:
    """Merge a pokemon.json entry with its species data and computed type effectiveness.

    Every code path that hands Pokémon data to the frontend (search, bulk hydration,
    criteria preview) should return this shape so columns/criteria can rely on one
    consistent object regardless of how a row entered a list.
    """
    return {
        **entry,
        **species.get(entry["name"], {}),
        "type_effectiveness": get_effectiveness(entry["types"]),
    }
