// server/src/controllers/authController.js - COMPLETELY FIXED VERSION
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import EmailService from '../services/emailService.js';
import TokenService from '../services/tokenService.js';
import {
  signupSchema,
  loginSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendOTPSchema,
} from '../lib/validation.js';

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Test the connection
prisma.$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch((error) => console.error('❌ Database connection failed:', error));

export const signup = async (req, res) => {
  try {
    const validatedData = signupSchema.parse(req.body);
    const { email, password, firstName, lastName } = validatedData;

    console.log('🔐 Signup attempt for:', email);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with isVerified = false (requires email verification)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        isVerified: false, // FIXED: Set to false to require email verification
      },
    });

    console.log('✅ User created:', user.email);

    // Generate and send OTP for email verification
    const otp = TokenService.generateOTP();
    const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

    // Delete any existing OTP codes for this email
    await prisma.oTPCode.deleteMany({
      where: { 
        email: email.toLowerCase(), 
        type: 'email_verification' 
      },
    });

    // Create new OTP record
    await prisma.oTPCode.create({
      data: {
        email: email.toLowerCase(),
        code: await bcrypt.hash(otp, 10),
        type: 'email_verification',
        expiresAt,
      },
    });

    // Send verification email
    await EmailService.sendOTP(email, otp, 'email_verification');

    console.log('📧 Verification email sent to:', email);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email for verification code.',
      data: {
        email: user.email,
        id: user.id,
        isVerified: user.isVerified,
        requiresVerification: true,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    console.log('🔐 Login attempt for:', email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log('👤 User found:', user.email, 'Verified:', user.isVerified);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log('✅ Password valid');

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.',
      });
    }

    // Generate tokens regardless of verification status
    const { accessToken, refreshToken } = TokenService.generateTokens(user);

    console.log('🔑 Tokens generated successfully');

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Return user data with verification status
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      isVerified: user.isVerified,
      emailVerified: user.isVerified, // For compatibility
    };

    res.json({
      success: true,
      message: 'Login successful',
      user: userData, // Put user data at root level for easier access
      data: {
        user: userData,
        accessToken,
        refreshToken,
      },
      token: accessToken, // For compatibility with frontend
      requiresVerification: !user.isVerified,
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// server/src/controllers/authController.js - FINAL FIXED VERSION

export const verifyOTP = async (req, res) => {
  try {
    const validatedData = verifyOTPSchema.parse(req.body);
    const { email, otp } = validatedData;
    
    // FIXED: Map frontend type to database type consistently
    let type = validatedData.type || 'email_verification';
    if (type === 'email_verification') {
      type = 'verification'; // Use the same type as stored in DB
    }

    console.log('🔐 Verifying OTP for:', email, 'Mapped Type:', type, 'OTP:', otp);

    // FIXED: Simple query without complex aggregation + date filter
    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        email: email.toLowerCase(),
        type: type, // Use mapped type
        verified: false,
        expiresAt: {
          gt: new Date() // Only get non-expired OTPs
        }
      },
      orderBy: { 
        createdAt: 'desc' 
      },
    });

    console.log('🔍 OTP Record found:', otpRecord ? 'Yes' : 'No');
    
    if (otpRecord) {
      console.log('📝 OTP Record details:', {
        id: otpRecord.id,
        email: otpRecord.email,
        type: otpRecord.type,
        verified: otpRecord.verified,
        attempts: otpRecord.attempts,
        expiresAt: otpRecord.expiresAt,
        createdAt: otpRecord.createdAt,
        isExpired: otpRecord.expiresAt <= new Date()
      });
    }

    if (!otpRecord) {
      console.log('❌ No valid OTP record found for:', { 
        email: email.toLowerCase(), 
        type, 
        verified: false,
        expiresAt: 'greater than ' + new Date()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    // Check attempt limit
    const maxAttempts = parseInt(process.env.MAX_OTP_ATTEMPTS || '3');
    if (otpRecord.attempts >= maxAttempts) {
      console.log('❌ Too many attempts:', otpRecord.attempts, 'Max:', maxAttempts);
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please request a new OTP.',
      });
    }

    // Verify OTP
    console.log('🔍 Comparing OTP:', otp);
    const isOTPValid = await bcrypt.compare(otp.toString(), otpRecord.code);
    
    console.log('✅ OTP comparison result:', isOTPValid);
    
    if (!isOTPValid) {
      console.log('❌ Invalid OTP provided:', otp);
      
      // Increment attempts
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.',
        attemptsLeft: maxAttempts - (otpRecord.attempts + 1),
      });
    }

    console.log('✅ OTP verified successfully');

    // Mark OTP as verified
    await prisma.oTPCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    let updatedUser = null;
    let tokens = null;

    // If this is email verification, update user's verification status
    if (type === 'verification') { // Use the mapped type
      updatedUser = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { isVerified: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isVerified: true,
          isActive: true,
        },
      });

      console.log('✅ User email verified:', updatedUser.email);

      // CRITICAL FIX: Generate tokens after verification
      tokens = TokenService.generateTokens(updatedUser);
      
      // Update refresh token in database
      await prisma.user.update({
        where: { id: updatedUser.id },
        data: { refreshToken: tokens.refreshToken },
      });

      console.log('🔑 Tokens generated after verification');
    }

    // Clean up OTP codes for this email and type
    await prisma.oTPCode.deleteMany({
      where: { 
        email: email.toLowerCase(),
        type: type 
      },
    });

    const response = {
      success: true,
      message: type === 'verification'
        ? 'Email verified successfully!' 
        : 'OTP verified successfully!',
    };

    if (updatedUser) {
      response.user = updatedUser;
      response.data = { user: updatedUser };
      
      // CRITICAL: Include tokens in response
      if (tokens) {
        response.token = tokens.accessToken; // For compatibility
        response.accessToken = tokens.accessToken;
        response.refreshToken = tokens.refreshToken;
        console.log('🔑 Tokens included in response');
      }
    }

    res.json(response);
  } catch (error) {
    console.error('❌ Verify OTP error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const validatedData = resendOTPSchema.parse(req.body);
    const { email } = validatedData;
    
    // FIXED: Map frontend type to database type consistently
    let type = validatedData.type || 'email_verification';
    if (type === 'email_verification') {
      type = 'verification'; // Use the same type as stored in DB
    }

    console.log('🔄 Resending OTP to:', email, 'Mapped Type:', type);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.json({
        success: true,
        message: 'If an account with this email exists, a new verification code will be sent.',
      });
    }

    // For email verification, check if user is already verified
    if (type === 'verification' && user.isVerified) {
      return res.json({
        success: false,
        message: 'Email is already verified.',
      });
    }

    // Delete existing OTP codes for this email and type
    const deletedCount = await prisma.oTPCode.deleteMany({
      where: { 
        email: email.toLowerCase(), 
        type: type // Use mapped type
      },
    });
    
    console.log('🗑️ Deleted', deletedCount.count, 'existing OTP records');

    // Generate new OTP
    const otp = TokenService.generateOTP();
    const expiresAt = new Date(
      Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000
    );

    console.log('🔢 Generated OTP:', otp, 'Expires at:', expiresAt);

    // Create new OTP record with consistent type
    const otpRecord = await prisma.oTPCode.create({
      data: {
        email: email.toLowerCase(),
        code: await bcrypt.hash(otp.toString(), 10),
        type: type, // Use mapped type
        expiresAt,
        verified: false,
        attempts: 0,
      },
    });

    console.log('💾 OTP record created:', otpRecord.id, 'with type:', otpRecord.type);

    // Send OTP via email
    await EmailService.sendOTP(email, otp, type);

    console.log('📧 OTP resent to:', email);

    res.json({
      success: true,
      message: 'If an account with this email exists, a new OTP has been sent.',
    });
  } catch (error) {
    console.error('❌ Resend OTP error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const { email } = validatedData;

    console.log('🔄 Password reset request for:', email);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset code will be sent.',
      });
    }

    // Delete existing password reset OTP codes
    await prisma.oTPCode.deleteMany({
      where: { email: email.toLowerCase(), type: 'password_reset' },
    });

    // Generate new OTP
    const otp = TokenService.generateOTP();
    const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

    await prisma.oTPCode.create({
      data: {
        email: email.toLowerCase(),
        code: await bcrypt.hash(otp, 10),
        type: 'password_reset',
        expiresAt,
      },
    });

    await EmailService.sendOTP(email, otp, 'password_reset');

    console.log('📧 Password reset code sent to:', email);

    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset code will be sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const { email, otp, newPassword } = validatedData;

    console.log('🔄 Password reset for:', email);

    // Find valid OTP record
    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        email: email.toLowerCase(),
        type: 'password_reset',
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Check attempt limit
    if (otpRecord.attempts >= (process.env.MAX_OTP_ATTEMPTS || 3)) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please request a new OTP.',
      });
    }

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, otpRecord.code);
    
    if (!isOTPValid) {
      // Increment attempts
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        attemptsLeft: (process.env.MAX_OTP_ATTEMPTS || 3) - (otpRecord.attempts + 1),
      });
    }

    // Mark OTP as verified
    await prisma.oTPCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { 
        password: hashedPassword,
        refreshToken: null, // Invalidate all existing sessions
      },
    });

    // Clean up all OTP codes for this email
    await prisma.oTPCode.deleteMany({
      where: { email: email.toLowerCase() },
    });

    console.log('✅ Password reset successful for:', email);

    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    // Verify refresh token
    const decoded = TokenService.verifyRefreshToken(refreshToken);

    // Find user with this refresh token
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        refreshToken,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Check if user is still active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated',
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = TokenService.generateTokens(user);

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    // Clear refresh token
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    console.log('✅ User logged out:', userId);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isVerified: true,
        isActive: true,
        latitude: true,
        longitude: true,
        address: true,
        city: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, avatar, latitude, longitude, address, city } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (avatar) updateData.avatar = avatar;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (address) updateData.address = address;
    if (city) updateData.city = city;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isVerified: true,
        isActive: true,
        latitude: true,
        longitude: true,
        address: true,
        city: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password and invalidate all sessions
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedNewPassword,
        refreshToken: null,
      },
    });

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify password
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required to delete account',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Delete related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete OTP codes
      await tx.oTPCode.deleteMany({
        where: { email: user.email },
      });

      // Delete activity logs if they exist
      try {
        await tx.activityLog.deleteMany({
          where: { userId },
        });
      } catch (error) {
        // Ignore if table doesn't exist
      }

      // Delete user account
      await tx.user.delete({
        where: { id: userId },
      });
    });

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};