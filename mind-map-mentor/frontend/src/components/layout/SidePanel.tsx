'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { createNote, updateNote, uploadFile, fetchFiles, deleteFile, downloadFileApi, API_SERVER_ORIGIN } from '@/services/api';
import { Note, NoteUpdateData, ApiFile, GraphNodeData, FileNodeData, NoteCreateData } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useGraphStore } from '@/store/graphStore';
import EditNoteModal from '@/components/notes/EditNoteModal';
import toast from 'react-hot-toast';
import { FiDownload, FiTrash2, FiPlusCircle, FiUpload, FiLogOut, FiGrid, FiFileText, FiFolder } from 'react-icons/fi';

// Import Modals
import CreateNoteModal from '@/components/notes/CreateNoteModal';
import UploadFileModal from '@/components/files/UploadFileModal';

const SidePanel: React.FC = () => {
  const {
    nodes: graphNodes, // Use nodes from store
    isLoading: isLoadingGraph,
    error: graphError, 
    fetchGraphData,
    addNoteNode, 
    addFileNode,
    removeFileNode, 
    updateNodeData // Needed for consistency, though maybe not used directly here
  } = useGraphStore();
  
  // Derive notes list from graphNodes
  const notes = graphNodes
    .filter((node): node is Node<NoteNodeData> => node.data.type === 'note' && typeof (node.data as any).original_note_id === 'number')
    .map(node => {
        const noteData = node.data; // Already asserted type in filter
        return {
            id: noteData.original_note_id,
            user_id: useAuthStore.getState().user?.id ?? 0,
            title: noteData.label,
            content: noteData.content,
            position_x: noteData.position_x,
            position_y: noteData.position_y,
            created_at: noteData.created_at,
            updated_at: noteData.updated_at,
        } as Note;
    });

  // Derive files list from graphNodes
  const filesForPanel = graphNodes
      .filter((node): node is Node<FileNodeData> => node.data.type === 'file' && typeof (node.data as any).original_file_id === 'number')
      .map(node => {
          const fileData = node.data; // Already asserted type in filter
          // Map back to ApiFile structure for the panel components
          return {
              id: fileData.original_file_id,
              user_id: useAuthStore.getState().user?.id ?? 0,
              filename: fileData.filename, 
              mime_type: fileData.mime_type,
              size: fileData.size,
              created_at: fileData.created_at,
              // Add graph_node_id if needed by panel components, though maybe not
              // graph_node_id: fileData.id 
          } as ApiFile;
      });

  // Local state for create form loading and modal
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const { isLoggedIn, user, logout } = useAuthStore();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State for file input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState<number | null>(null); // Keep download state

  // State for modals
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [isUploadFileModalOpen, setIsUploadFileModalOpen] = useState(false);
  const [isLoadingCreateNote, setIsLoadingCreateNote] = useState(false);
  const [isLoadingUploadFile, setIsLoadingUploadFile] = useState(false);

  // --- Modal Handling Functions ---
  const openEditModal = (noteToEdit: Note) => {
    setEditingNote(noteToEdit);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingNote(null);
  };
  // --- End Modal Handling Functions ---

  // Update Note - TODO: Adapt if necessary to use updateNodeData from store
  const handleUpdateNote = async (noteId: number, data: NoteUpdateData) => {
    console.log("SidePanel: handleUpdateNote called", { noteId, data });
    const toastId = toast.loading('Updating note...');
    try {
      await updateNote(noteId, data); 
      console.log("SidePanel: Note updated successfully via API");
      // TODO: Optionally update store directly using updateNodeData if API doesn't return updated node
      // Or rely on fetchGraphData re-fetching after modal close
      closeEditModal();
      toast.success('Note updated successfully!', { id: toastId });
    } catch (error) {
      console.error("SidePanel: Failed to update note:", error);
      toast.dismiss(toastId);
      throw error; 
    } 
  };

  // Fetch initial data using store action when logged in
  useEffect(() => {
    if (isLoggedIn) {
      console.log("SidePanel: Calling fetchGraphData from store.");
      fetchGraphData(); // Use the combined fetch action
    }
  }, [isLoggedIn, fetchGraphData]);

  // Handle note creation - use addNoteNode
  const handleCreateNote = async (title: string, content: string) => {
    setIsLoadingCreate(true);
    const toastId = toast.loading('Creating note...');
    try {
      const newNote = await createNote({ title, content });
      console.log("SidePanel: Created note via API:", newNote);
      addNoteNode(newNote); // Update the global store state
      toast.success('Note created successfully!', { id: toastId });
    } catch (err: any) {
      console.error('Create note error from SidePanel:', err);
      toast.error(err.message || 'Failed to create note.', { id: toastId });
    } finally {
      setIsLoadingCreate(false);
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      console.log("File selected:", event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // Handle file upload trigger - use addFileNode
  const handleUploadClick = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first.');
      return;
    }
    console.log("Uploading file:", selectedFile.name);
    setIsUploading(true);
    const toastId = toast.loading('Uploading file...');
    try {
      const uploadedFileRecord = await uploadFile(selectedFile);
      console.log("File uploaded successfully, record:", uploadedFileRecord);
      addFileNode(uploadedFileRecord); // Add file node to store
      toast.success('File uploaded successfully!', { id: toastId });
      setSelectedFile(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = ""; 
      }
    } catch (err: any) {
      console.error("File upload error:", err);
      toast.error(`Upload failed: ${err.message}`, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle downloading a file
  const handleDownloadFile = async (file: ApiFile) => {
    console.log("Attempting to download file:", file.filename, "ID:", file.id);
    setIsDownloading(file.id); // Set downloading state for this file
    const toastId = toast.loading(`Downloading ${file.filename}...`);
    try {
      const blob = await downloadFileApi(file.id); // Call API service
      
      // Create a link element
      const link = document.createElement('a');
      
      // Create an object URL for the blob
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      
      // Set the download attribute with the original filename
      link.setAttribute('download', file.filename);
      
      // Append the link to the body (required for Firefox)
      document.body.appendChild(link);
      
      // Programmatically click the link
      link.click();
      
      // Clean up: remove the link and revoke the object URL
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${file.filename}!`, { id: toastId });
    } catch (err: any) {
      console.error("File download error:", err);
      toast.error(`Download failed: ${err.message}`, { id: toastId });
    } finally {
      setIsDownloading(null); // Reset downloading state
    }
  };

  // Handle deleting a file - uses removeFileNode which now uses original_file_id
  const handleDeleteFile = async (fileId: number) => {
      if (!window.confirm("Are you sure you want to delete this file?")) {
          return;
      }
      console.log("Attempting to delete file (original ID):", fileId);
      const toastId = toast.loading('Deleting file...');
      try {
          await deleteFile(fileId); // API call still uses original ID
          removeFileNode(fileId); // Store action uses original ID
          toast.success('File deleted successfully!', { id: toastId });
      } catch (err: any) {
          console.error("File deletion error:", err);
          toast.error(`Deletion failed: ${err.message}`, { id: toastId });
      }
  };

  // --- Modal Trigger Functions ---
  const openCreateNoteModal = () => setIsCreateNoteModalOpen(true);
  const closeCreateNoteModal = () => setIsCreateNoteModalOpen(false);
  const openUploadFileModal = () => setIsUploadFileModalOpen(true);
  const closeUploadFileModal = () => setIsUploadFileModalOpen(false);
  // --- End Modal Triggers ---

  // Handle Note Creation (called by modal's onCreate prop)
  const handleCreateNoteSubmit = async (data: NoteCreateData) => {
    setIsLoadingCreateNote(true);
    // No toast here, modal handles it
    try {
      const newNote = await createNote(data); // Use data from modal
      addNoteNode(newNote); // Update graph store
      // Optionally: If on /notes page, trigger a refresh?
    } catch (err: any) {
      console.error('Create note error from SidePanel via modal:', err);
      // Re-throw error for the modal to display via toast
      throw err; 
    } finally {
      setIsLoadingCreateNote(false);
    }
  };

  // Handle File Upload (called by modal's onUpload prop)
  const handleFileUploadSubmit = async (file: File) => {
    setIsLoadingUploadFile(true);
     // No toast here, modal handles it
    try {
      const uploadedFileRecord = await uploadFile(file);
      addFileNode(uploadedFileRecord); // Add file node to graph store
       // Optionally: If on /files page, trigger a refresh?
    } catch (err: any) {
      console.error("File upload error from SidePanel via modal:", err);
      // Re-throw error for the modal to display via toast
      throw err;
    } finally {
      setIsLoadingUploadFile(false);
    }
  };

  return (
    <>
      <div className="w-64 h-screen bg-slate-100 border-r border-slate-200 p-4 flex flex-col">
        <div className="mb-6">
           <h1 className="text-2xl font-bold text-violet-700">MindMap</h1> {/* Simple Title */}
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3 mb-8">
            <button 
                onClick={openCreateNoteModal}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <FiPlusCircle className="mr-2 h-4 w-4" /> Create Note
            </button>
             <button 
                onClick={openUploadFileModal}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                 <FiUpload className="mr-2 h-4 w-4" /> Upload File
            </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-slate-200 hover:text-gray-900 group">
            <FiGrid className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            Canvas
          </Link>
          <Link href="/dashboard/notes" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-slate-200 hover:text-gray-900 group">
             <FiFileText className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            All Notes
          </Link>
          <Link href="/dashboard/files" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-slate-200 hover:text-gray-900 group">
             <FiFolder className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            All Files
          </Link>
        </nav>

        {/* User Info & Logout */}
        <div className="mt-auto pt-4 border-t border-slate-300">
           {user && (
              <div className="mb-3 text-sm text-gray-600">
                  Logged in as: <span className="font-medium text-gray-800">{user.email}</span>
              </div>
            )}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
          >
            <FiLogOut className="mr-2 h-4 w-4" /> Logout
          </button>
        </div>
      </div>

      {/* Render Modals */}
      <CreateNoteModal 
        isOpen={isCreateNoteModalOpen}
        onClose={closeCreateNoteModal}
        onCreate={handleCreateNoteSubmit}
      />
      <UploadFileModal 
         isOpen={isUploadFileModalOpen}
         onClose={closeUploadFileModal}
         onUpload={handleFileUploadSubmit}
      />
    </>
  );
};

export default SidePanel; 