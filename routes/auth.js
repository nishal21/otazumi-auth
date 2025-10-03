import express from 'express';
import { AuthService } from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
import {
  validateRequest,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  deleteAccountValidation,
  syncDataValidation
} from '../middleware/validate.js';
import {
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter
} from '../middleware/rateLimit.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAccountDeletionEmail
} from '../services/emailService.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authLimiter,
  registerValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { email, username, password, avatar } = req.body;

      const result = await AuthService.register({
        email,
        username,
        password,
        avatar
      });

      // Send verification email
      await sendVerificationEmail(
        result.user.email,
        result.user.username,
        result.verificationToken
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        user: result.user,
        token: result.token
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  authLimiter,
  loginValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      res.json({
        success: true,
        message: 'Login successful',
        user: result.user,
        token: result.token
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * GET /api/auth/profile
 * Get user profile
 */
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await AuthService.getUserById(req.userId);

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put(
  '/profile',
  authenticate,
  updateProfileValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const updates = req.body;
      const user = await AuthService.updateProfile(req.userId, updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/auth/password
 * Change password
 */
router.put(
  '/password',
  authenticate,
  changePasswordValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      await AuthService.changePassword(
        req.userId,
        currentPassword,
        newPassword
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  forgotPasswordValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { email } = req.body;

      const result = await AuthService.requestPasswordReset(email);

      // Send password reset email if user exists
      if (result.resetToken) {
        const user = await AuthService.getUserById(result.userId);
        await sendPasswordResetEmail(
          user.email,
          user.username,
          result.resetToken
        );
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post(
  '/reset-password',
  resetPasswordValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;

      await AuthService.resetPassword(token, newPassword);

      res.json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post(
  '/verify-email',
  verifyEmailValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { token } = req.body;

      await AuthService.verifyEmail(token);

      // Send welcome email
      const decoded = await import('../utils/jwt.js');
      // Note: In production, extract user info from token or fetch from DB

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post(
  '/resend-verification',
  authenticate,
  emailVerificationLimiter,
  async (req, res, next) => {
    try {
      const result = await AuthService.resendVerificationEmail(req.userId);

      const user = await AuthService.getUserById(req.userId);
      await sendVerificationEmail(
        user.email,
        user.username,
        result.verificationToken
      );

      res.json({
        success: true,
        message: 'Verification email sent'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/auth/account
 * Delete user account
 */
router.delete(
  '/account',
  authenticate,
  deleteAccountValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { password } = req.body;

      const user = await AuthService.getUserById(req.userId);

      await AuthService.deleteAccount(req.userId, password);

      // Send account deletion confirmation
      await sendAccountDeletionEmail(user.email, user.username);

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/sync
 * Sync user data (favorites, watchlist, history)
 */
router.post(
  '/sync',
  authenticate,
  syncDataValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const syncData = req.body;

      const result = await AuthService.syncUserData(req.userId, syncData);

      res.json({
        success: true,
        message: 'Data synced successfully',
        synced: result.synced
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/data
 * Fetch user data
 */
router.get('/data', authenticate, async (req, res, next) => {
  try {
    const data = await AuthService.fetchUserData(req.userId);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

export default router;
