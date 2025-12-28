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

      // Create email verification token
      const { token: verifyToken } = await auth.createEmailVerificationToken({
        userId,
        email: email.toLowerCase()
      });

      // TODO: Send verification email
      console.log(`[DEV] Email verification token for ${email}: ${verifyToken}`);
      console.log(`[DEV] Verify URL: /auth/verify-email?token=${verifyToken}`);

      res.status(201).json({
        success: true,
        user: {
          id: userId,
          email: email.toLowerCase(),
          name: name || null,
          role: 'owner',
          emailVerified: false
        },
        org: {
          id: orgId,
          name: orgName,
          slug
        },
        message: 'Account created! Please check your email to verify your address.'
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

    // Store in dev_sessions table
    await db.query(
      `INSERT INTO dev_sessions (developer_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [dev.id, tokenHash, expiresAt, req.ip, req.get('User-Agent')]
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
// FORGOT PASSWORD (request reset)
// ============================================

router.post('/forgot-password', async (req, res) => {
  try {
    const { email, accountType = 'user' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.'
    };

    if (accountType === 'member') {
      // Look up member (need orgSlug too for members)
      const { orgSlug } = req.body;
      if (!orgSlug) {
        return res.json(successResponse); // Don't reveal org is required
      }

      const result = await db.query(
        `SELECT m.id, m.email FROM members m
         JOIN organizations o ON m.org_id = o.id
         WHERE m.email = $1 AND o.slug = $2`,
        [email.toLowerCase(), orgSlug]
      );

      if (result.rows.length > 0) {
        const member = result.rows[0];
        const { token } = await auth.createPasswordResetToken({ memberId: member.id });
        // TODO: Send email with reset link
        console.log(`[DEV] Password reset token for member ${email}: ${token}`);
      }
    } else {
      // Look up user (org admin/staff)
      const result = await db.query(
        'SELECT id, email FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        const { token } = await auth.createPasswordResetToken({ userId: user.id });
        // TODO: Send email with reset link
        console.log(`[DEV] Password reset token for user ${email}: ${token}`);
      }
    }

    res.json(successResponse);

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// ============================================
// RESET PASSWORD (with token)
// ============================================

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Validate token
    const tokenData = await auth.validatePasswordResetToken(token);

    if (!tokenData) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    // Hash new password
    const passwordHash = await auth.hashPassword(password);

    // Update password
    if (tokenData.user_id) {
      await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, tokenData.user_id]
      );
      // Invalidate all sessions for security
      await auth.deleteAllUserSessions(tokenData.user_id);
    } else if (tokenData.member_id) {
      await db.query(
        'UPDATE members SET password_hash = $1 WHERE id = $2',
        [passwordHash, tokenData.member_id]
      );
      await auth.deleteAllMemberSessions(tokenData.member_id);
    }

    // Mark token as used
    await auth.usePasswordResetToken(token);

    res.json({ success: true, message: 'Password has been reset. Please log in.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============================================
// VERIFY EMAIL
// ============================================

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const success = await auth.markEmailVerified(token);

    if (!success) {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }

    // Redirect to login with success message
    res.redirect('/login.html?verified=1');

  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// ============================================
// RESEND VERIFICATION EMAIL
// ============================================

router.post('/resend-verification', async (req, res) => {
  try {
    const token = req.cookies.session;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const session = await auth.validateSession(token);

    if (!session || session.type !== 'user') {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Get user email
    const result = await db.query(
      'SELECT id, email, email_verified FROM users WHERE id = $1',
      [session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Create new verification token
    const { token: verifyToken } = await auth.createEmailVerificationToken({
      userId: user.id,
      email: user.email
    });

    // TODO: Send verification email
    console.log(`[DEV] Email verification token for ${user.email}: ${verifyToken}`);

    res.json({ success: true, message: 'Verification email sent' });

  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Failed to send verification email' });
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
