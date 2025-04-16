# Feature Implementation Plan: Dual Embedding with Manual User Summary

## 1. Goal

To improve the reliability of automatic edge creation between notes by using embeddings of short, user-provided summaries, while maintaining high-quality RAG performance using embeddings of the full note content. This addresses the issue of low similarity scores observed when comparing embeddings of longer paragraph content directly.

## 2. Approach Summary

-   **New Field:** Add a manual `user_summary` field to each Note (max 30 chars).
-   **Dual Embeddings:** For each Note, generate and store two separate embeddings in Pinecone:
    -   One for the full `note.content`.
    -   One for the `user_summary`.
    -   Use distinct metadata (`embedding_type: "content"` vs `embedding_type: "summary"`) to differentiate them.
-   **Automatic Edge Creation:** Base automatic edge decisions solely on the similarity score between the `user_summary` embeddings of different notes. Notes without a summary will not participate in automatic edge creation.
-   **RAG Chat:** Continue using the `note.content` embeddings for finding relevant context to answer user queries.
-   **User Guidance:** Provide clear UI cues (placeholders, tooltips, char limits) to help users understand and effectively use the `user_summary` field.

## 3. Backend Implementation Steps

### 3.1. Database Model (`mind-map-mentor/backend/app/models/note.py`)

-   [ ] Add a new column to the `Note` SQLAlchemy model:
    ```python
    user_summary: Mapped[str | None] = mapped_column(String(50), nullable=True) # Using String(50) for buffer, ensure max_length enforced elsewhere
    ```

### 3.2. Database Migration (`alembic`)

-   [ ] Generate a new Alembic migration script: `alembic revision --autogenerate -m "Add user_summary to Note model"`
-   [ ] Review the generated script to ensure it correctly adds the `user_summary` column.
-   [ ] Apply the migration: `alembic upgrade head`

### 3.3. Pydantic Schemas (`mind-map-mentor/backend/app/schemas/note.py`)

-   [ ] Add `user_summary` field to relevant Pydantic schemas:
    ```python
    from pydantic import Field
    # ... other imports

    # In NoteBase or directly in Create/Update/Read schemas as needed
    user_summary: Optional[str] = Field(None, max_length=30)

    # Ensure it's in NoteCreate
    class NoteCreate(NoteBase):
        user_summary: Optional[str] = Field(None, max_length=30)
        # ... other fields

    # Ensure it's in NoteUpdate
    class NoteUpdate(NoteBase):
        user_summary: Optional[str] = Field(None, max_length=30) # Make optional on update
        # ... other fields set to Optional

    # Ensure it's in the main Note schema (for responses)
    class Note(NoteBase):
        id: int
        owner_id: int # Assuming you call user_id owner_id here
        graph_node_id: Optional[int] = None
        created_at: datetime
        updated_at: datetime
        user_summary: Optional[str] = Field(None, max_length=30)

        class Config:
            orm_mode = True # or from_attributes = True for Pydantic v2
    ```
    *(Adjust field names and base classes according to your exact schema structure)*

### 3.4. Vector Store Logic (`mind-map-mentor/backend/app/ai/vectorstore.py`)

-   [ ] Modify `upsert_document`:
    -   Accept an optional `summary_text: Optional[str]` parameter.
    -   Generate `embedding_content` from `text_content`.
    -   Upsert content vector with ID `f"note_{note_id}_content"` and metadata `{"embedding_type": "content", ...other_metadata}`.
    -   If `summary_text` is provided and not empty:
        -   Generate `embedding_summary` from `summary_text`.
        -   Upsert summary vector with ID `f"note_{note_id}_summary"` and metadata `{"embedding_type": "summary", ...other_metadata}`.
-   [ ] Modify `query_similar_notes` (or create a new function like `query_similar_summaries`):
    -   Add a required `embedding_type_filter: str` parameter (e.g., "content" or "summary").
    -   Construct the Pinecone query filter to include `{"embedding_type": {"$eq": embedding_type_filter}}`.
-   [ ] Modify `delete_document`:
    -   Accept `note_id` instead of full `doc_id`.
    -   Attempt to delete *both* potential vector IDs: `f"note_{note_id}_content"` and `f"note_{note_id}_summary"`. Handle potential errors if one doesn't exist gracefully.

### 3.5. CRUD Logic (`mind-map-mentor/backend/app/crud/crud_note.py`)

-   [ ] `create_note`:
    -   Accept `user_summary` from `note_in`.
    -   Save `user_summary` to `db_note.user_summary`.
    -   After commit, call `upsert_document` passing both `db_note.content` and `db_note.user_summary`.
-   [ ] `update_note`:
    -   Accept `user_summary` from `note_in`.
    *   Update `db_note.user_summary` if provided in `update_data`.
    *   After commit, if content or summary changed, call `upsert_document` passing both the current `db_note.content` and `db_note.user_summary`.
-   [ ] `_find_and_create_similar_note_edges`:
    *   Get `new_note.user_summary`.
    *   **If `new_note.user_summary` is None or empty, return immediately (skip edge creation).**
    *   Generate embedding for `new_note.user_summary`.
    *   Call `query_similar_notes` (or the new query function) using the summary embedding and passing `embedding_type_filter="summary"`.
    *   Process results based on summary similarity scores.
-   [ ] `delete_note`:
    *   Call the modified `delete_document` using the `note_id`.

### 3.6. API Endpoints (`mind-map-mentor/backend/app/api/api_v1/endpoints/notes.py`)

-   [ ] Update `POST /notes/` endpoint to accept `user_summary` in the request body (`NoteCreate` schema).
-   [ ] Update `PUT /notes/{note_id}` endpoint to accept `user_summary` in the request body (`NoteUpdate` schema).
-   [ ] Ensure `GET /notes/` and `GET /notes/{note_id}` endpoints return notes including the `user_summary` field (using the updated `Note` schema).

## 4. Frontend Implementation Steps

### 4.1. State Management & Types (e.g., `frontend/src/stores/noteStore.ts`)

-   [ ] Add `userSummary?: string | null` to the `Note` interface/type definition used in the store and components.

### 4.2. API Service (`frontend/src/services/api.ts`)

-   [ ] Update request types/interfaces for `createNote` and `updateNote` to include the optional `userSummary` field.
-   [ ] Update response types/interfaces for `createNote`, `updateNote`, `getNote`, `getNotes` to include the optional `userSummary` field.
-   [ ] Ensure the `userSummary` is passed in the request body for create/update calls.

### 4.3. UI Components (e.g., `frontend/src/components/NoteEditor.tsx`)

-   [ ] Add a new input field (e.g., `TextInput` or `Textarea` with limited rows) for the `userSummary`.
-   [ ] Bind the input field's value to the corresponding state variable holding the current note's data.
-   [ ] Implement client-side validation for the 30-character limit.
-   [ ] Display a character counter (e.g., `currentLength / 30`).
-   [ ] Add informative placeholder text (e.g., `Core keywords for linking...`).
-   [ ] Add an info icon (ⓘ) with a tooltip explaining the field's purpose and guidelines.
-   [ ] Ensure the `userSummary` value from the state is included when calling the `updateNote` API service function on save.

## 5. Testing Plan

-   [ ] **CRUD:** Create, read, update, delete notes with and without summaries. Verify data persistence in DB and API responses. Verify character limit enforcement.
-   [ ] **Vector Store:** Use Pinecone console/API to verify that two vectors (`_content`, `_summary`) are created per note (if summary exists) with correct metadata (`embedding_type`). Verify deletion removes both.
-   [ ] **Edge Creation:**
    -   Create Note A (no summary). Create Note B (summary "apple pie"). Create Note C (summary "apple tart"). -> Expect no edges involving A. Expect potential edge B-C if summaries are similar enough.
    -   Create Note D (summary "vector db"). Create Note E (summary "RAG system"). Create Note F (summary "banana bread"). -> Expect potential edge D-E (check score), no edges involving F.
    -   Verify edge creation respects the score threshold based on *summary* similarity.
-   [ ] **RAG:** Perform RAG queries related to the *full content* of notes. Verify that relevant notes are retrieved based on content similarity and that RAG answers are correct, confirming it's using the content embeddings for search.
-   [ ] **UI:** Test the summary input field, character counter, tooltip, and data binding.

## 6. Future Considerations

-   Strategy for handling existing notes without summaries.
-   Possibility of using AI to suggest or backfill summaries later.
-   Monitoring Pinecone costs. 