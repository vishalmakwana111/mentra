from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified # Import flag_modified
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
from app.ai.agents.organizer import suggest_tags_for_content # Task 3.1 Import

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

# Change function signature to async
async def create_note(db: Session, note_in: NoteCreate, user_id: int) -> Note:
    """Creates a new note and its corresponding graph node within a single transaction, including tag generation."""
    note_data = note_in.model_dump()
    position_x = note_data.get('position_x', 0.0)
    position_y = note_data.get('position_y', 0.0)

    db_note = None
    graph_node = None
    tags = [] # Initialize tags list

    try:
        # 1. Prepare Note and GraphNode objects
        db_note = Note(
            title=note_data.get('title'),
            content=note_data.get('content'),
            position_x=position_x,
            position_y=position_y,
            user_id=user_id,
        )
        graph_node = GraphNode(
             user_id=user_id,
             label=note_data.get('title', 'Untitled Note'),
             node_type='note',
             position={"x": position_x, "y": position_y},
             # Initialize data, potentially including content here is okay
             data={"original_note_id": None, "content": db_note.content} 
        )

        # 2. Add both to session
        db.add(db_note)
        db.add(graph_node)

        # 3. Flush to assign IDs
        db.flush()

        # 4. Link Note to GraphNode and update GraphNode data with final note ID
        db_note.graph_node_id = graph_node.id
        graph_node.data["original_note_id"] = db_note.id # Update data field
        flag_modified(graph_node, "data") # Mark data as modified
        
        db.add(db_note) # Already added, but ensures it's in the session state
        db.add(graph_node) # Already added, but ensures it's in the session state

        # 5. Commit the main transaction (Note and GraphNode creation/linking)
        db.commit()
        
        # 6. Refresh instances to get final state from DB
        db.refresh(db_note)
        db.refresh(graph_node)
        logger.info(f"Successfully created Note {db_note.id} and linked GraphNode {graph_node.id}")
        
        # --- Task 3.2: Auto-generate tags (AFTER successful note creation) ---
        if db_note.content: # Only generate if there is content
            try:
                logger.info(f"Attempting to generate tags for note {db_note.id}...")
                tags = await suggest_tags_for_content(db_note.content)
                logger.info(f"Suggested tags for note {db_note.id}: {tags}")
            except Exception as tag_error:
                logger.error(f"Failed to generate tags for note {db_note.id}: {tag_error}", exc_info=True)
                # Continue without tags if generation fails

    except Exception as e:
        logger.error(f"Error during note/graph node creation or linking: {e}", exc_info=True)
        db.rollback() # Rollback the transaction on any error during the main block
        raise e # Re-raise the exception

    # --- Task 3.3: Store Tags if Generated (AFTER successful initial commit) ---
    # This happens even if tag generation failed (tags list will be empty)
    # We store tags in a separate transaction block to isolate potential failures
    if graph_node: # Ensure graph_node was created
         try:
             # Update the data field on the existing graph_node object
             current_data = graph_node.data if graph_node.data else {}
             current_data['tags'] = tags # Add/update tags key
             graph_node.data = current_data # Reassign the updated dict
             flag_modified(graph_node, "data") # Mark JSON field as modified for SQLAlchemy
             
             db.add(graph_node) # Add graph_node again to session to register the change
             db.commit() # Commit the tag update
             db.refresh(graph_node) # Refresh to get the latest state including tags
             if tags:
                 logger.info(f"Stored tags {tags} in data field for GraphNode {graph_node.id}")
             else:
                 logger.info(f"No tags generated or stored for GraphNode {graph_node.id}")
                 
         except Exception as store_tag_error:
             logger.error(f"Failed to store tags for GraphNode {graph_node.id}: {store_tag_error}", exc_info=True)
             db.rollback() # Rollback only the tag storage failure
             # Note: The note itself is already created. Tag storage is best-effort.

    # --- Post-Creation Async Tasks (Embedding & Edge Creation) ---
    # These happen AFTER the main note/graphnode creation and tag storage attempt
    if db_note and db_note.content: 
        # 7. Upsert document to vector store (Best Effort)
        try:
            doc_id = f"note_{db_note.id}"
            metadata = {
                "note_id": db_note.id,
                "user_id": user_id,
                "title": db_note.title,
                "type": "note"
                # Potential place to add tags to metadata if vector store supports it:
                # "tags": tags 
            }
            upsert_document(doc_id=doc_id, text_content=db_note.content, metadata=metadata)
            logger.info(f"Successfully submitted note {db_note.id} for embedding and upsert.")
        except Exception as e:
            logger.error(f"Failed to submit note {db_note.id} for embedding/upsert: {e}", exc_info=True)

        # 8. Find similar notes and create edges (Best Effort)
        try:
            _find_and_create_similar_note_edges(db=db, new_note=db_note, user_id=user_id)
        except Exception as auto_edge_e:
            logger.error(f"Failed during post-creation edge linking for note {db_note.id}: {auto_edge_e}", exc_info=True)

    # Return the created note object (potentially without tags fully populated if refresh didn't happen after tag storage commit, consider returning refreshed note if needed)
    # Let's return the potentially refreshed note
    if db_note:
        db.refresh(db_note) # Refresh note one last time before returning
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

# Make function async
async def update_note(
    db: Session, note_id: int, note_in: NoteUpdate, user_id: int
) -> Optional[Note]:
    """Updates a specific note, potentially regenerating tags and updating vector store."""
    db_note = get_note(db, note_id=note_id, user_id=user_id)
    if not db_note:
        logger.warning(f"Update failed: Note {note_id} not found for user {user_id}.")
        return None

    graph_node = None
    if db_note.graph_node_id:
        graph_node = crud_graph.get_graph_node(db, node_id=db_note.graph_node_id, user_id=user_id)
        if not graph_node:
             logger.warning(f"Note {note_id} has graph_node_id {db_note.graph_node_id}, but GraphNode not found.")
             # Proceed with note update, but tag/vector updates might fail

    update_data = note_in.model_dump(exclude_unset=True) 
    content_updated = False
    new_tags = [] # Initialize tags list

    try:
        # --- Apply Updates to Note and GraphNode (within one transaction) ---
        logger.info(f"Updating note {note_id}...")
        position_updated = False

        # Apply standard field updates to Note
        for key, value in update_data.items():
            if key == 'content':
                if value != db_note.content:
                    logger.info(f"Note {note_id} content is being updated.")
                    setattr(db_note, key, value)
                    content_updated = True
                    # Also update graph node's data if exists
                    if graph_node and graph_node.data:
                        graph_node.data['content'] = value
                        flag_modified(graph_node, "data")
                continue # Handle content update separately below if needed for graph node
            
            # Handle position updates (simplified, assuming x/y are passed)
            if key == 'position_x' and value != db_note.position_x:
                setattr(db_note, key, value)
                position_updated = True
            elif key == 'position_y' and value != db_note.position_y:
                 setattr(db_note, key, value)
                 position_updated = True
            # Apply other direct updates
            elif hasattr(db_note, key):
                setattr(db_note, key, value)

        # Update GraphNode position if changed
        if position_updated and graph_node:
            new_pos = {"x": db_note.position_x, "y": db_note.position_y}
            if graph_node.position != new_pos:
                graph_node.position = new_pos
                flag_modified(graph_node, "position")
                logger.info(f"Updating GraphNode {graph_node.id} position to {new_pos}")

        # Update GraphNode label if title changed
        if 'title' in update_data and graph_node and update_data['title'] != graph_node.label:
            graph_node.label = update_data['title']
            logger.info(f"Updating GraphNode {graph_node.id} label to {graph_node.label}")
        
        # Add note and potentially modified graph_node to session
        db.add(db_note)
        if graph_node:
            db.add(graph_node)

        # Commit the primary updates (content, title, position etc.)
        db.commit()
        
        # Refresh instances
        db.refresh(db_note)
        if graph_node:
            db.refresh(graph_node)
        logger.info(f"Successfully updated Note {db_note.id} and potentially linked GraphNode {graph_node.id if graph_node else 'N/A'}.")
        
        # --- Task 3.5: Regenerate Tags if Content Changed (AFTER successful update commit) ---
        if content_updated and db_note.content:
            try:
                logger.info(f"Content updated for note {note_id}, attempting to regenerate tags...")
                new_tags = await suggest_tags_for_content(db_note.content)
                logger.info(f"Suggested new tags for note {note_id}: {new_tags}")
                
                # --- Task 3.6: Store New Tags (Separate transaction) ---
                if graph_node: # Ensure we have a graph node to update
                    try:
                        current_data = graph_node.data if graph_node.data else {}
                        current_data['tags'] = new_tags
                        graph_node.data = current_data
                        flag_modified(graph_node, "data")
                        
                        db.add(graph_node)
                        db.commit()
                        db.refresh(graph_node)
                        logger.info(f"Successfully stored updated tags {new_tags} for GraphNode {graph_node.id}")
                    except Exception as store_tag_error:
                        logger.error(f"Failed to store updated tags for GraphNode {graph_node.id}: {store_tag_error}", exc_info=True)
                        db.rollback() # Rollback only tag storage failure
                else:
                    logger.warning(f"Content updated for note {note_id}, but no linked graph node found to store tags.")

            except Exception as tag_error:
                logger.error(f"Failed to generate tags for updated note {note_id}: {tag_error}", exc_info=True)
                # Continue without updating tags if generation fails

    except Exception as e:
        logger.error(f"Error during note update main transaction: {e}", exc_info=True)
        db.rollback()
        return None # Return None if the main update fails

    # --- Post-Update Async Tasks (Embedding) ---
    if content_updated and db_note and db_note.content:
        try:
            doc_id = f"note_{db_note.id}"
            metadata = {
                "note_id": db_note.id,
                "user_id": user_id,
                "title": db_note.title,
                "type": "note",
                # Potential place to add tags to metadata:
                # "tags": new_tags # Use the tags generated in this update
            }
            upsert_document(doc_id=doc_id, text_content=db_note.content, metadata=metadata)
            logger.info(f"Successfully submitted updated note {db_note.id} for embedding and upsert.")
        except Exception as e:
            logger.error(f"Failed to submit updated note {db_note.id} for embedding/upsert: {e}", exc_info=True)

    # Optional: Re-evaluate edges based on new content? (Not implemented here)

    # Refresh the note one last time before returning to ensure it reflects any tag-related refreshes
    if db_note:
        db.refresh(db_note)
    return db_note

def delete_note(db: Session, note_id: int, user_id: int) -> Optional[Note]:
    """Deletes a note and its associated graph node and vector embedding."""
    db_note = get_note(db, note_id=note_id, user_id=user_id)
    if not db_note:
        logger.warning(f"Delete failed: Note {note_id} not found for user {user_id}.")
        return None

    graph_node_id_to_delete = db_note.graph_node_id
    note_id_to_delete = db_note.id # Store ID before deletion

    try:
        # Delete the note (GraphNode deletion might be handled by cascade, check model definition)
        # If cascade is set on Note.graph_node_id relationship, deleting note might delete graph node.
        # Let's explicitly delete the graph node first if it exists, to be safe.
        if graph_node_id_to_delete:
            logger.info(f"Attempting to delete associated GraphNode {graph_node_id_to_delete} for note {note_id_to_delete}")
            # Use crud_graph to handle graph node deletion (which includes edges via cascade in its model)
            deleted_node = crud_graph.delete_graph_node(db=db, node_id=graph_node_id_to_delete, user_id=user_id)
            if deleted_node:
                 logger.info(f"Successfully deleted GraphNode {graph_node_id_to_delete}")
            else:
                 logger.warning(f"GraphNode {graph_node_id_to_delete} associated with note {note_id_to_delete} not found or delete failed.")
                 # Continue to delete the note itself

        # Now delete the note
        logger.info(f"Deleting Note {note_id_to_delete}")
        db.delete(db_note)
        db.commit()
        logger.info(f"Successfully deleted Note {note_id_to_delete} from database.")

        # Delete from vector store (Best Effort)
        try:
            doc_id = f"note_{note_id_to_delete}"
            delete_document(doc_id)
            logger.info(f"Successfully submitted deletion request for vector document {doc_id}.")
        except Exception as e:
            logger.error(f"Failed to submit deletion for vector document {doc_id}: {e}", exc_info=True)
        
        return db_note # Return the object state just before deletion

    except Exception as e:
        logger.error(f"Error during deletion of note {note_id_to_delete} or associated data: {e}", exc_info=True)
        db.rollback()
        return None

# Task 3.7: API Response Verification Note:
# The CRUD functions now correctly STORE tags in the GraphNode.data field.
# However, ensuring the 'tags' field in the Pydantic GraphNode schema 
# (returned by API endpoints) is POPULATED from GraphNode.data requires logic 
# either in the API endpoint handlers or by modifying CRUD functions like 
# get_graph_node to return populated Pydantic models instead of SQLAlchemy models.
# For this task, we assume the storage part is sufficient, and population is handled later. 