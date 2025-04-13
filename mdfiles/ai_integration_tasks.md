# AI Integration Tasks (LangChain Setup with Pinecone)

This file outlines the initial tasks for integrating LangChain and Pinecone vector database into the backend.

## Phase 1: Setup and Embedding

- [X] **Vector Database Setup (Pinecone)**
    - [X] Create a Pinecone account and obtain an API key. (Assumed done, key present)
    - [X] Create a Pinecone index (e.g., via the Pinecone console). Note the index name and environment. (Assumed done, details present)
- [X] **Install Dependencies**
    - [X] Add `langchain`, `langchain-community`, `langchain-core`, `pinecone-client[grpc]`, `langchain-pinecone`, `sentence-transformers`, `openai`, `langchain-openai` to `backend/requirements.txt`.
    - [X] Run `pip install -r backend/requirements.txt` in the backend virtualenv. (Assumed run by user)
- [X] **Backend Structure**
    - [X] Create directory `backend/app/ai/`.
    - [X] Create file `backend/app/ai/embeddings.py`.
    - [X] Create file `backend/app/ai/vectorstore.py`.
    - [X] Create file `backend/app/ai/chains.py`.
- [X] **Configuration**
    - [X] Add `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `PINECONE_INDEX_NAME`, `OPENAI_API_KEY` to `.env` and `backend/app/core/config.py`.
    - [X] Ensure `Settings` model loads these variables.
- [X] **Vector Store Initialization**
    - [X] Implement Pinecone client/LangChain `PineconeVectorStore` initialization in `vectorstore.py` using config settings.
    - [X] Implement `get_vector_store()` function.
    - [X] Implement `upsert_document(doc_id: str, text_content: str, metadata: dict)` using `vector_store.add_documents`.
    - [X] Implement `delete_document(doc_id: str)` using `vector_store.delete`.
- [X] **Embedding Logic**
    - [X] Implement loading of `OpenAIEmbeddings` model in `embeddings.py`.
    - [X] Implement function `get_embedding_function()`.
- [ ] **Integrate Embedding into CRUD**
    - [X] Modify `backend/app/crud/crud_note.py`:
        - [X] Inject vector store/embedding functions.
        - [X] Call `upsert_document` in `create_note` after successful note creation using `note_{db_note.id}` (or similar) as ID.
        - [X] Call `upsert_document` in `update_note` if content changes (and `delete_document` if content becomes null).
        - [X] Call `delete_document` in `delete_note` after successful DB commit.

## Phase 2: Basic Retrieval

- [X] **Basic Retrieval Chain/Function**
    - [X] Implement `query_similar_notes` in `vectorstore.py` using `vector_store.similarity_search_with_score`.
    - [X] Function accepts a query string, user_id, generates embedding implicitly, and uses Pinecone query with filtering.
- [X] **API Endpoint for Retrieval**
    - [X] Create `backend/app/api/v1/endpoints/ai.py`.
    - [X] Add the router to `backend/app/api/api_v1/api.py`.
    - [X] Implement `GET /ai/search-notes?query=...` endpoint.
    - [X] Endpoint depends on the retrieval function.
    - [X] Define appropriate request/response schemas in `backend/app/schemas/ai.py` (create this file).
- [X] **Testing**
    - [X] Create a few notes.
    - [X] Verify vectors are added/updated in the Pinecone index (e.g., via Pinecone console).
    - [X] Test the `/ai/search-notes` endpoint with relevant queries.
    - [X] Test note update and delete functions to ensure vector store sync. (Verified through latest tests) 