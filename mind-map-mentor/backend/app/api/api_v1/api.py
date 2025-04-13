from fastapi import APIRouter

# Import endpoint modules directly
from app.api.api_v1.endpoints import login, users, notes, files, graph, ai

api_router = APIRouter()

# Include routers from the imported modules
api_router.include_router(login.router, prefix="/login", tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(graph.router, prefix="/graph", tags=["graph"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])