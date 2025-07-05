import React from 'react';
import { UserAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const { session, loading } = UserAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, show the public page
  return <>{children}</>;
};

export default PublicRoute;
