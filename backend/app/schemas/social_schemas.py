from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.list_schemas import OwnerOut


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str
    avatar_head_slug: str | None = None
    avatar_body_slug: str | None = None
    avatar_variant_id: str | None = None
    list_count: int
    friend_count: int


class ProfileSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str
    avatar_head_slug: str | None = None
    avatar_body_slug: str | None = None
    avatar_variant_id: str | None = None


class ProfileListSummary(BaseModel):
    """One entry in a profile's public-lists grid — same shape whether it's a SavedList
    or a FusionList, since the grid displays them identically."""

    kind: str  # "saved" | "fusion"
    id: int
    name: str
    entry_count: int
    updated_at: datetime | None = None


class ListSaveCreate(BaseModel):
    list_type: str  # "saved" | "fusion"
    list_id: int


class ListSaveOut(BaseModel):
    list_type: str
    list_id: int
    name: str
    entry_count: int
    is_public: bool
    owner: OwnerOut
    created_at: datetime | None = None


class FriendRequestCreate(BaseModel):
    username: str


class FriendOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str
    avatar_head_slug: str | None = None
    avatar_body_slug: str | None = None
    avatar_variant_id: str | None = None


class FriendRequestOut(BaseModel):
    id: int
    requester: FriendOut
    created_at: datetime | None = None


class OutgoingFriendRequestOut(BaseModel):
    id: int
    recipient: FriendOut
    created_at: datetime | None = None
