from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app import crud, models, schemas # Import necessary modules
from app.db.session import get_db
from app.core.security import decode_token

# Setup OAuth2 scheme
# tokenUrl should match the path to your login endpoint
reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/v1/login/access-token")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> models.User:
    """
    Dependency to get the current user from a token.
    Decodes the token, validates credentials, and retrieves the user from DB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = decode_token(token)
    if not token_data or not token_data.sub:
        raise credentials_exception

    # Assuming the 'sub' field in the token is the user's email
    user = crud.get_user_by_email(db, email=token_data.sub)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """
    Dependency to get the current *active* user.
    Checks if the user retrieved by get_current_user is active.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user 