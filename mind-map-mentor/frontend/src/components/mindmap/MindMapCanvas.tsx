'use client'; // Required for hooks like useState, useCallback

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  useReactFlow, // Import useReactFlow hook
  EdgeLabelRenderer, // Import EdgeLabelRenderer
  getBezierPath, // Import getBezierPath
  XYPosition // Import XYPosition
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
    updateFilePosition,
    updateGraphEdge // Import updateGraphEdge
} from '@/services/api';
import { 
    Note as ApiNote, 
    NoteUpdateData,
    ApiFile,
    GraphNodeData,
    BackendGraphEdge as ApiGraphEdge,
    NoteNodeData,
    FileNodeData,
    GraphEdgeUpdatePayload // Import payload type
} from '@/types';

// Import the custom node type
import NoteNode from './NoteNode';
import FileNode from './FileNode';
// Import the modal
import NoteEditModal from '../modals/NoteEditModal'; // Adjust path as needed
import EdgeLabelEditor from './EdgeLabelEditor'; // Import the new editor
import EdgeActionMenu from './EdgeActionMenu'; // Import the action menu
import toast from 'react-hot-toast';

// Import Zustand Store
import { useGraphStore } from '@/store/graphStore';

// --- Constants for Edge Styling ---
const edgeStyles = {
  "Strongly Related": { stroke: '#2E7D32', strokeWidth: 3, animated: true }, // Darker Green, thick, animated
  "Highly Related":   { stroke: '#1976D2', strokeWidth: 2.5 }, // Standard Blue, medium-thick
  "Related":          { stroke: '#374151', strokeWidth: 2 }, // Dark Gray/Black, standard thick
  "Moderately Related":{ stroke: '#9CA3AF', strokeWidth: 1.5, style: { strokeDasharray: '5 5' } }, // Gray, thin, dashed
  "Weakly Related":   { stroke: '#D1D5DB', strokeWidth: 1, style: { strokeDasharray: '10 10' } }, // Light Gray, very thin, long dash
  "Default":          { stroke: '#6B7280', strokeWidth: 1.5 } // Default for manual or unknown
};

type EdgeStyleKey = keyof typeof edgeStyles;
// --- End Constants ---

const MindMapCanvas: React.FC = () => {
  // Read state and actions directly from Zustand store
  const {
    nodes, // Use nodes directly from the store
    edges, // Use edges directly from the store
    isLoading,
    error,
    fetchGraphData,
    updateNodeData, // Use the generic update action
    addEdge: addEdgeToStore, // Use store action
    deleteEdge: deleteEdgeFromStore, // Use store action
    updateEdge: updateEdgeInStore // Make sure this exists in the store
    // Get files state if needed for handlers, e.g., double-click
    // files: apiFiles 
  } = useGraphStore();

  // Local state only for the modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [editingNoteData, setEditingNoteData] = useState<GraphNodeData | null>(null);

  // Task 9.1: Local state for edge label editing
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null); 
  const [editedEdgeLabel, setEditedEdgeLabel] = useState<string>('');

  // Task 2: Add state for edge action menu
  const [menuEdgeId, setMenuEdgeId] = useState<string | null>(null); // ID of edge for the menu
  const [menuPosition, setMenuPosition] = useState<XYPosition | null>(null); // Position for the menu

  // Define the node types
  const nodeTypes = useMemo(() => ({
     noteNode: NoteNode, 
     fileNode: FileNode, // Add fileNode type
  }), []);

  // Define edge types (even if empty right now)
  const edgeTypes = useMemo(() => ({}), []);

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
  
  // Task 7: Remove deletion logic from onEdgesChange
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      console.log("onEdgesChange triggered (only selection changes):", changes); 
      // Only apply non-remove changes (like selection) directly
      useGraphStore.setState(state => ({ edges: applyEdgeChanges(changes, state.edges) }));
    },
    [] // No dependencies needed now
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
          addEdgeToStore(newApiEdge); // Add the confirmed edge to the store

      } catch (error) {
          console.error("Failed to create edge:", error);
          // TODO: Display error to user. React Flow might show the connection failing.
      }
    },
    [addEdgeToStore] // Depend on store action
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
    // Comment out or remove the logic to open the modal
    /*
    if (node.data.type === 'note') {
        setEditingNoteData(node.data);
        setIsNoteModalOpen(true);
    } else {
        // Handle double click for file nodes if needed (e.g., open preview?)
        console.log('Double clicked file node:', node.data.label);
    }
    */
    console.log('Node double-clicked (modal opening disabled):', node);
  }, []);

  // Edge Interaction Handlers
  // Task 3: Modify handleEdgeDoubleClick to open menu
  const handleEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
      event.preventDefault(); // Prevent default browser behavior
      console.log('Edge double clicked:', edge);
      setMenuEdgeId(edge.id); // Set the ID for the menu
      // Position the menu near the click event
      setMenuPosition({ x: event.clientX, y: event.clientY }); 
      setEditingEdgeId(null); // Ensure inline editor is closed
  }, []);

  // Edge Label Editor Handlers
  const handleEdgeLabelSave = useCallback(async () => {
      if (!editingEdgeId) return;

      const currentEdge = edges.find(e => e.id === editingEdgeId);
      if (!currentEdge) {
          setEditingEdgeId(null);
          return;
      }

      const originalLabel = currentEdge.label as string || '';
      const backendEdgeId = parseInt(editingEdgeId.replace('edge-', ''), 10);
      if (isNaN(backendEdgeId)) {
          toast.error("Save failed: Invalid edge ID.");
          setEditingEdgeId(null);
          return;
      }

      if (editedEdgeLabel !== originalLabel) {
          const updatePayload: GraphEdgeUpdatePayload = { relationship_type: editedEdgeLabel };
          try {
              await updateGraphEdge(backendEdgeId, updatePayload);
              updateEdgeInStore(backendEdgeId, { label: editedEdgeLabel }); // Update store
              toast.success("Edge label updated");
          } catch (error) {
              toast.error("Failed to update edge label");
          }
      } 
      setEditingEdgeId(null); // Exit editing mode
  }, [editingEdgeId, editedEdgeLabel, edges, updateEdgeInStore]);

  // --- Menu Action Handlers ---
  const handleMenuEdit = useCallback(() => {
    console.log("[handleMenuEdit] Fired. Current menuEdgeId:", menuEdgeId);
    if (menuEdgeId) {
      const edgeToEdit = edges.find(e => e.id === menuEdgeId);
      console.log("[handleMenuEdit] Found edge to edit:", edgeToEdit);
      const initialLabel = edgeToEdit?.label as string || '';
      console.log(`[handleMenuEdit] Setting editingEdgeId to: ${menuEdgeId}, initialLabel: "${initialLabel}"`);
      setEditingEdgeId(menuEdgeId); // Open inline editor
      setEditedEdgeLabel(initialLabel); // Initialize editor
    } else {
      console.log("[handleMenuEdit] No menuEdgeId set.");
    }
    console.log("[handleMenuEdit] Closing menu (setting menuEdgeId to null).");
    setMenuEdgeId(null); // Close menu
    setMenuPosition(null);
  }, [menuEdgeId, edges]);

  // Task 5b: Handle Delete from Menu
  const handleMenuDelete = useCallback(async () => {
    if (!menuEdgeId) return;
    
    console.log(`[handleMenuDelete] Deleting edge with RF ID: ${menuEdgeId}`);
    const backendEdgeId = parseInt(menuEdgeId.replace('edge-', ''), 10);
    console.log(`[handleMenuDelete] Parsed Backend ID: ${backendEdgeId}`);

    if (isNaN(backendEdgeId)) {
      toast.error("Delete failed: Invalid edge ID.");
      setMenuEdgeId(null);
      setMenuPosition(null);
      return;
    }
    
    const edgeToDelete = menuEdgeId; // Store before resetting state
    setMenuEdgeId(null); // Close menu immediately
    setMenuPosition(null);

    try {
      console.log(`[handleMenuDelete] Calling API deleteGraphEdge(${backendEdgeId})...`);
      await deleteGraphEdge(backendEdgeId); 
      console.log(`[handleMenuDelete] API deleteGraphEdge(${backendEdgeId}) SUCCEEDED.`);
      
      console.log(`[handleMenuDelete] Calling store deleteEdgeFromStore(${backendEdgeId})...`);
      deleteEdgeFromStore(backendEdgeId); 
      console.log(`[handleMenuDelete] Store deleteEdgeFromStore(${backendEdgeId}) finished.`);
      
      toast.success("Edge deleted.");
    } catch (error) {
      console.error(`[handleMenuDelete] API deleteGraphEdge(${backendEdgeId}) FAILED:`, error);
      toast.error("Failed to delete edge.");
    }

  }, [menuEdgeId, deleteEdgeFromStore]);

  // Task 6: Handle closing the menu on pane click
  const onPaneClick = useCallback(() => {
    console.log("Pane clicked");
    setEditingEdgeId(null); // Close inline editor if open
    setMenuEdgeId(null); // Close action menu if open
    setMenuPosition(null);
  }, []);

  // Modal Handlers
  const handleNoteModalClose = () => {
    setIsNoteModalOpen(false);
    setEditingNoteData(null);
  };

  // Update modal save handler
  const handleNoteModalSave = async (updatedData: NoteUpdateData) => {
      if (!editingNoteData || typeof editingNoteData.original_note_id !== 'number') return;
      
      try {
          await updateNote(editingNoteData.original_note_id, updatedData);
          const nodeId = getNodeId('note', editingNoteData.id);
          if (nodeId) {
              const storeUpdate: Partial<NoteNodeData> = {};
              if (updatedData.title !== undefined) storeUpdate.label = updatedData.title;
              if (updatedData.content !== undefined) storeUpdate.content = updatedData.content;
              updateNodeData(nodeId, storeUpdate);
          }
          toast.success('Note updated!');
          handleNoteModalClose();
      } catch (error) {
          console.error("Failed to update note:", error);
          toast.error('Failed to update note.');
      }
  };

  // Helper to get node ID string
  const getNodeId = (type: 'note' | 'file', graphNodeId: number | null | undefined): string | null => {
      if (graphNodeId === null || graphNodeId === undefined) return null;
      return `${type}-${graphNodeId}`;
  };

  // --- Task 8: Apply styles to edges before rendering (Moved before conditional returns) ---
  const styledEdges = useMemo(() => edges.map(edge => {
    const labelKey = edge.label as EdgeStyleKey;
    const styleProps = edgeStyles[labelKey] || edgeStyles["Default"];
    
    // Ensure base edge properties are preserved
    const baseEdge = { ...edge };

    // Merge style properties. Need to handle nested `style` object carefully.
    if (styleProps.style) {
      baseEdge.style = { ...(baseEdge.style || {}), ...styleProps.style };
    }
    // Merge top-level style properties (like stroke, strokeWidth, animated)
    const topLevelStyleProps = { ...styleProps };
    delete topLevelStyleProps.style; // Remove nested style from direct merge
    
    return {
      ...baseEdge,
      ...topLevelStyleProps // Apply stroke, strokeWidth, animated etc.
    };
  }), [edges]);
  // --- End Task 8 ---

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
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        onNodeDoubleClick={handleNodeDoubleClick}
        onEdgeDoubleClick={handleEdgeDoubleClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-gradient-to-br from-blue-50 via-white to-violet-50"
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        
        {/* Edge Label Editor - Moved inside ReactFlow */}
        {editingEdgeId && (
          <EdgeLabelEditor 
            edgeId={editingEdgeId} 
            initialLabel={editedEdgeLabel}
            setEditedLabel={setEditedEdgeLabel}
            onSave={handleEdgeLabelSave} 
            onCancel={() => setEditingEdgeId(null)} 
          />
        )}
      </ReactFlow>
      
      {/* Note Edit Modal */}
      {isNoteModalOpen && editingNoteData && editingNoteData.type === 'note' && (
          <NoteEditModal
              isOpen={isNoteModalOpen}
              onClose={handleNoteModalClose}
              noteData={editingNoteData}
              onSave={handleNoteModalSave}
          />
      )}
      {/* Task 4: Conditionally render Edge Action Menu */} 
      {menuEdgeId && menuPosition && (
          <EdgeActionMenu 
              top={menuPosition.y}
              left={menuPosition.x}
              onEdit={handleMenuEdit} 
              onDelete={handleMenuDelete}
              onClose={() => setMenuEdgeId(null)} // Simple close
          />
      )}
    </div>
  );
};

export default MindMapCanvas;