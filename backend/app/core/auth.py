import jwt
from fastapi import Header, HTTPException
from jwt import PyJWKClient

from app.core.config import SUPABASE_URL

# Supabase's newer "JWT Signing Keys" model verifies via a rotating public key set
# rather than a single shared secret — PyJWKClient fetches and caches it, and re-fetches
# automatically if a token references a `kid` it hasn't seen yet (key rotation).
_jwk_client = PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json") if SUPABASE_URL else None


def get_current_user_id(authorization: str | None = Header(default=None)) -> str:
    """Verifies the Supabase-issued access token and returns the user's id (the JWT's
    `sub` claim). The only auth logic in the backend — no password handling or session
    storage, Supabase Auth owns all of that; this just checks the signature and expiry.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    if not _jwk_client:
        raise HTTPException(status_code=500, detail="SUPABASE_URL is not configured")

    token = authorization.removeprefix("Bearer ")
    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject claim")
    return user_id


def get_optional_user_id(authorization: str | None = Header(default=None)) -> str | None:
    """Same verification as get_current_user_id, but returns None instead of raising when
    no bearer token is present at all — for routes a signed-out visitor can also hit (e.g.
    a public list's share link). A present-but-invalid token still raises 401."""
    if not authorization:
        return None
    return get_current_user_id(authorization)
