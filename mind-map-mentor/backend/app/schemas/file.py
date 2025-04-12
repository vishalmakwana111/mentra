from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Shared properties (metadata)
class FileBase(BaseModel):
    filename: str
    mime_type: Optional[str] = None
    size: Optional[int] = None

# Properties to receive via API on creation - Handled by UploadFile in endpoint
# class FileCreate(FileBase):
#     pass

# Properties shared by models stored in DB
class FileInDBBase(FileBase):
    id: int
    user_id: int
    storage_path: str # Internal path, may not expose directly
    created_at: datetime

    model_config = {
        "from_attributes": True # Allows mapping from SQLAlchemy models
    }

# Properties to return to client (excluding sensitive info like storage_path)
class File(FileBase):
    id: int
    user_id: int
    created_at: datetime

# Additional properties stored in DB
# class FileInDB(FileInDBBase):
#     pass 