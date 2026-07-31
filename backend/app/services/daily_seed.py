from datetime import datetime, timezone


def day_seed() -> int:
    """A deterministic integer that changes once per UTC calendar day — used to pick a
    stable "today's pick" for the landing page's rotating content with no stored state."""
    return datetime.now(timezone.utc).date().toordinal()


def pick_for_today(items: list):
    """Deterministically picks one item from a list, stable for the whole UTC day.

    `items` should already be in a fixed, reproducible order (e.g. sorted) so the same
    index always lands on the same item across requests/process restarts.
    """
    if not items:
        return None
    return items[day_seed() % len(items)]
