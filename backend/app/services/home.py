from collections import Counter

from app.data_access.cache_reader import get_dataset
from app.services.daily_seed import pick_for_today
from app.services.pokemon_summary import enrich
from app.services.typing import ALL_TYPES, get_effectiveness
from app.services.variants import is_canonical
from app.services.evolution_items import get_evolution_items_index


def get_featured_pokemon() -> dict | None:
    """Today's spotlighted Pokémon — same pick all day, different tomorrow."""
    pokemon = get_dataset("pokemon")
    species = get_dataset("species")
    names = sorted(n for n in pokemon if is_canonical(n))
    slug = pick_for_today(names)
    if not slug:
        return None

    mon = enrich(pokemon[slug], species)
    four_x = sorted(t for t, m in mon["type_effectiveness"].items() if m >= 4)
    return {
        "name": mon["name"],
        "id": mon["id"],
        "sprite": mon["sprite"],
        "types": mon["types"],
        "base_stat_total": mon["base_stat_total"],
        "four_x_weakness": four_x[0] if four_x else None,
    }


def get_typing_fact() -> dict | None:
    """A dual-type combo with a notable (4x+ or immune) matchup, picked for today.

    Single types can't reach 4x on their own (at most one 2x weakness applies), so this
    is inherently a "when paired with" fact — matching the Notes/Landingpage.md example.
    """
    facts = []
    for i, type_a in enumerate(ALL_TYPES):
        for type_b in ALL_TYPES[i + 1 :]:
            effectiveness = get_effectiveness([type_a, type_b])
            for attacking_type, multiplier in effectiveness.items():
                if multiplier >= 4 or multiplier == 0:
                    facts.append(
                        {"types": [type_a, type_b], "attacking_type": attacking_type, "multiplier": multiplier}
                    )
    facts.sort(key=lambda f: (f["types"], f["attacking_type"]))
    return pick_for_today(facts)


def get_nature_of_day() -> dict | None:
    natures = get_dataset("natures")
    with_change = sorted(
        (n for n in natures.values() if n.get("increased_stat")),
        key=lambda n: n["name"],
    )
    return pick_for_today(with_change)


def get_evolution_item_fact() -> dict | None:
    items = get_evolution_items_index()
    candidates = sorted(
        (
            {"item": entry["item"], "from": evo["from"], "to": evo["to"]}
            for entry in items
            for evo in entry["evolutions"]
        ),
        key=lambda c: (c["item"], c["from"]),
    )
    return pick_for_today(candidates)


def get_trivia_fact() -> dict | None:
    """A small rotating "did you know" pulled from whatever's cheap to compute from the
    already-cached dex data — lowest-priority section per Notes/Landingpage.md, kept simple."""
    pokemon = get_dataset("pokemon")
    species = get_dataset("species")
    canonical = sorted(
        (enrich(p, species) for p in pokemon.values() if is_canonical(p["name"])),
        key=lambda m: m["name"],
    )
    if not canonical:
        return None

    highest_bst = max(canonical, key=lambda m: m["base_stat_total"])
    lowest_bst = min(canonical, key=lambda m: m["base_stat_total"])

    egg_group_counts = Counter(g for m in canonical for g in m.get("egg_groups", []))
    facts = [
        {"label": "Highest Base Stat Total", "name": highest_bst["name"], "sprite": highest_bst["sprite"], "value": highest_bst["base_stat_total"]},
        {"label": "Lowest Base Stat Total", "name": lowest_bst["name"], "sprite": lowest_bst["sprite"], "value": lowest_bst["base_stat_total"]},
    ]
    if egg_group_counts:
        rarest_group, count = min(egg_group_counts.items(), key=lambda kv: (kv[1], kv[0]))
        example = next(m for m in canonical if rarest_group in m.get("egg_groups", []))
        facts.append(
            {
                "label": f"Rarest Egg Group ({rarest_group.replace('-', ' ').title()})",
                "name": example["name"],
                "sprite": example["sprite"],
                "value": count,
            }
        )

    return pick_for_today(facts)
