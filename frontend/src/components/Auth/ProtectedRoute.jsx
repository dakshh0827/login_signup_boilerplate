// src/components/Auth/ProtectedRoute.jsx - COMPLETELY FIXED VERSION
import React, { useRef, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireVerification = true }) => {
  const {
    user,
    loading,
    isAuthenticated,
    isVerified,
    setPendingVerificationEmail,
  } = useAuth();

  const location = useLocation();
  
  // FIXED: Prevent multiple calls to setPendingVerificationEmail
  const hasSetPendingEmail = useRef(false);

  // FIXED: Only set pending email once when conditions are met
  useEffect(() => {
    if (
      requireVerification && 
      user && 
      !isVerified && 
      user.email && 
      !hasSetPendingEmail.current
    ) {
      console.log('Setting pending verification email:', user.email);
      setPendingVerificationEmail(user.email);
      hasSetPendingEmail.current = true;
    }
    
    // Reset flag when user becomes verified or changes
    if (isVerified || !user) {
      hasSetPendingEmail.current = false;
    }
  }, [user, isVerified, requireVerification, setPendingVerificationEmail]);

  // Enhanced logging for debugging
  console.log('🛡️ ProtectedRoute Check:', {
    loading,
    isAuthenticated,
    isVerified,
    requireVerification,
    userEmail: user?.email,
    pathname: location.pathname,
    userVerificationStatus: user ? {
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      isEmailVerified: user.isEmailVerified,
      verified: user.verified
    } : null
  });

  // Show loading spinner while auth is being determined
  if (loading) {
    console.log('🔄 ProtectedRoute: Loading auth state...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // FIXED: More robust authentication check
  if (!isAuthenticated || !user) {
    console.log('❌ ProtectedRoute: Not authenticated, redirecting to login');
    console.log('Auth Debug:', { 
      isAuthenticated, 
      hasUser: !!user,
      userEmail: user?.email 
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // FIXED: Clear verification check
  if (requireVerification && !isVerified) {
    console.log('📧 ProtectedRoute: Verification required, redirecting to verify-email');
    console.log('Verification Debug:', {
      requireVerification,
      isVerified,
      userVerificationFields: {
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        isEmailVerified: user.isEmailVerified,
        verified: user.verified
      }
    });
    
    return (
      <Navigate 
        to="/verify-email" 
        state={{ 
          from: location, 
          email: user.email 
        }} 
        replace 
      />
    );
  }

  // All checks passed - render the protected content
  console.log('✅ ProtectedRoute: Access granted, rendering protected content');
  return children;
};

export default ProtectedRoute;
