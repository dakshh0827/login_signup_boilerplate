// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import { useAuth } from '../context/AuthContext';
import { validateForm } from '../utils/validation';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import apiService from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('email'); // 'email' | 'sent'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, loading: authLoading } = useAuth();

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm({ email }, ['email']);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use the api service directly for forgot password
      const result = await apiService.post('/auth/forgot-password', { email });

      if (result && result.success) {
        setStep('sent');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    
    // Clear error when user starts typing
    if (errors.email || error) {
      setErrors({});
      setError('');
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');

    try {
      await apiService.post('/auth/forgot-password', { email });
      // Show success message or update UI as needed
    } catch (err) {
      console.error('Resend error:', err);
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 'email' ? 'Forgot Password?' : 'Check Your Email'}
            </h1>
            <p className="text-gray-600">
              {step === 'email' 
                ? "Don't worry, we'll send you reset instructions." 
                : "We've sent a password reset code to your email address."
              }
            </p>
          </div>

          <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
            {step === 'email' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                  autoFocus
                />

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    {error}
                  </div>
                )}

                <Button type="submit" loading={loading} className="w-full">
                  Send Reset Code
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    Reset code sent!
                  </h3>
                  <p className="text-sm text-gray-600">
                    We've sent a password reset code to:
                  </p>
                  <p className="text-sm font-medium text-gray-900">{email}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    The code will expire in 10 minutes. Please check your spam folder if you don't see it.
                  </p>
                </div>

                <Link
                  to="/reset-password"
                  state={{ email }}
                  className="inline-block w-full"
                >
                  <Button className="w-full">
                    Continue to Reset Password
                  </Button>
                </Link>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?
                  </p>
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-500 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Resend code'}
                  </button>
                  <br />
                  <button
                    onClick={() => setStep('email')}
                    className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Try again with a different email
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
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
    </Layout>
  );
};

export default ForgotPassword;