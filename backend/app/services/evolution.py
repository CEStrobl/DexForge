from app.data_access.cache_reader import get_dataset
from app.services.pokemon_summary import enrich


def get_evolution_family(pokemon_slug: str) -> dict | None:
    """Immediate prev/next evolution(s) for hot-swapping a Pokémon in place.

    Unlike get_evolution_tree (the full chain, for display), this only needs
    the direct parent and direct children of the given slug's chain node.
    """
    pokemon = get_dataset("pokemon")
    species_data = get_dataset("species")
    entry = pokemon.get(pokemon_slug)
    if not entry:
        return None

    chain = get_dataset("evolution_chains").get(entry["evolution_chain_id"])
    if not chain:
        return None

    def find(node, parent=None):
        if node["species"]["name"] == pokemon_slug:
            return parent, node
        for child in node.get("evolves_to") or []:
            found = find(child, node)
            if found:
                return found
        return None

    result = find(chain["chain"])
    if not result:
        return None
    parent_node, node = result

    def to_summary(species_name):
        mon = pokemon.get(species_name)
        return enrich(mon, species_data) if mon else None

    previous = to_summary(parent_node["species"]["name"]) if parent_node else None
    next_mons = [
        summary
        for child in (node.get("evolves_to") or [])
        if (summary := to_summary(child["species"]["name"]))
    ]
    return {"previous": previous, "next": next_mons}


def get_evolution_tree(pokemon_slug: str) -> dict | None:
    pokemon = get_dataset("pokemon")
    entry = pokemon.get(pokemon_slug)
    if not entry:
        return None

    chain = get_dataset("evolution_chains").get(entry["evolution_chain_id"])
    if not chain:
        return None

    def build(node, trigger=None):
        species_name = node["species"]["name"]
        species_pokemon = pokemon.get(species_name)
        return {
            "name": species_name,
            "trigger": trigger,
            "id": species_pokemon["id"] if species_pokemon else None,
            "sprite": species_pokemon["sprite"] if species_pokemon else None,
            "types": species_pokemon["types"] if species_pokemon else [],
            "base_stat_total": species_pokemon["base_stat_total"] if species_pokemon else None,
            "children": [
                build(child, _trigger_info((child.get("evolution_details") or [None])[0]))
                for child in (node.get("evolves_to") or [])
            ],
        }

    return build(chain["chain"])


def _trigger_info(detail: dict | None) -> dict | None:
    """Label shown on the connector arrow between evolution stages. Item-triggered
    evolutions (used or held) also carry the item's slug so the frontend can link
    straight to that item's entry on the Evolution Items page."""
    if not detail:
        return None
    item = detail.get("item")
    held_item = detail.get("held_item")
    if item:
        return {"label": item["name"].replace("-", " "), "item_slug": item["name"]}
    if held_item:
        return {"label": f'holding {held_item["name"].replace("-", " ")}', "item_slug": held_item["name"]}
    if detail.get("min_level"):
        return {"label": f"Lv.{detail['min_level']}", "item_slug": None}
    if detail.get("min_happiness"):
        return {"label": "friendship", "item_slug": None}
    trigger = detail.get("trigger")
    return {"label": trigger["name"].replace("-", " "), "item_slug": None} if trigger else None
