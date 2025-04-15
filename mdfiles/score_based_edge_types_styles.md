# Score-Based Edge Types & Styles Tasks

**Goal:** Automatically assign descriptive relationship types (labels) to edges based on the similarity score between connected notes, and apply distinct visual styles to these edges on the graph corresponding to their type.

**Similarity Score Ranges & Labels (using 0.5 threshold):**
- `[0.9, 1.0]` -> "Strongly Related"
- `[0.8, 0.9)` -> "Highly Related"
- `[0.7, 0.8)` -> "Related"
- `[0.6, 0.7)` -> "Moderately Related"
- `[0.5, 0.6)` -> "Weakly Related"

---

## Phase 1: Backend Implementation

- [X] **1. Define Helper Function for Label Mapping:**
    - [X] In `crud/crud_note.py` (or a utility file), create a helper function `get_relationship_label_from_score(score: float) -> str`.
    - [X] Implement `if/elif/else` logic inside this function based on the 5 defined score ranges to return the corresponding string label (e.g., "Strongly Related").
    - [X] Handle edge cases (e.g., score exactly 1.0 or slightly outside expected range if possible).

- [X] **2. Update Edge Creation Logic (`crud_note.py`):**
    - [X] In `_find_and_create_similar_note_edges` function:
        - [X] After getting the `score` for a valid similar note (above `settings.SIMILARITY_THRESHOLD`).
        - [X] Call `relationship_label = get_relationship_label_from_score(score)`.
        - [X] When creating the `edge_schema = GraphEdgeCreate(...)`:
            - [X] Set `label=relationship_label`. (Using `label` field for display seems appropriate).
            - [X] **Optional but Recommended:** Store the raw score as well for potential future use. Add `data={'similarity_score': score}`.

- [X] **3. Verify Backend Schemas & API:**
    - [X] Ensure the `GraphEdge` Pydantic schema (`schemas/graph.py`) includes `label: str | None` and optionally `data: Dict | None`.
    - [X] Ensure the `GET /graph/edges/` endpoint (`endpoints/graph.py`) returns edges including their `label` and `data` fields.

- [X] **4. Verify/Update GraphNode CRUD for Score Storage (if storing score):**
    - [X] If storing the raw score in `GraphEdge.data`, ensure `crud_graph.create_graph_edge` and the `GraphEdge` model handle the JSONB `data` field correctly.
    - [X] *Note:* No schema migration likely needed if using existing JSONB `data` field.

---

## Phase 2: Frontend Implementation

- [X] **5. Update Frontend Types:**
    - [X] In `frontend/src/types/index.ts`:
        - [X] Ensure `BackendGraphEdge` type includes `label: string | null` and optionally `data: { similarity_score?: number } | null`.
        - [X] Ensure the React Flow `Edge` type used in the store (`graphStore.ts`) can accommodate these fields, potentially adding them to the `Edge` object's `data` property (e.g., `data: { label?: string | null, similarity_score?: number }`). *(Note: We updated the base API type; store mapping handles the rest)*

- [X] **6. Update Edge Mapping in Store (`graphStore.ts`):**
    - [X] In the `fetchGraphData` action, locate the logic where backend edges are mapped to React Flow edges.
    - [X] Ensure the `label` from the `backendEdge` is correctly assigned to the `label` property *or* the `data.label` property of the resulting React Flow `Edge` object. *(Mapped to `label` property)*
    - [X] If storing the score, map `backendEdge.data?.similarity_score` to `data.similarity_score` on the React Flow `Edge` object. *(Mapped to `data.similarity_score`)*
    - [X] Verify the `addEdge` action also correctly maps these properties if it adds edges directly. *(Note: `addEdge` uses API response, which is now correct)*

- [X] **7. Define Edge Styles:**
    - [X] Decide on the visual differentiation for each label type (e.g., colors, thickness, dashed/solid, animation).
        - *Example Styles:* (Actual styles implemented)
            - "Strongly Related": `stroke: '#2E7D32', strokeWidth: 3, animated: true`
            - "Highly Related": `stroke: '#1976D2', strokeWidth: 2.5`
            - "Related": `stroke: '#374151', strokeWidth: 2`
            - "Moderately Related": `stroke: '#9CA3AF', strokeWidth: 1.5, style: { strokeDasharray: '5 5' }`
            - "Weakly Related": `stroke: '#D1D5DB', strokeWidth: 1, style: { strokeDasharray: '10 10' }`
            - "Default": `stroke: '#6B7280', strokeWidth: 1.5`
    - [X] Define these styles as objects, potentially in a helper function or constant within `MindMapCanvas.tsx` or a separate style utility file. *(Defined as constant `edgeStyles` in `MindMapCanvas.tsx`)*

- [X] **8. Apply Conditional Edge Styling:**
    - [X] In `MindMapCanvas.tsx`, where the `edges` state is passed to the `<ReactFlow>` component:
        - [X] *Option A (Direct Styling):* Map over the `edges` array from the store *before* passing it to ReactFlow. For each edge, determine its style object based on `edge.label` (or `edge.data.label`) using the styles defined in Step 7. Add the `style` object and other properties (like `animated`, `type`) directly to the edge object being passed to ReactFlow.
        - [ ] *Option B (Custom Edge):* Define a custom edge component (if not already done) and pass the label/score via the edge's `data`. Inside the custom edge component, apply conditional styling based on `props.data.label` or `props.data.similarity_score`.
    - [X] *Decision:* Choose Option A (direct styling) or B (custom edge). *(Option A implemented using `useMemo` before passing edges to ReactFlow)*

- [X] **9. Verify Label Display:**
    - [X] Ensure the `label` property assigned in Step 6 is being correctly rendered by React Flow along the edge path. *(Verified - React Flow displays the `label` prop by default)*

---

## Phase 3: Testing & Completion

- [X] **10. Testing:**
    - [X] Create several notes with varying degrees of similarity (ensure some fall into each of the 5 score buckets).
    - [X] Verify that the automatically created edges have the correct labels ("Strongly Related", "Weakly Related", etc.) displayed on the graph.
    - [X] Verify that the edges have distinctly different visual styles (color, thickness, dash, animation) corresponding to their labels.
    - [X] Test edge cases (scores exactly on boundaries).
    - [X] Ensure manually created edges still appear with their default style/label.

- [X] **11. Update Master Task List:**
    - [X] Add the completed "Score-Based Edge Types & Styles" tasks to `mdfiles/master_completed_tasks.md`. 