from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user_id
from app.db.session import get_db
from app.models.list_models import FusionList, SavedList
from app.models.profile_models import Profile
from app.models.social_models import ListSave
from app.schemas.social_schemas import ListSaveCreate, ListSaveOut

router = APIRouter(prefix="/api/list-saves", tags=["list-saves"])

_MODELS = {"saved": SavedList, "fusion": FusionList}


def _resolve_public_list(db: Session, list_type: str, list_id: int):
    model = _MODELS.get(list_type)
    if not model:
        raise HTTPException(status_code=400, detail="Invalid list_type")
    target = db.query(model).filter(model.id == list_id, model.is_public.is_(True)).first()
    if not target:
        raise HTTPException(status_code=404, detail="List not found")
    return target


@router.get("", response_model=list[ListSaveOut])
def get_list_saves(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    saves = db.query(ListSave).filter(ListSave.user_id == user_id).all()
    results = []
    for save in saves:
        model = _MODELS.get(save.list_type)
        target = db.query(model).filter(model.id == save.list_id).first() if model else None
        if not target:
            continue  # original list was deleted since bookmarking
        owner = db.query(Profile).filter(Profile.id == target.user_id).first()
        if not owner or not target.is_public:
            continue  # unpublished or owner account gone
        results.append(
            ListSaveOut(
                list_type=save.list_type,
                list_id=save.list_id,
                name=target.name,
                entry_count=len(target.entries),
                is_public=target.is_public,
                owner=owner,
                created_at=save.created_at,
            )
        )
    return results


@router.post("", response_model=ListSaveOut)
def create_list_save(
    payload: ListSaveCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    target = _resolve_public_list(db, payload.list_type, payload.list_id)
    existing = db.query(ListSave).filter(
        ListSave.user_id == user_id,
        ListSave.list_type == payload.list_type,
        ListSave.list_id == payload.list_id,
    ).first()
    if not existing:
        existing = ListSave(
            user_id=user_id,
            list_type=payload.list_type,
            list_id=payload.list_id,
            created_at=datetime.utcnow(),
        )
        db.add(existing)
        db.commit()
    owner = db.query(Profile).filter(Profile.id == target.user_id).first()
    return ListSaveOut(
        list_type=payload.list_type,
        list_id=payload.list_id,
        name=target.name,
        entry_count=len(target.entries),
        is_public=target.is_public,
        owner=owner,
        created_at=existing.created_at,
    )


@router.delete("/{list_type}/{list_id}")
def delete_list_save(
    list_type: str,
    list_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    save = db.query(ListSave).filter(
        ListSave.user_id == user_id,
        ListSave.list_type == list_type,
        ListSave.list_id == list_id,
    ).first()
    if not save:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(save)
    db.commit()
    return {"ok": True}
