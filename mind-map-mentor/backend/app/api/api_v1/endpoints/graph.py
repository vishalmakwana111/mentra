from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

# Import new schemas, models, crud, and deps
from app import models # Keep models for dependency
from app.schemas import graph as graph_schemas # Use aliased import for new schemas
from app.crud import crud_graph # Import new CRUD functions
from app.api import deps

# Placeholder for graph endpoints
router = APIRouter()

# --- Graph Nodes ---

@router.get("/nodes", response_model=List[graph_schemas.GraphNode], summary="List graph nodes for the current user")
async def list_graph_nodes(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Retrieve graph nodes for the current user."""
    nodes = crud_graph.get_graph_nodes_for_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return nodes

@router.post("/nodes", response_model=graph_schemas.GraphNode, status_code=status.HTTP_201_CREATED, summary="Create a new graph node")
async def create_graph_node(
    *, # Requires keyword args
    db: Session = Depends(deps.get_db),
    node_in: graph_schemas.GraphNodeCreate,
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Create a new graph node associated with the current user."""
    # TODO: Add validation or logic based on node_in.node_type if needed
    db_node = crud_graph.create_graph_node(db=db, node=node_in, user_id=current_user.id)
    return db_node

@router.get("/nodes/{node_id}", response_model=graph_schemas.GraphNode, summary="Get a specific node by ID")
async def get_graph_node(
    node_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Retrieve a specific graph node by ID, ensuring it belongs to the current user."""
    db_node = crud_graph.get_graph_node(db, node_id=node_id, user_id=current_user.id)
    if db_node is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
    return db_node

@router.put("/nodes/{node_id}", response_model=graph_schemas.GraphNode, summary="Update a specific node")
async def update_graph_node(
    node_id: int,
    *, # Requires keyword args
    db: Session = Depends(deps.get_db),
    node_in: graph_schemas.GraphNodeUpdate,
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Update a specific graph node, ensuring it belongs to the current user."""
    db_node = crud_graph.update_graph_node(db, node_id=node_id, node_update=node_in, user_id=current_user.id)
    if db_node is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
    return db_node

@router.delete("/nodes/{node_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a specific node")
async def delete_graph_node(
    node_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Delete a specific graph node, ensuring it belongs to the current user."""
    deleted_node = crud_graph.delete_graph_node(db, node_id=node_id, user_id=current_user.id)
    if deleted_node is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
    return # Return None for 204

@router.get("/nodes/", response_model=List[graph_schemas.GraphNode], summary="List all graph nodes for the current user")
def list_graph_nodes_all(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 1000, # Increase limit potentially
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Retrieve all graph nodes (notes, files, etc.) for the current user."""
    nodes = crud_graph.get_graph_nodes_for_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return nodes

# --- Graph Edges ---

@router.get("/edges", response_model=List[graph_schemas.GraphEdge], summary="List graph edges for the current user")
async def list_graph_edges(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 1000,
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Retrieve graph edges where either source or target node belongs to the user."""
    edges = crud_graph.get_graph_edges_for_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return edges

@router.post("/edges", response_model=graph_schemas.GraphEdge, status_code=status.HTTP_201_CREATED, summary="Create a new graph edge")
async def create_graph_edge(
    *, # Requires keyword args
    db: Session = Depends(deps.get_db),
    edge_in: graph_schemas.GraphEdgeCreate,
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Create a new graph edge. 
    Validates that source/target nodes exist and belong to the user.
    """
    db_edge = crud_graph.create_graph_edge(db=db, edge=edge_in, user_id=current_user.id)
    if db_edge is None:
        # CRUD function prints details, return a generic error
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create edge. Source or target node may not exist or belong to user.")
    return db_edge

@router.get("/edges/{edge_id}", response_model=graph_schemas.GraphEdge, summary="Get a specific edge by ID")
async def get_graph_edge(
    edge_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Retrieve a specific graph edge by ID, ensuring user ownership."""
    db_edge = crud_graph.get_graph_edge(db, edge_id=edge_id, user_id=current_user.id)
    if db_edge is None:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edge not found")
    return db_edge

@router.put("/edges/{edge_id}", response_model=graph_schemas.GraphEdge, summary="Update a specific edge")
async def update_graph_edge(
    edge_id: int,
    *, # Requires keyword args
    db: Session = Depends(deps.get_db),
    edge_in: graph_schemas.GraphEdgeUpdate,
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Update a specific graph edge, ensuring user ownership and node validity."""
    db_edge = crud_graph.update_graph_edge(db, edge_id=edge_id, edge_update=edge_in, user_id=current_user.id)
    if db_edge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edge not found or update failed (invalid source/target node?)")
    return db_edge

@router.delete("/edges/{edge_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a specific edge")
async def delete_graph_edge(
    edge_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Delete a specific graph edge, ensuring user ownership."""
    deleted_edge = crud_graph.delete_graph_edge(db, edge_id=edge_id, user_id=current_user.id)
    if deleted_edge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edge not found")
    return # Return None for 204

# Remove old placeholder comment
# Add other placeholder CRUD operations here later 