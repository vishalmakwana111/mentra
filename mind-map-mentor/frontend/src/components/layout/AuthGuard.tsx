'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getCurrentUser } from '@/services/api';
import { usePathname, useRouter } from 'next/navigation'; // Import hooks

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { token, isLoggedIn, setUser, logout, isHydrated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) {
        console.log("AuthGuard Effect: Waiting for store hydration...");
        return; 
    }
    
    console.log("AuthGuard Effect: Store hydrated. Running checkAuth...");
    console.log(`AuthGuard Effect: Hydrated token from store: ${token}`);
    
    setIsLoading(true);

    const checkAuth = async () => {
      let authenticated = false;
      if (token) {
        try {
          console.log('AuthGuard: Token found in checkAuth, attempting to fetch user...');
          const userData = await getCurrentUser(); // Can return UserResponse | null
          console.log('AuthGuard: Received from getCurrentUser:', userData);
          if (userData) {
            setUser(userData);
            authenticated = true;
            console.log('AuthGuard: User set successfully.');
          } else {
             console.log('AuthGuard: Logging out because getCurrentUser returned null.');
             logout(); 
          }
        } catch (error) { 
          console.error('AuthGuard: Logging out due to error during getCurrentUser call:', error);
          logout(); 
        }
      } else {
        console.log("AuthGuard Effect: No token found after hydration.");
      }
      
      // --- Redirection Logic --- 
      const isAuthPage = pathname === '/login' || pathname === '/signup';
      const isPublicPage = pathname === '/' || isAuthPage;
      const isProtectedRoute = !isPublicPage; // Assuming anything else is protected

      if (authenticated) {
        // User is LOGGED IN
        if (isAuthPage) {
          console.log(`AuthGuard: User authenticated, redirecting from ${pathname} to /dashboard`);
          router.replace('/dashboard');
          return; // Prevent further state changes until redirect completes
        } 
        // Keep existing redirect from landing page
        if (pathname === '/') {
          console.log('AuthGuard: User authenticated, redirecting from / to /dashboard');
          router.replace('/dashboard');
          return;
        }
        // Otherwise, user is logged in and on a protected page (or already /dashboard), let them stay.
        console.log(`AuthGuard: User authenticated, staying on ${pathname}`);

      } else {
        // User is NOT LOGGED IN
        if (isProtectedRoute) {
           console.log(`AuthGuard: User not authenticated, redirecting from protected route ${pathname} to /login`);
           router.replace('/login');
           return; // Prevent further state changes until redirect completes
        }
        // Otherwise, user is not logged in but on a public page (/, /login, /signup), let them stay.
        console.log(`AuthGuard: User not authenticated, staying on public route ${pathname}`);
      }
      // --- End Redirection Logic ---
      
      // Finish loading *after* check and potential redirects
      setIsLoading(false); 
    };

    checkAuth();
  }, [isHydrated, token, setUser, logout, router, pathname]);

  if (!isHydrated || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading session...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard; 