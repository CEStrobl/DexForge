"""Lazy, per-fusion scrape-and-cache of community fusion sprite art.

Unlike the PokeAPI scraper (a one-time bulk pull), this is scraped on first
request for a given head+body pair and cached indefinitely — the fusable-pair
space is far too large to pre-scrape, and the overwhelming majority of
combinations have no submitted art at all.

Source: infinitefusiondex.com. Its fusion detail pages (`/details/{head}.{body}`)
embed a Next.js `__NEXT_DATA__` JSON blob with, per orientation, an `alts` list of
sprite variants (a lettered `extension` + contributing artist). Sprites themselves
live on a predictable CDN URL keyed by `{head}.{body}{extension}.png`. There's no
documented API, so this is intentionally minimal (one regex extraction, no HTML
parsing) rather than a full scraping framework — the JSON blob is the actual data
source, the surrounding HTML is irrelevant.

Caching has two modes, chosen by whether SUPABASE_SERVICE_ROLE_KEY is configured:
- **Local disk** (dev default): sprites + manifests under FUSION_SPRITE_CACHE_DIR,
  served via main.py's /static/fusion-sprites mount. Vercel's function filesystem
  is read-only outside /tmp and doesn't persist across cold starts anyway, so this
  mode only makes sense for local development.
- **Supabase Storage** (production): sprites upload to a public bucket and are
  served from its URL; manifests (which variants exist for a pair, so a re-request
  doesn't re-scrape) live in the `fusion_art_manifests` table instead of on disk.
"""

import json
import re

import requests
from sqlalchemy.orm import Session

from app.core.config import DATA_CACHE_DIR, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
from app.data_access.cache_reader import get_dataset
from app.models.fusion_art_models import FusionArtManifest
from app.services.variants import resolve_canonical

FUSION_SPRITE_CACHE_DIR = DATA_CACHE_DIR / "fusion_sprites"
STORAGE_BUCKET = "fusion-sprites"

_DETAILS_URL = "https://infinitefusiondex.com/details/{pair}"
_POKEDEX_URL = "https://infinitefusiondex.com/pokedex"
_SPRITE_CDN_URL = "https://ifd-spaces.sfo2.cdn.digitaloceanspaces.com/custom/{variant_id}.png"
_NEXT_DATA_RE = re.compile(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.DOTALL)
_IF_DEX_MAP_PATH = FUSION_SPRITE_CACHE_DIR / "_if_dex_map.json"
_IF_DEX_MAP_KEY = "_if_dex_map"  # sentinel `pair` value in fusion_art_manifests

_session = requests.Session()
_session.headers.update({"User-Agent": "Mozilla/5.0 (compatible; DexForge/1.0; personal-use)"})


def _using_storage() -> bool:
    return bool(SUPABASE_SERVICE_ROLE_KEY)


def _get_manifest(db: Session | None, pair: str) -> dict | None:
    if _using_storage():
        row = db.get(FusionArtManifest, pair)
        return row.variants if row else None
    path = FUSION_SPRITE_CACHE_DIR / pair / "manifest.json"
    if path.exists():
        with path.open(encoding="utf-8") as f:
            return json.load(f)
    return None


def _save_manifest(db: Session | None, pair: str, payload: dict) -> None:
    if _using_storage():
        db.merge(FusionArtManifest(pair=pair, variants=payload))
        db.commit()
        return
    dest_dir = FUSION_SPRITE_CACHE_DIR / pair
    dest_dir.mkdir(parents=True, exist_ok=True)
    with (dest_dir / "manifest.json").open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)


_dex_map_cache: dict[int, int] | None = None


def _if_dex_map(db: Session | None) -> dict[int, int]:
    """National dex id -> infinitefusiondex.com's own in-game dex id.

    The site's `/details/{pair}` and CDN sprite URLs are keyed on its own dex
    numbering (`real_id`), not the National dex — the fan game the site is built
    around omits some species, so everything from Hoenn onward is shifted (e.g.
    Gardevoir is National #282 but the site's #287). Fetched once per warm process
    (module-level memo below) and persisted (disk or DB, per `_using_storage()`) so
    a cold process doesn't have to re-scrape it either.
    """
    global _dex_map_cache
    if _dex_map_cache is not None:
        return _dex_map_cache

    cached = _get_manifest(db, _IF_DEX_MAP_KEY)
    if cached is not None:
        _dex_map_cache = {int(k): v for k, v in cached.items()}
        return _dex_map_cache

    response = _session.get(_POKEDEX_URL, timeout=15)
    response.raise_for_status()
    match = _NEXT_DATA_RE.search(response.text)
    next_data = json.loads(match.group(1)) if match else {}
    page_props = (next_data.get("props") or {}).get("pageProps") or {}
    entries = page_props.get("pokemon") or []

    dex_map = {}
    for entry in entries:
        nat_id = entry.get("nat_id")
        real_id = entry.get("real_id")
        if nat_id is not None and real_id is not None:
            dex_map[int(nat_id)] = int(real_id)

    _save_manifest(db, _IF_DEX_MAP_KEY, dex_map)
    _dex_map_cache = dex_map
    return dex_map


def _dex_id(slug: str, db: Session | None) -> int | None:
    entry = get_dataset("pokemon").get(resolve_canonical(slug))
    if not entry:
        return None
    return _if_dex_map(db).get(entry["id"])


def _scrape_variants(pair: str) -> list[dict]:
    response = _session.get(_DETAILS_URL.format(pair=pair), timeout=15)
    if response.status_code == 404:
        return []
    response.raise_for_status()

    match = _NEXT_DATA_RE.search(response.text)
    if not match:
        return []
    next_data = json.loads(match.group(1))
    page_props = (next_data.get("props") or {}).get("pageProps") or {}
    pokemon_entries = page_props.get("pokemon") or []
    entry = next((e for e in pokemon_entries if e.get("real_id") == pair), None)
    if not entry:
        return []

    variants = []
    for alt in entry.get("alts") or []:
        extension = alt.get("extension") or ""
        contributors = alt.get("contributors") or []
        artist = contributors[0]["contributor"] if contributors else alt.get("real_contributor_name")
        variants.append({"id": f"{pair}{extension}", "artist": artist})
    return variants


def _fetch_sprite_bytes(variant_id: str) -> bytes | None:
    try:
        response = _session.get(_SPRITE_CDN_URL.format(variant_id=variant_id), timeout=15)
    except requests.RequestException:
        # Drop just this one variant rather than failing the whole request — a
        # transient CDN hiccup on one image shouldn't take down the others.
        return None
    if response.status_code != 200:
        return None
    return response.content


def _store_sprite(pair: str, variant_id: str, content: bytes) -> str | None:
    """Persists a downloaded sprite and returns the URL to serve it from, or None
    on failure (caller drops that variant rather than failing the whole request)."""
    if _using_storage():
        object_path = f"{pair}/{variant_id}.png"
        try:
            response = requests.post(
                f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{object_path}",
                headers={
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "image/png",
                    "x-upsert": "true",
                },
                data=content,
                timeout=15,
            )
        except requests.RequestException:
            return None
        if response.status_code not in (200, 201):
            return None
        return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{object_path}"

    dest_dir = FUSION_SPRITE_CACHE_DIR / pair
    dest_dir.mkdir(parents=True, exist_ok=True)
    (dest_dir / f"{variant_id}.png").write_bytes(content)
    return f"/static/fusion-sprites/{pair}/{variant_id}.png"


def get_fusion_art(head_slug: str, body_slug: str, db: Session | None = None) -> dict:
    try:
        head_id = _dex_id(head_slug, db)
        body_id = _dex_id(body_slug, db)
    except (requests.RequestException, ValueError):
        # Transient failure fetching/parsing the dex id map on first-ever call —
        # don't cache, so the next request retries instead of treating every
        # fusion as permanently art-less.
        return {"variants": []}
    if head_id is None or body_id is None:
        return {"variants": []}

    pair = f"{head_id}.{body_id}"
    cached = _get_manifest(db, pair)
    if cached is not None:
        return cached

    try:
        variants = _scrape_variants(pair)
    except (requests.RequestException, ValueError):
        # Transient failure (site down, bad response) — don't cache, so the next
        # request retries instead of permanently treating this as "no art".
        return {"variants": []}

    downloaded = []
    for variant in variants:
        content = _fetch_sprite_bytes(variant["id"])
        if content is None:
            continue
        image_path = _store_sprite(pair, variant["id"], content)
        if image_path is None:
            continue
        downloaded.append(
            {"id": variant["id"], "artist": variant["artist"], "image_path": image_path}
        )

    manifest = {"variants": downloaded}
    _save_manifest(db, pair, manifest)
    return manifest
