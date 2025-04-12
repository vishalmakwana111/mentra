from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate


def create_note_for_user(db: Session, note_in: NoteCreate, user_id: int) -> Note:
    """Creates a new note for a specific user."""
    note_data = note_in.model_dump()
    # Provide default positions if not specified
    if note_data.get('position_x') is None:
        note_data['position_x'] = 0.0
    if note_data.get('position_y') is None:
        note_data['position_y'] = 0.0

    db_note = Note(**note_data, user_id=user_id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def get_notes_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Note]:
    """Gets all notes for a specific user with pagination."""
    return db.query(Note).filter(Note.user_id == user_id).offset(skip).limit(limit).all()

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

    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def delete_note(db: Session, note_id: int, user_id: int) -> Optional[Note]:
    """Deletes a specific note, ensuring it belongs to the user."""
    db_note = get_note(db, note_id=note_id, user_id=user_id)
    if not db_note:
        return None

    db.delete(db_note)
    db.commit()
    # db_note object is still available but detached after commit
    return db_note 