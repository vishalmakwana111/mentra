from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

# Shared properties
class GraphEdgeBase(BaseModel):
    source_node_id: int
    target_node_id: int
    relationship_type: Optional[str] = 'related'
    data: Optional[Dict[str, Any]] = None

# Properties to receive via API on creation
class GraphEdgeCreate(GraphEdgeBase):
    # All required fields are in GraphEdgeBase
    pass

# Properties to receive via API on update
class GraphEdgeUpdate(BaseModel):
    # Allow updating type or data, but not source/target
    relationship_type: Optional[str] = None 
    data: Optional[Dict[str, Any]] = None

# Properties shared by models stored in DB
class GraphEdgeInDBBase(GraphEdgeBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

# Properties to return to client
class GraphEdge(GraphEdgeInDBBase):
    pass

# Properties stored in DB
class GraphEdgeInDB(GraphEdgeInDBBase):
    pass 