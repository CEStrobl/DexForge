import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import (
    evolution_items,
    friends,
    fusion,
    fusion_lists,
    home,
    list_saves,
    lists,
    moves,
    natures,
    pokemon,
    profiles,
    quick_links,
    typing,
)
from app.core.config import CORS_ORIGINS, SUPABASE_SERVICE_ROLE_KEY
from app.db.session import Base, engine, migrate_schema
from app.models import fusion_art_models  # noqa: F401 (registers models on Base)
from app.models import list_models  # noqa: F401 (registers models on Base)
from app.models import profile_models  # noqa: F401 (registers models on Base)
from app.models import quick_link_models  # noqa: F401 (registers models on Base)
from app.models import social_models  # noqa: F401 (registers models on Base)
from app.services.fusion_art import FUSION_SPRITE_CACHE_DIR

# Both blocks below write to disk (SQLite file / local fusion-art cache dir). Locally
# that's fine; on Vercel, without DATABASE_URL/SUPABASE_SERVICE_ROLE_KEY configured yet,
# the fallback paths land on a read-only function filesystem and raise. Guarded so a
# broken/unconfigured DB or cache dir degrades those specific features at request time
# instead of crashing the whole app at import time and 500-ing every route, including
# the pure dex-cache ones that don't touch either.
try:
    Base.metadata.create_all(bind=engine)
    migrate_schema()
except Exception:
    logging.exception("DB initialization failed — DB-backed routes will error until DATABASE_URL is configured.")

if not SUPABASE_SERVICE_ROLE_KEY:
    try:
        FUSION_SPRITE_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    except OSError:
        logging.exception("Could not create local fusion-art cache dir — fusion art will error until configured.")

app = FastAPI(title="DexForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not SUPABASE_SERVICE_ROLE_KEY and FUSION_SPRITE_CACHE_DIR.is_dir():
    app.mount("/static/fusion-sprites", StaticFiles(directory=FUSION_SPRITE_CACHE_DIR), name="fusion-sprites")

app.include_router(pokemon.router)
app.include_router(moves.router)
app.include_router(typing.router)
app.include_router(natures.router)
app.include_router(evolution_items.router)
app.include_router(lists.router)
app.include_router(fusion.router)
app.include_router(fusion_lists.router)
app.include_router(quick_links.router)
app.include_router(list_saves.router)
app.include_router(profiles.router)
app.include_router(friends.router)
app.include_router(home.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
