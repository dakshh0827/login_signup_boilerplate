// src/services/api.js - COMPLETE FIXED VERSION WITH TOKEN HANDLING
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
  }

  // ============== CORE REQUEST HANDLING ==============

  getHeaders(includeAuth = true) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (includeAuth && token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  async handleResponse(response) {
    // Handle authentication errors
    if (response.status === 401) {
      this.clearAuth();
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    // Handle authorization errors
    if (response.status === 403) {
      throw new Error('Access denied');
    }

    // Parse response
    let data;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      data = { 
        success: response.ok, 
        message: textResponse || (response.ok ? 'Success' : `Error: ${response.status}`)
      };
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: this.getHeaders(options.includeAuth !== false),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ============== HTTP METHODS ==============

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============== TOKEN MANAGEMENT ==============

  getToken() {
    // Prefer 'token' over 'accessToken'
    return localStorage.getItem('token') || localStorage.getItem('accessToken');
  }

  setTokens({ accessToken, refreshToken }) {
    if (accessToken) {
      localStorage.setItem('token', accessToken);
      console.log('ApiService: Access token saved');
    }
    
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
      console.log('ApiService: Refresh token saved');
    }
  }

  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    console.log('ApiService: Auth tokens cleared');
  }

  isAuthenticated() {
    const token = this.getToken();
    if (!token) {
      console.log('ApiService: No token found');
      return false;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const isValid = payload.exp > currentTime;
      
      console.log('ApiService: Token validation:', {
        isValid,
        expiresAt: new Date(payload.exp * 1000),
        now: new Date(),
        userId: payload.userId || payload.id
      });
      
      if (!isValid) {
        this.clearAuth();
      }
      
      return isValid;
    } catch (error) {
      console.error('ApiService: Token validation error:', error);
      this.clearAuth();
      return false;
    }
  }

  getUserIdFromToken() {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // ============== AUTHENTICATION METHODS ==============

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      includeAuth: false
    });
    
    // CRITICAL: Extract and save tokens from response
    const token = response.token || response.data?.accessToken || response.accessToken;
    const refreshToken = response.refreshToken || response.data?.refreshToken;
    
    if (token) {
      this.setTokens({ accessToken: token, refreshToken });
      console.log('ApiService: Tokens saved after login');
    }
    
    return response;
  }

  async register(userData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
      includeAuth: false
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearAuth();
    }
  }

  async getUserProfile() {
    return this.get('/auth/profile');
  }

  // ============== OTP METHODS ==============

  async verifyOTP(email, otp, type = 'verification') {
    // CRITICAL: This will now receive tokens from backend
    const response = await this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ 
        email: email.trim(), 
        otp: otp.trim(),
        type 
      }),
      includeAuth: false
    });

    // CRITICAL: Extract and save tokens if provided
    if (response.success) {
      const token = response.token || response.accessToken;
      const refreshToken = response.refreshToken;
      
      if (token) {
        this.setTokens({ accessToken: token, refreshToken });
        console.log('ApiService: Tokens saved after OTP verification');
      }
    }

    return response;
  }

  async resendOTP(email, type = 'verification') {
    return this.request('/auth/resend-email', {
      method: 'POST',
      body: JSON.stringify({ 
        email: email.trim(), 
        type 
      }),
      includeAuth: false
    });
  }

  // ============== PASSWORD RESET METHODS ==============

  async verifyResetOTP(email, otp) {
    return this.request('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        otp: otp.trim()
      }),
      includeAuth: false
    });
  }

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim() }),
      includeAuth: false
    });
  }

  async resetPassword(email, otp, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        otp: otp.trim(),
        newPassword
      }),
      includeAuth: false
    });
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;
