from app.data_access.cache_reader import get_dataset
from app.services.list_criteria import NUMERIC_FIELDS, STAT_FIELD_MAP
from app.services.pokemon_summary import enrich
from app.services.variants import is_canonical

# Every field Advanced Search can build a rule on, and how to pull its value(s) off an
# enriched mon dict. Multi-value fields always return a list (even single-natured ones
# like generation) so "is"/"is not" can do set-equality and "has any/none of" can do
# set-intersection with the same code path.
_MOVESETS = get_dataset("movesets")

CATEGORICAL_MULTI_FIELDS = {
    "types": lambda mon: mon.get("types", []),
    "weak_to": lambda mon: [t for t, mult in mon["type_effectiveness"].items() if mult > 1],
    "generations": lambda mon: [mon["generation"]] if mon.get("generation") else [],
    "egg_groups": lambda mon: mon.get("egg_groups", []),
    "abilities": lambda mon: [a["name"] for a in mon.get("abilities", [])],
    "ev_yield_stats": lambda mon: [e["stat"] for e in mon.get("ev_yield", [])],
    # "moves" is handled separately below (_moves_accessor) — its value carries an optional
    # learn `method` alongside the move list, so it can't share this dict's plain-list shape.
}

MOVE_METHODS = {"level-up", "machine", "egg", "tutor"}


def _moves_accessor(method: str | None):
    """movesets.json is keyed by exact variant slug, not merged onto the enriched mon dict
    (unlike abilities/egg_groups/etc., which live directly on `mon`) — pulled in as its own
    module-level dataset and joined here by mon["name"]. `method`, when given, narrows to
    moves learnable via that specific method (level-up/machine/egg/tutor) rather than any."""

    def accessor(mon: dict):
        entries = _MOVESETS.get(mon["name"], [])
        if method:
            entries = [e for e in entries if e.get("method") == method]
        return [e["move"] for e in entries]

    return accessor

CATEGORICAL_SINGLE_FIELDS = {
    "growth_rate": lambda mon: mon.get("growth_rate"),
}

BOOLEAN_FIELDS = {
    "is_legendary": lambda mon: bool(mon.get("is_legendary")),
    "is_mythical": lambda mon: bool(mon.get("is_mythical")),
}


def _numeric_accessor(field: str):
    if field in STAT_FIELD_MAP:
        stats_key = STAT_FIELD_MAP[field]
        return lambda mon: mon["stats"].get(stats_key)
    return lambda mon: mon.get(field)


NUMERIC_FIELDS_ACCESSORS = {f: _numeric_accessor(f) for f in [*STAT_FIELD_MAP, *NUMERIC_FIELDS]}


def _eval_categorical_multi(accessor, operator: str, value, mon: dict) -> bool:
    mon_values = set(accessor(mon))
    values = set(value or [])
    if operator == "is":
        return mon_values == values
    if operator == "is_not":
        return mon_values != values
    if operator == "has_any_of":
        return bool(mon_values & values)
    if operator == "has_none_of":
        return not (mon_values & values)
    return False


def _eval_categorical_single(accessor, operator: str, value, mon: dict) -> bool:
    mon_value = accessor(mon)
    if operator == "is":
        return mon_value == value
    if operator == "is_not":
        return mon_value != value
    return False


def _eval_boolean(accessor, operator: str, value, mon: dict) -> bool:
    return accessor(mon) == bool(value)


def _eval_numeric(accessor, operator: str, value, mon: dict) -> bool:
    mon_value = accessor(mon)
    if mon_value is None:
        return False
    if operator == "between":
        if isinstance(value, dict):
            lo, hi = value.get("min"), value.get("max")
        elif isinstance(value, (list, tuple)):
            lo, hi = (value + [None, None])[:2]
        else:
            lo = hi = None
        if lo not in (None, "") and mon_value < lo:
            return False
        if hi not in (None, "") and mon_value > hi:
            return False
        return True
    if value is None or value == "":
        return False
    if operator == "is":
        return mon_value == value
    if operator == "is_not":
        return mon_value != value
    if operator == "greater_than":
        return mon_value > value
    if operator == "less_than":
        return mon_value < value
    return False


def _evaluate_rule(mon: dict, rule: dict) -> bool:
    field = rule.get("field")
    operator = rule.get("operator")
    value = rule.get("value")

    if field == "moves":
        value = value or {}
        moves = value.get("moves") or []
        method = value.get("method") or None
        return _eval_categorical_multi(_moves_accessor(method), operator, moves, mon)
    if field in CATEGORICAL_MULTI_FIELDS:
        return _eval_categorical_multi(CATEGORICAL_MULTI_FIELDS[field], operator, value, mon)
    if field in CATEGORICAL_SINGLE_FIELDS:
        return _eval_categorical_single(CATEGORICAL_SINGLE_FIELDS[field], operator, value, mon)
    if field in BOOLEAN_FIELDS:
        return _eval_boolean(BOOLEAN_FIELDS[field], operator, value, mon)
    if field in NUMERIC_FIELDS_ACCESSORS:
        return _eval_numeric(NUMERIC_FIELDS_ACCESSORS[field], operator, value, mon)
    return False


def run_advanced_search(rules: list[dict]) -> list[dict]:
    pokemon = get_dataset("pokemon")
    species = get_dataset("species")
    entries = [p for p in pokemon.values() if is_canonical(p["name"])] if isinstance(pokemon, dict) else pokemon

    def matches(mon: dict) -> bool:
        if not rules:
            return True
        result = _evaluate_rule(mon, rules[0])
        for prev_rule, rule in zip(rules, rules[1:]):
            outcome = _evaluate_rule(mon, rule)
            join = (prev_rule.get("join") or "and").lower()
            result = (result and outcome) if join == "and" else (result or outcome)
        return result

    enriched = (enrich(e, species) for e in entries)
    return [mon for mon in enriched if matches(mon)]
