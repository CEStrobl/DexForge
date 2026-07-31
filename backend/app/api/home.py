from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.data_access.cache_reader import get_dataset
from app.db.session import get_db
from app.models.list_models import FusionListEntry, SavedList, SavedListEntry
from app.services.home import (
    get_evolution_item_fact,
    get_featured_pokemon,
    get_nature_of_day,
    get_trivia_fact,
    get_typing_fact,
)
from app.services.variants import is_canonical

router = APIRouter(prefix="/api/home", tags=["home"])


@router.get("/featured-pokemon")
def featured_pokemon():
    return get_featured_pokemon()


@router.get("/stats")
def home_stats(db: Session = Depends(get_db)):
    pokemon = get_dataset("pokemon")
    total_pokemon = sum(1 for n in pokemon if is_canonical(n))
    saved_entries_count = db.query(func.count(SavedListEntry.id)).scalar()
    fusion_entries_count = db.query(func.count(FusionListEntry.id)).scalar()
    return {
        "total_pokemon": total_pokemon,
        "saved_lists_count": db.query(func.count(SavedList.id)).scalar(),
        "fusion_list_entries_count": fusion_entries_count,
        "total_entries_combined": saved_entries_count + fusion_entries_count,
    }


@router.get("/typing-fact")
def typing_fact():
    return get_typing_fact()


@router.get("/nature-of-day")
def nature_of_day():
    return get_nature_of_day()


@router.get("/evolution-item-fact")
def evolution_item_fact():
    return get_evolution_item_fact()


@router.get("/trivia")
def trivia():
    return get_trivia_fact()
