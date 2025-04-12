from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    # The subject ('sub') of the token, typically user identifier (e.g., email or user ID)
    sub: Optional[str] = None 