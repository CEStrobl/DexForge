"""Lazy, per-fusion scrape-and-cache of community fusion sprite art.

Unlike the PokeAPI scraper (a one-time bulk pull), this is scraped on first
request for a given head+body pair and cached to disk indefinitely — the
fusable-pair space is far too large to pre-scrape, and the overwhelming
majority of combinations have no submitted art at all.

Source: infinitefusiondex.com. Its fusion detail pages (`/details/{head}.{body}`)
embed a Next.js `__NEXT_DATA__` JSON blob with, per orientation, an `alts` list of
sprite variants (a lettered `extension` + contributing artist). Sprites themselves
live on a predictable CDN URL keyed by `{head}.{body}{extension}.png`. There's no
documented API, so this is intentionally minimal (one regex extraction, no HTML
parsing) rather than a full scraping framework — the JSON blob is the actual data
source, the surrounding HTML is irrelevant.
"""

import json
import re
from functools import lru_cache

import requests

from app.core.config import DATA_CACHE_DIR
from app.data_access.cache_reader import get_dataset
from app.services.variants import resolve_canonical

FUSION_SPRITE_CACHE_DIR = DATA_CACHE_DIR / "fusion_sprites"

_DETAILS_URL = "https://infinitefusiondex.com/details/{pair}"
_POKEDEX_URL = "https://infinitefusiondex.com/pokedex"
_SPRITE_CDN_URL = "https://ifd-spaces.sfo2.cdn.digitaloceanspaces.com/custom/{variant_id}.png"
_NEXT_DATA_RE = re.compile(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.DOTALL)
_IF_DEX_MAP_PATH = FUSION_SPRITE_CACHE_DIR / "_if_dex_map.json"

_session = requests.Session()
_session.headers.update({"User-Agent": "Mozilla/5.0 (compatible; DexForge/1.0; personal-use)"})


@lru_cache(maxsize=1)
def _if_dex_map() -> dict[int, int]:
    """National dex id -> infinitefusiondex.com's own in-game dex id.

    The site's `/details/{pair}` and CDN sprite URLs are keyed on its own dex
    numbering (`real_id`), not the National dex — the fan game the site is built
    around omits some species, so everything from Hoenn onward is shifted (e.g.
    Gardevoir is National #282 but the site's #287). Fetched once from the site's
    `/pokedex` listing (same `__NEXT_DATA__` blob as the per-fusion detail pages)
    and cached to disk indefinitely — it's a small, effectively-static reference
    table, not part of the per-fusion lazy-scrape space.
    """
    if _IF_DEX_MAP_PATH.exists():
        with _IF_DEX_MAP_PATH.open(encoding="utf-8") as f:
            return {int(k): v for k, v in json.load(f).items()}

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

    _IF_DEX_MAP_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _IF_DEX_MAP_PATH.open("w", encoding="utf-8") as f:
        json.dump(dex_map, f, indent=2)
    return dex_map


def _dex_id(slug: str) -> int | None:
    entry = get_dataset("pokemon").get(resolve_canonical(slug))
    if not entry:
        return None
    return _if_dex_map().get(entry["id"])


def _manifest_path(head_id: int, body_id: int):
    return FUSION_SPRITE_CACHE_DIR / f"{head_id}.{body_id}" / "manifest.json"


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


def _download_sprite(variant_id: str, dest_dir) -> bool:
    try:
        response = _session.get(_SPRITE_CDN_URL.format(variant_id=variant_id), timeout=15)
    except requests.RequestException:
        # Drop just this one variant rather than failing the whole request — a
        # transient CDN hiccup on one image shouldn't take down the others.
        return False
    if response.status_code != 200:
        return False
    dest_dir.mkdir(parents=True, exist_ok=True)
    (dest_dir / f"{variant_id}.png").write_bytes(response.content)
    return True


def get_fusion_art(head_slug: str, body_slug: str) -> dict:
    try:
        head_id = _dex_id(head_slug)
        body_id = _dex_id(body_slug)
    except (requests.RequestException, ValueError):
        # Transient failure fetching/parsing the dex id map on first-ever call —
        # don't cache, so the next request retries instead of treating every
        # fusion as permanently art-less.
        return {"variants": []}
    if head_id is None or body_id is None:
        return {"variants": []}

    manifest_path = _manifest_path(head_id, body_id)
    if manifest_path.exists():
        with manifest_path.open(encoding="utf-8") as f:
            return json.load(f)

    pair = f"{head_id}.{body_id}"
    try:
        variants = _scrape_variants(pair)
    except (requests.RequestException, ValueError):
        # Transient failure (site down, bad response) — don't cache, so the next
        # request retries instead of permanently treating this as "no art".
        return {"variants": []}

    dest_dir = manifest_path.parent
    downloaded = []
    for variant in variants:
        if _download_sprite(variant["id"], dest_dir):
            downloaded.append(
                {
                    "id": variant["id"],
                    "artist": variant["artist"],
                    "image_path": f"/static/fusion-sprites/{pair}/{variant['id']}.png",
                }
            )

    manifest = {"variants": downloaded}
    dest_dir.mkdir(parents=True, exist_ok=True)
    with manifest_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    return manifest
