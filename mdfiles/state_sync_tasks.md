# State Synchronization Tasks (Zustand for Graph Data)

1.  [X] **Store:** Create `store/graphStore.ts` with state (`notes`, `edges`, `loading`, `error`) and initial `fetchNotesAndEdges` action.
2.  [X] **Store:** Implement `addNote` action in `graphStore.ts`.
3.  [X] **Store:** Implement `updateNoteInStore` action in `graphStore.ts`.
4.  [X] **Store:** Implement `addEdgeToStore` action in `graphStore.ts`.
5.  [X] **Store:** Implement `deleteEdgeFromStore` action in `graphStore.ts`.
6.  [X] **Canvas:** Refactor `MindMapCanvas.tsx` to use `graphStore` for state and initial fetch.
7.  [X] **Canvas:** Update `handleNodeDragStop` in `MindMapCanvas.tsx` to call `updateNoteInStore` action.
8.  [X] **Canvas:** Update `handleModalSave` in `MindMapCanvas.tsx` to call `updateNoteInStore` action.
9.  [X] **Canvas:** Update `onConnect` in `MindMapCanvas.tsx` to call `addEdgeToStore` action.
10. [X] **Canvas:** Update `onEdgesChange` (remove case) in `MindMapCanvas.tsx` to call `deleteEdgeFromStore` action.
11. [X] **SidePanel:** Refactor `SidePanel.tsx` to use `graphStore` for displaying notes.
12. [X] **SidePanel:** Update `handleCreateNote` in `SidePanel.tsx` to call `addNote` action. 