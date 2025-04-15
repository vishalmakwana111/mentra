# Fixed Note Tags Tasks

**Goal:** Allow users to manually add, edit, and remove a list of fixed tags associated with a specific note, distinct from (or potentially overwriting) AI-generated tags.

---

## Phase 1: Backend Setup

*Note: This assumes tag storage (e.g., `tags: ARRAY(String)` on `Note` model or `tags` key in `GraphNode.data`) is being implemented as part of `ai_organizer_agent_tasks.md`. These tasks focus on the manual manipulation API.* 

- [X] **1. Verify/Update Note Update Schema:**
    - [X] In `schemas/note.py`, ensure the `NoteUpdate` schema includes `tags: List[str] | None = None`. This allows the API to receive a list of tags for updating.

- [X] **2. Verify/Update Note CRUD Function:**
    - [X] In `crud/crud_note.py`, review the `update_note` function.
    - [X] Ensure it correctly handles the `tags` field if present in the input `note_in.model_dump(exclude_unset=True)`.
    - [X] Specifically, ensure that if `tags` is provided in the update payload, the function explicitly sets `db_note.tags = update_data['tags']` (or updates `graph_node.data['tags']` if using JSONB storage). This should overwrite any previous tags (including AI-generated ones) for that note.
    - [X] Confirm this update happens *before* the potential AI tag regeneration logic (if content also changed) to ensure manual tags take precedence if provided in the same update request.

- [X] **3. Verify Note Update API Endpoint:**
    - [X] In `endpoints/notes.py`, confirm the `PUT /notes/{note_id}` endpoint correctly uses the `NoteUpdate` schema for input (`note_in: schemas.NoteUpdate`).
    - [X] Confirm the endpoint returns the updated `Note` object (including the potentially updated `tags` field) using the `Note` schema as `response_model`.

---

## Phase 2: Frontend Implementation

### **Task 4: Design Tag Editing UI/UX**
- [X] **4.1. Choose Interaction Method:**
    - *Options:*
        - A: Add a dedicated Tag section/input within the `NoteEditModal` (Requires bringing back/using the modal for edits).
        - B: Implement inline tag editing below the content in `NoteNode.tsx` (Triggered by clicking the tag area or an edit icon next to tags).
        - C: Add a Tag editing section to the `SidePanel` that appears when a node is selected.
    - *Decision Made:* **Option B** (Inline editing in NoteNode.tsx)

### **Task 5: Implement Tag Editing Component**
- [X] **5.1. Create/Modify Component:** Based on the decision in 4.1, create or modify the relevant component (`NoteEditModal.tsx`, `NoteNode.tsx`, or a new component for the `SidePanel`).
- [X] **5.2. Input Element:** Add an input element suitable for tags (e.g., a text input where users type comma-separated tags, or a more advanced tag input library).
- [X] **5.3. State Management (Local):** Add local state within the component to manage the current list of tags being edited.
- [X] **5.4. Initialization:** When editing starts (modal opens, inline edit triggers), initialize the local tag state with the note's current tags (fetched from `node.data.tags`).
- [X] **5.5. Update Logic:** Handle user input to add/remove tags from the local state.
    - *If simple text input:* Parse comma-separated values, trim whitespace.
    - *If tag library:* Use the library's methods.

### **Task 6: Implement Save Logic**
- [X] **6.1. Save Trigger:** Define how the save is triggered (e.g., Save button in modal, `onBlur` or Enter key for inline).
- [X] **6.2. Save Handler:** Create a `handleSaveTags` function.
- [X] **6.3. Get Data:** Inside the handler, get the current `original_note_id` (from `node.data`) and the list of tags from the component's local state.
- [X] **6.4. Compare Changes:** Compare the edited list of tags with the original list from `node.data.tags` to see if changes were made.
- [X] **6.5. API Call:**
    - If tags have changed:
        - Import the `updateNote` API service function from `api.ts`.
        - Call `updateNote(originalNoteId, { tags: editedTagsList })`.
        - Wrap in `try...catch` for error handling.
    - If no changes, skip the API call.
- [X] **6.6. Close/Reset UI:** After the attempt (success or fail), close the modal or exit the inline edit mode.

### **Task 7: Update Frontend Store**
- [X] **7.1. Verify Store Action:** Ensure the `updateNoteContent` or a similar action in `graphStore.ts` can handle receiving `tags` from the API response and update the local node state correctly via `updateNodeData`.
    - *Alternatively, if `updateNote` API doesn't return the full note:* After a successful `updateNote` call in the tag editing component, manually call `graphStore.getState().updateNodeData(reactFlowNodeId, { tags: editedTagsList })` to update the local state.
- [X] **7.2. State Update Call:** In the `handleSaveTags` function (Task 6.6), after a *successful* API call, ensure the `graphStore` state is updated (either automatically via the store action handling the API response, or manually as described above).

### **Task 8: Tag Display**
- [X] **8.1. Verify Display:** Confirm that the tag display logic implemented in `NoteNode.tsx` (as part of the AI Organizer tasks) correctly shows the manually set tags after they are saved and the store is updated.

### **Task 9: User Feedback**
- [X] **9.1. Import Toast:** Import `toast` in the tag editing component.
- [X] **9.2. Add Toasts:** Add `toast.success('Tags updated')` on successful save and `toast.error('Failed to update tags')` in the `catch` block.

---

## Phase 3: Testing & Completion

### **Task 10: Testing**
- [X] **10.1. Test Add:** Open the tag editor for a note with no tags. Add several tags. Save. Verify tags appear on the node and persist after refresh.
- [X] **10.2. Test Edit:** Open the tag editor for a note with existing tags. Modify the tags (add some, remove some). Save. Verify changes persist.
- [X] **10.3. Test Remove All:** Open the tag editor. Remove all tags. Save. Verify tags disappear from the node and persistence.
- [X] **10.4. Test Interaction with AI Tags:** Create a note (let AI tags generate). Manually edit the tags via the new UI. Save. Verify the manually set tags overwrite the AI tags.
- [X] **10.5. Test Error Handling:** Simulate a backend error during save and verify the error toast appears and the UI behaves correctly (e.g., doesn't incorrectly show saved state).

### **Task 11: Update Master Task List**
- [X] **11.1.** Add the completed "Fixed Note Tags" tasks to `mdfiles/master_completed_tasks.md`. 