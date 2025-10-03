import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { users, emailVerificationTokens, passwordResetTokens, favorites, watchlist, watchHistory, dailySignups } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Generate a secure random token
 */
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate JWT token
 */
function generateJWT(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * AuthService - Handles all authentication operations
 */
export class AuthService {
  /**
   * Check daily signup limit
   */
  static async checkDailySignupLimit() {
    const today = new Date().toISOString().split('T')[0];
    const limit = parseInt(process.env.DAILY_SIGNUP_LIMIT || '300');

    try {
      const [signupRecord] = await db
        .select()
        .from(dailySignups)
        .where(eq(dailySignups.date, today))
        .limit(1);

      if (!signupRecord) {
        // Create new record for today
        await db.insert(dailySignups).values({ date: today, count: 0 });
        return { allowed: true, count: 0, limit };
      }

      if (signupRecord.count >= limit) {
        return {
          allowed: false,
          count: signupRecord.count,
          limit,
          message: 'Daily signup limit reached. Please try again tomorrow.'
        };
      }

      return { allowed: true, count: signupRecord.count, limit };
    } catch (error) {
      console.error('Error checking signup limit:', error);
      return { allowed: true, count: 0, limit }; // Allow on error
    }
  }

  /**
   * Increment daily signup counter
   */
  static async incrementSignupCount() {
    const today = new Date().toISOString().split('T')[0];

    try {
      const [record] = await db
        .select()
        .from(dailySignups)
        .where(eq(dailySignups.date, today))
        .limit(1);

      if (record) {
        await db
          .update(dailySignups)
          .set({ count: record.count + 1 })
          .where(eq(dailySignups.id, record.id));
      } else {
        await db.insert(dailySignups).values({ date: today, count: 1 });
      }
    } catch (error) {
      console.error('Error incrementing signup count:', error);
    }
  }

  /**
   * Register new user
   */
  static async register(userData) {
    const { email, username, password, avatar } = userData;

    // Check daily signup limit
    const limitCheck = await this.checkDailySignupLimit();
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.message);
    }

    // Check if user exists
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail.length > 0) {
      throw new Error('User already exists with this email');
    }

    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUsername.length > 0) {
      throw new Error('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        username,
        password: hashedPassword,
        avatar: avatar || 'avatar_1',
        isVerified: false,
        preferences: {}
      })
      .returning();

    // Generate verification token
    const verificationToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(emailVerificationTokens).values({
      userId: newUser.id,
      token: verificationToken,
      expiresAt,
      used: false
    });

    // Increment signup counter
    await this.incrementSignupCount();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    // Generate JWT
    const token = generateJWT(newUser.id);

    return {
      user: userWithoutPassword,
      token,
      verificationToken // For email service
    };
  }

  /**
   * Login user
   */
  static async login(email, password) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate JWT
    const token = generateJWT(user.id);

    return { user: userWithoutPassword, token };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, updates) {
    // Don't allow email or password updates via this method
    delete updates.email;
    delete updates.password;

    // Check if username is being updated and if it's taken
    if (updates.username) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, updates.username))
        .limit(1);

      if (existingUser && existingUser.id !== userId) {
        throw new Error('Username already taken');
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Change password
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Don't reveal if email exists
      return {
        success: true,
        message: 'If an account exists, a reset link will be sent.'
      };
    }

    const resetToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: resetToken,
      expiresAt,
      used: false
    });

    return {
      success: true,
      message: 'If an account exists, a reset link will be sent.',
      resetToken, // For email service
      userId: user.id
    };
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token, newPassword) {
    const [tokenRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!tokenRecord) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, tokenRecord.userId));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenRecord.id));

    return { success: true, message: 'Password reset successful' };
  }

  /**
   * Verify email
   */
  static async verifyEmail(token) {
    const [tokenRecord] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.token, token),
          eq(emailVerificationTokens.used, false),
          gt(emailVerificationTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!tokenRecord) {
      throw new Error('Invalid or expired verification token');
    }

    await db
      .update(users)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(users.id, tokenRecord.userId));

    // Mark token as used
    await db
      .update(emailVerificationTokens)
      .set({ used: true })
      .where(eq(emailVerificationTokens.id, tokenRecord.id));

    return { success: true, message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(userId) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isVerified) {
      throw new Error('Email already verified');
    }

    // Invalidate old tokens
    await db
      .update(emailVerificationTokens)
      .set({ used: true })
      .where(eq(emailVerificationTokens.userId, userId));

    // Create new token
    const verificationToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(emailVerificationTokens).values({
      userId,
      token: verificationToken,
      expiresAt,
      used: false
    });

    return {
      success: true,
      message: 'Verification email sent',
      verificationToken
    };
  }

  /**
   * Delete account
   */
  static async deleteAccount(userId, password) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Delete user data (cascades due to foreign keys)
    await db.delete(users).where(eq(users.id, userId));

    return { success: true, message: 'Account deleted successfully' };
  }

  /**
   * Sync user data (favorites, watchlist, history)
   */
  static async syncUserData(userId, syncData) {
    const results = {};

    // Sync favorites
    if (syncData.favorites && Array.isArray(syncData.favorites)) {
      // Clear existing
      await db.delete(favorites).where(eq(favorites.userId, userId));
      // Insert new
      if (syncData.favorites.length > 0) {
        await db.insert(favorites).values(
          syncData.favorites.map(fav => ({
            userId,
            animeId: fav.animeId || fav.id,
            animeData: fav
          }))
        );
      }
      results.favorites = syncData.favorites.length;
    }

    // Sync watchlist
    if (syncData.watchlist && Array.isArray(syncData.watchlist)) {
      await db.delete(watchlist).where(eq(watchlist.userId, userId));
      if (syncData.watchlist.length > 0) {
        await db.insert(watchlist).values(
          syncData.watchlist.map(item => ({
            userId,
            animeId: item.animeId || item.id,
            status: item.status || 'watching',
            animeData: item
          }))
        );
      }
      results.watchlist = syncData.watchlist.length;
    }

    // Sync watch history
    if (syncData.watchHistory && Array.isArray(syncData.watchHistory)) {
      await db.delete(watchHistory).where(eq(watchHistory.userId, userId));
      if (syncData.watchHistory.length > 0) {
        await db.insert(watchHistory).values(
          syncData.watchHistory.map(item => ({
            userId,
            animeId: item.animeId,
            episodeId: item.episodeId,
            episodeNumber: item.episodeNumber,
            progress: item.progress || 0,
            duration: item.duration || 0,
            completed: item.completed || false,
            watchedAt: item.watchedAt ? new Date(item.watchedAt) : new Date()
          }))
        );
      }
      results.watchHistory = syncData.watchHistory.length;
    }

    return { success: true, synced: results };
  }

  /**
   * Fetch user data
   */
  static async fetchUserData(userId) {
    const userFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));

    const userWatchlist = await db
      .select()
      .from(watchlist)
      .where(eq(watchlist.userId, userId));

    const userWatchHistory = await db
      .select()
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId));

    return {
      favorites: userFavorites.map(f => f.animeData),
      watchlist: userWatchlist.map(w => ({ ...w.animeData, status: w.status })),
      watchHistory: userWatchHistory
    };
  }
}
