# mind-map-mentor/backend/app/crud/__init__.py
from .crud_user import get_user_by_email, create_user, authenticate_user
from .crud_note import get_note, get_notes_for_user, create_note_for_user, update_note, delete_note
# Add imports for file CRUD if/when created
# from .crud_file import file
# Add imports for graph node CRUD if/when created
# from .crud_graph_node import graph_node
from .crud_graph_edge import (
    create_graph_edge_for_user, 
    get_graph_edges_for_user, 
    get_graph_edge, 
    update_graph_edge, 
    delete_graph_edge
)
# Add imports for file and graph CRUD later when implemented 