from pydantic import BaseModel, Field, computed_field
from typing import Optional, Dict, Any
from datetime import datetime

# --- Graph Node Schemas ---

class GraphNodeBase(BaseModel):
    # General node properties
    label: Optional[str] = None
    node_type: Optional[str] = Field(None, description="Type of node (e.g., 'note', 'file')")
    data: Optional[Dict[str, Any]] = None # Flexible data payload (JSON)
    # Allow position fields to be None initially
    position_x: Optional[float] = Field(None, description="X coordinate for frontend rendering")
    position_y: Optional[float] = Field(None, description="Y coordinate for frontend rendering")

class GraphNodeCreate(GraphNodeBase):
    # Type is required on creation
    label: str # Label is required on creation
    node_type: str = "note" # Default to note type
    # Optional: Add specific fields required only on creation if any
    pass

class GraphNodeUpdate(GraphNodeBase):
    # All fields are optional on update
    label: Optional[str] = None
    node_type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    # Add the position field to allow direct dictionary updates
    position: Optional[Dict[str, float]] = None 
    # position_x: Optional[float] = None # Keep commented/removed
    # position_y: Optional[float] = None

# Properties shared by models stored in DB
class GraphNodeInDBBase(GraphNodeBase):
    id: int
    user_id: int
    # The underlying model has a 'position' JSON field
    position: Optional[Dict[str, float]] = None 
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True # Allows mapping from SQLAlchemy models
    }

# Properties to return to client
class GraphNode(GraphNodeInDBBase):
    # Add position_x and position_y derived from the position JSON
    # These should also be optional to handle cases where position is None
    position_x: Optional[float] = Field(None, validation_alias='position.x')
    position_y: Optional[float] = Field(None, validation_alias='position.y')

    class Config:
        # Ensure aliases are used for population
        populate_by_name = True

# --- Graph Edge Schemas ---

class GraphEdgeBase(BaseModel):
    # Properties required for an edge
    source_node_id: int
    target_node_id: int
    relationship_type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None # Flexible data payload (JSON)

class GraphEdgeCreate(GraphEdgeBase):
    # Specific creation requirements, if any (already covered by Base)
    pass

class GraphEdgeUpdate(GraphEdgeBase):
    # All fields optional on update
    source_node_id: Optional[int] = None
    target_node_id: Optional[int] = None
    relationship_type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

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