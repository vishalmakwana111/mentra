from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any, List

# --- GraphNode Schemas ---

# Shared properties
class GraphNodeBase(BaseModel):
    label: Optional[str] = None
    data: Optional[Any] = None       # Flexible JSON field
    position: Optional[Any] = None   # Flexible JSON field for frontend coordinates

# Properties to receive via API on creation
class GraphNodeCreate(GraphNodeBase):
    label: str # Label is likely required on creation

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
        "from_attributes": True # Allows mapping from SQLAlchemy models
    }

# Properties to return to client
class GraphNode(GraphNodeInDBBase):
    # Relationships might be added later if needed for specific endpoints
    # edges_from: List["GraphEdge"] = []
    # edges_to: List["GraphEdge"] = []
    pass

# --- GraphEdge Schemas ---

# Shared properties
class GraphEdgeBase(BaseModel):
    source_node_id: int
    target_node_id: int
    relationship_type: Optional[str] = "related"
    data: Optional[Any] = None       # Flexible JSON field

# Properties to receive via API on creation
class GraphEdgeCreate(GraphEdgeBase):
    pass # Base properties are sufficient for creation

# Properties to receive via API on update
class GraphEdgeUpdate(GraphEdgeBase):
    # Make fields optional for update if needed
    source_node_id: Optional[int] = None
    target_node_id: Optional[int] = None
    pass

# Properties shared by models stored in DB
class GraphEdgeInDBBase(GraphEdgeBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True # Allows mapping from SQLAlchemy models
    }

# Properties to return to client
class GraphEdge(GraphEdgeInDBBase):
    pass 