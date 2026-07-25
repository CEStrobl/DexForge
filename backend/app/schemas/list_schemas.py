from pydantic import BaseModel, ConfigDict


class SavedListEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pokemon_slug: str
    position: int


class SavedListCreate(BaseModel):
    name: str
    criteria: dict | None = None
    visible_columns: list[str] | None = None
    pokemon_slugs: list[str] = []


class SavedListUpdate(BaseModel):
    name: str
    criteria: dict | None = None
    visible_columns: list[str] | None = None
    pokemon_slugs: list[str] = []


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


class SavedListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    criteria: dict | None
    visible_columns: list[str] | None
    entries: list[SavedListEntryOut]
