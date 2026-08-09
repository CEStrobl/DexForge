from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import evolution_items, fusion, fusion_lists, home, lists, moves, natures, pokemon, quick_links, typing
from app.core.config import CORS_ORIGINS
from app.db.session import Base, engine, migrate_schema
from app.models import list_models  # noqa: F401 (registers models on Base)
from app.models import quick_link_models  # noqa: F401 (registers models on Base)
from app.services.fusion_art import FUSION_SPRITE_CACHE_DIR

Base.metadata.create_all(bind=engine)
migrate_schema()
FUSION_SPRITE_CACHE_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="DexForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.include_router(home.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
