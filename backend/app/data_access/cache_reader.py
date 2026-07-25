import json
from functools import lru_cache

from app.core.config import DATA_CACHE_DIR

CACHE_FILES = {
    "pokemon": "pokemon.json",
    "species": "species.json",
    "evolution_chains": "evolution_chains.json",
    "types": "types.json",
    "natures": "natures.json",
    "items": "items.json",
    "abilities": "abilities.json",
}


@lru_cache(maxsize=1)
def _load_all():
    """Load every data/cache/*.json file into memory once per process.

    Files that don't exist yet (before scraper/pokeapi/fetch_all.py has been
    run) resolve to an empty dict/list rather than raising, so the API can
    boot before the cache is populated.
    """
    loaded = {}
    for key, filename in CACHE_FILES.items():
        path = DATA_CACHE_DIR / filename
        if path.exists():
            with path.open(encoding="utf-8") as f:
                loaded[key] = json.load(f)
        else:
            loaded[key] = {}
    return loaded


def get_dataset(name: str):
    if name not in CACHE_FILES:
        raise KeyError(f"Unknown dataset: {name}")
    return _load_all()[name]
