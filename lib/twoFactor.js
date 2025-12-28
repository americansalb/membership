/**
 * Two-Factor Authentication (2FA)
 *
 * Implements TOTP (Time-based One-Time Password) using:
 * - speakeasy for secret generation and verification
 * - qrcode for QR code generation
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

// App name for authenticator apps
const APP_NAME = 'VillageMembers';

// Number of backup codes to generate
const BACKUP_CODE_COUNT = 10;

// Backup code length
const BACKUP_CODE_LENGTH = 8;

/**
 * Generate a new TOTP secret for a member
 */
function generateSecret(memberEmail, orgName) {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${orgName})`,
    issuer: APP_NAME,
    length: 32
  });

  return {
    ascii: secret.ascii,
    hex: secret.hex,
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url
  };
}

/**
 * Generate QR code as data URL
 */
async function generateQRCode(otpauthUrl) {
  try {
    const dataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 2,
      width: 256,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (err) {
    console.error('QR code generation error:', err);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a TOTP token
 */
function verifyToken(secret, token) {
  try {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: token.replace(/\s/g, ''), // Remove spaces
      window: 2 // Allow 2 time steps (60 seconds) variance
    });
    return verified;
  } catch (err) {
    console.error('Token verification error:', err);
    return false;
  }
}

/**
 * Generate current TOTP token (for testing)
 */
function generateCurrentToken(secret) {
  return speakeasy.totp({
    secret,
    encoding: 'base32'
  });
}

/**
 * Generate backup codes
 * Returns array of plaintext codes (for display) and hashed codes (for storage)
 */
function generateBackupCodes() {
  const codes = [];
  const hashedCodes = [];

  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // Generate random code
    const code = crypto
      .randomBytes(BACKUP_CODE_LENGTH / 2)
      .toString('hex')
      .toUpperCase();

    // Format as XXXX-XXXX
    const formattedCode = `${code.slice(0, 4)}-${code.slice(4)}`;

    codes.push(formattedCode);

    // Hash for storage
    const hash = crypto
      .createHash('sha256')
      .update(formattedCode)
      .digest('hex');

    hashedCodes.push({
      hash,
      used: false
    });
  }

  return { codes, hashedCodes };
}

/**
 * Verify a backup code
 * Returns { valid: boolean, remainingCodes: array } if valid
 */
function verifyBackupCode(code, storedCodes) {
  if (!code || !storedCodes || !Array.isArray(storedCodes)) {
    return { valid: false };
  }

  // Clean up input
  const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const formattedCode = cleanCode.length === 8
    ? `${cleanCode.slice(0, 4)}-${cleanCode.slice(4)}`
    : code.toUpperCase();

  // Hash the input
  const inputHash = crypto
    .createHash('sha256')
    .update(formattedCode)
    .digest('hex');

  // Find matching unused code
  const codeIndex = storedCodes.findIndex(
    c => c.hash === inputHash && !c.used
  );

  if (codeIndex === -1) {
    return { valid: false };
  }

  // Mark as used and return remaining codes
  const remainingCodes = storedCodes.map((c, i) => ({
    ...c,
    used: i === codeIndex ? true : c.used
  }));

  return {
    valid: true,
    remainingCodes,
    remainingCount: remainingCodes.filter(c => !c.used).length
  };
}

/**
 * Check if a member has 2FA enabled
 */
function is2FAEnabled(member) {
  return member && member.totp_enabled === true && member.totp_secret;
}

/**
 * Count remaining backup codes
 */
function countRemainingBackupCodes(storedCodes) {
  if (!storedCodes || !Array.isArray(storedCodes)) return 0;
  return storedCodes.filter(c => !c.used).length;
}

/**
 * Setup flow:
 * 1. generateSecret() - Create secret and get otpauth URL
 * 2. generateQRCode() - Create QR for user to scan
 * 3. User scans and enters code
 * 4. verifyToken() - Verify the code matches
 * 5. generateBackupCodes() - Generate backup codes
 * 6. Store secret and hashed backup codes in DB
 * 7. Set totp_enabled = true
 */

/**
 * Login flow with 2FA:
 * 1. User enters password
 * 2. Check if 2FA enabled
 * 3. If yes, prompt for TOTP or backup code
 * 4. verifyToken() or verifyBackupCode()
 * 5. If valid, proceed with login
 */

module.exports = {
  generateSecret,
  generateQRCode,
  verifyToken,
  generateCurrentToken,
  generateBackupCodes,
  verifyBackupCode,
  is2FAEnabled,
  countRemainingBackupCodes
};
