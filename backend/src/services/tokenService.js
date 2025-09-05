// server/src/services/tokenService.js - FIXED VERSION
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class TokenService {
  static generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔢 Generated OTP:', otp);
    return otp;
  }

  static generateTokens(user) {
    // FIXED: Add runtime checks for required environment variables
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

    console.log('🔍 JWT_SECRET exists:', !!JWT_SECRET);
    console.log('🔍 JWT_REFRESH_SECRET exists:', !!JWT_REFRESH_SECRET);

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set. Please add it to your .env file.');
    }

    if (!JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set. Please add it to your .env file.');
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    try {
      const accessToken = jwt.sign(
        payload,
        JWT_SECRET,
        { 
          expiresIn: process.env.JWT_EXPIRES_IN || '15m',
          issuer: 'roadside-assistance-api',
          audience: 'roadside-assistance-client',
        }
      );

      const refreshToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_REFRESH_SECRET,
        { 
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
          issuer: 'roadside-assistance-api',
          audience: 'roadside-assistance-client',
        }
      );

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('❌ Token generation failed:', error);
      throw error;
    }
  }

  static verifyAccessToken(token) {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'roadside-assistance-api',
        audience: 'roadside-assistance-client',
      });
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token) {
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
    if (!JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }

    try {
      return jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'roadside-assistance-api',
        audience: 'roadside-assistance-client',
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  static generatePasswordResetToken(userId) {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    return jwt.sign(
      { userId, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  static verifyPasswordResetToken(token) {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid password reset token');
    }
  }
}

export default TokenService;
