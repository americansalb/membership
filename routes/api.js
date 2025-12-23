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

// Get single member
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
