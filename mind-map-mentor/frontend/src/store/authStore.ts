import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the shape of the user object (can be expanded later)
interface User {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string; // Store as string from API
}

// Define the state and actions for the auth store
interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  isHydrated: boolean; // Add hydration status flag
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  setHydrated: () => void; // Action to set hydration status
}

// Create the Zustand store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      isHydrated: false, // Default to not hydrated
      setToken: (token) => {
        set({ token, isLoggedIn: !!token });
      },
      setUser: (user) => {
        set({ user, isLoggedIn: !!user });
      },
      logout: () => {
        set({ token: null, user: null, isLoggedIn: false });
        // Optionally clear other related state here
      },
      setHydrated: () => { // Implement the action
        set({ isHydrated: true });
      },
    }),
    {
      name: 'auth-storage', // Name of the item in storage (must be unique)
      storage: createJSONStorage(() => localStorage), // Use localStorage for web
      // Only persist the token, user info can be re-fetched
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => { // Use onRehydrateStorage
          if (state) {
              console.log("Zustand store has rehydrated.");
              state.setHydrated(); // Call action to mark as hydrated
          }
      },
    }
  )
); 