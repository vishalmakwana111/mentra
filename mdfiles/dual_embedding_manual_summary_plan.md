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

-   [X] **1. Add `user_summary` column:**
    -   [X] Add a new column to the `Note` SQLAlchemy model:
    ```python
    user_summary: Mapped[str | None] = mapped_column(String(50), nullable=True) # Using String(50) for buffer, ensure max_length enforced elsewhere
    ```

### 3.2. Database Migration (`alembic`)

-   [X] **1. Generate Migration:**
    -   [X] Generate a new Alembic migration script: `alembic revision --autogenerate -m "Add user_summary to Note model"`
    -   [X] Review the generated script to ensure it correctly adds the `user_summary` column.
-   [X] **2. Apply Migration:**
    -   [X] Apply the migration: `alembic upgrade head`

### 3.3. Pydantic Schemas (`mind-map-mentor/backend/app/schemas/note.py`)

-   [X] **1. Add `user_summary` field:**
    -   [X] Add `user_summary` field to relevant Pydantic schemas (`NoteBase`, `NoteCreate`, `NoteUpdate`, `Note`):
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
        *(Adjusted field names and base classes according to your exact schema structure)*
        *(Added to `NoteBase`, inherited by others)*

### 3.4. Vector Store Logic (`mind-map-mentor/backend/app/ai/vectorstore.py`)

-   [X] **1. Modify `upsert_document`:**
    -   [X] Accept an optional `summary_text: Optional[str]` parameter.
    -   [X] Accept `note_id` parameter instead of `doc_id`.
    -   [X] Generate `embedding_content` from `text_content`.
    -   [X] Upsert content vector with ID `f"note_{note_id}_content"` and metadata `{"embedding_type": "content", ...other_metadata}`.
    -   [X] If `summary_text` is provided and not empty:
        -   [X] Generate `embedding_summary` from `summary_text`.
        -   [X] Upsert summary vector with ID `f"note_{note_id}_summary"` and metadata `{"embedding_type": "summary", ...other_metadata}`.
-   [X] **2. Modify `query_similar_notes` (or create a new function like `query_similar_summaries`):**
    -   [X] Add a required `embedding_type_filter: str` parameter (e.g., "content" or "summary").
    -   [X] Construct the Pinecone query filter to include `{"embedding_type": {"$eq": embedding_type_filter}}`.
    -   *(Modified existing function)*
-   [X] **3. Modify `delete_document`:**
    -   [X] Accept `note_id` instead of full `doc_id`.
    -   [X] Attempt to delete *both* potential vector IDs: `f"note_{note_id}_content"` and `f"note_{note_id}_summary"`. Handle potential errors if one doesn't exist gracefully.

### 3.5. CRUD Logic (`mind-map-mentor/backend/app/crud/crud_note.py`)

-   [X] **1. `create_note`:**
    -   [X] Accept `user_summary` from `note_in`.
    -   [X] Save `user_summary` to `db_note.user_summary`.
    -   [X] After commit, call `upsert_document` passing both `db_note.content` and `db_note.user_summary`.
-   [X] **2. `update_note`:**
    -   [X] Accept `user_summary` from `note_in`.
    -   [X] Update `db_note.user_summary` if provided in `update_data`.
    -   [X] After commit, if content or summary changed, call `upsert_document` passing both the current `db_note.content` and `db_note.user_summary`.
-   [X] **3. `_find_and_create_similar_note_edges`:**
    -   [X] Get `new_note.user_summary`.
    -   [X] **If `new_note.user_summary` is None or empty, return immediately (skip edge creation).**
    -   [X] Generate embedding for `new_note.user_summary`. *(Handled within `query_similar_notes`)*
    -   [X] Call `query_similar_notes` (or the new query function) using the summary embedding and passing `embedding_type_filter="summary"`.
    -   [X] Process results based on summary similarity scores.
-   [X] **4. `delete_note`:**
    -   [X] Call the modified `delete_document` using the `note_id`.

### 3.6. API Endpoints (`mind-map-mentor/backend/app/api/api_v1/endpoints/notes.py`)

- [X] **1. Update `POST /notes/`:**
    - [X] Update endpoint to accept `user_summary` in the request body (`NoteCreate` schema). *(Handled by schema update)*
- [X] **2. Update `PUT /notes/{note_id}`:**
    - [X] Update endpoint to accept `user_summary` in the request body (`NoteUpdate` schema). *(Handled by schema update)*
- [X] **3. Update `GET /notes/` and `GET /notes/{note_id}`:**
    - [X] Ensure endpoints return notes including the `user_summary` field (using the updated `Note` schema). *(Handled by schema update)*

## 4. Frontend Implementation Steps

### 4.1. State Management & Types (e.g., `frontend/src/stores/noteStore.ts`)

- [X] **1. Update Types:**
    - [X] Add `userSummary?: string | null` to the `Note` interface/type definition used in the store and components.
    - *(Updated top-level `Note`, `NoteNodeData`, and API `Note` types in `index.ts`)*

### 4.2. API Service (`frontend/src/services/api.ts`)

- [X] **1. Update Request Types:**
    - [X] Update request types/interfaces for `createNote` (`NoteCreatePayload`) and `updateNote` (`NoteUpdateData`) to include the optional `userSummary` field. *(Updated `NoteCreatePayload` in `api.ts` and `NoteUpdateData` in `types/index.ts`)*
- [X] **2. Update Response Types:**
    - [X] Update response types/interfaces for `createNote`, `updateNote`, `getNote`, `getNotes` to include the optional `userSummary` field. *(Handled by Step 4.1 type updates)*
- [X] **3. Verify Payload Sending:**
    - [X] Ensure the `userSummary` is passed in the request body for create/update calls in `api.ts`. *(Verified - functions pass the whole data object)*

### 4.3. UI Components (e.g., `frontend/src/components/NoteEditor.tsx`)

- [X] **1. Add Summary Input Field (Edit Modal):**
    - [X] Add a new input field (e.g., `TextInput` or `Textarea` with limited rows) for the `userSummary`. *(Added textarea to `NoteEditModal.tsx`)*
    - [X] Bind the input field's value to the corresponding state variable holding the current note's data.
- [X] **2. Add Summary Input Field (Create Modal):**
    - [X] Identify the component used for creating new notes (e.g., `CreateNoteModal.tsx` or similar).
    - [X] Add the same `userSummary` input field, state management, character counter, and placeholder as in the edit modal.
    - [X] Ensure the `userSummary` is included when calling the `createNote`
- [X] **4. Add Placeholder/Tooltip:**
    - [X] Add informative placeholder text (e.g., `Core keywords for linking...`).
- [X] **5. Add Info Icon:**
    - [X] Add an info icon (ⓘ) with a tooltip explaining the field's purpose and guidelines. *(Tooltip not added yet)*
- [X] **6. Include in Save Logic:**