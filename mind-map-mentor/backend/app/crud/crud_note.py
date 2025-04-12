from sqlalchemy.orm import Session
from typing import List, Optional, Tuple

from app.models.note import Note
from app.models.graph_node import GraphNode
from app.schemas.note import NoteCreate, NoteUpdate
# Import graph CRUD and schema
from app.crud import crud_graph
from app.schemas.graph import GraphNodeCreate


def create_note(db: Session, note_in: NoteCreate, user_id: int) -> Note:
    """Creates a new note and its corresponding graph node within a single transaction."""
    note_data = note_in.model_dump()
    position_x = note_data.get('position_x', 0.0)
    position_y = note_data.get('position_y', 0.0)

    try:
        # 1. Prepare Note object (without graph_node_id yet)
        db_note = Note(
            title=note_data.get('title'),
            content=note_data.get('content'),
            position_x=position_x,
            position_y=position_y,
            user_id=user_id,
        )
        
        # 2. Prepare GraphNode object 
        # (Data will be updated after flush to get Note ID)
        graph_node = GraphNode(
             user_id=user_id, # Ensure user_id is set
             label=note_data.get('title', 'Untitled Note'),
             node_type='note',
             position={"x": position_x, "y": position_y},
             data={}
        )

        # 3. Add both to session
        db.add(db_note)
        db.add(graph_node)

        # 4. Flush to assign IDs
        db.flush()

        # 5. Link Note to GraphNode and update GraphNode data
        db_note.graph_node_id = graph_node.id
        graph_node.data = {"original_note_id": db_note.id, "content": db_note.content}
        # Mark them as modified within the session
        db.add(db_note)
        db.add(graph_node) 

        # 6. Commit the transaction
        db.commit()
        
        # Refresh instances to get updated state from DB
        db.refresh(db_note)
        db.refresh(graph_node)
        print(f"Successfully created Note {db_note.id} and linked GraphNode {graph_node.id}")
        
    except Exception as e:
        print(f"Error creating note/graph node: {e}")
        db.rollback() # Rollback the transaction on error
        raise e # Re-raise the exception

    return db_note

def get_notes_for_user(
    db: Session, user_id: int, skip: int = 0, limit: int = 100
) -> Tuple[List[Note], int]:
    """Gets notes for a specific user with total count for pagination."""
    query = db.query(Note).filter(Note.user_id == user_id)
    total = query.count() # Get total count before applying offset/limit
    notes = query.order_by(Note.updated_at.desc()).offset(skip).limit(limit).all()
    return notes, total

def get_note(db: Session, note_id: int, user_id: int) -> Optional[Note]:
    """Gets a specific note by ID, ensuring it belongs to the user."""
    return db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()

def update_note(
    db: Session, note_id: int, note_in: NoteUpdate, user_id: int
) -> Optional[Note]:
    """Updates a specific note, ensuring it belongs to the user."""
    db_note = get_note(db, note_id=note_id, user_id=user_id)
    if not db_note:
        return None

    update_data = note_in.model_dump(exclude_unset=True) # Get only provided fields
    for key, value in update_data.items():
        setattr(db_note, key, value)
        
    # If linked GraphNode exists and relevant fields changed, update it
    if db_note.graph_node_id and ('title' in update_data or 'content' in update_data or 'position_x' in update_data or 'position_y' in update_data):
        current_graph_node = None # Initialize
        try:
            current_graph_node = crud_graph.get_graph_node(db, node_id=db_note.graph_node_id, user_id=user_id)
        except Exception as e:
            print(f"Error fetching linked GraphNode {db_note.graph_node_id} for update: {e}")
            current_graph_node = None # Ensure it's None on error

        if current_graph_node: # Proceed only if node was found
            graph_node_update_data = {}
            if 'title' in update_data:
                graph_node_update_data['label'] = update_data['title']
            
            if 'position_x' in update_data or 'position_y' in update_data:
                # Start with existing position data if available, else empty dict
                new_pos_data = current_graph_node.position.copy() if current_graph_node.position else {}
                if 'position_x' in update_data:
                    new_pos_data['x'] = update_data['position_x']
                if 'position_y' in update_data:
                    new_pos_data['y'] = update_data['position_y']
                graph_node_update_data['position'] = new_pos_data 
            
            if 'content' in update_data:
                # Update content within the data payload
                graph_node_data_payload = current_graph_node.data.copy() if current_graph_node.data else {}
                graph_node_data_payload['content'] = update_data['content']
                graph_node_update_data['data'] = graph_node_data_payload
            
            # Perform the update if there's anything to change
            if graph_node_update_data:
                try:
                    from app.schemas.graph import GraphNodeUpdate as GraphNodeUpdateSchema
                    crud_graph.update_graph_node(
                        db, 
                        node_id=db_note.graph_node_id, 
                        node_update=GraphNodeUpdateSchema(**graph_node_update_data), 
                        user_id=user_id
                    )
                    print(f"Updated linked GraphNode {db_note.graph_node_id} for Note {db_note.id}")
                except Exception as e:
                    print(f"Error updating linked GraphNode {db_note.graph_node_id} for Note {db_note.id}: {e}")
        else:
             print(f"Skipping GraphNode update: Node {db_note.graph_node_id} not found or fetch error.")

    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def delete_note(db: Session, note_id: int, user_id: int) -> Optional[Note]:
    """Deletes a specific note and its linked graph node, ensuring user ownership."""
    db_note = get_note(db, note_id=note_id, user_id=user_id)
    if not db_note:
        return None

    # Store the linked graph_node_id before deleting the note
    linked_graph_node_id = db_note.graph_node_id

    # Delete the note first
    db.delete(db_note)
    db.commit()
    print(f"Deleted Note {note_id}")

    # If a linked graph node existed, delete it too
    if linked_graph_node_id is not None:
        try:
            deleted_graph_node = crud_graph.delete_graph_node(db, node_id=linked_graph_node_id, user_id=user_id)
            if deleted_graph_node:
                 print(f"Deleted linked GraphNode {linked_graph_node_id} for Note {note_id}")
            else:
                 print(f"Could not find/delete linked GraphNode {linked_graph_node_id} for Note {note_id} (already deleted?)")
        except Exception as e:
            print(f"Error deleting linked GraphNode {linked_graph_node_id} for Note {note_id}: {e}")
            # Log this inconsistency
            
    # db_note object is detached after commit, but we can return its state before deletion
    # Or simply return None or a success indicator if the object state isn't needed
    return db_note # Returning the object might be misleading as it's deleted
    # Consider returning the ID or None: return note_id or return None 