# Functions for text embedding generation 

import logging
from typing import List

from langchain_openai import OpenAIEmbeddings
from app.core.config import settings

logger = logging.getLogger(__name__)

# Global variable to hold the embedding instance
_embedding_function = None

# Specify the model name corresponding to 1536 dimensions
# Note: Ensure your OpenAI plan supports this model
OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"

def initialize_embedding_function():
    """Initializes the OpenAI embedding function client."""
    global _embedding_function
    if not settings.OPENAI_API_KEY:
        logger.error("OpenAI API Key not found in settings. Cannot initialize embedding function.")
        raise ValueError("OPENAI_API_KEY is not configured.")
    
    try:
        _embedding_function = OpenAIEmbeddings(
            model=OPENAI_EMBEDDING_MODEL,
            openai_api_key=settings.OPENAI_API_KEY # Explicitly pass, though often picked from env
        )
        logger.info(f"Initialized OpenAI Embedding function with model: {OPENAI_EMBEDDING_MODEL}")
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI Embeddings: {e}")
        _embedding_function = None # Ensure it's None if init fails
        raise

def get_embedding_function() -> OpenAIEmbeddings:
    """Returns the initialized OpenAI embedding function. Initializes if needed."""
    if _embedding_function is None:
        logger.warning("OpenAI embedding function accessed before initialization. Initializing now.")
        initialize_embedding_function()
        if _embedding_function is None: # Check again
            raise RuntimeError("OpenAI Embedding function could not be initialized.")
    return _embedding_function

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generates embeddings for a list of texts."""
    embedder = get_embedding_function()
    return embedder.embed_documents(texts)

def generate_embedding(text: str) -> List[float]:
    """Generates embedding for a single text."""
    embedder = get_embedding_function()
    return embedder.embed_query(text) # Use embed_query for single text/queries

# Consider initializing at startup similar to Pinecone 