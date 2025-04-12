import axios from 'axios';
import { useAuthStore } from '@/store/authStore'; // Import Zustand store
import { Note, NoteUpdateData, User, GraphEdge } from '@/types'; // Import Note, NoteUpdateData, User, GraphEdge types

// Determine Backend URL (adjust if your backend runs elsewhere)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Axios Request Interceptor --- //
// Add a request interceptor to include the token if available
apiClient.interceptors.request.use(
  (config) => {
    // Get token from Zustand store (outside of React component)
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Add specific log for /users/me
      if (config.url === '/users/me') { 
        console.log(`Axios Interceptor: Attaching token to ${config.url}: Bearer ${token.substring(0, 10)}...`);
      }
    } else {
       if (config.url === '/users/me') { 
        console.log(`Axios Interceptor: No token found for ${config.url}`);
       }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- API Service Functions --- //

// Define UserResponse based on User type from @/types
// Ensure this matches what your /users/me endpoint actually returns
interface UserResponse extends User {}

// Define LoginResponse
interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Login User
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  // FastAPI's OAuth2PasswordRequestForm expects form data
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  try {
    const response = await apiClient.post<LoginResponse>('/login/access-token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Login API error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};

// Signup User
export const signupUser = async (email: string, password: string): Promise<UserResponse> => {
  try {
    const response = await apiClient.post<UserResponse>('/users/', { email, password });
    return response.data;
  } catch (error: any) {
    console.error('Signup API error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Signup failed');
  }
};

// Get Current User (Corrected)
export const getCurrentUser = async (): Promise<UserResponse | null> => {
  console.log("getCurrentUser: Attempting API call to /users/me"); // Add log
  try {
    const response = await apiClient.get<UserResponse>('/users/me');
    console.log("getCurrentUser: API call successful, status:", response.status, "Data:", response.data); // Add log
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error(
        `getCurrentUser: Axios error! Status: ${error.response?.status}, ` +
        `Data: ${JSON.stringify(error.response?.data)}, ` +
        `Headers: ${JSON.stringify(error.response?.headers)}`
      ); // Detailed Axios error log
      if (error.response?.status === 401) {
        console.log('getCurrentUser: Detected 401 Unauthorized. Returning null.');
        return null;
      }
    } else {
      console.error('getCurrentUser: Non-Axios error:', error.message, error); // Log other errors
    }
    // Throw error for non-401 cases
    throw new Error(error.response?.data?.detail || 'Failed to fetch user data');
  }
};

// --- Notes API Service Functions --- //

// Fetch Notes for current user
export const fetchNotes = async (skip: number = 0, limit: number = 100): Promise<Note[]> => {
  try {
    // The interceptor will add the auth token
    const response = await apiClient.get<Note[]>('/notes/', {
      params: { skip, limit },
    });
    return response.data;
  } catch (error: any) {
    console.error('Fetch Notes API error:', error.response?.data || error.message);
    // Handle 401 Unauthorized specifically if needed (e.g., trigger logout)
    throw new Error(error.response?.data?.detail || 'Failed to fetch notes');
  }
};

// Create a new Note
interface NoteCreatePayload {
  title: string;
  content?: string | null; // Match backend schema
}

export const createNote = async (noteData: NoteCreatePayload): Promise<Note> => {
  try {
    const response = await apiClient.post<Note>('/notes/', noteData);
    return response.data;
  } catch (error: any) {
    console.error('Create Note API error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to create note');
  }
};

// Function to get a single note by ID (Corrected)
export const getNoteById = async (noteId: number): Promise<Note> => {
  try {
    const response = await apiClient.get<Note>(`/notes/${noteId}`); // Removed prefix
    console.log('Get Note By ID API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get Note By ID API error:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to fetch note');
    }
    throw new Error('Failed to fetch note');
  }
};

// Function to update a note by ID (Corrected)
export const updateNote = async (noteId: number, noteData: NoteUpdateData): Promise<Note> => {
  try {
    const response = await apiClient.put<Note>(`/notes/${noteId}`, noteData); // Removed prefix
    console.log('Update Note API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update Note API error:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to update note');
    }
    throw new Error('Failed to update note');
  }
};

// Function specifically for updating position (uses the general updateNote)
// This is more of a convenience wrapper for the drag handler use case
export const updateNotePosition = async (noteId: number, position: { x: number; y: number }): Promise<Note> => {
    console.log(`Updating position for note ${noteId}:`, position);
    const updateData: NoteUpdateData = {
        position_x: position.x,
        position_y: position.y,
    };
    // Reuse the existing updateNote function
    return updateNote(noteId, updateData);
};

// Function to delete a note by ID (Corrected)
export const deleteNote = async (noteId: number): Promise<void> => {
  try {
    const response = await apiClient.delete(`/notes/${noteId}`); // Removed prefix
    console.log('Delete Note API response status:', response.status);
  } catch (error) {
    console.error('Delete Note API error:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to delete note');
    }
    throw new Error('Failed to delete note');
  }
};

// --- Graph Edge API Service Functions --- //

// Define the payload for creating an edge (matches backend GraphEdgeCreate schema)
interface GraphEdgeCreatePayload {
    source_node_id: number;
    target_node_id: number;
    relationship_type?: string | null;
    data?: { [key: string]: any } | null;
}

// Fetch Graph Edges for current user
export const fetchGraphEdges = async (skip: number = 0, limit: number = 1000): Promise<GraphEdge[]> => {
    try {
        const response = await apiClient.get<GraphEdge[]>('/graph/edges/', {
            params: { skip, limit },
        });
        console.log('Fetched Graph Edges:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Fetch Graph Edges API error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || 'Failed to fetch graph edges');
    }
};

// Create a new Graph Edge
export const createGraphEdge = async (edgeData: GraphEdgeCreatePayload): Promise<GraphEdge> => {
    try {
        const response = await apiClient.post<GraphEdge>('/graph/edges/', edgeData);
        console.log('Created Graph Edge:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Create Graph Edge API error:', error.response?.data || error.message);
        // Provide more specific feedback if possible (e.g., from ValueError in CRUD)
        const detail = error.response?.data?.detail || 'Failed to create graph edge';
        if (detail.includes("not found or does not belong to user")) {
            throw new Error("Cannot create edge: Source or target node not found.");
        }
        throw new Error(detail);
    }
};

// Delete a Graph Edge by ID
export const deleteGraphEdge = async (edgeId: number): Promise<void> => {
    try {
        const response = await apiClient.delete(`/graph/edges/${edgeId}`);
        console.log('Delete Graph Edge API response status:', response.status);
    } catch (error: any) {
        console.error('Delete Graph Edge API error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || 'Failed to delete graph edge');
    }
};

export default apiClient; // Export the configured instance if needed elsewhere 