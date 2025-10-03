import crypto from 'crypto';

/**
 * Generate a secure random token
 * @param {number} length - Length in bytes (default: 32)
 * @returns {string} Hex string token
 */
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a random numeric code
 * @param {number} digits - Number of digits (default: 6)
 * @returns {string} Numeric code
 */
export function generateNumericCode(digits = 6) {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

/**
 * Hash a string using SHA256
 * @param {string} data - Data to hash
 * @returns {string} Hashed string
 */
export function hashString(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a random UUID
 * @returns {string} UUID string
 */
export function generateUUID() {
  return crypto.randomUUID();
}
