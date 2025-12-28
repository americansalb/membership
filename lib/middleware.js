const auth = require('./auth');
const db = require('../db');

// ============================================
// AUTH MIDDLEWARE
// ============================================

// Require authenticated user (admin/staff/owner)
function requireUser(req, res, next) {
  const token = req.cookies.session;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  auth.validateSession(token)
    .then(session => {
      if (!session || session.type !== 'user') {
        res.clearCookie('session');
        return res.status(401).json({ error: 'Invalid session' });
      }

      req.user = session;
      next();
    })
    .catch(err => {
      console.error('Auth middleware error:', err);
      res.status(500).json({ error: 'Authentication failed' });
    });
}

// Require authenticated member (portal)
function requireMember(req, res, next) {
  const token = req.cookies.session;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  auth.validateSession(token)
    .then(session => {
      if (!session || session.type !== 'member') {
        res.clearCookie('session');
        return res.status(401).json({ error: 'Invalid session' });
      }

      req.member = session;
      next();
    })
    .catch(err => {
      console.error('Auth middleware error:', err);
      res.status(500).json({ error: 'Authentication failed' });
    });
}

// Require owner role
function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
}

// Require owner or admin role
function requireAdmin(req, res, next) {
  if (!req.user || !['owner', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Require developer (platform level)
async function requireDev(req, res, next) {
  const devToken = req.cookies.dev_session;
  const devId = req.cookies.dev_id;

  if (!devToken || !devId) {
    return res.status(401).json({ error: 'Developer authentication required' });
  }

  try {
    const tokenHash = auth.hashToken(devToken);

    // Validate session exists in dev_sessions and developer is active
    const sessionResult = await db.query(
      `SELECT developer_id FROM dev_sessions
       WHERE token_hash = $1
       AND expires_at > NOW()`,
      [tokenHash]
    );

    if (sessionResult.rows.length === 0) {
      res.clearCookie('dev_session');
      res.clearCookie('dev_id');
      return res.status(401).json({ error: 'Session expired' });
    }

    const devResult = await db.query(
      'SELECT id, email, name FROM developers WHERE id = $1 AND is_active = true',
      [devId]
    );

    if (devResult.rows.length === 0) {
      res.clearCookie('dev_session');
      res.clearCookie('dev_id');
      return res.status(401).json({ error: 'Developer not found' });
    }

    req.developer = devResult.rows[0];
    next();

  } catch (err) {
    console.error('Dev auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Optional auth - populates req.user/req.member if logged in, continues otherwise
function optionalAuth(req, res, next) {
  const token = req.cookies.session;

  if (!token) {
    return next();
  }

  auth.validateSession(token)
    .then(session => {
      if (session) {
        if (session.type === 'user') {
          req.user = session;
        } else if (session.type === 'member') {
          req.member = session;
        }
      }
      next();
    })
    .catch(() => next());
}

// ============================================
// SEAT LIMIT CHECK
// ============================================

async function checkSeatLimit(orgId, role) {
  // Get org plan limits
  const orgResult = await db.query(
    'SELECT plan, admin_seat_limit, staff_seat_limit FROM organizations WHERE id = $1',
    [orgId]
  );

  if (orgResult.rows.length === 0) {
    throw new Error('Organization not found');
  }

  const org = orgResult.rows[0];

  // Enterprise has unlimited seats (-1)
  if (org.plan === 'enterprise') {
    return true;
  }

  // Count current users by role
  const countResult = await db.query(
    'SELECT role, COUNT(*) as count FROM users WHERE org_id = $1 GROUP BY role',
    [orgId]
  );

  const counts = {};
  countResult.rows.forEach(r => {
    counts[r.role] = parseInt(r.count);
  });

  if (role === 'admin') {
    const current = counts.admin || 0;
    const limit = org.admin_seat_limit || 0;
    if (current >= limit) {
      throw new Error(`Admin seat limit reached (${limit}). Upgrade to add more admins.`);
    }
  } else if (role === 'staff') {
    const current = counts.staff || 0;
    const limit = org.staff_seat_limit || 0;
    if (current >= limit) {
      throw new Error(`Staff seat limit reached (${limit}). Upgrade to add more staff.`);
    }
  }

  return true;
}

module.exports = {
  requireUser,
  requireMember,
  requireOwner,
  requireAdmin,
  requireDev,
  optionalAuth,
  checkSeatLimit
};
