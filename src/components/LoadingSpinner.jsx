// frontend/src/components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-red-500"></div>
      <p className="text-white ml-4 text-xl">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;