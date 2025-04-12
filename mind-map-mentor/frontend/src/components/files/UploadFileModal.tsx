'use client';

import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>; // Prop to handle the actual upload logic
}

const UploadFileModal: React.FC<UploadFileModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for the file input

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first.');
      return;
    }
    if (isUploading) return;

    setIsUploading(true);
    const toastId = toast.loading('Uploading file...');

    try {
      await onUpload(selectedFile); // Call the onUpload prop passed from parent
      toast.success('File uploaded successfully!', { id: toastId });
      handleClose(); // Close modal on success
    } catch (error: any) {
      console.error("Upload file error in modal:", error);
      toast.error(error.message || 'Failed to upload file.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Reset state when closing
  const handleClose = () => {
    setSelectedFile(null);
    setIsUploading(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the file input visually
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-sm bg-black/10">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Upload New File</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            &times; {/* Close icon */}
          </button>
        </div>
        
        <div className="space-y-4">
            <div>
               <label htmlFor="file-upload-modal" className="sr-only">
                  Choose file
               </label>
               <input 
                  id="file-upload-modal" 
                  name="file-upload-modal" 
                  type="file" 
                  ref={fileInputRef} // Attach ref
                  onChange={handleFileChange} 
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" 
                />
             </div>
             {selectedFile && (
               <div className="text-sm text-gray-600 truncate">Selected: {selectedFile.name}</div>
             )}
         </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button" // Change to type="button" to prevent form submission if wrapped in form
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
      </div>
    </div>
  );
};

export default UploadFileModal; 