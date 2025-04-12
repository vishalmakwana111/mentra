from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

# Shared properties
class GraphNodeBase(BaseModel):
    label: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    position: Optional[Dict[str, float]] = None # Assuming position stored as {x: float, y: float}

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
    pass

# Properties stored in DB
class GraphNodeInDB(GraphNodeInDBBase):
    pass 