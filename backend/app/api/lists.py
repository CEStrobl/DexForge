from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.list_models import SavedList, SavedListEntry
from app.schemas.list_schemas import ListCriteria, SavedListCreate, SavedListOut, SavedListUpdate
from app.services.list_criteria import filter_pokemon

router = APIRouter(prefix="/api/lists", tags=["lists"])


def _check_name_available(db: Session, name: str, exclude_id: int | None = None):
    query = db.query(SavedList).filter(SavedList.name == name)
    if exclude_id is not None:
        query = query.filter(SavedList.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=400, detail=f'A list named "{name}" already exists.')


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


def _build_entries(entries: list) -> list[SavedListEntry]:
    return [
        SavedListEntry(pokemon_slug=e.slug, position=i, label_ids=e.label_ids)
        for i, e in enumerate(entries)
    ]


@router.post("", response_model=SavedListOut)
def create_list(payload: SavedListCreate, db: Session = Depends(get_db)):
    _check_name_available(db, payload.name)
    saved_list = SavedList(
        name=payload.name,
        criteria=payload.criteria,
        visible_columns=payload.visible_columns,
        column_widths=payload.column_widths,
        labels=[label.model_dump() for label in payload.labels],
        updated_at=datetime.utcnow(),
    )
    saved_list.entries = _build_entries(payload.entries)
    db.add(saved_list)
    db.commit()
    db.refresh(saved_list)
    return saved_list


@router.put("/{list_id}", response_model=SavedListOut)
def update_list(list_id: int, payload: SavedListUpdate, db: Session = Depends(get_db)):
    saved_list = db.get(SavedList, list_id)
    if not saved_list:
        raise HTTPException(status_code=404, detail="List not found")
    _check_name_available(db, payload.name, exclude_id=list_id)
    saved_list.name = payload.name
    saved_list.criteria = payload.criteria
    saved_list.visible_columns = payload.visible_columns
    saved_list.column_widths = payload.column_widths
    saved_list.labels = [label.model_dump() for label in payload.labels]
    saved_list.updated_at = datetime.utcnow()
    saved_list.entries = _build_entries(payload.entries)
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
