// src/utils/constants.js - UPDATED WITH REJECTED STATUS
export const API_BASE_URL = 'http://localhost:5000/api';
export const OAUTH_BASE_URL = 'http://localhost:5000/auth';

export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  name: /^[a-zA-Z\s]{2,50}$/
};

export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  VERIFY_EMAIL: '/verify-email',
  ROOT: '/'
};

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
  VERIFY_OTP: '/auth/verify-email',
  RESEND_OTP: '/auth/resend-email',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  REFRESH_TOKEN: '/auth/refresh-token',
};

export const OAUTH_ENDPOINTS = {
  GOOGLE: '/oauth/google',
  GITHUB: '/oauth/github'
};

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: (field) => `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PASSWORD: 'Password must be 8+ chars with uppercase, lowercase, number, and special character',
  INVALID_NAME: 'Name must be 2-50 characters, letters only',
  INVALID_OTP: 'Please enter a valid 6-digit code',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  LOCATION_REQUIRED: 'Location is required for service request',
  INVALID_COORDINATES: 'Invalid GPS coordinates provided',
  FILE_TOO_LARGE: 'Image file is too large (max 5MB)',
  INVALID_FILE_TYPE: 'Only image files are allowed',
  INVALID_ROLE: 'Invalid role selected',
};

export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  LOCATION_UPDATED: 'Location updated successfully!'
};