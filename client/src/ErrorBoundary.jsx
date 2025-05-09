import React from "react";
import { Link, useRouteError } from "react-router-dom";
import { AlertTriangle } from 'lucide-react';

const ErrorBoundary = () => {
  const error = useRouteError();
  let title = error?.statusText || error?.name;
  let message = error?.error?.message || error?.message;

  console.log(error);

  if (error.status === 404) {
    message = "Page not found";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
      <div className="w-full max-w-xl overflow-auto rounded-lg bg-white p-12 shadow-lg">
        <div className="mb-8 flex flex-col items-center">
          <AlertTriangle className="h-16 w-16 text-red-400" />
          <h1 className="mt-4 text-3xl font-bold text-red-500 capitalize">
            {title || "Something Went Wrong"}
          </h1>
        </div>

        <p className="mb-8 text-center text-gray-600">
          {message}. Click the button below to go back to the home page.
        </p>

        {import.meta.env.DEV && (
          <pre className="mb-8 overflow-auto rounded bg-gray-100 p-4 text-sm text-gray-800">
            {error?.stack || error?.error?.stack}
          </pre>
        )}

        <div className="flex justify-center">
          <Link
            to="/"
            className="rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;