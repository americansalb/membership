-- Migration 014: CRM Automation System
-- Creates tables for automation rules, execution tracking, and delayed workflows

-- ============================================================================
-- 1. CRM Automations Table - Rule Definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES crm_pipelines(id) ON DELETE CASCADE, -- NULL = applies to all pipelines

  -- Basic Info
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  -- Trigger: WHEN to run
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN (
    'stage_entered',        -- Contact enters a stage
    'stage_exited',         -- Contact exits a stage
    'time_in_stage',        -- Contact in stage for X days (future)
    'no_activity',          -- No activity for X days (future)
    'tag_added',            -- Tag added to contact
    'tag_removed',          -- Tag removed from contact
    'field_changed',        -- Contact field updated
    'activity_logged',      -- Activity logged (call, email, etc.)
    'scheduled'             -- Run on a schedule (future)
  )),

  -- Trigger configuration (JSON)
  trigger_config JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  -- stage_entered: {"stage_id": "uuid", "substage_id": "uuid"}
  -- time_in_stage: {"stage_id": "uuid", "days": 7}
  -- no_activity: {"days": 30, "activity_types": ["call", "email"]}
  -- field_changed: {"field": "lead_score", "operator": ">=", "value": 80}
  -- tag_added: {"tag_id": "uuid"}
  -- activity_logged: {"activity_type": "call", "title_contains": "demo"}

  -- Conditions: Additional filters (ALL must pass)
  conditions JSONB DEFAULT '[]',
  -- Array of condition objects:
  -- [
  --   {"type": "field_value", "field": "type", "operator": "equals", "value": "prospect"},
  --   {"type": "tag_exists", "tag_id": "uuid"},
  --   {"type": "stage_is_not", "stage_ids": ["uuid1", "uuid2"]}
  -- ]

  -- Actions: WHAT to do (executed in order)
  actions JSONB NOT NULL DEFAULT '[]',
  -- Array of action objects:
  -- [
  --   {"type": "move_to_stage", "config": {"stage_id": "uuid", "substage_id": "uuid"}},
  --   {"type": "add_tags", "config": {"tag_ids": ["uuid1", "uuid2"]}},
  --   {"type": "assign_to", "config": {"user_id": "uuid"}},
  --   {"type": "create_activity", "config": {"type": "note", "title": "...", "description": "..."}},
  --   {"type": "wait", "config": {"days": 7}}
  -- ]

  -- Execution Control
  run_once_per_contact BOOLEAN DEFAULT FALSE,  -- Only trigger once per contact
  priority INTEGER DEFAULT 0,                   -- Higher = runs first

  -- Audit
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_automation_name_per_org UNIQUE(org_id, name)
);

-- Indexes for crm_automations
CREATE INDEX idx_crm_automations_org ON crm_automations(org_id);
CREATE INDEX idx_crm_automations_pipeline ON crm_automations(pipeline_id);
CREATE INDEX idx_crm_automations_trigger ON crm_automations(trigger_type);
CREATE INDEX idx_crm_automations_active ON crm_automations(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_crm_automations_trigger_config ON crm_automations USING GIN(trigger_config);
CREATE INDEX idx_crm_automations_priority ON crm_automations(priority DESC);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_crm_automations_updated_at
  BEFORE UPDATE ON crm_automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 2. CRM Automation Executions Table - Execution Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_automation_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_id UUID NOT NULL REFERENCES crm_automations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Execution status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Queued for execution
    'running',      -- Currently executing
    'completed',    -- Successfully completed
    'failed',       -- Failed with error
    'skipped'       -- Skipped (conditions not met or already run)
  )),

  -- Timing
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Data
  trigger_data JSONB DEFAULT '{}',        -- What caused the trigger
  execution_result JSONB DEFAULT '{}',    -- Results of each action
  error_message TEXT,                     -- Error details if failed

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crm_automation_executions
CREATE INDEX idx_crm_automation_executions_automation ON crm_automation_executions(automation_id);
CREATE INDEX idx_crm_automation_executions_contact ON crm_automation_executions(contact_id);
CREATE INDEX idx_crm_automation_executions_org ON crm_automation_executions(org_id);
CREATE INDEX idx_crm_automation_executions_status ON crm_automation_executions(status);
CREATE INDEX idx_crm_automation_executions_triggered ON crm_automation_executions(triggered_at DESC);

-- Index for finding pending executions (for background processor)
CREATE INDEX idx_crm_automation_executions_pending
  ON crm_automation_executions(status, triggered_at)
  WHERE status = 'pending';

-- ============================================================================
-- 3. CRM Automation Delays Table - Delayed/Multi-Step Workflows (Future)
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_automation_delays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL REFERENCES crm_automation_executions(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL REFERENCES crm_automations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Delay info
  action_index INTEGER NOT NULL,          -- Which action in the sequence to execute next
  resume_at TIMESTAMPTZ NOT NULL,         -- When to resume execution

  -- State
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'resumed', 'cancelled')),
  context JSONB DEFAULT '{}',             -- Execution context to restore

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crm_automation_delays
CREATE INDEX idx_crm_automation_delays_resume
  ON crm_automation_delays(resume_at, status)
  WHERE status = 'waiting';
CREATE INDEX idx_crm_automation_delays_contact ON crm_automation_delays(contact_id);
CREATE INDEX idx_crm_automation_delays_execution ON crm_automation_delays(execution_id);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE crm_automations IS 'Stores automation rule definitions with triggers, conditions, and actions';
COMMENT ON TABLE crm_automation_executions IS 'Logs every automation execution with status, results, and errors';
COMMENT ON TABLE crm_automation_delays IS 'Tracks delayed executions for multi-step workflows with wait actions';

COMMENT ON COLUMN crm_automations.trigger_type IS 'Event type that triggers the automation';
COMMENT ON COLUMN crm_automations.trigger_config IS 'JSONB configuration specific to the trigger type';
COMMENT ON COLUMN crm_automations.conditions IS 'JSONB array of conditions that must all pass for execution';
COMMENT ON COLUMN crm_automations.actions IS 'JSONB array of actions to execute in order';
COMMENT ON COLUMN crm_automations.run_once_per_contact IS 'If true, only executes once per contact (prevents re-triggering)';

COMMENT ON COLUMN crm_automation_executions.trigger_data IS 'JSONB snapshot of data that triggered the automation';
COMMENT ON COLUMN crm_automation_executions.execution_result IS 'JSONB results from each action executed';
