# RAG Chat Panel Tasks
# ... (previous tasks) ...
- [X] **Frontend: State Management**
    - [X] Update `searchStore.ts` state to include `ragAnswer: string | null`.
    - [X] Modify the `performSearch` action:
        - [X] Call the new `ragQueryApi` service function.
        - [X] Update `searchResults` / `highlightedNodeIds` based on the *source documents* returned by the RAG API.
        - [X] Update `ragAnswer` state with the generated answer string.
        - [X] Update loading/error states appropriately.
    - [X] Update `clearSearch` to reset `ragAnswer`.
- [X] **Frontend: Query Panel UI**
    - [X] Modify `QueryPanel.tsx` to trigger the updated `performSearch` action.
    - [X] Add a dedicated area to display the `ragAnswer` from the store.
    - [X] Ensure loading/error states related to the RAG answer are handled visually.
- [ ] **Testing**
    - [ ] Create several related notes.
    - [ ] Ask a question in the Query Panel that requires information from those notes.
    - [ ] Verify that relevant nodes are highlighted.
    - [ ] Verify that a coherent answer, based on the content of the highlighted notes, is displayed in the panel.
    - [ ] Test edge cases (no relevant notes found, API errors).
    