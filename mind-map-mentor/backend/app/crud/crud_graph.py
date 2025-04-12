from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified # Import flag_modified
from typing import List, Optional

from app.models.graph_node import GraphNode
from app.models.graph_edge import GraphEdge
from app.schemas.graph import GraphNodeCreate, GraphNodeUpdate, GraphEdgeCreate, GraphEdgeUpdate
from app.db.base import Base # Used for potential type hinting if needed

# --- GraphNode CRUD --- #

def get_graph_node(db: Session, node_id: int, user_id: int) -> Optional[GraphNode]:
    """Get a single graph node by ID, ensuring user ownership."""
    print(f"[get_graph_node] Querying for Node ID={node_id}, User ID={user_id}") # DEBUG LOG
    result = db.query(GraphNode).filter(GraphNode.id == node_id, GraphNode.user_id == user_id).first()
    print(f"[get_graph_node] Result for Node ID={node_id}: {'Found' if result else 'None'}") # DEBUG LOG
    return result

def get_graph_nodes_for_user(
    db: Session, user_id: int, skip: int = 0, limit: int = 100
) -> List[GraphNode]:
    """Get all graph nodes for a specific user."""
    return db.query(GraphNode).filter(GraphNode.user_id == user_id).offset(skip).limit(limit).all()

def create_graph_node(db: Session, node: GraphNodeCreate, user_id: int, commit: bool = True) -> GraphNode:
    """Create a new graph node.
    Optionally commits the session.
    """
    # Map position_x/y from schema to position JSON in model
    position_data = None
    if node.position_x is not None and node.position_y is not None:
        position_data = {"x": node.position_x, "y": node.position_y}
        
    db_node = GraphNode(
        user_id=user_id,
        label=node.label,
        node_type=node.node_type, # Set node_type from schema
        data=node.data, 
        position=position_data
    )
    db.add(db_node)
    
    if commit:
        db.commit()
        db.refresh(db_node)
    else:
        db.flush() # Assign ID without committing
        db.refresh(db_node) # Ensure db_node has the generated ID
        
    return db_node

def update_graph_node(
    db: Session, node_id: int, node_update: GraphNodeUpdate, user_id: int
) -> Optional[GraphNode]:
    """Update an existing graph node."""
    db_node = get_graph_node(db, node_id=node_id, user_id=user_id)
    if not db_node:
        return None

    update_data = node_update.model_dump(exclude_unset=True)
    
    # --- Refined Position Handling --- 
    new_position_data = None # Initialize
    # Check if position is provided as x/y coordinates
    if "position_x" in update_data or "position_y" in update_data:
        current_pos = (db_node.position or {}).copy()
        new_position_data = {
            "x": update_data.pop("position_x", current_pos.get("x")),
            "y": update_data.pop("position_y", current_pos.get("y")),
        }
    # Check if position is provided directly as a dict
    elif "position" in update_data and isinstance(update_data["position"], dict):
        # Validate/extract x, y from the dict if needed, or just use it directly
        pos_dict = update_data.pop("position")
        if "x" in pos_dict and "y" in pos_dict: # Basic validation
             new_position_data = {"x": pos_dict["x"], "y": pos_dict["y"]}
        else:
            print(f"Warning: Invalid 'position' dict format received: {pos_dict}")
    
    # If a valid new position was determined, update the node
    if new_position_data is not None:
        db_node.position = new_position_data
        flag_modified(db_node, "position") # Flag the position field as modified
    # --- End Refined Position Handling ---

    # Apply other updates (position, position_x, position_y were popped or handled)
    for key, value in update_data.items():
        setattr(db_node, key, value)

    db.add(db_node)
    db.commit()
    db.refresh(db_node)
    return db_node

def delete_graph_node(db: Session, node_id: int, user_id: int) -> Optional[GraphNode]:
    """Delete a graph node."""
    db_node = get_graph_node(db, node_id=node_id, user_id=user_id)
    if not db_node:
        return None
    # Note: Edges connected via cascade delete based on model definition
    db.delete(db_node)
    db.commit()
    return db_node

# --- GraphEdge CRUD --- #

def get_graph_edge(db: Session, edge_id: int, user_id: int) -> Optional[GraphEdge]:
    """Get a single graph edge by ID, ensuring user ownership."""
    # Check ownership via source or target node (assuming user owns nodes)
    edge = db.query(GraphEdge).filter(GraphEdge.id == edge_id).first()
    if edge and (edge.source_node.user_id == user_id or edge.target_node.user_id == user_id):
        return edge
    return None

def get_graph_edges_for_user(
    db: Session, user_id: int, skip: int = 0, limit: int = 1000 # Increase limit for edges
) -> List[GraphEdge]:
    """Get all graph edges where either source or target node belongs to the user."""
    # This query might be slow on large datasets, consider optimization if needed
    return (
        db.query(GraphEdge)
        .join(GraphNode, GraphEdge.source_node_id == GraphNode.id)
        .filter(GraphNode.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    # Alternative: Query edges linked to nodes owned by user? Depends on indexing.

def create_graph_edge(db: Session, edge: GraphEdgeCreate, user_id: int) -> Optional[GraphEdge]:
    """Create a new graph edge.
    Ensures both source and target nodes exist and belong to the user.
    """
    # Verify source node exists and belongs to user
    print(f"[create_graph_edge] Checking source node: ID={edge.source_node_id}, User={user_id}") # DEBUG LOG
    source_node = get_graph_node(db, node_id=edge.source_node_id, user_id=user_id)
    if not source_node:
        # Or raise HTTPException here?
        print(f"Source node {edge.source_node_id} not found or does not belong to user {user_id}")
        return None 
        
    # Verify target node exists and belongs to user
    print(f"[create_graph_edge] Checking target node: ID={edge.target_node_id}, User={user_id}") # DEBUG LOG
    target_node = get_graph_node(db, node_id=edge.target_node_id, user_id=user_id)
    if not target_node:
        print(f"Target node {edge.target_node_id} not found or does not belong to user {user_id}")
        return None
    
    print(f"[create_graph_edge] Both nodes found. Creating edge...") # DEBUG LOG
    db_edge = GraphEdge(**edge.model_dump(), user_id=user_id)
    db.add(db_edge)
    db.commit() # Commit here is fine as it's the final step
    db.refresh(db_edge)
    print(f"[create_graph_edge] Edge created successfully: ID={db_edge.id}") # DEBUG LOG
    return db_edge

def update_graph_edge(
    db: Session, edge_id: int, edge_update: GraphEdgeUpdate, user_id: int
) -> Optional[GraphEdge]:
    """Update an existing graph edge."""
    db_edge = get_graph_edge(db, edge_id=edge_id, user_id=user_id)
    if not db_edge:
        return None
        
    # Verify new source/target nodes if they are being updated
    update_data = edge_update.model_dump(exclude_unset=True)
    if "source_node_id" in update_data and update_data["source_node_id"] is not None:
         if not get_graph_node(db, node_id=update_data["source_node_id"], user_id=user_id):
             print(f"New source node {update_data['source_node_id']} not found or does not belong to user {user_id}")
             return None # Or raise?
    if "target_node_id" in update_data and update_data["target_node_id"] is not None:
         if not get_graph_node(db, node_id=update_data["target_node_id"], user_id=user_id):
             print(f"New target node {update_data['target_node_id']} not found or does not belong to user {user_id}")
             return None # Or raise?

    for key, value in update_data.items():
        setattr(db_edge, key, value)

    db.add(db_edge)
    db.commit()
    db.refresh(db_edge)
    return db_edge

def delete_graph_edge(db: Session, edge_id: int, user_id: int) -> Optional[GraphEdge]:
    """Delete a graph edge."""
    db_edge = get_graph_edge(db, edge_id=edge_id, user_id=user_id)
    if not db_edge:
        return None
    db.delete(db_edge)
    db.commit()
    return db_edge 