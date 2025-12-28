const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireUser, requireAdmin } = require('../lib/middleware');
const auth = require('../lib/auth');

// ============================================
// ACCESS CHECK (for LMS integration)
// ============================================

router.get('/access/check', async (req, res) => {
  try {
    const { type, id, email, orgSlug } = req.query;

    if (!type || !id || !email || !orgSlug) {
      return res.status(400).json({
        hasAccess: false,
        error: 'Missing required parameters: type, id, email, orgSlug'
      });
    }

    // Find member
    const memberResult = await db.query(
      `SELECT m.*, t.name as tier_name
       FROM members m
       JOIN organizations o ON m.org_id = o.id
       LEFT JOIN tiers t ON m.tier_id = t.id
       WHERE m.email = $1 AND o.slug = $2`,
      [email.toLowerCase(), orgSlug]
    );

    if (memberResult.rows.length === 0) {
      return res.json({ hasAccess: false, reason: 'Member not found' });
    }

    const member = memberResult.rows[0];

    // Check membership status
    if (member.status !== 'active') {
      return res.json({ hasAccess: false, reason: 'Membership not active' });
    }

    // Check if member's tier has access to this resource
    const accessResult = await db.query(
      `SELECT 1 FROM tier_resources tr
       JOIN resources r ON tr.resource_id = r.id
       WHERE tr.tier_id = $1 AND r.type = $2 AND r.external_id = $3`,
      [member.tier_id, type, id]
    );

    if (accessResult.rows.length === 0) {
      // Check if resource is public
      const publicResult = await db.query(
        `SELECT 1 FROM resources
         WHERE org_id = $1 AND type = $2 AND external_id = $3 AND is_public = true`,
        [member.org_id, type, id]
      );

      if (publicResult.rows.length === 0) {
        return res.json({ hasAccess: false, reason: 'Resource not available for tier' });
      }
    }

    res.json({
      hasAccess: true,
      member: {
        id: member.id,
        email: member.email,
        name: `${member.first_name || ''} ${member.last_name || ''}`.trim(),
        tier: member.tier_name
      }
    });

  } catch (err) {
    console.error('Access check error:', err);
    res.status(500).json({ hasAccess: false, error: 'Access check failed' });
  }
});

// ============================================
// MEMBERS CRUD
// ============================================

// List members
router.get('/members', requireUser, async (req, res) => {
  try {
    const { status, tier_id, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT m.*, t.name as tier_name
      FROM members m
      LEFT JOIN tiers t ON m.tier_id = t.id
      WHERE m.org_id = $1
    `;
    const params = [req.user.orgId];
    let paramIndex = 2;

    if (status) {
      query += ` AND m.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (tier_id) {
      query += ` AND m.tier_id = $${paramIndex}`;
      params.push(tier_id);
      paramIndex++;
    }

    if (search) {
      query += ` AND (m.email ILIKE $${paramIndex} OR m.first_name ILIKE $${paramIndex} OR m.last_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await db.query(
      query.replace('SELECT m.*, t.name as tier_name', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      members: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('List members error:', err);
    res.status(500).json({ error: 'Failed to list members' });
  }
});

// Get single member (basic)
router.get('/members/:id', requireUser, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT m.*, t.name as tier_name
       FROM members m
       LEFT JOIN tiers t ON m.tier_id = t.id
       WHERE m.id = $1 AND m.org_id = $2`,
      [req.params.id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ member: result.rows[0] });

  } catch (err) {
    console.error('Get member error:', err);
    res.status(500).json({ error: 'Failed to get member' });
  }
});

// Get member with full context (for member detail page)
router.get('/members/:id/full', requireUser, async (req, res) => {
  try {
    const memberId = req.params.id;
    const orgId = req.user.orgId;

    // Get everything in parallel
    const [
      memberResult,
      activityResult,
      transactionsResult,
      ceuResult,
      issuesResult
    ] = await Promise.all([
      // Member with computed fields
      db.query(`
        SELECT
          m.*,
          t.name as tier_name,
          t.price_cents as tier_price_cents,
          t.billing_period as tier_billing_period,

          -- Tenure
          EXTRACT(DAYS FROM NOW() - m.joined_at)::INT as member_days,
          DATE_PART('year', AGE(NOW(), m.joined_at))::INT as member_years,
          DATE_PART('month', AGE(NOW(), m.joined_at))::INT % 12 as member_months,

          -- Expiration
          CASE
            WHEN m.expires_at IS NOT NULL THEN
              EXTRACT(DAYS FROM m.expires_at - NOW())::INT
            ELSE NULL
          END as days_until_expiration,

          -- CEU progress
          CASE
            WHEN m.ceu_required > 0 THEN
              ROUND((m.ceu_earned / m.ceu_required * 100)::NUMERIC, 1)
            ELSE NULL
          END as ceu_progress_percent,
          CASE
            WHEN m.ceu_period_end IS NOT NULL THEN
              (m.ceu_period_end - CURRENT_DATE)
            ELSE NULL
          END as days_until_ceu_deadline

        FROM members m
        LEFT JOIN tiers t ON m.tier_id = t.id
        WHERE m.id = $1 AND m.org_id = $2
      `, [memberId, orgId]),

      // Activity timeline (last 50 events)
      db.query(`
        SELECT
          ma.*,
          u.name as caused_by_name,
          u.email as caused_by_email
        FROM member_activity ma
        LEFT JOIN users u ON ma.caused_by_user_id = u.id
        WHERE ma.member_id = $1 AND ma.org_id = $2
        ORDER BY ma.created_at DESC
        LIMIT 50
      `, [memberId, orgId]),

      // Transaction history
      db.query(`
        SELECT
          t.*,
          SUM(amount_cents) OVER () as lifetime_value_cents,
          COUNT(*) OVER () as total_transactions
        FROM transactions t
        WHERE t.member_id = $1 AND t.org_id = $2
        ORDER BY t.created_at DESC
        LIMIT 20
      `, [memberId, orgId]),

      // CEU credits
      db.query(`
        SELECT *
        FROM ceu_credits
        WHERE member_id = $1 AND org_id = $2
        ORDER BY completed_at DESC
        LIMIT 20
      `, [memberId, orgId]),

      // Detect potential issues
      db.query(`
        SELECT
          -- Failed payments in last 30 days
          (SELECT COUNT(*) FROM member_activity
           WHERE member_id = $1 AND type = 'payment_failed'
           AND created_at > NOW() - INTERVAL '30 days') as recent_failed_payments,

          -- Days since last login
          (SELECT EXTRACT(DAYS FROM NOW() - MAX(created_at))::INT
           FROM member_activity
           WHERE member_id = $1 AND type = 'login') as days_since_login,

          -- Days since last email open
          (SELECT EXTRACT(DAYS FROM NOW() - MAX(created_at))::INT
           FROM member_activity
           WHERE member_id = $1 AND type = 'email_opened') as days_since_email_open,

          -- Unopened emails in last 30 days
          (SELECT COUNT(*) FROM member_activity
           WHERE member_id = $1 AND type = 'email_sent'
           AND created_at > NOW() - INTERVAL '30 days'
           AND id NOT IN (
             SELECT (metadata->>'email_id')::UUID FROM member_activity
             WHERE member_id = $1 AND type = 'email_opened'
           )) as recent_unopened_emails
      `, [memberId])
    ]);

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberResult.rows[0];
    const transactions = transactionsResult.rows;
    const issues = issuesResult.rows[0] || {};

    // Calculate lifetime value
    const lifetimeValue = transactions.length > 0
      ? parseInt(transactions[0].lifetime_value_cents) || 0
      : 0;

    // Build issues array for the UI
    const detectedIssues = [];

    // Check for payment issues
    if (issues.recent_failed_payments > 0) {
      detectedIssues.push({
        type: 'payment_failed',
        severity: issues.recent_failed_payments >= 3 ? 'high' : 'medium',
        title: `Payment failed ${issues.recent_failed_payments} time(s) in last 30 days`,
        suggestion: 'Contact member to update payment method'
      });
    }

    // Check for engagement issues
    if (issues.days_since_login > 180) {
      detectedIssues.push({
        type: 'inactive',
        severity: 'low',
        title: `No login in ${issues.days_since_login} days`,
        suggestion: 'Member may not be using their benefits'
      });
    }

    // Check for email deliverability
    if (issues.recent_unopened_emails >= 3 && issues.days_since_email_open > 60) {
      detectedIssues.push({
        type: 'email_unreachable',
        severity: 'medium',
        title: 'Emails not being opened',
        suggestion: 'Try calling or verify email address'
      });
    }

    // Check for expiring membership
    if (member.days_until_expiration !== null) {
      if (member.days_until_expiration < 0) {
        detectedIssues.push({
          type: 'expired',
          severity: 'high',
          title: `Membership expired ${Math.abs(member.days_until_expiration)} days ago`,
          suggestion: 'Send renewal reminder or personal outreach'
        });
      } else if (member.days_until_expiration <= 14) {
        detectedIssues.push({
          type: 'expiring_soon',
          severity: 'medium',
          title: `Membership expires in ${member.days_until_expiration} days`,
          suggestion: member.auto_renew ? 'Auto-renew is on' : 'Send renewal reminder'
        });
      }
    }

    // Check for CEU deadline
    if (member.days_until_ceu_deadline !== null && member.ceu_progress_percent < 100) {
      if (member.days_until_ceu_deadline <= 30) {
        const needed = member.ceu_required - member.ceu_earned;
        detectedIssues.push({
          type: 'ceu_deadline',
          severity: member.days_until_ceu_deadline <= 7 ? 'high' : 'medium',
          title: `Needs ${needed} more CEUs in ${member.days_until_ceu_deadline} days`,
          suggestion: 'Send CEU reminder with course recommendations'
        });
      }
    }

    res.json({
      member: {
        ...member,
        lifetime_value_cents: lifetimeValue,
        total_transactions: transactions.length > 0 ? parseInt(transactions[0].total_transactions) : 0
      },
      activity: activityResult.rows,
      transactions: transactions,
      ceuCredits: ceuResult.rows,
      issues: detectedIssues
    });

  } catch (err) {
    console.error('Get member full error:', err);
    res.status(500).json({ error: 'Failed to get member details' });
  }
});

// Log activity for a member
router.post('/members/:id/activity', requireUser, async (req, res) => {
  try {
    const { type, title, description, metadata, visible_to_member } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'Type and title are required' });
    }

    // Verify member belongs to org
    const memberCheck = await db.query(
      'SELECT 1 FROM members WHERE id = $1 AND org_id = $2',
      [req.params.id, req.user.orgId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const result = await db.query(`
      INSERT INTO member_activity (
        org_id, member_id, type, title, description,
        metadata, caused_by_user_id, visible_to_member
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      req.user.orgId,
      req.params.id,
      type,
      title,
      description || null,
      JSON.stringify(metadata || {}),
      req.user.id,
      visible_to_member || false
    ]);

    res.status(201).json({ activity: result.rows[0] });

  } catch (err) {
    console.error('Log activity error:', err);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// Create member
router.post('/members', requireUser, requireAdmin, async (req, res) => {
  try {
    const {
      email, first_name, last_name, phone,
      address_line1, address_line2, city, state, postal_code, country,
      tier_id, status = 'active', notes, custom_fields,
      password, send_welcome_email
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if member already exists
    const existing = await db.query(
      'SELECT 1 FROM members WHERE email = $1 AND org_id = $2',
      [email.toLowerCase(), req.user.orgId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A member with this email already exists' });
    }

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = await auth.hashPassword(password);
    }

    const result = await db.query(
      `INSERT INTO members (
        org_id, email, first_name, last_name, phone,
        address_line1, address_line2, city, state, postal_code, country,
        tier_id, status, notes, custom_fields, password_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        req.user.orgId, email.toLowerCase(), first_name, last_name, phone,
        address_line1, address_line2, city, state, postal_code, country || 'US',
        tier_id || null, status, notes, JSON.stringify(custom_fields || {}), passwordHash
      ]
    );

    // TODO: Send welcome email if send_welcome_email is true

    res.status(201).json({ member: result.rows[0] });

  } catch (err) {
    console.error('Create member error:', err);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// Update member
router.put('/members/:id', requireUser, requireAdmin, async (req, res) => {
  try {
    const {
      email, first_name, last_name, phone,
      address_line1, address_line2, city, state, postal_code, country,
      tier_id, status, notes, custom_fields, password
    } = req.body;

    // Check member exists and belongs to org
    const existing = await db.query(
      'SELECT * FROM members WHERE id = $1 AND org_id = $2',
      [req.params.id, req.user.orgId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;

    const addUpdate = (field, value) => {
      if (value !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    };

    addUpdate('email', email?.toLowerCase());
    addUpdate('first_name', first_name);
    addUpdate('last_name', last_name);
    addUpdate('phone', phone);
    addUpdate('address_line1', address_line1);
    addUpdate('address_line2', address_line2);
    addUpdate('city', city);
    addUpdate('state', state);
    addUpdate('postal_code', postal_code);
    addUpdate('country', country);
    addUpdate('tier_id', tier_id);
    addUpdate('status', status);
    addUpdate('notes', notes);

    if (custom_fields !== undefined) {
      updates.push(`custom_fields = $${paramIndex}`);
      params.push(JSON.stringify(custom_fields));
      paramIndex++;
    }

    if (password) {
      const passwordHash = await auth.hashPassword(password);
      updates.push(`password_hash = $${paramIndex}`);
      params.push(passwordHash);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.json({ member: existing.rows[0] });
    }

    params.push(req.params.id, req.user.orgId);

    const result = await db.query(
      `UPDATE members SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      params
    );

    res.json({ member: result.rows[0] });

  } catch (err) {
    console.error('Update member error:', err);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Delete member
router.delete('/members/:id', requireUser, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM members WHERE id = $1 AND org_id = $2 RETURNING id',
      [req.params.id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ success: true, deleted: req.params.id });

  } catch (err) {
    console.error('Delete member error:', err);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

// ============================================
// TIERS
// ============================================

// List tiers
router.get('/tiers', requireUser, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*,
        (SELECT COUNT(*) FROM members m WHERE m.tier_id = t.id) as member_count
       FROM tiers t
       WHERE t.org_id = $1
       ORDER BY t.sort_order, t.created_at`,
      [req.user.orgId]
    );

    res.json({ tiers: result.rows });

  } catch (err) {
    console.error('List tiers error:', err);
    res.status(500).json({ error: 'Failed to list tiers' });
  }
});

// Create tier
router.post('/tiers', requireUser, requireAdmin, async (req, res) => {
  try {
    const {
      name, description, price_cents = 0, billing_period = 'annual',
      is_public = true, benefits = [], sort_order = 0
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO tiers (org_id, name, description, price_cents, billing_period, is_public, benefits, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.orgId, name, description, price_cents, billing_period, is_public, JSON.stringify(benefits), sort_order]
    );

    res.status(201).json({ tier: result.rows[0] });

  } catch (err) {
    console.error('Create tier error:', err);
    res.status(500).json({ error: 'Failed to create tier' });
  }
});

// Update tier
router.put('/tiers/:id', requireUser, requireAdmin, async (req, res) => {
  try {
    const {
      name, description, price_cents, billing_period,
      is_public, is_active, benefits, sort_order
    } = req.body;

    const existing = await db.query(
      'SELECT * FROM tiers WHERE id = $1 AND org_id = $2',
      [req.params.id, req.user.orgId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Tier not found' });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    const addUpdate = (field, value) => {
      if (value !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    };

    addUpdate('name', name);
    addUpdate('description', description);
    addUpdate('price_cents', price_cents);
    addUpdate('billing_period', billing_period);
    addUpdate('is_public', is_public);
    addUpdate('is_active', is_active);
    addUpdate('sort_order', sort_order);

    if (benefits !== undefined) {
      updates.push(`benefits = $${paramIndex}`);
      params.push(JSON.stringify(benefits));
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.json({ tier: existing.rows[0] });
    }

    params.push(req.params.id, req.user.orgId);

    const result = await db.query(
      `UPDATE tiers SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      params
    );

    res.json({ tier: result.rows[0] });

  } catch (err) {
    console.error('Update tier error:', err);
    res.status(500).json({ error: 'Failed to update tier' });
  }
});

// Delete tier
router.delete('/tiers/:id', requireUser, requireAdmin, async (req, res) => {
  try {
    // Check if tier has members
    const memberCount = await db.query(
      'SELECT COUNT(*) FROM members WHERE tier_id = $1',
      [req.params.id]
    );

    if (parseInt(memberCount.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete tier with active members. Move members first.'
      });
    }

    const result = await db.query(
      'DELETE FROM tiers WHERE id = $1 AND org_id = $2 RETURNING id',
      [req.params.id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tier not found' });
    }

    res.json({ success: true, deleted: req.params.id });

  } catch (err) {
    console.error('Delete tier error:', err);
    res.status(500).json({ error: 'Failed to delete tier' });
  }
});

// ============================================
// DASHBOARD STATS
// ============================================

router.get('/dashboard/stats', requireUser, async (req, res) => {
  try {
    const orgId = req.user.orgId;

    // Get all stats in parallel
    const [
      memberStats,
      tierStats,
      revenueStats,
      recentMembers,
      ceuStats
    ] = await Promise.all([
      // Member counts by status
      db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'expired') as expired,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
        FROM members WHERE org_id = $1
      `, [orgId]),

      // Tier counts
      db.query(`
        SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active
        FROM tiers WHERE org_id = $1
      `, [orgId]),

      // Revenue this month (from transactions)
      db.query(`
        SELECT
          COALESCE(SUM(amount_cents), 0) as total_cents,
          COUNT(*) as transaction_count
        FROM transactions
        WHERE org_id = $1
          AND status = 'completed'
          AND created_at > DATE_TRUNC('month', NOW())
      `, [orgId]),

      // Recent members (last 5)
      db.query(`
        SELECT id, email, first_name, last_name, status, created_at
        FROM members
        WHERE org_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [orgId]),

      // CEU stats
      db.query(`
        SELECT
          COALESCE(SUM(credits), 0) as total_credits,
          COUNT(DISTINCT member_id) as members_with_credits
        FROM ceu_credits WHERE org_id = $1
      `, [orgId])
    ]);

    res.json({
      members: {
        total: parseInt(memberStats.rows[0].total),
        active: parseInt(memberStats.rows[0].active),
        expired: parseInt(memberStats.rows[0].expired),
        pending: parseInt(memberStats.rows[0].pending),
        newThisMonth: parseInt(memberStats.rows[0].new_this_month)
      },
      tiers: {
        total: parseInt(tierStats.rows[0].total),
        active: parseInt(tierStats.rows[0].active)
      },
      revenue: {
        thisMonth: parseInt(revenueStats.rows[0].total_cents),
        transactionCount: parseInt(revenueStats.rows[0].transaction_count)
      },
      ceu: {
        totalCredits: parseFloat(ceuStats.rows[0].total_credits),
        membersWithCredits: parseInt(ceuStats.rows[0].members_with_credits)
      },
      recentMembers: recentMembers.rows
    });

  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

// Dashboard priorities - what needs attention today
router.get('/dashboard/priorities', requireUser, async (req, res) => {
  try {
    const orgId = req.user.orgId;

    const [
      failedPayments,
      expiringMemberships,
      expiredMemberships,
      ceuDeadlines,
      pendingMembers,
      inactiveHighValue
    ] = await Promise.all([
      // Members with recent failed payments (critical - they want to pay but can't)
      db.query(`
        SELECT DISTINCT ON (m.id)
          m.id, m.email, m.first_name, m.last_name, m.phone,
          t.name as tier_name, t.price_cents,
          m.joined_at,
          EXTRACT(DAYS FROM NOW() - m.joined_at)::INT as member_days,
          (SELECT COUNT(*) FROM member_activity
           WHERE member_id = m.id AND type = 'payment_failed'
           AND created_at > NOW() - INTERVAL '30 days') as failed_count,
          (SELECT MAX(created_at) FROM member_activity
           WHERE member_id = m.id AND type = 'payment_failed') as last_failed_at
        FROM members m
        LEFT JOIN tiers t ON m.tier_id = t.id
        WHERE m.org_id = $1
          AND EXISTS (
            SELECT 1 FROM member_activity ma
            WHERE ma.member_id = m.id
            AND ma.type = 'payment_failed'
            AND ma.created_at > NOW() - INTERVAL '14 days'
          )
        ORDER BY m.id, (SELECT MAX(created_at) FROM member_activity WHERE member_id = m.id AND type = 'payment_failed') DESC
        LIMIT 10
      `, [orgId]),

      // Memberships expiring in next 7 days (urgent renewals)
      db.query(`
        SELECT
          m.id, m.email, m.first_name, m.last_name, m.phone,
          t.name as tier_name, t.price_cents,
          m.expires_at,
          m.auto_renew,
          EXTRACT(DAYS FROM m.expires_at - NOW())::INT as days_until_expiration,
          EXTRACT(DAYS FROM NOW() - m.joined_at)::INT as member_days,
          (SELECT COALESCE(SUM(amount_cents), 0) FROM transactions
           WHERE member_id = m.id AND status = 'completed') as lifetime_value
        FROM members m
        LEFT JOIN tiers t ON m.tier_id = t.id
        WHERE m.org_id = $1
          AND m.status = 'active'
          AND m.expires_at IS NOT NULL
          AND m.expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        ORDER BY m.expires_at ASC
        LIMIT 10
      `, [orgId]),

      // Recently expired (lapsed but recoverable)
      db.query(`
        SELECT
          m.id, m.email, m.first_name, m.last_name, m.phone,
          t.name as tier_name, t.price_cents,
          m.expires_at,
          ABS(EXTRACT(DAYS FROM m.expires_at - NOW()))::INT as days_since_expiration,
          EXTRACT(DAYS FROM NOW() - m.joined_at)::INT as member_days,
          (SELECT COALESCE(SUM(amount_cents), 0) FROM transactions
           WHERE member_id = m.id AND status = 'completed') as lifetime_value
        FROM members m
        LEFT JOIN tiers t ON m.tier_id = t.id
        WHERE m.org_id = $1
          AND m.status = 'expired'
          AND m.expires_at > NOW() - INTERVAL '30 days'
        ORDER BY m.expires_at DESC
        LIMIT 10
      `, [orgId]),

      // CEU deadlines approaching (members need help)
      db.query(`
        SELECT
          m.id, m.email, m.first_name, m.last_name,
          m.ceu_required, m.ceu_earned,
          m.ceu_period_end,
          (m.ceu_period_end - CURRENT_DATE) as days_until_deadline,
          (m.ceu_required - m.ceu_earned) as ceu_needed
        FROM members m
        WHERE m.org_id = $1
          AND m.status = 'active'
          AND m.ceu_required > 0
          AND m.ceu_earned < m.ceu_required
          AND m.ceu_period_end IS NOT NULL
          AND m.ceu_period_end BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
        ORDER BY m.ceu_period_end ASC
        LIMIT 10
      `, [orgId]),

      // Pending members waiting for action
      db.query(`
        SELECT
          m.id, m.email, m.first_name, m.last_name,
          m.created_at,
          EXTRACT(DAYS FROM NOW() - m.created_at)::INT as days_pending,
          t.name as tier_name
        FROM members m
        LEFT JOIN tiers t ON m.tier_id = t.id
        WHERE m.org_id = $1
          AND m.status = 'pending'
        ORDER BY m.created_at ASC
        LIMIT 10
      `, [orgId]),

      // High-value members who haven't logged in (at risk of churning)
      db.query(`
        SELECT
          m.id, m.email, m.first_name, m.last_name,
          t.name as tier_name,
          m.last_login_at,
          EXTRACT(DAYS FROM NOW() - m.last_login_at)::INT as days_since_login,
          EXTRACT(DAYS FROM NOW() - m.joined_at)::INT as member_days,
          (SELECT COALESCE(SUM(amount_cents), 0) FROM transactions
           WHERE member_id = m.id AND status = 'completed') as lifetime_value
        FROM members m
        LEFT JOIN tiers t ON m.tier_id = t.id
        WHERE m.org_id = $1
          AND m.status = 'active'
          AND m.last_login_at < NOW() - INTERVAL '90 days'
          AND EXISTS (
            SELECT 1 FROM transactions
            WHERE member_id = m.id AND status = 'completed'
            HAVING SUM(amount_cents) > 50000
          )
        ORDER BY (SELECT SUM(amount_cents) FROM transactions WHERE member_id = m.id AND status = 'completed') DESC
        LIMIT 5
      `, [orgId])
    ]);

    // Build prioritized action list
    const priorities = [];

    // Failed payments are highest priority
    failedPayments.rows.forEach(m => {
      const memberDays = m.member_days || 0;
      const isLongTerm = memberDays > 365;
      priorities.push({
        type: 'payment_failed',
        severity: m.failed_count >= 3 ? 'critical' : 'high',
        member: {
          id: m.id,
          name: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email,
          email: m.email,
          phone: m.phone
        },
        title: `Payment failed ${m.failed_count}x`,
        context: isLongTerm ? `${Math.floor(memberDays / 365)}-year member` : 'Member',
        tierName: m.tier_name,
        amount: m.price_cents,
        suggestion: 'Card may be expired. Personal call usually resolves this.',
        actions: ['call', 'email', 'view']
      });
    });

    // Expiring memberships
    expiringMemberships.rows.forEach(m => {
      if (m.auto_renew) return; // Skip auto-renew members
      priorities.push({
        type: 'expiring_soon',
        severity: m.days_until_expiration <= 3 ? 'high' : 'medium',
        member: {
          id: m.id,
          name: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email,
          email: m.email,
          phone: m.phone
        },
        title: `Expires in ${m.days_until_expiration} day${m.days_until_expiration !== 1 ? 's' : ''}`,
        context: m.lifetime_value > 0 ? `$${(m.lifetime_value / 100).toFixed(0)} lifetime` : null,
        tierName: m.tier_name,
        suggestion: 'Send renewal reminder or personal outreach',
        actions: ['send_renewal', 'call', 'view']
      });
    });

    // Recently expired (recovery window)
    expiredMemberships.rows.forEach(m => {
      priorities.push({
        type: 'recently_expired',
        severity: m.days_since_expiration <= 7 ? 'high' : 'medium',
        member: {
          id: m.id,
          name: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email,
          email: m.email,
          phone: m.phone
        },
        title: `Expired ${m.days_since_expiration} day${m.days_since_expiration !== 1 ? 's' : ''} ago`,
        context: m.member_days > 365 ? `${Math.floor(m.member_days / 365)}-year member` : null,
        tierName: m.tier_name,
        suggestion: 'Still in recovery window. Personal touch works best.',
        actions: ['call', 'send_renewal', 'view']
      });
    });

    // CEU deadlines
    ceuDeadlines.rows.forEach(m => {
      priorities.push({
        type: 'ceu_deadline',
        severity: m.days_until_deadline <= 7 ? 'high' : 'medium',
        member: {
          id: m.id,
          name: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email,
          email: m.email
        },
        title: `Needs ${m.ceu_needed} CEUs in ${m.days_until_deadline} days`,
        context: `${m.ceu_earned}/${m.ceu_required} completed`,
        suggestion: 'Send CEU reminder with course recommendations',
        actions: ['send_ceu_reminder', 'view']
      });
    });

    // Pending members
    pendingMembers.rows.forEach(m => {
      priorities.push({
        type: 'pending',
        severity: m.days_pending > 7 ? 'medium' : 'low',
        member: {
          id: m.id,
          name: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email,
          email: m.email
        },
        title: `Pending for ${m.days_pending} day${m.days_pending !== 1 ? 's' : ''}`,
        tierName: m.tier_name,
        suggestion: 'Review and approve or follow up',
        actions: ['approve', 'view']
      });
    });

    // At-risk high-value
    inactiveHighValue.rows.forEach(m => {
      priorities.push({
        type: 'at_risk',
        severity: 'low',
        member: {
          id: m.id,
          name: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email,
          email: m.email
        },
        title: `No login in ${m.days_since_login} days`,
        context: `$${(m.lifetime_value / 100).toFixed(0)} lifetime value`,
        tierName: m.tier_name,
        suggestion: 'High-value member not engaging. Check in.',
        actions: ['email', 'view']
      });
    });

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    priorities.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    res.json({
      priorities: priorities.slice(0, 15),
      counts: {
        critical: priorities.filter(p => p.severity === 'critical').length,
        high: priorities.filter(p => p.severity === 'high').length,
        medium: priorities.filter(p => p.severity === 'medium').length,
        low: priorities.filter(p => p.severity === 'low').length
      }
    });

  } catch (err) {
    console.error('Dashboard priorities error:', err);
    res.status(500).json({ error: 'Failed to load priorities' });
  }
});

// ============================================
// ORGANIZATION
// ============================================

router.get('/org', requireUser, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM organizations WHERE id = $1',
      [req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Don't expose sensitive fields
    const org = result.rows[0];
    delete org.stripe_account_id;

    res.json({ org });

  } catch (err) {
    console.error('Get org error:', err);
    res.status(500).json({ error: 'Failed to get organization' });
  }
});

router.put('/org', requireUser, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, website, logo_url, settings, ceu_enabled } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    const addUpdate = (field, value) => {
      if (value !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    };

    addUpdate('name', name);
    addUpdate('email', email);
    addUpdate('phone', phone);
    addUpdate('website', website);
    addUpdate('logo_url', logo_url);
    addUpdate('ceu_enabled', ceu_enabled);

    if (settings !== undefined) {
      updates.push(`settings = $${paramIndex}`);
      params.push(JSON.stringify(settings));
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.user.orgId);

    const result = await db.query(
      `UPDATE organizations SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    const org = result.rows[0];
    delete org.stripe_account_id;

    res.json({ org });

  } catch (err) {
    console.error('Update org error:', err);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

module.exports = router;
