# Node Position Saving Tasks

- [X] **Frontend Types:** Update `NoteUpdateData` in `types/index.ts` to accept optional `position_x` and `position_y`.
- [X] **Frontend API Service:** Create `updateNotePosition` function in `services/api.ts` to call the `PUT /notes/{note_id}` endpoint.
- [X] **Frontend Canvas:** Implement `handleNodeDragStop` function in `MindMapCanvas.tsx`.
- [X] **Frontend Canvas:** Pass `handleNodeDragStop` to the `onNodeDragStop` prop of the `<ReactFlow>` component.
- [X] **Frontend Canvas:** Add basic error handling/feedback for position updates (optional). 