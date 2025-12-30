const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireUser } = require('../lib/middleware');

// ============================================
// ADMIN: Credential Management
// ============================================

// Get all credentials for org
router.get('/', requireUser, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM member_credentials mc WHERE mc.credential_id = c.id) AS member_count,
        (SELECT COUNT(*) FROM credential_categories cc WHERE cc.credential_id = c.id AND cc.is_active = true) AS category_count
      FROM credentials c
      WHERE c.org_id = $1
      ORDER BY c.name
    `, [req.user.orgId]);

    res.json({ credentials: result.rows });
  } catch (err) {
    console.error('Error fetching credentials:', err);
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

// Get single credential with categories and custom fields
router.get('/:id', requireUser, async (req, res) => {
  try {
    const credResult = await db.query(`
      SELECT * FROM credentials WHERE id = $1 AND org_id = $2
    `, [req.params.id, req.user.orgId]);

    if (credResult.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const categoriesResult = await db.query(`
      SELECT * FROM credential_categories
      WHERE credential_id = $1
      ORDER BY sort_order, name
    `, [req.params.id]);

    const customFieldsResult = await db.query(`
      SELECT * FROM credential_custom_fields
      WHERE credential_id = $1
      ORDER BY sort_order, field_label
    `, [req.params.id]);

    res.json({
      credential: credResult.rows[0],
      categories: categoriesResult.rows,
      customFields: customFieldsResult.rows
    });
  } catch (err) {
    console.error('Error fetching credential:', err);
    res.status(500).json({ error: 'Failed to fetch credential' });
  }
});

// Create credential
router.post('/', requireUser, async (req, res) => {
  const {
    name,
    short_name,
    description,
    renewal_period_months,
    renewal_type,
    renewal_month,
    renewal_day,
    total_credits_required,
    grace_period_days
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Credential name is required' });
  }

  try {
    const result = await db.query(`
      INSERT INTO credentials (
        org_id, name, short_name, description,
        renewal_period_months, renewal_type, renewal_month, renewal_day,
        total_credits_required, grace_period_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      req.user.orgId,
      name,
      short_name || null,
      description || null,
      renewal_period_months || 12,
      renewal_type || 'anniversary',
      renewal_month || null,
      renewal_day || null,
      total_credits_required || 0,
      grace_period_days || 30
    ]);

    res.status(201).json({ credential: result.rows[0] });
  } catch (err) {
    console.error('Error creating credential:', err);
    res.status(500).json({ error: 'Failed to create credential' });
  }
});

// Update credential
router.put('/:id', requireUser, async (req, res) => {
  const {
    name,
    short_name,
    description,
    renewal_period_months,
    renewal_type,
    renewal_month,
    renewal_day,
    total_credits_required,
    grace_period_days,
    is_active
  } = req.body;

  try {
    const result = await db.query(`
      UPDATE credentials SET
        name = COALESCE($3, name),
        short_name = $4,
        description = $5,
        renewal_period_months = COALESCE($6, renewal_period_months),
        renewal_type = COALESCE($7, renewal_type),
        renewal_month = $8,
        renewal_day = $9,
        total_credits_required = COALESCE($10, total_credits_required),
        grace_period_days = COALESCE($11, grace_period_days),
        is_active = COALESCE($12, is_active)
      WHERE id = $1 AND org_id = $2
      RETURNING *
    `, [
      req.params.id,
      req.user.orgId,
      name,
      short_name,
      description,
      renewal_period_months,
      renewal_type,
      renewal_month,
      renewal_day,
      total_credits_required,
      grace_period_days,
      is_active
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.json({ credential: result.rows[0] });
  } catch (err) {
    console.error('Error updating credential:', err);
    res.status(500).json({ error: 'Failed to update credential' });
  }
});

// Delete credential
router.delete('/:id', requireUser, async (req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM credentials WHERE id = $1 AND org_id = $2 RETURNING id
    `, [req.params.id, req.user.orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting credential:', err);
    res.status(500).json({ error: 'Failed to delete credential' });
  }
});

// ============================================
// ADMIN: Credential Categories
// ============================================

// Add category to credential
router.post('/:id/categories', requireUser, async (req, res) => {
  const { name, description, required_credits, counts_toward_total } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    // Verify credential belongs to org
    const credCheck = await db.query(
      'SELECT id FROM credentials WHERE id = $1 AND org_id = $2',
      [req.params.id, req.user.orgId]
    );

    if (credCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Get max sort order
    const sortResult = await db.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM credential_categories WHERE credential_id = $1',
      [req.params.id]
    );

    const result = await db.query(`
      INSERT INTO credential_categories (
        credential_id, name, description, required_credits, counts_toward_total, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      req.params.id,
      name,
      description || null,
      required_credits || 0,
      counts_toward_total !== false,
      sortResult.rows[0].next_order
    ]);

    res.status(201).json({ category: result.rows[0] });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id/categories/:categoryId', requireUser, async (req, res) => {
  const { name, description, required_credits, counts_toward_total, sort_order, is_active } = req.body;

  try {
    // Verify credential belongs to org
    const credCheck = await db.query(
      'SELECT id FROM credentials WHERE id = $1 AND org_id = $2',
      [req.params.id, req.user.orgId]
    );

    if (credCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const result = await db.query(`
      UPDATE credential_categories SET
        name = COALESCE($3, name),
        description = $4,
        required_credits = COALESCE($5, required_credits),
        counts_toward_total = COALESCE($6, counts_toward_total),
        sort_order = COALESCE($7, sort_order),
        is_active = COALESCE($8, is_active)
      WHERE id = $2 AND credential_id = $1
      RETURNING *
    `, [
      req.params.id,
      req.params.categoryId,
      name,
      description,
      required_credits,
      counts_toward_total,
      sort_order,
      is_active
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category: result.rows[0] });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id/categories/:categoryId', requireUser, async (req, res) => {
  try {
    // Verify credential belongs to org
    const credCheck = await db.query(
      'SELECT id FROM credentials WHERE id = $1 AND org_id = $2',
      [req.params.id, req.user.orgId]
    );

    if (credCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const result = await db.query(`
      DELETE FROM credential_categories WHERE id = $1 AND credential_id = $2 RETURNING id
    `, [req.params.categoryId, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============================================
// ADMIN: Custom Fields
// ============================================

// Add custom field to credential
router.post('/:id/custom-fields', requireUser, async (req, res) => {
  const {
    field_name,
    field_label,
    field_type,
    options,
    is_required,
    min_value,
    max_value,
    max_length,
    placeholder,
    help_text,
    show_on_application,
    show_on_renewal,
    show_on_credit_submission
  } = req.body;

  if (!field_label || !field_type) {
    return res.status(400).json({ error: 'Field label and type are required' });
  }

  try {
    // Verify credential belongs to org
    const credCheck = await db.query(
      'SELECT id FROM credentials WHERE id = $1 AND org_id = $2',
      [req.params.id, req.user.orgId]
    );

    if (credCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Generate field_name from label if not provided
    const safeName = field_name || field_label.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    // Get max sort order
    const sortResult = await db.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM credential_custom_fields WHERE credential_id = $1',
      [req.params.id]
    );

    const result = await db.query(`
      INSERT INTO credential_custom_fields (
        credential_id, field_name, field_label, field_type, options,
        is_required, min_value, max_value, max_length,
        placeholder, help_text, sort_order,
        show_on_application, show_on_renewal, show_on_credit_submission
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      req.params.id,
      safeName,
      field_label,
      field_type,
      options ? JSON.stringify(options) : null,
      is_required || false,
      min_value || null,
      max_value || null,
      max_length || null,
      placeholder || null,
      help_text || null,
      sortResult.rows[0].next_order,
      show_on_application !== false,
      show_on_renewal !== false,
      show_on_credit_submission || false
    ]);

    res.status(201).json({ customField: result.rows[0] });
  } catch (err) {
    console.error('Error creating custom field:', err);
    res.status(500).json({ error: 'Failed to create custom field' });
  }
});

// Update custom field
router.put('/:id/custom-fields/:fieldId', requireUser, async (req, res) => {
  const {
    field_label,
    field_type,
    options,
    is_required,
    min_value,
    max_value,
    max_length,
    placeholder,
    help_text,
    sort_order,
    show_on_application,
    show_on_renewal,
    show_on_credit_submission,
    is_active
  } = req.body;

  try {
    // Verify credential belongs to org
    const credCheck = await db.query(
      'SELECT id FROM credentials WHERE id = $1 AND org_id = $2',
      [req.params.id, req.user.orgId]
    );

    if (credCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const result = await db.query(`
      UPDATE credential_custom_fields SET
        field_label = COALESCE($3, field_label),
        field_type = COALESCE($4, field_type),
        options = COALESCE($5, options),
        is_required = COALESCE($6, is_required),
        min_value = $7,
        max_value = $8,
        max_length = $9,
        placeholder = $10,
        help_text = $11,
        sort_order = COALESCE($12, sort_order),
        show_on_application = COALESCE($13, show_on_application),
        show_on_renewal = COALESCE($14, show_on_renewal),
        show_on_credit_submission = COALESCE($15, show_on_credit_submission),
        is_active = COALESCE($16, is_active)
      WHERE id = $2 AND credential_id = $1
      RETURNING *
    `, [
      req.params.id,
      req.params.fieldId,
      field_label,
      field_type,
      options ? JSON.stringify(options) : null,
      is_required,
      min_value,
      max_value,
      max_length,
      placeholder,
      help_text,
      sort_order,
      show_on_application,
      show_on_renewal,
      show_on_credit_submission,
      is_active
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Custom field not found' });
    }

    res.json({ customField: result.rows[0] });
  } catch (err) {
    console.error('Error updating custom field:', err);
    res.status(500).json({ error: 'Failed to update custom field' });
  }
});

// Delete custom field
router.delete('/:id/custom-fields/:fieldId', requireUser, async (req, res) => {
  try {
    // Verify credential belongs to org
    const credCheck = await db.query(
      'SELECT id FROM credentials WHERE id = $1 AND org_id = $2',
      [req.params.id, req.user.orgId]
    );

    if (credCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const result = await db.query(`
      DELETE FROM credential_custom_fields WHERE id = $1 AND credential_id = $2 RETURNING id
    `, [req.params.fieldId, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Custom field not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting custom field:', err);
    res.status(500).json({ error: 'Failed to delete custom field' });
  }
});

// ============================================
// ADMIN: Member Credentials
// ============================================

// Assign credential to member
router.post('/assign', requireUser, async (req, res) => {
  const {
    member_id,
    credential_id,
    earned_date,
    credential_number,
    notes,
    custom_fields // Object: { field_id: value }
  } = req.body;

  if (!member_id || !credential_id || !earned_date) {
    return res.status(400).json({ error: 'Member, credential, and earned date are required' });
  }

  try {
    // Verify member belongs to org
    const memberCheck = await db.query(
      'SELECT id FROM members WHERE id = $1 AND org_id = $2',
      [member_id, req.user.orgId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Verify credential belongs to org
    const credCheck = await db.query(
      'SELECT * FROM credentials WHERE id = $1 AND org_id = $2',
      [credential_id, req.user.orgId]
    );

    if (credCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const credential = credCheck.rows[0];

    // Calculate renewal period
    const periodResult = await db.query(
      'SELECT * FROM calculate_renewal_period($1, $2)',
      [credential_id, earned_date]
    );

    const period = periodResult.rows[0] || {
      period_start: earned_date,
      period_end: new Date(new Date(earned_date).setMonth(new Date(earned_date).getMonth() + credential.renewal_period_months))
    };

    // Create member credential
    const result = await db.query(`
      INSERT INTO member_credentials (
        member_id, credential_id, earned_date,
        current_period_start, current_period_end,
        credential_number, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING *
    `, [
      member_id,
      credential_id,
      earned_date,
      period.period_start,
      period.period_end,
      credential_number || null,
      notes || null
    ]);

    const memberCredential = result.rows[0];

    // Save custom field values if provided
    if (custom_fields && typeof custom_fields === 'object') {
      for (const [fieldId, value] of Object.entries(custom_fields)) {
        if (value !== null && value !== undefined && value !== '') {
          await db.query(`
            INSERT INTO credential_custom_field_values (member_credential_id, custom_field_id, value)
            VALUES ($1, $2, $3)
            ON CONFLICT (member_credential_id, custom_field_id) DO UPDATE SET value = $3
          `, [memberCredential.id, fieldId, String(value)]);
        }
      }
    }

    res.status(201).json({ memberCredential });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Member already has this credential' });
    }
    console.error('Error assigning credential:', err);
    res.status(500).json({ error: 'Failed to assign credential' });
  }
});

// Get members with a specific credential
router.get('/:id/members', requireUser, async (req, res) => {
  try {
    // Verify credential belongs to org
    const credCheck = await db.query(
      'SELECT id FROM credentials WHERE id = $1 AND org_id = $2',
      [req.params.id, req.user.orgId]
    );

    if (credCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const result = await db.query(`
      SELECT
        mc.*,
        m.first_name,
        m.last_name,
        m.email,
        mcp.credits_earned,
        mcp.credits_remaining,
        mcp.progress_status
      FROM member_credentials mc
      JOIN members m ON m.id = mc.member_id
      LEFT JOIN member_credential_progress mcp ON mcp.member_credential_id = mc.id
      WHERE mc.credential_id = $1
      ORDER BY m.last_name, m.first_name
    `, [req.params.id]);

    res.json({ members: result.rows });
  } catch (err) {
    console.error('Error fetching credential members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Update member credential
router.put('/member-credentials/:id', requireUser, async (req, res) => {
  const {
    earned_date,
    current_period_start,
    current_period_end,
    credential_number,
    notes,
    status
  } = req.body;

  try {
    // Verify member credential belongs to org
    const mcCheck = await db.query(`
      SELECT mc.* FROM member_credentials mc
      JOIN credentials c ON c.id = mc.credential_id
      WHERE mc.id = $1 AND c.org_id = $2
    `, [req.params.id, req.user.orgId]);

    if (mcCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Member credential not found' });
    }

    const result = await db.query(`
      UPDATE member_credentials SET
        earned_date = COALESCE($2, earned_date),
        current_period_start = COALESCE($3, current_period_start),
        current_period_end = COALESCE($4, current_period_end),
        credential_number = $5,
        notes = $6,
        status = COALESCE($7, status)
      WHERE id = $1
      RETURNING *
    `, [
      req.params.id,
      earned_date,
      current_period_start,
      current_period_end,
      credential_number,
      notes,
      status
    ]);

    res.json({ memberCredential: result.rows[0] });
  } catch (err) {
    console.error('Error updating member credential:', err);
    res.status(500).json({ error: 'Failed to update member credential' });
  }
});

// Revoke member credential
router.delete('/member-credentials/:id', requireUser, async (req, res) => {
  try {
    // Verify member credential belongs to org
    const mcCheck = await db.query(`
      SELECT mc.* FROM member_credentials mc
      JOIN credentials c ON c.id = mc.credential_id
      WHERE mc.id = $1 AND c.org_id = $2
    `, [req.params.id, req.user.orgId]);

    if (mcCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Member credential not found' });
    }

    await db.query('DELETE FROM member_credentials WHERE id = $1', [req.params.id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error revoking member credential:', err);
    res.status(500).json({ error: 'Failed to revoke credential' });
  }
});

// ============================================
// ADMIN: CEU Credits for Member Credentials
// ============================================

// Add CEU credit to member's credential
router.post('/member-credentials/:id/credits', requireUser, async (req, res) => {
  const {
    title,
    credits,
    credential_category_id,
    provider,
    completed_at,
    certificate_url,
    certificate_number,
    description,
    status // admin can set status directly
  } = req.body;

  if (!title || !credits || !completed_at) {
    return res.status(400).json({ error: 'Title, credits, and completion date are required' });
  }

  try {
    // Verify member credential belongs to org
    const mcCheck = await db.query(`
      SELECT mc.*, c.org_id FROM member_credentials mc
      JOIN credentials c ON c.id = mc.credential_id
      WHERE mc.id = $1 AND c.org_id = $2
    `, [req.params.id, req.user.orgId]);

    if (mcCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Member credential not found' });
    }

    const memberCredential = mcCheck.rows[0];

    const result = await db.query(`
      INSERT INTO ceu_credits (
        member_id, member_credential_id, credential_category_id,
        title, credits, provider, completed_at,
        certificate_url, certificate_number, description,
        status, verified_by, verified_at, submitted_by_member
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false)
      RETURNING *
    `, [
      memberCredential.member_id,
      req.params.id,
      credential_category_id || null,
      title,
      credits,
      provider || null,
      completed_at,
      certificate_url || null,
      certificate_number || null,
      description || null,
      status || 'verified', // Admin-added credits are auto-verified
      status === 'verified' ? req.user.id : null,
      status === 'verified' ? new Date() : null
    ]);

    res.status(201).json({ credit: result.rows[0] });
  } catch (err) {
    console.error('Error adding credit:', err);
    res.status(500).json({ error: 'Failed to add credit' });
  }
});

// Get credits for a member credential
router.get('/member-credentials/:id/credits', requireUser, async (req, res) => {
  try {
    // Verify member credential belongs to org
    const mcCheck = await db.query(`
      SELECT mc.* FROM member_credentials mc
      JOIN credentials c ON c.id = mc.credential_id
      WHERE mc.id = $1 AND c.org_id = $2
    `, [req.params.id, req.user.orgId]);

    if (mcCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Member credential not found' });
    }

    const result = await db.query(`
      SELECT cc.*, cat.name AS category_name
      FROM ceu_credits cc
      LEFT JOIN credential_categories cat ON cat.id = cc.credential_category_id
      WHERE cc.member_credential_id = $1
      ORDER BY cc.completed_at DESC
    `, [req.params.id]);

    res.json({ credits: result.rows });
  } catch (err) {
    console.error('Error fetching credits:', err);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

// ============================================
// MEMBER: View own credentials and progress
// ============================================

// Get member's credentials with progress
router.get('/member/my-credentials', requireUser, async (req, res) => {
  if (req.user.type !== 'member') {
    return res.status(403).json({ error: 'Member access required' });
  }

  try {
    const result = await db.query(`
      SELECT
        mc.*,
        c.name AS credential_name,
        c.short_name AS credential_short_name,
        c.description AS credential_description,
        c.total_credits_required,
        c.renewal_period_months,
        mcp.credits_earned,
        mcp.credits_remaining,
        mcp.progress_status
      FROM member_credentials mc
      JOIN credentials c ON c.id = mc.credential_id
      LEFT JOIN member_credential_progress mcp ON mcp.member_credential_id = mc.id
      WHERE mc.member_id = $1
      ORDER BY mc.current_period_end ASC
    `, [req.user.memberId]);

    // For each credential, get category progress
    const credentialsWithCategories = await Promise.all(result.rows.map(async (cred) => {
      const catResult = await db.query(`
        SELECT
          cat.id,
          cat.name,
          cat.required_credits,
          COALESCE(SUM(
            CASE WHEN cc.status = 'verified'
                 AND cc.completed_at >= $2
                 AND cc.completed_at <= $3
            THEN cc.credits ELSE 0 END
          ), 0) AS earned
        FROM credential_categories cat
        LEFT JOIN ceu_credits cc ON cc.credential_category_id = cat.id
          AND cc.member_credential_id = $1
        WHERE cat.credential_id = $4 AND cat.is_active = true
        GROUP BY cat.id, cat.name, cat.required_credits
        ORDER BY cat.sort_order
      `, [cred.id, cred.current_period_start, cred.current_period_end, cred.credential_id]);

      return {
        ...cred,
        categories: catResult.rows
      };
    }));

    res.json({ credentials: credentialsWithCategories });
  } catch (err) {
    console.error('Error fetching member credentials:', err);
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

// Get single credential detail with all progress
router.get('/member/my-credentials/:id', requireUser, async (req, res) => {
  if (req.user.type !== 'member') {
    return res.status(403).json({ error: 'Member access required' });
  }

  try {
    const mcResult = await db.query(`
      SELECT
        mc.*,
        c.name AS credential_name,
        c.short_name AS credential_short_name,
        c.description AS credential_description,
        c.total_credits_required,
        c.renewal_period_months,
        mcp.credits_earned,
        mcp.credits_remaining,
        mcp.progress_status
      FROM member_credentials mc
      JOIN credentials c ON c.id = mc.credential_id
      LEFT JOIN member_credential_progress mcp ON mcp.member_credential_id = mc.id
      WHERE mc.id = $1 AND mc.member_id = $2
    `, [req.params.id, req.user.memberId]);

    if (mcResult.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const credential = mcResult.rows[0];

    // Get categories with progress
    const catResult = await db.query(`
      SELECT
        cat.id,
        cat.name,
        cat.description,
        cat.required_credits,
        COALESCE(SUM(
          CASE WHEN cc.status = 'verified'
               AND cc.completed_at >= $2
               AND cc.completed_at <= $3
          THEN cc.credits ELSE 0 END
        ), 0) AS earned
      FROM credential_categories cat
      LEFT JOIN ceu_credits cc ON cc.credential_category_id = cat.id
        AND cc.member_credential_id = $1
      WHERE cat.credential_id = $4 AND cat.is_active = true
      GROUP BY cat.id, cat.name, cat.description, cat.required_credits, cat.sort_order
      ORDER BY cat.sort_order
    `, [req.params.id, credential.current_period_start, credential.current_period_end, credential.credential_id]);

    // Get recent credits
    const creditsResult = await db.query(`
      SELECT cc.*, cat.name AS category_name
      FROM ceu_credits cc
      LEFT JOIN credential_categories cat ON cat.id = cc.credential_category_id
      WHERE cc.member_credential_id = $1
      ORDER BY cc.completed_at DESC
      LIMIT 10
    `, [req.params.id]);

    // Get custom fields for credit submission
    const fieldsResult = await db.query(`
      SELECT * FROM credential_custom_fields
      WHERE credential_id = $1 AND show_on_credit_submission = true AND is_active = true
      ORDER BY sort_order
    `, [credential.credential_id]);

    res.json({
      credential,
      categories: catResult.rows,
      recentCredits: creditsResult.rows,
      customFields: fieldsResult.rows
    });
  } catch (err) {
    console.error('Error fetching credential detail:', err);
    res.status(500).json({ error: 'Failed to fetch credential' });
  }
});

// Member submit CEU credit
router.post('/member/my-credentials/:id/credits', requireUser, async (req, res) => {
  if (req.user.type !== 'member') {
    return res.status(403).json({ error: 'Member access required' });
  }

  const {
    title,
    credits,
    credential_category_id,
    provider,
    completed_at,
    certificate_url,
    certificate_number,
    description,
    custom_fields
  } = req.body;

  if (!title || !credits || !completed_at) {
    return res.status(400).json({ error: 'Title, credits, and completion date are required' });
  }

  try {
    // Verify member credential belongs to this member
    const mcCheck = await db.query(`
      SELECT * FROM member_credentials WHERE id = $1 AND member_id = $2
    `, [req.params.id, req.user.memberId]);

    if (mcCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const result = await db.query(`
      INSERT INTO ceu_credits (
        member_id, member_credential_id, credential_category_id,
        title, credits, provider, completed_at,
        certificate_url, certificate_number, description,
        status, submitted_by_member
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', true)
      RETURNING *
    `, [
      req.user.memberId,
      req.params.id,
      credential_category_id || null,
      title,
      credits,
      provider || null,
      completed_at,
      certificate_url || null,
      certificate_number || null,
      description || null
    ]);

    res.status(201).json({ credit: result.rows[0] });
  } catch (err) {
    console.error('Error submitting credit:', err);
    res.status(500).json({ error: 'Failed to submit credit' });
  }
});

// Get member's credits for a credential
router.get('/member/my-credentials/:id/credits', requireUser, async (req, res) => {
  if (req.user.type !== 'member') {
    return res.status(403).json({ error: 'Member access required' });
  }

  try {
    // Verify member credential belongs to this member
    const mcCheck = await db.query(`
      SELECT * FROM member_credentials WHERE id = $1 AND member_id = $2
    `, [req.params.id, req.user.memberId]);

    if (mcCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const result = await db.query(`
      SELECT cc.*, cat.name AS category_name
      FROM ceu_credits cc
      LEFT JOIN credential_categories cat ON cat.id = cc.credential_category_id
      WHERE cc.member_credential_id = $1
      ORDER BY cc.completed_at DESC
    `, [req.params.id]);

    res.json({ credits: result.rows });
  } catch (err) {
    console.error('Error fetching credits:', err);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

module.exports = router;
