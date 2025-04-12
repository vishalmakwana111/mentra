# mind-map-mentor/backend/app/crud/__init__.py
from .crud_user import get_user_by_email, create_user, authenticate_user
from .crud_note import create_note, get_notes_for_user, get_note, update_note, delete_note
from .crud_file import (
    create_file_record, 
    get_files_for_user, 
    get_file, 
    delete_file_record,
    update_file_position
)
# Import generic graph CRUD functions
from .crud_graph import (
    get_graph_node, get_graph_nodes_for_user, create_graph_node, update_graph_node, delete_graph_node,
    get_graph_edge, get_graph_edges_for_user, create_graph_edge, update_graph_edge, delete_graph_edge
)
# Add imports for file and graph CRUD later when implemented 