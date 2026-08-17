from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.data_access.cache_reader import get_dataset
from app.services.evolution import get_evolution_family, get_evolution_tree
from app.services.pokemon_summary import enrich
from app.services.typing import get_effectiveness
from app.services.variants import get_variants, is_canonical, resolve_canonical

router = APIRouter(prefix="/api/pokemon", tags=["pokemon"])


class BulkPokemonRequest(BaseModel):
    slugs: list[str]


@router.get("")
def list_pokemon(q: str | None = None, limit: int = 30):
    pokemon = get_dataset("pokemon")
    species = get_dataset("species")
    names = [n for n in pokemon if is_canonical(n)]
    if q:
        q_lower = q.lower()
        names = [
            n
            for n in names
            if q_lower in n or any(q_lower in v["slug"] for v in get_variants(n))
        ]
    names = names[:limit]
    return [enrich(pokemon[n], species) for n in names]


@router.post("/bulk")
def bulk_pokemon(payload: BulkPokemonRequest):
    pokemon = get_dataset("pokemon")
    species = get_dataset("species")
    results = []
    for slug in payload.slugs:
        requested = pokemon.get(slug)
        if not requested:
            continue
        # Enrich the requested entry itself — not the canonical's — so a merged-in form
        # (Mega, regional, therian, ...) shows its own real stats/types/abilities rather
        # than silently substituting its species' base form's.
        enriched = enrich(requested, species)
        enriched["variants"] = get_variants(resolve_canonical(slug))
        enriched["selected_variant"] = slug
        results.append(enriched)
    return results


@router.get("/abilities")
def list_abilities():
    abilities = get_dataset("abilities")
    return sorted(abilities.keys())


@router.get("/moves")
def list_moves():
    moves = get_dataset("moves")
    return sorted(moves.keys())


@router.get("/{slug}/evolution-family")
def get_pokemon_evolution_family(slug: str):
    family = get_evolution_family(slug)
    if not family:
        raise HTTPException(status_code=404, detail=f"Pokemon '{slug}' not found")
    return family


@router.get("/{slug}/variants")
def get_pokemon_variants(slug: str):
    pokemon = get_dataset("pokemon")
    if slug not in pokemon:
        raise HTTPException(status_code=404, detail=f"Pokemon '{slug}' not found")
    return get_variants(resolve_canonical(slug))


@router.get("/{slug}")
def get_pokemon(slug: str):
    pokemon = get_dataset("pokemon")
    requested = pokemon.get(slug) if isinstance(pokemon, dict) else None
    if not requested:
        raise HTTPException(status_code=404, detail=f"Pokemon '{slug}' not found")

    # Species-level concepts (dex-order neighbors, evolution chain) stay tied to the
    # canonical/base entry; the Pokémon's own display data (stats/types/abilities/sprite)
    # comes from the requested entry itself, so a merged-in form (Mega, regional, therian,
    # ...) shows its own real data instead of silently substituting its base form's.
    canonical_slug = resolve_canonical(slug)
    canonical_entry = pokemon[canonical_slug]

    species = get_dataset("species").get(requested["name"], {})
    abilities_data = get_dataset("abilities")
    enriched_abilities = [
        {**a, "description": abilities_data.get(a["name"], {}).get("description", "")}
        for a in requested["abilities"]
    ]
    return {
        **requested,
        "abilities": enriched_abilities,
        "species": species,
        "type_effectiveness": get_effectiveness(requested["types"]),
        "evolution_chain": get_evolution_tree(canonical_slug),
        "neighbors": _get_neighbors(pokemon, canonical_entry),
        "variants": get_variants(canonical_slug),
        "selected_variant": slug,
    }


def _get_neighbors(pokemon: dict, entry: dict):
    ordered = sorted((p for p in pokemon.values() if is_canonical(p["name"])), key=lambda p: p["id"])
    idx = next(i for i, p in enumerate(ordered) if p["name"] == entry["name"])
    prev_mon = ordered[idx - 1] if idx > 0 else None
    next_mon = ordered[idx + 1] if idx < len(ordered) - 1 else None
    return {
        "prev": {"id": prev_mon["id"], "name": prev_mon["name"]} if prev_mon else None,
        "next": {"id": next_mon["id"], "name": next_mon["name"]} if next_mon else None,
    }
