# Tasks for Loading/Saving File Node Positions Correctly

This file tracks the steps to ensure file node positions are saved by the backend AND correctly loaded and used by the frontend.

- [x] **Backend Verification:** Manually check the `graph_nodes` table after dragging a file node to confirm the `position` JSON field is updated with the correct `{x, y}` values.
- [x] **Backend:** Modify `crud_graph.get_graph_nodes_for_user` to fetch all necessary node data including the position.
- [x] **Frontend:** Modify `fetchGraphData` in `graphStore.ts` to fetch `GraphNode` data directly instead of separate `fetchNotes` and `fetchFiles`.
- [x] **Frontend:** In `fetchGraphData`, map the fetched `GraphNode` data (including its `position` field) to React Flow nodes, ensuring the position is used for both note and file nodes.
- [x] **Frontend:** Remove the separate `files: ApiFile[]` state from `graphStore` as file data will now be part of the `nodes` state.
- [x] **Frontend:** Update `SidePanel.tsx` to read file information from the filtered `graphStore.nodes` instead of the removed `graphStore.files` state.
- [ ] **Testing:** Verify file node positions persist after dragging and refreshing the page. 