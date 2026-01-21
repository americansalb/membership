# CRM Automation & Journey Tracking Plan

## Vision

Build a powerful automation system that:
- **Tracks member journeys** through your sales pipeline
- **Automatically moves contacts** between stages based on rules
- **Applies tags** based on behavior and attributes
- **Executes actions** when triggers fire

**Rules:**
- ✅ One stage per contact at a time
- ✅ One substage per contact at a time
- ✅ Multiple tags per contact
- ✅ Full history tracking (never delete, just mark exited)

---

## Current State (Already Built)

Your CRM already has:

### 1. Stage Entry Actions (Basic)
When a contact enters a stage, you can:
- Auto-assign to a user (`auto_assign_to`)
- Auto-add tags (`auto_add_tags`)

### 2. Journey History Tracking
- `crm_contact_stages` tracks every stage a contact has been in
- `entered_at` / `exited_at` timestamps for full timeline
- Never deleted - complete audit trail

### 3. Manual Movement
- `crm_move_contact_to_stage()` function handles stage transitions
- Automatically exits previous stage, enters new stage
- Logs who moved them and why

---

## What's Missing (To Build)

### 1. Time-Based Automations
**Example:** Move contact to "Cold Lead" if no activity for 30 days

### 2. Behavior-Based Automations
**Example:** Move to "Hot Lead" if they visited pricing page 3+ times

### 3. Attribute-Based Automations
**Example:** Auto-tag "Enterprise" if company size > 500

### 4. Multi-Step Workflows
**Example:** When contact enters "Trial", send email → wait 7 days → send followup

### 5. Automation UI
**Example:** Visual rule builder for admins

---

## Automation System Architecture

### Database Schema

#### 1. Automation Rules Table

```sql
CREATE TABLE crm_automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES crm_pipelines(id) ON DELETE CASCADE, -- NULL = all pipelines

  name VARCHAR(200) NOT NULL,
  description TEXT,

  is_active BOOLEAN DEFAULT TRUE,

  -- Trigger: When does this run?
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN (
    'stage_entered',      -- Contact enters a specific stage
    'stage_exited',       -- Contact exits a specific stage
    'tag_added',          -- Contact gets a tag
    'tag_removed',        -- Contact loses a tag
    'field_changed',      -- Contact field updated
    'time_in_stage',      -- Contact in stage for X days
    'no_activity',        -- No activity for X days
    'activity_logged',    -- Specific activity type logged
    'manual'              -- Admin manually triggers
  )),

  trigger_config JSONB NOT NULL DEFAULT '{}', -- Trigger-specific settings

  -- Conditions: Additional filters
  conditions JSONB DEFAULT '[]', -- Array of condition objects

  -- Actions: What happens when triggered?
  actions JSONB NOT NULL DEFAULT '[]', -- Array of action objects

  -- Execution settings
  run_once_per_contact BOOLEAN DEFAULT FALSE, -- Only run once per contact
  priority INTEGER DEFAULT 0, -- Higher = runs first

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, name)
);

CREATE INDEX idx_crm_automations_org ON crm_automations(org_id);
CREATE INDEX idx_crm_automations_pipeline ON crm_automations(pipeline_id);
CREATE INDEX idx_crm_automations_trigger ON crm_automations(trigger_type);
CREATE INDEX idx_crm_automations_active ON crm_automations(is_active) WHERE is_active = TRUE;
```

#### 2. Automation Execution Log

```sql
CREATE TABLE crm_automation_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_id UUID NOT NULL REFERENCES crm_automations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,

  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),

  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  trigger_data JSONB DEFAULT '{}', -- What caused the trigger
  execution_result JSONB DEFAULT '{}', -- What actions were taken
  error_message TEXT, -- If failed

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_automation_executions_automation ON crm_automation_executions(automation_id);
CREATE INDEX idx_crm_automation_executions_contact ON crm_automation_executions(contact_id);
CREATE INDEX idx_crm_automation_executions_status ON crm_automation_executions(status);
CREATE INDEX idx_crm_automation_executions_triggered ON crm_automation_executions(triggered_at);
```

---

## Trigger Types & Configuration

### 1. `stage_entered`
**When:** Contact enters a specific stage

**Config:**
```json
{
  "stage_id": "uuid-here",
  "substage_id": "uuid-here" // optional
}
```

**Example:** When contact enters "Demo Scheduled" stage

---

### 2. `stage_exited`
**When:** Contact leaves a specific stage

**Config:**
```json
{
  "stage_id": "uuid-here"
}
```

**Example:** When contact exits "Trial" stage

---

### 3. `time_in_stage`
**When:** Contact has been in a stage for X days

**Config:**
```json
{
  "stage_id": "uuid-here",
  "days": 7
}
```

**Example:** Contact in "Trial" for 7 days → send followup email

---

### 4. `no_activity`
**When:** No activity logged for X days

**Config:**
```json
{
  "days": 30,
  "activity_types": ["call", "email", "meeting"] // optional filter
}
```

**Example:** No contact for 30 days → move to "Cold Lead"

---

### 5. `tag_added`
**When:** Specific tag added to contact

**Config:**
```json
{
  "tag_id": "uuid-here"
}
```

**Example:** When "Enterprise" tag added → assign to sales manager

---

### 6. `field_changed`
**When:** Contact field updated

**Config:**
```json
{
  "field": "lead_score",
  "operator": ">=",
  "value": 80
}
```

**Example:** Lead score reaches 80 → move to "Hot Lead"

---

### 7. `activity_logged`
**When:** Specific activity type logged

**Config:**
```json
{
  "activity_type": "meeting",
  "title_contains": "demo" // optional
}
```

**Example:** Demo meeting logged → move to "Demo Completed"

---

## Conditions (Additional Filters)

Conditions are checked AFTER the trigger fires. All conditions must pass for actions to execute.

**Condition Object:**
```json
{
  "type": "field_value",
  "field": "type",
  "operator": "equals",
  "value": "prospect"
}
```

**Condition Types:**

| Type | Checks |
|------|--------|
| `field_value` | Contact field matches value |
| `tag_exists` | Contact has specific tag |
| `tag_not_exists` | Contact doesn't have tag |
| `stage_is` | Contact currently in stage |
| `pipeline_is` | Contact in specific pipeline |
| `time_of_day` | Current time (e.g., business hours) |
| `day_of_week` | Current day (e.g., weekdays only) |
| `contact_age` | Days since contact created |

**Operators:**
- `equals`, `not_equals`
- `greater_than`, `less_than`
- `contains`, `not_contains`
- `is_empty`, `is_not_empty`

**Example Condition Set:**
```json
[
  {
    "type": "field_value",
    "field": "type",
    "operator": "equals",
    "value": "prospect"
  },
  {
    "type": "tag_not_exists",
    "tag_id": "uuid-unqualified-tag"
  }
]
```

---

## Actions (What Happens)

Actions are executed in order when trigger fires and conditions pass.

**Action Object:**
```json
{
  "type": "move_to_stage",
  "config": {
    "stage_id": "uuid-here"
  }
}
```

### Available Actions

| Action Type | What It Does | Config |
|-------------|--------------|--------|
| `move_to_stage` | Move contact to a different stage | `{ "stage_id": "uuid", "substage_id": "uuid" }` |
| `add_tags` | Add one or more tags | `{ "tag_ids": ["uuid1", "uuid2"] }` |
| `remove_tags` | Remove tags | `{ "tag_ids": ["uuid1"] }` |
| `assign_to` | Change assigned user | `{ "user_id": "uuid" }` |
| `update_field` | Update contact field | `{ "field": "lead_score", "value": 90 }` |
| `create_activity` | Log an activity | `{ "type": "note", "title": "...", "description": "..." }` |
| `send_email` | Send email to contact | `{ "template_id": "uuid", "from_user_id": "uuid" }` |
| `create_task` | Create a task for user | `{ "assigned_to": "uuid", "title": "...", "due_days": 3 }` |
| `webhook` | Call external webhook | `{ "url": "https://...", "method": "POST", "body": {...} }` |
| `wait` | Pause execution for X days | `{ "days": 7 }` |

---

## Example Automation Rules

### 1. New Prospect Onboarding

**Trigger:** Contact enters "New Lead" stage

**Conditions:**
- Type = "prospect"

**Actions:**
1. Add tags: ["New", "Unqualified"]
2. Assign to: Sales team rotation
3. Create task: "Qualify lead within 24 hours"
4. Send email: "Welcome" template

```sql
INSERT INTO crm_automations (org_id, name, trigger_type, trigger_config, conditions, actions) VALUES (
  'org-uuid',
  'New Prospect Onboarding',
  'stage_entered',
  '{"stage_id": "new-lead-stage-uuid"}',
  '[{"type": "field_value", "field": "type", "operator": "equals", "value": "prospect"}]',
  '[
    {"type": "add_tags", "config": {"tag_ids": ["new-tag-uuid", "unqualified-tag-uuid"]}},
    {"type": "assign_to", "config": {"user_id": "sales-user-uuid"}},
    {"type": "create_task", "config": {"assigned_to": "sales-user-uuid", "title": "Qualify new lead", "due_days": 1}},
    {"type": "send_email", "config": {"template_id": "welcome-template-uuid"}}
  ]'
);
```

---

### 2. Stale Lead → Cold

**Trigger:** No activity for 30 days

**Conditions:**
- Stage NOT "Closed Won" or "Closed Lost"
- Type = "prospect"

**Actions:**
1. Move to: "Cold Lead" stage
2. Remove tags: ["Hot", "Warm"]
3. Add tags: ["Cold"]
4. Create activity: System note about inactivity

```sql
INSERT INTO crm_automations (org_id, name, trigger_type, trigger_config, conditions, actions) VALUES (
  'org-uuid',
  'Mark Stale Leads as Cold',
  'no_activity',
  '{"days": 30}',
  '[
    {"type": "stage_is_not", "stage_ids": ["closed-won-uuid", "closed-lost-uuid"]},
    {"type": "field_value", "field": "type", "operator": "equals", "value": "prospect"}
  ]',
  '[
    {"type": "move_to_stage", "config": {"stage_id": "cold-lead-uuid"}},
    {"type": "remove_tags", "config": {"tag_ids": ["hot-uuid", "warm-uuid"]}},
    {"type": "add_tags", "config": {"tag_ids": ["cold-uuid"]}},
    {"type": "create_activity", "config": {"type": "system", "title": "Marked as cold due to 30 days inactivity"}}
  ]'
);
```

---

### 3. High Lead Score → Hot Lead

**Trigger:** Lead score field changed

**Conditions:**
- Lead score >= 80
- Stage NOT already "Hot Lead"

**Actions:**
1. Move to: "Hot Lead" stage
2. Add tags: ["Hot", "High Priority"]
3. Assign to: Senior sales rep
4. Create task: "Contact within 4 hours"

```sql
INSERT INTO crm_automations (org_id, name, trigger_type, trigger_config, conditions, actions) VALUES (
  'org-uuid',
  'Promote High Scorers to Hot Leads',
  'field_changed',
  '{"field": "lead_score", "operator": ">=", "value": 80}',
  '[
    {"type": "stage_is_not", "stage_ids": ["hot-lead-uuid"]}
  ]',
  '[
    {"type": "move_to_stage", "config": {"stage_id": "hot-lead-uuid"}},
    {"type": "add_tags", "config": {"tag_ids": ["hot-uuid", "high-priority-uuid"]}},
    {"type": "assign_to", "config": {"user_id": "senior-rep-uuid"}},
    {"type": "create_task", "config": {"assigned_to": "senior-rep-uuid", "title": "Contact hot lead ASAP", "due_days": 0, "priority": "urgent"}}
  ]'
);
```

---

### 4. Trial Started → Follow Up Sequence

**Trigger:** Contact enters "Trial" stage

**Actions:**
1. Send email: "Welcome to trial"
2. Wait 3 days
3. Send email: "Tips for getting started"
4. Wait 4 days (day 7 total)
5. Create task: "Check in with trial user"

```sql
INSERT INTO crm_automations (org_id, name, trigger_type, trigger_config, actions) VALUES (
  'org-uuid',
  'Trial Nurture Sequence',
  'stage_entered',
  '{"stage_id": "trial-stage-uuid"}',
  '[
    {"type": "send_email", "config": {"template_id": "trial-welcome-uuid"}},
    {"type": "wait", "config": {"days": 3}},
    {"type": "send_email", "config": {"template_id": "trial-tips-uuid"}},
    {"type": "wait", "config": {"days": 4}},
    {"type": "create_task", "config": {"assigned_to": "assigned_user", "title": "Check in with trial user", "due_days": 0}}
  ]'
);
```

---

### 5. Demo Completed → Next Steps

**Trigger:** Activity logged with type "meeting" and title contains "demo"

**Conditions:**
- Stage = "Demo Scheduled"

**Actions:**
1. Move to: "Demo Completed" stage
2. Add tags: ["Demo Done"]
3. Create activity: "Follow up on demo questions"
4. Create task: "Send proposal within 48 hours"

---

## Automation Engine (Backend)

### Execution Flow

```
1. Event occurs (e.g., contact enters stage)
   ↓
2. Find all active automations for that trigger type
   ↓
3. For each automation:
   a. Check if already run (if run_once_per_contact = true)
   b. Evaluate trigger config (does this event match?)
   c. Evaluate all conditions (do they all pass?)
   d. If yes → Execute actions in order
   e. Log execution result
   ↓
4. Done
```

### Implementation

**File:** `lib/crm-automation-engine.js`

```javascript
class CRMAutomationEngine {

  /**
   * Evaluate and execute automations for a trigger event
   */
  async trigger(eventType, eventData) {
    // eventType: 'stage_entered', 'no_activity', etc.
    // eventData: { contact_id, org_id, stage_id, ... }

    const { contact_id, org_id } = eventData;

    // 1. Find matching automations
    const automations = await this.findAutomations(org_id, eventType);

    // 2. Sort by priority
    automations.sort((a, b) => b.priority - a.priority);

    // 3. Execute each automation
    for (const automation of automations) {
      await this.executeAutomation(automation, contact_id, eventData);
    }
  }

  async executeAutomation(automation, contact_id, eventData) {
    // Check if already run
    if (automation.run_once_per_contact) {
      const alreadyRun = await this.hasRun(automation.id, contact_id);
      if (alreadyRun) {
        await this.logExecution(automation.id, contact_id, 'skipped', 'Already run for this contact');
        return;
      }
    }

    // Check trigger config
    if (!this.matchesTriggerConfig(automation.trigger_config, eventData)) {
      return; // Doesn't match this specific event
    }

    // Evaluate conditions
    const conditionsPassed = await this.evaluateConditions(automation.conditions, contact_id);
    if (!conditionsPassed) {
      await this.logExecution(automation.id, contact_id, 'skipped', 'Conditions not met');
      return;
    }

    // Execute actions
    try {
      await this.logExecution(automation.id, contact_id, 'running');

      const results = [];
      for (const action of automation.actions) {
        const result = await this.executeAction(action, contact_id, eventData);
        results.push(result);
      }

      await this.logExecution(automation.id, contact_id, 'completed', null, { results });
    } catch (error) {
      await this.logExecution(automation.id, contact_id, 'failed', error.message);
    }
  }

  async executeAction(action, contact_id, eventData) {
    const { type, config } = action;

    switch (type) {
      case 'move_to_stage':
        return await this.moveToStage(contact_id, config.stage_id, config.substage_id);

      case 'add_tags':
        return await this.addTags(contact_id, config.tag_ids);

      case 'remove_tags':
        return await this.removeTags(contact_id, config.tag_ids);

      case 'assign_to':
        return await this.assignTo(contact_id, config.user_id);

      case 'update_field':
        return await this.updateField(contact_id, config.field, config.value);

      case 'create_activity':
        return await this.createActivity(contact_id, config);

      case 'send_email':
        return await this.sendEmail(contact_id, config);

      case 'create_task':
        return await this.createTask(contact_id, config);

      case 'webhook':
        return await this.callWebhook(contact_id, config);

      case 'wait':
        return await this.scheduleDelayedExecution(contact_id, config.days, action);

      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  async evaluateConditions(conditions, contact_id) {
    if (!conditions || conditions.length === 0) return true;

    // Fetch contact data
    const contact = await this.getContact(contact_id);

    // All conditions must pass (AND logic)
    for (const condition of conditions) {
      const passed = await this.evaluateCondition(condition, contact);
      if (!passed) return false;
    }

    return true;
  }

  async evaluateCondition(condition, contact) {
    const { type } = condition;

    switch (type) {
      case 'field_value':
        return this.checkFieldValue(contact, condition.field, condition.operator, condition.value);

      case 'tag_exists':
        return this.hasTag(contact, condition.tag_id);

      case 'tag_not_exists':
        return !this.hasTag(contact, condition.tag_id);

      case 'stage_is':
        return contact.current_stage_id === condition.stage_id;

      case 'stage_is_not':
        return !condition.stage_ids.includes(contact.current_stage_id);

      // ... more condition types

      default:
        return true;
    }
  }
}
```

---

## Time-Based Automation Runner

For triggers like `time_in_stage` and `no_activity`, we need a background job that runs periodically.

**Cron Job:** Every hour (or every 6 hours)

```javascript
// jobs/crm-automation-check.js
async function checkTimeBasedAutomations() {
  console.log('[CRM Automation] Checking time-based automations...');

  // 1. Find all active time-based automations
  const automations = await db.query(`
    SELECT * FROM crm_automations
    WHERE is_active = TRUE
    AND trigger_type IN ('time_in_stage', 'no_activity')
  `);

  for (const automation of automations.rows) {
    if (automation.trigger_type === 'time_in_stage') {
      await checkTimeInStage(automation);
    } else if (automation.trigger_type === 'no_activity') {
      await checkNoActivity(automation);
    }
  }

  console.log('[CRM Automation] Check complete');
}

async function checkTimeInStage(automation) {
  const { stage_id, days } = automation.trigger_config;

  // Find contacts in this stage for X days
  const contacts = await db.query(`
    SELECT contact_id, org_id
    FROM crm_contact_stages cs
    JOIN crm_contacts c ON c.id = cs.contact_id
    WHERE cs.stage_id = $1
    AND cs.exited_at IS NULL
    AND cs.entered_at <= NOW() - INTERVAL '${days} days'
    AND c.org_id = $2
  `, [stage_id, automation.org_id]);

  // Trigger automation for each
  for (const contact of contacts.rows) {
    await automationEngine.trigger('time_in_stage', {
      contact_id: contact.contact_id,
      org_id: contact.org_id,
      stage_id: stage_id
    });
  }
}

async function checkNoActivity(automation) {
  const { days, activity_types } = automation.trigger_config;

  // Find contacts with no activity for X days
  const typeFilter = activity_types && activity_types.length > 0
    ? `AND type = ANY($3)`
    : '';

  const contacts = await db.query(`
    SELECT DISTINCT c.id as contact_id, c.org_id
    FROM crm_contacts c
    WHERE c.org_id = $1
    AND NOT EXISTS (
      SELECT 1 FROM crm_activities a
      WHERE a.contact_id = c.id
      AND a.created_at >= NOW() - INTERVAL '${days} days'
      ${typeFilter}
    )
  `, [automation.org_id, ...(activity_types ? [activity_types] : [])]);

  // Trigger automation for each
  for (const contact of contacts.rows) {
    await automationEngine.trigger('no_activity', {
      contact_id: contact.contact_id,
      org_id: contact.org_id,
      days: days
    });
  }
}

// Schedule to run every hour
setInterval(checkTimeBasedAutomations, 60 * 60 * 1000);
```

---

## Admin UI for Automation Management

### Automation List Page
**`/admin/crm-automations.html`**

Shows all automation rules with:
- Name, trigger type, active/inactive toggle
- Number of times executed
- Last executed timestamp
- Edit/Delete buttons

### Automation Builder Page
**`/admin/crm-automation-edit.html?id=uuid`**

Visual builder with:

1. **Trigger Section**
   - Dropdown: Select trigger type
   - Dynamic config form based on trigger type

2. **Conditions Section (Optional)**
   - "Add Condition" button
   - Each condition: type dropdown + config fields
   - AND logic between conditions

3. **Actions Section**
   - "Add Action" button
   - Each action: type dropdown + config fields
   - Actions execute in order (drag to reorder)

4. **Settings Section**
   - Name, description
   - Active/inactive toggle
   - Run once per contact checkbox
   - Priority slider

### Automation Execution Log
**`/admin/crm-automation-log.html?automation_id=uuid`**

Shows execution history:
- Contact name, status, triggered timestamp
- What actions were taken
- Any errors
- Filter by status, date range

---

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create `crm_automations` table
- [ ] Create `crm_automation_executions` table
- [ ] Build `CRMAutomationEngine` class
- [ ] Implement action executors (move_to_stage, add_tags, etc.)
- [ ] Implement condition evaluators
- [ ] Add trigger hooks to existing code (stage movement, activity logging)

### Phase 2: Time-Based Automations
- [ ] Build cron job for time-based checks
- [ ] Implement `checkTimeInStage()`
- [ ] Implement `checkNoActivity()`
- [ ] Test with sample rules

### Phase 3: Admin UI
- [ ] Automation list page
- [ ] Automation builder (create/edit)
- [ ] Execution log viewer
- [ ] Test creating rules through UI

### Phase 4: Advanced Features
- [ ] Email template system (for `send_email` action)
- [ ] Webhook system (for `webhook` action)
- [ ] Delayed execution (for `wait` action)
- [ ] Multi-step workflow support

---

## Testing Strategy

### Unit Tests
- Test each action executor independently
- Test condition evaluators
- Test trigger matching logic

### Integration Tests
1. **Stage Entry:** Create rule → move contact → verify actions executed
2. **Time-Based:** Create rule → advance time → verify triggered
3. **Conditions:** Create rule with conditions → verify only fires when met
4. **Multiple Actions:** Verify actions execute in order

### Manual QA
- Create real automation rules
- Walk through common workflows
- Verify execution logs are accurate
- Test error handling (what if action fails?)

---

## Future Enhancements

1. **OR Logic in Conditions:** Allow "any of these" instead of just "all of these"
2. **A/B Testing:** Run different actions for 50% of contacts
3. **Score Adjustment Actions:** Increment/decrement lead score
4. **Campaign Triggers:** Start nurture campaigns automatically
5. **Slack/SMS Notifications:** Alert users when high-value actions occur
6. **AI-Powered Suggestions:** "Contacts similar to this often convert best with..."

---

## Summary

This automation system will:
- ✅ Track full member journey through your pipeline
- ✅ Automatically move contacts between stages
- ✅ Apply multiple tags based on rules
- ✅ Execute complex multi-step workflows
- ✅ Handle time-based and behavior-based triggers
- ✅ Provide full audit trail and execution logs

**Next Steps:**
1. Review this plan
2. Start with Phase 1 (Core Infrastructure)
3. Test with a few simple rules
4. Expand to more complex workflows

Want me to start building this?
