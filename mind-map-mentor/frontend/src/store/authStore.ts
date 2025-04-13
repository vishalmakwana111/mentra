import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getCurrentUser } from '@/services/api'; // Import API function

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
  isLoading: boolean; // Add loading state for auth check
  isHydrated: boolean; // Add hydration status flag
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  checkAuthState: () => Promise<void>; // Action to check token and fetch user
  setHydrated: () => void; // Action to set hydration status
}

// Create the Zustand store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      isLoading: true, // Start in loading state until initial check is done
      isHydrated: false, // Default to not hydrated
      setToken: (token) => {
        set({ token, isLoggedIn: !!token });
        if (!token) {
            set({ user: null }); // Clear user if token is removed
        }
      },
      setUser: (user) => {
        set({ user, isLoggedIn: !!user });
      },
      logout: () => {
        console.log("AuthStore: Logging out");
        set({ token: null, user: null, isLoggedIn: false, isLoading: false });
      },
      checkAuthState: async () => {
        console.log("AuthStore: checkAuthState called");
        if (!get().isHydrated) {
             console.log("AuthStore: Waiting for hydration...");
             // Ideally, wait for isHydrated to be true, or call this after hydration
             // For simplicity here, we proceed, but AuthGuard handles initial check
             // return; 
        }

        const token = get().token;
        console.log("AuthStore: Current token:", token ? `${token.substring(0,5)}...` : null);
        if (!token) {
          console.log("AuthStore: No token found, setting loading false.");
          set({ user: null, isLoggedIn: false, isLoading: false });
          return;
        }

        console.log("AuthStore: Token found, attempting to fetch user...");
        set({ isLoading: true }); // Set loading true before API call
        try {
          const user = await getCurrentUser();
          if (user) {
            console.log("AuthStore: User fetched successfully:", user.email);
            set({ user, isLoggedIn: true, isLoading: false });
          } else {
            // This case might happen if API returns null on 401, handled by getCurrentUser
            console.log("AuthStore: getCurrentUser returned null (likely 401), logging out.");
            set({ token: null, user: null, isLoggedIn: false, isLoading: false });
          }
        } catch (error: any) {
          console.error("AuthStore: Error fetching user during checkAuthState:", error.message);
          // Handle specific errors if needed, otherwise logout
          set({ token: null, user: null, isLoggedIn: false, isLoading: false });
        }
      },
      setHydrated: () => { 
        console.log("AuthStore: Setting hydrated true");
        set({ isHydrated: true });
        // Optionally trigger the initial auth check AFTER hydration is confirmed
        // get().checkAuthState(); // Be careful of infinite loops if not structured correctly
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