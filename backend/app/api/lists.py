from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.list_models import SavedList, SavedListEntry
from app.schemas.list_schemas import ListCriteria, SavedListCreate, SavedListOut, SavedListUpdate
from app.services.list_criteria import filter_pokemon

router = APIRouter(prefix="/api/lists", tags=["lists"])


@router.get("", response_model=list[SavedListOut])
def get_lists(db: Session = Depends(get_db)):
    return db.query(SavedList).all()


@router.post("/preview")
def preview_criteria(criteria: ListCriteria):
    return filter_pokemon(criteria.model_dump(exclude_none=True))


@router.get("/{list_id}", response_model=SavedListOut)
def get_list(list_id: int, db: Session = Depends(get_db)):
    saved_list = db.get(SavedList, list_id)
    if not saved_list:
        raise HTTPException(status_code=404, detail="List not found")
    return saved_list


@router.post("", response_model=SavedListOut)
def create_list(payload: SavedListCreate, db: Session = Depends(get_db)):
    saved_list = SavedList(
        name=payload.name,
        criteria=payload.criteria,
        visible_columns=payload.visible_columns,
    )
    saved_list.entries = [
        SavedListEntry(pokemon_slug=slug, position=i)
        for i, slug in enumerate(payload.pokemon_slugs)
    ]
    db.add(saved_list)
    db.commit()
    db.refresh(saved_list)
    return saved_list


@router.put("/{list_id}", response_model=SavedListOut)
def update_list(list_id: int, payload: SavedListUpdate, db: Session = Depends(get_db)):
    saved_list = db.get(SavedList, list_id)
    if not saved_list:
        raise HTTPException(status_code=404, detail="List not found")
    saved_list.name = payload.name
    saved_list.criteria = payload.criteria
    saved_list.visible_columns = payload.visible_columns
    saved_list.entries = [
        SavedListEntry(pokemon_slug=slug, position=i)
        for i, slug in enumerate(payload.pokemon_slugs)
    ]
    db.commit()
    db.refresh(saved_list)
    return saved_list


@router.delete("/{list_id}")
def delete_list(list_id: int, db: Session = Depends(get_db)):
    saved_list = db.get(SavedList, list_id)
    if not saved_list:
        raise HTTPException(status_code=404, detail="List not found")
    db.delete(saved_list)
    db.commit()
    return {"ok": True}
