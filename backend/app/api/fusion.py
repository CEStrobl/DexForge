from fastapi import APIRouter
from pydantic import BaseModel

from app.services.fusion import compute_fusion
from app.services.fusion_art import get_fusion_art

router = APIRouter(prefix="/api/fusion", tags=["fusion"])


@router.get("/compare")
def compare_fusions(
    head_a: str | None = None,
    body_a: str | None = None,
    head_b: str | None = None,
    body_b: str | None = None,
):
    """Computes both fusions in one call — either side is null if its head/body
    aren't both provided yet, so the frontend can render whichever side is ready."""
    fusion_a = compute_fusion(head_a, body_a) if head_a and body_a else None
    fusion_b = compute_fusion(head_b, body_b) if head_b and body_b else None
    return {"a": fusion_a, "b": fusion_b}


class FusionPair(BaseModel):
    head_slug: str
    body_slug: str


class FusionBulkRequest(BaseModel):
    pairs: list[FusionPair]


@router.post("/bulk")
def bulk_fusions(payload: FusionBulkRequest):
    """Computes many fusions in one call, e.g. every row of a Fusion List — null entries
    mark pairs whose head/body slug didn't resolve, positionally aligned with the request."""
    return [compute_fusion(p.head_slug, p.body_slug) for p in payload.pairs]


@router.get("/{head_slug}/{body_slug}/art")
def fusion_art(head_slug: str, body_slug: str):
    """Community fusion sprite art for this head+body pair — scraped and cached on
    first request, served from local cache on every subsequent one."""
    return get_fusion_art(head_slug, body_slug)
