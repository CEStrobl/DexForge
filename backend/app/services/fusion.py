"""Pokémon Infinite Fusion's head/body fusion math.

Verified against the community wiki/FAQ (no live scrape — this is fixed game logic, not
per-Pokémon data, so it's encoded directly rather than cached as JSON):
- Stats: a weighted average per stat. HP/Sp.Atk/Sp.Def lean 2/3 toward the head, 1/3 toward
  the body. Attack/Defense/Speed lean 2/3 toward the body, 1/3 toward the head.
- Typing: primary type from the head, secondary type from the body — using the body's
  primary type instead if the body has no secondary, or if its secondary would duplicate
  the head's primary (so two same-primary-type Pokémon fusing don't end up double-typed).
- Abilities: not a formula — in-game this is a player choice between the head's and body's
  own (non-hidden) abilities, with hidden abilities selectable later via a rarer item. This
  returns the full candidate pool per side rather than picking one for them.
"""

from app.data_access.cache_reader import get_dataset
from app.services.typing import get_effectiveness
from app.services.variants import resolve_canonical

HEAD_DOMINANT_STATS = ["hp", "special-attack", "special-defense"]
BODY_DOMINANT_STATS = ["attack", "defense", "speed"]


def _fused_stat(head_value: int, body_value: int, *, head_dominant: bool) -> int:
    dominant, recessive = (head_value, body_value) if head_dominant else (body_value, head_value)
    return round((2 / 3) * dominant + (1 / 3) * recessive)


def _fused_types(head_types: list[str], body_types: list[str]) -> list[str]:
    primary = head_types[0]
    candidate = body_types[1] if len(body_types) > 1 else body_types[0]
    if candidate == primary:
        candidate = body_types[0]
    return [primary] if candidate == primary else [primary, candidate]


def _ability_pool(entry: dict) -> dict:
    return {
        "regular": [a["name"] for a in entry["abilities"] if not a["is_hidden"]],
        "hidden": [a["name"] for a in entry["abilities"] if a["is_hidden"]],
    }


def compute_fusion(head_slug: str, body_slug: str) -> dict | None:
    pokemon = get_dataset("pokemon")
    head = pokemon.get(resolve_canonical(head_slug))
    body = pokemon.get(resolve_canonical(body_slug))
    if not head or not body:
        return None

    stats = {}
    for stat in HEAD_DOMINANT_STATS:
        stats[stat] = _fused_stat(head["stats"][stat], body["stats"][stat], head_dominant=True)
    for stat in BODY_DOMINANT_STATS:
        stats[stat] = _fused_stat(head["stats"][stat], body["stats"][stat], head_dominant=False)

    types = _fused_types(head["types"], body["types"])

    return {
        "name": f"{head['name']}/{body['name']}",
        "head": {"name": head["name"], "id": head["id"], "sprite": head["sprite"]},
        "body": {"name": body["name"], "id": body["id"], "sprite": body["sprite"]},
        "types": types,
        "stats": stats,
        "base_stat_total": sum(stats.values()),
        "type_effectiveness": get_effectiveness(types),
        "abilities": {
            "head": _ability_pool(head),
            "body": _ability_pool(body),
        },
    }
