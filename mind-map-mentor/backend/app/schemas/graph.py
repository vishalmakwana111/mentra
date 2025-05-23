from pydantic import BaseModel, Field, computed_field
from typing import Optional, Dict, Any
from datetime import datetime

# --- Graph Node Schemas ---

class GraphNodeBase(BaseModel):
    # General node properties
    label: Optional[str] = None
    node_type: Optional[str] = Field(None, description="Type of node (e.g., 'note', 'file')")
    data: Optional[Dict[str, Any]] = None # Flexible data payload (JSON)
    # position_x: Optional[float] = Field(None, description="X coordinate for frontend rendering")
    # position_y: Optional[float] = Field(None, description="Y coordinate for frontend rendering")

class GraphNodeCreate(GraphNodeBase):
    # Type is required on creation
    label: str # Label is required on creation
    node_type: str = "note" # Default to note type
    # Add position_x/y here for API input
    position_x: Optional[float] = None 
    position_y: Optional[float] = None

class GraphNodeUpdate(BaseModel): # Don't inherit from GraphNodeBase to avoid conflicts
    # All fields are optional on update
    label: Optional[str] = None
    node_type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    # Add the position field to allow direct dictionary updates
    position: Optional[Dict[str, float]] = None 
    # Add position_x/y here for API input
    position_x: Optional[float] = None
    position_y: Optional[float] = None

# Properties shared by models stored in DB
class GraphNodeInDBBase(GraphNodeBase):
    id: int
    user_id: int
    # The underlying model has a 'position' JSON field
    # Allow Any type within the dict initially to handle legacy {"x": null} data
    position: Optional[Dict[str, Any]] = None 
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True # Allows mapping from SQLAlchemy models
    }

# Properties to return to client
class GraphNode(GraphNodeInDBBase):
    # Keep computed fields - they will safely handle the Dict[str, Any]
    @computed_field
    @property
    def position_x(self) -> Optional[float]:
        if self.position and isinstance(self.position, dict):
            val = self.position.get('x')
            try:
                return float(val) if val is not None else None
            except (ValueError, TypeError):
                return None 
        return None

    @computed_field
    @property
    def position_y(self) -> Optional[float]:
        if self.position and isinstance(self.position, dict):
            val = self.position.get('y')
            try:
                return float(val) if val is not None else None
            except (ValueError, TypeError):
                return None
        return None

# --- Graph Edge Schemas ---

class GraphEdgeBase(BaseModel):
    # Properties required for an edge
    source_node_id: int
    target_node_id: int
    relationship_type: Optional[str] = None
    label: Optional[str] = None # Add label field for display
    data: Optional[Dict[str, Any]] = None # Flexible data payload (JSON)

class GraphEdgeCreate(GraphEdgeBase):
    # Specific creation requirements, if any (already covered by Base)
    # Make label optional here as well
    label: Optional[str] = None 

class GraphEdgeUpdate(BaseModel): # Make this not inherit from Base to allow partial updates
    # All fields optional on update
    source_node_id: Optional[int] = None
    target_node_id: Optional[int] = None
    relationship_type: Optional[str] = None
    label: Optional[str] = None # Add label field
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