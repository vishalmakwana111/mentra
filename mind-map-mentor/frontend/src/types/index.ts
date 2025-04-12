// Shared TypeScript types and interfaces

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string; // Or Date if you parse it
}

export interface Note {
  id: number;
  user_id: number;
  title: string | null;
  content: string | null;
  position_x?: number | null; // Optional position x
  position_y?: number | null; // Optional position y
  created_at: string; // Or Date
  updated_at: string | null; // Or Date
}

export interface File {
  id: number;
  user_id: number;
  filename: string;
  mime_type: string | null;
  size: number | null;
  created_at: string; // Or Date
}

// Data required to create a note
export interface NoteCreateData {
  title: string; // Title is required for creation
  content?: string | null; // Content is optional
}

// Data allowed when updating a note
export interface NoteUpdateData {
  title?: string | null; // Title is optional for update
  content?: string | null; // Content is optional
  position_x?: number | null; // Position is optional for update
  position_y?: number | null; // Position is optional for update
}

// GraphNode and GraphEdge types
export interface GraphNode {
    id: number;
    user_id: number;
    label: string | null;
    data: { [key: string]: any } | null;
    position: { x: number; y: number } | null;
    created_at: string;
    updated_at: string | null;
}

export interface GraphEdge {
    id: number;
    user_id: number;
    source_node_id: number;
    target_node_id: number;
    relationship_type: string | null;
    data: { [key: string]: any } | null;
    created_at: string;
    updated_at: string | null;
}

// Placeholder for edge creation data (if needed for API)
// export interface GraphEdgeCreateData {
//   source_node_id: number;
//   target_node_id: number;
//   relationship_type?: string | null;
//   data?: { [key: string]: any } | null;
// }

// Add GraphNode and GraphEdge types later 