from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Any
import shutil
from pathlib import Path
import os

from app import models, crud, schemas
from app.schemas.file import FileBase, File as FileSchema, FilesPage
from app.schemas.graph import GraphNode as GraphNodeSchema
from app.api import deps
from app.core.config import settings
from pydantic import BaseModel, Field

# Placeholder for files endpoints
router = APIRouter()

# --- Pydantic model for Position Update ----
class PositionUpdate(BaseModel):
    position_x: float = Field(..., description="New X coordinate")
    position_y: float = Field(..., description="New Y coordinate")
# -----------------------------------------

@router.get("/", response_model=schemas.FilesPage, summary="List files for the current user")
def list_files(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Retrieve file records for the current user with pagination metadata."""
    files, total = crud.get_files_for_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return schemas.FilesPage(items=files, total=total)

@router.post("/upload", response_model=FileSchema, status_code=status.HTTP_201_CREATED, summary="Upload a new file")
async def upload_file(
    *, # Requires keyword args
    db: Session = Depends(deps.get_db),
    file: UploadFile = FastAPIFile(...),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Upload a file. Creates a metadata record and stores the file.
    
    Note: This basic implementation saves the file directly. For large files or production,
    consider streaming uploads or background tasks.
    """
    if not file.filename:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided")

    # Create metadata record first to get storage path
    # We might not have size/mime_type readily available here without reading the whole file
    # Let's create a temporary FileBase object
    file_meta_data = FileBase(filename=file.filename, mime_type=file.content_type, size=file.size) 

    try:
        # This generates the unique path and saves the DB record
        db_file = crud.create_file_record(
            db=db, 
            file_meta=file_meta_data, 
            user_id=current_user.id, 
            original_filename=file.filename
        )
    except Exception as e:
        print(f"Error creating file record: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create file record in database")

    storage_path = Path(db_file.storage_path) # Get the path from the created record

    # Save the actual file content
    try:
        # Ensure directory exists (should be handled by startup event, but double-check)
        storage_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Read file content and write to storage path
        # Using shutil.copyfileobj for potentially better memory usage than file.read()
        with open(storage_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"File {file.filename} saved to {storage_path}")

        # We might want to update the size in the db record now if it wasn't available before
        # TBD: Check if file.size is reliable before saving
        if db_file.size is None and hasattr(file, 'size') and file.size is not None:
             actual_size = Path(storage_path).stat().st_size # Get actual size after writing
             db_file.size = actual_size
             db.add(db_file)
             db.commit()
             db.refresh(db_file)

    except Exception as e:
        print(f"Error saving file {file.filename} to {storage_path}: {e}")
        # Rollback: Delete the database record if file saving failed
        try:
            crud.delete_file_record(db=db, file_id=db_file.id, user_id=current_user.id)
        except Exception as db_del_e:
            print(f"Failed to rollback file record creation (ID: {db_file.id}): {db_del_e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save file to storage")
    finally:
        await file.close() # Ensure the file pointer is closed

    return db_file # Return the database record (schema will exclude storage_path)

@router.get("/{file_id}", response_model=FileSchema, summary="Get a specific file metadata by ID")
async def get_file(
    file_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    # Actual logic to fetch file metadata, ensuring it belongs to current_user
    db_file = crud.get_file(db, file_id=file_id, user_id=current_user.id)
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return db_file # Return the fetched object

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a specific file")
def delete_file(
    file_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Delete a file record and the corresponding file from storage."""
    # Get the file record to find the storage path
    db_file = crud.get_file(db, file_id=file_id, user_id=current_user.id)
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    # Attempt to delete the file from storage
    try:
        file_path = Path(db_file.storage_path)
        if file_path.is_file():
            os.remove(file_path)
            print(f"Deleted file from storage: {file_path}")
        else:
            print(f"File not found in storage (already deleted?): {file_path}")
    except Exception as e:
        print(f"Error deleting file {file_path} from storage: {e}")
        # Decide if failure to delete file should prevent DB record deletion
        # For now, we'll proceed to delete the DB record anyway, but log the error.
        # In production, might want to handle this differently (e.g., background retry)

    # Delete the database record
    deleted_db_record = crud.delete_file_record(db, file_id=file_id, user_id=current_user.id)
    # No need to check deleted_db_record here as we already fetched db_file
    print(f"Deleted file record from DB: ID {file_id}")

    return # Return None/implicitly for 204

@router.get("/{file_id}/download", response_class=FileResponse, summary="Download a specific file")
def download_file(
    file_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Download a specific file owned by the current user."""
    db_file = crud.get_file(db, file_id=file_id, user_id=current_user.id)
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File metadata not found")

    file_path = Path(db_file.storage_path)
    if not file_path.is_file():
        print(f"Error: File not found in storage at {file_path}")
        # Even if DB record exists, if file is gone, it's a 404 from user perspective
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in storage")

    # Use FileResponse to stream the file
    # Set filename to the original filename stored in the DB
    return FileResponse(
        path=file_path,
        filename=db_file.filename, # Suggest original filename to browser
        media_type=db_file.mime_type or 'application/octet-stream' # Provide MIME type or default
    )

# --- NEW ENDPOINT for Position Update ---
@router.put("/{file_id}/position", response_model=GraphNodeSchema, summary="Update the position of a file node")
def update_file_node_position(
    file_id: int,
    position_in: PositionUpdate, # Use the new Pydantic model
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """Updates the position of the graph node associated with the specified file."""
    # Attempt to update the position first
    update_result = crud.update_file_position(
        db=db,
        file_id=file_id,
        position_x=position_in.position_x,
        position_y=position_in.position_y,
        user_id=current_user.id
    )
    
    # update_file_position returns the updated graph node or None
    if update_result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="File or associated graph node not found, or update failed"
        )

    # --- Re-fetch the GraphNode to ensure fresh data --- 
    # We need the graph_node_id from the file record
    db_file = crud.get_file(db, file_id=file_id, user_id=current_user.id)
    if not db_file or db_file.graph_node_id is None:
         # This shouldn't happen if update_result was successful, but check defensively
         raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Cannot find associated graph node after update."
        )
        
    fresh_graph_node = crud.get_graph_node(
        db, node_id=db_file.graph_node_id, user_id=current_user.id
    )
    
    if not fresh_graph_node:
         raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Failed to re-fetch graph node after update."
        )
    # ----------------------------------------------------

    # Return the freshly fetched graph node data
    return fresh_graph_node
# --------------------------------------

# TODO: Decide if a simple GET /{file_id} for metadata is needed, or if list is enough

# Add other placeholder CRUD operations here later (especially upload) 