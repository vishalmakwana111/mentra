"""Pydantic schemas for AI-related features."""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# --- Schemas for Semantic Search (/ai/search-notes) --- #

# Schema for the result of a vector search match
class SearchMatch(BaseModel):
    id: str # Vector ID (e.g., note_123)
    score: float = Field(..., description="Similarity score")
    metadata: Dict[str, Any] = Field(..., description="Metadata associated with the vector")

# Schema for the response of the search endpoint
class SearchResponse(BaseModel):
    query: str
    results: List[SearchMatch]

# --- Schemas for RAG Query (/ai/rag-query) --- #

class RagQueryRequest(BaseModel):
    query: str = Field(..., description="The user's question for RAG.")

class RagSourceDocument(BaseModel):
    # Information about the source notes used for the answer
    note_id: Optional[int] = Field(None, description="Original ID of the source note")
    title: Optional[str] = Field(None, description="Title of the source note")
    # Could add score or snippets later if needed

class RagQueryResponse(BaseModel):
    answer: str = Field(..., description="The generated answer.")
    sources: List[RagSourceDocument] = Field(..., description="List of source documents used for the answer.") 