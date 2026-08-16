from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.auth import get_current_user_id
from app.db.session import get_db
from app.models.profile_models import Profile
from app.models.social_models import FriendRequest
from app.schemas.social_schemas import (
    FriendOut,
    FriendRequestCreate,
    FriendRequestOut,
    OutgoingFriendRequestOut,
)

router = APIRouter(prefix="/api/friends", tags=["friends"])


@router.get("", response_model=list[FriendOut])
def get_friends(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    rows = db.query(FriendRequest).filter(
        FriendRequest.status == "accepted",
        or_(FriendRequest.requester_id == user_id, FriendRequest.recipient_id == user_id),
    ).all()
    other_ids = [r.recipient_id if r.requester_id == user_id else r.requester_id for r in rows]
    if not other_ids:
        return []
    return db.query(Profile).filter(Profile.id.in_(other_ids)).all()


@router.get("/requests", response_model=list[FriendRequestOut])
def get_incoming_requests(
    db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)
):
    rows = db.query(FriendRequest).filter(
        FriendRequest.recipient_id == user_id, FriendRequest.status == "pending"
    ).all()
    results = []
    for row in rows:
        requester = db.query(Profile).filter(Profile.id == row.requester_id).first()
        if requester:
            results.append(FriendRequestOut(id=row.id, requester=requester, created_at=row.created_at))
    return results


@router.get("/requests/outgoing", response_model=list[OutgoingFriendRequestOut])
def get_outgoing_requests(
    db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)
):
    rows = db.query(FriendRequest).filter(
        FriendRequest.requester_id == user_id, FriendRequest.status == "pending"
    ).all()
    results = []
    for row in rows:
        recipient = db.query(Profile).filter(Profile.id == row.recipient_id).first()
        if recipient:
            results.append(OutgoingFriendRequestOut(id=row.id, recipient=recipient, created_at=row.created_at))
    return results


@router.post("/requests", response_model=FriendRequestOut)
def send_request(
    payload: FriendRequestCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    recipient = db.query(Profile).filter(Profile.username == payload.username).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="User not found")
    if recipient.id == user_id:
        raise HTTPException(status_code=400, detail="Can't friend yourself")

    existing = db.query(FriendRequest).filter(
        or_(
            (FriendRequest.requester_id == user_id) & (FriendRequest.recipient_id == recipient.id),
            (FriendRequest.requester_id == recipient.id) & (FriendRequest.recipient_id == user_id),
        )
    ).first()
    if existing:
        detail = "Already friends" if existing.status == "accepted" else "Request already pending"
        raise HTTPException(status_code=400, detail=detail)

    row = FriendRequest(
        requester_id=user_id,
        recipient_id=recipient.id,
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    requester = db.query(Profile).filter(Profile.id == user_id).first()
    return FriendRequestOut(id=row.id, requester=requester, created_at=row.created_at)


@router.post("/requests/{request_id}/accept", response_model=FriendOut)
def accept_request(
    request_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)
):
    row = db.query(FriendRequest).filter(
        FriendRequest.id == request_id, FriendRequest.recipient_id == user_id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    row.status = "accepted"
    db.commit()
    return db.query(Profile).filter(Profile.id == row.requester_id).first()


@router.post("/requests/{request_id}/decline")
def decline_request(
    request_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)
):
    row = db.query(FriendRequest).filter(
        FriendRequest.id == request_id, FriendRequest.recipient_id == user_id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    db.delete(row)
    db.commit()
    return {"ok": True}


@router.delete("/requests/{request_id}")
def cancel_request(
    request_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)
):
    """Lets the requester withdraw a still-pending outgoing request — decline (above)
    is the recipient-side equivalent."""
    row = db.query(FriendRequest).filter(
        FriendRequest.id == request_id,
        FriendRequest.requester_id == user_id,
        FriendRequest.status == "pending",
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    db.delete(row)
    db.commit()
    return {"ok": True}
