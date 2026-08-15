import jwt
from fastapi import Header, HTTPException

from app.core.config import SUPABASE_JWT_SECRET


def get_current_user_id(authorization: str | None = Header(default=None)) -> str:
    """Verifies the Supabase-issued access token and returns the user's id (the JWT's
    `sub` claim). The only auth logic in the backend — no password handling or session
    storage, Supabase Auth owns all of that; this just checks the signature and expiry.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET is not configured")

    token = authorization.removeprefix("Bearer ")
    try:
        payload = jwt.decode(
            token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated"
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject claim")
    return user_id
