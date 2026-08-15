from sqlalchemy import Column, DateTime, Integer, String, Uuid

from app.db.session import Base


class QuickLink(Base):
    """A pinned shortcut to a specific page's identity — route + core identifying
    params only, not full UI state (sort order, open/collapsed cards, etc. are not
    captured). See Notes/QuickLinks.md."""

    __tablename__ = "quick_links"

    id = Column(Integer, primary_key=True)
    user_id = Column(Uuid(as_uuid=False), nullable=False)
    label = Column(String, nullable=False)
    path = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=True)
