from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parent

DATA_CACHE_DIR = REPO_ROOT / "data" / "cache"
DATABASE_URL = f"sqlite:///{BACKEND_DIR / 'dexforge.db'}"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
