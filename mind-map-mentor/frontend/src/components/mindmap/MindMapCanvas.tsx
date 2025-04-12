'use client'; // Required for hooks like useState, useCallback

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  BackgroundVariant,
} from 'reactflow';

import 'reactflow/dist/style.css'; // Import default styles

// Import API service and types
import { 
    fetchNotes, 
    updateNotePosition, 
    updateNote,
    fetchGraphEdges,
    createGraphEdge,
    deleteGraphEdge
} from '@/services/api';
import { 
    Note as ApiNote, 
    NoteUpdateData,
    GraphEdge as ApiGraphEdge
} from '@/types';

// Import the custom node type
import NoteNode from './NoteNode';
// Import the modal
import NoteEditModal from '../modals/NoteEditModal'; // Adjust path as needed

// Import Zustand Store
import { useGraphStore } from '@/store/graphStore';

// Initial empty nodes and edges
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const MindMapCanvas: React.FC = () => {
  // Local state for React Flow elements
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Read state and actions from Zustand store
  const {
    notes: apiNotes, // Rename for consistency with previous code
    edges: apiEdges, // Rename for consistency
    isLoading,
    error,
    fetchNotesAndEdges,
    updateNoteInStore, // Will use later
    addEdgeToStore,    // Will use later
    deleteEdgeFromStore // Will use later
  } = useGraphStore();

  // State for managing the edit modal (still local to canvas)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<ApiNote | null>(null);

  // Memoize the node types
  const nodeTypes = useMemo(() => ({ noteNode: NoteNode }), []);

  // Fetch initial data using the store action on component mount
  useEffect(() => {
    fetchNotesAndEdges();
  }, [fetchNotesAndEdges]); // Depend on the action function

  // Effect to transform fetched notes (from store) into React Flow nodes
  useEffect(() => {
    const transformedNodes = apiNotes.map((note) => ({
      id: note.id.toString(),
      type: 'noteNode',
      position: { x: note.position_x ?? 0, y: note.position_y ?? 0 },
      data: { label: note.title || 'Untitled Note', content: note.content },
      draggable: true,
    }));
    console.log('Canvas: Transformed Store Notes:', transformedNodes);
    setNodes(transformedNodes);
  }, [apiNotes]); // Re-run when notes from store change

  // Effect to transform fetched edges (from store) into React Flow edges
  useEffect(() => {
    const transformedEdges = apiEdges.map((edge) => ({
      id: edge.id.toString(),
      source: edge.source_node_id.toString(),
      target: edge.target_node_id.toString(),
      label: edge.relationship_type || '',
    }));
    console.log('Canvas: Transformed Store Edges:', transformedEdges);
    setEdges(transformedEdges);
  }, [apiEdges]); // Re-run when edges from store change

  // React Flow Handlers (will be updated later to use store actions)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  
  const onEdgesChange = useCallback(
    async (changes: EdgeChange[]) => {
      let changeApplied = false; // Flag to check if we need to apply default handler
      for (const change of changes) {
        if (change.type === 'remove') {
          changeApplied = true; // We are handling this change type
          const edgeIdToRemove = parseInt(change.id, 10);
          console.log(`Attempting to remove edge with ID: ${edgeIdToRemove}`);
          try {
            // Call API first
            await deleteGraphEdge(edgeIdToRemove);
            console.log(`Edge ${edgeIdToRemove} deleted successfully via API.`);
            
            // Update the store state
            deleteEdgeFromStore(edgeIdToRemove);
            
            // Apply the change to the local React Flow state ONLY after success
            // The transformation effect listening to store changes will handle this.
            // setEdges((eds) => applyEdgeChanges([change], eds)); 
            
          } catch (error) {
            console.error(`Failed to delete edge ${edgeIdToRemove}:`, error);
            // TODO: Display error to user
            // Do not update store or local state if API call failed
          }
        }
      }
      // If no 'remove' changes were processed, apply all other changes (like selection) normally
      if (!changeApplied) {
         setEdges((eds) => applyEdgeChanges(changes, eds));
      }
    },
    [setEdges, deleteEdgeFromStore] // Add deleteEdgeFromStore to dependencies
  );

  const onConnect = useCallback(async (connection: Connection) => {
      console.log('Connection attempt:', connection);
      if (!connection.source || !connection.target) return;

      const edgeData = {
          source_node_id: parseInt(connection.source, 10),
          target_node_id: parseInt(connection.target, 10),
      };

      // Optimistically add edge to UI (React Flow state)
      const optimisticEdge = { ...connection, id: `optimistic-${connection.source}-${connection.target}` }; 
      setEdges((eds) => addEdge(optimisticEdge, eds));

      try {
          // Call API to create the edge
          const newApiEdge = await createGraphEdge(edgeData);
          console.log('Edge created successfully via API:', newApiEdge);
          
          // Add the confirmed edge to the store
          addEdgeToStore(newApiEdge);
          
          // Replace optimistic edge in local state with confirmed one from store
          // (The edge transformation effect will handle this automatically when apiEdges updates)
          // No, the transformation effect might run before the store update is processed?
          // Let's explicitly replace it here for safety.
          setEdges((eds) => {
              const filtered = eds.filter(e => e.id !== optimisticEdge.id);
              return addEdge({ 
                  id: newApiEdge.id.toString(), 
                  source: newApiEdge.source_node_id.toString(), 
                  target: newApiEdge.target_node_id.toString(),
                  label: newApiEdge.relationship_type || '',
              }, filtered);
          });

      } catch (error) {
          console.error("Failed to create edge:", error);
          // Remove the optimistically added edge if API call failed
          setEdges((eds) => eds.filter(e => e.id !== optimisticEdge.id)); 
          // TODO: Display error to user
      }
    },
    [setEdges, addEdgeToStore] // Add addEdgeToStore to dependencies
  );

  const handleNodeDragStop = useCallback(async (_event: React.MouseEvent, node: Node) => {
    // Find the original note data from the store to compare
    const originalNote = apiNotes.find(n => n.id.toString() === node.id);
    const originalPosition = { x: originalNote?.position_x ?? 0, y: originalNote?.position_y ?? 0 };

    if (node.position && (Math.abs(node.position.x - originalPosition.x) > 1 || Math.abs(node.position.y - originalPosition.y) > 1)) {
        console.log(`Node ${node.id} drag stopped. New position:`, node.position);
        try {
            // Call the API to save the new position
            const updatedNote = await updateNotePosition(parseInt(node.id, 10), node.position);
            console.log(`Position for node ${node.id} updated successfully via API.`);
            
            // Update the store state
            updateNoteInStore(updatedNote);

        } catch (err) {
            console.error(`Failed to update position for node ${node.id}:`, err);
            // TODO: Handle error in UI (e.g., revert node position or show toast)
            // For now, the store state won't be updated, but the API call failed.
            // Maybe refetch data on error?
        }
    }
  }, [apiNotes, updateNoteInStore]); // Add updateNoteInStore to dependencies

  // Modal Handlers (remain largely the same, but save will update store)
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const noteToEdit = apiNotes.find(n => n.id.toString() === node.id);
    if (noteToEdit) {
        setEditingNote(noteToEdit);
        setIsModalOpen(true);
    } else {
        console.warn(`Could not find note data for node ID: ${node.id}`);
    }
  }, [apiNotes]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleModalSave = async (updatedData: NoteUpdateData) => {
      if (!editingNote) return;
      console.log("Attempting to save note:", editingNote.id, "Data:", updatedData);
      try {
          // Call the API service function
          const savedNote = await updateNote(editingNote.id, updatedData);
          console.log("Note saved successfully via API:", savedNote);

          // Update the store state
          updateNoteInStore(savedNote);

          handleModalClose(); // Close modal on success
      } catch (error: any) {
          console.error("Failed to save note via modal:", error);
          // Re-throw the error so the modal can display it
          throw error; 
      }
  };

  // Display loading or error state
  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading map data...</div>;
  }

  if (error) {
    // Maybe provide a button to clear the error or retry?
    return <div className="flex items-center justify-center h-full text-red-500 p-4">Error: {error}</div>;
  }

  return (
    // Set height for the ReactFlow container
    <div style={{ height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes} // Pass the custom node types
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        onNodeDoubleClick={handleNodeDoubleClick} // Add double-click handler
        fitView // Zoom/pan to fit all nodes on initial load
        className="bg-gray-50 dark:bg-gray-900" // Adjusted background for better visibility
      >
        <Controls />
        <MiniMap nodeColor={(node) => '#ECC94B'} /> {/* Match custom node color */}
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      </ReactFlow>

      {/* Render the Edit Modal */} 
      <NoteEditModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        noteData={editingNote}
        onSave={handleModalSave} 
      />
    </div>
  );
};

export default MindMapCanvas;