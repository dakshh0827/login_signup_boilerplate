import express from 'express';
import {
  signup,
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getProfile,
  changePassword,
  deleteAccount,
} from '../controllers/authController.js';

import {
  authenticateJWT,
  authenticateToken,
  requireVerified,
} from '../middlewares/auth.js';

import {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
} from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/verify-email', authLimiter, verifyOTP);
router.post('/resend-email', otpLimiter, resendOTP);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/refresh-token', authLimiter, refreshToken);

router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, requireVerified, getProfile);
router.post('/change-password', authenticateToken, requireVerified, changePassword);
router.delete('/account', authenticateToken, requireVerified, deleteAccount);

export default router;
