from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.auth import get_current_user_id, get_optional_user_id
from app.db.session import get_db
from app.models.list_models import FusionList, SavedList
from app.models.profile_models import Profile
from app.models.social_models import FriendRequest
from app.schemas.social_schemas import FriendOut, ProfileListSummary, ProfileOut, ProfileSearchResult

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


def _friend_count(db: Session, user_id: str) -> int:
    return db.query(FriendRequest).filter(
        FriendRequest.status == "accepted",
        or_(FriendRequest.requester_id == user_id, FriendRequest.recipient_id == user_id),
    ).count()


@router.get("/search", response_model=list[ProfileSearchResult])
def search_profiles(
    q: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)
):
    q = q.strip()
    if not q:
        return []
    return (
        db.query(Profile)
        .filter(Profile.username.ilike(f"%{q}%"), Profile.id != user_id)
        .order_by(Profile.username)
        .limit(10)
        .all()
    )


@router.get("/{username}", response_model=ProfileOut)
def get_profile(
    username: str,
    db: Session = Depends(get_db),
    viewer_id: str | None = Depends(get_optional_user_id),
):
    profile = db.query(Profile).filter(Profile.username == username).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    is_self = viewer_id is not None and viewer_id == profile.id
    saved_count = db.query(SavedList).filter(
        SavedList.user_id == profile.id, *([] if is_self else [SavedList.is_public.is_(True)])
    ).count()
    fusion_count = db.query(FusionList).filter(
        FusionList.user_id == profile.id, *([] if is_self else [FusionList.is_public.is_(True)])
    ).count()
    return ProfileOut(
        username=profile.username,
        avatar_head_slug=profile.avatar_head_slug,
        avatar_body_slug=profile.avatar_body_slug,
        avatar_variant_id=profile.avatar_variant_id,
        list_count=saved_count + fusion_count,
        friend_count=_friend_count(db, profile.id),
    )


@router.get("/{username}/friends", response_model=list[FriendOut])
def get_profile_friends(username: str, db: Session = Depends(get_db)):
    """Public friends list for viewing someone else's profile — distinct from
    /api/friends, which is always scoped to the caller's own account."""
    profile = db.query(Profile).filter(Profile.username == username).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    rows = db.query(FriendRequest).filter(
        FriendRequest.status == "accepted",
        or_(FriendRequest.requester_id == profile.id, FriendRequest.recipient_id == profile.id),
    ).all()
    other_ids = [r.recipient_id if r.requester_id == profile.id else r.requester_id for r in rows]
    if not other_ids:
        return []
    return db.query(Profile).filter(Profile.id.in_(other_ids)).all()


@router.get("/{username}/lists", response_model=list[ProfileListSummary])
def get_profile_lists(username: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.username == username).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    saved = db.query(SavedList).filter(
        SavedList.user_id == profile.id, SavedList.is_public.is_(True)
    ).all()
    fusion = db.query(FusionList).filter(
        FusionList.user_id == profile.id, FusionList.is_public.is_(True)
    ).all()
    combined = [
        ProfileListSummary(kind="saved", id=l.id, name=l.name, entry_count=len(l.entries), updated_at=l.updated_at)
        for l in saved
    ] + [
        ProfileListSummary(kind="fusion", id=l.id, name=l.name, entry_count=len(l.entries), updated_at=l.updated_at)
        for l in fusion
    ]
    combined.sort(key=lambda l: l.updated_at or datetime.min, reverse=True)
    return combined
