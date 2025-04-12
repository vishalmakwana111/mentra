from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.graph_edge import GraphEdge
from app.models.graph_node import GraphNode # Needed for checks
from app.schemas.graph_edge import GraphEdgeCreate, GraphEdgeUpdate # Added GraphEdgeUpdate for future use
from app import models # For user model reference

def create_graph_edge_for_user(db: Session, edge_in: GraphEdgeCreate, user_id: int) -> GraphEdge:
    """Creates a new graph edge for a specific user.

    Ensures that the source and target nodes exist and belong to the user.
    """
    # Verify source node exists and belongs to the user
    source_node = db.query(GraphNode).filter(GraphNode.id == edge_in.source_node_id, GraphNode.user_id == user_id).first()
    if not source_node:
        raise ValueError(f"Source node with id {edge_in.source_node_id} not found or does not belong to user.")

    # Verify target node exists and belongs to the user
    target_node = db.query(GraphNode).filter(GraphNode.id == edge_in.target_node_id, GraphNode.user_id == user_id).first()
    if not target_node:
        raise ValueError(f"Target node with id {edge_in.target_node_id} not found or does not belong to user.")

    db_edge = GraphEdge(**edge_in.model_dump(), user_id=user_id)
    db.add(db_edge)
    db.commit()
    db.refresh(db_edge)
    return db_edge

def get_graph_edges_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 1000) -> List[GraphEdge]:
    """Gets all graph edges for a specific user with pagination (high default limit)."""
    return db.query(GraphEdge).filter(GraphEdge.user_id == user_id).offset(skip).limit(limit).all()

def get_graph_edge(db: Session, edge_id: int, user_id: int) -> Optional[GraphEdge]:
    """Gets a specific graph edge by ID, ensuring it belongs to the user."""
    return db.query(GraphEdge).filter(GraphEdge.id == edge_id, GraphEdge.user_id == user_id).first()

def delete_graph_edge(db: Session, edge_id: int, user_id: int) -> Optional[GraphEdge]:
    """Deletes a specific graph edge, ensuring it belongs to the user.
    Returns the deleted edge object or None if not found.
    """
    db_edge = get_graph_edge(db, edge_id=edge_id, user_id=user_id)
    if not db_edge:
        return None

    # TODO: Consider implications - deleting an edge might orphan nodes or require other cleanup?
    # For now, just delete the edge itself.
    db.delete(db_edge)
    db.commit()
    # The object is detached after commit but still holds the data
    return db_edge

# Optional: Implement update if needed
def update_graph_edge(
    db: Session, edge_id: int, edge_in: GraphEdgeUpdate, user_id: int
) -> Optional[GraphEdge]:
    """Updates a graph edge (type or data), ensuring it belongs to the user."""
    db_edge = get_graph_edge(db, edge_id=edge_id, user_id=user_id)
    if not db_edge:
        return None

    update_data = edge_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_edge, key, value)

    db.add(db_edge)
    db.commit()
    db.refresh(db_edge)
    return db_edge

# TODO: Implement update_graph_edge (if needed, using GraphEdgeUpdate)
# Currently, we only update relationship_type or data via GraphEdgeUpdate schema
# If needed, add an update function similar to update_note