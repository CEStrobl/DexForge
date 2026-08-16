from sqlalchemy import Column, String, Uuid

from app.db.session import Base


class Profile(Base):
    """Public mirror of auth.users' display fields (username/avatar), kept in sync by a
    Postgres trigger — see backend/supabase/migrations/0002_social.sql. Needed because
    user_metadata itself isn't queryable by anyone but the owning user."""

    __tablename__ = "profiles"

    id = Column(Uuid(as_uuid=False), primary_key=True)
    username = Column(String, nullable=False, unique=True)
    avatar_head_slug = Column(String, nullable=True)
    avatar_body_slug = Column(String, nullable=True)
    avatar_variant_id = Column(String, nullable=True)
