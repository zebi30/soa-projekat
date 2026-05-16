from fastapi import Header, HTTPException
import jwt

from app.config import settings


def get_current_user_id(authorization: str | None = Header(default=None)) -> int:
    prefix = "Bearer "
    if not authorization or not authorization.startswith(prefix):
        raise HTTPException(status_code=401, detail="Authorization token is required.")

    token = authorization[len(prefix):].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token is required.")

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
