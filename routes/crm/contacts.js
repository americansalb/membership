const express = require('express');
const router = express.Router();
const db = require('../../db');

// ============================================
// LIST CONTACTS
// ============================================

router.get('/', async (req, res) => {
  try {
    const {
      pipeline_id,
      stage_id,
      assigned_to,
      type,
      tags,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query dynamically
    let query = `
      SELECT DISTINCT
        c.*,
        cs.stage_id AS current_stage_id,
        cs.pipeline_id AS current_pipeline_id,
        s.name AS current_stage_name,
        s.color AS current_stage_color,
        p.name AS current_pipeline_name,
        u.name AS assigned_user_name,
        u.email AS assigned_user_email,
        COALESCE(
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
           FROM crm_contact_tags ct
           JOIN tags t ON t.id = ct.tag_id
           WHERE ct.contact_id = c.id),
          '[]'::json
        ) AS tags
      FROM crm_contacts c
      LEFT JOIN crm_contact_stages cs ON cs.contact_id = c.id AND cs.exited_at IS NULL
      LEFT JOIN crm_stages s ON s.id = cs.stage_id
      LEFT JOIN crm_pipelines p ON p.id = cs.pipeline_id
      LEFT JOIN users u ON u.id = c.assigned_to
      WHERE c.org_id = $1
    `;

    const params = [req.user.orgId];
    let paramIndex = 2;

    // Filter by pipeline
    if (pipeline_id) {
      query += ` AND cs.pipeline_id = $${paramIndex}`;
      params.push(pipeline_id);
      paramIndex++;
    }

    // Filter by stage
    if (stage_id) {
      query += ` AND cs.stage_id = $${paramIndex}`;
      params.push(stage_id);
      paramIndex++;
    }

    // Filter by assigned user
    if (assigned_to) {
      query += ` AND c.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    // Filter by type
    if (type) {
      query += ` AND c.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query += ` AND EXISTS (
        SELECT 1 FROM crm_contact_tags ct
        WHERE ct.contact_id = c.id AND ct.tag_id = ANY($${paramIndex}::uuid[])
      )`;
      params.push(tagArray);
      paramIndex++;
    }

    // Search by name, email, company
    if (search) {
      query += ` AND (
        c.first_name ILIKE $${paramIndex} OR
        c.last_name ILIKE $${paramIndex} OR
        c.email ILIKE $${paramIndex} OR
        c.company ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Order by last updated
    query += ` ORDER BY c.updated_at DESC`;

    // Pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // Execute query
    const result = await db.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT c.id)
      FROM crm_contacts c
      LEFT JOIN crm_contact_stages cs ON cs.contact_id = c.id AND cs.exited_at IS NULL
      WHERE c.org_id = $1
    `;
    const countParams = [req.user.orgId];
    let countIndex = 2;

    if (pipeline_id) {
      countQuery += ` AND cs.pipeline_id = $${countIndex}`;
      countParams.push(pipeline_id);
      countIndex++;
    }
    if (stage_id) {
      countQuery += ` AND cs.stage_id = $${countIndex}`;
      countParams.push(stage_id);
      countIndex++;
    }
    if (assigned_to) {
      countQuery += ` AND c.assigned_to = $${countIndex}`;
      countParams.push(assigned_to);
      countIndex++;
    }
    if (type) {
      countQuery += ` AND c.type = $${countIndex}`;
      countParams.push(type);
      countIndex++;
    }
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      countQuery += ` AND EXISTS (
        SELECT 1 FROM crm_contact_tags ct
        WHERE ct.contact_id = c.id AND ct.tag_id = ANY($${countIndex}::uuid[])
      )`;
      countParams.push(tagArray);
      countIndex++;
    }
    if (search) {
      countQuery += ` AND (
        c.first_name ILIKE $${countIndex} OR
        c.last_name ILIKE $${countIndex} OR
        c.email ILIKE $${countIndex} OR
        c.company ILIKE $${countIndex}
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      contacts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('List contacts error:', err);
    res.status(500).json({ error: 'Failed to list contacts' });
  }
});

// ============================================
// CREATE CONTACT
// ============================================

router.post('/', async (req, res) => {
  try {
    const {
      email,
      first_name,
      last_name,
      phone,
      company,
      title,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      source,
      source_details,
      lead_score,
      assigned_to,
      custom_fields,
      notes,
      type = 'prospect'
    } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check for duplicate email in org
    const duplicateCheck = await db.query(
      'SELECT id FROM crm_contacts WHERE org_id = $1 AND email = $2',
      [req.user.orgId, email.toLowerCase()]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Contact with this email already exists' });
    }

    // Insert contact
    const result = await db.query(
      `INSERT INTO crm_contacts (
        org_id, type, email, first_name, last_name, phone, company, title,
        address_line1, address_line2, city, state, postal_code, country,
        source, source_details, lead_score, assigned_to, custom_fields, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        req.user.orgId,
        type,
        email.toLowerCase(),
        first_name,
        last_name,
        phone,
        company,
        title,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        source,
        source_details,
        lead_score || 0,
        assigned_to,
        custom_fields ? JSON.stringify(custom_fields) : '{}',
        notes
      ]
    );

    res.status(201).json({ contact: result.rows[0] });

  } catch (err) {
    console.error('Create contact error:', err);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// ============================================
// GET SINGLE CONTACT
// ============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM crm_contact_summary WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Get stage history
    const historyResult = await db.query(
      `SELECT
        cs.*,
        s.name AS stage_name,
        s.color AS stage_color,
        p.name AS pipeline_name,
        u.first_name AS moved_by_first_name,
        u.last_name AS moved_by_last_name
      FROM crm_contact_stages cs
      JOIN crm_stages s ON s.id = cs.stage_id
      JOIN crm_pipelines p ON p.id = cs.pipeline_id
      LEFT JOIN users u ON u.id = cs.moved_by
      WHERE cs.contact_id = $1 AND cs.org_id = $2
      ORDER BY cs.entered_at DESC`,
      [id, req.user.orgId]
    );

    res.json({
      contact: result.rows[0],
      stage_history: historyResult.rows
    });

  } catch (err) {
    console.error('Get contact error:', err);
    res.status(500).json({ error: 'Failed to get contact' });
  }
});

// ============================================
// UPDATE CONTACT
// ============================================

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      company,
      title,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      source,
      source_details,
      lead_score,
      assigned_to,
      custom_fields,
      notes,
      type
    } = req.body;

    // Check if contact exists
    const checkResult = await db.query(
      'SELECT id FROM crm_contacts WHERE id = $1 AND org_id = $2',
      [id, req.user.orgId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check for duplicate email if email is being changed
    if (email) {
      const duplicateCheck = await db.query(
        'SELECT id FROM crm_contacts WHERE org_id = $1 AND email = $2 AND id != $3',
        [req.user.orgId, email.toLowerCase(), id]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Another contact with this email already exists' });
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (first_name !== undefined) {
      updates.push(`first_name = $${paramIndex}`);
      params.push(first_name);
      paramIndex++;
    }
    if (last_name !== undefined) {
      updates.push(`last_name = $${paramIndex}`);
      params.push(last_name);
      paramIndex++;
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      params.push(email.toLowerCase());
      paramIndex++;
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      params.push(phone);
      paramIndex++;
    }
    if (company !== undefined) {
      updates.push(`company = $${paramIndex}`);
      params.push(company);
      paramIndex++;
    }
    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(title);
      paramIndex++;
    }
    if (address_line1 !== undefined) {
      updates.push(`address_line1 = $${paramIndex}`);
      params.push(address_line1);
      paramIndex++;
    }
    if (address_line2 !== undefined) {
      updates.push(`address_line2 = $${paramIndex}`);
      params.push(address_line2);
      paramIndex++;
    }
    if (city !== undefined) {
      updates.push(`city = $${paramIndex}`);
      params.push(city);
      paramIndex++;
    }
    if (state !== undefined) {
      updates.push(`state = $${paramIndex}`);
      params.push(state);
      paramIndex++;
    }
    if (postal_code !== undefined) {
      updates.push(`postal_code = $${paramIndex}`);
      params.push(postal_code);
      paramIndex++;
    }
    if (country !== undefined) {
      updates.push(`country = $${paramIndex}`);
      params.push(country);
      paramIndex++;
    }
    if (source !== undefined) {
      updates.push(`source = $${paramIndex}`);
      params.push(source);
      paramIndex++;
    }
    if (source_details !== undefined) {
      updates.push(`source_details = $${paramIndex}`);
      params.push(source_details);
      paramIndex++;
    }
    if (lead_score !== undefined) {
      updates.push(`lead_score = $${paramIndex}`);
      params.push(lead_score);
      paramIndex++;
    }
    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${paramIndex}`);
      params.push(assigned_to);
      paramIndex++;
    }
    if (custom_fields !== undefined) {
      updates.push(`custom_fields = $${paramIndex}`);
      params.push(JSON.stringify(custom_fields));
      paramIndex++;
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      params.push(notes);
      paramIndex++;
    }
    if (type !== undefined) {
      updates.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add WHERE clause parameters
    params.push(id, req.user.orgId);

    const query = `
      UPDATE crm_contacts
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await db.query(query, params);

    res.json({ contact: result.rows[0] });

  } catch (err) {
    console.error('Update contact error:', err);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// ============================================
// DELETE CONTACT
// ============================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM crm_contacts WHERE id = $1 AND org_id = $2 RETURNING id',
      [id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });

  } catch (err) {
    console.error('Delete contact error:', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// ============================================
// MOVE CONTACT TO STAGE
// ============================================

router.post('/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage_id, notes } = req.body;

    if (!stage_id) {
      return res.status(400).json({ error: 'stage_id is required' });
    }

    // Verify contact exists and belongs to org
    const contactCheck = await db.query(
      'SELECT id, org_id FROM crm_contacts WHERE id = $1 AND org_id = $2',
      [id, req.user.orgId]
    );

    if (contactCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Verify stage exists and belongs to org
    const stageCheck = await db.query(
      'SELECT id, org_id FROM crm_stages WHERE id = $1 AND org_id = $2',
      [stage_id, req.user.orgId]
    );

    if (stageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    // Use helper function to move contact
    const result = await db.query(
      'SELECT crm_move_contact_to_stage($1, $2, $3, $4) AS stage_entry_id',
      [id, stage_id, req.user.id, notes]
    );

    res.json({
      message: 'Contact moved to stage successfully',
      stage_entry_id: result.rows[0].stage_entry_id
    });

  } catch (err) {
    console.error('Move contact to stage error:', err);
    res.status(500).json({ error: 'Failed to move contact to stage' });
  }
});

// ============================================
// ASSIGN CONTACT TO USER
// ============================================

router.post('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    // Verify user belongs to org
    if (user_id) {
      const userCheck = await db.query(
        'SELECT id FROM users WHERE id = $1 AND org_id = $2',
        [user_id, req.user.orgId]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'User not found in organization' });
      }
    }

    const result = await db.query(
      `UPDATE crm_contacts
       SET assigned_to = $1, updated_at = NOW()
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [user_id, id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ contact: result.rows[0] });

  } catch (err) {
    console.error('Assign contact error:', err);
    res.status(500).json({ error: 'Failed to assign contact' });
  }
});

// ============================================
// ADD TAGS TO CONTACT
// ============================================

router.post('/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_ids } = req.body;

    if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
      return res.status(400).json({ error: 'tag_ids array is required' });
    }

    // Verify contact exists
    const contactCheck = await db.query(
      'SELECT id FROM crm_contacts WHERE id = $1 AND org_id = $2',
      [id, req.user.orgId]
    );

    if (contactCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Verify all tags belong to org
    const tagsCheck = await db.query(
      'SELECT id FROM tags WHERE id = ANY($1::uuid[]) AND org_id = $2',
      [tag_ids, req.user.orgId]
    );

    if (tagsCheck.rows.length !== tag_ids.length) {
      return res.status(404).json({ error: 'One or more tags not found' });
    }

    // Insert tags (ignore duplicates)
    const values = tag_ids.map((tagId, idx) =>
      `($1, $${idx + 2}, $${idx + 2 + tag_ids.length}, NOW())`
    ).join(', ');

    const params = [id, ...tag_ids, ...tag_ids.map(() => req.user.id)];

    await db.query(
      `INSERT INTO crm_contact_tags (contact_id, tag_id, added_by, added_at)
       VALUES ${values}
       ON CONFLICT (contact_id, tag_id) DO NOTHING`,
      params
    );

    // Return updated contact with tags
    const result = await db.query(
      `SELECT
        COALESCE(
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
           FROM crm_contact_tags ct
           JOIN tags t ON t.id = ct.tag_id
           WHERE ct.contact_id = $1),
          '[]'::json
        ) AS tags`,
      [id]
    );

    res.json({ tags: result.rows[0].tags });

  } catch (err) {
    console.error('Add tags error:', err);
    res.status(500).json({ error: 'Failed to add tags' });
  }
});

// ============================================
// REMOVE TAG FROM CONTACT
// ============================================

router.delete('/:id/tags/:tagId', async (req, res) => {
  try {
    const { id, tagId } = req.params;

    // Verify contact exists
    const contactCheck = await db.query(
      'SELECT id FROM crm_contacts WHERE id = $1 AND org_id = $2',
      [id, req.user.orgId]
    );

    if (contactCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await db.query(
      'DELETE FROM crm_contact_tags WHERE contact_id = $1 AND tag_id = $2',
      [id, tagId]
    );

    res.json({ message: 'Tag removed successfully' });

  } catch (err) {
    console.error('Remove tag error:', err);
    res.status(500).json({ error: 'Failed to remove tag' });
  }
});

module.exports = router;
