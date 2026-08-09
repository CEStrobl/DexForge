from fastapi import APIRouter

from app.services.moves import get_move_pool

router = APIRouter(prefix="/api/pokemon", tags=["moves"])


@router.get("/{slug}/moves")
def get_pokemon_moves(slug: str):
    return get_move_pool(slug)
