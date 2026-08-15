import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parent

load_dotenv(BACKEND_DIR / ".env")

# Lives inside the backend service root (not a repo-root sibling) so Vercel's
# per-service build — which packages each service like an independent project
# rooted at its `root` — actually bundles it. See Notes/cloud-migration-next-steps.md.
DATA_CACHE_DIR = BACKEND_DIR / "data" / "cache"

DATABASE_URL = os.getenv("DATABASE_URL") or f"sqlite:///{BACKEND_DIR / 'dexforge.db'}"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
