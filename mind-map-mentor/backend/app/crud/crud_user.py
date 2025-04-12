from sqlalchemy.orm import Session
from typing import Optional

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Gets a user by their email address."""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user_in: UserCreate) -> User:
    """Creates a new user in the database."""
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        is_active=True  # Activate user by default
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticates a user by email and password."""
    user = get_user_by_email(db, email=email)
    if not user:
        return None # User not found
    if not verify_password(password, user.hashed_password):
        return None # Incorrect password
    return user 