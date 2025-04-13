'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const { isLoggedIn, isLoading, checkAuthState } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    console.log("AuthGuard: useEffect triggered. Initial check needed.");
    const performCheck = async () => {
      setIsChecking(true);
      try {
        await checkAuthState(); // Perform the initial auth check
        console.log("AuthGuard: Initial checkAuthState completed.");
      } catch (error) {
        console.error("AuthGuard: Error during initial auth check:", error);
        // Handle error if needed, though checkAuthState might handle internally
      } finally {
        setIsChecking(false);
      }
    };

    performCheck();
    
  }, [checkAuthState]);

  useEffect(() => {
    // This effect runs AFTER the initial check is done and isChecking is false
    if (!isChecking && !isLoading) { // Only redirect if not loading/checking
        console.log(`AuthGuard: Post-check status: isLoggedIn=${isLoggedIn}, isLoading=${isLoading}, isChecking=${isChecking}`);
        if (!isLoggedIn) {
            console.log("AuthGuard: User not logged in, redirecting to /login");
            router.replace('/login'); // Redirect to login page if not authenticated
        } else {
            console.log("AuthGuard: User is logged in, allowing access.");
        }
    }
  }, [isLoggedIn, isLoading, isChecking, router]);

  // Show loading state while checking or if the store is loading user data
  if (isLoading || isChecking) {
    console.log(`AuthGuard: Showing loading screen (isLoading=${isLoading}, isChecking=${isChecking})`);
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p> { /* Replace with a proper spinner/loader component if desired */ }
      </div>
    );
  }

  // If logged in after checks, render the children
  if (isLoggedIn) {
    return <>{children}</>;
  }

  // Fallback in case redirect hasn't happened yet (should be brief)
  console.log("AuthGuard: Fallback - rendering null while redirect potentially occurs.");
  return null; 
};

export default AuthGuard; 