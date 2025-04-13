# AI Integration Tasks (LangChain Setup with Pinecone)

This file outlines the initial tasks for integrating LangChain and Pinecone vector database into the backend.

## Phase 1: Setup and Embedding

- [ ] **Vector Database Setup (Pinecone)**
    - [ ] Create a Pinecone account and obtain an API key.
    - [ ] Create a Pinecone index (e.g., via the Pinecone console). Note the index name and environment.
    - [ ] (No Docker setup required for Pinecone itself, it's a cloud service).
- [ ] **Install Dependencies**
    - [ ] Add `langchain`, `langchain-community`, `langchain-core`, `pinecone-client[grpc]`, `langchain-pinecone`, `sentence-transformers` to `backend/requirements.txt`. (Added `langchain-pinecone` for integration helper).
    - [ ] Run `pip install -r backend/requirements.txt` in the backend virtualenv.
- [ ] **Backend Structure**
    - [ ] Create directory `backend/app/ai/`.
    - [ ] Create file `backend/app/ai/embeddings.py`.
    - [ ] Create file `backend/app/ai/vectorstore.py`.
    - [ ] Create file `backend/app/ai/chains.py`.
- [ ] **Configuration**
    - [ ] Add `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `PINECONE_INDEX_NAME` to `.env` and `backend/app/core/config.py`.
    - [ ] Ensure `Settings` model loads these variables.
- [ ] **Vector Store Initialization**
    - [ ] Implement Pinecone client initialization in `vectorstore.py` using config settings (`pinecone.init`).
    - [ ] Define a function `get_pinecone_index()` to return the index object.
    - [ ] Define `upsert_document(doc_id: str, vector: List[float], metadata: dict)` using `index.upsert`.
    - [ ] Define `delete_document(doc_id: str)` using `index.delete`.
    - [ ] (Update might require delete + upsert or just upsert depending on ID strategy).
- [ ] **Embedding Logic**
    - [ ] Implement loading of a `SentenceTransformer` model in `embeddings.py`.
    - [ ] Define a function `get_embedding_function()` or `generate_embedding(text: str) -> List[float]`.
- [ ] **Integrate Embedding into CRUD**
    - [ ] Modify `backend/app/crud/crud_note.py`:
        - [ ] Inject Pinecone index/functions.
        - [ ] Generate embedding in `create_note`.
        - [ ] Call `upsert_document` in `create_note` after successful note creation. Format `doc_id` (e.g., `note_{note.id}`).
        - [ ] Generate embedding and call `upsert_document` in `update_note` if content changes (Pinecone upsert handles updates).
        - [ ] Call `delete_document` in `delete_note` before deleting the note.

## Phase 2: Basic Retrieval

- [ ] **Basic Retrieval Chain/Function**
    - [ ] Implement a simple retrieval function in `chains.py` or `vectorstore.py`.
    - [ ] Use the initialized Pinecone index and embedding generation function.
    - [X] Function should accept a query string, generate its embedding, and use `index.query` to find relevant document IDs/metadata.
- [X] **API Endpoint for Retrieval**
    - [X] Create `backend/app/api/v1/endpoints/ai.py`.
    - [X] Add the router to `backend/app/api/api_v1/api.py`.
    - [X] Implement `GET /ai/search-notes?query=...` endpoint.
    - [X] Endpoint depends on the retrieval function.
    - [X] Define appropriate request/response schemas in `backend/app/schemas/ai.py` (create this file).
- [ ] **Testing**
    - [X] Create a few notes.
    - [X] Verify vectors are added/updated in the Pinecone index (e.g., via Pinecone console).
    - [X] Test the `/ai/search-notes` endpoint with relevant queries.
    - [ ] Test note update and delete functions to ensure vector store sync. 