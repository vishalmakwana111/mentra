# Graph Edge Manipulation Tasks

**Goal:** Enable users to delete selected edges and edit edge properties (like labels/relationship types) directly from the graph interface.

---

## Phase 1: Backend Verification

*Note: Most backend functionality likely exists from `backend_graph_tasks.md`, but verification is needed.* 

- [ ] **1. Verify Edge Deletion Endpoint:**
    - [ ] Confirm `DELETE /graph/edges/{edge_id}` endpoint in `endpoints/graph.py` correctly calls `crud_graph.delete_graph_edge`.
    - [ ] Confirm `crud_graph.delete_graph_edge` handles edge deletion, including user ownership check.

- [ ] **2. Verify Edge Update Endpoint & Schema:**
    - [ ] Confirm `PUT /graph/edges/{edge_id}` endpoint in `endpoints/graph.py` exists.
    - [ ] Confirm it uses a `schemas.GraphEdgeUpdate` Pydantic schema as input.
    - [ ] Ensure `schemas.GraphEdgeUpdate` includes optional fields for properties to edit (e.g., `relationship_type: str | None = None`, `label: str | None = None`, `data: Dict | None = None`). *Adjust schema if needed.* 
    - [ ] Confirm the endpoint calls `crud_graph.update_graph_edge`.
    - [ ] Confirm `crud_graph.update_graph_edge` correctly updates the specified fields using the `GraphEdgeUpdate` schema and handles user ownership.
    - [ ] *If schema was adjusted:* Generate and apply Alembic migration (though unlikely if only Pydantic schema changed).

- [ ] **3. Verify API Service Functions:**
    - [ ] Confirm `deleteGraphEdge(edgeId: number)` exists in `frontend/src/services/api.ts` and calls the correct backend endpoint.
    - [ ] Confirm `updateGraphEdge(edgeId: number, edgeData: GraphEdgeUpdatePayload)` exists in `frontend/src/services/api.ts` (create if needed, define `GraphEdgeUpdatePayload` type matching backend schema) and calls the correct backend endpoint.

---

## Phase 2: Frontend Deletion Implementation

- [ ] **4. Handle Edge Deletion Event:**
    - [ ] In `MindMapCanvas.tsx`, ensure the `onEdgesDelete` prop is passed to the `<ReactFlow>` component.
    - [ ] If not using `onEdgesDelete`, implement logic to detect edge deletion (e.g., check `event.key === 'Delete'` in a keydown handler when edges are selected).
    - [ ] *Decision:* Choose method (`onEdgesDelete` preferred if suitable).

- [ ] **5. Implement Deletion Logic:**
    - [ ] Inside the chosen delete handler (e.g., `handleEdgesDelete` function passed to `onEdgesDelete`):
        - [ ] Iterate through the `edges` provided by the React Flow event.
        - [ ] For each edge, parse the backend ID from the React Flow edge ID (e.g., `edge.id` which is likely `edge-X`). Extract `X`.
        - [ ] Call the `deleteGraphEdge` API service function for each edge ID.
        - [ ] Add basic `try...catch` error handling and console logging for the API call.

- [ ] **6. Update Frontend State (Deletion):**
    - [ ] Ensure a `deleteEdgeFromStore` (or similar name) action exists in `graphStore.ts` that accepts the *backend edge ID*. 
        - *If not present:* Implement this action. It should filter the `edges` state array, removing the edge whose React Flow ID corresponds to the given backend ID.
    - [ ] In the `handleEdgesDelete` function in `MindMapCanvas.tsx`, after a *successful* API call for an edge deletion, call the `deleteEdgeFromStore` action with the backend edge ID.

- [ ] **7. User Feedback (Deletion):**
    - [ ] Import `toast` from `react-hot-toast` in `MindMapCanvas.tsx`.
    - [ ] Add `toast.success('Edge deleted')` after successful deletion and state update.
    - [ ] Add `toast.error('Failed to delete edge')` in the `catch` block of the API call.

---

## Phase 3: Frontend Editing Implementation (Label/Type)

- [ ] **8. Design Edit Trigger & UI:**
    - [ ] Decide on the trigger: 
        - Option A: Double-click on the edge label.
        - Option B: Right-click context menu on the edge.
        - Option C: Button appears on edge hover/selection.
    - *Decision Made:* [Specify A, B, or C here]
    - [ ] Based on the decision, plan the UI:
        - *If A:* An input field replacing the label temporarily.
        - *If B/C:* A small modal/popover with an input field.

- [ ] **9. Implement Edit State & UI Component:**
    - [ ] Add state to `MindMapCanvas.tsx` (or a new dedicated component if using modal/popover) to manage:
        - `editingEdgeId: string | null` (React Flow edge ID, e.g., `edge-X`)
        - `editedEdgeLabel: string`
    - [ ] Create the UI component (inline input or modal/popover) for editing.
    - [ ] Implement the chosen trigger logic (e.g., `onEdgeDoubleClick`, context menu handler) in `MindMapCanvas.tsx`. This handler should set `editingEdgeId` and initialize `editedEdgeLabel` with the current edge's label.
    - [ ] Conditionally render the editing UI based on `editingEdgeId`.
    - [ ] Bind the input field's value to `editedEdgeLabel` and update it `onChange`.

- [ ] **10. Implement Saving Logic (Editing):**
    - [ ] Add a save handler function (e.g., `handleEdgeLabelSave`).
    - [ ] Trigger this handler (e.g., `onBlur` or `onKeyDown` for Enter key on the input, or a Save button in the modal).
    - [ ] Inside the handler:
        - Get the current `editingEdgeId` and `editedEdgeLabel` from state.
        - Parse the backend edge ID (`X`) from `editingEdgeId` (`edge-X`).
        - Compare `editedEdgeLabel` with the original edge label (fetch original from store if needed).
        - If the label has changed:
            - Call the `updateGraphEdge` API service function with the backend edge ID and `{ relationship_type: editedEdgeLabel }` (or `{ label: editedEdgeLabel }` depending on backend schema field name).
            - Add `try...catch` error handling.
        - After potential save attempt (success or fail) or if label didn't change, reset the editing state (`setEditingEdgeId(null)`).

- [ ] **11. Update Frontend State (Editing):**
    - [ ] Ensure an `updateEdgeInStore` (or similar name) action exists in `graphStore.ts` that accepts the *backend edge ID* and the new label/data.
        - *If not present:* Implement this action. It should map over the `edges` state array, find the edge matching the backend ID, and update its `label` property.
    - [ ] In the `handleEdgeLabelSave` function in `MindMapCanvas.tsx`, after a *successful* API call for the edge update, call the `updateEdgeInStore` action with the backend edge ID and the new label.

- [ ] **12. User Feedback (Editing):**
    - [ ] Add `toast.success('Edge label updated')` after successful save and state update.
    - [ ] Add `toast.error('Failed to update edge label')` in the `catch` block of the API call.

---

## Phase 4: Testing & Completion

- [ ] **13. Testing:**
    - [ ] Select an edge and press Delete key (or use chosen method). Verify edge disappears and success toast appears.
    - [ ] Trigger edge editing UI. Verify it appears correctly.
    - [ ] Change the label and save. Verify the label updates on the graph and success toast appears. Check DB if needed.
    - [ ] Attempt to save without changing the label. Verify no API call is made (check network tab/logs).
    - [ ] Test error cases (e.g., simulate backend error) and verify error toasts.

- [ ] **14. Update Master Task List:**
    - [ ] Add the completed "Graph Edge Manipulation" tasks to `mdfiles/master_completed_tasks.md`. 