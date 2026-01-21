const express = require('express');
const router = express.Router();
const db = require('../../db');
const automationEngine = require('../../lib/automation-engine');

// ============================================
// GET ACTIVITIES FOR CONTACT (Timeline)
// ============================================

router.get('/contact/:contactId', async (req, res) => {
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

    // Get activities
    const result = await db.query(
      `SELECT * FROM crm_activity_summary
       WHERE contact_id = $1 AND org_id = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [contactId, req.user.orgId, limit, offset]
    );

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM crm_activities WHERE contact_id = $1 AND org_id = $2',
      [contactId, req.user.orgId]
    );

    res.json({
      activities: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('Get contact activities error:', err);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

// ============================================
// GET MY TASKS
// ============================================

router.get('/tasks', async (req, res) => {
  try {
    const { status = 'pending', limit = 50 } = req.query;

    const result = await db.query(
      `SELECT * FROM crm_activity_summary
       WHERE org_id = $1
         AND assigned_to = $2
         AND type = 'task'
         AND status = $3
       ORDER BY
         CASE priority
           WHEN 'urgent' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END,
         due_at ASC NULLS LAST
       LIMIT $4`,
      [req.user.orgId, req.user.id, status, limit]
    );

    res.json({ tasks: result.rows });

  } catch (err) {
    console.error('Get my tasks error:', err);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// ============================================
// CREATE ACTIVITY
// ============================================

router.post('/', async (req, res) => {
  try {
    const {
      contact_id,
      type,
      title,
      description,
      scheduled_at,
      due_at,
      assigned_to,
      priority,
      status,
      metadata,
      is_visible_to_contact
    } = req.body;

    // Validation
    if (!contact_id || !type || !title) {
      return res.status(400).json({ error: 'Missing required fields: contact_id, type, title' });
    }

    const validTypes = ['note', 'email', 'call', 'meeting', 'task', 'system'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid activity type' });
    }

    // Verify contact belongs to org
    const contactCheck = await db.query(
      'SELECT id FROM crm_contacts WHERE id = $1 AND org_id = $2',
      [contact_id, req.user.orgId]
    );

    if (contactCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Create activity
    const result = await db.query(
      `INSERT INTO crm_activities (
        org_id, contact_id, type, title, description,
        scheduled_at, due_at, assigned_to, priority, status,
        metadata, created_by, is_visible_to_contact
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        req.user.orgId,
        contact_id,
        type,
        title,
        description || null,
        scheduled_at || null,
        due_at || null,
        assigned_to || null,
        priority || 'medium',
        status || 'pending',
        metadata || {},
        req.user.id,
        is_visible_to_contact || false
      ]
    );

    // Update contact's last_contacted_at if activity is completed
    if (type !== 'task' || status === 'completed') {
      await db.query(
        'UPDATE crm_contacts SET last_contacted_at = NOW() WHERE id = $1',
        [contact_id]
      );
    }

    const activity = result.rows[0];

    // Trigger activity_logged automation (async, don't wait)
    setImmediate(async () => {
      try {
        await automationEngine.trigger('activity_logged', {
          org_id: req.user.orgId,
          contact_id: contact_id,
          activity_type: type,
          activity_title: title,
          activity_id: activity.id,
          created_by: req.user.id
        });
      } catch (err) {
        console.error('[Automation] Error triggering activity_logged automation:', err);
      }
    });

    res.status(201).json({ activity });

  } catch (err) {
    console.error('Create activity error:', err);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// ============================================
// UPDATE ACTIVITY
// ============================================

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      scheduled_at,
      due_at,
      assigned_to,
      priority,
      status,
      metadata,
      is_visible_to_contact
    } = req.body;

    // Check activity exists and belongs to org
    const activityCheck = await db.query(
      'SELECT id FROM crm_activities WHERE id = $1 AND org_id = $2',
      [id, req.user.orgId]
    );

    if (activityCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (scheduled_at !== undefined) {
      updates.push(`scheduled_at = $${paramIndex++}`);
      values.push(scheduled_at);
    }
    if (due_at !== undefined) {
      updates.push(`due_at = $${paramIndex++}`);
      values.push(due_at);
    }
    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${paramIndex++}`);
      values.push(assigned_to);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(priority);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);

      // If marked completed, set completed_at and completed_by
      if (status === 'completed') {
        updates.push(`completed_at = NOW()`);
        updates.push(`completed_by = $${paramIndex++}`);
        values.push(req.user.id);
      }
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(metadata);
    }
    if (is_visible_to_contact !== undefined) {
      updates.push(`is_visible_to_contact = $${paramIndex++}`);
      values.push(is_visible_to_contact);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add id to values
    values.push(id);

    const result = await db.query(
      `UPDATE crm_activities SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    res.json({ activity: result.rows[0] });

  } catch (err) {
    console.error('Update activity error:', err);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// ============================================
// COMPLETE TASK
// ============================================

router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    // Check activity exists and is a task
    const activityCheck = await db.query(
      'SELECT id, type, contact_id FROM crm_activities WHERE id = $1 AND org_id = $2',
      [id, req.user.orgId]
    );

    if (activityCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const activity = activityCheck.rows[0];

    // Update activity
    const result = await db.query(
      `UPDATE crm_activities
       SET status = 'completed',
           completed_at = NOW(),
           completed_by = $1
       WHERE id = $2
       RETURNING *`,
      [req.user.id, id]
    );

    // Update contact's last_contacted_at
    await db.query(
      'UPDATE crm_contacts SET last_contacted_at = NOW() WHERE id = $1',
      [activity.contact_id]
    );

    res.json({ activity: result.rows[0] });

  } catch (err) {
    console.error('Complete task error:', err);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// ============================================
// DELETE ACTIVITY
// ============================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check activity exists
    const activityCheck = await db.query(
      'SELECT id FROM crm_activities WHERE id = $1 AND org_id = $2',
      [id, req.user.orgId]
    );

    if (activityCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    await db.query('DELETE FROM crm_activities WHERE id = $1', [id]);

    res.json({ message: 'Activity deleted successfully' });

  } catch (err) {
    console.error('Delete activity error:', err);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

module.exports = router;
