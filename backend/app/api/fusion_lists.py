from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user_id
from app.db.session import get_db
from app.models.list_models import FusionList, FusionListEntry
from app.schemas.fusion_list_schemas import (
    FusionListCreate,
    FusionListEntryIn,
    FusionListOut,
    FusionListUpdate,
)

router = APIRouter(prefix="/api/fusion-lists", tags=["fusion-lists"])


def _check_name_available(
    db: Session, user_id: str, name: str, exclude_id: int | None = None
):
    query = db.query(FusionList).filter(FusionList.user_id == user_id, FusionList.name == name)
    if exclude_id is not None:
        query = query.filter(FusionList.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=400, detail=f'A fusion list named "{name}" already exists.')


@router.get("", response_model=list[FusionListOut])
def get_fusion_lists(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return db.query(FusionList).filter(FusionList.user_id == user_id).all()


@router.get("/{list_id}", response_model=FusionListOut)
def get_fusion_list(
    list_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)
):
    fusion_list = db.query(FusionList).filter(
        FusionList.id == list_id, FusionList.user_id == user_id
    ).first()
    if not fusion_list:
        raise HTTPException(status_code=404, detail="Fusion list not found")
    return fusion_list


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
