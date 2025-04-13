create one .md file 

Complete all the tasks one by one, update the .md file, then pick the next task, complete it, and update the .md file again.

you've to always craete .md  file under  @mdfiles # Task: Display Files as Nodes on the Canvas

- [x] 1. **Update Types:** Define a unified `GraphNodeData` type in `frontend/src/types/index.ts` that can represent both Notes and Files (e.g., using a `type: 'note' | 'file'` field). Adapt existing `Note` usage where necessary.
- [x] 2. **Modify `graphStore`:**
    - [x] Update the store's state (`nodes`) to hold `Node<GraphNodeData>[]` instead of `Node<Note>[]`.
    - [x] Add state to hold raw file metadata (`files: ApiFile[]`).
    - [x] Create/update fetch action(s) (`fetchGraphData`) to get file data from the API.
    - [x] Create logic within the store to map `ApiFile` data to `GraphNodeData` objects suitable for React Flow nodes.
    - [x] Remove file list state (`fileList`, `isLoadingFiles`, `filesError`) from `SidePanel.tsx`.
- [x] 3. **Integrate Store in `SidePanel`:** Modify `SidePanel.tsx` to read the file list from `graphStore` instead of its local state. Connect the upload/delete actions to update the store state.
- [x] 4. **Update `MindMapCanvas`:**
    - [x] Modify `MindMapCanvas.tsx` to read the unified `Node<GraphNodeData>[]` from the store.
    - [x] Define `nodeTypes` for both 'note' and 'file'. Create a simple `FileNode` component (`frontend/src/components/graph/FileNode.tsx`).
    - [x] Update the node rendering logic to use the correct node component based on the `type` field in the node data.
    - [x] Ensure files appear on the canvas (positioning might be basic initially, e.g., random or grid).
