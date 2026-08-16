from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class LabelDef(BaseModel):
    id: str
    name: str
    color: str


class SavedListEntryIn(BaseModel):
    slug: str
    label_ids: list[str] = []


class SavedListEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pokemon_slug: str
    position: int
    label_ids: list[str] = []

    @field_validator("label_ids", mode="before")
    @classmethod
    def _default_label_ids(cls, v):
        return v or []


class SavedListCreate(BaseModel):
    name: str
    criteria: dict | None = None
    visible_columns: list[str] | None = None
    column_widths: dict[str, int] | None = None
    labels: list[LabelDef] = []
    entries: list[SavedListEntryIn] = []


class SavedListUpdate(BaseModel):
    name: str
    criteria: dict | None = None
    visible_columns: list[str] | None = None
    column_widths: dict[str, int] | None = None
    labels: list[LabelDef] = []
    entries: list[SavedListEntryIn] = []


class VisibilityUpdate(BaseModel):
    is_public: bool


class ListCriteria(BaseModel):
    generation: str | None = None
    types: list[str] | None = None
    weak_to: list[str] | None = None
    ability: str | None = None
    egg_groups: list[str] | None = None
    ev_yield_stats: list[str] | None = None
    growth_rate: str | None = None
    is_legendary: bool | None = None
    is_mythical: bool | None = None

    hp_min: int | None = None
    hp_max: int | None = None
    attack_min: int | None = None
    attack_max: int | None = None
    defense_min: int | None = None
    defense_max: int | None = None
    special_attack_min: int | None = None
    special_attack_max: int | None = None
    special_defense_min: int | None = None
    special_defense_max: int | None = None
    speed_min: int | None = None
    speed_max: int | None = None

    base_stat_total_min: int | None = None
    base_stat_total_max: int | None = None
    capture_rate_min: int | None = None
    capture_rate_max: int | None = None
    base_happiness_min: int | None = None
    base_happiness_max: int | None = None
    hatch_counter_min: int | None = None
    hatch_counter_max: int | None = None


class OwnerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str
    avatar_head_slug: str | None = None
    avatar_body_slug: str | None = None
    avatar_variant_id: str | None = None


class SavedListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    criteria: dict | None
    visible_columns: list[str] | None
    column_widths: dict[str, int] | None
    labels: list[LabelDef] = []
    entries: list[SavedListEntryOut]
    updated_at: datetime | None = None
    is_public: bool = False
    share_token: str | None = None
    # Set on the ORM object at request time (not a real column) — True unless the caller
    # fetched someone else's public list via the optional-auth GET route.
    is_owner: bool = True
    owner: OwnerOut | None = None

    @field_validator("labels", mode="before")
    @classmethod
    def _default_labels(cls, v):
        return v or []
