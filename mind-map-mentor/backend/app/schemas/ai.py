from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# Schema for the result of a vector search match
class SearchMatch(BaseModel):
    id: str # The vector ID (e.g., "note_123")
    score: Optional[float] = None
    metadata: Dict[str, Any]

# Schema for the response of the search endpoint
class SearchResponse(BaseModel):
    query: str
    results: List[SearchMatch] 