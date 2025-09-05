// src/components/Auth/PublicRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Now this will work

const PublicRoute = ({ children }) => {
  const { user, loading, pendingVerificationEmail } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Priority 1: If there's a pending verification email, redirect to verify-email
  if (pendingVerificationEmail) {
    return <Navigate to="/verify-email" replace />;
  }

  // Priority 2: If user is authenticated AND email is verified, redirect to dashboard
  if (user && (user.emailVerified || user.isVerified)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Priority 3: If user exists but email is not verified, redirect to verify-email
  if (user && !user.emailVerified && !user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // If not authenticated or verification pending, show the public page
  return children;
};

export default PublicRoute;
