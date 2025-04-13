# Graph Visualization Tasks (Notes Only - Phase 1)

- [X] **Backend:** Define positional attributes (x, y) for the `Note` model.
- [X] **Backend:** Update Alembic migration to add position columns to the `notes` table.
- [X] **Backend:** Update `Note` Pydantic schemas (`Note`, `NoteCreate`, `NoteUpdate`) to include optional positions.
- [X] **Backend:** Update `crud_note.py` to handle position data (defaulting if not provided).
- [X] **Backend:** Modify the `GET /notes/` endpoint (`api/v1/endpoints/notes.py`) to return notes including their positions.
- [X] **Frontend:** Update `types/index.ts` with position fields for the `Note` type.
- [X] **Frontend:** Modify `MindMapCanvas.tsx` to fetch notes data using the updated API service.
- [X] **Frontend:** Transform fetched note data into React Flow `nodes` format within `MindMapCanvas.tsx`.
- [X] **Frontend:** Render the transformed `nodes` using the `<ReactFlow>` component in `MindMapCanvas.tsx`.
- [X] **Frontend:** Add basic styling for the Note nodes.
- [ ] **Frontend:** Implement basic node dragging and save position updates (optional initial step, could be deferred). 