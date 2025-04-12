'use client';

import React, { useState } from 'react';
import { loginUser } from '@/services/api'; // Import API function
import { useAuthStore } from '@/store/authStore'; // Import Zustand store
import { useRouter } from 'next/navigation'; // Import useRouter
import toast from 'react-hot-toast'; // Import toast

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Get actions from Zustand store
  const setToken = useAuthStore((state) => state.setToken);
  const router = useRouter(); // Initialize router
  // We might fetch and set user later, for now just set token
  // const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    console.log('Attempting login with:', { email }); // Don't log password

    try {
      const loginResponse = await loginUser(email, password);
      // Update Zustand store with token
      setToken(loginResponse.access_token);
      console.log('Login successful, token set. Redirecting...');
      // toast.success('Login successful!'); // Optional success toast before redirect
      router.push('/dashboard'); // Redirect to dashboard on success
      // TODO: Fetch user details using /users/me endpoint after setting token
      // const currentUser = await getCurrentUser();
      // setUser(currentUser);
      // Routing to dashboard will likely happen in a parent component based on isLoggedIn state

    } catch (err: any) {
      // setError(err.message || 'Login failed. Please check credentials.'); // Use toast instead
      console.error('Login error:', err);
      toast.error(err.message || 'Login failed. Please check credentials.'); // Show error toast
    } finally {
      setIsLoading(false);
    }

    // Remove placeholder
    // await new Promise(resolve => setTimeout(resolve, 1000));
    // console.log('Placeholder login finished');
    // setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm w-full mx-auto p-6 border border-gray-200 rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-semibold text-center mb-4 text-gray-900">Login</h2>
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm bg-white text-gray-900"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm bg-white text-gray-900"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default LoginForm; 