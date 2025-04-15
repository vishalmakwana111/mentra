# Inline Note Content Editing Tasks

**Goal:** Allow users to edit the content of a note directly on the graph node itself (e.g., by clicking or double-clicking) without opening a modal.

## Tasks

- [X] **1. Frontend: Modify `NoteNode` Component (`NoteNode.tsx`)**
    - [X] Add state within the `NoteNode` component to track if it's currently in edit mode (e.g., `isEditing`, `setIsEditing`).
    - [X] Add state to hold the temporary edited content while editing (e.g., `editedContent`, `setEditedContent`).
    - [X] Add an event handler (e.g., `onDoubleClick` on the main node body or a specific content area) to toggle `isEditing` to `true` and initialize `editedContent` with the current node content.

- [X] **2. Frontend: Implement Edit View (`NoteNode.tsx`)**
    - [X] Conditionally render the node's content display:
        - If `isEditing` is `false`, display the note content as text (as it likely does now).
        - If `isEditing` is `true`, render an input field (e.g., `<textarea>`) instead of the static text.
    - [X] Bind the `<textarea>` value to the `editedContent` state.
    - [X] Update the `editedContent` state `onChange` of the `<textarea>`.
    - [X] Style the `<textarea>` appropriately to fit within the node boundaries.

- [X] **3. Frontend: Handle Saving (`NoteNode.tsx`)**
    - [X] Add an event handler for when editing should finish and save (e.g., `onBlur` of the `<textarea>`, or potentially `onKeyDown` for Enter/Escape).
    - [X] Inside the save handler:
        - [X] Check if the `editedContent` has actually changed compared to the original node content (`node.data.content`).
        - [X] If changed:
            - [X] Call the existing note update function/action from the store (which in turn calls the API: `PUT /notes/{note_id}`). Pass the necessary data (`note_id`, `graph_node_id` from `node.data`, and the new `content` from `editedContent`).
            - [X] Consider adding visual feedback (e.g., temporary saving indicator).
        - [X] Regardless of change, set `isEditing` back to `false`.

- [X] **4. Frontend: Store Integration & API Call Verification**
    - [X] Ensure the `NoteNode` has access to the `graphStore`'s update action (`updateNoteContent`).
    - [X] Verify the `updateNoteContent` action in `graphStore.ts` correctly calls the `updateNote` API service function with the `content` field.
    - [X] Ensure the `updateNote` API service function (`api.ts`) sends the `content` in the PUT request body.
    - [X] Ensure the backend `PUT /notes/{note_id}` endpoint (`notes.py`) and `crud_note.update_note` function handle updating the `content` field.

- [X] **5. Styling & UX**
    - [X] Ensure the editing input looks natural within the node.
    - [X] Prevent node dragging while the textarea is focused (React Flow might handle this, but verify).
    - [X] Test usability (double-click responsiveness, saving on blur/enter, escape to cancel - optional).

- [ ] **6. Update Master Task List:** Add these completed tasks to `mdfiles/master_completed_tasks.md`.  