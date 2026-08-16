from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint, Uuid

from app.db.session import Base


class ListSave(Base):
    """A bookmark of another user's public list — distinct from copying: this stays a
    live pointer at the original (list_type/list_id), not an owned duplicate."""

    __tablename__ = "list_saves"
    __table_args__ = (
        UniqueConstraint("user_id", "list_type", "list_id", name="list_saves_unique"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Uuid(as_uuid=False), nullable=False)
    list_type = Column(String, nullable=False)  # "saved" | "fusion"
    list_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=True)


class FriendRequest(Base):
    """Doubles as the friendship record once accepted — no separate friendships table.
    'Are A and B friends' = an accepted row with either ordering of requester/recipient."""

    __tablename__ = "friend_requests"
    __table_args__ = (
        UniqueConstraint("requester_id", "recipient_id", name="friend_requests_unique"),
    )

    id = Column(Integer, primary_key=True)
    requester_id = Column(Uuid(as_uuid=False), nullable=False)
    recipient_id = Column(Uuid(as_uuid=False), nullable=False)
    status = Column(String, nullable=False, default="pending")  # "pending" | "accepted"
    created_at = Column(DateTime, nullable=True)
