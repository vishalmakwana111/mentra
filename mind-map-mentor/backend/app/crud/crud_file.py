from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
import uuid
import os
from pathlib import Path

from app.models.file import File
from app.models.graph_node import GraphNode # Import the GraphNode model
from app.schemas.file import FileBase # Use FileBase or a specific Create schema if defined
from app.core.config import settings
# Import graph CRUD and schema
from app.crud import crud_graph
from app.schemas.graph import GraphNodeCreate, GraphNodeUpdate as GraphNodeUpdateSchema

def create_file_record(db: Session, file_meta: FileBase, user_id: int, original_filename: str) -> File:
    """Creates a file metadata record and its corresponding graph node within a single transaction."""
    # Generate a unique filename for storage
    _, file_extension = os.path.splitext(original_filename)
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    storage_path = Path(settings.FILE_STORAGE_PATH) / unique_filename

    try:
        # 1. Prepare File object (without graph_node_id yet)
        db_file = File(
            user_id=user_id,
            filename=original_filename,
            mime_type=file_meta.mime_type,
            size=file_meta.size,
            storage_path=str(storage_path.resolve()),
        )
        
        # 2. Prepare GraphNode object 
        # (Data updated after flush)
        graph_node = GraphNode(
            user_id=user_id, 
            label=original_filename,
            node_type='file',
            position={"x": 0.0, "y": 0.0}, # Default position
            data={}
        )

        # 3. Add both to session
        db.add(db_file)
        db.add(graph_node)

        # 4. Flush to assign IDs
        db.flush()

        # 5. Link File to GraphNode and update GraphNode data
        db_file.graph_node_id = graph_node.id
        graph_node.data = {
            "original_file_id": db_file.id,
            "mime_type": db_file.mime_type,
            "size": db_file.size
        }
        db.add(db_file)
        db.add(graph_node)

        # 6. Commit the transaction
        db.commit()
        
        db.refresh(db_file)
        db.refresh(graph_node)
        print(f"Successfully created File {db_file.id} and linked GraphNode {graph_node.id}")

    except Exception as e:
        print(f"Error creating file/graph node: {e}")
        db.rollback()
        raise e

    return db_file

def get_files_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> Tuple[List[File], int]:
    """Gets file records for a specific user with total count."""
    query = db.query(File).filter(File.user_id == user_id)
    total = query.count() # Get total count
    files = query.order_by(File.created_at.desc()).offset(skip).limit(limit).all()
    return files, total

def get_file(db: Session, file_id: int, user_id: int) -> Optional[File]:
    """Gets a specific file record by ID, ensuring it belongs to the user."""
    return db.query(File).filter(File.id == file_id, File.user_id == user_id).first()

def delete_file_record(db: Session, file_id: int, user_id: int) -> Optional[File]:
    """Deletes a specific file record and its linked graph node.
    Does NOT delete the file from the filesystem here.
    Returns the deleted File object or None if not found.
    """
    db_file = get_file(db, file_id=file_id, user_id=user_id)
    if not db_file:
        return None

    # Store the linked graph_node_id before deleting the file record
    linked_graph_node_id = db_file.graph_node_id

    # Delete the file record first
    db.delete(db_file)
    db.commit()
    print(f"Deleted File record {file_id}")

    # If a linked graph node existed, delete it too
    if linked_graph_node_id is not None:
        try:
            # Call crud_graph to delete the node
            deleted_graph_node = crud_graph.delete_graph_node(db, node_id=linked_graph_node_id, user_id=user_id)
            if deleted_graph_node:
                print(f"Deleted linked GraphNode {linked_graph_node_id} for File {file_id}")
            else:
                 print(f"Could not find/delete linked GraphNode {linked_graph_node_id} for File {file_id} (already deleted?)")
        except Exception as e:
            print(f"Error deleting linked GraphNode {linked_graph_node_id} for File {file_id}: {e}")
            # Log this inconsistency

    return db_file # Return the state before deletion 

def update_file_position(
    db: Session, file_id: int, position_x: float, position_y: float, user_id: int
) -> Optional[GraphNode]: # Return updated GraphNode or None
    """Updates the position of the GraphNode associated with a specific File."""
    db_file = get_file(db, file_id=file_id, user_id=user_id)
    if not db_file:
        print(f"File {file_id} not found for user {user_id}")
        return None

    if db_file.graph_node_id is None:
        print(f"File {file_id} does not have an associated graph node.")
        return None

    graph_node_id = db_file.graph_node_id
    position_update_data = {"position": {"x": position_x, "y": position_y}}

    try:
        updated_graph_node = crud_graph.update_graph_node(
            db,
            node_id=graph_node_id,
            node_update=GraphNodeUpdateSchema(**position_update_data),
            user_id=user_id
        )
        if updated_graph_node:
            print(f"Updated position for linked GraphNode {graph_node_id} for File {file_id}")
            return updated_graph_node
        else:
             print(f"Could not find/update GraphNode {graph_node_id} linked to File {file_id}")
             return None
    except Exception as e:
        print(f"Error updating position for GraphNode {graph_node_id} linked to File {file_id}: {e}")
        db.rollback() # Rollback in case of error during update
        return None 