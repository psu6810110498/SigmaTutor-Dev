'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-lg">
        <div className="mb-6 flex justify-center">
          <div className="h-24 w-24 bg-destructive-light rounded-full flex items-center justify-center">
            <svg
              className="h-12 w-12 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mb-2">Something went wrong!</h2>
        <p className="text-gray-500 mb-8">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition shadow-lg shadow-primary/20"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          >
            Go Home
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-10 p-4 bg-gray-100 rounded-lg text-left overflow-auto max-h-60 text-xs font-mono text-destructive">
            {error.message}
            <br />
            {error.stack}
          </div>
        )}
      </div>
    </div>
  );
}
