// src/components/Auth/OTPForm.jsx - FIXED VERSION (Proper API Integration)
import React, { useState, useRef, useEffect } from 'react';
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
  const [timer, setTimer] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasInitialSend, setHasInitialSend] = useState(false);
  const inputRefs = useRef([]);
  const { verifyOTP, resendOTP, verifyResetOTP, sendVerificationEmail } = useAuth();

  // Use refs to prevent multiple API calls
  const hasAutoSent = useRef(false);
  const isSubmitting = useRef(false);
  const lastSentEmail = useRef('');

  // Auto-send OTP only once per email - using proper send endpoint
  useEffect(() => {
    // Skip if no email or already sent for this email
    if (!email?.trim() || hasAutoSent.current || lastSentEmail.current === email.trim()) {
      return;
    }

    console.log('Auto-sending initial OTP to:', email);
    hasAutoSent.current = true;
    lastSentEmail.current = email.trim();
    
    const sendInitialOTP = async () => {
      if (resendLoading || hasInitialSend) {
        console.log('Already sending or initial send done, skipping...');
        return;
      }

      setResendLoading(true);
      setError('');
      
      try {
        let response;
        
        // Use proper initial send method instead of resend
        if (type === 'password_reset') {
          // For password reset, use resend method as it's the initial send
          response = await resendOTP(email.trim(), 'password_reset');
        } else {
          // For verification, use the dedicated send method if available
          if (sendVerificationEmail) {
            response = await sendVerificationEmail(email.trim());
          } else {
            // Fallback to resend method
            response = await resendOTP(email.trim(), 'verification');
          }
        }
        
        if (response?.success) {
          setTimer(60);
          setHasInitialSend(true);
          console.log('Initial OTP sent successfully');
        } else {
          setError(response?.message || 'Failed to send verification code');
        }
      } catch (err) {
        console.error('Auto-send OTP error:', err);
        setError('Failed to send verification code');
      } finally {
        setResendLoading(false);
      }
    };
    
    // Send immediately without delay
    sendInitialOTP();
  }, [email, type, resendOTP, sendVerificationEmail, resendLoading, hasInitialSend]);

  // Reset states when email changes
  useEffect(() => {
    if (lastSentEmail.current && lastSentEmail.current !== email?.trim()) {
      console.log('Email changed, resetting states');
      
      // Reset all states
      setTimer(0);
      setError('');
      setSuccessMessage('');
      setOtp(['', '', '', '', '', '']);
      setHasInitialSend(false);
      
      // Reset the auto-send flags for new email
      hasAutoSent.current = false;
      lastSentEmail.current = '';
    }
  }, [email]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (value.length > 1 || (value && !/^\d$/.test(value))) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
    
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus();
      }, 0);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = Array(6).fill('').map((_, i) => pastedData[i] || '');
    setOtp(newOtp);
    
    const nextEmptyIndex = newOtp.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    setTimeout(() => {
      inputRefs.current[focusIndex]?.focus();
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting.current || loading) {
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
      console.log('Verifying OTP:', { email: email.trim(), otp: otpString, type });
      
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
        
        if (onSuccess) {
          onSuccess(response);
        }
      } else {
        const errorMsg = response?.message || response?.error || 'Invalid OTP. Please try again.';
        setError(errorMsg);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 0);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Invalid OTP. Please try again.';
      setError(errorMsg);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 0);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const handleResend = async () => {
    if (!email?.trim()) {
      setError('Email is required to resend OTP');
      return;
    }

    if (resendLoading || timer > 0) {
      return;
    }

    setResendLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const otpType = type === 'password_reset' ? 'password_reset' : 'verification';
      console.log('Resending OTP:', { email: email.trim(), type: otpType });
      
      const response = await resendOTP(email.trim(), otpType);
      
      if (response?.success) {
        setTimer(60);
        setSuccessMessage('New verification code sent!');
        
        if (onResend) {
          onResend();
        }
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      } else {
        setError(response?.message || 'Failed to send verification code');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to resend verification code';
      setError(errorMsg);
    } finally {
      setResendLoading(false);
    }
  };

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

  const isSubmitDisabled = otp.join('').length !== 6 || loading;
  const canResend = timer === 0 && !resendLoading && !loading;

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
              onChange={(e) => handleChange(index, e.target.value)}
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
          disabled={isSubmitDisabled}
        >
          {loading ? 'Verifying...' : (type === 'password_reset' ? 'Verify Code' : 'Verify Email')}
        </Button>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Didn't receive the code?
          </p>
          
          {timer > 0 ? (
            <p className="text-sm text-gray-500">
              Resend in {timer}s
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className={`text-sm font-medium transition-colors ${
                !canResend
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-800 cursor-pointer'
              }`}
            >
              {resendLoading ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default OTPForm;
