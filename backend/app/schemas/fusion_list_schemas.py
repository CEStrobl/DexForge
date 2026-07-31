from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.list_schemas import LabelDef


class FusionListEntryIn(BaseModel):
    head_slug: str
    body_slug: str
    label_ids: list[str] = []


class FusionListEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    head_slug: str
    body_slug: str
    position: int
    label_ids: list[str] = []

    @field_validator("label_ids", mode="before")
    @classmethod
    def _default_label_ids(cls, v):
        return v or []


class FusionListCreate(BaseModel):
    name: str
    visible_columns: list[str] | None = None
    column_widths: dict[str, int] | None = None
    labels: list[LabelDef] = []
    entries: list[FusionListEntryIn] = []


class FusionListUpdate(FusionListCreate):
    pass


class FusionListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    visible_columns: list[str] | None
    column_widths: dict[str, int] | None
    labels: list[LabelDef] = []
    entries: list[FusionListEntryOut]
    updated_at: datetime | None = None

    @field_validator("labels", mode="before")
    @classmethod
    def _default_labels(cls, v):
        return v or []
