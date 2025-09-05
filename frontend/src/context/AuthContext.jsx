// src/context/AuthContext.jsx - COMPLETELY FIXED WITH FORCED UPDATES
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import apiService from '../services/api';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);
  // ADDED: Force re-render trigger
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      console.log('AuthContext: Checking auth status...');
      
      if (!apiService.isAuthenticated()) {
        console.log('AuthContext: No valid token found');
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await apiService.getUserProfile();
      console.log('AuthContext: Profile response:', response);
      
      if (response.success) {
        const userData = response.data?.user || response.user || response.data;
        setUser(userData);
        console.log('AuthContext: User authenticated:', userData?.email, 'Verified:', userData?.isVerified);
        
        if (!userData.isVerified && !userData.emailVerified && !userData.isEmailVerified) {
          setPendingVerificationEmail(userData.email);
        } else {
          setPendingVerificationEmail(null);
        }
      } else {
        console.log('AuthContext: Profile request failed, clearing auth');
        apiService.clearAuth();
        setUser(null);
      }
    } catch (error) {
      console.error('AuthContext: Auth check failed:', error);
      apiService.clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      console.log('AuthContext: Attempting login for', email);
      const response = await apiService.login({ email, password });
      
      console.log('AuthContext: Login response:', response);
     
      if (response.success) {
        let userData = null;
        
        if (response.user) {
          userData = response.user;
        } else if (response.data?.user) {
          userData = response.data.user;
        } else if (response.data && typeof response.data === 'object') {
          userData = response.data;
        }
        
        console.log('AuthContext: Extracted user data:', userData);
        
        if (userData) {
          setUser(userData);
          
          const isUserVerified = userData.isVerified || userData.emailVerified || userData.isEmailVerified;
          
          if (isUserVerified) {
            setPendingVerificationEmail(null);
          } else {
            setPendingVerificationEmail(email);
          }
          
          forceUpdate(); // Trigger re-render
          
          return {
            ...response,
            user: userData
          };
        } else {
          console.error('AuthContext: No user data found in response');
          throw new Error('User data not found in login response');
        }
      }
     
      return response;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  }, [forceUpdate]);

  const register = useCallback(async (userData) => {
    try {
      console.log('AuthContext: Attempting registration for', userData.email);
      const response = await apiService.register(userData);
      
      console.log('AuthContext: Registration response:', response);
      
      if (response.success) {
        setPendingVerificationEmail(userData.email);
        console.log('AuthContext: Registration successful, set pending verification email');
      }
      
      return response;
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      throw error;
    }
  }, []);

  const verifyOTP = useCallback(async (email, otp) => {
  try {
    console.log('AuthContext: Verifying OTP for', email);
    
    const response = await apiService.verifyOTP(email.trim(), otp.trim(), 'verification');
    
    console.log('AuthContext: OTP verification response:', response);
    
    if (response.success) {
      // CRITICAL FIX: Handle tokens from verification response
      const { accessToken, refreshToken, token } = response;
      
      // Save tokens if provided
      if (accessToken || token) {
        const tokenToSave = accessToken || token;
        localStorage.setItem('token', tokenToSave);
        console.log('AuthContext: Saved access token after verification');
      }
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        console.log('AuthContext: Saved refresh token after verification');
      }

      // Update user state
      let updatedUser = null;
      
      if (response.data?.user) {
        updatedUser = response.data.user;
      } else if (response.user) {
        updatedUser = response.user;
      } else if (user) {
        // Create completely new user object to force re-render
        updatedUser = { 
          ...user, 
          isVerified: true, 
          emailVerified: true,
          isEmailVerified: true,
          verified: true
        };
      }
      
      if (updatedUser) {
        console.log('AuthContext: Setting verified user:', updatedUser);
        setUser(updatedUser);
        
        // Force update to trigger re-render
        forceUpdate?.();
      }
      
      setPendingVerificationEmail(null);
      
      // CRITICAL: Refresh auth status after token update
      setTimeout(async () => {
        console.log('AuthContext: Refreshing auth status after verification');
        await checkAuthStatus();
        forceUpdate?.();
      }, 200);
    }
    
    return response;
  } catch (error) {
    console.error('AuthContext: OTP verification error:', error);
    throw error;
  }
}, [user, checkAuthStatus, forceUpdate]);

  const resendOTP = useCallback(async (email, type = 'verification') => {
    try {
      console.log('AuthContext: Resending OTP to', email, 'Type:', type);
      
      const response = await apiService.resendOTP(email.trim(), type);
      
      console.log('AuthContext: Resend OTP response:', response);
      
      if (!response.success) {
        throw new Error(response.message || response.error || 'Failed to send verification code');
      }
      
      return response;
    } catch (error) {
      console.error('AuthContext: Resend OTP error:', error);
      throw error;
    }
  }, []);

  const verifyResetOTP = useCallback(async (email, otp) => {
    try {
      console.log('AuthContext: Verifying reset OTP for', email);
      
      const response = await apiService.verifyResetOTP(email.trim(), otp.trim());
      
      console.log('AuthContext: Reset OTP verification response:', response);
      
      return response;
    } catch (error) {
      console.error('AuthContext: Reset OTP verification error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('AuthContext: Logging out user');
      await apiService.logout();
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    } finally {
      setUser(null);
      setPendingVerificationEmail(null);
      console.log('AuthContext: User logged out successfully');
    }
  }, []);

  const updateUser = useCallback((userData) => {
    console.log('AuthContext: Updating user data:', userData);
    
    if (userData) {
      setUser(prevUser => ({
        ...prevUser,
        ...userData
      }));
      forceUpdate();
    } else {
      setUser(userData);
    }
  }, [forceUpdate]);

  const setUserData = useCallback((userData) => {
    console.log('AuthContext: Setting user data:', userData);
    setUser(userData);
    forceUpdate();
  }, [forceUpdate]);

  const clearPendingVerification = useCallback(() => {
    console.log('AuthContext: Clearing pending verification');
    setPendingVerificationEmail(null);
  }, []);

  // FIXED: Include updateTrigger in dependency to force recalculation
  const isAuthenticated = useMemo(() => {
    const result = !!user && apiService.isAuthenticated();
    console.log('AuthContext: isAuthenticated =', result);
    return result;
  }, [user, updateTrigger]);

  const isVerified = useMemo(() => {
    if (!user) return false;
    
    const verified = Boolean(
      user.emailVerified === true || 
      user.isEmailVerified === true || 
      user.verified === true ||
      user.isVerified === true
    );
    
    console.log('AuthContext: isVerified check:', {
      verified,
      user: user?.email,
      emailVerified: user?.emailVerified,
      isEmailVerified: user?.isEmailVerified,
      verified_field: user?.verified,
      isVerified: user?.isVerified,
      updateTrigger
    });
    
    return verified;
  }, [user, updateTrigger]);

  const getUserId = useMemo(() => {
    return user?.id || user?._id || apiService.getUserIdFromToken();
  }, [user]);

  const contextValue = useMemo(() => ({
    // State
    user,
    loading,
    pendingVerificationEmail,
    
    // Authentication methods
    login,
    register,
    logout,
    
    // User management
    updateUser,
    setUserData,
    
    // OTP methods
    verifyOTP,
    resendOTP,
    verifyResetOTP,
    
    // Verification management
    setPendingVerificationEmail,
    clearPendingVerification,
    
    // Status checks
    isAuthenticated,
    isVerified,
    getUserId,
    
    // Utility
    checkAuthStatus,
    forceUpdate
  }), [
    user,
    loading,
    pendingVerificationEmail,
    login,
    register,
    logout,
    updateUser,
    setUserData,
    verifyOTP,
    resendOTP,
    verifyResetOTP,
    clearPendingVerification,
    isAuthenticated,
    isVerified,
    getUserId,
    checkAuthStatus,
    forceUpdate,
    updateTrigger
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
