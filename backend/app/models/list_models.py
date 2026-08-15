from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.session import Base


class SavedList(Base):
    __tablename__ = "saved_lists"
    __table_args__ = (UniqueConstraint("user_id", "name", name="saved_lists_user_name_unique"),)

    id = Column(Integer, primary_key=True)
    # Supabase auth.users.id (a uuid), stored as text — SQLAlchemy doesn't need a
    # dialect-specific column type to read/write it correctly against either backend.
    user_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    # Criteria used for auto-populate (gen/type/stat thresholds, etc.), stored as-is.
    criteria = Column(JSON, nullable=True)
    # Which stat/field columns this list currently displays.
    visible_columns = Column(JSON, nullable=True)
    # Pixel width per column key, e.g. {"hp": 64}. Columns without an entry use their default width.
    column_widths = Column(JSON, nullable=True)
    # This list's own label palette: [{"id": "...", "name": "...", "color": "..."}, ...].
    # Client-generated ids, scoped to this list only (not shared across other saved lists).
    labels = Column(JSON, nullable=True)
    # Set on every create/update — drives the landing page's "recently modified" ordering.
    updated_at = Column(DateTime, nullable=True)

    entries = relationship(
        "SavedListEntry", back_populates="saved_list", cascade="all, delete-orphan"
    )


class SavedListEntry(Base):
    __tablename__ = "saved_list_entries"

    id = Column(Integer, primary_key=True)
    saved_list_id = Column(Integer, ForeignKey("saved_lists.id"), nullable=False)
    pokemon_slug = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    # Ids referencing the parent SavedList's `labels` palette.
    label_ids = Column(JSON, nullable=True)

    saved_list = relationship("SavedList", back_populates="entries")


class FusionList(Base):
    """A roster of assembled head+body fusions, distinct from SavedList's single-Pokémon
    candidate pools (see Notes/Operation/fusionlist.md)."""

    __tablename__ = "fusion_lists"
    __table_args__ = (UniqueConstraint("user_id", "name", name="fusion_lists_user_name_unique"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    visible_columns = Column(JSON, nullable=True)
    column_widths = Column(JSON, nullable=True)
    # Same per-list-scoped label palette shape as SavedList.labels, kept as a separate
    # instance per fusion list rather than a shared/global table.
    labels = Column(JSON, nullable=True)
    updated_at = Column(DateTime, nullable=True)

    entries = relationship(
        "FusionListEntry", back_populates="fusion_list", cascade="all, delete-orphan"
    )


class FusionListEntry(Base):
    __tablename__ = "fusion_list_entries"

    id = Column(Integer, primary_key=True)
    fusion_list_id = Column(Integer, ForeignKey("fusion_lists.id"), nullable=False)
    head_slug = Column(String, nullable=False)
    body_slug = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    label_ids = Column(JSON, nullable=True)
    selected_variant = Column(String, nullable=True)

    fusion_list = relationship("FusionList", back_populates="entries")
