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
    deleteGraphEdge,
    updateFilePosition
} from '@/services/api';
import { 
    Note as ApiNote, 
    NoteUpdateData,
    ApiFile,
    GraphNodeData,
    BackendGraphEdge as ApiGraphEdge,
    NoteNodeData,
    FileNodeData
} from '@/types';

// Import the custom node type
import NoteNode from './NoteNode';
import FileNode from './FileNode';
// Import the modal
import NoteEditModal from '../modals/NoteEditModal'; // Adjust path as needed

// Import Zustand Store
import { useGraphStore } from '@/store/graphStore';

const MindMapCanvas: React.FC = () => {
  // Read state and actions directly from Zustand store
  const {
    nodes, // Use nodes directly from the store
    edges, // Use edges directly from the store
    isLoading,
    error,
    fetchGraphData,
    updateNodeData, // Use the generic update action
    addEdge, // Use store action
    deleteEdge // Use store action
    // Get files state if needed for handlers, e.g., double-click
    // files: apiFiles 
  } = useGraphStore();

  // Local state only for the modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNodeData, setEditingNodeData] = useState<GraphNodeData | null>(null);

  // Define the node types
  const nodeTypes = useMemo(() => ({
     noteNode: NoteNode, 
     fileNode: FileNode, // Add fileNode type
  }), []);

  // Fetch initial data using the store action on component mount
  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]); // Depend on the action function

  // React Flow Handlers - use store state directly
  // Use a local setter for direct manipulation (selection, etc.)
  // then sync relevant changes (drag stop, delete) with store/API
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
        // Apply changes directly to the store's node state
        // This handles selection, dimensions, etc. Drag stop is handled separately.
        useGraphStore.setState(state => ({ nodes: applyNodeChanges(changes, state.nodes) }));
    },
    []
  );
  
  const onEdgesChange = useCallback(
    async (changes: EdgeChange[]) => {
      let changeApplied = false;
      const edgesToRemove: string[] = [];

      for (const change of changes) {
        if (change.type === 'remove') {
          changeApplied = true;
          edgesToRemove.push(change.id);
        }
      }

      if (edgesToRemove.length > 0) {
        console.log(`Attempting to remove edges with IDs: ${edgesToRemove.join(', ')}`);
        // Perform API calls and update store state (async)
        // We don't wait here, let the UI update immediately if needed by applyEdgeChanges
        edgesToRemove.forEach(async (edgeIdToRemove) => {
            // Extract original backend ID from prefixed ID (e.g., 'edge-123')
            const backendEdgeId = parseInt(edgeIdToRemove.replace('edge-', ''), 10);
            if (isNaN(backendEdgeId)) {
                console.error(`Invalid edge ID format for removal: ${edgeIdToRemove}`);
                return; // Skip invalid ID
            }
            try {
              await deleteGraphEdge(backendEdgeId);
              console.log(`Edge ${backendEdgeId} deleted successfully via API.`);
              deleteEdge(backendEdgeId); // Update store
            } catch (error) {
              console.error(`Failed to delete edge ${backendEdgeId}:`, error);
              // TODO: Display error to user
            }
        });
      }

      // Apply non-remove changes (like selection) to the store's edge state
      const nonRemoveChanges = changes.filter(change => change.type !== 'remove');
      if (nonRemoveChanges.length > 0) {
        useGraphStore.setState(state => ({ edges: applyEdgeChanges(nonRemoveChanges, state.edges) }));
      }
    },
    [deleteEdge] // Depend on store action
  );

  const onConnect = useCallback(async (connection: Connection) => {
      console.log('Connection attempt:', connection);
      if (!connection.source || !connection.target) return;

      // Extract type and ID from source/target
      const sourceMatch = connection.source.match(/^(note|file)-(\d+)$/);
      const targetMatch = connection.target.match(/^(note|file)-(\d+)$/);

      // Allow connections as long as source and target IDs are valid
      if (!sourceMatch || !targetMatch) {
          console.error('Connection rejected: Invalid source or target node ID format.');
          // TODO: Provide user feedback?
          return;
      }

      const edgeData = {
          source_node_id: parseInt(sourceMatch[2], 10),
          target_node_id: parseInt(targetMatch[2], 10),
          // Optionally set a default relationship type here if needed
          // relationship_type: 'related',
      };

      // Note: Optimistic add is handled by React Flow internally via onConnect
      // We just need to confirm via API and update store

      try {
          const newApiEdge = await createGraphEdge(edgeData);
          console.log('Edge created successfully via API:', newApiEdge);
          addEdge(newApiEdge); // Add the confirmed edge to the store

      } catch (error) {
          console.error("Failed to create edge:", error);
          // TODO: Display error to user. React Flow might show the connection failing.
      }
    },
    [addEdge] // Depend on store action
  );

  // Update drag stop handler to use updateNodeData
  const handleNodeDragStop = useCallback(async (_event: React.MouseEvent, node: Node<GraphNodeData>) => {
      // --- Handle NOTE node drag stop --- 
      if (node.data.type === 'note' && node.position) {
          const originalNoteId = (node.data as NoteNodeData).original_note_id;
          const currentPosition = { x: node.data.position_x ?? 0, y: node.data.position_y ?? 0 };
          
          if (typeof originalNoteId !== 'number') {
              console.error(`Cannot update position for node ${node.id}: Missing or invalid original_note_id.`);
              return;
          }
          
          if (Math.abs(node.position.x - currentPosition.x) > 1 || Math.abs(node.position.y - currentPosition.y) > 1) {
              console.log(`Node ${node.id} drag stopped. New position:`, node.position);
              const newPosition = { position_x: node.position.x, position_y: node.position.y };
              try {
                  await updateNotePosition(originalNoteId, node.position);
                  console.log(`Position for note (original ID ${originalNoteId}) updated via API.`);
                  
                  updateNodeData(node.id, newPosition);
                  console.log(`Position for node ${node.id} updated in store.`);

              } catch (err) {
                  console.error(`Failed to update position for node ${node.id} (original ID ${originalNoteId}):`, err);
              }
          }
      }
      // --- Handle FILE node drag stop --- 
      else if (node.data.type === 'file' && node.position) {
          // Extract original file ID (using snake_case key)
          const originalFileId = (node.data as FileNodeData).original_file_id;
          const currentPosition = { x: node.data.position_x ?? 0, y: node.data.position_y ?? 0 }; 
          
          // Check if original_file_id is valid before proceeding
          if (typeof originalFileId !== 'number') {
              console.error(`Cannot update position for file node ${node.id}: Missing or invalid original_file_id.`);
              return;
          }
          
          // Check if position actually changed significantly
          if (Math.abs(node.position.x - currentPosition.x) > 1 || Math.abs(node.position.y - currentPosition.y) > 1) {
              console.log(`File node ${node.id} (original ID ${originalFileId}) drag stopped. New position:`, node.position);
              const newPositionData = { position_x: node.position.x, position_y: node.position.y };
              try {
                  // Call API using the original file ID
                  await updateFilePosition(originalFileId, node.position);
                  console.log(`Position for file (original ID ${originalFileId}) updated via API.`);
                  
                  // Update the store state using the generic action
                  updateNodeData(node.id, newPositionData);
                  console.log(`Position for file node ${node.id} updated in store.`);

              } catch (err) {
                  console.error(`Failed to update position for file node ${node.id} (original ID ${originalFileId}):`, err);
                  // TODO: Consider reverting position in UI?
              }
          }
      }
  }, [updateNodeData]); // updateNodeData is a dependency

  // Update double click handler
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node<GraphNodeData>) => {
    if (node.data.type === 'note') {
        setEditingNodeData(node.data); // Store the whole data object
        setIsModalOpen(true);
    } else {
        // Handle double click for file nodes if needed (e.g., open preview?)
        console.log('Double clicked file node:', node.data.label);
    }
  }, []);

  // Modal Handlers
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingNodeData(null);
  };

  // Update modal save handler
  const handleModalSave = async (updatedData: NoteUpdateData) => {
      if (!editingNodeData || editingNodeData.type !== 'note') return;
      
      const nodeId = `note-${editingNodeData.id}`;
      console.log("Attempting to save note:", nodeId, "Data:", updatedData);
      try {
          // Call the API service function
          await updateNote(editingNodeData.id, updatedData);
          console.log("Note saved successfully via API:", nodeId);

          // Update the store state using the generic action
          // Prepare partial GraphNodeData update
          const dataUpdate: Partial<GraphNodeData> = {
              label: updatedData.title, // Update label if title changed
              content: updatedData.content, // Update content
              // Note: position is updated via drag handler
          };
          updateNodeData(nodeId, dataUpdate);
          console.log("Note updated in store:", nodeId);

          handleModalClose(); // Close modal on success
      } catch (error: any) {
          console.error("Failed to save note via modal:", error);
          throw error; 
      }
  };

  // Display loading or error state
  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading map data...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">Error loading map: {error}</div>;
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes} // Use nodes from store
        edges={edges} // Use edges from store
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes} // Pass the defined node types
        onNodeDragStop={handleNodeDragStop}
        onNodeDoubleClick={handleNodeDoubleClick}
        fitView
        className="bg-gradient-to-br from-blue-50 via-white to-violet-50"
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
      {/* Modal rendering - pass appropriate data */} 
      {isModalOpen && editingNodeData && editingNodeData.type === 'note' && (
        <NoteEditModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          initialData={{
              title: editingNodeData.label,
              content: editingNodeData.content
          }}
        />
      )}
    </div>
  );
};

export default MindMapCanvas;