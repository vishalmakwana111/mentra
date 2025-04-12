from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional # Forward references might be needed later for relationships

# Shared properties
class UserBase(BaseModel):
    email: EmailStr

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str

# Properties to receive via API on update
class UserUpdate(BaseModel): # Inherit from BaseModel directly
    email: Optional[EmailStr] = None # Usually email is not updatable, but allow if needed
    password: Optional[str] = None
    is_active: Optional[bool] = None

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = {
        "from_attributes": True # Allows mapping from SQLAlchemy models
    }

# Properties to return to client
class User(UserInDBBase):
    # You might want to add relationships here later, e.g.:
    # notes: List["Note"] = []
    # files: List["File"] = []
    pass

# Additional properties stored in DB but not returned by API (e.g., password)
# class UserInDB(UserInDBBase):
#     hashed_password: str 