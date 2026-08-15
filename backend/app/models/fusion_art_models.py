from sqlalchemy import JSON, Column, String

from app.db.session import Base


class FusionArtManifest(Base):
    """Backs services/fusion_art.py's scrape cache when Supabase Storage is configured —
    replaces the local manifest.json-per-pair files, which don't survive Vercel cold
    starts. Not user-scoped: shared reference data, not per-user content. Also holds one
    sentinel row (pair="_if_dex_map") for the National-dex -> infinitefusiondex.com dex id
    map, which is small enough not to warrant its own table."""

    __tablename__ = "fusion_art_manifests"

    pair = Column(String, primary_key=True)
    variants = Column(JSON, nullable=False)
