from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import math

# Shared properties
class NoteBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None

# Properties to receive via API on creation
class NoteCreate(NoteBase):
    # Title might be required on creation, content optional
    title: str

# Properties to receive via API on update
class NoteUpdate(NoteBase):
    # All fields are optional on update
    pass

# Properties shared by models stored in DB
class NoteInDBBase(NoteBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True # Allows mapping from SQLAlchemy models
    }

# Properties to return to client
class Note(NoteInDBBase):
    pass

# Additional properties stored in DB
class NoteInDB(NoteInDBBase):
    pass

# Schema for multiple notes
class Notes(BaseModel):
    notes: List[Note] 