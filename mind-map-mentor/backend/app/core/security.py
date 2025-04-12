from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional

from jose import jwt, JWTError

from app.core.config import settings
from app.schemas.token import TokenData

# Setup password hashing context
# bcrypt is a strong hashing algorithm
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hashes a plain password."""
    return pwd_context.hash(password)


# --- JWT Token Handling --- #

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    """Decodes a JWT token and returns the payload (TokenData) or None if invalid."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        # Extract subject (user identifier) from payload
        subject: Optional[str] = payload.get("sub")
        if subject is None:
            return None # Or raise an exception
        return TokenData(sub=subject)
    except JWTError:
        return None # Invalid token (expired, bad signature, etc.) 