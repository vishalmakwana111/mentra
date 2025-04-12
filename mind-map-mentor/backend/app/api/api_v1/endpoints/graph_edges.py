from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from app import schemas, models, crud
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.GraphEdge, status_code=status.HTTP_201_CREATED, summary="Create a new graph edge")
def create_graph_edge(
    *, # Requires keyword args
    db: Session = Depends(deps.get_db),
    edge_in: schemas.GraphEdgeCreate,
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Create a new graph edge between two nodes owned by the current user."""
    try:
        edge = crud.create_graph_edge_for_user(db=db, edge_in=edge_in, user_id=current_user.id)
        return edge
    except ValueError as e: # Catch potential node ownership errors from CRUD
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        # Generic error for other issues
        print(f"Error creating graph edge: {e}") # Log the specific error
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create graph edge")

@router.get("/", response_model=List[schemas.GraphEdge], summary="List graph edges for the current user")
def list_graph_edges(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 1000, # High limit, adjust if needed
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Retrieve graph edges for the current user."""
    edges = crud.get_graph_edges_for_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return edges

@router.delete("/{edge_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a specific graph edge")
def delete_graph_edge(
    edge_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Delete a graph edge owned by the current user."""
    deleted_edge = crud.delete_graph_edge(db, edge_id=edge_id, user_id=current_user.id)
    if not deleted_edge:
        raise HTTPException(status_code=404, detail="Graph edge not found")
    return # Return None/implicitly for 204

# Optional: Add GET /:edge_id and PUT /:edge_id later if needed 