# Automatic Edge Creation Tasks

This file outlines the tasks for automatically creating edges between semantically similar notes.

- [X] **Define Similarity Threshold:**
    - [X] Decide on a minimum similarity score (e.g., 0.75) from Pinecone results to consider notes related.
    - [X] Add this threshold to backend configuration (`config.py` and `.env`).
- [ ] **Modify `create_note` Function (`crud_note.py`):**
    - [X] After a new note and its graph node are created and committed, trigger the similarity search and edge creation process.
    - [X] Pass the new note's content, its `graph_node_id`, and `user_id` to the logic.
- [ ] **Implement Edge Creation Logic:**
    - [X] Create a new helper function (e.g., `find_and_create_similar_note_edges` in `crud_note.py` or a dedicated `ai/graph_logic.py`).
    - [X] This function should:
        - [X] Call `query_similar_notes` using the new note's content.
        - [X] Iterate through results, filtering out the note itself and results below the similarity threshold.
        - [X] For each valid similar result:
            - [X] Extract the `note_id` of the similar note from the metadata.
            - [X] Fetch the similar `Note` object from the database using `get_note(db, note_id=similar_note_id, user_id=user_id)` to get its `graph_node_id`.
            - [X] Ensure both the new note's graph node ID and the similar note's graph node ID are valid.
            - [ ] Check if an edge already exists between these two nodes (optional, to prevent duplicates).
            - [X] Call `crud_graph.create_graph_edge` to create the edge in the database (using the two `graph_node_id`s and the `user_id`).
        - [X] Handle potential errors gracefully (e.g., log issues if a similar note or its graph node isn't found).
- [ ] **Refine `query_similar_notes` (Optional but Recommended):**
    - [X] Modify `query_similar_notes` in `vectorstore.py` to accept the `user_id`.
    - [X] Add a `filter` argument to the `vector_store.similarity_search_with_score` call to only search within notes belonging to the same user (`filter={'user_id': user_id}`).
    - [X] Update the calls in `endpoints/ai.py` and the new edge creation logic to pass the `user_id`.
- [ ] **Frontend Update (Verification):**
    - [ ] Verify that when a new note is created, the `graphStore`'s `fetchGraphData` (or subsequent fetches) includes the newly created automatic edges.
    - [ ] Ensure React Flow renders these new edges correctly without further changes (likely already works).
- [ ] **Testing:**
    - [ ] Create several notes with overlapping but distinct content.
    - [ ] Create a new note that is clearly similar to one or more existing notes.
    - [ ] Check the backend logs for edge creation messages.
    - [ ] Check the database `graph_edges` table for new entries.
    - [ ] Refresh the frontend canvas and verify the new edges appear automatically, connecting the new note to the similar ones.
    - [ ] Test with a new note that shouldn't be similar to anything – ensure no spurious edges are created. 