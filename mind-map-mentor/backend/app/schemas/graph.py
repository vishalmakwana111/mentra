from pydantic import BaseModel, Field, computed_field
from typing import Optional, Dict, Any
from datetime import datetime

# --- Graph Node Schemas ---

class GraphNodeBase(BaseModel):
    # General node properties
    label: Optional[str] = None
    node_type: str = Field(..., description="Type of the node (e.g., 'note', 'file', 'concept')")
    data: Optional[Dict[str, Any]] = None # Flexible data payload (JSON)
    # position_x: Optional[float] = None # These will be computed
    # position_y: Optional[float] = None

class GraphNodeCreate(GraphNodeBase):
    # Type is required on creation
    node_type: str
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
    # Add computed fields to extract x and y from the position dict
    @computed_field
    @property
    def position_x(self) -> Optional[float]:
        return self.position.get('x') if self.position else None

    @computed_field
    @property
    def position_y(self) -> Optional[float]:
        return self.position.get('y') if self.position else None
    
    pass # Keep pass if no other overrides needed

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