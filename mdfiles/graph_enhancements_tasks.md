# Graph Enhancements Tasks (Content Display/Edit & Edges)

## Node Content Display & Editing
- [X] **Frontend Node Display:** Modify node rendering (or create a custom node type) in `MindMapCanvas.tsx` to display note title and some content.
- [X] **Frontend Edit Modal:** Create a reusable `NoteEditModal.tsx` component.
- [X] **Frontend Edit Trigger:** Implement logic (e.g., on double-click) in `MindMapCanvas.tsx` to open the `NoteEditModal` with the selected node's data.
- [X] **Frontend Edit Save:** Connect the `NoteEditModal` save action to the existing `updateNote` API service function.
- [X] **Frontend State Update:** Update local `apiNotes` state in `MindMapCanvas.tsx` after successful modal save.

## Node Connections (Edges)
- [X] **Backend Edge Model:** Verify/finalize the `GraphEdge` SQLAlchemy model in `models/graph_edge.py` (including relationships).
- [X] **Backend Edge Schema:** Verify/finalize the `GraphEdge` Pydantic schemas in `schemas/graph_edge.py`.
- [X] **Backend Edge Migration:** Generate and apply an Alembic migration for any `GraphEdge` model changes.
- [X] **Backend Edge CRUD:** Implement CRUD functions for edges in `crud/crud_graph_edge.py`.
- [X] **Backend Edge API:** Create API endpoints for edges (`POST`, `GET`, `DELETE`) in `api/api_v1/endpoints/graph_edges.py`.
- [X] **Frontend Edge Type:** Add `GraphEdge` type definition to `types/index.ts`.
- [X] **Frontend Edge API Service:** Add API functions (`createEdge`, `fetchEdges`, `deleteEdge`) to `services/api.ts`.
- [X] **Frontend Edge Fetching:** Fetch edge data in `MindMapCanvas.tsx` alongside notes.
- [X] **Frontend Edge Transformation:** Transform fetched edge data into React Flow `edges` format in `MindMapCanvas.tsx`.
- [X] **Frontend Edge Rendering:** Pass the transformed `edges` state to the `<ReactFlow>` component.
- [X] **Frontend Edge Creation:** Implement basic edge creation interaction (e.g., using `onConnect` callback and calling `createEdge`).
- [X] **Frontend Edge Deletion:** Implement basic edge deletion interaction (e.g., on selecting an edge and pressing Delete key, calling `deleteEdge`). 