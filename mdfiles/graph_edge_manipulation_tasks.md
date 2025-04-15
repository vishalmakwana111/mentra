# Graph Edge Manipulation Tasks

**Goal:** Enable users to delete selected edges and edit edge properties (like labels/relationship types) directly from the graph interface.

---

## Phase 1: Backend Verification

*Note: Most backend functionality likely exists from `backend_graph_tasks.md`, but verification is needed.* 

- [X] **1. Verify Edge Deletion Endpoint:**
    - [X] Confirm `DELETE /graph/edges/{edge_id}` endpoint in `endpoints/graph.py` correctly calls `crud_graph.delete_graph_edge`.
    - [X] Confirm `crud_graph.delete_graph_edge` handles edge deletion, including user ownership check.

- [X] **2. Verify Edge Update Endpoint & Schema:**
    - [X] Confirm `PUT /graph/edges/{edge_id}` endpoint in `endpoints/graph.py` exists.
    - [X] Confirm it uses a `schemas.GraphEdgeUpdate` Pydantic schema as input.
    - [X] Ensure `schemas.GraphEdgeUpdate` includes optional fields for properties to edit (e.g., `relationship_type: str | None = None`, `label: str | None = None`, `data: Dict | None = None`). **(Verified: `relationship_type` and `data` are optional)**
    - [X] Confirm the endpoint calls `crud_graph.update_graph_edge`.
    - [X] Confirm `crud_graph.update_graph_edge` correctly updates the specified fields using the `GraphEdgeUpdate` schema and handles user ownership.
    - [N/A] *If schema was adjusted:* Generate and apply Alembic migration (though unlikely if only Pydantic schema changed).

- [X] **3. Verify API Service Functions:**
    - [X] Confirm `deleteGraphEdge(edgeId: number)` exists in `frontend/src/services/api.ts` and calls the correct backend endpoint.
    - [X] Confirm `updateGraphEdge(edgeId: number, edgeData: GraphEdgeUpdatePayload)` exists in `frontend/src/services/api.ts` (create if needed, define `GraphEdgeUpdatePayload` type matching backend schema) and calls the correct backend endpoint. **(Added function and type)**

---

## Phase 2: Frontend Deletion Implementation

- [X] **4. Handle Edge Deletion Event:**
    - [X] In `MindMapCanvas.tsx`, ensure the `onEdgesDelete` prop is passed to the `<ReactFlow>` component. **(Handled via `onEdgesChange`)**
    - [X] If not using `onEdgesDelete`, implement logic to detect edge deletion (e.g., check `event.key === 'Delete'` in a keydown handler when edges are selected).
    - *Decision:* Choose method (`onEdgesDelete` preferred if suitable). **(Using `onEdgesChange` which detects remove events)**

- [X] **5. Implement Deletion Logic:**
    - [X] Inside the chosen delete handler (e.g., `handleEdgesDelete` function passed to `onEdgesDelete`): **(Implemented within `onEdgesChange`)**
        - [X] Iterate through the `edges` provided by the React Flow event.
        - [X] For each edge, parse the backend ID from the React Flow edge ID (e.g., `edge.id` which is likely `edge-X`). Extract `X`.
        - [X] Call the `deleteGraphEdge` API service function for each edge ID.
        - [X] Add basic `try...catch` error handling and console logging for the API call.

- [X] **6. Update Frontend State (Deletion):**
    - [X] Ensure a `deleteEdgeFromStore` (or similar name) action exists in `graphStore.ts` that accepts the *backend edge ID*. **(Action `deleteEdge` exists)**
        - [X] *If not present:* Implement this action. It should filter the `edges` state array, removing the edge whose React Flow ID corresponds to the given backend ID.
    - [X] In the `handleEdgesDelete` function in `MindMapCanvas.tsx`, after a *successful* API call for an edge deletion, call the `deleteEdgeFromStore` action with the backend edge ID. **(Called correctly in `onEdgesChange`)**

- [X] **7. User Feedback (Deletion):**
    - [X] Import `toast` from `react-hot-toast` in `MindMapCanvas.tsx`.
    - [X] Add `toast.success('Edge deleted')` after successful deletion and state update.
    - [X] Add `toast.error('Failed to delete edge')` in the `catch` block of the API call.

---

## Phase 3: Frontend Editing Implementation (Label/Type)

- [X] **8. Design Edit Trigger & UI:**
    - [X] Decide on the trigger: 
        - Option A: Double-click on the edge label.
        - Option B: Right-click context menu on the edge.
        - Option C: Button appears on edge hover/selection.
    - *Decision Made:* **Option A** (Double-click on edge label)
    - [X] Based on the decision, plan the UI:
        - *If A:* An input field replacing the label temporarily.
        - *If B/C:* A small modal/popover with an input field.

- [X] **9. Implement Edit State & UI Component:**
    - [X] Add state to `MindMapCanvas.tsx` (or a new dedicated component if using modal/popover) to manage:
        - `editingEdgeId: string | null` (React Flow edge ID, e.g., `edge-X`)
        - `editedEdgeLabel: string`
    - [X] Create the UI component (inline input or modal/popover) for editing. **(Created `EdgeLabelEditor.tsx`)**
    - [X] Implement the chosen trigger logic (e.g., `onEdgeDoubleClick`, context menu handler) in `MindMapCanvas.tsx`. This handler should set `editingEdgeId` and initialize `editedEdgeLabel` with the current edge's label.
    - [X] Conditionally render the editing UI based on `editingEdgeId`. **(Added conditional `EdgeLabelEditor` render)**

- [X] **10. Implement Saving Logic (Editing):**
    - [X] Add a save handler function (e.g., `handleEdgeLabelSave`).
    - [X] Trigger this handler (e.g., `onBlur` or `onKeyDown` for Enter key on the input, or a Save button in the modal). **(Triggered by `EdgeLabelEditor`)**
    - [X] Inside the handler:
        - Get the current `editingEdgeId` and `editedEdgeLabel` from state.
        - Parse the backend edge ID (`X`) from `editingEdgeId` (`edge-X`).
        - Compare `editedEdgeLabel` with the original edge label (fetch original from store if needed).
        - If the label has changed:
            - Call the `updateGraphEdge` API service function with the backend edge ID and `{ relationship_type: editedEdgeLabel }` (or `{ label: editedEdgeLabel }` depending on backend schema field name).
            - Add `try...catch` error handling.
        - After potential save attempt (success or fail) or if label didn't change, reset the editing state (`setEditingEdgeId(null)`).

- [X] **11. Update Frontend State (Editing):**
    - [X] Ensure an `updateEdgeInStore` (or similar name) action exists in `graphStore.ts` that accepts the *backend edge ID* and the *updated data* (e.g., `{ label: newLabel }`). **(Action `updateEdge` added)**
        - [X] *If not present:* Implement this action. It should find the edge by its React Flow ID (`edge-X`) and update its properties (e.g., `edge.label`).
    - [X] In the `handleEdgeLabelSave` function in `MindMapCanvas.tsx`, after a *successful* API call for an edge update, call the `updateEdgeInStore` action with the backend edge ID and the updated data. **(Called correctly)**

- [X] **12. User Feedback (Editing):**
    - [X] Import `toast` in `MindMapCanvas.tsx` (if not already).
    - [X] Add `toast.success('Edge label updated')` after successful save/state update.
    - [X] Add `toast.error('Failed to update edge label')` in the `catch` block.

---

## Phase 4: Testing & Completion

- [X] **13. Testing:**
    - [X] Select an edge and press Delete key (or use chosen method). Verify edge disappears and success toast appears.
    - [X] Trigger edge editing UI. Verify it appears correctly.
    - [X] Change the label and save. Verify the label updates on the graph and success toast appears. Check DB if needed.
    - [X] Attempt to save without changing the label. Verify no API call is made (check network tab/logs).
    - [X] Test error cases (e.g., simulate backend error) and verify error toasts.

- [X] **14. Update Master Task List:**
    - [X] Add the completed "Graph Edge Manipulation" tasks to `mdfiles/master_completed_tasks.md`. 