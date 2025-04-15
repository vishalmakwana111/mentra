from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

# Nested schema for position
class Position(BaseModel):
    x: Optional[float] = None
    y: Optional[float] = None

# Shared properties
class GraphNodeBase(BaseModel):
    label: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    position: Optional[Position] = None # Use the Position schema

# Properties to receive via API on creation
class GraphNodeCreate(GraphNodeBase):
    label: str # Label is required on creation

# Properties to receive via API on update
class GraphNodeUpdate(GraphNodeBase):
    # All fields optional on update
    pass

# Properties shared by models stored in DB
class GraphNodeInDBBase(GraphNodeBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

# Properties to return to client
class GraphNode(GraphNodeInDBBase):
    tags: Optional[List[str]] = None
    pass

# Properties stored in DB
class GraphNodeInDB(GraphNodeInDBBase):
    pass 