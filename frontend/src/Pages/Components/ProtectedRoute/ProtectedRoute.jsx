import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#011627] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-yellow-400 border-gray-600"></div>
          <p className="text-lg font-semibold text-yellow-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#011627] text-white text-center px-4">
        <h1 className="text-4xl font-extrabold text-red-500 mb-2">403 - Unauthorized Access</h1>
        <p className="text-lg text-gray-400 mb-6">You do not have permission to view this page.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
