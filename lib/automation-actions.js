/**
 * CRM Automation Actions
 *
 * Executes individual actions for automation rules.
 * Each action type has a dedicated executor function.
 */

/**
 * Execute an action
 *
 * @param {object} action - Action object with type and config
 * @param {string} contactId - Contact ID to act on
 * @param {string} orgId - Organization ID
 * @param {object} client - Database client (transaction)
 * @returns {object} Result of action execution
 */
async function executeAction(action, contactId, orgId, client) {
  const { type, config } = action;

  if (!config) {
    throw new Error(`Action ${type} missing config`);
  }

  switch (type) {
    case 'move_to_stage':
      return await moveToStage(contactId, config, client);

    case 'add_tags':
      return await addTags(contactId, config, client);

    case 'remove_tags':
      return await removeTags(contactId, config, client);

    case 'assign_to':
      return await assignTo(contactId, config, client);

    case 'update_field':
      return await updateField(contactId, config, client);

    case 'create_activity':
      return await createActivity(contactId, orgId, config, client);

    case 'create_task':
      return await createTask(contactId, orgId, config, client);

    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

/**
 * Move contact to a stage
 */
async function moveToStage(contactId, config, client) {
  const { stage_id, substage_id, notes } = config;

  if (!stage_id) {
    throw new Error('move_to_stage requires stage_id');
  }

  // Use existing stored function
  const result = await client.query(
    `SELECT crm_move_contact_to_stage($1, $2, $3, $4, $5) AS result`,
    [
      contactId,
      stage_id,
      null, // moved_by (system/automation)
      notes || 'Moved by automation',
      substage_id || null
    ]
  );

  return {
    stage_id,
    substage_id: substage_id || null,
    entry_id: result.rows[0]?.result
  };
}

/**
 * Add tags to contact
 */
async function addTags(contactId, config, client) {
  const { tag_ids } = config;

  if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
    throw new Error('add_tags requires tag_ids array');
  }

  const addedTags = [];

  for (const tagId of tag_ids) {
    try {
      await client.query(
        `INSERT INTO crm_contact_tags (contact_id, tag_id, added_by)
         VALUES ($1, $2, NULL)
         ON CONFLICT (contact_id, tag_id) DO NOTHING`,
        [contactId, tagId]
      );
      addedTags.push(tagId);
    } catch (err) {
      console.error(`[Automation] Failed to add tag ${tagId}:`, err.message);
    }
  }

  return {
    added_tags: addedTags,
    count: addedTags.length
  };
}

/**
 * Remove tags from contact
 */
async function removeTags(contactId, config, client) {
  const { tag_ids } = config;

  if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
    throw new Error('remove_tags requires tag_ids array');
  }

  const result = await client.query(
    `DELETE FROM crm_contact_tags
     WHERE contact_id = $1 AND tag_id = ANY($2::uuid[])
     RETURNING tag_id`,
    [contactId, tag_ids]
  );

  return {
    removed_tags: result.rows.map(r => r.tag_id),
    count: result.rows.length
  };
}

/**
 * Assign contact to user
 */
async function assignTo(contactId, config, client) {
  const { user_id } = config;

  if (!user_id) {
    throw new Error('assign_to requires user_id');
  }

  await client.query(
    `UPDATE crm_contacts
     SET assigned_to = $1, updated_at = NOW()
     WHERE id = $2`,
    [user_id, contactId]
  );

  return {
    assigned_to: user_id
  };
}

/**
 * Update contact field
 */
async function updateField(contactId, config, client) {
  const { field, value } = config;

  if (!field) {
    throw new Error('update_field requires field name');
  }

  // Whitelist of allowed fields to update
  const allowedFields = [
    'lead_score',
    'source',
    'title',
    'company',
    'phone',
    'notes'
  ];

  if (!allowedFields.includes(field)) {
    throw new Error(`Field ${field} cannot be updated via automation`);
  }

  await client.query(
    `UPDATE crm_contacts
     SET ${field} = $1, updated_at = NOW()
     WHERE id = $2`,
    [value, contactId]
  );

  return {
    field,
    value
  };
}

/**
 * Create activity (note, email, call, meeting)
 */
async function createActivity(contactId, orgId, config, client) {
  const { type, title, description, metadata } = config;

  if (!type || !title) {
    throw new Error('create_activity requires type and title');
  }

  // Validate activity type
  const validTypes = ['note', 'email', 'call', 'meeting', 'system'];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid activity type: ${type}`);
  }

  // Use existing stored function
  const result = await client.query(
    `SELECT crm_log_activity($1, $2, $3, $4, $5, $6, NULL) AS activity_id`,
    [
      orgId,
      contactId,
      type,
      title,
      description || null,
      JSON.stringify(metadata || {})
    ]
  );

  return {
    activity_id: result.rows[0]?.activity_id,
    type,
    title
  };
}

/**
 * Create task for user
 */
async function createTask(contactId, orgId, config, client) {
  const {
    assigned_to,
    title,
    description,
    due_days,
    priority,
    metadata
  } = config;

  if (!title) {
    throw new Error('create_task requires title');
  }

  // Calculate due date if due_days provided
  let dueAt = null;
  if (due_days !== undefined && due_days !== null) {
    dueAt = `NOW() + INTERVAL '${parseInt(due_days)} days'`;
  }

  const result = await client.query(
    `INSERT INTO crm_activities
     (org_id, contact_id, type, title, description, assigned_to, due_at, priority, status, metadata, created_by)
     VALUES ($1, $2, 'task', $3, $4, $5, ${dueAt || 'NULL'}, $6, 'pending', $7, NULL)
     RETURNING id`,
    [
      orgId,
      contactId,
      title,
      description || null,
      assigned_to || null,
      priority || 'medium',
      JSON.stringify(metadata || {})
    ]
  );

  return {
    task_id: result.rows[0]?.id,
    title,
    assigned_to: assigned_to || null,
    due_days
  };
}

module.exports = {
  executeAction,
  moveToStage,
  addTags,
  removeTags,
  assignTo,
  updateField,
  createActivity,
  createTask
};
