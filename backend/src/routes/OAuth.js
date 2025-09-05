import express from 'express';
import passport from 'passport';
import OAuthController from '../controllers/OAuthController.js';
import { authenticateJWT } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Google OAuth routes
router.get('/google',
  (req, res, next) => {
    // Log the redirect URL for debugging
    console.log('Google OAuth initiated, redirect URL will be:', 
      process.env.NODE_ENV === 'production' 
        ? `${process.env.SERVER_URL}/auth/oauth/google/callback`
        : 'http://localhost:5000/auth/oauth/google/callback'
    );
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get('/google/callback',
  (req, res, next) => {
    console.log('Google callback received with query:', req.query);
    next();
  },
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`,
    session: false,
  }),
  OAuthController.googleCallback
);

// GitHub OAuth routes
router.get('/github',
  (req, res, next) => {
    // Log the redirect URL for debugging
    console.log('GitHub OAuth initiated, redirect URL will be:', 
      process.env.NODE_ENV === 'production'
        ? `${process.env.SERVER_URL}/auth/oauth/github/callback`
        : 'http://localhost:5000/auth/oauth/github/callback'
    );
    next();
  },
  passport.authenticate('github', {
    scope: ['user:email'],
    session: false,
  })
);

router.get('/github/callback',
  (req, res, next) => {
    console.log('GitHub callback received with query:', req.query);
    next();
  },
  passport.authenticate('github', {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`,
    session: false,
  }),
  OAuthController.githubCallback
);

// Unlink OAuth provider routes
router.delete('/google/unlink',
  authLimiter,
  authenticateJWT,
  (req, res, next) => {
    req.params.provider = 'google';
    next();
  },
  OAuthController.unlinkOAuth
);

router.delete('/github/unlink',
  authLimiter,
  authenticateJWT,
  (req, res, next) => {
    req.params.provider = 'github';
    next();
  },
  OAuthController.unlinkOAuth
);

export default router;