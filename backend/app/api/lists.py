import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user_id, get_optional_user_id
from app.db.session import get_db
from app.models.list_models import SavedList, SavedListEntry
from app.models.profile_models import Profile
from app.schemas.list_schemas import (
    ListCriteria,
    SavedListCreate,
    SavedListOut,
    SavedListUpdate,
    VisibilityUpdate,
)
from app.services.list_criteria import filter_pokemon

router = APIRouter(prefix="/api/lists", tags=["lists"])


def _check_name_available(
    db: Session, user_id: str, name: str, exclude_id: int | None = None
):
    query = db.query(SavedList).filter(SavedList.user_id == user_id, SavedList.name == name)
    if exclude_id is not None:
        query = query.filter(SavedList.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=400, detail=f'A list named "{name}" already exists.')


def _next_available_name(db: Session, user_id: str, base_name: str) -> str:
    name = f"{base_name} (copy)"
    existing = {
        n for (n,) in db.query(SavedList.name).filter(SavedList.user_id == user_id).all()
    }
    if name not in existing:
        return name
    i = 2
    while f"{name} {i}" in existing:
        i += 1
    return f"{name} {i}"


def _attach_viewer_context(saved_list: SavedList, db: Session, viewer_user_id: str | None):
    """Sets transient (non-column) attributes SavedListOut reads: is_owner, and owner
    profile info — always attached so a shared-list view can show authorship even to the
    owner themselves viewing their own list."""
    saved_list.is_owner = viewer_user_id is not None and viewer_user_id == saved_list.user_id
    saved_list.owner = db.query(Profile).filter(Profile.id == saved_list.user_id).first()
    return saved_list


@router.get("", response_model=list[SavedListOut])
def get_lists(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return db.query(SavedList).filter(SavedList.user_id == user_id).all()


@router.post("/preview")
def preview_criteria(criteria: ListCriteria):
    return filter_pokemon(criteria.model_dump(exclude_none=True))


@router.get("/{list_id}", response_model=SavedListOut)
def get_list(
    list_id: int,
    db: Session = Depends(get_db),
    user_id: str | None = Depends(get_optional_user_id),
):
    saved_list = db.query(SavedList).filter(SavedList.id == list_id).first()
    if not saved_list or (saved_list.user_id != user_id and not saved_list.is_public):
        raise HTTPException(status_code=404, detail="List not found")
    return _attach_viewer_context(saved_list, db, user_id)


@router.patch("/{list_id}/visibility", response_model=SavedListOut)
def set_list_visibility(
    list_id: int,
    payload: VisibilityUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    saved_list = db.query(SavedList).filter(
        SavedList.id == list_id, SavedList.user_id == user_id
    ).first()
    if not saved_list:
        raise HTTPException(status_code=404, detail="List not found")
    saved_list.is_public = payload.is_public
    if payload.is_public and not saved_list.share_token:
        saved_list.share_token = str(uuid.uuid4())
    db.commit()
    db.refresh(saved_list)
    return _attach_viewer_context(saved_list, db, user_id)


@router.post("/{list_id}/copy", response_model=SavedListOut)
def copy_list(
    list_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    source = db.query(SavedList).filter(SavedList.id == list_id).first()
    if not source or (source.user_id != user_id and not source.is_public):
        raise HTTPException(status_code=404, detail="List not found")
    copy = SavedList(
        user_id=user_id,
        name=_next_available_name(db, user_id, source.name),
        criteria=source.criteria,
        visible_columns=source.visible_columns,
        column_widths=source.column_widths,
        labels=source.labels,
        updated_at=datetime.utcnow(),
    )
    copy.entries = [
        SavedListEntry(pokemon_slug=e.pokemon_slug, position=e.position, label_ids=e.label_ids)
        for e in source.entries
    ]
    db.add(copy)
    db.commit()
    db.refresh(copy)
    return _attach_viewer_context(copy, db, user_id)


def _build_entries(entries: list) -> list[SavedListEntry]:
    return [
        SavedListEntry(pokemon_slug=e.slug, position=i, label_ids=e.label_ids)
        for i, e in enumerate(entries)
    ]


@router.post("", response_model=SavedListOut)
def create_list(
    payload: SavedListCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    _check_name_available(db, user_id, payload.name)
    saved_list = SavedList(
        user_id=user_id,
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
def update_list(
    list_id: int,
    payload: SavedListUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    saved_list = db.query(SavedList).filter(
        SavedList.id == list_id, SavedList.user_id == user_id
    ).first()
    if not saved_list:
        raise HTTPException(status_code=404, detail="List not found")
    _check_name_available(db, user_id, payload.name, exclude_id=list_id)
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
def delete_list(
    list_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)
):
    saved_list = db.query(SavedList).filter(
        SavedList.id == list_id, SavedList.user_id == user_id
    ).first()
    if not saved_list:
        raise HTTPException(status_code=404, detail="List not found")
    db.delete(saved_list)
    db.commit()
    return {"ok": True}
