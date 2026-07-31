from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import evolution_items, fusion, fusion_lists, home, lists, natures, pokemon, typing
from app.core.config import CORS_ORIGINS
from app.db.session import Base, engine, migrate_schema
from app.models import list_models  # noqa: F401 (registers models on Base)

Base.metadata.create_all(bind=engine)
migrate_schema()

app = FastAPI(title="DexForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pokemon.router)
app.include_router(typing.router)
app.include_router(natures.router)
app.include_router(evolution_items.router)
app.include_router(lists.router)
app.include_router(fusion.router)
app.include_router(fusion_lists.router)
app.include_router(home.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
