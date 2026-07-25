from fastapi import APIRouter

from app.services.evolution_items import get_evolution_items_index

router = APIRouter(prefix="/api/evolution-items", tags=["evolution-items"])


@router.get("")
def list_evolution_items():
    return get_evolution_items_index()
