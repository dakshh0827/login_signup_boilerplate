// src/components/Auth/ForgotPasswordModal.jsx
import React, { useState } from 'react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { useApi } from '../../Hooks/useApi';
import { validateForm } from '../../utils/validation';
import { X, Mail, CheckCircle } from 'lucide-react';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('email'); // 'email' | 'sent'
  
  const { loading, error, makeRequest } = useApi();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm({ email }, ['email']);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      const result = await makeRequest(async () => {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
          credentials: 'include',
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to send reset code');
        }
        
        return data;
      });

      if (result && result.success) {
        setStep('sent');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    
    if (errors.email) {
      setErrors({});
    }
  };

  const handleClose = () => {
    setEmail('');
    setErrors({});
    setStep('email');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'email' ? 'Forgot Password?' : 'Check Your Email'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 'email' ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full inline-block mb-3">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-gray-600">
                  Enter your email address and we'll send you a code to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    loading={loading} 
                    className="flex-1"
                  >
                    Send Code
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-100 p-3 rounded-full inline-block mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">
                  Reset code sent!
                </h3>
                <p className="text-sm text-gray-600">
                  We've sent a password reset code to:
                </p>
                <p className="text-sm font-medium text-gray-900">{email}</p>
                <p className="text-xs text-gray-500">
                  Please check your email and follow the instructions to reset your password.
                </p>
              </div>

              <div className="pt-4">
                <Button onClick={handleClose} className="w-full">
                  Got it
                </Button>
              </div>

              <button
                onClick={() => setStep('email')}
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                Try again with a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;