from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
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
    ],
    "saved_list_entries": [
        ("label_ids", "JSON"),
    ],
    "fusion_lists": [
        ("updated_at", "DATETIME"),
    ],
}


def migrate_schema():
    with engine.connect() as conn:
        for table, columns in _NEW_COLUMNS.items():
            existing = {row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))}
            if not existing:
                continue  # table doesn't exist yet — create_all() will make it with all columns
            for name, sql_type in columns:
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {sql_type}"))
        conn.commit()
