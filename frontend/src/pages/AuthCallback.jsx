// src/pages/OAuthCallback.jsx - NEW FILE
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../Hooks/useAuth';
import Layout from '../components/Layout/Layout';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=oauth_failed');
        return;
      }

      if (accessToken && refreshToken && userParam) {
        try {
          // Store tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          // Parse user data
          const userData = JSON.parse(decodeURIComponent(userParam));
          
          // Update auth context
          await checkAuthStatus();
          
          // Redirect to dashboard
          navigate('/dashboard');
        } catch (error) {
          console.error('OAuth callback error:', error);
          navigate('/login?error=oauth_failed');
        }
      } else {
        navigate('/login?error=oauth_failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate, checkAuthStatus]);

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing authentication...</p>
        </div>
      </div>
    </Layout>
  );
};

export default OAuthCallback;