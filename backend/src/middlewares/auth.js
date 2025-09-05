// server/src/middlewares/auth.js - FIXED VERSION
import passport from 'passport';
import TokenService from '../services/tokenService.js';

// JWT Authentication middleware
const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Authentication error',
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Optional JWT Authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

// Require verified email
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      requiresVerification: true,
    });
  }

  next();
};

// Require specific provider (for unlinking OAuth)
const requireProvider = (provider) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.provider !== provider) {
    return res.status(403).json({
      success: false,
      message: `This endpoint requires ${provider} authentication`,
    });
  }

  next();
};

export {
  authenticateJWT,
  authenticateJWT as authenticateToken,
  optionalAuth,
  requireVerified,
  requireProvider,
};