// src/pages/Login.jsx - COMPLETE FIXED VERSION
import React, { useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import LoginForm from '../components/Auth/LoginForm';
import SocialAuth from '../components/Auth/SocialAuth';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { user, loading, setUserData, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const userParam = searchParams.get('user');

    if (accessToken && refreshToken && userParam) {
      try {
        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Parse user data
        const userData = JSON.parse(decodeURIComponent(userParam));
        
        // Set user data
        setTimeout(() => {
          setUserData(userData);
        }, 100);
        
        // Clean URL
        setSearchParams({});
        
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        setSearchParams({});
      }
    }
  }, [searchParams, setSearchParams, setUserData]);

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
              <LoginForm />
              
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
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Sign up here
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

export default Login;
