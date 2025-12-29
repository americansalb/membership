const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireDev } = require('../lib/middleware');

// All dev routes require developer authentication
router.use(requireDev);

// ============================================
// PLATFORM PLANS
// ============================================

router.get('/plans', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM platform_plans ORDER BY sort_order'
    );
    res.json({ plans: result.rows });
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

// ============================================
// ORGANIZATIONS
// ============================================

router.get('/orgs', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.*,
        (SELECT COUNT(*) FROM members m WHERE m.org_id = o.id) as member_count,
        (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id) as user_count
      FROM organizations o
      ORDER BY o.created_at DESC
    `);
    res.json({ orgs: result.rows });
  } catch (err) {
    console.error('Get orgs error:', err);
    res.status(500).json({ error: 'Failed to get organizations' });
  }
});

router.put('/orgs/:id/plan', async (req, res) => {
  try {
    const { plan } = req.body;

    if (!['free', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Get plan limits from platform_plans
    const planResult = await db.query(
      'SELECT admin_seat_limit, staff_seat_limit FROM platform_plans WHERE id = $1',
      [plan]
    );

    const planLimits = planResult.rows[0] || { admin_seat_limit: 0, staff_seat_limit: 0 };

    // Update org plan and limits
    const result = await db.query(`
      UPDATE organizations
      SET plan = $1,
          admin_seat_limit = $2,
          staff_seat_limit = $3,
          plan_started_at = CASE WHEN plan != $1 THEN NOW() ELSE plan_started_at END,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [plan, planLimits.admin_seat_limit, planLimits.staff_seat_limit, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ org: result.rows[0] });
  } catch (err) {
    console.error('Update org plan error:', err);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Create default forums for an org that doesn't have any
router.post('/orgs/:id/setup-forums', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if org exists
    const orgResult = await db.query('SELECT id, name FROM organizations WHERE id = $1', [id]);
    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if org already has forums
    const forumsResult = await db.query(
      'SELECT COUNT(*) FROM community_forums WHERE org_id = $1',
      [id]
    );
    const existingCount = parseInt(forumsResult.rows[0].count);

    if (existingCount > 0) {
      return res.status(400).json({ error: `Organization already has ${existingCount} forums` });
    }

    // Create default forums
    await db.query(
      `INSERT INTO community_forums (org_id, name, slug, icon, description, allow_member_posts, sort_order)
       VALUES
         ($1, 'Announcements', 'announcements', '📢', 'Official updates and announcements', false, 0),
         ($1, 'General', 'general', '💬', 'General discussion and chat', true, 1),
         ($1, 'Introductions', 'introductions', '👋', 'Introduce yourself to the community', true, 2)`,
      [id]
    );

    res.json({ success: true, message: 'Default forums created', forums: 3 });
  } catch (err) {
    console.error('Setup forums error:', err);
    res.status(500).json({ error: 'Failed to create forums' });
  }
});

// ============================================
// STATS
// ============================================

router.get('/stats', async (req, res) => {
  try {
    // Total orgs
    const orgsResult = await db.query('SELECT COUNT(*) FROM organizations');
    const totalOrgs = parseInt(orgsResult.rows[0].count);

    // Total members
    const membersResult = await db.query('SELECT COUNT(*) FROM members');
    const totalMembers = parseInt(membersResult.rows[0].count);

    // Pro/Enterprise orgs
    const proResult = await db.query(
      "SELECT COUNT(*) FROM organizations WHERE plan IN ('pro', 'enterprise')"
    );
    const proOrgs = parseInt(proResult.rows[0].count);

    // Calculate MRR (Monthly Recurring Revenue)
    const mrrResult = await db.query(`
      SELECT
        SUM(CASE
          WHEN o.plan = 'pro' THEN 4900
          WHEN o.plan = 'enterprise' THEN 14900
          ELSE 0
        END) as mrr
      FROM organizations o
      WHERE o.plan_status = 'active'
    `);
    const mrr = parseInt(mrrResult.rows[0].mrr) || 0;

    res.json({
      totalOrgs,
      totalMembers,
      proOrgs,
      mrr
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
