# Master List of Completed Tasks

This file consolidates all completed tasks marked with `[X]` from the various task files in the `mdfiles` directory.

## From `inline_note_editing_tasks.md`:

- [X] **Implement Inline Note Content Editing:**
    - [X] Modify `NoteNode.tsx` to add editing state and double-click handler.
    - [X] Implement conditional rendering of text display or textarea in `NoteNode.tsx`.
    - [X] Handle saving edited content on blur in `NoteNode.tsx`.
    - [X] Verify backend, API service, and store actions for content updates.
    - [X] Test and refine styling and UX for inline editing.

## From `rag_implementation_tasks.md`:

- [X] **Add Detailed RAG Logging:**
  - [X] Implement DEBUG logs in `rag.py` to track raw retrieved document structure
  - [X] Add logs for formatted context string sent to the LLM
  - [X] Add logs for exact, fully formatted prompt before LLM call
  - [X] Add logs for final LLM-generated answer
  - [X] Log complete payload being sent back to frontend
- [X] **Enable DEBUG Logging:**
  - [X] Change logging level in `main.py` from `INFO` to `DEBUG`
- [X] **Fix RAG Context Issue:**
  - [X] Diagnose empty context using logs
  - [X] Fix `format_docs` to extract text from correct document field
  - [X] Modify to use only raw note text as context without source identifiers
- [X] **Fix Vector Store Retrieval:**
  - [X] Modify `query_similar_notes` in `vectorstore.py` to include `page_content`
  - [X] Ensure metadata properly includes note information
- [X] **Refactor RAG Chain:**
  - [X] Update LCEL chain to use standard patterns (`itemgetter`, `RunnableLambda`)
  - [X] Implement `ChatPromptTemplate` correctly
  - [X] Improve prompt instructions for better RAG performance
- [X] **Add Vector Store Logging:**
  - [X] Add DEBUG logs to `upsert_document` in `vectorstore.py`
  - [X] Verify Pinecone upsert process with new logs
- [X] **Fix Source Extraction:**
  - [X] Correctly extract `note_id` and `title` from metadata in RAG response
- [X] **Fix Frontend Highlighting:**
  - [X] Update `searchStore.ts` to map database `note_id` to graph node ID
  - [X] Implement correct node highlighting on the graph

## From `frontend_auto_edge_sync_tasks.md`:

- [X] **Implement Frontend Refetch After Note Creation:**
    - [X] Locate the frontend code responsible for handling the successful creation of a new note (Found in `SidePanel.tsx` -> `handleCreateNote`).
    - [X] Identify the function used to fetch all graph data (Found in `graphStore.ts` -> `fetchGraphData`).
    - [X] Add a call to this fetch function immediately after the note creation API call returns successfully (Added `await fetchGraphData()` in `SidePanel.tsx`).

## From `auto_edge_creation_tasks.md`:

- [X] **Define Similarity Threshold:**
    - [X] Decide on a minimum similarity score (e.g., 0.75) from Pinecone results to consider notes related.
    - [X] Add this threshold to backend configuration (`config.py` and `.env`).
- [X] Modify `create_note` Function (`crud_note.py`):
    - [X] After a new note and its graph node are created and committed, trigger the similarity search and edge creation process.
    - [X] Pass the new note's content, its `graph_node_id`, and `user_id` to the logic.
- [X] Implement Edge Creation Logic:
    - [X] Create a new helper function (e.g., `find_and_create_similar_note_edges` in `crud_note.py` or a dedicated `ai/graph_logic.py`).
    - [X] This function should:
        - [X] Call `query_similar_notes` using the new note's content.
        - [X] Iterate through results, filtering out the note itself and results below the similarity threshold.
        - [X] For each valid similar result:
            - [X] Extract the `note_id` of the similar note from the metadata.
            - [X] Fetch the similar `Note` object from the database using `get_note(db, note_id=similar_note_id, user_id=user_id)` to get its `graph_node_id`.
            - [X] Ensure both the new note's graph node ID and the similar note's graph node ID are valid.
            - [X] Call `crud_graph.create_graph_edge` to create the edge in the database (using the two `graph_node_id`s and the `user_id`).
        - [X] Handle potential errors gracefully (e.g., log issues if a similar note or its graph node isn't found).
- [X] Refine `query_similar_notes` (Optional but Recommended):
    - [X] Modify `query_similar_notes` in `vectorstore.py` to accept the `user_id`.
    - [X] Add a `filter` argument to the `vector_store.similarity_search_with_score` call to only search within notes belonging to the same user (`filter={'user_id': user_id}`).
    - [X] Update the calls in `endpoints/ai.py` and the new edge creation logic to pass the `user_id`.

## From `ui_refactor_tasks.md`:

- [X] **Collapsible Left Panel (SidePanel)**
    - [X] Add state to manage open/closed status (e.g., in `DashboardLayout`).
    - [X] Add a toggle button (e.g., icon button).
    - [X] Conditionally change width/styling of the left panel container.
    - [X] Conditionally hide/show content within `SidePanel` based on state.
- [X] Collapsible Right Panel (QueryPanel)
    - [X] Add state to manage open/closed status.
    - [X] Add a toggle button.
    - [X] Conditionally change width/styling of the right panel container.
    - [X] Conditionally hide/show content within `QueryPanel`.
- [X] Query Panel Layout Adjustment
    - [X] Modify `QueryPanel.tsx` layout (e.g., using flexbox) to position the input form at the bottom.
- [X] Query Panel Content Adjustment
    - [X] Remove the section displaying the list of search results (`searchResults`) from `QueryPanel.tsx`.
- [X] Testing
    - [X] Verify panels collapse and expand correctly.
    - [X] Verify Query Panel input is at the bottom.
    - [X] Verify Query Panel does not show text results list.
- [x] **Modals:** Create `CreateNoteModal.tsx` component.
- [x] **Modals:** Create `UploadFileModal.tsx` component.
- [x] **Routing/Layout:** Define routes/structure for Canvas, All Notes, All Files views within the dashboard.
- [x] **Sidebar:** Refactor `SidePanel.tsx`: Remove inline lists/forms, add navigation links (Canvas, All Notes, All Files), add buttons to trigger Create Note & Upload File modals.
- [x] **All Notes View:** Create page/component (`/dashboard/notes`?) to display a paginated list of all notes.
    - [x] Fetch notes with pagination parameters (`fetchNotes` service).
    - [x] Implement list/table display.
    - [x] Implement pagination controls.
- [x] **All Files View:** Create page/component (`/dashboard/files`?) to display a paginated list of all files.
    - [x] Fetch files with pagination parameters (`fetchFiles` service).
    - [x] Implement list/table display.
    - [x] Implement pagination controls.
- [x] **Modals:** Connect sidebar buttons to open `CreateNoteModal` and `UploadFileModal`.
- [x] **Data Flow:** Ensure creating/uploading via modals updates relevant views/stores (might need adjustments to refresh logic).
- [x] **Styling:** Ensure consistent and clean styling across the new views and sidebar.

## From `ai_integration_tasks.md`:

- [X] Basic Retrieval Chain/Function - Function should accept a query string, generate its embedding, and use `index.query` to find relevant document IDs/metadata.
- [X] API Endpoint for Retrieval
    - [X] Create `backend/app/api/v1/endpoints/ai.py`.
    - [X] Add the router to `backend/app/api/api_v1/api.py`.
    - [X] Implement `GET /ai/search-notes?query=...` endpoint.
    - [X] Endpoint depends on the retrieval function.
    - [X] Define appropriate request/response schemas in `backend/app/schemas/ai.py` (create this file).
- [X] Testing
    - [X] Create a few notes.
    - [X] Verify vectors are added/updated in the Pinecone index (e.g., via Pinecone console).
    - [X] Test the `/ai/search-notes` endpoint with relevant queries.

## From `frontend_query_panel_tasks.md`:

- [X] **Layout Modification**
    - [X] Modify `DashboardLayout.tsx` (or `app/page.tsx`) to include a third column area on the right.
    - [X] Ensure the three-column layout (Side Panel | Main Canvas | Query Panel) is responsive.
- [X] Create Query Panel Component
    - [X] Create directory `frontend/src/components/ai/`.
    - [X] Create file `frontend/src/components/ai/QueryPanel.tsx`.
    - [X] Add basic structure (e.g., `div` container, heading).
    - [X] Add the `<QueryPanel />` component to the right column in the main layout.
- [X] Query Input Implementation
    - [X] Add a text input/textarea and a submit button to `QueryPanel.tsx`.
    - [X] Use `useState` to manage the query input value.
- [X] API Service Function
    - [X] Define frontend types for `SearchMatch` and `SearchResponse` in `frontend/src/types/index.ts` (matching backend schemas/ai.py).
    - [X] Add `searchNotesApi(query: string, top_k: number = 5): Promise<SearchResponse>` function to `frontend/src/services/api.ts`.
    - [X] Ensure it calls `GET /api/v1/ai/search-notes` with query parameters.
- [X] State Management (Zustand Store)
    - [X] Create file `frontend/src/store/searchStore.ts`.
    - [X] Define the store state: `searchResults: SearchMatch[]`, `highlightedNodeIds: string[]`, `isLoading: boolean`, `error: string | null`.
    - [X] Implement `performSearch(query: string)` action:
        - [X] Set `isLoading` to true, clear previous results/error.
        - [X] Call `searchNotesApi`.
        - [X] On success: update `searchResults`, extract vector IDs (like `note_XX`) from results, update `highlightedNodeIds`, set `isLoading` to false.
        - [X] On error: update `error`, set `isLoading` to false, clear results/highlights.
    - [X] Implement `clearSearch()` action to reset state (results, highlights, error).
- [X] Connect Query Panel to Store
    - [X] In `QueryPanel.tsx`, import and use the `useSearchStore` hook.
    - [X] On form submit, call the `performSearch` action.
    - [X] Display loading state (e.g., disable button, show spinner).
    - [X] Display error message from store if `error` is not null.
    - [X] Render the `searchResults` from the store (e.g., list item for each match showing metadata.title and score).
    - [X] Add a "Clear" button that calls the `clearSearch` action.
- [X] Node Highlighting Implementation
    - [X] In `MindMapCanvas.tsx` (or relevant custom node component), import and use `useSearchStore`.
    - [X] Access the `highlightedNodeIds` array from the store.
    - [X] In the node mapping/rendering logic, determine if the current node's `id` is present in `highlightedNodeIds`.
    - [X] Apply conditional styling (e.g., using `clsx` or ternary operators in `className`) based on whether the node is highlighted. Choose a distinct style (e.g., bright border, background pulse).
    - [X] Ensure default styling applies when `highlightedNodeIds` is empty or the node ID is not present.

## From `dashboard_view_tasks.md`:

- [x] **Sidebar Visibility:** Verify `/app/dashboard/` route structure and ensure `SidePanel.tsx` links point to `/dashboard/notes` and `/dashboard/files`.
- [x] **Backend Pagination:** Modify `GET /api/v1/notes/` endpoint to return total note count along with the notes list.
- [x] **Backend Pagination:** Modify `GET /api/v1/files/` endpoint to return total file count along with the files list.
- [x] **Frontend API:** Update `fetchNotes` in `api.ts` to handle the new paginated response structure (items + total).
- [x] **Frontend API:** Update `fetchFiles` in `api.ts` to handle the new paginated response structure (items + total).
- [x] **Frontend Notes View:** Update `AllNotesPage` to use the total count for accurate pagination.
- [x] **Frontend Files View:** Update `AllFilesPage` to use the total count for accurate pagination.

## From `file_position_load_debug_tasks.md`:

- [x] **Backend Verification:** Manually check the `graph_nodes` table after dragging a file node to confirm the `position` JSON field is updated with the correct `{x, y}` values.
- [x] **Backend:** Modify `crud_graph.get_graph_nodes_for_user` to fetch all necessary node data including the position.
- [x] **Frontend:** Modify `fetchGraphData` in `graphStore.ts` to fetch `GraphNode` data directly instead of separate `fetchNotes` and `fetchFiles`.
- [x] **Frontend:** In `fetchGraphData`, map the fetched `GraphNode` data (including its `position` field) to React Flow nodes, ensuring the position is used for both note and file nodes.
- [x] **Frontend:** Remove the separate `files: ApiFile[]` state from `graphStore` as file data will now be part of the `nodes` state.
- [x] **Frontend:** Update `SidePanel.tsx` to read file information from the filtered `graphStore.nodes` instead of the removed `graphStore.files` state.

## From `file_node_position_tasks.md`:

- [x] **Backend:** Modify `crud_file.py` to add an `update_file_position` function.
- [x] **Backend:** Ensure `update_file_position` also updates the `position` field of the linked `GraphNode`.
- [x] **Backend:** Add a new API endpoint (e.g., `PUT /files/{file_id}/position`) in `files.py` that uses the new CRUD function.
- [x] **Frontend:** Modify `handleNodeDragStop` in `MindMapCanvas.tsx` to detect file node drags.
- [x] **Frontend:** Extract the original file ID from the file node data (similar to how `original_note_id` is handled).
- [x] **Frontend:** Create a new API service function (e.g., `updateFilePosition` in `api.ts`) to call the new backend endpoint.
- [x] **Frontend:** Call the new `updateFilePosition` service function from `handleNodeDragStop` for file nodes.
- [x] **Frontend:** Ensure the `graphStore` correctly updates the position data for the file node after a successful API call (likely handled by existing `updateNodeData`).

## From `edge_creation_debug_tasks.md`:

- [x] 1.  **Verify ID Handling in `graphStore`:**
    - [x] Check `fetchGraphData` mapping: Ensure the `id` assigned to the `Node<GraphNodeData>`'s `data` object (`data.id`) corresponds to the **`GraphNode.id`** from the backend, not the original `Note.id` or `File.id`.
    - [x] Check `addNoteNode` / `addFileNode`: Ensure these actions correctly store the **`GraphNode.id`** in the new node's `data.id` field when adding to the store state.
    - [x] Correct the mapping/actions if necessary.
- [x] 2.  **Verify ID Handling in `MindMapCanvas.onConnect`:**
    - [x] Update the regex/parsing logic in `onConnect` to extract the correct ID used by the backend for edge creation. Since the React Flow node ID is `note-X`/`file-Y` (where X/Y are *GraphNode* IDs after store fix), we need to ensure the API call uses these `GraphNode` IDs.
- [x] 3.  **Add Backend Logging:**
    - [x] Add print statements in `crud_graph.create_graph_edge` right before calling `get_graph_node` for source/target, showing the `node_id` and `user_id` being searched for.
    - [x] Add print statements in `crud_graph.get_graph_node` showing the `node_id`, `user_id` received, and whether the result is `None`.

## From `sync_graph_nodes_tasks.md`:

- [x] 1.  **Add `graph_node_id` FK to Models:**
    - [x] Add `graph_node_id = Column(Integer, ForeignKey("graph_nodes.id"), nullable=True)` to `app/models/note.py`.
    - [x] Add `graph_node_id = Column(Integer, ForeignKey("graph_nodes.id"), nullable=True)` to `app/models/file.py`.
- [x] 2.  **Database Migration for FKs:**
    - [x] Run `alembic revision --autogenerate -m "Add graph_node_id FK to notes and files"`.
    - [x] Review the generated migration script.
    - [x] Apply the migration: `alembic upgrade head`.
- [x] 3.  **Modify `crud_note.create_note`:**
    - [x] After a `Note` object is prepared but *before* commit, call `crud_graph.create_graph_node` (`node_type='note'`).
    - [x] Assign the returned `graph_node.id` to the `note.graph_node_id`.
    - [x] Commit the session (saves both `Note` and linked `GraphNode`).
- [x] 4.  **Modify `crud_file.create_file_record`:**
    - [x] After a `File` object is prepared but *before* commit, call `crud_graph.create_graph_node` (`node_type='file'`).
    - [x] Assign the returned `graph_node.id` to the `file.graph_node_id`.
    - [x] Commit the session.
- [x] 5.  **Modify `crud_note.delete_note`:**
    - [x] Get the `note_to_delete`.
    - [x] If found and `note_to_delete.graph_node_id` exists, store the `graph_node_id`.
    - [x] Delete the `note_to_delete`.
    - [x] If a `graph_node_id` was stored, call `crud_graph.delete_graph_node` with that ID.
- [x] 6.  **Modify `crud_file.delete_file_record`:**
    - [x] Get the `file_to_delete`.
    - [x] If found and `file_to_delete.graph_node_id` exists, store the `graph_node_id`.
    - [x] Delete the `file_to_delete`.
    - [x] If a `graph_node_id` was stored, call `crud_graph.delete_graph_node` with that ID.

## From `connect_file_nodes_tasks.md`:

- [x] 1.  **Update `onConnect` Handler:** Modify the `onConnect` callback in `mind-map-mentor/frontend/src/components/mindmap/MindMapCanvas.tsx` to:
    - [x] Allow connections where the source or target (or both) are `file` nodes.
    - [x] Extract the correct `source_node_id` and `target_node_id` (the numerical IDs) regardless of node type ('note' or 'file').
    - [x] Potentially add logic to define a default `relationship_type` or prompt the user if connecting different node types.
- [x] 2.  **Update Edge Creation Logic:**
    - [x] Ensure the `createGraphEdge` API call in `onConnect` sends the correct data to the backend (which now accepts generic edges).
    - [x] Verify the `addEdge` action in `graphStore.ts` correctly adds the new edge to the store's state, using prefixed IDs for source/target (`note-X`, `file-Y`).
- [x] 3.  **Add Handles to `FileNode`:** Add `Source` and `Target` handles to `mind-map-mentor/frontend/src/components/mindmap/FileNode.tsx` to visually enable connections.

## From `backend_graph_tasks.md`:

- [x] 1.  **Define Generic Graph Schemas:**
    - [x] In `app/schemas/graph.py` (create if it doesn't exist), define Pydantic schemas for generic graph nodes and edges:
        - `GraphNodeBase`, `GraphNodeCreate`, `GraphNodeUpdate`, `GraphNode` (for API responses)
        - `GraphEdgeBase`, `GraphEdgeCreate`, `GraphEdgeUpdate`, `GraphEdge` (for API responses)
    - [x] These schemas should accommodate different node types (initially 'note' and 'file', potentially more later) using a `node_type` field and possibly a flexible `data` field (JSONB). They should reference the existing `GraphNode` and `GraphEdge` *models*.
- [x] 2.  **Implement Generic Graph CRUD:**
    - [x] In `app/crud/crud_graph.py` (create if it doesn't exist), implement CRUD functions for the generic `GraphNode` and `GraphEdge` SQLAlchemy models.
        - `create_graph_node`, `get_graph_node`, `get_graph_nodes_for_user`, `update_graph_node`, `delete_graph_node`
        - `create_graph_edge`, `get_graph_edge`, `get_graph_edges_for_user`, `update_graph_edge`, `delete_graph_edge`
    - [x] Ensure user ownership checks are performed.
- [x] 3.  **Implement Generic Graph API Endpoints:**
    - [x] In `app/api/api_v1/endpoints/graph.py` (create if it doesn't exist or refactor existing), implement API endpoints for generic nodes and edges using the new schemas and CRUD functions.
        - `/graph/nodes/`: POST (create), GET (list)
        - `/graph/nodes/{node_id}`: GET (retrieve), PUT (update), DELETE (remove)
        - `/graph/edges/`: POST (create), GET (list)
        - `/graph/edges/{edge_id}`: GET (retrieve), PUT (update), DELETE (remove)
    - [x] Ensure endpoints require authentication (`Depends(deps.get_current_active_user)`).
- [x] 4.  **Refactor Frontend API Service:**
    - [x] Update `frontend/src/services/api.ts` to use the new generic graph endpoints for fetching edges (`fetchGraphEdges`) and potentially creating/deleting edges (`createGraphEdge`, `deleteGraphEdge`).
    - [x] Consider if fetching generic nodes is needed yet or if the specific `fetchNotes` and `fetchFiles` are sufficient for now.
- [x] 5.  **Database Migration:**
    - [x] Run `alembic revision --autogenerate -m "Add node_type to graph_nodes table"` to generate a migration script (if schema changes were needed, though likely based on existing models).

## From `file_nodes_tasks.md`:

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

## From `file_handling_tasks.md`:

- [X] **Backend Deps:** Add `python-multipart` to `requirements.txt` and install it.
- [X] **Backend Config:** Add a `FILE_STORAGE_PATH` setting to `core/config.py` and `.env`.
- [X] **Backend Storage Util:** Create a utility function to ensure the storage directory exists.
- [X] **Backend File CRUD:** Implement CRUD functions (`create_file_record`, `get_file`, `get_files_for_user`, `delete_file_record`) in `crud/crud_file.py`.
- [X] **Backend Upload Endpoint:** Create `POST /files/upload` endpoint in `endpoints/files.py` using `UploadFile`.
- [X] **Backend List Endpoint:** Create `GET /files/` endpoint in `endpoints/files.py`.
- [X] **Backend Delete Endpoint:** Create `DELETE /files/{file_id}` endpoint in `endpoints/files.py` (handle file system deletion too).
- [X] **Backend Download Endpoint:** Create `GET /files/{file_id}/download` endpoint using `FileResponse`.
- [X] **Backend Router:** Ensure the file router is correctly included in `api/api_v1/api.py`.
- [X] **Frontend API Service:** Add `uploadFile`, `fetchFiles`, `deleteFile` functions to `services/api.ts`.
- [X] **Frontend UI:** Add a basic file upload input/button to `SidePanel.tsx`.
- [X] **Frontend Upload Logic:** Connect the upload UI to the `uploadFile` API service function.
- [X] **Frontend File List:** Display fetched files in `SidePanel.tsx`.
- [X] **Frontend Delete Logic:** Add delete functionality to the file list.

## From `state_sync_tasks.md`:

- [X] 1.  **Store:** Create `store/graphStore.ts` with state (`notes`, `edges`, `loading`, `error`) and initial `fetchNotesAndEdges` action.
- [X] 2.  **Store:** Implement `addNote` action in `graphStore.ts`.
- [X] 3.  **Store:** Implement `updateNoteInStore` action in `graphStore.ts`.
- [X] 4.  **Store:** Implement `addEdgeToStore` action in `graphStore.ts`.
- [X] 5.  **Store:** Implement `deleteEdgeFromStore` action in `graphStore.ts`.
- [X] 6.  **Canvas:** Refactor `MindMapCanvas.tsx` to use `graphStore` for state and initial fetch.
- [X] 7.  **Canvas:** Update `handleNodeDragStop` in `MindMapCanvas.tsx` to call `updateNoteInStore` action.
- [X] 8.  **Canvas:** Update `handleModalSave` in `MindMapCanvas.tsx` to call `updateNoteInStore` action.
- [X] 9.  **Canvas:** Update `onConnect` in `MindMapCanvas.tsx` to call `addEdgeToStore` action.
- [X] 10. **Canvas:** Update `onEdgesChange` (remove case) in `MindMapCanvas.tsx` to call `deleteEdgeFromStore` action.
- [X] 11. **SidePanel:** Refactor `SidePanel.tsx` to use `graphStore` for displaying notes.
- [X] 12. **SidePanel:** Update `handleCreateNote` in `SidePanel.tsx` to call `addNote` action.

## From `graph_enhancements_tasks.md`:

- [X] **Frontend Node Display:** Modify node rendering (or create a custom node type) in `MindMapCanvas.tsx` to display note title and some content.
- [X] **Frontend Edit Modal:** Create a reusable `NoteEditModal.tsx` component.
- [X] **Frontend Edit Trigger:** Implement logic (e.g., on double-click) in `MindMapCanvas.tsx` to open the `NoteEditModal` with the selected node's data.
- [X] **Frontend Edit Save:** Connect the `NoteEditModal` save action to the existing `updateNote` API service function.
- [X] **Frontend State Update:** Update local `apiNotes` state in `MindMapCanvas.tsx` after successful modal save.
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

## From `node_position_saving_tasks.md`:

- [X] **Frontend Types:** Update `NoteUpdateData` in `types/index.ts` to accept optional `position_x` and `position_y`.
- [X] **Frontend API Service:** Create `updateNotePosition` function in `services/api.ts` to call the `PUT /notes/{note_id}` endpoint.
- [X] **Frontend Canvas:** Implement `handleNodeDragStop` function in `MindMapCanvas.tsx`.
- [X] **Frontend Canvas:** Pass `handleNodeDragStop` to the `onNodeDragStop` prop of the `<ReactFlow>` component.
- [X] **Frontend Canvas:** Add basic error handling/feedback for position updates (optional).

## From `graph_visualization_tasks.md`:

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

## From `notifications_tasks.md`:

- [x] 1.  **Install Library** Install `react-hot-toast` library.
- [x] 2.  **Integrate Provider** Import `Toaster` component from `react-hot-toast`. Add the `<Toaster />` component to the root layout (`app/layout.tsx`).
- [x] 3.  **Implement Initial Toasts (Note Deletion)** In `NoteItem.tsx` -> `handleDelete`: Import `toast`. Replace `alert()` with `toast.error`. Add `toast.success` after success.
- [x] 4.  **Implement Toasts for Other Operations**
    - [x] **Note Creation:** In `SidePanel.tsx` -> `handleCreateNote`: Add `toast.success` and `toast.error`.
    - [x] **Note Update:** In `EditNoteModal.tsx` -> `handleSubmit`: Modify error handling for `toast.error`. Add `toast.success` in `SidePanel.tsx` -> `handleUpdateNote`.
    - [x] **Login:** In `LoginForm.tsx` -> `handleSubmit`: Add `toast.error`.
    - [x] **Signup:** In `SignupForm.tsx` -> `handleSubmit`: Add `toast.error`.

## From `notes_loading_debug_tasks.md`:

- [x] 1.  **Check Frontend Console Logs** Check for errors related to `/api/v1/notes/`, `fetchNotes`, or `loadNotes`.
- [x] 2.  **Add Frontend Component Logging** Add logs in `SidePanel.tsx` -> `loadNotes` and `NoteList.tsx`.
- [x] 3.  **Verify API Request/Response** Add logging in Axios interceptor and `fetchNotes` catch block.
- [x] 4.  **Check Backend Logs** Look for errors related to `GET /api/v1/notes/`.
- [x] 5.  **Analyze and Fix** Identify root cause (State update timing). Implement fix (Modified `setUser` in `authStore.ts`).

## From `routing_refactor_tasks.md`:

- [x] 1.  **Create Login Page Component** Create `app/login/page.tsx`, render `LoginForm`.
- [x] 2.  **Create Signup Page Component** Create `app/signup/page.tsx`, render `SignupForm`.
- [x] 3.  **Update Landing Page Links** Point Login to `/login` and Sign Up to `/signup`.
- [x] 4.  **Refactor AuthGuard Logic** Remove forms from `AuthGuard`. Redirect unauth to `/login`, auth accessing login/signup to `/dashboard`.
- [x] 5.  **Refactor Login/Signup Success Handling** Redirect to `/dashboard` after login, `/login` after signup.

## From `session_debug_tasks.md`:

- [x] 1.  **Increase Token Lifetime (Backend)** Update `ACCESS_TOKEN_EXPIRE_MINUTES` to 10080 (7 days).
- [x] 2.  **Verify Persistence (Frontend)** Check `authStore.ts` for `persist` middleware with `localStorage`.
- [x] 3.  **Debug Refresh Flow (Frontend)** Add logging in `AuthGuard`, Axios interceptor, `getCurrentUser`.

## From `edit_note_tasks.md`:

- [x] Create the basic structure for the `EditNoteModal.tsx` component.
- [x] Add state variables (`editingNote`, `isEditModalOpen`) to `SidePanel.tsx`.
- [x] Create functions in `SidePanel.tsx` to handle opening (`openEditModal(note)`) and closing (`closeEditModal()`).
- [x] Pass `openEditModal` down through `NoteList` to `NoteItem`.
- [x] Update `handleEdit` in `NoteItem.tsx` to call `openEditModal`.
- [x] Render the `EditNoteModal` conditionally in `SidePanel.tsx` and pass props.
- [x] Implement the form logic within `EditNoteModal.tsx` (state, inputs, submit).
- [x] Implement the `handleUpdateNote` function in `SidePanel.tsx` (call API, refresh, close).
- [x] Wire up the modal's `handleSubmit` to call the `onUpdate` prop.

## From `landing_page_and_theme_tasks.md`:

- [x] Analyze Proton's color palette and select corresponding Tailwind colors.
- [x] Update `globals.css` or component styles with the refined color palette.
- [x] Re-apply refined theme colors consistently across components.
- [x] Decide on routing: Landing page at `/`, dashboard at `/dashboard`.
- [x] Create the landing page component (`app/page.tsx`).
- [x] Design the landing page layout.
- [x] Add content (headings, text).
- [x] Add "Login" and "Sign Up" buttons/links on the landing page.
- [x] Implement navigation from landing page buttons.
- [x] Update `AuthGuard.tsx` routing logic.

## From `ui_improvements_tasks.md`:

- [x] Review and ensure routing logic correctly handles logged-in/logged-out states.
- [x] Implement a dedicated Logout button (in SidePanel).
- [x] Display basic user information (email in SidePanel).
- [x] Apply the light theme styling (inputs, buttons, cards) to the `LoginForm.tsx` component.
- [x] Apply the light theme styling (inputs, buttons, cards) to the `SignupForm.tsx` component.
- [x] Replace text buttons ('Edit', 'Del') in `NoteItem.tsx` with icons.

## From `next_implementation_tasks.md`:

- [x] 1. **Backend - User/Auth Implementation** Review/Refine `crud_user.py`. Implement `GET /users/me`.
- [x] 2. **Frontend - Auth UI & API Connection** Create `LoginForm`, `SignupForm`. Set up `authStore`. Create API service functions (`loginUser`, `signupUser`, `getCurrentUser`). Connect forms to API/store. Configure Axios interceptor. Implement basic conditional routing.
- [x] 3. **Backend - Notes CRUD Implementation** Create `crud_note.py` with functions. Implement endpoints in `notes.py`. Ensure ownership checks.
- [x] 4. **Frontend - Basic Notes UI** Create `NoteList`, `NoteItem`, `CreateNoteForm`. Add API service functions (`fetchNotes`, `createNote`). Display notes, integrate creation form.

## From `frontend_setup_tasks.md`:

- [x] 1. Project Initialization & Environment (Next.js, TS, Tailwind, Zustand, Axios).
- [x] 2. Tailwind CSS Configuration.
- [x] 3. Basic Project Structure (`src/`, `components/`, `store/`, `services/`, etc.).
- [x] 4. Layout Implementation (`DashboardLayout`, `SidePanel`, `MainContent`).
- [x] 5. React Flow Setup (`MindMapCanvas`, basic handlers, render blank canvas).

## From `backend_setup_tasks.md`:

- [x] 1. Project Initialization & Environment (FastAPI, venv, base packages, structure, config).
- [x] 2. Database Schema Design (SQLAlchemy Models for User, Note, File, GraphNode, GraphEdge).
- [x] 3. Pydantic Schemas (for all models).
- [x] 4. Database Connection & Migrations (session.py, Alembic setup, initial migration).
- [x] 5. Basic Authentication (security.py, crud_user.py, login/users endpoints, deps.py).
- [x] 6. API Stubs (Placeholder endpoints for Notes, Files, Graph Nodes/Edges requiring auth).

## From `all_tasks.md` & `plan.md`:

(Note: These were high-level planning files, individual completed items are likely captured in the more specific task files above).

## From `fixed_note_tags_tasks.md`:

- [X] **Verify/Update Note Update Schema:**
    - [X] In `schemas/note.py`, ensure the `NoteUpdate` schema includes `tags: List[str] | None = None`.
- [X] **Verify/Update Note CRUD Function:**
    - [X] In `crud/crud_note.py`, review the `update_note` function.
    - [X] Ensure it correctly handles the `tags` field if present in the input.
    - [X] Ensure manual tags overwrite existing tags.
    - [X] Confirm manual tags update happens before AI regeneration.
- [X] **Verify Note Update API Endpoint:**
    - [X] In `endpoints/notes.py`, confirm the `PUT /notes/{note_id}` endpoint uses `NoteUpdate` schema.
    - [X] Confirm the endpoint returns the updated `Note` object.
- [X] **Design Tag Editing UI/UX:**
    - [X] Choose Interaction Method: Option B (Inline editing in NoteNode.tsx).
- [X] **Implement Tag Editing Component:**
    - [X] Modify `NoteNode.tsx`.
    - [X] Add input element for comma-separated tags.
    - [X] Add local state for tag editing.
    - [X] Initialize local state on edit start.
    - [X] Handle user input and parse tags.
- [X] **Implement Save Logic:**
    - [X] Define Save Trigger (`onBlur`, Enter key).
    - [X] Create `handleSaveTags` function.
    - [X] Get `original_note_id` and edited tags.
    - [X] Compare changes.
    - [X] Call `updateNote` API service if tags changed.
    - [X] Close/Reset UI after save attempt.
- [X] **Update Frontend Store:**
    - [X] Ensure store updates tags after successful API call (Manual call via `updateNodeData`).
    - [X] Call store update in `handleSaveTags`.
- [X] **Tag Display:**
    - [X] Verify display logic in `NoteNode.tsx` shows updated tags.
- [X] **User Feedback:**
    - [X] Import `toast`.
    - [X] Add success/error toasts in `handleSaveTags`.
- [X] **Testing:**
    - [X] Test Add.
    - [X] Test Edit.
    - [X] Test Remove All.
    - [X] Test Interaction with AI Tags.
    - [X] Test Error Handling. 