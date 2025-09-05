// src/components/Auth/OTPForm.jsx - COMPLETELY FIXED VERSION
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from '../UI/Button';
import { useAuth } from '../../context/AuthContext';

const OTPForm = ({ 
  email, 
  onSuccess, 
  onResend, 
  type = 'verification'
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false); // ADDED: State to control resend button
  const [successMessage, setSuccessMessage] = useState('');
  const inputRefs = useRef([]);
  const { verifyOTP, resendOTP, verifyResetOTP } = useAuth();

  // CRITICAL: Prevent infinite loops
  const hasAutoSent = useRef(false);
  const isMounted = useRef(true);
  const isSubmitting = useRef(false);
  const currentEmail = useRef(email);

  // FIXED: Reset auto-send flag when email changes
  useEffect(() => {
    if (currentEmail.current !== email) {
      console.log('Email changed, resetting auto-send flag');
      hasAutoSent.current = false;
      currentEmail.current = email;
    }
  }, [email]);

  // FIXED: Auto-send OTP only once per email
  useEffect(() => {
    if (!email?.trim() || hasAutoSent.current || resendLoading) {
      return;
    }

    console.log('Auto-sending OTP to:', email);
    hasAutoSent.current = true;
    handleResend(true);

    return () => {
      isMounted.current = false;
    };
  }, [email]);

  // FIXED: Timer countdown with proper canResend state management
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setCanResend(true); // CRITICAL: Enable resend button when timer hits 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true); // Ensure canResend is true when timer is 0
    }
  }, [timer]);

  const handleChange = useCallback((index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Clear messages when typing
    setError('');
    setSuccessMessage('');
  }, [otp]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = Array(6).fill('').map((_, i) => pastedData[i] || '');
    setOtp(newOtp);
    
    const nextEmptyIndex = newOtp.findIndex((digit, i) => !digit && i < 6);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    inputRefs.current[focusIndex]?.focus();
  }, []);

  // FIXED: Prevent multiple submissions and ensure loading is reset
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting.current || loading) {
      console.log('Already submitting, skipping...');
      return;
    }

    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (!email?.trim()) {
      setError('Email is required for verification');
      return;
    }

    isSubmitting.current = true;
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('Submitting OTP:', { email: email.trim(), otp: otpString, type });
      
      let response;
      
      if (type === 'password_reset') {
        response = await verifyResetOTP(email.trim(), otpString);
      } else {
        response = await verifyOTP(email.trim(), otpString);
      }
      
      console.log('OTP verification response:', response);
      
      if (response?.success) {
        setSuccessMessage('Verification successful!');
        setError('');
        
        // Call success handler
        onSuccess?.(response);
      } else {
        const errorMsg = response?.message || response?.error || 'Invalid OTP. Please try again.';
        setError(errorMsg);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Invalid OTP. Please try again.';
      setError(errorMsg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      // CRITICAL: Always reset loading states
      if (isMounted.current) {
        setLoading(false);
        isSubmitting.current = false;
      }
    }
  }, [otp, email, type, verifyOTP, verifyResetOTP, onSuccess, loading]);

  // FIXED: Prevent multiple simultaneous resend requests with proper state management
  const handleResend = useCallback(async (isAutoSend = false) => {
    if (!email?.trim()) {
      if (!isAutoSend) {
        setError('Email is required to resend OTP');
      }
      return;
    }

    // CRITICAL: Prevent parallel resend requests
    if (resendLoading) {
      console.log('Resend already in progress, skipping...');
      return;
    }

    // For manual resend, check if resend is allowed
    if (!isAutoSend && !canResend) {
      setError(`Please wait ${timer} seconds before requesting another code`);
      return;
    }

    console.log('Resending OTP:', { email, type, isAutoSend });
    setResendLoading(true);
    setCanResend(false); // CRITICAL: Disable resend button during request
    setError('');
    setSuccessMessage('');
    
    try {
      const otpType = type === 'password_reset' ? 'password_reset' : 'verification';
      const response = await resendOTP(email.trim(), otpType);
      
      console.log('Resend OTP response:', response);
      
      if (response?.success) {
        setTimer(60); // Reset timer to 60 seconds
        setCanResend(false); // Keep disabled until timer runs out
        
        if (!isAutoSend) {
          setSuccessMessage('New verification code sent!');
          onResend?.();
          
          setTimeout(() => {
            if (isMounted.current) {
              setSuccessMessage('');
            }
          }, 3000);
        }
        
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(response?.message || 'Failed to send verification code');
        setCanResend(true); // Re-enable on failure
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to resend verification code';
      setError(errorMsg);
      setCanResend(true); // Re-enable on error
    } finally {
      // CRITICAL: Always reset resend loading
      if (isMounted.current) {
        setResendLoading(false);
      }
    }
  }, [email, timer, canResend, type, resendOTP, onResend, resendLoading]);

  if (!email?.trim()) {
    return (
      <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
        <p>Email is required for verification</p>
      </div>
    );
  }

  const getTitle = () => {
    return type === 'password_reset' ? 'Verify Reset Code' : 'Verify Your Email';
  };

  const getDescription = () => {
    const action = type === 'password_reset' ? 'reset code' : 'verification code';
    return `We've sent a 6-digit ${action} to ${email}`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{getTitle()}</h2>
        <p className="text-gray-600">{getDescription()}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center space-x-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value.replace(/\D/, ''))}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={loading || resendLoading}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {successMessage && (
          <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg border border-green-200">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={otp.join('').length !== 6 || loading || resendLoading}
        >
          {loading ? 'Verifying...' : (type === 'password_reset' ? 'Verify Code' : 'Verify Email')}
        </Button>

        {/* FIXED: Resend button with proper state management */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Didn't receive the code?
          </p>
          
          {!canResend && timer > 0 ? (
            <p className="text-sm text-gray-500">
              Resend in {timer}s
            </p>
          ) : (
            <button
              type="button"
              onClick={() => handleResend(false)}
              disabled={!canResend || resendLoading || loading}
              className={`text-sm font-medium transition-colors ${
                (!canResend || resendLoading || loading)
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-800 cursor-pointer'
              }`}
            >
              {resendLoading ? 'Sending...' : 'Resend Code'}
            </button>
          )}
          
          {/* Show loading indicator during resend */}
          {resendLoading && (
            <div className="flex justify-center items-center space-x-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Sending new code...</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default OTPForm;
