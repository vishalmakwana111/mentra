from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
import logging # Add logging

from app.models.note import Note
from app.models.graph_node import GraphNode
from app.schemas.note import NoteCreate, NoteUpdate
# Import graph CRUD and schema
from app.crud import crud_graph
from app.schemas.graph import GraphNodeCreate, GraphEdgeCreate

# Import AI modules
from app.ai.embeddings import generate_embedding
from app.ai.vectorstore import upsert_document, delete_document
from app.core.config import settings # Import settings for threshold
from app.ai.vectorstore import query_similar_notes # Need this for similarity search

logger = logging.getLogger(__name__)


def _find_and_create_similar_note_edges(db: Session, new_note: Note, user_id: int):
    """Finds similar notes and creates edges if they meet the threshold."""
    if not new_note.content or new_note.graph_node_id is None:
        logger.warning(f"Skipping edge creation for note {new_note.id}: Missing content or graph_node_id.")
        return

    logger.info(f"Finding similar notes for newly created note {new_note.id} for user {user_id}...")
    try:
        # Pass user_id to query_similar_notes for filtering
        similar_results = query_similar_notes(query_text=new_note.content, user_id=user_id, top_k=6) 
        
        created_edge_count = 0
        for result in similar_results:
            score = result.get('score')
            metadata = result.get('metadata', {})
            similar_note_id = metadata.get('note_id')

            # Validate result
            if score is None or similar_note_id is None:
                logger.warning(f"Skipping invalid search result: {result}")
                continue
            
            # Don't link to self
            if similar_note_id == new_note.id:
                continue

            # Check threshold
            if score < settings.SIMILARITY_THRESHOLD:
                logger.debug(f"Skipping note {similar_note_id} (score {score:.4f} < {settings.SIMILARITY_THRESHOLD})")
                continue

            # Get the graph_node_id for the similar note
            similar_note = get_note(db, note_id=similar_note_id, user_id=user_id)
            if not similar_note or similar_note.graph_node_id is None:
                logger.warning(f"Could not find valid similar note or its graph node (Note ID: {similar_note_id})")
                continue
            
            target_graph_node_id = similar_note.graph_node_id
            source_graph_node_id = new_note.graph_node_id # From the new note

            # TODO: Optional - Check if edge already exists between source_graph_node_id and target_graph_node_id

            # Create the edge
            try:
                edge_schema = GraphEdgeCreate(
                    source_node_id=source_graph_node_id,
                    target_node_id=target_graph_node_id,
                    label=f"related (score: {score:.2f})"
                )
                try:
                    # Use the correct argument name 'edge' as defined in crud_graph.py
                    created_edge = crud_graph.create_graph_edge(db=db, edge=edge_schema, user_id=user_id)
                    if created_edge:
                        logger.info(f"Created edge between graph nodes {source_graph_node_id} and {target_graph_node_id} (Similarity: {score:.2f})")
                        created_edge_count += 1
                    else:
                        logger.warning(f"Edge between {source_graph_node_id} and {target_graph_node_id} might already exist or failed creation silently.")
                except Exception as e:
                    logger.error(f"Failed to create edge between {source_graph_node_id} and {target_graph_node_id}: {e}", exc_info=True)
            except Exception as e:
                logger.error(f"Failed to create edge between {source_graph_node_id} and {target_graph_node_id}: {e}", exc_info=True)

        logger.info(f"Finished automatic edge creation for note {new_note.id}. Created {created_edge_count} new edge(s).")

    except Exception as e:
        logger.error(f"Error during automatic edge creation for note {new_note.id}: {e}")

def create_note(db: Session, note_in: NoteCreate, user_id: int) -> Note:
    """Creates a new note and its corresponding graph node within a single transaction."""
    note_data = note_in.model_dump()
    position_x = note_data.get('position_x', 0.0)
    position_y = note_data.get('position_y', 0.0)

    db_note = None # Initialize

    try:
        # 1. Prepare Note object
        db_note = Note(
            title=note_data.get('title'),
            content=note_data.get('content'), # Content is now required by schema
            position_x=position_x,
            position_y=position_y,
            user_id=user_id,
        )
        
        # 2. Prepare GraphNode object
        graph_node = GraphNode(
             user_id=user_id,
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
        db.add(db_note)
        db.add(graph_node)

        # 6. Commit the transaction
        db.commit()
        
        # 7. Refresh instances
        db.refresh(db_note)
        db.refresh(graph_node)
        logger.info(f"Successfully created Note {db_note.id} and linked GraphNode {graph_node.id}")
        
    except Exception as e:
        logger.error(f"Error creating note/graph node in DB: {e}")
        db.rollback() # Rollback the transaction on error
        raise e # Re-raise the exception

    # 8. Upsert document to vector store (AFTER successful DB commit)
    if db_note and db_note.content: # Ensure note was created and content exists
        try:
            # vector = generate_embedding(db_note.content) # No longer generate embedding here
            doc_id = f"note_{db_note.id}"
            metadata = {
                "note_id": db_note.id,
                "user_id": user_id,
                "title": db_note.title,
                "type": "note"
            }
            # Pass text content directly to the new upsert function
            upsert_document(doc_id=doc_id, text_content=db_note.content, metadata=metadata)
            logger.info(f"Successfully submitted note {db_note.id} for embedding and upsert.")
        except Exception as e:
            # Log error but don't fail the whole operation as DB part succeeded
            logger.error(f"Failed to submit note {db_note.id} for embedding/upsert: {e}")

    # 9. Find similar notes and create edges (AFTER successful DB commit and upsert attempt)
    if db_note:
        try:
            # Call the new helper function
            _find_and_create_similar_note_edges(db=db, new_note=db_note, user_id=user_id)
        except Exception as auto_edge_e:
             # Log error but don't fail the main note creation response
            logger.error(f"Failed during post-creation edge linking for note {db_note.id}: {auto_edge_e}")

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

    update_data = note_in.model_dump(exclude_unset=True) 
    # Check if content is being updated BEFORE applying changes
    content_updated = (
        'content' in update_data and 
        update_data['content'] != db_note.content
    )

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

    # --- DB Commit ---
    try:
        db.add(db_note)
        db.commit()
        db.refresh(db_note)
        logger.info(f"Successfully updated note {note_id} in database.")
    except Exception as db_e:
        logger.error(f"Database error during update of note {note_id}: {db_e}", exc_info=True)
        db.rollback()
        # Decide if we should attempt vector update even if DB commit failed?
        # Probably not, let's return None here.
        return None

    # --- Vector Store Update (if content changed AND DB commit succeeded) ---
    if content_updated and db_note.content: # Check if content was updated and exists
        try:
            # Use the correct ID format (consistent with create)
            doc_id = f"note_{db_note.id}"
            metadata = {
                "note_id": db_note.id,
                "user_id": user_id,
                "title": db_note.title,
                "type": "note"
            }
            # Call upsert with the NEW content
            upsert_document(doc_id=doc_id, text_content=db_note.content, metadata=metadata)
            logger.info(f"Successfully submitted updated note {db_note.id} for embedding/upsert.")
        except Exception as vs_e:
            # Log error but don't fail the whole operation as DB part succeeded
            logger.error(f"Failed to submit updated note {db_note.id} for embedding/upsert: {vs_e}")
    elif content_updated and not db_note.content:
        # If content was updated to be empty/null, delete the vector
        try:
            doc_id = f"note_{db_note.id}"
            delete_document(doc_id=doc_id)
            logger.info(f"Deleted vector for note {db_note.id} as content was removed.")
        except Exception as vs_del_e:
            logger.error(f"Failed to delete vector for note {db_note.id} after content removal: {vs_del_e}")

    return db_note

def delete_note(db: Session, note_id: int, user_id: int) -> Optional[Note]:
    """Deletes a specific note and its linked graph node, ensuring it belongs to the user."""
    db_note = get_note(db, note_id=note_id, user_id=user_id)
    if not db_note:
        logger.warning(f"Attempted to delete non-existent or unauthorized note {note_id} for user {user_id}")
        return None

    graph_node_id_to_delete = db_note.graph_node_id # Store ID before deleting note
    doc_id_to_delete = f"note_{db_note.id}" # Store vector doc ID

    try:
        # Delete the Note from the database
        db.delete(db_note)
        logger.info(f"Deleted note {note_id} from database.")
        
        # If a GraphNode was linked, delete it too
        if graph_node_id_to_delete is not None:
            deleted_node = crud_graph.delete_graph_node(db, node_id=graph_node_id_to_delete, user_id=user_id)
            if deleted_node:
                logger.info(f"Deleted linked graph node {graph_node_id_to_delete}.")
            else:
                logger.warning(f"Could not delete linked graph node {graph_node_id_to_delete} (may not exist or auth issue).")
        
        # Commit DB changes (note and potential graph node deletion)
        db.commit()
        logger.info(f"Committed DB deletions for note {note_id}.")

    except Exception as db_e:
        logger.error(f"Database error during deletion of note {note_id}: {db_e}", exc_info=True)
        db.rollback()
        # Do not proceed with vector deletion if DB delete failed
        return None 

    # Delete the vector from Pinecone (AFTER successful DB commit)
    try:
        delete_document(doc_id=doc_id_to_delete)
        logger.info(f"Successfully deleted vector {doc_id_to_delete} from Pinecone.")
    except Exception as vs_e:
        # Log error, but the main deletion was successful
        logger.error(f"Failed to delete vector {doc_id_to_delete} for note {note_id}: {vs_e}")

    return db_note # Return the deleted note object (transient state) 