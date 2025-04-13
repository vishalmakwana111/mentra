# Task: Debug Edge Creation Failure ("Node not found")

- [x] 1.  **Verify ID Handling in `graphStore`:**
    - [x] Check `fetchGraphData` mapping: Ensure the `id` assigned to the `Node<GraphNodeData>`'s `data` object (`data.id`) corresponds to the **`GraphNode.id`** from the backend, not the original `Note.id` or `File.id`.
    - [x] Check `addNoteNode` / `addFileNode`: Ensure these actions correctly store the **`GraphNode.id`** in the new node's `data.id` field when adding to the store state.
    - [x] Correct the mapping/actions if necessary.
- [x] 2.  **Verify ID Handling in `MindMapCanvas.onConnect`:**
    - [x] Update the regex/parsing logic in `onConnect` to extract the correct ID used by the backend for edge creation. Since the React Flow node ID is `note-X`/`file-Y` (where X/Y are *GraphNode* IDs after store fix), we need to ensure the API call uses these `GraphNode` IDs.
- [x] 3.  **Add Backend Logging:**
    - [x] Add print statements in `crud_graph.create_graph_edge` right before calling `get_graph_node` for source/target, showing the `node_id` and `user_id` being searched for.
    - [x] Add print statements in `crud_graph.get_graph_node` showing the `node_id`, `user_id` received, and whether the result is `None`.
- [ ] 4.  **Retest and Analyze:**
    - [ ] Restart backend server.
    - [ ] Clear frontend state (log out/in or clear local storage).
    - [ ] Create a new Note. Check backend logs for successful Note and GraphNode creation, noting the IDs.
    - [ ] Create a new File. Check backend logs for successful File and GraphNode creation, noting the IDs.
    - [ ] Attempt to connect the new nodes.
    - [ ] Observe frontend console for IDs passed in `onConnect`.
    - [ ] Observe backend logs for IDs received in `create_graph_edge` and the result of `get_graph_node`.
    - [ ] Identify where the ID mismatch or lookup failure occurs.
