from fastapi import APIRouter

from app.api.api_v1.endpoints import login, users, notes, files, graph_edges
# Import graph_nodes when ready
# from app.api.api_v1.endpoints import graph_nodes

api_router = APIRouter()

api_router.include_router(login.router, prefix="/login", tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
# Include graph_nodes router when ready
# api_router.include_router(graph_nodes.router, prefix="/graph/nodes", tags=["graph-nodes"])
api_router.include_router(graph_edges.router, prefix="/graph/edges", tags=["graph-edges"])