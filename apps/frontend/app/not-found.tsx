"use client";

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="text-center">
                <h1 className="text-9xl font-black text-gray-200">404</h1>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h2>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        Oops! The page you are looking for does not exist. It might have been moved or deleted.
                    </p>

                    <Link
                        href="/"
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
                    >
                        Go Back Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
