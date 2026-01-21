const express = require('express');
const router = express.Router();
const db = require('../../db');

// ============================================
// LIST AUTOMATIONS
// ============================================

router.get('/', async (req, res) => {
  try {
    const { pipeline_id, trigger_type, is_active } = req.query;

    let query = `
      SELECT
        a.*,
        p.name AS pipeline_name,
        u.name AS created_by_name,
        (SELECT COUNT(*) FROM crm_automation_executions ae
         WHERE ae.automation_id = a.id AND ae.status = 'completed') AS execution_count,
        (SELECT MAX(triggered_at) FROM crm_automation_executions ae
         WHERE ae.automation_id = a.id) AS last_run,
        (SELECT COUNT(*) * 100.0 / NULLIF(COUNT(*), 0)
         FROM crm_automation_executions ae
         WHERE ae.automation_id = a.id AND ae.status = 'completed') AS success_rate
      FROM crm_automations a
      LEFT JOIN crm_pipelines p ON p.id = a.pipeline_id
      LEFT JOIN users u ON u.id = a.created_by
      WHERE a.org_id = $1
    `;

    const params = [req.user.orgId];
    let paramIndex = 2;

    if (pipeline_id) {
      query += ` AND a.pipeline_id = $${paramIndex}`;
      params.push(pipeline_id);
      paramIndex++;
    }

    if (trigger_type) {
      query += ` AND a.trigger_type = $${paramIndex}`;
      params.push(trigger_type);
      paramIndex++;
    }

    if (is_active !== undefined) {
      query += ` AND a.is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    query += ` ORDER BY a.priority DESC, a.created_at DESC`;

    const result = await db.query(query, params);

    res.json({ automations: result.rows });

  } catch (err) {
    console.error('List automations error:', err);
    res.status(500).json({ error: 'Failed to list automations' });
  }
});

// ============================================
// GET SINGLE AUTOMATION
// ============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT a.*, p.name AS pipeline_name
       FROM crm_automations a
       LEFT JOIN crm_pipelines p ON p.id = a.pipeline_id
       WHERE a.id = $1 AND a.org_id = $2`,
      [id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    res.json({ automation: result.rows[0] });

  } catch (err) {
    console.error('Get automation error:', err);
    res.status(500).json({ error: 'Failed to get automation' });
  }
});

// ============================================
// CREATE AUTOMATION
// ============================================

router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      trigger_type,
      trigger_config,
      conditions,
      actions,
      pipeline_id,
      is_active,
      run_once_per_contact,
      priority
    } = req.body;

    // Validation
    if (!name || !trigger_type || !actions) {
      return res.status(400).json({ error: 'Missing required fields: name, trigger_type, actions' });
    }

    if (!Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ error: 'actions must be a non-empty array' });
    }

    // Validate trigger type
    const validTriggers = [
      'stage_entered', 'stage_exited', 'time_in_stage', 'no_activity',
      'tag_added', 'tag_removed', 'field_changed', 'activity_logged', 'scheduled'
    ];

    if (!validTriggers.includes(trigger_type)) {
      return res.status(400).json({ error: 'Invalid trigger_type' });
    }

    // Verify pipeline belongs to org (if specified)
    if (pipeline_id) {
      const pipelineCheck = await db.query(
        'SELECT id FROM crm_pipelines WHERE id = $1 AND org_id = $2',
        [pipeline_id, req.user.orgId]
      );

      if (pipelineCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Pipeline not found' });
      }
    }

    // Create automation
    const result = await db.query(
      `INSERT INTO crm_automations (
        org_id, name, description, trigger_type, trigger_config,
        conditions, actions, pipeline_id, is_active, run_once_per_contact,
        priority, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        req.user.orgId,
        name,
        description || null,
        trigger_type,
        JSON.stringify(trigger_config || {}),
        JSON.stringify(conditions || []),
        JSON.stringify(actions),
        pipeline_id || null,
        is_active !== undefined ? is_active : true,
        run_once_per_contact || false,
        priority || 0,
        req.user.id
      ]
    );

    res.status(201).json({ automation: result.rows[0] });

  } catch (err) {
    console.error('Create automation error:', err);
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Automation with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create automation' });
  }
});

// ============================================
// UPDATE AUTOMATION
// ============================================

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      trigger_type,
      trigger_config,
      conditions,
      actions,
      pipeline_id,
      is_active,
      run_once_per_contact,
      priority
    } = req.body;

    // Check automation exists
    const checkResult = await db.query(
      'SELECT id FROM crm_automations WHERE id = $1 AND org_id = $2',
      [id, req.user.orgId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    // Build update query dynamically
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

    if (trigger_type !== undefined) {
      updates.push(`trigger_type = $${paramIndex}`);
      params.push(trigger_type);
      paramIndex++;
    }

    if (trigger_config !== undefined) {
      updates.push(`trigger_config = $${paramIndex}`);
      params.push(JSON.stringify(trigger_config));
      paramIndex++;
    }

    if (conditions !== undefined) {
      updates.push(`conditions = $${paramIndex}`);
      params.push(JSON.stringify(conditions));
      paramIndex++;
    }

    if (actions !== undefined) {
      updates.push(`actions = $${paramIndex}`);
      params.push(JSON.stringify(actions));
      paramIndex++;
    }

    if (pipeline_id !== undefined) {
      updates.push(`pipeline_id = $${paramIndex}`);
      params.push(pipeline_id);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(is_active);
      paramIndex++;
    }

    if (run_once_per_contact !== undefined) {
      updates.push(`run_once_per_contact = $${paramIndex}`);
      params.push(run_once_per_contact);
      paramIndex++;
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id, req.user.orgId);

    const query = `
      UPDATE crm_automations
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await db.query(query, params);

    res.json({ automation: result.rows[0] });

  } catch (err) {
    console.error('Update automation error:', err);
    res.status(500).json({ error: 'Failed to update automation' });
  }
});

// ============================================
// TOGGLE AUTOMATION ACTIVE STATUS
// ============================================

router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE crm_automations
       SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    res.json({ automation: result.rows[0] });

  } catch (err) {
    console.error('Toggle automation error:', err);
    res.status(500).json({ error: 'Failed to toggle automation' });
  }
});

// ============================================
// DELETE AUTOMATION
// ============================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM crm_automations WHERE id = $1 AND org_id = $2 RETURNING id',
      [id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    res.json({ success: true, message: 'Automation deleted successfully' });

  } catch (err) {
    console.error('Delete automation error:', err);
    res.status(500).json({ error: 'Failed to delete automation' });
  }
});

// ============================================
// GET AUTOMATION EXECUTION HISTORY
// ============================================

router.get('/:id/executions', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    // Verify automation belongs to org
    const automationCheck = await db.query(
      'SELECT id FROM crm_automations WHERE id = $1 AND org_id = $2',
      [id, req.user.orgId]
    );

    if (automationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    let query = `
      SELECT
        ae.*,
        c.first_name, c.last_name, c.email,
        EXTRACT(EPOCH FROM (COALESCE(ae.completed_at, NOW()) - ae.started_at)) AS duration_seconds
      FROM crm_automation_executions ae
      JOIN crm_contacts c ON c.id = ae.contact_id
      WHERE ae.automation_id = $1
    `;

    const params = [id];
    let paramIndex = 2;

    if (status) {
      query += ` AND ae.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY ae.triggered_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    const countQuery = status
      ? 'SELECT COUNT(*) FROM crm_automation_executions WHERE automation_id = $1 AND status = $2'
      : 'SELECT COUNT(*) FROM crm_automation_executions WHERE automation_id = $1';
    const countParams = status ? [id, status] : [id];
    const countResult = await db.query(countQuery, countParams);

    res.json({
      executions: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('Get execution history error:', err);
    res.status(500).json({ error: 'Failed to get execution history' });
  }
});

// ============================================
// GET EXECUTIONS FOR A CONTACT
// ============================================

router.get('/contact/:contactId/executions', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify contact belongs to org
    const contactCheck = await db.query(
      'SELECT id FROM crm_contacts WHERE id = $1 AND org_id = $2',
      [contactId, req.user.orgId]
    );

    if (contactCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const result = await db.query(
      `SELECT
        ae.*,
        a.name AS automation_name,
        a.trigger_type
       FROM crm_automation_executions ae
       JOIN crm_automations a ON a.id = ae.automation_id
       WHERE ae.contact_id = $1 AND ae.org_id = $2
       ORDER BY ae.triggered_at DESC
       LIMIT $3 OFFSET $4`,
      [contactId, req.user.orgId, limit, offset]
    );

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM crm_automation_executions WHERE contact_id = $1 AND org_id = $2',
      [contactId, req.user.orgId]
    );

    res.json({
      executions: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('Get contact executions error:', err);
    res.status(500).json({ error: 'Failed to get contact executions' });
  }
});

// ============================================
// GET AUTOMATION STATS (Dashboard)
// ============================================

router.get('/stats/dashboard', async (req, res) => {
  try {
    // Total active automations
    const activeResult = await db.query(
      'SELECT COUNT(*) FROM crm_automations WHERE org_id = $1 AND is_active = TRUE',
      [req.user.orgId]
    );

    // Executions today
    const todayResult = await db.query(
      `SELECT COUNT(*) FROM crm_automation_executions
       WHERE org_id = $1 AND triggered_at >= CURRENT_DATE`,
      [req.user.orgId]
    );

    // Failed executions this week
    const failedResult = await db.query(
      `SELECT COUNT(*) FROM crm_automation_executions
       WHERE org_id = $1
       AND status = 'failed'
       AND triggered_at >= CURRENT_DATE - INTERVAL '7 days'`,
      [req.user.orgId]
    );

    // Top performing automations
    const topResult = await db.query(
      `SELECT
        a.id, a.name,
        COUNT(ae.id) AS execution_count,
        COUNT(CASE WHEN ae.status = 'completed' THEN 1 END) AS successful_count
       FROM crm_automations a
       LEFT JOIN crm_automation_executions ae ON ae.automation_id = a.id
       WHERE a.org_id = $1 AND a.is_active = TRUE
       GROUP BY a.id, a.name
       ORDER BY execution_count DESC
       LIMIT 5`,
      [req.user.orgId]
    );

    res.json({
      total_active: parseInt(activeResult.rows[0].count),
      total_executions_today: parseInt(todayResult.rows[0].count),
      failed_this_week: parseInt(failedResult.rows[0].count),
      top_performers: topResult.rows
    });

  } catch (err) {
    console.error('Get automation stats error:', err);
    res.status(500).json({ error: 'Failed to get automation stats' });
  }
});

module.exports = router;
