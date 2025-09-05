// src/pages/VerifyEmail.jsx - SIMPLIFIED FIXED VERSION
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import OTPForm from '../components/Auth/OTPForm';
import Button from '../components/UI/Button';
import { useAuth } from '../context/AuthContext';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user, 
    loading, 
    pendingVerificationEmail, 
    clearPendingVerification, 
    isVerified,
    isAuthenticated
  } = useAuth();
  
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  
  const hasRedirected = useRef(false);
  const hasInitialized = useRef(false);

  // Initialize once
  useEffect(() => {
    if (loading || hasInitialized.current) return;
    
    hasInitialized.current = true;
    
    // If already verified, redirect
    if (user && isVerified && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/dashboard', { replace: true });
      return;
    }

    // Get email for verification
    const emailToUse = location.state?.email || pendingVerificationEmail || user?.email;
    
    if (emailToUse) {
      setEmail(emailToUse);
    } else {
      setError('No email found for verification');
    }
  }, [loading]);

  // Watch for verification changes
  useEffect(() => {
    if (hasInitialized.current && user && isVerified && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/dashboard', { replace: true });
    }
  }, [isVerified, user, navigate]);

  const handleOTPSuccess = (response) => {
    console.log('OTP Success:', response);
    setSuccessMessage('Email verified successfully!');
    clearPendingVerification();
    
    setTimeout(() => {
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        navigate('/dashboard', { replace: true });
      }
    }, 1500);
  };

  const handleManualRedirect = () => {
    hasRedirected.current = true;
    navigate('/dashboard', { replace: true });
  };

  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (user && isVerified && !hasRedirected.current) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
            
            {successMessage && (
              <div className="mb-6 text-center">
                <div className="text-green-600 bg-green-50 p-4 rounded-lg">
                  <p className="font-medium">{successMessage}</p>
                </div>
                <Button
                  onClick={handleManualRedirect}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}

            {error && (
              <div className="mb-6 text-red-600 bg-red-50 p-4 rounded-lg">
                <p>{error}</p>
              </div>
            )}

            {email && !successMessage && (
              <OTPForm
                key={email}
                email={email}
                onSuccess={handleOTPSuccess}
                type="verification"
              />
            )}

            {!email && !successMessage && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
                <p className="text-red-600">No email found for verification</p>
                <Button
                  onClick={() => navigate('/login')}
                  className="mt-4"
                >
                  Back to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyEmail;
