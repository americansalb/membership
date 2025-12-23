const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../lib/auth');

// Cookie settings
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// ============================================
// ORG SIGNUP (creates org + owner)
// ============================================

router.post('/signup', async (req, res) => {
  try {
    const { orgName, email, password, name } = req.body;

    // Validation
    if (!orgName || !email || !password) {
      return res.status(400).json({ error: 'Organization name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if email already exists
    const existingUser = await db.query(
      'SELECT 1 FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Generate unique slug
    const slug = await auth.generateUniqueSlug(orgName);

    // Hash password
    const passwordHash = await auth.hashPassword(password);

    // Create org and owner in transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Create organization
      const orgResult = await client.query(
        `INSERT INTO organizations (name, slug, email, admin_seat_limit, staff_seat_limit)
         VALUES ($1, $2, $3, 0, 0)
         RETURNING id`,
        [orgName, slug, email.toLowerCase()]
      );
      const orgId = orgResult.rows[0].id;

      // Create owner user
      const userResult = await client.query(
        `INSERT INTO users (org_id, email, password_hash, name, role, email_verified)
         VALUES ($1, $2, $3, $4, 'owner', false)
         RETURNING id`,
        [orgId, email.toLowerCase(), passwordHash, name || null]
      );
      const userId = userResult.rows[0].id;

      await client.query('COMMIT');

      // Create session
      const { token, expiresAt } = await auth.createSession({
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Set cookie
      res.cookie('session', token, COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        user: {
          id: userId,
          email: email.toLowerCase(),
          name: name || null,
          role: 'owner'
        },
        org: {
          id: orgId,
          name: orgName,
          slug
        }
      });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// ============================================
// USER LOGIN (org admins/staff)
// ============================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await db.query(
      `SELECT u.*, o.name as org_name, o.slug as org_slug
       FROM users u
       JOIN organizations o ON u.org_id = o.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const valid = await auth.verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Create session
    const { token, expiresAt } = await auth.createSession({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Set cookie
    res.cookie('session', token, COOKIE_OPTIONS);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      org: {
        id: user.org_id,
        name: user.org_name,
        slug: user.org_slug
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// MEMBER LOGIN (portal access)
// ============================================

router.post('/member/login', async (req, res) => {
  try {
    const { email, password, orgSlug } = req.body;

    if (!email || !password || !orgSlug) {
      return res.status(400).json({ error: 'Email, password, and organization are required' });
    }

    // Find member
    const result = await db.query(
      `SELECT m.*, o.name as org_name, o.slug as org_slug
       FROM members m
       JOIN organizations o ON m.org_id = o.id
       WHERE m.email = $1 AND o.slug = $2 AND m.password_hash IS NOT NULL`,
      [email.toLowerCase(), orgSlug]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const member = result.rows[0];

    // Verify password
    const valid = await auth.verifyPassword(password, member.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check membership status
    if (member.status !== 'active') {
      return res.status(403).json({ error: 'Your membership is not active' });
    }

    // Update last login
    await db.query(
      'UPDATE members SET last_login_at = NOW() WHERE id = $1',
      [member.id]
    );

    // Create session
    const { token, expiresAt } = await auth.createSession({
      memberId: member.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Set cookie
    res.cookie('session', token, COOKIE_OPTIONS);

    res.json({
      success: true,
      member: {
        id: member.id,
        email: member.email,
        name: `${member.first_name || ''} ${member.last_name || ''}`.trim(),
        status: member.status
      },
      org: {
        id: member.org_id,
        name: member.org_name,
        slug: member.org_slug
      }
    });

  } catch (err) {
    console.error('Member login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// DEVELOPER LOGIN (platform access)
// ============================================

router.post('/dev/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find developer
    const result = await db.query(
      'SELECT * FROM developers WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const dev = result.rows[0];

    // Verify password
    const valid = await auth.verifyPassword(password, dev.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db.query(
      'UPDATE developers SET last_login_at = NOW() WHERE id = $1',
      [dev.id]
    );

    // Create a special dev session token
    const token = auth.generateToken();
    const tokenHash = auth.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Dev sessions expire faster

    // Store in a simple way - we'll use the sessions table with null user/member
    await db.query(
      `INSERT INTO sessions (token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [tokenHash, expiresAt, req.ip, req.get('User-Agent')]
    );

    // Store dev id in a separate cookie or return it
    res.cookie('dev_session', token, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('dev_id', dev.id, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      success: true,
      developer: {
        id: dev.id,
        email: dev.email,
        name: dev.name
      }
    });

  } catch (err) {
    console.error('Dev login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// LOGOUT
// ============================================

router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies.session || req.cookies.dev_session;

    if (token) {
      await auth.deleteSession(token);
    }

    res.clearCookie('session');
    res.clearCookie('dev_session');
    res.clearCookie('dev_id');

    res.json({ success: true });

  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================
// GET CURRENT SESSION
// ============================================

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.session;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await auth.validateSession(token);

    if (!session) {
      res.clearCookie('session');
      return res.status(401).json({ error: 'Session expired' });
    }

    // Get full org info
    const orgResult = await db.query(
      'SELECT id, name, slug, plan FROM organizations WHERE id = $1',
      [session.orgId]
    );

    res.json({
      ...session,
      org: orgResult.rows[0] || null
    });

  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

module.exports = router;
