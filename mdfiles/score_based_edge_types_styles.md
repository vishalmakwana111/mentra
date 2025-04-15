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
        - [X] Ensure the React Flow `Edge` type used in the store (`graphStore.ts`) can accommodate these fields, potentially adding them to the `Edge` object's `data` property (e.g., `data: { label?: string | null, similarity_score?: number }`).

- [X] **6. Update Edge Styling Logic (`MindMapCanvas.tsx`):**
    - [X] In the component, define a helper function (e.g., `getEdgeStyle`) that takes an edge with score data and returns style attributes.
    - [X] Create a small style map based on the edge's `data.similarity_score` or derived label:
        - [X] For "Strongly Related" (>= 0.9): { strokeWidth: 4, stroke: '#0a3' } (thick green)
        - [X] For "Highly Related" (>= 0.8): { strokeWidth: 3.5, stroke: '#3a4' } (medium thick green)  
        - [X] For "Related" (>= 0.7): { strokeWidth: 3, stroke: '#777' } (medium neutral)
        - [X] For "Moderately Related" (>= 0.6): { strokeWidth: 2.5, stroke: '#888' } (thin neutral)
        - [X] For "Weakly Related" (>= 0.5): { strokeWidth: 2, stroke: '#aaa' } (thinnest neutral)
    - [X] Apply the styles by passing the function to ReactFlow's `edgeTypes` or using `style` prop.

- [X] **7. Testing:**
    - [X] Create multiple notes with related content and verify:
        - [X] Edges are created automatically with appropriate labels based on similarity scores.
        - [X] Edges display in the right format with appropriate styling.
        - [X] Different relationship levels display with visually distinct styles.
    - [X] Update master task list.

---

## Phase 3: Reference for Future Tasks (Not Part of Current Implementation)

**Potential Follow-Up Tasks:**
- Implement a legend for edge relationship types.
- Add hover tooltip showing exact similarity score.
- Allow users to filter view by relationship strength. 