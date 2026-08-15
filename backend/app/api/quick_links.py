from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user_id
from app.db.session import get_db
from app.models.quick_link_models import QuickLink
from app.schemas.quick_link_schemas import (
    QuickLinkCreate,
    QuickLinkOut,
    QuickLinkReorder,
    QuickLinkUpdate,
)

router = APIRouter(prefix="/api/quick-links", tags=["quick-links"])


@router.get("", response_model=list[QuickLinkOut])
def get_quick_links(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return db.query(QuickLink).filter(QuickLink.user_id == user_id).order_by(QuickLink.position).all()


@router.post("", response_model=QuickLinkOut)
def create_quick_link(
    payload: QuickLinkCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    position = db.query(QuickLink).filter(QuickLink.user_id == user_id).count()
    quick_link = QuickLink(
        user_id=user_id,
        label=payload.label,
        path=payload.path,
        position=position,
        created_at=datetime.utcnow(),
    )
    db.add(quick_link)
    db.commit()
    db.refresh(quick_link)
    return quick_link


# Registered before "/{quick_link_id}" — otherwise a request to /reorder would match
# that route first (Starlette matches by registration order) and fail int coercion.
@router.put("/reorder")
def reorder_quick_links(
    payload: QuickLinkReorder,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    links = {
        link.id: link
        for link in db.query(QuickLink)
        .filter(QuickLink.user_id == user_id, QuickLink.id.in_(payload.ids))
        .all()
    }
    for position, link_id in enumerate(payload.ids):
        if link_id in links:
            links[link_id].position = position
    db.commit()
    return {"ok": True}


@router.put("/{quick_link_id}", response_model=QuickLinkOut)
def update_quick_link(
    quick_link_id: int,
    payload: QuickLinkUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    quick_link = db.query(QuickLink).filter(
        QuickLink.id == quick_link_id, QuickLink.user_id == user_id
    ).first()
    if not quick_link:
        raise HTTPException(status_code=404, detail="Quick link not found")
    quick_link.label = payload.label
    db.commit()
    db.refresh(quick_link)
    return quick_link


@router.delete("/{quick_link_id}")
def delete_quick_link(
    quick_link_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    quick_link = db.query(QuickLink).filter(
        QuickLink.id == quick_link_id, QuickLink.user_id == user_id
    ).first()
    if not quick_link:
        raise HTTPException(status_code=404, detail="Quick link not found")
    db.delete(quick_link)
    db.commit()
    return {"ok": True}
