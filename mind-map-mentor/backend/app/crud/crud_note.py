from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified # Import flag_modified
from typing import List, Optional, Tuple
import logging # Add logging
import math
from datetime import datetime, timedelta
from sqlalchemy import func, case, literal_column
from sqlalchemy.dialects.postgresql import TSVECTOR

from app.models.note import Note
from app.models.graph_node import GraphNode
from app.models.user import User
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

# Define constants for relationship types
RELATED_SUMMARY_EDGE_TYPE = "related_summary"
RELATED_CONTENT_EDGE_TYPE = "related_content"

# Fetch thresholds from settings
SIMILARITY_THRESHOLD_SUMMARY = settings.SIMILARITY_THRESHOLD_SUMMARY
SIMILARITY_THRESHOLD_CONTENT = settings.SIMILARITY_THRESHOLD_CONTENT

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG) # Explicitly set level for this logger

# --- Task 1: Helper Function for Score-Based Labels ---
def get_relationship_label_from_score(score: float) -> str:
    """Maps a similarity score to a descriptive relationship label."""
    if score >= 0.9:
        return "Strongly Related"
    elif score >= 0.8:
        return "Highly Related"
    elif score >= 0.7:
        return "Related"
    elif score >= 0.6:
        return "Moderately Related"
    elif score >= settings.SIMILARITY_THRESHOLD: # Use the configured threshold as the minimum
        return "Weakly Related"
    else:
        # Should ideally not happen if we only process scores >= threshold,
        # but good to have a fallback.
        return "Related" # Or perhaps None or an empty string?

# Add async here
async def _find_and_create_similar_note_edges(db: Session, new_note: Note, user_id: int, threshold: float):
    """Finds notes with similar summaries and creates edges if they meet the threshold."""
    logger.info(f"--- Entering _find_and_create_similar_note_edges for Note ID: {new_note.id} ---") # INFO level entry log
    
    # 1. Check if the new note has a summary
    logger.info(f"Checking summary for Note {new_note.id}: '{new_note.user_summary}'") # INFO level log for summary value
    if not new_note.user_summary or not new_note.user_summary.strip():
        logger.info(f"Exiting: No user_summary provided for Note {new_note.id}.") # INFO level log for exit
        return
        
    # Ensure graph_node_id exists (should always be true if called after create_note commit)
    if new_note.graph_node_id is None:
        logger.error(f"Critical: Cannot perform edge creation for Note {new_note.id} because graph_node_id is missing.")
        return

    logger.info(f"Proceeding with summary similarity search for Note {new_note.id}...") # INFO level log for proceeding
    try:
        # 2. Query for similar summaries
        similar_results = query_similar_notes(
            query_text=new_note.user_summary, # Use the summary for the query
            user_id=user_id, 
            embedding_type_filter="summary", # Filter for summary embeddings
            top_k=6 # Fetch a few potential matches
        )
        logger.info(f"Summary similarity query returned {len(similar_results)} results for Note {new_note.id}.") # INFO level log for result count
        logger.debug(f"Raw similar summary results: {similar_results}") # Keep DEBUG for full results
        
        created_edge_count = 0
        if not similar_results:
             logger.debug("No similar summaries found.")
             
        # 3. Process results (largely the same as before, but based on summary scores)
        for i, result in enumerate(similar_results):
            logger.debug(f"--- Processing similarity result {i+1}/{len(similar_results)} ---: {result}")
            score = result.get('score')
            metadata = result.get('metadata', {})
            similar_note_id = metadata.get('note_id')

            # Validate result
            if score is None or similar_note_id is None:
                logger.warning(f"Skipping invalid search result (missing score or note_id): {result}")
                continue
            
            # Don't link to self
            if similar_note_id == new_note.id:
                logger.debug(f"Skipping result {i+1}: Same note ID ({similar_note_id}).")
                continue
                
            # Log the score for every potential match before threshold check
            logger.debug(f"Summary Similarity Check: Note {new_note.id} -> Note {similar_note_id} | Score: {score:.4f}")

            # Check threshold
            if score < threshold: # Use the passed threshold
                logger.debug(f"Skipping result {i+1}: Summary score {score:.4f} is below threshold {threshold} for Note {similar_note_id}.")
                continue

            # Get the graph_node_id for the similar note (needed to create the edge)
            logger.debug(f"Attempting to fetch details for similar Note ID: {similar_note_id} (found via summary)...")
            similar_note = get_note(db, note_id=similar_note_id, user_id=user_id)
            if not similar_note or similar_note.graph_node_id is None:
                logger.warning(f"Skipping result {i+1}: Could not find valid similar note or its graph node in DB (Note ID: {similar_note_id})")
                continue
            logger.debug(f"Found similar Note {similar_note_id} with GraphNode ID: {similar_note.graph_node_id}")
            
            target_graph_node_id = similar_note.graph_node_id
            source_graph_node_id = new_note.graph_node_id # From the new note

            # TODO: Optional - Check if edge already exists between source_graph_node_id and target_graph_node_id

            # Create the edge (using the label derived from the summary score)
            try:
                relationship_label = get_relationship_label_from_score(score)
                edge_data = {'similarity_score': score, 'based_on': 'summary'} # Add context
                logger.debug(f"Preparing to create edge based on summary: Source={source_graph_node_id}, Target={target_graph_node_id}, Label='{relationship_label}', Data={edge_data}")
                edge_schema = GraphEdgeCreate(
                    source_node_id=source_graph_node_id,
                    target_node_id=target_graph_node_id,
                    label=relationship_label, 
                    data=edge_data 
                )
                try:
                    # Use the correct argument name 'edge' as defined in crud_graph.py
                    created_edge = crud_graph.create_graph_edge(db=db, edge=edge_schema, user_id=user_id)
                    if created_edge:
                        # INFO level log for successful creation remains
                        logger.info(f"Created edge between graph nodes {source_graph_node_id} and {target_graph_node_id} with label \"{relationship_label}\" (Similarity: {score:.2f})")
                        created_edge_count += 1
                    else:
                        # This case might indicate an edge already exists or other silent failure in create_graph_edge
                        logger.warning(f"crud_graph.create_graph_edge returned None for Source={source_graph_node_id}, Target={target_graph_node_id}. Edge might already exist or creation failed.")
                except Exception as create_exc:
                    logger.error(f"Exception during crud_graph.create_graph_edge call for Source={source_graph_node_id}, Target={target_graph_node_id}: {create_exc}", exc_info=True)
            except Exception as prepare_exc:
                logger.error(f"Exception preparing edge data for Source={source_graph_node_id}, Target={target_graph_node_id}: {prepare_exc}", exc_info=True)

        # INFO level log for summary remains
        logger.info(f"Finished automatic edge creation process for note {new_note.id}. Created {created_edge_count} new edge(s).")

    except Exception as e:
        logger.error(f"Error during overall automatic edge creation process for note {new_note.id}: {e}", exc_info=True)

# Change function signature to async
async def create_note(db: Session, note_in: NoteCreate, user_id: int) -> Note:
    """Creates a new note and its corresponding graph node within a single transaction, including tag generation and vector upserts."""
    logger.debug(f"create_note received data: {note_in.model_dump()}") # Log received data

    note_data = note_in.model_dump(exclude_unset=True)
    position_x = note_data.get('position_x', 0.0)
    position_y = note_data.get('position_y', 0.0)
    user_summary = note_data.get('user_summary')
    logger.info(f"Extracted user_summary from payload for create_note: '{user_summary}'") # <-- ADD THIS LOG

    db_note = None
    graph_node = None
    tags = [] # Initialize tags list

    try:
        # 1. Prepare Note and GraphNode objects
        db_note = Note(
            title=note_data.get('title'),
            content=note_data.get('content'),
            user_summary=user_summary, # Save user_summary
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

        # Log before commit
        logger.info(f"BEFORE COMMIT - db_note.user_summary: '{db_note.user_summary}' for potential note {db_note.title}")

        # Commit the note first to get an ID
        db.commit()
        
        # Log after commit, before refresh
        logger.info(f"AFTER COMMIT / BEFORE REFRESH - db_note.id: {db_note.id}, db_note.user_summary: '{db_note.user_summary}'")

        # Refresh to get the full state including defaults and generated values
        db.refresh(db_note)
        # Assuming graph_node was also added and potentially needs refreshing if linked
        if graph_node:
            db.refresh(graph_node)

        # Log after refresh
        logger.info(f"AFTER REFRESH - db_note.id: {db_note.id}, db_note.user_summary: '{db_note.user_summary}'")

        # --- Run Edge Linking *within* the main transaction block --- 
        if db_note.user_summary: # Check the refreshed db_note object
            try:
                logger.info(f"Attempting to find similar note edges for Note ID: {db_note.id} based on summary: '{db_note.user_summary}'")
                # Ensure this call has await
                await _find_and_create_similar_note_edges(
                    db=db, 
                    new_note=db_note, 
                    user_id=user_id, 
                    threshold=SIMILARITY_THRESHOLD_SUMMARY
                )
            except Exception as e:
                 logger.error(f"Error during automatic edge creation process for note {db_note.id}: {e}", exc_info=True)
                 # Decide if this error should rollback the main transaction or just be logged
                 # Currently, it's just logged.
        else:
             logger.info(f"Skipping similarity check for note {db_note.id} as db_note.user_summary is: '{db_note.user_summary}'")

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
        db.rollback() # Rollback the entire transaction
        raise e # Re-raise the exception

    # --- Post-Commit Background Tasks --- 
    if db_note and graph_node:
        # AI Tag Generation
        tags = [] # Ensure tags is initialized
        try:
            logger.info(f"Attempting to generate tags for note {db_note.id}...")
            tags = await suggest_tags_for_content(db_note.content)
            logger.info(f"Suggested tags for note {db_note.id}: {tags}")
            try:
                # Update tags (uses its own commit/rollback) 
                crud_graph.update_graph_node_tags(db=db, graph_node_id=graph_node.id, tags=tags, user_id=user_id)
                logger.info(f"Stored tags {tags} in data field for GraphNode {graph_node.id}")
            except Exception as tag_store_e:
                logger.error(f"Failed to store tags for GraphNode {graph_node.id}: {tag_store_e}", exc_info=True)
                # db.rollback() # Handled within update_graph_node_tags
        except Exception as e:
            logger.error(f"Failed to generate AI tags for note {db_note.id}: {e}", exc_info=True)

        # Vector Upsert
        try:
            logger.info(f"Attempting to upsert vectors for Note ID: {db_note.id}")
            metadata = {
                "note_id": db_note.id,
                "user_id": user_id,
                "title": db_note.title,
                "type": "note",
                "tags": tags # Use tags generated above (or empty list if failed)
            }
            upsert_document(
                note_id=db_note.id,
                text_content=db_note.content or "",
                metadata=metadata,
                summary_text=db_note.user_summary
            )
            logger.info(f"Successfully submitted note {db_note.id} content/summary for embedding and upsert.")
        except Exception as e:
            logger.error(f"Failed to submit note {db_note.id} for embedding/upsert: {e}", exc_info=True)

    # Return the created note object
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
    """Updates a specific note, handling manual tag updates, conditional AI regeneration, and dual vector upserts."""
    db_note = get_note(db, note_id=note_id, user_id=user_id)
    if not db_note:
        logger.warning(f"Update failed: Note {note_id} not found for user {user_id}.")
        return None

    graph_node = None
    if db_note.graph_node_id:
        graph_node = crud_graph.get_graph_node(db, node_id=db_note.graph_node_id, user_id=user_id)
        if not graph_node:
             logger.warning(f"Note {note_id} has graph_node_id {db_note.graph_node_id}, but GraphNode not found.")
             # Continue with note update, but tag updates won't happen

    update_data = note_in.model_dump(exclude_unset=True) 
    
    # --- Check flags before entering transaction ---
    content_updated = (
        'content' in update_data and 
        update_data['content'] != db_note.content
    )
    summary_updated = (
        'user_summary' in update_data and 
        update_data['user_summary'] != db_note.user_summary
    )
    # Check if manual tags were provided in the input
    manual_tags_provided = 'tags' in update_data
    manual_tags = update_data.get('tags') if manual_tags_provided else None

    # --- Main Update Transaction ---
    try:
        logger.info(f"Updating note {note_id}...")
        position_updated = False

        # Apply standard field updates to Note model
        for key, value in update_data.items():
            # Skip 'tags' here, handle separately below for GraphNode
            if key == 'tags':
                continue

            if key == 'content':
                # Already checked content_updated flag, just apply
                setattr(db_note, key, value)
                # Also update graph node's data cache if exists
                if graph_node and graph_node.data:
                    graph_node.data['content'] = value
                    flag_modified(graph_node, "data")
            elif key == 'position_x' and value != db_note.position_x:
                setattr(db_note, key, value)
                position_updated = True
            elif key == 'position_y' and value != db_note.position_y:
                 setattr(db_note, key, value)
                 position_updated = True
            # Apply other direct updates to Note model
            elif hasattr(db_note, key):
                setattr(db_note, key, value)
        
        # Update GraphNode related fields if graph_node exists
        if graph_node:
            # Update GraphNode position if changed
            if position_updated:
                new_pos = {"x": db_note.position_x, "y": db_note.position_y}
                if graph_node.position != new_pos:
                    graph_node.position = new_pos
                    flag_modified(graph_node, "position")
                    logger.info(f"Updating GraphNode {graph_node.id} position to {new_pos}")

            # Update GraphNode label if title changed
            if 'title' in update_data and update_data['title'] != graph_node.label:
                graph_node.label = update_data['title']
                logger.info(f"Updating GraphNode {graph_node.id} label to {graph_node.label}")
            
            # --- Task 2: Handle Manual Tags --- 
            if manual_tags_provided:
                logger.info(f"Manually updating tags for GraphNode {graph_node.id} to: {manual_tags}")
                current_data = graph_node.data if graph_node.data else {}
                current_data['tags'] = manual_tags # Overwrite existing tags
                graph_node.data = current_data
                flag_modified(graph_node, "data")
                # No need to store in `new_tags` variable, applied directly
        
        # Add potentially modified note and graph_node to session
        db.add(db_note)
        if graph_node:
            db.add(graph_node)

        # Commit the primary updates (content, title, position, manual tags etc.)
        db.commit()
        
        # Refresh instances
        db.refresh(db_note)
        if graph_node:
            db.refresh(graph_node)
        logger.info(f"Successfully committed main updates for Note {db_note.id} and GraphNode {graph_node.id if graph_node else 'N/A'}.")
        
    except Exception as e:
        logger.error(f"Error during note update main transaction: {e}", exc_info=True)
        db.rollback()
        return None # Return None if the main update fails

    # --- Conditional AI Tag Generation (Post-Commit) ---
    # Only run if content changed AND manual tags were NOT provided in this request
    ai_generated_tags = [] # Initialize for vector metadata
    if content_updated and not manual_tags_provided:
        logger.info(f"Content updated for note {note_id} and no manual tags provided. Attempting AI tag regeneration...")
        try:
            ai_generated_tags = await suggest_tags_for_content(db_note.content)
            logger.info(f"AI suggested tags for note {note_id}: {ai_generated_tags}")
            
            # Store AI Tags (Separate transaction)
            if graph_node: # Ensure we have a graph node to update
                try:
                    current_data = graph_node.data if graph_node.data else {}
                    current_data['tags'] = ai_generated_tags
                    graph_node.data = current_data
                    flag_modified(graph_node, "data")
                    
                    db.add(graph_node)
                    db.commit()
                    db.refresh(graph_node)
                    logger.info(f"Successfully stored AI generated tags {ai_generated_tags} for GraphNode {graph_node.id}")
                except Exception as store_tag_error:
                    logger.error(f"Failed to store AI generated tags for GraphNode {graph_node.id}: {store_tag_error}", exc_info=True)
                    db.rollback() # Rollback only tag storage failure
            else:
                logger.warning(f"AI tags generated for note {note_id}, but no linked graph node found to store them.")

        except Exception as tag_error:
            logger.error(f"Failed to generate AI tags for updated note {note_id}: {tag_error}", exc_info=True)
            # Continue without updating tags if AI generation fails

    # --- Post-Update Vector Store Update (if content or summary changed) ---
    if (content_updated or summary_updated) and db_note:
        logger.info(f"Content or Summary updated for note {db_note.id}. Submitting for vector update.")
        try:
            metadata = {
                "note_id": db_note.id,
                "user_id": user_id,
                "title": db_note.title,
                "type": "note",
                "tags": manual_tags if manual_tags_provided else ai_generated_tags # Include tags if available
            }
            upsert_document(
                note_id=db_note.id,
                text_content=db_note.content or "", # Ensure content is not None
                metadata=metadata,
                summary_text=db_note.user_summary # Pass current summary
            )
            logger.info(f"Successfully submitted updated note {db_note.id} content/summary for embedding and upsert.")
        except Exception as e:
            logger.error(f"Failed to submit updated note {db_note.id} for embedding/upsert: {e}", exc_info=True)

    # 8. Find similar notes and create edges (Best Effort)
    logger.info(f"Checking for post-update edge linking for Note ID: {db_note.id}")
    # Only run if summary was part of the update?
    if summary_updated:
        try:
            logger.info(f"Summary updated, attempting post-update edge check for Note ID: {db_note.id}")
            # ADD await here
            await _find_and_create_similar_note_edges(db=db, new_note=db_note, user_id=user_id, threshold=SIMILARITY_THRESHOLD_SUMMARY)
        except Exception as auto_edge_e:
            logger.error(f"Failed during post-update edge linking for note {db_note.id}: {auto_edge_e}", exc_info=True)
    else:
         logger.info(f"Summary not updated, skipping post-update edge check for Note ID: {db_note.id}")

    # Refresh the note one last time before returning
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
            # Call the modified delete_document with the note_id
            delete_document(note_id=note_id_to_delete)
            logger.info(f"Successfully submitted deletion request for vectors associated with Note ID {note_id_to_delete}.")
        except Exception as e:
            logger.error(f"Failed during vector deletion process for Note ID {note_id_to_delete}: {e}", exc_info=True)
        
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