from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import DATABASE_URL

_url = DATABASE_URL
_is_sqlite = _url.startswith("sqlite:")
if not _is_sqlite:
    # SQLAlchemy's bare "postgresql://"/"postgres://" default to the psycopg2 driver,
    # which isn't installed here (psycopg[binary], i.e. psycopg 3, is) — pin the dialect
    # explicitly so Supabase's connection string works without the caller having to know that.
    for prefix in ("postgres://", "postgresql://"):
        if _url.startswith(prefix):
            _url = "postgresql+psycopg://" + _url[len(prefix):]
            break

# check_same_thread is a SQLite-only connect arg; Postgres (psycopg) rejects it.
engine = create_engine(_url, connect_args={"check_same_thread": False} if _is_sqlite else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# `Base.metadata.create_all()` only creates missing tables — it never alters an
# already-existing table, so new columns on existing models (like adding `labels`
# to SavedList) need a manual, idempotent ADD COLUMN pass against the real db file.
_NEW_COLUMNS = {
    "saved_lists": [
        ("column_widths", "JSON"),
        ("labels", "JSON"),
        ("updated_at", "DATETIME"),
        ("user_id", "TEXT"),
    ],
    "saved_list_entries": [
        ("label_ids", "JSON"),
    ],
    "fusion_lists": [
        ("updated_at", "DATETIME"),
        ("user_id", "TEXT"),
    ],
    "fusion_list_entries": [
        ("selected_variant", "TEXT"),
    ],
    "quick_links": [
        ("user_id", "TEXT"),
    ],
}


def migrate_schema():
    # Postgres (Supabase) owns its schema via backend/supabase/migrations/*.sql — this
    # ALTER-TABLE dance is only for local SQLite dev DBs that predate a given column.
    if engine.dialect.name != "sqlite":
        return
    with engine.connect() as conn:
        for table, columns in _NEW_COLUMNS.items():
            existing = {row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))}
            if not existing:
                continue  # table doesn't exist yet — create_all() will make it with all columns
            for name, sql_type in columns:
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {sql_type}"))
        conn.commit()
