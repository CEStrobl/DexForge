from fastapi import APIRouter, Query

from app.services.typing import get_effectiveness

router = APIRouter(prefix="/api/typing", tags=["typing"])


@router.get("")
def get_typing(type: list[str] = Query(...)):
    return get_effectiveness(type)
