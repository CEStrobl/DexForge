from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QuickLinkCreate(BaseModel):
    label: str
    path: str


class QuickLinkUpdate(BaseModel):
    label: str


class QuickLinkReorder(BaseModel):
    ids: list[int]


class QuickLinkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    path: str
    position: int
    created_at: datetime | None = None
