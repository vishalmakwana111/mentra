from fastapi import APIRouter

# Import the consolidated graph endpoint module
from app.api.api_v1.endpoints import login, users, notes, files, graph 

api_router = APIRouter()

api_router.include_router(login.router, prefix="/login", tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
# Include the consolidated graph router
api_router.include_router(graph.router, prefix="/graph", tags=["graph"])