from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app import schemas, crud, models
from app.db.session import get_db
from app.core.security import create_access_token
from app.core.config import settings

router = APIRouter()

@router.post("/access-token", response_model=schemas.Token)
def login_for_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """OAuth2 compatible token login, get an access token for future requests."""
    user = crud.authenticate_user(
        db,
        email=form_data.username, # OAuth2 uses username field for email
        password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires # Use email as subject
    )
    return {"access_token": access_token, "token_type": "bearer"} 