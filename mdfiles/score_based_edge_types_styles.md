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

- [ ] **1. Define Helper Function for Label Mapping:**
    - [ ] In `crud/crud_note.py` (or a utility file), create a helper function `get_relationship_label_from_score(score: float) -> str`.
    - [ ] Implement `if/elif/else` logic inside this function based on the 5 defined score ranges to return the corresponding string label (e.g., "Strongly Related").
    - [ ] Handle edge cases (e.g., score exactly 1.0 or slightly outside expected range if possible).

- [ ] **2. Update Edge Creation Logic (`crud_note.py`):**
    - [ ] In `_find_and_create_similar_note_edges` function:
        - [ ] After getting the `score` for a valid similar note (above `settings.SIMILARITY_THRESHOLD`).
        - [ ] Call `relationship_label = get_relationship_label_from_score(score)`.
        - [ ] When creating the `edge_schema = GraphEdgeCreate(...)`:
            - Set `label=relationship_label`. (Using `label` field for display seems appropriate).
            - **Optional but Recommended:** Store the raw score as well for potential future use. Add `data={'similarity_score': score}`.

- [ ] **3. Verify Backend Schemas & API:**
    - [ ] Ensure the `GraphEdge` Pydantic schema (`schemas/graph.py`) includes `label: str | None` and optionally `data: Dict | None`.
    - [ ] Ensure the `GET /graph/edges/` endpoint (`endpoints/graph.py`) returns edges including their `label` and `data` fields.

- [ ] **4. Verify/Update GraphNode CRUD for Score Storage (if storing score):**
    - [ ] If storing the raw score in `GraphEdge.data`, ensure `crud_graph.create_graph_edge` and the `GraphEdge` model handle the JSONB `data` field correctly.
    - [ ] *Note:* No schema migration likely needed if using existing JSONB `data` field.

---

## Phase 2: Frontend Implementation

- [ ] **5. Update Frontend Types:**
    - [ ] In `frontend/src/types/index.ts`:
        - Ensure `BackendGraphEdge` type includes `label: string | null` and optionally `data: { similarity_score?: number } | null`.
        - Ensure the React Flow `Edge` type used in the store (`graphStore.ts`) can accommodate these fields, potentially adding them to the `Edge` object's `data` property (e.g., `data: { label?: string | null, similarity_score?: number }`).

- [ ] **6. Update Edge Mapping in Store (`graphStore.ts`):**
    - [ ] In the `fetchGraphData` action, locate the logic where backend edges are mapped to React Flow edges.
    - [ ] Ensure the `label` from the `backendEdge` is correctly assigned to the `label` property *or* the `data.label` property of the resulting React Flow `Edge` object.
    - [ ] If storing the score, map `backendEdge.data?.similarity_score` to `data.similarity_score` on the React Flow `Edge` object.
    - [ ] Verify the `addEdge` action also correctly maps these properties if it adds edges directly.

- [ ] **7. Define Edge Styles:**
    - [ ] Decide on the visual differentiation for each label type (e.g., colors, thickness, dashed/solid, animation).
        - *Example Styles:*
            - "Strongly Related": `stroke: 'green', strokeWidth: 3, animated: true`
            - "Highly Related": `stroke: 'blue', strokeWidth: 2.5`
            - "Related": `stroke: 'black', strokeWidth: 2`
            - "Moderately Related": `stroke: 'gray', strokeWidth: 1.5, type: 'smoothstep', style: { strokeDasharray: '5 5' }`
            - "Weakly Related": `stroke: 'lightgray', strokeWidth: 1, type: 'smoothstep', style: { strokeDasharray: '10 10' }`
    - [ ] Define these styles as objects, potentially in a helper function or constant within `MindMapCanvas.tsx` or a separate style utility file.

- [ ] **8. Apply Conditional Edge Styling:**
    - [ ] In `MindMapCanvas.tsx`, where the `edges` state is passed to the `<ReactFlow>` component:
        - *Option A (Direct Styling):* Map over the `edges` array from the store *before* passing it to ReactFlow. For each edge, determine its style object based on `edge.label` (or `edge.data.label`) using the styles defined in Step 7. Add the `style` object and other properties (like `animated`, `type`) directly to the edge object being passed to ReactFlow.
        - *Option B (Custom Edge):* Define a custom edge component (if not already done) and pass the label/score via the edge's `data`. Inside the custom edge component, apply conditional styling based on `props.data.label` or `props.data.similarity_score`.
    - *Decision:* Choose Option A (direct styling) or B (custom edge). (Option A is often simpler if only styling is needed).

- [ ] **9. Verify Label Display:**
    - [ ] Ensure the `label` property assigned in Step 6 is being correctly rendered by React Flow along the edge path.

---

## Phase 3: Testing & Completion

- [ ] **10. Testing:**
    - [ ] Create several notes with varying degrees of similarity (ensure some fall into each of the 5 score buckets).
    - [ ] Verify that the automatically created edges have the correct labels ("Strongly Related", "Weakly Related", etc.) displayed on the graph.
    - [ ] Verify that the edges have distinctly different visual styles (color, thickness, dash, animation) corresponding to their labels.
    - [ ] Test edge cases (scores exactly on boundaries).
    - [ ] Ensure manually created edges still appear with their default style/label.

- [ ] **11. Update Master Task List:**
    - [ ] Add the completed "Score-Based Edge Types & Styles" tasks to `mdfiles/master_completed_tasks.md`. 