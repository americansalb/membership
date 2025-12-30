const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireUser, requireAdmin, requireMember } = require('../lib/middleware');

// ============================================
// CEU SETTINGS (Admin)
// ============================================

// Get CEU settings for org
router.get('/settings', requireUser, async (req, res) => {
  try {
    const orgResult = await db.query(
      `SELECT ceu_enabled, ceu_tracking_period, ceu_settings
       FROM organizations WHERE id = $1`,
      [req.user.orgId]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const org = orgResult.rows[0];

    res.json({
      enabled: org.ceu_enabled || false,
      trackingPeriod: org.ceu_tracking_period || 'annual',
      settings: org.ceu_settings || {}
    });

  } catch (err) {
    console.error('Get CEU settings error:', err);
    res.status(500).json({ error: 'Failed to get CEU settings' });
  }
});

// Update CEU settings
router.put('/settings', requireUser, requireAdmin, async (req, res) => {
  try {
    const { enabled, trackingPeriod, settings } = req.body;
    const orgId = req.user.orgId;

    // Build update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (enabled !== undefined) {
      updates.push(`ceu_enabled = $${paramIndex}`);
      params.push(enabled);
      paramIndex++;
    }

    if (trackingPeriod) {
      updates.push(`ceu_tracking_period = $${paramIndex}`);
      params.push(trackingPeriod);
      paramIndex++;
    }

    if (settings !== undefined) {
      updates.push(`ceu_settings = $${paramIndex}`);
      params.push(JSON.stringify(settings));
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No settings to update' });
    }

    params.push(orgId);
    await db.query(
      `UPDATE organizations SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}`,
      params
    );

    // If enabling CEU for the first time, create default categories
    if (enabled) {
      const existingCategories = await db.query(
        'SELECT 1 FROM ceu_categories WHERE org_id = $1 LIMIT 1',
        [orgId]
      );

      if (existingCategories.rows.length === 0) {
        // Create default categories
        await db.query(
          `INSERT INTO ceu_categories (org_id, name, description, icon, sort_order)
           VALUES
             ($1, 'General', 'General continuing education credits', '📚', 0),
             ($1, 'Ethics', 'Professional ethics and standards', '⚖️', 1),
             ($1, 'Medical', 'Medical terminology and procedures', '🏥', 2),
             ($1, 'Legal', 'Legal terminology and procedures', '⚖️', 3)`,
          [orgId]
        );
      }
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Update CEU settings error:', err);
    res.status(500).json({ error: 'Failed to update CEU settings' });
  }
});

// ============================================
// CEU CATEGORIES (Admin)
// ============================================

// List categories for org
router.get('/categories', requireUser, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM ceu_categories
       WHERE org_id = $1
       ORDER BY sort_order, name`,
      [req.user.orgId]
    );

    res.json({ categories: result.rows });

  } catch (err) {
    console.error('List categories error:', err);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

// Create category
router.post('/categories', requireUser, requireAdmin, async (req, res) => {
  try {
    const { name, description, icon, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO ceu_categories (org_id, name, description, icon, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.orgId, name, description || null, icon || '📚', sort_order || 0]
    );

    res.status(201).json({ category: result.rows[0] });

  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/categories/:id', requireUser, requireAdmin, async (req, res) => {
  try {
    const { name, description, icon, sort_order, is_active } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }

    if (icon !== undefined) {
      updates.push(`icon = $${paramIndex}`);
      params.push(icon);
      paramIndex++;
    }

    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramIndex}`);
      params.push(sort_order);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(is_active);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id, req.user.orgId);

    const result = await db.query(
      `UPDATE ceu_categories SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category: result.rows[0] });

  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/categories/:id', requireUser, requireAdmin, async (req, res) => {
  try {
    // Check if credits use this category
    const usageCheck = await db.query(
      'SELECT COUNT(*) FROM ceu_credits WHERE category_id = $1',
      [req.params.id]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete category that has credits. Deactivate it instead.'
      });
    }

    const result = await db.query(
      'DELETE FROM ceu_categories WHERE id = $1 AND org_id = $2 RETURNING id',
      [req.params.id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============================================
// TIER CEU REQUIREMENTS (Admin)
// ============================================

// Get tier requirements
router.get('/tier-requirements', requireUser, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT tcr.*, t.name as tier_name
       FROM tier_ceu_requirements tcr
       JOIN tiers t ON tcr.tier_id = t.id
       WHERE t.org_id = $1
       ORDER BY t.sort_order`,
      [req.user.orgId]
    );

    res.json({ requirements: result.rows });

  } catch (err) {
    console.error('Get tier requirements error:', err);
    res.status(500).json({ error: 'Failed to get tier requirements' });
  }
});

// Update tier requirements
router.put('/tier-requirements/:tierId', requireUser, requireAdmin, async (req, res) => {
  try {
    const { total_required, category_minimums } = req.body;
    const tierId = req.params.tierId;

    // Verify tier belongs to org
    const tierCheck = await db.query(
      'SELECT 1 FROM tiers WHERE id = $1 AND org_id = $2',
      [tierId, req.user.orgId]
    );

    if (tierCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tier not found' });
    }

    // Upsert requirements
    const result = await db.query(
      `INSERT INTO tier_ceu_requirements (tier_id, total_required, category_minimums)
       VALUES ($1, $2, $3)
       ON CONFLICT (tier_id) DO UPDATE SET
         total_required = EXCLUDED.total_required,
         category_minimums = EXCLUDED.category_minimums,
         updated_at = NOW()
       RETURNING *`,
      [tierId, total_required || 0, JSON.stringify(category_minimums || {})]
    );

    res.json({ requirement: result.rows[0] });

  } catch (err) {
    console.error('Update tier requirements error:', err);
    res.status(500).json({ error: 'Failed to update tier requirements' });
  }
});

// ============================================
// CEU CREDITS (Admin)
// ============================================

// List all credits (admin view)
router.get('/credits', requireUser, async (req, res) => {
  try {
    const { status, category_id, member_id, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const orgId = req.user.orgId;

    let query = `
      SELECT
        c.*,
        m.email as member_email,
        m.first_name as member_first_name,
        m.last_name as member_last_name,
        cat.name as category_name,
        cat.icon as category_icon,
        u.name as verified_by_name
      FROM ceu_credits c
      JOIN members m ON c.member_id = m.id
      LEFT JOIN ceu_categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.verified_by = u.id
      WHERE c.org_id = $1
    `;
    const params = [orgId];
    let paramIndex = 2;

    // Filter by verification status
    if (status === 'pending') {
      query += ` AND c.verified = false AND c.rejection_reason IS NULL`;
    } else if (status === 'verified') {
      query += ` AND c.verified = true`;
    } else if (status === 'rejected') {
      query += ` AND c.rejection_reason IS NOT NULL`;
    }

    if (category_id) {
      query += ` AND c.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (member_id) {
      query += ` AND c.member_id = $${paramIndex}`;
      params.push(member_id);
      paramIndex++;
    }

    if (search) {
      query += ` AND (c.title ILIKE $${paramIndex} OR m.email ILIKE $${paramIndex} OR m.first_name ILIKE $${paramIndex} OR m.last_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total
    const countResult = await db.query(
      query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      credits: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('List credits error:', err);
    res.status(500).json({ error: 'Failed to list credits' });
  }
});

// Get pending credits count
router.get('/credits/pending-count', requireUser, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) FROM ceu_credits
       WHERE org_id = $1 AND verified = false AND rejection_reason IS NULL`,
      [req.user.orgId]
    );

    res.json({ count: parseInt(result.rows[0].count) });

  } catch (err) {
    console.error('Pending count error:', err);
    res.status(500).json({ error: 'Failed to get pending count' });
  }
});

// Verify (approve) credit
router.post('/credits/:id/verify', requireUser, requireAdmin, async (req, res) => {
  try {
    const creditId = req.params.id;
    const orgId = req.user.orgId;

    // Get credit details
    const creditResult = await db.query(
      'SELECT * FROM ceu_credits WHERE id = $1 AND org_id = $2',
      [creditId, orgId]
    );

    if (creditResult.rows.length === 0) {
      return res.status(404).json({ error: 'Credit not found' });
    }

    const credit = creditResult.rows[0];

    if (credit.verified) {
      return res.status(400).json({ error: 'Credit already verified' });
    }

    // Verify credit
    await db.query(
      `UPDATE ceu_credits SET
         verified = true,
         verified_by = $1,
         verified_at = NOW(),
         rejection_reason = NULL
       WHERE id = $2`,
      [req.user.userId, creditId]
    );

    // Update member's CEU earned total
    await db.query(
      `UPDATE members SET ceu_earned = COALESCE(ceu_earned, 0) + $1 WHERE id = $2`,
      [credit.credits, credit.member_id]
    );

    // Log activity
    await db.query(
      `INSERT INTO member_activity (org_id, member_id, type, title, caused_by_user_id, metadata)
       VALUES ($1, $2, 'ceu_verified', $3, $4, $5)`,
      [
        orgId,
        credit.member_id,
        `CEU credit verified: ${credit.title} (${credit.credits} credits)`,
        req.user.userId,
        JSON.stringify({ credit_id: creditId, credits: credit.credits })
      ]
    );

    res.json({ success: true });

  } catch (err) {
    console.error('Verify credit error:', err);
    res.status(500).json({ error: 'Failed to verify credit' });
  }
});

// Reject credit
router.post('/credits/:id/reject', requireUser, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const creditId = req.params.id;
    const orgId = req.user.orgId;

    const creditResult = await db.query(
      'SELECT * FROM ceu_credits WHERE id = $1 AND org_id = $2',
      [creditId, orgId]
    );

    if (creditResult.rows.length === 0) {
      return res.status(404).json({ error: 'Credit not found' });
    }

    const credit = creditResult.rows[0];

    await db.query(
      `UPDATE ceu_credits SET
         rejection_reason = $1,
         verified = false,
         verified_by = $2,
         verified_at = NOW()
       WHERE id = $3`,
      [reason || 'Credit rejected by admin', req.user.userId, creditId]
    );

    // Log activity
    await db.query(
      `INSERT INTO member_activity (org_id, member_id, type, title, caused_by_user_id, metadata)
       VALUES ($1, $2, 'ceu_rejected', $3, $4, $5)`,
      [
        orgId,
        credit.member_id,
        `CEU credit rejected: ${credit.title}`,
        req.user.userId,
        JSON.stringify({ credit_id: creditId, reason })
      ]
    );

    res.json({ success: true });

  } catch (err) {
    console.error('Reject credit error:', err);
    res.status(500).json({ error: 'Failed to reject credit' });
  }
});

// Bulk verify credits
router.post('/credits/bulk-verify', requireUser, requireAdmin, async (req, res) => {
  try {
    const { credit_ids } = req.body;

    if (!credit_ids || credit_ids.length === 0) {
      return res.status(400).json({ error: 'No credits specified' });
    }

    const orgId = req.user.orgId;
    let verified = 0;

    for (const creditId of credit_ids) {
      // Get credit
      const creditResult = await db.query(
        'SELECT * FROM ceu_credits WHERE id = $1 AND org_id = $2 AND verified = false',
        [creditId, orgId]
      );

      if (creditResult.rows.length === 0) continue;

      const credit = creditResult.rows[0];

      // Verify
      await db.query(
        `UPDATE ceu_credits SET verified = true, verified_by = $1, verified_at = NOW()
         WHERE id = $2`,
        [req.user.userId, creditId]
      );

      // Update member total
      await db.query(
        `UPDATE members SET ceu_earned = COALESCE(ceu_earned, 0) + $1 WHERE id = $2`,
        [credit.credits, credit.member_id]
      );

      verified++;
    }

    res.json({ success: true, verified });

  } catch (err) {
    console.error('Bulk verify error:', err);
    res.status(500).json({ error: 'Failed to bulk verify' });
  }
});

// ============================================
// CEU COMPLIANCE (Admin)
// ============================================

// Get compliance report data
router.get('/compliance', requireUser, async (req, res) => {
  try {
    const orgId = req.user.orgId;

    // Overall stats
    const statsResult = await db.query(`
      SELECT
        COUNT(*) as total_members,
        COUNT(*) FILTER (WHERE ceu_required > 0) as members_with_requirements,
        COUNT(*) FILTER (WHERE ceu_required > 0 AND ceu_earned >= ceu_required) as compliant,
        COUNT(*) FILTER (
          WHERE ceu_required > 0
          AND ceu_earned < ceu_required
          AND ceu_period_end IS NOT NULL
          AND ceu_period_end < CURRENT_DATE + 30
        ) as at_risk
      FROM members
      WHERE org_id = $1 AND status = 'active'
    `, [orgId]);

    // Credits by category
    const categoryResult = await db.query(`
      SELECT
        cat.name as category,
        cat.icon,
        COALESCE(SUM(c.credits), 0) as total_credits,
        COUNT(DISTINCT c.member_id) as member_count
      FROM ceu_categories cat
      LEFT JOIN ceu_credits c ON cat.id = c.category_id AND c.verified = true
      WHERE cat.org_id = $1 AND cat.is_active = true
      GROUP BY cat.id, cat.name, cat.icon
      ORDER BY cat.sort_order
    `, [orgId]);

    // At-risk members (need credits soon)
    const atRiskResult = await db.query(`
      SELECT
        m.id, m.email, m.first_name, m.last_name,
        m.ceu_earned, m.ceu_required,
        m.ceu_period_end,
        (m.ceu_period_end - CURRENT_DATE) as days_remaining,
        t.name as tier_name
      FROM members m
      LEFT JOIN tiers t ON m.tier_id = t.id
      WHERE m.org_id = $1
        AND m.status = 'active'
        AND m.ceu_required > 0
        AND m.ceu_earned < m.ceu_required
        AND m.ceu_period_end IS NOT NULL
      ORDER BY m.ceu_period_end ASC
      LIMIT 20
    `, [orgId]);

    const stats = statsResult.rows[0];
    const complianceRate = stats.members_with_requirements > 0
      ? Math.round((stats.compliant / stats.members_with_requirements) * 100)
      : 100;

    res.json({
      stats: {
        totalMembers: parseInt(stats.total_members),
        membersWithRequirements: parseInt(stats.members_with_requirements),
        compliant: parseInt(stats.compliant),
        atRisk: parseInt(stats.at_risk),
        complianceRate
      },
      byCategory: categoryResult.rows,
      atRiskMembers: atRiskResult.rows
    });

  } catch (err) {
    console.error('Compliance report error:', err);
    res.status(500).json({ error: 'Failed to get compliance data' });
  }
});

// ============================================
// MEMBER CEU (Portal)
// ============================================

// Get member's CEU progress
router.get('/member/progress', requireMember, async (req, res) => {
  try {
    const memberId = req.member.memberId;
    const orgId = req.member.orgId;

    // Get member's CEU info
    const memberResult = await db.query(`
      SELECT
        m.ceu_earned,
        m.ceu_required,
        m.ceu_period_start,
        m.ceu_period_end,
        t.name as tier_name,
        tcr.total_required as tier_total_required,
        tcr.category_minimums as tier_category_minimums
      FROM members m
      LEFT JOIN tiers t ON m.tier_id = t.id
      LEFT JOIN tier_ceu_requirements tcr ON t.id = tcr.tier_id
      WHERE m.id = $1
    `, [memberId]);

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberResult.rows[0];
    const required = member.tier_total_required || member.ceu_required || 0;
    const earned = member.ceu_earned || 0;
    const progress = required > 0 ? Math.round((earned / required) * 100) : 100;

    // Get org's CEU categories
    const categoriesResult = await db.query(`
      SELECT cat.id, cat.name, cat.icon, cat.description,
        COALESCE(SUM(c.credits) FILTER (WHERE c.verified = true), 0) as earned
      FROM ceu_categories cat
      LEFT JOIN ceu_credits c ON cat.id = c.category_id AND c.member_id = $1
      WHERE cat.org_id = $2 AND cat.is_active = true
      GROUP BY cat.id
      ORDER BY cat.sort_order
    `, [memberId, orgId]);

    // Get recent credits
    const recentResult = await db.query(`
      SELECT c.*, cat.name as category_name, cat.icon as category_icon
      FROM ceu_credits c
      LEFT JOIN ceu_categories cat ON c.category_id = cat.id
      WHERE c.member_id = $1
      ORDER BY c.completed_at DESC
      LIMIT 5
    `, [memberId]);

    // Calculate days until deadline
    let daysRemaining = null;
    let status = 'on_track';

    if (member.ceu_period_end) {
      const deadline = new Date(member.ceu_period_end);
      const today = new Date();
      daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

      if (progress >= 100) {
        status = 'complete';
      } else if (daysRemaining < 0) {
        status = 'overdue';
      } else if (daysRemaining <= 14 && progress < 50) {
        status = 'critical';
      } else if (daysRemaining <= 30 || progress < 50) {
        status = 'warning';
      }
    }

    res.json({
      earned,
      required,
      progress,
      periodStart: member.ceu_period_start,
      periodEnd: member.ceu_period_end,
      daysRemaining,
      status,
      tierName: member.tier_name,
      categoryMinimums: member.tier_category_minimums || {},
      byCategory: categoriesResult.rows,
      recentCredits: recentResult.rows
    });

  } catch (err) {
    console.error('Get member progress error:', err);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Get member's credit history
router.get('/member/credits', requireMember, async (req, res) => {
  try {
    const { status, category_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const memberId = req.member.memberId;

    let query = `
      SELECT c.*, cat.name as category_name, cat.icon as category_icon
      FROM ceu_credits c
      LEFT JOIN ceu_categories cat ON c.category_id = cat.id
      WHERE c.member_id = $1
    `;
    const params = [memberId];
    let paramIndex = 2;

    if (status === 'pending') {
      query += ` AND c.verified = false AND c.rejection_reason IS NULL`;
    } else if (status === 'verified') {
      query += ` AND c.verified = true`;
    } else if (status === 'rejected') {
      query += ` AND c.rejection_reason IS NOT NULL`;
    }

    if (category_id) {
      query += ` AND c.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    const countResult = await db.query(
      query.replace('SELECT c.*', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY c.completed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      credits: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('Get member credits error:', err);
    res.status(500).json({ error: 'Failed to get credits' });
  }
});

// Submit credit for approval
router.post('/member/credits', requireMember, async (req, res) => {
  try {
    const {
      title, credits, category_id, provider, completed_at,
      description, certificate_url, certificate_number
    } = req.body;

    const memberId = req.member.memberId;
    const orgId = req.member.orgId;

    if (!title || !credits) {
      return res.status(400).json({ error: 'Title and credits are required' });
    }

    if (credits <= 0 || credits > 100) {
      return res.status(400).json({ error: 'Credits must be between 0.25 and 100' });
    }

    // Verify category belongs to org if provided
    if (category_id) {
      const catCheck = await db.query(
        'SELECT 1 FROM ceu_categories WHERE id = $1 AND org_id = $2',
        [category_id, orgId]
      );
      if (catCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    const result = await db.query(
      `INSERT INTO ceu_credits (
        org_id, member_id, title, credits, category_id, provider,
        completed_at, description, certificate_url, certificate_number,
        source, submitted_by_member
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'member', true)
      RETURNING *`,
      [
        orgId, memberId, title, credits, category_id || null, provider || null,
        completed_at || new Date(), description || null,
        certificate_url || null, certificate_number || null
      ]
    );

    // Log activity
    await db.query(
      `INSERT INTO member_activity (org_id, member_id, type, title, visible_to_member, metadata)
       VALUES ($1, $2, 'ceu_submitted', $3, true, $4)`,
      [
        orgId, memberId,
        `Submitted ${credits} CEU credits: ${title}`,
        JSON.stringify({ credit_id: result.rows[0].id, credits })
      ]
    );

    res.status(201).json({ credit: result.rows[0] });

  } catch (err) {
    console.error('Submit credit error:', err);
    res.status(500).json({ error: 'Failed to submit credit' });
  }
});

// Get categories for member submission form
router.get('/member/categories', requireMember, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, icon, description
       FROM ceu_categories
       WHERE org_id = $1 AND is_active = true
       ORDER BY sort_order`,
      [req.member.orgId]
    );

    res.json({ categories: result.rows });

  } catch (err) {
    console.error('Get member categories error:', err);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

module.exports = router;
