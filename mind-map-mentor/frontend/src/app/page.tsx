// Remove imports for DashboardLayout, MindMapCanvas, ReactFlowProvider, AuthGuard, dynamic
import React from 'react';
import Link from 'next/link'; // Import Link for navigation

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-100 to-white p-4">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Mind Map Mentor
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Unlock your ideas with the power of AI-driven mind mapping. Visualize, connect, and expand your knowledge like never before.
        </p>
      </header>

      <div className="flex space-x-4">
        <Link href="/login"
          className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg shadow-md hover:bg-violet-700 transition duration-300"
        >
          Login
        </Link>
        <Link href="/signup"
          className="px-6 py-3 bg-white text-violet-600 font-semibold rounded-lg shadow-md border border-violet-200 hover:bg-violet-50 transition duration-300"
        >
          Sign Up
        </Link>
      </div>

      {/* Optional: Add more sections like Features, How it works, etc. */}
      {/* <section className="mt-20 w-full max-w-4xl">
        <h2 className="text-3xl font-semibold text-center mb-8">Features</h2>
        {/* ... Feature descriptions ... */}
      {/* </section> */}
    </div>
  );
}
