import { create } from 'zustand';
import { SearchMatch, SearchResponse, RagQueryResponse } from '@/types'; // Import RAG type
import { searchNotesApi, ragQueryApi } from '@/services/api'; // Import RAG API call
import { useGraphStore } from './graphStore'; // Import graph store to access nodes
import { persist } from 'zustand/middleware'; // If using persistence

interface SearchState {
  searchResults: SearchMatch[];
  highlightedNodeIds: string[];
  isLoading: boolean;
  error: string | null;
  ragAnswer: string | null; // Add state for the RAG answer
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>()(
    // persist( // Uncomment if you want search state persisted
        (set, get) => ({
            searchResults: [],
            highlightedNodeIds: [],
            isLoading: false,
            error: null,
            ragAnswer: null, // Initialize RAG answer state

            performSearch: async (query: string) => {
                set({ isLoading: true, error: null, searchResults: [], highlightedNodeIds: [], ragAnswer: null }); // Reset RAG answer too
                try {
                    // Call the RAG API instead of the simple search
                    const response: RagQueryResponse = await ragQueryApi(query);
                    
                    // Map sources to SearchMatch format for consistency (optional, but good)
                    // And extract correct graph node IDs for highlighting
                    const sourcesAsSearchResults: SearchMatch[] = [];
                    const nodeIdsToHighlight: string[] = [];
                    
                    // Get the current graph nodes from the graphStore
                    const currentGraphNodes = useGraphStore.getState().nodes;
                    console.debug('[SearchStore] Graph nodes available for mapping:', currentGraphNodes);

                    response.sources.forEach(source => {
                        if (source.note_id) {
                            console.debug(`[SearchStore] Processing source note_id: ${source.note_id}`);
                            // Find the corresponding graph node
                            const matchingGraphNode = currentGraphNodes.find(
                                node => node.data?.original_note_id === source.note_id
                            );

                            if (matchingGraphNode) {
                                console.debug(`[SearchStore] Found matching graph node ID: ${matchingGraphNode.id} for note_id: ${source.note_id}`);
                                // Use the actual graph node ID for highlighting
                                nodeIdsToHighlight.push(matchingGraphNode.id);

                                // Add to search results format (using graph node id if preferred)
                                sourcesAsSearchResults.push({
                                    // Use graph node id if it's more consistent with graph interactions
                                    id: matchingGraphNode.id, 
                                    score: 0, // RAG sources might not have a score
                                    metadata: { 
                                        note_id: source.note_id, // Keep original note_id in metadata
                                        title: source.title || 'Source Note',
                                        type: 'note' 
                                    }
                                });
                            } else {
                                console.warn(`[SearchStore] Could not find matching graph node for source note_id: ${source.note_id}`);
                            }
                        }
                    });
                    
                    console.debug('[SearchStore] Final node IDs to highlight:', nodeIdsToHighlight);
                    set({
                        isLoading: false,
                        ragAnswer: response.answer, // Store the generated answer
                        searchResults: sourcesAsSearchResults, // Update with sources
                        highlightedNodeIds: nodeIdsToHighlight // Update with CORRECT graph node IDs
                    });

                } catch (err: any) {
                    console.error("RAG Search error in store:", err);
                    set({ error: err.message || 'Failed to perform RAG search.', isLoading: false, searchResults: [], highlightedNodeIds: [], ragAnswer: null });
                }
            },

            clearSearch: () => {
                set({ searchResults: [], highlightedNodeIds: [], error: null, isLoading: false, ragAnswer: null }); // Clear RAG answer too
            },
        }),
        // {
        //     name: 'search-storage', // name of item in the storage (must be unique)
        //     // getStorage: () => sessionStorage, // (optional) by default the store uses localStorage
        // } // Uncomment if using persist
    // ) // Uncomment if using persist
); 