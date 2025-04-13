from fastapi import APIRouter, Query, Depends, HTTPException
from typing import List, Optional
import logging # Add logging

from app import schemas # Assuming schemas.__init__ will expose AI schemas
from app.api import deps
from app.models import User
# Uncomment the vector store import 
from app.ai.vectorstore import query_similar_notes 
from app.ai.rag import generate_rag_answer # Import the new RAG function

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/search-notes", response_model=schemas.ai.SearchResponse)
def search_notes_endpoint(
    query: str = Query(..., description="The search query string."),
    top_k: Optional[int] = Query(5, description="Number of results to return.", ge=1, le=20),
    current_user: User = Depends(deps.get_current_active_user) # Require authenticated user
):
    """
    Performs semantic search for notes based on the query for the current user.
    """
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter cannot be empty.")
    
    try:
        # Pass user_id for filtering
        search_results = query_similar_notes(
            query_text=query, 
            user_id=current_user.id, 
            top_k=top_k
        )
        
        pydantic_results = [schemas.ai.SearchMatch(**result) for result in search_results]
        
        return schemas.ai.SearchResponse(query=query, results=pydantic_results)
    
    except Exception as e:
        logger.exception(f"Error during note search for query '{query}', user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during search.") 

# --- New RAG Endpoint --- #
@router.post("/rag-query", response_model=schemas.ai.RagQueryResponse)
async def rag_query_endpoint(
    request: schemas.ai.RagQueryRequest, # Use the request schema
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Performs Retrieval Augmented Generation based on the user's query
    and their existing notes.
    """
    if not request.query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    logger.info(f"Received RAG query from user {current_user.id}: '{request.query[:50]}...'")
    
    try:
        # Call the async RAG function
        rag_result = await generate_rag_answer(query=request.query, user_id=current_user.id)
        
        # Check if the function returned an error structure or valid data
        # (generate_rag_answer currently returns a dict even on error)
        # We might want to raise an exception from generate_rag_answer on critical errors
        # and handle it here, but for now, we return the result directly.
        
        return rag_result # Directly return the dict {answer: str, sources: List}
    
    except Exception as e:
        # Catch unexpected errors during the RAG process
        logger.exception(f"Unhandled error during RAG query for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during RAG processing.") 