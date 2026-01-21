/**
 * CRM Automation Conditions
 *
 * Evaluates conditions for automation rules.
 * All conditions must pass for an automation to execute.
 */

const db = require('../db');

/**
 * Evaluate all conditions for a contact
 *
 * @param {object} contact - Contact object from database
 * @param {array} conditions - Array of condition objects
 * @returns {boolean} True if all conditions pass
 */
async function evaluateConditions(contact, conditions) {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions = always pass
  }

  for (const condition of conditions) {
    const passed = await evaluateCondition(contact, condition);
    if (!passed) {
      return false; // ALL conditions must pass
    }
  }

  return true;
}

/**
 * Evaluate a single condition
 */
async function evaluateCondition(contact, condition) {
  const { type } = condition;

  switch (type) {
    case 'field_value':
      return evaluateFieldValue(contact, condition);

    case 'tag_exists':
      return await evaluateTagExists(contact.id, condition);

    case 'tag_not_exists':
      return await evaluateTagNotExists(contact.id, condition);

    case 'stage_is':
      return await evaluateStageIs(contact.id, condition);

    case 'stage_is_not':
      return await evaluateStageIsNot(contact.id, condition);

    case 'assigned_to':
      return evaluateAssignedTo(contact, condition);

    default:
      console.warn(`[Automation] Unknown condition type: ${type}`);
      return false;
  }
}

/**
 * Check field value condition
 */
function evaluateFieldValue(contact, condition) {
  const { field, operator, value } = condition;

  if (!field) {
    console.error('[Automation] field_value condition missing field name');
    return false;
  }

  const actualValue = contact[field];

  return compareValues(actualValue, operator, value);
}

/**
 * Compare values with operator
 */
function compareValues(actualValue, operator, expectedValue) {
  switch (operator) {
    case 'equals':
    case '=':
    case '==':
      return actualValue == expectedValue;

    case 'not_equals':
    case '!=':
      return actualValue != expectedValue;

    case 'greater_than':
    case '>':
      return parseFloat(actualValue) > parseFloat(expectedValue);

    case 'greater_than_or_equal':
    case '>=':
      return parseFloat(actualValue) >= parseFloat(expectedValue);

    case 'less_than':
    case '<':
      return parseFloat(actualValue) < parseFloat(expectedValue);

    case 'less_than_or_equal':
    case '<=':
      return parseFloat(actualValue) <= parseFloat(expectedValue);

    case 'contains':
      if (actualValue === null || actualValue === undefined) return false;
      return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());

    case 'not_contains':
      if (actualValue === null || actualValue === undefined) return true;
      return !String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());

    case 'is_empty':
      return actualValue === null || actualValue === undefined || actualValue === '';

    case 'is_not_empty':
      return actualValue !== null && actualValue !== undefined && actualValue !== '';

    default:
      console.warn(`[Automation] Unknown operator: ${operator}`);
      return false;
  }
}

/**
 * Check if contact has a specific tag
 */
async function evaluateTagExists(contactId, condition) {
  const { tag_id } = condition;

  if (!tag_id) {
    console.error('[Automation] tag_exists condition missing tag_id');
    return false;
  }

  const result = await db.query(
    `SELECT 1 FROM crm_contact_tags
     WHERE contact_id = $1 AND tag_id = $2
     LIMIT 1`,
    [contactId, tag_id]
  );

  return result.rows.length > 0;
}

/**
 * Check if contact does NOT have a specific tag
 */
async function evaluateTagNotExists(contactId, condition) {
  const hasTag = await evaluateTagExists(contactId, condition);
  return !hasTag;
}

/**
 * Check if contact is in a specific stage
 */
async function evaluateStageIs(contactId, condition) {
  const { stage_id, pipeline_id } = condition;

  if (!stage_id) {
    console.error('[Automation] stage_is condition missing stage_id');
    return false;
  }

  let query = `
    SELECT 1 FROM crm_contact_stages
    WHERE contact_id = $1
      AND stage_id = $2
      AND exited_at IS NULL
  `;
  const params = [contactId, stage_id];

  // Optionally filter by pipeline
  if (pipeline_id) {
    query += ` AND pipeline_id = $3`;
    params.push(pipeline_id);
  }

  query += ` LIMIT 1`;

  const result = await db.query(query, params);
  return result.rows.length > 0;
}

/**
 * Check if contact is NOT in specific stages
 */
async function evaluateStageIsNot(contactId, condition) {
  const { stage_ids, pipeline_id } = condition;

  if (!Array.isArray(stage_ids) || stage_ids.length === 0) {
    console.error('[Automation] stage_is_not condition missing stage_ids array');
    return false;
  }

  let query = `
    SELECT 1 FROM crm_contact_stages
    WHERE contact_id = $1
      AND stage_id = ANY($2::uuid[])
      AND exited_at IS NULL
  `;
  const params = [contactId, stage_ids];

  // Optionally filter by pipeline
  if (pipeline_id) {
    query += ` AND pipeline_id = $3`;
    params.push(pipeline_id);
  }

  query += ` LIMIT 1`;

  const result = await db.query(query, params);

  // Return true if NOT in any of those stages
  return result.rows.length === 0;
}

/**
 * Check if contact is assigned to a specific user
 */
function evaluateAssignedTo(contact, condition) {
  const { user_id } = condition;

  if (!user_id) {
    console.error('[Automation] assigned_to condition missing user_id');
    return false;
  }

  return contact.assigned_to === user_id;
}

module.exports = {
  evaluateConditions,
  evaluateCondition,
  compareValues
};
