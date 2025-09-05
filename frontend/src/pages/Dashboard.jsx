// src/pages/Dashboard.jsx - Debug version to check if it's loading properly
import React, { useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, isAuthenticated, isVerified, loading } = useAuth();
  
  useEffect(() => {
    console.log('Dashboard component mounted:', {
      user: user?.email,
      isAuthenticated,
      isVerified,
      loading,
      userFields: user ? {
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        isEmailVerified: user.isEmailVerified,
        verified: user.verified
      } : null
    });
  }, [user, isAuthenticated, isVerified, loading]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome to Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Hello {user?.firstName} {user?.lastName}!
              </p>
            </div>

            {/* Debug Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Debug Information</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
                <p><strong>Is Verified:</strong> {isVerified ? 'Yes' : 'No'}</p>
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Verification Fields:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• isVerified: {user?.isVerified ? 'true' : 'false'}</li>
                  <li>• emailVerified: {user?.emailVerified ? 'true' : 'false'}</li>
                  <li>• isEmailVerified: {user?.isEmailVerified ? 'true' : 'false'}</li>
                  <li>• verified: {user?.verified ? 'true' : 'false'}</li>
                </ul>
              </div>
            </div>

            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Email verified successfully!
                  </h3>
                  <p className="mt-2 text-sm text-green-700">
                    You now have full access to your dashboard and all features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;