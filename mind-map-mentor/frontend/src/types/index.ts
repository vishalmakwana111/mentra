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

// Renamed from File to avoid conflict with global File type
export interface ApiFile {
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

// --- Graph Representation Types (for Frontend/React Flow) ---

// Common properties for any graph node data payload
interface BaseGraphNodeData {
    id: number; // Corresponds to Note ID or File ID
    label: string; // Display label (from Note title or File filename)
    // Store original position if available (e.g., from Note)
    // React Flow manages the node's rendered position separately
    position_x?: number | null; 
    position_y?: number | null;
}

// Specific data for a note node
interface NoteNodeData extends BaseGraphNodeData {
    type: 'note';
    content: string | null;
    // Include other relevant note fields if needed for display/interaction
    created_at: string;
    updated_at: string | null;
    // You might want to include the original Note object for reference
    // originalNote: Note; 
}

// Specific data for a file node
interface FileNodeData extends BaseGraphNodeData {
    type: 'file';
    filename: string; // Keep original filename for potential use
    mime_type: string | null;
    size: number | null;
    // Include other relevant file fields if needed
    created_at: string;
    // You might want to include the original ApiFile object for reference
    // originalFile: ApiFile;
}

// The unified type for React Flow node data payload
export type GraphNodeData = NoteNodeData | FileNodeData;


// --- Backend Graph Types (for reference, match backend models/schemas) ---

// GraphNode and GraphEdge types matching backend (if needed for direct use)
export interface BackendGraphNode {
    id: number;
    user_id: number;
    label: string | null;
    data: { [key: string]: any } | null;
    position: { x: number; y: number } | null; // Assuming backend stores position
    created_at: string;
    updated_at: string | null;
}

export interface BackendGraphEdge {
    id: number;
    user_id: number;
    source_node_id: number;
    target_node_id: number;
    relationship_type: string | null;
    data: { [key: string]: any } | null;
    created_at: string;
    updated_at: string | null;
}

// Remove the old placeholder comment
// Add GraphNode and GraphEdge types later 

// --- API Response Types ---

export interface User {
  id: number;
  email: string;
  is_active: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string | null; // Keep null possible if backend allows, but make required for creation
  position_x?: number | null;
  position_y?: number | null;
  graph_node_id?: number | null;
  created_at: string; // Typically string in JSON
  updated_at?: string | null;
}

export interface ApiFile {
  id: number;
  user_id: number;
  filename: string;
  mime_type: string | null;
  size: number | null;
  graph_node_id?: number | null;
  created_at: string;
}

export interface GraphNode {
  id: number;
  user_id: number;
  label: string | null;
  data: Record<string, any> | null;
  position: { x: number | null; y: number | null } | null;
  created_at: string;
  updated_at: string | null;
  node_type: string; // Added in crud_graph.py
}

export interface GraphEdge {
  id: number;
  user_id: number;
  source_node_id: number;
  target_node_id: number;
  label: string | null;
  data: Record<string, any> | null;
  created_at: string;
  updated_at: string | null;
}

// --- API Payload Types ---

export interface NoteCreateData {
  title: string;
  content: string; // Content is required now
  position_x?: number;
  position_y?: number;
}

export interface NoteUpdateData {
  title?: string;
  content?: string;
  position_x?: number;
  position_y?: number;
}

export interface GraphNodeUpdateData {
    label?: string;
    data?: Record<string, any>;
    position?: { x: number | null; y: number | null };
}

// --- AI Search Types ---
export interface SearchMatchMetadata {
  note_id: number;
  user_id: number;
  title: string;
  type: string; 
  text?: string; // Text might be included by PineconeVectorStore
}

export interface SearchMatch {
  id: string; // Vector ID (e.g., "note_16")
  score: number | null;
  metadata: SearchMatchMetadata;
}

export interface SearchResponse {
  query: string;
  results: SearchMatch[];
} 