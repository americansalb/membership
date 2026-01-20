const express = require('express');
const router = express.Router();
const db = require('../../db');

// ============================================
// LIST PIPELINES
// ============================================

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        p.*,
        u.name AS created_by_name,
        (SELECT COUNT(*) FROM crm_stages WHERE pipeline_id = p.id AND is_active = true) AS active_stages_count,
        (SELECT COUNT(DISTINCT cs.contact_id)
         FROM crm_contact_stages cs
         WHERE cs.pipeline_id = p.id AND cs.exited_at IS NULL) AS contacts_count
      FROM crm_pipelines p
      LEFT JOIN users u ON u.id = p.created_by
      WHERE p.org_id = $1
      ORDER BY p.is_default DESC, p.created_at ASC`,
      [req.user.orgId]
    );

    res.json({ pipelines: result.rows });

  } catch (err) {
    console.error('List pipelines error:', err);
    res.status(500).json({ error: 'Failed to list pipelines' });
  }
});

// ============================================
// CREATE PIPELINE
// ============================================

router.post('/', async (req, res) => {
  try {
    const { name, description, color, icon, is_default } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Pipeline name is required' });
    }

    // Check for duplicate name
    const duplicateCheck = await db.query(
      'SELECT id FROM crm_pipelines WHERE org_id = $1 AND name = $2',
      [req.user.orgId, name]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Pipeline with this name already exists' });
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await db.query(
        'UPDATE crm_pipelines SET is_default = false WHERE org_id = $1',
        [req.user.orgId]
      );
    }

    const result = await db.query(
      `INSERT INTO crm_pipelines (org_id, name, description, color, icon, is_default, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.orgId, name, description, color || '#6366f1', icon, is_default || false, req.user.id]
    );

    res.status(201).json({ pipeline: result.rows[0] });

  } catch (err) {
    console.error('Create pipeline error:', err);
    res.status(500).json({ error: 'Failed to create pipeline' });
  }
});

// ============================================
// GET PIPELINE WITH STAGES
// ============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get pipeline
    const pipelineResult = await db.query(
      `SELECT
        p.*,
        u.first_name AS created_by_first_name,
        u.last_name AS created_by_last_name
      FROM crm_pipelines p
      LEFT JOIN users u ON u.id = p.created_by
      WHERE p.id = $1 AND p.org_id = $2`,
      [id, req.user.orgId]
    );

    if (pipelineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    // Get stages with contact counts
    const stagesResult = await db.query(
      `SELECT
        s.*,
        (SELECT COUNT(DISTINCT cs.contact_id)
         FROM crm_contact_stages cs
         WHERE cs.stage_id = s.id AND cs.exited_at IS NULL) AS contacts_count
      FROM crm_stages s
      WHERE s.pipeline_id = $1 AND s.org_id = $2
      ORDER BY s.sort_order ASC, s.created_at ASC`,
      [id, req.user.orgId]
    );

    res.json({
      pipeline: pipelineResult.rows[0],
      stages: stagesResult.rows
    });

  } catch (err) {
    console.error('Get pipeline error:', err);
    res.status(500).json({ error: 'Failed to get pipeline' });
  }
});

// ============================================
// UPDATE PIPELINE
// ============================================

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, is_active, is_default } = req.body;

    // Check if pipeline exists
    const checkResult = await db.query(
      'SELECT id FROM crm_pipelines WHERE id = $1 AND org_id = $2',
      [id, req.user.orgId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    // Check for duplicate name if name is being changed
    if (name) {
      const duplicateCheck = await db.query(
        'SELECT id FROM crm_pipelines WHERE org_id = $1 AND name = $2 AND id != $3',
        [req.user.orgId, name, id]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Another pipeline with this name already exists' });
      }
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await db.query(
        'UPDATE crm_pipelines SET is_default = false WHERE org_id = $1 AND id != $2',
        [req.user.orgId, id]
      );
    }

    // Build update query
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
    if (color !== undefined) {
      updates.push(`color = $${paramIndex}`);
      params.push(color);
      paramIndex++;
    }
    if (icon !== undefined) {
      updates.push(`icon = $${paramIndex}`);
      params.push(icon);
      paramIndex++;
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(is_active);
      paramIndex++;
    }
    if (is_default !== undefined) {
      updates.push(`is_default = $${paramIndex}`);
      params.push(is_default);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id, req.user.orgId);

    const query = `
      UPDATE crm_pipelines
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await db.query(query, params);

    res.json({ pipeline: result.rows[0] });

  } catch (err) {
    console.error('Update pipeline error:', err);
    res.status(500).json({ error: 'Failed to update pipeline' });
  }
});

// ============================================
// DELETE PIPELINE
// ============================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if pipeline has contacts
    const contactsCheck = await db.query(
      'SELECT COUNT(*) FROM crm_contact_stages WHERE pipeline_id = $1 AND exited_at IS NULL',
      [id]
    );

    if (parseInt(contactsCheck.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Cannot delete pipeline with active contacts. Move contacts to another pipeline first.'
      });
    }

    const result = await db.query(
      'DELETE FROM crm_pipelines WHERE id = $1 AND org_id = $2 RETURNING id',
      [id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    res.json({ message: 'Pipeline deleted successfully' });

  } catch (err) {
    console.error('Delete pipeline error:', err);
    res.status(500).json({ error: 'Failed to delete pipeline' });
  }
});

// ============================================
// ADD STAGE TO PIPELINE
// ============================================

router.post('/:id/stages', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      color,
      sort_order,
      is_initial,
      is_closed_won,
      is_closed_lost,
      auto_assign_to,
      auto_add_tags
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Stage name is required' });
    }

    // Verify pipeline exists
    const pipelineCheck = await db.query(
      'SELECT id FROM crm_pipelines WHERE id = $1 AND org_id = $2',
      [id, req.user.orgId]
    );

    if (pipelineCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    // Check for duplicate stage name in pipeline
    const duplicateCheck = await db.query(
      'SELECT id FROM crm_stages WHERE pipeline_id = $1 AND name = $2',
      [id, name]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Stage with this name already exists in pipeline' });
    }

    // Get max sort_order if not provided
    let finalSortOrder = sort_order;
    if (finalSortOrder === undefined) {
      const maxSortResult = await db.query(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort FROM crm_stages WHERE pipeline_id = $1',
        [id]
      );
      finalSortOrder = maxSortResult.rows[0].next_sort;
    }

    const result = await db.query(
      `INSERT INTO crm_stages (
        pipeline_id, org_id, name, description, color, sort_order,
        is_initial, is_closed_won, is_closed_lost, auto_assign_to, auto_add_tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        id,
        req.user.orgId,
        name,
        description,
        color || '#6366f1',
        finalSortOrder,
        is_initial || false,
        is_closed_won || false,
        is_closed_lost || false,
        auto_assign_to,
        auto_add_tags || []
      ]
    );

    res.status(201).json({ stage: result.rows[0] });

  } catch (err) {
    console.error('Add stage error:', err);
    res.status(500).json({ error: 'Failed to add stage' });
  }
});

// ============================================
// UPDATE STAGE
// ============================================

router.put('/:pipelineId/stages/:stageId', async (req, res) => {
  try {
    const { pipelineId, stageId } = req.params;
    const {
      name,
      description,
      color,
      sort_order,
      is_active,
      is_initial,
      is_closed_won,
      is_closed_lost,
      auto_assign_to,
      auto_add_tags
    } = req.body;

    // Verify stage exists and belongs to pipeline
    const checkResult = await db.query(
      'SELECT id FROM crm_stages WHERE id = $1 AND pipeline_id = $2 AND org_id = $3',
      [stageId, pipelineId, req.user.orgId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    // Check for duplicate name if name is being changed
    if (name) {
      const duplicateCheck = await db.query(
        'SELECT id FROM crm_stages WHERE pipeline_id = $1 AND name = $2 AND id != $3',
        [pipelineId, name, stageId]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Another stage with this name already exists in pipeline' });
      }
    }

    // Build update query
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
    if (color !== undefined) {
      updates.push(`color = $${paramIndex}`);
      params.push(color);
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
    if (is_initial !== undefined) {
      updates.push(`is_initial = $${paramIndex}`);
      params.push(is_initial);
      paramIndex++;
    }
    if (is_closed_won !== undefined) {
      updates.push(`is_closed_won = $${paramIndex}`);
      params.push(is_closed_won);
      paramIndex++;
    }
    if (is_closed_lost !== undefined) {
      updates.push(`is_closed_lost = $${paramIndex}`);
      params.push(is_closed_lost);
      paramIndex++;
    }
    if (auto_assign_to !== undefined) {
      updates.push(`auto_assign_to = $${paramIndex}`);
      params.push(auto_assign_to);
      paramIndex++;
    }
    if (auto_add_tags !== undefined) {
      updates.push(`auto_add_tags = $${paramIndex}`);
      params.push(auto_add_tags);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(stageId, pipelineId, req.user.orgId);

    const query = `
      UPDATE crm_stages
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND pipeline_id = $${paramIndex + 1} AND org_id = $${paramIndex + 2}
      RETURNING *
    `;

    const result = await db.query(query, params);

    res.json({ stage: result.rows[0] });

  } catch (err) {
    console.error('Update stage error:', err);
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

// ============================================
// DELETE STAGE
// ============================================

router.delete('/:pipelineId/stages/:stageId', async (req, res) => {
  try {
    const { pipelineId, stageId } = req.params;

    // Check if stage has active contacts
    const contactsCheck = await db.query(
      'SELECT COUNT(*) FROM crm_contact_stages WHERE stage_id = $1 AND exited_at IS NULL',
      [stageId]
    );

    if (parseInt(contactsCheck.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Cannot delete stage with active contacts. Move contacts to another stage first.'
      });
    }

    const result = await db.query(
      'DELETE FROM crm_stages WHERE id = $1 AND pipeline_id = $2 AND org_id = $3 RETURNING id',
      [stageId, pipelineId, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    res.json({ message: 'Stage deleted successfully' });

  } catch (err) {
    console.error('Delete stage error:', err);
    res.status(500).json({ error: 'Failed to delete stage' });
  }
});

// ============================================
// REORDER STAGES
// ============================================

router.post('/:pipelineId/stages/reorder', async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const { stage_orders } = req.body;

    if (!Array.isArray(stage_orders) || stage_orders.length === 0) {
      return res.status(400).json({ error: 'stage_orders array is required' });
    }

    // Verify pipeline exists
    const pipelineCheck = await db.query(
      'SELECT id FROM crm_pipelines WHERE id = $1 AND org_id = $2',
      [pipelineId, req.user.orgId]
    );

    if (pipelineCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    // Update each stage's sort_order
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      for (const { stage_id, sort_order } of stage_orders) {
        await client.query(
          'UPDATE crm_stages SET sort_order = $1 WHERE id = $2 AND pipeline_id = $3 AND org_id = $4',
          [sort_order, stage_id, pipelineId, req.user.orgId]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: 'Stages reordered successfully' });

  } catch (err) {
    console.error('Reorder stages error:', err);
    res.status(500).json({ error: 'Failed to reorder stages' });
  }
});

module.exports = router;
