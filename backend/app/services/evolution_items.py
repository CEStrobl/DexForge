from collections import defaultdict

from app.data_access.cache_reader import get_dataset


def _walk_chain(node, by_item):
    for detail in node.get("evolution_details") or []:
        item = detail.get("item")
        species = node["species"]["name"]
        if item and species not in by_item[item["name"]]:
            by_item[item["name"]].append(species)
    for child in node.get("evolves_to") or []:
        _walk_chain(child, by_item)


def get_evolution_items_index() -> dict[str, list[str]]:
    chains = get_dataset("evolution_chains")
    by_item = defaultdict(list)
    for chain in chains.values() if isinstance(chains, dict) else chains:
        _walk_chain(chain["chain"], by_item)
    return dict(by_item)
