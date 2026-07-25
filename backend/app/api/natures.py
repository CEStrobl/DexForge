from fastapi import APIRouter

from app.data_access.cache_reader import get_dataset

router = APIRouter(prefix="/api/natures", tags=["natures"])


@router.get("")
def list_natures():
    return get_dataset("natures")
