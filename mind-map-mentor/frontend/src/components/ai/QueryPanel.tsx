'use client';

import React, { useState } from 'react';
import { useSearchStore } from '@/store/searchStore'; // Import Zustand store
import { FiSearch, FiXCircle } from 'react-icons/fi'; // Icons

const QueryPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  // Get RAG state from the store
  const { 
      performSearch, 
      clearSearch, 
      isLoading, 
      error, 
      searchResults, // Still needed to potentially show sources or for context
      ragAnswer // Get the RAG answer
    } = useSearchStore();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim() || isLoading) return;
    performSearch(query);
  };
  
  const handleClear = () => {
    setQuery('');
    clearSearch();
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200 p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Ask Mentra</h3>
      
      {/* Answer Display Area */}
      <div className="flex-grow overflow-y-auto p-2 bg-white rounded border border-gray-200 min-h-[100px]">
        {isLoading && (
            <p className="text-gray-500 italic">Thinking...</p>
        )}
        {error && (
            <p className="text-red-600">Error: {error}</p>
        )}
        {ragAnswer && !isLoading && (
            <div className="prose prose-sm max-w-none text-gray-700">
                <p>{ragAnswer}</p>
            </div>
        )}
        {!isLoading && !error && !ragAnswer && (
             <p className="text-gray-400 text-sm">Ask a question about your notes below.</p>
        )}
      </div>

      {/* Input Form Area - Positioned at the bottom */}
      <div className="mt-auto">
          <form onSubmit={handleSubmit} className="space-y-2">
              <div className="relative">
                <textarea
                  rows={3}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm bg-white text-gray-900 resize-none"
                  placeholder="Ask a question about your notes..."
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400"
                        aria-label="Clear search"
                    >
                        <FiXCircle size={18} />
                    </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSearch className="mr-2 h-4 w-4" />
                {isLoading ? 'Asking...' : 'Ask Mentra'}
              </button>
          </form>
      </div>
    </div>
  );
};

export default QueryPanel; 