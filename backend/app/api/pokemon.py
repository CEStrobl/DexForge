from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.data_access.cache_reader import get_dataset
from app.services.evolution import get_evolution_family, get_evolution_tree
from app.services.pokemon_summary import enrich
from app.services.typing import get_effectiveness

router = APIRouter(prefix="/api/pokemon", tags=["pokemon"])


class BulkPokemonRequest(BaseModel):
    slugs: list[str]


@router.get("")
def list_pokemon(q: str | None = None, limit: int = 30):
    pokemon = get_dataset("pokemon")
    species = get_dataset("species")
    names = list(pokemon.keys())
    if q:
        q_lower = q.lower()
        names = [n for n in names if q_lower in n]
    names = names[:limit]
    return [enrich(pokemon[n], species) for n in names]


@router.post("/bulk")
def bulk_pokemon(payload: BulkPokemonRequest):
    pokemon = get_dataset("pokemon")
    species = get_dataset("species")
    return [enrich(pokemon[slug], species) for slug in payload.slugs if slug in pokemon]


@router.get("/abilities")
def list_abilities():
    abilities = get_dataset("abilities")
    return sorted(abilities.keys())


@router.get("/{slug}/evolution-family")
def get_pokemon_evolution_family(slug: str):
    family = get_evolution_family(slug)
    if not family:
        raise HTTPException(status_code=404, detail=f"Pokemon '{slug}' not found")
    return family


@router.get("/{slug}")
def get_pokemon(slug: str):
    pokemon = get_dataset("pokemon")
    entry = pokemon.get(slug) if isinstance(pokemon, dict) else None
    if not entry:
        raise HTTPException(status_code=404, detail=f"Pokemon '{slug}' not found")

    species = get_dataset("species").get(slug, {})
    abilities_data = get_dataset("abilities")
    enriched_abilities = [
        {**a, "description": abilities_data.get(a["name"], {}).get("description", "")}
        for a in entry["abilities"]
    ]
    return {
        **entry,
        "abilities": enriched_abilities,
        "species": species,
        "type_effectiveness": get_effectiveness(entry["types"]),
        "evolution_chain": get_evolution_tree(slug),
        "neighbors": _get_neighbors(pokemon, entry),
    }


def _get_neighbors(pokemon: dict, entry: dict):
    ordered = sorted(pokemon.values(), key=lambda p: p["id"])
    idx = next(i for i, p in enumerate(ordered) if p["name"] == entry["name"])
    prev_mon = ordered[idx - 1] if idx > 0 else None
    next_mon = ordered[idx + 1] if idx < len(ordered) - 1 else None
    return {
        "prev": {"id": prev_mon["id"], "name": prev_mon["name"]} if prev_mon else None,
        "next": {"id": next_mon["id"], "name": next_mon["name"]} if next_mon else None,
    }
