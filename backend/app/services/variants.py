from functools import lru_cache

from app.data_access.cache_reader import get_dataset


@lru_cache(maxsize=1)
def _build_variant_index():
    """Group every pokemon.json entry for a species under that species' single
    canonical dex entry, selectable via the "Change Form" variant dropdown.

    PokeAPI (and the scraper) gives every distinct form its own `pokemon` entry —
    regional forms, Mega/Gmax, battle/therian formes, cosmetic sizes/caps, Ash-
    Greninja, Zygarde's power-construct formes, etc. Every one of these that isn't
    a species' own default form carries a national dex id >= 10000 (PokeAPI's
    overflow numbering for "not actually a separate in-game Pokédex entry") — in
    this dataset no species has more than one member below that threshold, so
    grouping purely by species is already exactly "merge the >= 10000 entries
    into their real dex entry" with no special-casing needed.
    """
    pokemon = get_dataset("pokemon")

    by_species: dict[str, list[dict]] = {}
    for entry in pokemon.values():
        species_slug = entry.get("species_slug")
        if not species_slug:
            continue
        by_species.setdefault(species_slug, []).append(entry)

    canonical_of: dict[str, str] = {}
    variants_of: dict[str, list[dict]] = {}

    for members in by_species.values():
        if len(members) == 1:
            name = members[0]["name"]
            canonical_of[name] = name
            continue

        default = next((m for m in members if m.get("is_default")), None)
        canonical = default or min(members, key=lambda m: m["id"])
        for m in members:
            canonical_of[m["name"]] = canonical["name"]

        variants_of[canonical["name"]] = sorted(
            (
                {"slug": m["name"], "sprite": m["sprite"], "is_default": bool(m.get("is_default"))}
                for m in members
            ),
            key=lambda v: not v["is_default"],
        )

    return canonical_of, variants_of


def resolve_canonical(slug: str) -> str:
    canonical_of, _ = _build_variant_index()
    return canonical_of.get(slug, slug)


def get_variants(canonical_slug: str) -> list[dict]:
    _, variants_of = _build_variant_index()
    return variants_of.get(canonical_slug, [])


def is_canonical(slug: str) -> bool:
    canonical_of, _ = _build_variant_index()
    return canonical_of.get(slug, slug) == slug
