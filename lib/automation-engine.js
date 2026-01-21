/**
 * CRM Automation Engine
 *
 * Core orchestrator for automation system. Handles:
 * - Finding matching automations for triggers
 * - Evaluating conditions
 * - Queuing executions
 * - Processing actions
 */

const db = require('../db');
const { executeAction } = require('./automation-actions');
const { evaluateConditions } = require('./automation-conditions');

/**
 * Trigger automation check
 *
 * @param {string} eventType - Type of event (stage_entered, tag_added, etc.)
 * @param {object} eventData - Event details (org_id, contact_id, etc.)
 */
async function trigger(eventType, eventData) {
  try {
    const { org_id, contact_id } = eventData;

    if (!org_id || !contact_id) {
      console.error('[Automation] Missing required fields in eventData:', eventData);
      return;
    }

    // Find matching automations
    const automations = await findMatchingAutomations(org_id, eventType, eventData);

    if (automations.length === 0) {
      console.log(`[Automation] No active automations found for ${eventType}`);
      return;
    }

    console.log(`[Automation] Found ${automations.length} matching automation(s) for ${eventType}`);

    // Get contact data for condition evaluation
    const contact = await getContact(contact_id);

    if (!contact) {
      console.error('[Automation] Contact not found:', contact_id);
      return;
    }

    // Evaluate each automation
    for (const automation of automations) {
      try {
        // Check if already run (if run_once_per_contact is true)
        if (automation.run_once_per_contact) {
          const alreadyRun = await hasAutomationRun(automation.id, contact_id);
          if (alreadyRun) {
            console.log(`[Automation] Skipping ${automation.name} - already run for this contact`);
            await logExecution(automation.id, contact_id, org_id, 'skipped', eventData, {
              reason: 'run_once_per_contact is true and automation already executed'
            });
            continue;
          }
        }

        // Evaluate conditions
        const conditionsPassed = await evaluateConditions(contact, automation.conditions || []);

        if (!conditionsPassed) {
          console.log(`[Automation] Skipping ${automation.name} - conditions not met`);
          await logExecution(automation.id, contact_id, org_id, 'skipped', eventData, {
            reason: 'conditions not met'
          });
          continue;
        }

        // Queue execution
        await queueExecution(automation.id, contact_id, org_id, eventData);
        console.log(`[Automation] Queued execution for: ${automation.name}`);

      } catch (err) {
        console.error(`[Automation] Error processing automation ${automation.id}:`, err);
      }
    }

  } catch (error) {
    console.error('[Automation] Error in trigger:', error);
  }
}

/**
 * Find automations matching the trigger
 */
async function findMatchingAutomations(orgId, triggerType, eventData) {
  const query = `
    SELECT
      a.*
    FROM crm_automations a
    WHERE a.org_id = $1
      AND a.is_active = TRUE
      AND a.trigger_type = $2
      AND (
        a.pipeline_id IS NULL
        OR a.pipeline_id = $3
      )
    ORDER BY a.priority DESC, a.created_at ASC
  `;

  const pipelineId = eventData.pipeline_id || null;
  const result = await db.query(query, [orgId, triggerType, pipelineId]);

  // Filter by trigger_config match
  const matchingAutomations = result.rows.filter(automation => {
    return matchesTriggerConfig(automation.trigger_config, eventData);
  });

  return matchingAutomations;
}

/**
 * Check if trigger config matches event data
 */
function matchesTriggerConfig(triggerConfig, eventData) {
  // If no specific config, it matches all
  if (!triggerConfig || Object.keys(triggerConfig).length === 0) {
    return true;
  }

  // Check stage_id match (for stage_entered/stage_exited triggers)
  if (triggerConfig.stage_id) {
    if (triggerConfig.stage_id !== eventData.stage_id) {
      return false;
    }
  }

  // Check substage_id match (optional)
  if (triggerConfig.substage_id) {
    if (triggerConfig.substage_id !== eventData.substage_id) {
      return false;
    }
  }

  // Check tag_id match (for tag_added/tag_removed triggers)
  if (triggerConfig.tag_id) {
    if (triggerConfig.tag_id !== eventData.tag_id) {
      return false;
    }
  }

  // Check activity_type match (for activity_logged trigger)
  if (triggerConfig.activity_type) {
    if (triggerConfig.activity_type !== eventData.activity_type) {
      return false;
    }
  }

  // Check title_contains (for activity_logged trigger)
  if (triggerConfig.title_contains) {
    const title = (eventData.activity_title || '').toLowerCase();
    const searchTerm = triggerConfig.title_contains.toLowerCase();
    if (!title.includes(searchTerm)) {
      return false;
    }
  }

  // Check field match (for field_changed trigger)
  if (triggerConfig.field) {
    if (triggerConfig.field !== eventData.field) {
      return false;
    }

    // Check operator and value
    if (triggerConfig.operator && triggerConfig.value !== undefined) {
      const newValue = eventData.new_value;
      if (!compareValues(newValue, triggerConfig.operator, triggerConfig.value)) {
        return false;
      }
    }
  }

  return true;
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
      return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());

    default:
      return false;
  }
}

/**
 * Get contact data
 */
async function getContact(contactId) {
  const result = await db.query(
    `SELECT * FROM crm_contacts WHERE id = $1`,
    [contactId]
  );
  return result.rows[0] || null;
}

/**
 * Check if automation has already run for this contact
 */
async function hasAutomationRun(automationId, contactId) {
  const result = await db.query(
    `SELECT id FROM crm_automation_executions
     WHERE automation_id = $1 AND contact_id = $2
     AND status IN ('completed', 'running')
     LIMIT 1`,
    [automationId, contactId]
  );
  return result.rows.length > 0;
}

/**
 * Queue an execution
 */
async function queueExecution(automationId, contactId, orgId, triggerData) {
  const result = await db.query(
    `INSERT INTO crm_automation_executions
     (automation_id, contact_id, org_id, status, trigger_data, triggered_at)
     VALUES ($1, $2, $3, 'pending', $4, NOW())
     RETURNING id`,
    [automationId, contactId, orgId, JSON.stringify(triggerData)]
  );

  return result.rows[0].id;
}

/**
 * Log execution (for skipped or immediate logging)
 */
async function logExecution(automationId, contactId, orgId, status, triggerData, result) {
  await db.query(
    `INSERT INTO crm_automation_executions
     (automation_id, contact_id, org_id, status, trigger_data, execution_result, triggered_at, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [automationId, contactId, orgId, status, JSON.stringify(triggerData), JSON.stringify(result || {})]
  );
}

/**
 * Process a queued execution
 *
 * @param {string} executionId - Execution ID to process
 */
async function processExecution(executionId) {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Mark as running
    await client.query(
      `UPDATE crm_automation_executions
       SET status = 'running', started_at = NOW()
       WHERE id = $1`,
      [executionId]
    );

    // Get execution details
    const execResult = await client.query(
      `SELECT
        ae.*,
        a.actions,
        a.name as automation_name,
        c.id as contact_id,
        c.email as contact_email
       FROM crm_automation_executions ae
       JOIN crm_automations a ON a.id = ae.automation_id
       JOIN crm_contacts c ON c.id = ae.contact_id
       WHERE ae.id = $1`,
      [executionId]
    );

    if (execResult.rows.length === 0) {
      throw new Error('Execution not found');
    }

    const execution = execResult.rows[0];
    const actions = execution.actions || [];

    console.log(`[Automation] Processing execution ${executionId} for automation "${execution.automation_name}"`);

    // Execute each action
    const results = [];
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      console.log(`[Automation] Executing action ${i + 1}/${actions.length}: ${action.type}`);

      try {
        const actionResult = await executeAction(
          action,
          execution.contact_id,
          execution.org_id,
          client
        );

        results.push({
          action: action.type,
          result: actionResult,
          success: true,
          timestamp: new Date().toISOString()
        });

        console.log(`[Automation] Action ${action.type} completed successfully`);

      } catch (actionError) {
        console.error(`[Automation] Action ${action.type} failed:`, actionError);

        results.push({
          action: action.type,
          error: actionError.message,
          success: false,
          timestamp: new Date().toISOString()
        });

        // Continue with next action (don't fail entire execution for one action)
      }
    }

    // Mark as completed
    await client.query(
      `UPDATE crm_automation_executions
       SET status = 'completed', completed_at = NOW(), execution_result = $1
       WHERE id = $2`,
      [JSON.stringify({ results }), executionId]
    );

    await client.query('COMMIT');
    console.log(`[Automation] Execution ${executionId} completed successfully`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Automation] Execution failed:', error);

    // Log failure
    try {
      await client.query(
        `UPDATE crm_automation_executions
         SET status = 'failed', completed_at = NOW(), error_message = $1
         WHERE id = $2`,
        [error.message, executionId]
      );
    } catch (logError) {
      console.error('[Automation] Failed to log error:', logError);
    }

  } finally {
    client.release();
  }
}

/**
 * Get pending executions
 */
async function getPendingExecutions(limit = 10) {
  const result = await db.query(
    `SELECT id FROM crm_automation_executions
     WHERE status = 'pending'
     ORDER BY triggered_at ASC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

module.exports = {
  trigger,
  processExecution,
  getPendingExecutions,
  findMatchingAutomations,
  queueExecution
};
