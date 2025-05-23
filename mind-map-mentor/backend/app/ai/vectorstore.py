# Functions for interacting with the Pinecone vector store using LangChain integration

import pinecone
# Import the Pinecone class directly
from pinecone import Pinecone, Index, ServerlessSpec 
from typing import List, Dict, Any, Optional
import logging

# Langchain specific imports
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from app.core.config import settings
from app.ai.embeddings import get_embedding_function # Import function to get embedder

logger = logging.getLogger(__name__)

# Store the Pinecone client instance and VectorStore instance globally
_pinecone_client: Pinecone | None = None
_vector_store_instance: PineconeVectorStore | None = None

def initialize_pinecone_and_vector_store():
    """Initializes the Pinecone client, gets index, gets embedder, and creates PineconeVectorStore."""
    global _pinecone_client, _vector_store_instance
    if _vector_store_instance:
        logger.info("Pinecone vector store already initialized.")
        return

    try:
        logger.info("Initializing Pinecone connection...")
        # 1. Initialize Pinecone Client (New Method)
        if not settings.PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY not set in environment variables.")
        
        _pinecone_client = Pinecone(
            api_key=settings.PINECONE_API_KEY
            # environment is often not needed for init, but used later if creating index
        )
        index_name = settings.PINECONE_INDEX_NAME
        
        # 2. Check if index exists using the client instance
        # Note: list_indexes() returns IndexList object containing list of Index objects
        # Older versions returned list of strings, newer returns IndexList.
        # Let's check based on the structure suggested by recent client versions/examples
        # existing_indexes = _pinecone_client.list_indexes().names # .names might be available
        # If .names is not available, iterate:
        existing_indexes = [index_info.name for index_info in _pinecone_client.list_indexes()] 

        if index_name not in existing_indexes:
            logger.error(f"Pinecone index '{index_name}' does not exist in environment '{settings.PINECONE_ENVIRONMENT}'.")
            # Add logic here to create the index if desired, matching the required dimension (1536)
            # logger.info(f"Attempting to create index '{index_name}'...")
            # _pinecone_client.create_index(
            #     name=index_name,
            #     dimension=1536, # Match your embedding dimension
            #     metric="cosine", # or "dotproduct" or "euclidean"
            #     spec=ServerlessSpec(
            #         cloud="aws", # Match your cloud provider
            #         region=settings.PINECONE_ENVIRONMENT # Use the environment as region
            #     )
            # )
            # import time
            # while not _pinecone_client.describe_index(index_name).status['ready']:
            #     logger.info("Waiting for index to be ready...")
            #     time.sleep(5)
            # logger.info(f"Index '{index_name}' created successfully.")
            raise ValueError(f"Pinecone index '{index_name}' not found.")
        
        # 3. Get Pinecone Index Object using the client instance
        pinecone_index_object = _pinecone_client.Index(index_name)
        logger.info(f"Successfully connected to Pinecone index '{index_name}'.")

        # 4. Get Embedding Function
        logger.info("Initializing embedding function...")
        embedding_function: Embeddings = get_embedding_function()
        logger.info("Embedding function initialized.")

        # 5. Initialize LangChain PineconeVectorStore
        _vector_store_instance = PineconeVectorStore(
            index=pinecone_index_object, # Pass the Index object
            embedding=embedding_function,
            text_key='text' 
        )
        logger.info("PineconeVectorStore initialized successfully.")

    except Exception as e:
        logger.exception(f"Failed to initialize Pinecone Vector Store: {e}", exc_info=True)
        _pinecone_client = None
        _vector_store_instance = None 
        raise # Re-raise after logging

def get_vector_store() -> PineconeVectorStore:
    """Returns the initialized PineconeVectorStore instance. Initializes if needed."""
    if _vector_store_instance is None:
        logger.warning("Pinecone vector store accessed before initialization. Initializing now.")
        initialize_pinecone_and_vector_store()
        if _vector_store_instance is None:
            raise RuntimeError("Pinecone vector store could not be initialized.")
    return _vector_store_instance

# --- Modified CRUD Operations using PineconeVectorStore ---

def upsert_document(
    note_id: int, 
    text_content: str, 
    metadata: Dict[str, Any], 
    summary_text: Optional[str] = None
):
    """Creates LangChain Documents and upserts content and summary vectors using PineconeVectorStore."""
    logger.info(f"Attempting to upsert vectors for Note ID: {note_id}")
    try:
        vector_store = get_vector_store()
        
        # 1. Upsert Content Vector
        content_doc_id = f"note_{note_id}_content"
        content_metadata = metadata.copy() # Avoid modifying original dict
        content_metadata["embedding_type"] = "content"
        
        content_doc = Document(page_content=text_content, metadata=content_metadata)
        logger.debug(f"Upserting content vector (ID: {content_doc_id}) for Note ID: {note_id}")
        vector_store.add_documents(documents=[content_doc], ids=[content_doc_id])
        logger.debug(f"Successfully submitted content vector upsert for Note ID: {note_id}")
        
        # 2. Upsert Summary Vector (if summary provided)
        if summary_text and summary_text.strip():
            summary_doc_id = f"note_{note_id}_summary"
            summary_metadata = metadata.copy() # Use a fresh copy
            summary_metadata["embedding_type"] = "summary"
            
            summary_doc = Document(page_content=summary_text, metadata=summary_metadata)
            logger.debug(f"Upserting summary vector (ID: {summary_doc_id}) for Note ID: {note_id}")
            vector_store.add_documents(documents=[summary_doc], ids=[summary_doc_id])
            logger.debug(f"Successfully submitted summary vector upsert for Note ID: {note_id}")
        else:
            logger.debug(f"No summary provided or empty for Note ID: {note_id}. Skipping summary vector upsert.")

        logger.info(f"Vector upsert process completed for Note ID: {note_id}")

    except Exception as e:
        logger.error(f"Failed during vector upsert process for Note ID: {note_id}: {e}", exc_info=True)

def delete_document(note_id: int):
    """Deletes both content and summary vectors for a given note ID using PineconeVectorStore."""
    content_doc_id = f"note_{note_id}_content"
    summary_doc_id = f"note_{note_id}_summary"
    ids_to_delete = [content_doc_id, summary_doc_id]
    logger.info(f"Attempting to delete vectors for Note ID: {note_id} (IDs: {ids_to_delete})")
    try:
        vector_store = get_vector_store()
        vector_store.delete(ids=ids_to_delete)
        logger.info(f"Successfully submitted deletion request for vectors associated with Note ID: {note_id}")
    except Exception as e:
        # Log error but don't prevent other operations, deletion is best-effort
        logger.error(f"Failed during vector deletion process for Note ID: {note_id}: {e}", exc_info=True)

def query_similar_notes(
    query_text: str,
    user_id: int,
    embedding_type_filter: str, # Add embedding type filter
    top_k: int = 5,
    filter: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """Finds vectors similar to the query text using PineconeVectorStore, filtered by user_id and embedding_type.
       Returns a list of dicts, each containing 'id', 'score', 'metadata', and 'page_content'.
    """
    # Ensure base filter includes the user_id and embedding_type
    final_filter = {
        "user_id": user_id,
        "embedding_type": embedding_type_filter # Add the mandatory type filter
    }
    if filter: # Allow merging with other potential filters if needed later
        final_filter.update(filter)

    logger.info(f"Attempting vector search for query: '{query_text}', user_id: {user_id}, top_k={top_k}, filter={final_filter}")
    try:
        vector_store = get_vector_store()

        logger.debug(f"Calling vector_store.similarity_search_with_score...")
        results_with_scores = vector_store.similarity_search_with_score(
            query=query_text,
            k=top_k,
            filter=final_filter # Use the final filter
        )
        logger.debug(f"vector_store.similarity_search_with_score returned: {results_with_scores}")

        # Process results
        similar_notes_data = []
        for doc, score in results_with_scores: # doc is a LangChain Document object
            page_content = doc.page_content  # Extract page content
            metadata = doc.metadata or {}

            # Extract note_id as int
            note_id_float = metadata.get('note_id')
            note_id = int(note_id_float) if note_id_float is not None else None

            # Extract user_id as int
            user_id_float = metadata.get('user_id')
            retrieved_user_id = int(user_id_float) if user_id_float is not None else None # Use different variable name

            # Update metadata dict in-place with integer versions if they exist
            if note_id is not None:
                metadata['note_id'] = note_id
            if retrieved_user_id is not None:
                metadata['user_id'] = retrieved_user_id # Update with the int version

            # Construct vector ID using integer note_id
            vector_id = f"note_{note_id}" if note_id is not None else None

            if vector_id:
                similar_notes_data.append({
                    'id': vector_id,
                    'score': score,
                    'metadata': metadata,
                    'page_content': page_content # <-- Add page_content here
                })
            else:
                logger.warning(f"Could not determine vector ID from metadata for a search result: {metadata}")

        logger.debug(f"Processed {len(similar_notes_data)} similar notes for query via PineconeVectorStore.")
        return similar_notes_data

    except Exception as e:
        logger.exception(f"Error querying PineconeVectorStore for similar notes: {e}", exc_info=True)
        return [] # Return empty list on error

# Consider calling initialize_pinecone_and_vector_store() at application startup