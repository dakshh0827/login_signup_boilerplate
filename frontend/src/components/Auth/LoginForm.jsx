// src/components/Auth/LoginForm.jsx - COMPLETE FIXED VERSION
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { useAuth } from '../../context/AuthContext';
import { validateForm } from '../../utils/validation';

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
 
  const { login, setPendingVerificationEmail, isVerified } = useAuth();
  const navigate = useNavigate();
 
  const handleSubmit = async (e) => {
    e.preventDefault();
   
    const validation = validateForm(formData, ['email', 'password']);
   
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setError('');
   
    try {
      console.log('Attempting login with:', formData.email);
      const result = await login(formData.email, formData.password);
      
      console.log('Login result:', result);
     
      if (result && result.success && result.user) {
        const user = result.user;
        
        console.log('User data received:', user);
        console.log('Email verification fields:', {
          emailVerified: user.emailVerified,
          isEmailVerified: user.isEmailVerified,
          isVerified: user.isVerified,
          verificationStatus: user.verificationStatus
        });

        // Check if user needs email verification
        const needsEmailVerification = !user.emailVerified && !user.isEmailVerified;
        
        if (needsEmailVerification) {
          console.log('User needs email verification, redirecting...');
          setPendingVerificationEmail(formData.email);
          navigate('/verify-email', { 
            state: { 
              email: formData.email,
              message: 'Please verify your email address to continue.' 
            },
            replace: true
          });
        } else {
          console.log('User email verified, redirecting to dashboard...');
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError(result?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
   
    // Clear error when user starts typing
    if (errors[name] || error) {
      setErrors(prev => ({ ...prev, [name]: '' }));
      setError('');
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="Enter your email"
          required
          autoComplete="email"
        />
       
        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Forgot your password?
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;
