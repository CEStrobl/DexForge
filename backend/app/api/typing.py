from fastapi import APIRouter, Query

from app.services.typing import get_all_type_profiles, get_effectiveness

router = APIRouter(prefix="/api/typing", tags=["typing"])


@router.get("")
def get_typing(type: list[str] = Query(...)):
    return get_effectiveness(type)


@router.get("/profiles")
def get_typing_profiles():
    return get_all_type_profiles()
