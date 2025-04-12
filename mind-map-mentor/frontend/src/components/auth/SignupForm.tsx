'use client';

import React, { useState } from 'react';
import { signupUser } from '@/services/api'; // Import API function
import { useRouter } from 'next/navigation'; // Import useRouter
import toast from 'react-hot-toast'; // Import toast
import Link from 'next/link'; // Import Link

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter(); // Initialize router

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    console.log('Attempting signup with:', { email }); // Don't log password

    try {
      await signupUser(email, password);
      setSuccess(true);
      console.log('Signup successful. Redirecting to login...');
      // Don't clear form, show success message briefly then redirect
      setTimeout(() => {
        router.push('/login'); // Redirect to login page after a short delay
      }, 1500); // 1.5 second delay
    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(err.message || 'Signup failed. Please try again.'); // Show error toast
    } finally {
      setIsLoading(false);
    }

    // Remove placeholder
    // await new Promise(resolve => setTimeout(resolve, 1000));
    // console.log('Placeholder signup finished');
    // setIsLoading(false);
    // setSuccess(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm w-full mx-auto p-6 border border-gray-200 rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-semibold text-center mb-4 text-gray-900">Sign Up</h2>
      {success ? (
        <p className="text-center text-green-600">Signup successful! You can now log in.</p>
      ) : (
        <>
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm bg-white text-gray-900"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8} // Example validation
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm bg-white text-gray-900"
              placeholder="Minimum 8 characters"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm bg-white text-gray-900"
              placeholder="Re-type your password"
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
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </button>
        </>
      )}

      {/* Add link to Login page */}
      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
          Log in
        </Link>
      </p>
    </form>
  );
};

export default SignupForm; 