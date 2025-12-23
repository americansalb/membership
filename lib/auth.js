const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');

const SALT_ROUNDS = 12;
const SESSION_EXPIRY_DAYS = 30;

// ============================================
// PASSWORD HASHING
// ============================================

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ============================================
// SESSION MANAGEMENT
// ============================================

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createSession({ userId, memberId, ipAddress, userAgent }) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await db.query(
    `INSERT INTO sessions (user_id, member_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId || null, memberId || null, tokenHash, expiresAt, ipAddress, userAgent]
  );

  return { token, expiresAt };
}

async function validateSession(token) {
  if (!token) return null;

  const tokenHash = hashToken(token);

  const result = await db.query(
    `SELECT s.*, u.org_id, u.role, u.email as user_email, u.name as user_name,
            m.org_id as member_org_id, m.email as member_email, m.first_name, m.last_name
     FROM sessions s
     LEFT JOIN users u ON s.user_id = u.id
     LEFT JOIN members m ON s.member_id = m.id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [tokenHash]
  );

  if (result.rows.length === 0) return null;

  const session = result.rows[0];

  // Return user info based on session type
  if (session.user_id) {
    return {
      type: 'user',
      sessionId: session.id,
      userId: session.user_id,
      orgId: session.org_id,
      email: session.user_email,
      name: session.user_name,
      role: session.role
    };
  } else if (session.member_id) {
    return {
      type: 'member',
      sessionId: session.id,
      memberId: session.member_id,
      orgId: session.member_org_id,
      email: session.member_email,
      name: `${session.first_name || ''} ${session.last_name || ''}`.trim()
    };
  }

  return null;
}

async function deleteSession(token) {
  const tokenHash = hashToken(token);
  await db.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
}

async function deleteAllUserSessions(userId) {
  await db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
}

async function deleteAllMemberSessions(memberId) {
  await db.query('DELETE FROM sessions WHERE member_id = $1', [memberId]);
}

// Clean up expired sessions (run periodically)
async function cleanupExpiredSessions() {
  await db.query('DELETE FROM sessions WHERE expires_at < NOW()');
}

// ============================================
// DEVELOPER AUTH
// ============================================

async function validateDevSession(token) {
  if (!token) return null;

  const tokenHash = hashToken(token);

  // Dev sessions stored in a separate table or with a flag
  // For simplicity, we'll use a separate query pattern
  const result = await db.query(
    `SELECT d.*
     FROM developers d
     JOIN sessions s ON s.token_hash = $1
     WHERE s.expires_at > NOW()
       AND s.user_id IS NULL
       AND s.member_id IS NULL`,
    [tokenHash]
  );

  // Actually, let's add developer_id to sessions
  // For now, check if developer exists with matching session
  return null; // Will implement properly with dev sessions
}

// ============================================
// SLUG GENERATION
// ============================================

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

async function generateUniqueSlug(name) {
  let slug = generateSlug(name);
  let suffix = '';
  let counter = 0;

  while (true) {
    const result = await db.query(
      'SELECT 1 FROM organizations WHERE slug = $1',
      [slug + suffix]
    );

    if (result.rows.length === 0) {
      return slug + suffix;
    }

    counter++;
    suffix = `-${counter}`;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
  createSession,
  validateSession,
  deleteSession,
  deleteAllUserSessions,
  deleteAllMemberSessions,
  cleanupExpiredSessions,
  generateSlug,
  generateUniqueSlug
};
