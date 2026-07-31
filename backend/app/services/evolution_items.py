from app.data_access.cache_reader import get_dataset

# PokeAPI's `gender` id on an evolution_details entry: 1 = female, 2 = male.
GENDER_NOTES = {1: "Female only", 2: "Male only"}

TIME_OF_DAY_NOTES = {
    "day": "Daytime only",
    "night": "Nighttime only",
    "dusk": "At dusk",
    "full-moon": "During a full moon",
}


def _note(detail: dict) -> str | None:
    parts = []
    gender_note = GENDER_NOTES.get(detail.get("gender"))
    if gender_note:
        parts.append(gender_note)
    time_note = TIME_OF_DAY_NOTES.get(detail.get("time_of_day"))
    if time_note:
        parts.append(time_note)
    return ", ".join(parts) if parts else None


def _category(trigger: str | None, has_held_item: bool) -> str | None:
    if trigger == "use-item":
        return "use"
    if has_held_item and trigger == "level-up":
        return "hold-level"
    if has_held_item and trigger == "trade":
        # Infinite Fusion has no real trading — these evolve by holding the item and
        # using a Linking Cord from the bag instead of trading with a partner.
        return "hold-linking-cord"
    return None


def _walk_chain(node: dict, parent_species: str | None, by_item: dict[str, dict]):
    species = node["species"]["name"]
    for detail in node.get("evolution_details") or []:
        item = detail.get("item")
        held_item = detail.get("held_item")
        item_slug = item["name"] if item else (held_item["name"] if held_item else None)
        if not item_slug:
            continue
        category = _category(detail.get("trigger", {}).get("name"), bool(held_item))
        if not category:
            continue

        entry = by_item.setdefault(item_slug, {"category": category, "evolutions": []})
        evolution = {"from": parent_species, "to": species, "note": _note(detail)}
        if evolution not in entry["evolutions"]:
            entry["evolutions"].append(evolution)

    for child in node.get("evolves_to") or []:
        _walk_chain(child, species, by_item)


def get_evolution_items_index() -> list[dict]:
    """Reverse index: item -> how it's used (use / hold-level / hold-linking-cord) and
    which Pokémon it evolves. Only item-triggered evolutions — plain trade/friendship/
    level-up evolutions with no associated item are out of scope for an items page."""
    chains = get_dataset("evolution_chains")
    by_item: dict[str, dict] = {}
    for chain in chains.values() if isinstance(chains, dict) else chains:
        _walk_chain(chain["chain"], None, by_item)

    items = [
        {"item": item, "category": data["category"], "evolutions": data["evolutions"]}
        for item, data in by_item.items()
    ]
    items.sort(key=lambda entry: entry["item"])
    return items
