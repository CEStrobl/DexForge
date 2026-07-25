from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import evolution_items, lists, natures, pokemon, typing
from app.core.config import CORS_ORIGINS
from app.db.session import Base, engine
from app.models import list_models  # noqa: F401 (registers models on Base)

Base.metadata.create_all(bind=engine)

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


@app.get("/api/health")
def health():
    return {"status": "ok"}
