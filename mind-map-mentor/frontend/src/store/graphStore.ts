import { create } from 'zustand';
import { Node, Edge, XYPosition } from 'reactflow'; // Import React Flow types
import { 
    Note, 
    ApiFile, 
    BackendGraphEdge as GraphEdge, // Use renamed type
    GraphNodeData, // Import the unified data type
    NoteNodeData, 
    FileNodeData 
} from '@/types';
import { fetchGraphNodes, fetchGraphEdges } from '@/services/api'; 

// Helper function for default positioning (simple random offset)
const getRandomPosition = (): XYPosition => ({
    x: Math.random() * 400,
    y: Math.random() * 400,
});

interface GraphState {
  // Use React Flow's Node type with our specific data payload
  nodes: Node<GraphNodeData>[]; 
  // Use React Flow's Edge type (or keep BackendGraphEdge if structure differs significantly)
  // Let's use React Flow Edge and map the backend data
  edges: Edge[]; 
  isLoading: boolean;
  error: string | null;
  // Add timestamps for triggering refreshes
  lastNoteCreatedTimestamp: number | null;
  lastFileUploadedTimestamp: number | null;
  fetchGraphData: () => Promise<void>; // Renamed fetch action
  addNoteNode: (newNote: Note) => void; // Renamed and adapted
  updateNodeData: (nodeId: string, dataUpdate: Partial<GraphNodeData>) => void; // More generic update
  addFileNode: (newFile: ApiFile) => void; // Action to add file node
  removeFileNode: (fileId: number) => void; // Action to remove file node
  addEdge: (newEdge: GraphEdge) => void; // Renamed
  deleteEdge: (edgeId: number) => void; // Renamed
}

// Helper to generate prefixed string ID using GraphNode ID
const getNodeId = (type: 'note' | 'file', graphNodeId: number | null | undefined): string | null => {
    if (graphNodeId === null || graphNodeId === undefined) {
        console.warn(`Cannot generate node ID for type ${type} with null/undefined graphNodeId`);
        return null;
    }
    return `${type}-${graphNodeId}`;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  isLoading: true,
  error: null,
  lastNoteCreatedTimestamp: null, // Initialize timestamps
  lastFileUploadedTimestamp: null,

  fetchGraphData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch nodes and edges in parallel
      const [fetchedNodes, fetchedEdges] = await Promise.all([
        fetchGraphNodes(), // Call the new function
        fetchGraphEdges(),
      ]);

      // Process fetchedNodes (which are BackendGraphNode type)
      const reactFlowNodes: Node<GraphNodeData>[] = fetchedNodes
        .map((backendNode) => {
            // Determine node type and prefix
            const nodeType = backendNode.node_type as ('note' | 'file'); // Assuming node_type is reliable
            const reactFlowNodeId = `${nodeType}-${backendNode.id}`;
            const position = backendNode.position ?? { x: Math.random() * 400, y: Math.random() * 400 }; // Use saved pos or default

            // Map data payload based on type
            let nodeData: GraphNodeData | null = null;
            if (nodeType === 'note' && backendNode.data) {
                nodeData = {
                    type: 'note',
                    id: backendNode.id,
                    label: backendNode.label ?? 'Untitled Note',
                    content: backendNode.data.content, // Assuming content is in data
                    created_at: backendNode.created_at,
                    updated_at: backendNode.updated_at,
                    original_note_id: backendNode.data.original_note_id, // Get original ID from data
                    position_x: position.x, // Store position in data too
                    position_y: position.y,
                } as NoteNodeData;
            } else if (nodeType === 'file' && backendNode.data) {
                 nodeData = {
                    type: 'file',
                    id: backendNode.id,
                    label: backendNode.label ?? 'Untitled File',
                    filename: backendNode.label ?? 'unknown.file', // Use label as filename for now
                    mime_type: backendNode.data.mime_type, // Get details from data
                    size: backendNode.data.size,
                    created_at: backendNode.created_at,
                    original_file_id: backendNode.data.original_file_id, // Get original ID from data
                    position_x: position.x, // Store position in data too
                    position_y: position.y,
                } as FileNodeData;
            }

            if (!nodeData) {
                console.warn("Could not map backend node:", backendNode);
                return null;
            }

            return {
                id: reactFlowNodeId,
                type: `${nodeType}Node`, // e.g., noteNode, fileNode
                position: position, // Use the determined position
                data: nodeData,
             };
        })
        .filter((node): node is Node<GraphNodeData> => node !== null); 

      // Map Backend Edges (existing logic should be okay)
      const reactFlowEdges: Edge[] = fetchedEdges.map(edge => {
          // ... (existing edge mapping logic, might need minor adjustments) ...
          // Important: Ensure the find logic below still works with the new reactFlowNodes structure
          const sourceNode = reactFlowNodes.find(n => n.data.id === edge.source_node_id && (n.data.type === 'note' || n.data.type === 'file'));
          const targetNode = reactFlowNodes.find(n => n.data.id === edge.target_node_id && (n.data.type === 'note' || n.data.type === 'file'));
          
          const sourceNodeIdStr = sourceNode ? sourceNode.id : null; // Use React Flow node ID
          const targetNodeIdStr = targetNode ? targetNode.id : null;

          // Check if nodes were found before creating edge
          if (!sourceNodeIdStr || !targetNodeIdStr) {
              console.warn(`GraphStore mapping edge ${edge.id}: Source node (${edge.source_node_id}) or target node (${edge.target_node_id}) not found in mapped reactFlowNodes.`);
              return null; // Skip this edge
          }

          return {
              id: `edge-${edge.id}`,
              source: sourceNodeIdStr,
              target: targetNodeIdStr,
              label: edge.relationship_type,
          };
      }).filter((edge): edge is Edge => edge !== null); 

      set({
        nodes: reactFlowNodes,
        edges: reactFlowEdges, 
        isLoading: false 
      });

      console.log('GraphStore: Fetched Combined Nodes:', get().nodes);
      console.log('GraphStore: Fetched Edges:', get().edges);

    } catch (err) {
      console.error("GraphStore: Error fetching graph data:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load graph data.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Adds a new note node using graph_node_id
  addNoteNode: (newNote: Note) => {
    if (newNote.graph_node_id === null || newNote.graph_node_id === undefined) {
        console.error("Cannot add note node: graph_node_id is missing from API response.", newNote);
        return; // Don't add node if ID is missing
    }
    const nodeId = getNodeId('note', newNote.graph_node_id);
    if (!nodeId) return; 

    const newNode: Node<NoteNodeData> = {
      id: nodeId,
      type: 'noteNode',
      position: { x: newNote.position_x ?? 0, y: newNote.position_y ?? 0 },
      data: {
        type: 'note',
        id: newNote.graph_node_id, // Use GraphNode ID
        label: newNote.title ?? 'Untitled Note',
        content: newNote.content,
        created_at: newNote.created_at,
        updated_at: newNote.updated_at,
        position_x: newNote.position_x,
        position_y: newNote.position_y,
        original_note_id: newNote.id
      },
    };
    set((state) => ({ 
        nodes: [...state.nodes, newNode],
        lastNoteCreatedTimestamp: Date.now() // Update timestamp
    }));
    console.log('GraphStore: Added Note Node:', newNode);
  },

  // Update node data (position is handled via this too now)
  updateNodeData: (nodeId: string, dataUpdate: Partial<GraphNodeData>) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...dataUpdate } }
          : node
      ),
    }));
    console.log(`GraphStore: Updated Node Data for ${nodeId}:`, dataUpdate);
  },

  // Adds a new file node
  addFileNode: (newFile: ApiFile) => {
     if (newFile.graph_node_id === null || newFile.graph_node_id === undefined) {
        console.error("Cannot add file node: graph_node_id is missing from API response.", newFile);
        return; // Don't add node if ID is missing
    }
    const nodeId = getNodeId('file', newFile.graph_node_id);
     if (!nodeId) return;

    const newNode: Node<FileNodeData> = {
      id: nodeId,
      type: 'fileNode',
      position: getRandomPosition(),
      data: {
        type: 'file',
        id: newFile.graph_node_id, // Use GraphNode ID
        label: newFile.filename,
        filename: newFile.filename,
        mime_type: newFile.mime_type,
        size: newFile.size,
        created_at: newFile.created_at,
        original_file_id: newFile.id
      },
    };
    set((state) => ({
      nodes: [...state.nodes, newNode],
      lastFileUploadedTimestamp: Date.now() // Update timestamp
    }));
    console.log('GraphStore: Added File Node:', newNode);
  },

  // Removes a file node using original file ID
  removeFileNode: (fileId: number) => {
      // Find the node to remove based on originalFileId in its data
      const nodeToRemove = get().nodes.find(n => 
          n.data.type === 'file' && 
          (n.data as FileNodeData).original_file_id === fileId
      );
      const nodeToRemoveId = nodeToRemove?.id; // React Flow ID (e.g., 'file-11')
            
      set((state) => ({
        nodes: state.nodes.filter((node) => node.id !== nodeToRemoveId),
        edges: nodeToRemoveId ? state.edges.filter(edge => edge.source !== nodeToRemoveId && edge.target !== nodeToRemoveId) : state.edges,
      }));
      console.log(`GraphStore: Removed File (Original ID ${fileId}) and associated Node ${nodeToRemoveId}`);
  },

  // Adds a new edge using GraphNode IDs
  addEdge: (newEdge: GraphEdge) => {
      // Get current nodes from state to determine source/target types based on GraphNode ID
      const nodes = get().nodes;
      const sourceNode = nodes.find(n => n.data.id === newEdge.source_node_id);
      const targetNode = nodes.find(n => n.data.id === newEdge.target_node_id);
      
      if (!sourceNode || !targetNode) {
          console.warn(`GraphStore addEdge: Could not find source (${newEdge.source_node_id}) or target (${newEdge.target_node_id}) node in current state for edge ${newEdge.id}.`);
          return; // Don't add edge if nodes aren't found in store
      }

      const sourceNodeIdStr = getNodeId(sourceNode.data.type, sourceNode.data.id);
      const targetNodeIdStr = getNodeId(targetNode.data.type, targetNode.data.id);
      
      if (!sourceNodeIdStr || !targetNodeIdStr) return; // Should not happen if nodes found

      const reactFlowEdge: Edge = {
          id: `edge-${newEdge.id}`,
          source: sourceNodeIdStr,
          target: targetNodeIdStr,
          label: newEdge.relationship_type,
      };

    set((state) => ({
      edges: state.edges.some(e => e.id === reactFlowEdge.id) 
             ? state.edges 
             : [...state.edges, reactFlowEdge]
    }));
    console.log('GraphStore: Added Edge:', reactFlowEdge);
  },

  // Deletes an edge
  deleteEdge: (edgeId: number) => {
    const edgeToRemoveId = `edge-${edgeId}`;
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeToRemoveId),
    }));
    console.log('GraphStore: Deleted Edge with ID:', edgeId);
  },
})); 