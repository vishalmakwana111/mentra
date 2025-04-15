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
    content: str # Make content required

# Properties to receive via API on update
class NoteUpdate(NoteBase):
    # All fields are optional on update
    tags: Optional[List[str]] = None
    pass

# Properties shared by models stored in DB
class NoteInDBBase(NoteBase):
    id: int
    user_id: int
    position_x: Optional[float] = 0.0 # Default to 0.0 if not set
    position_y: Optional[float] = 0.0 # Default to 0.0 if not set
    graph_node_id: Optional[int] = None # Add the FK ID
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

# Schema for paginated response
class NotesPage(BaseModel):
    items: List[Note]
    total: int 