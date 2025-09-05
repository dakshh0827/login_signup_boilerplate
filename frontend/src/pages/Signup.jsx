// src/pages/Signup.jsx - COMPLETE FIXED VERSION
import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import SignupForm from '../components/Auth/SignUpForm';
import SocialAuth from '../components/Auth/SocialAuth';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (user && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
            <div className="space-y-6">
              <SignupForm />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <SocialAuth />
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Signup;
