# Tasks for Saving File Node Positions

This file tracks the implementation steps required to save the position of file nodes when they are dragged on the React Flow canvas.

- [x] **Backend:** Modify `crud_file.py` to add an `update_file_position` function.
- [x] **Backend:** Ensure `update_file_position` also updates the `position` field of the linked `GraphNode`.
- [x] **Backend:** Add a new API endpoint (e.g., `PUT /files/{file_id}/position`) in `files.py` that uses the new CRUD function.
- [x] **Frontend:** Modify `handleNodeDragStop` in `MindMapCanvas.tsx` to detect file node drags.
- [x] **Frontend:** Extract the original file ID from the file node data (similar to how `original_note_id` is handled).
- [x] **Frontend:** Create a new API service function (e.g., `updateFilePosition` in `api.ts`) to call the new backend endpoint.
- [x] **Frontend:** Call the new `updateFilePosition` service function from `handleNodeDragStop` for file nodes.
- [x] **Frontend:** Ensure the `graphStore` correctly updates the position data for the file node after a successful API call (likely handled by existing `updateNodeData`).
- [ ] **Testing:** Verify file node positions persist after dragging and refreshing the page. 