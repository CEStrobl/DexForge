from sqlalchemy import Column, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class SavedList(Base):
    __tablename__ = "saved_lists"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    # Criteria used for auto-populate (gen/type/stat thresholds, etc.), stored as-is.
    criteria = Column(JSON, nullable=True)
    # Which stat/field columns this list currently displays.
    visible_columns = Column(JSON, nullable=True)

    entries = relationship(
        "SavedListEntry", back_populates="saved_list", cascade="all, delete-orphan"
    )


class SavedListEntry(Base):
    __tablename__ = "saved_list_entries"

    id = Column(Integer, primary_key=True)
    saved_list_id = Column(Integer, ForeignKey("saved_lists.id"), nullable=False)
    pokemon_slug = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)

    saved_list = relationship("SavedList", back_populates="entries")
