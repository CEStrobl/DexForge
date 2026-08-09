from app.data_access.cache_reader import get_dataset

_GENERATION_ORDER = [
    "generation-i", "generation-ii", "generation-iii", "generation-iv", "generation-v",
    "generation-vi", "generation-vii", "generation-viii", "generation-ix",
]


def _generation_sort_key(generation: str) -> int:
    try:
        return _GENERATION_ORDER.index(generation)
    except ValueError:
        return len(_GENERATION_ORDER)


def get_move_pool(slug: str) -> dict:
    """Every move a Pokémon (by its exact variant slug — forms can have their own
    learnsets) can learn, across every generation it has data for. Returns the full
    set rather than one generation at a time so the Lookup page can switch generation
    tabs by filtering in memory instead of a network round trip (see Notes/movepool.md)."""
    movesets = get_dataset("movesets")
    moves = get_dataset("moves")

    entries = movesets.get(slug, [])
    generations = sorted({e["generation"] for e in entries}, key=_generation_sort_key)

    rows = []
    for entry in entries:
        detail = moves.get(entry["move"])
        if not detail:
            continue
        rows.append(
            {
                "move": entry["move"],
                "method": entry["method"],
                "level": entry["level"],
                "generation": entry["generation"],
                "type": detail["type"],
                "category": detail["category"],
                "power": detail["power"],
                "accuracy": detail["accuracy"],
                "pp": detail["pp"],
                "effect": detail["effect"],
            }
        )

    return {"generations": generations, "moves": rows}
