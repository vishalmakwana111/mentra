# Task: Connect File Nodes (Frontend)

- [x] 1.  **Update `onConnect` Handler:** Modify the `onConnect` callback in `mind-map-mentor/frontend/src/components/mindmap/MindMapCanvas.tsx` to:
    - [x] Allow connections where the source or target (or both) are `file` nodes.
    - [x] Extract the correct `source_node_id` and `target_node_id` (the numerical IDs) regardless of node type ('note' or 'file').
    - [x] Potentially add logic to define a default `relationship_type` or prompt the user if connecting different node types.
- [x] 2.  **Update Edge Creation Logic:**
    - [x] Ensure the `createGraphEdge` API call in `onConnect` sends the correct data to the backend (which now accepts generic edges).
    - [x] Verify the `addEdge` action in `graphStore.ts` correctly adds the new edge to the store's state, using prefixed IDs for source/target (`note-X`, `file-Y`).
- [x] 3.  **Add Handles to `FileNode`:** Add `Source` and `Target` handles to `mind-map-mentor/frontend/src/components/mindmap/FileNode.tsx` to visually enable connections.
- [ ] 4.  **(Optional) Refine Edge Type/Styling:** Consider if edges connected to file nodes should have a different appearance or default label.
