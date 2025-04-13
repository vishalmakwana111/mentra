from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified # Import flag_modified
from typing import List, Optional
import logging # Add logging

from app.models.graph_node import GraphNode
from app.models.graph_edge import GraphEdge
from app.schemas.graph import GraphNodeCreate, GraphNodeUpdate, GraphEdgeCreate, GraphEdgeUpdate
from app.db.base import Base # Used for potential type hinting if needed

logger = logging.getLogger(__name__) # Add logger

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
    final_x: float = 0.0
    final_y: float = 0.0

    if node.position_x is not None and node.position_y is not None:
        try:
            # Attempt to use provided values
            final_x = float(node.position_x)
            final_y = float(node.position_y)
        except (ValueError, TypeError):
            logger.warning(f"Invalid position data provided during creation for node '{node.label}'. Defaulting to (0,0).")
            # Keep default 0.0 values
            final_x = 0.0
            final_y = 0.0
    else:
        # If not both provided, explicitly use defaults
        logger.info(f"Position not fully provided for node '{node.label}'. Defaulting to (0,0).")
        final_x = 0.0
        final_y = 0.0

    # Always create position data, defaulting to (0,0)
    position_data = {"x": final_x, "y": final_y}
    
    # --- Added Log --- #
    logger.info(f"Saving GraphNode '{node.label}' with position_data: {position_data}") 
    # --- End Added Log --- #

    db_node = GraphNode(
        user_id=user_id,
        label=node.label,
        node_type=node.node_type,
        data=node.data,
        position=position_data # Always set position data
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
    position_changed = False
    # Ensure current position is never None; default to 0,0 if DB somehow had NULL
    current_pos = (db_node.position or {}).copy()
    current_x = current_pos.get("x", 0.0)
    current_y = current_pos.get("y", 0.0)
    new_position_db_value = {"x": current_x, "y": current_y} # Start with current valid values

    # Check if position is being updated via x/y coordinates
    has_pos_x = "position_x" in update_data
    has_pos_y = "position_y" in update_data

    if has_pos_x or has_pos_y:
        provided_x = update_data.pop("position_x", None) if has_pos_x else None
        provided_y = update_data.pop("position_y", None) if has_pos_y else None

        # Determine final coordinates, defaulting Nones or invalids to 0.0
        final_x = current_x # Start with current
        final_y = current_y

        if has_pos_x:
            try:
                final_x = float(provided_x) if provided_x is not None else 0.0
            except (ValueError, TypeError):
                logger.warning(f"Invalid position_x '{provided_x}' during update for node {node_id}. Defaulting x to 0.0.")
                final_x = 0.0
        
        if has_pos_y:
             try:
                final_y = float(provided_y) if provided_y is not None else 0.0
             except (ValueError, TypeError):
                logger.warning(f"Invalid position_y '{provided_y}' during update for node {node_id}. Defaulting y to 0.0.")
                final_y = 0.0
        
        potential_new_pos = {"x": final_x, "y": final_y}
        if potential_new_pos != new_position_db_value: # Compare with the initial state for this update cycle
            new_position_db_value = potential_new_pos
            position_changed = True

    # Check for direct position dict update
    elif "position" in update_data:
        pos_dict = update_data.pop("position")
        temp_x = 0.0
        temp_y = 0.0
        valid_dict = False
        if pos_dict is None:
            # Explicitly setting position to null means reset to default (0,0)
            logger.info(f"Received position: null for node {node_id}. Resetting to (0,0).")
            temp_x = 0.0
            temp_y = 0.0
            valid_dict = True 
        elif isinstance(pos_dict, dict) and "x" in pos_dict and "y" in pos_dict:
            try:
                # Attempt to convert, default to 0.0 if None or invalid
                temp_x = float(pos_dict.get("x")) if pos_dict.get("x") is not None else 0.0
                temp_y = float(pos_dict.get("y")) if pos_dict.get("y") is not None else 0.0
                valid_dict = True
            except (ValueError, TypeError):
                 logger.warning(f"Invalid position dict data provided during update for node {node_id}: {pos_dict}. Using (0,0).")
                 temp_x = 0.0
                 temp_y = 0.0
                 valid_dict = True # Treat as valid for defaulting purpose
        else:
             logger.warning(f"Invalid or incomplete 'position' dict format received during update for node {node_id}: {pos_dict}. Using (0,0).")
             temp_x = 0.0
             temp_y = 0.0
             valid_dict = True # Default if format is wrong
             
        if valid_dict:
             potential_new_pos = {"x": temp_x, "y": temp_y}
             if potential_new_pos != new_position_db_value:
                 new_position_db_value = potential_new_pos
                 position_changed = True

    # Apply the determined position update if it changed
    if position_changed:
        db_node.position = new_position_db_value
        flag_modified(db_node, "position")

    # Apply other updates (label, node_type, data)
    for key, value in update_data.items():
        if hasattr(db_node, key):
             setattr(db_node, key, value)
        else:
             logger.warning(f"Attempted to update non-existent attribute '{key}' on GraphNode {node_id}")

    db.add(db_node) # Add to session even if no changes (SQLAlchemy handles it)
    try:
        db.commit()
        db.refresh(db_node)
    except Exception as e:
         logger.error(f"Database error during update of node {node_id}: {e}", exc_info=True)
         db.rollback()
         return None
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