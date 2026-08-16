import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user_id, get_optional_user_id
from app.db.session import get_db
from app.models.list_models import FusionList, FusionListEntry
from app.models.profile_models import Profile
from app.schemas.fusion_list_schemas import (
    FusionListCreate,
    FusionListEntryIn,
    FusionListOut,
    FusionListUpdate,
)
from app.schemas.list_schemas import VisibilityUpdate

router = APIRouter(prefix="/api/fusion-lists", tags=["fusion-lists"])


def _check_name_available(
    db: Session, user_id: str, name: str, exclude_id: int | None = None
):
    query = db.query(FusionList).filter(FusionList.user_id == user_id, FusionList.name == name)
    if exclude_id is not None:
        query = query.filter(FusionList.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=400, detail=f'A fusion list named "{name}" already exists.')


def _next_available_name(db: Session, user_id: str, base_name: str) -> str:
    name = f"{base_name} (copy)"
    existing = {
        n for (n,) in db.query(FusionList.name).filter(FusionList.user_id == user_id).all()
    }
    if name not in existing:
        return name
    i = 2
    while f"{name} {i}" in existing:
        i += 1
    return f"{name} {i}"


def _attach_viewer_context(fusion_list: FusionList, db: Session, viewer_user_id: str | None):
    fusion_list.is_owner = viewer_user_id is not None and viewer_user_id == fusion_list.user_id
    fusion_list.owner = db.query(Profile).filter(Profile.id == fusion_list.user_id).first()
    return fusion_list


@router.get("", response_model=list[FusionListOut])
def get_fusion_lists(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return db.query(FusionList).filter(FusionList.user_id == user_id).all()


@router.get("/{list_id}", response_model=FusionListOut)
def get_fusion_list(
    list_id: int,
    db: Session = Depends(get_db),
    user_id: str | None = Depends(get_optional_user_id),
):
    fusion_list = db.query(FusionList).filter(FusionList.id == list_id).first()
    if not fusion_list or (fusion_list.user_id != user_id and not fusion_list.is_public):
        raise HTTPException(status_code=404, detail="Fusion list not found")
    return _attach_viewer_context(fusion_list, db, user_id)


@router.patch("/{list_id}/visibility", response_model=FusionListOut)
def set_fusion_list_visibility(
    list_id: int,
    payload: VisibilityUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    fusion_list = db.query(FusionList).filter(
        FusionList.id == list_id, FusionList.user_id == user_id
    ).first()
    if not fusion_list:
        raise HTTPException(status_code=404, detail="Fusion list not found")
    fusion_list.is_public = payload.is_public
    if payload.is_public and not fusion_list.share_token:
        fusion_list.share_token = str(uuid.uuid4())
    db.commit()
    db.refresh(fusion_list)
    return _attach_viewer_context(fusion_list, db, user_id)


@router.post("/{list_id}/copy", response_model=FusionListOut)
def copy_fusion_list(
    list_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    source = db.query(FusionList).filter(FusionList.id == list_id).first()
    if not source or (source.user_id != user_id and not source.is_public):
        raise HTTPException(status_code=404, detail="Fusion list not found")
    copy = FusionList(
        user_id=user_id,
        name=_next_available_name(db, user_id, source.name),
        visible_columns=source.visible_columns,
        column_widths=source.column_widths,
        labels=source.labels,
        updated_at=datetime.utcnow(),
    )
    copy.entries = [
        FusionListEntry(
            head_slug=e.head_slug,
            body_slug=e.body_slug,
            position=e.position,
            label_ids=e.label_ids,
            selected_variant=e.selected_variant,
        )
        for e in source.entries
    ]
    db.add(copy)
    db.commit()
    db.refresh(copy)
    return _attach_viewer_context(copy, db, user_id)


def _build_entries(entries: list[FusionListEntryIn]) -> list[FusionListEntry]:
    return [
        FusionListEntry(
            head_slug=e.head_slug,
            body_slug=e.body_slug,
            position=i,
            label_ids=e.label_ids,
            selected_variant=e.selected_variant,
        )
        for i, e in enumerate(entries)
    ]


@router.post("", response_model=FusionListOut)
def create_fusion_list(
    payload: FusionListCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    _check_name_available(db, user_id, payload.name)
    fusion_list = FusionList(
        user_id=user_id,
        name=payload.name,
        visible_columns=payload.visible_columns,
        column_widths=payload.column_widths,
        labels=[label.model_dump() for label in payload.labels],
        updated_at=datetime.utcnow(),
    )
    fusion_list.entries = _build_entries(payload.entries)
    db.add(fusion_list)
    db.commit()
    db.refresh(fusion_list)
    return fusion_list


@router.put("/{list_id}", response_model=FusionListOut)
def update_fusion_list(
    list_id: int,
    payload: FusionListUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    fusion_list = db.query(FusionList).filter(
        FusionList.id == list_id, FusionList.user_id == user_id
    ).first()
    if not fusion_list:
        raise HTTPException(status_code=404, detail="Fusion list not found")
    _check_name_available(db, user_id, payload.name, exclude_id=list_id)
    fusion_list.name = payload.name
    fusion_list.visible_columns = payload.visible_columns
    fusion_list.column_widths = payload.column_widths
    fusion_list.labels = [label.model_dump() for label in payload.labels]
    fusion_list.updated_at = datetime.utcnow()
    fusion_list.entries = _build_entries(payload.entries)
    db.commit()
    db.refresh(fusion_list)
    return fusion_list


@router.delete("/{list_id}")
def delete_fusion_list(
    list_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)
):
    fusion_list = db.query(FusionList).filter(
        FusionList.id == list_id, FusionList.user_id == user_id
    ).first()
    if not fusion_list:
        raise HTTPException(status_code=404, detail="Fusion list not found")
    db.delete(fusion_list)
    db.commit()
    return {"ok": True}
