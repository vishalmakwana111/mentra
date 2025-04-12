from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas, crud, models
from app.api import deps # Corrected import for deps
from app.db.session import get_db

router = APIRouter()

@router.post("/", response_model=schemas.User)
def create_new_user(
    *, # Ensures following arguments are keyword-only
    db: Session = Depends(get_db),
    user_in: schemas.UserCreate,
):
    """Create new user."""
    user = crud.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    new_user = crud.create_user(db, user_in=user_in)
    return new_user

# Get current user endpoint
@router.get("/me", response_model=schemas.User)
def read_users_me(
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Get current user."""
    return current_user 