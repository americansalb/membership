-- CRM Activities & Timeline
-- Migration 012: CRM Activities (Phase 2)

-- ============================================
-- CRM ACTIVITIES TABLE
-- ============================================

CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,

  -- Activity Type
  type VARCHAR(50) NOT NULL CHECK (type IN ('note', 'email', 'call', 'meeting', 'task', 'system')),

  -- Content
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Related entities (polymorphic)
  related_type VARCHAR(100), -- e.g., 'member', 'course', 'payment'
  related_id UUID,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,

  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Task fields
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Tracking
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Visibility
  is_visible_to_contact BOOLEAN DEFAULT false
);

CREATE INDEX idx_crm_activities_org ON crm_activities(org_id);
CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_type ON crm_activities(type);
CREATE INDEX idx_crm_activities_assigned ON crm_activities(assigned_to);
CREATE INDEX idx_crm_activities_status ON crm_activities(status);
CREATE INDEX idx_crm_activities_due ON crm_activities(due_at);
CREATE INDEX idx_crm_activities_scheduled ON crm_activities(scheduled_at);
CREATE INDEX idx_crm_activities_created ON crm_activities(created_at);
CREATE INDEX idx_crm_activities_related ON crm_activities(related_type, related_id);

-- Auto-update trigger
CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON crm_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HELPER FUNCTION: Log Activity
-- ============================================

CREATE OR REPLACE FUNCTION crm_log_activity(
  p_org_id UUID,
  p_contact_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  -- Insert activity
  INSERT INTO crm_activities (
    org_id,
    contact_id,
    type,
    title,
    description,
    metadata,
    created_by,
    status
  ) VALUES (
    p_org_id,
    p_contact_id,
    p_type,
    p_title,
    p_description,
    COALESCE(p_metadata, '{}'::jsonb),
    p_created_by,
    'completed' -- System-logged activities are auto-completed
  )
  RETURNING id INTO v_activity_id;

  -- Update contact's last_contacted_at
  UPDATE crm_contacts
  SET last_contacted_at = NOW()
  WHERE id = p_contact_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEW: Activity Summary with Contact/User Info
-- ============================================

CREATE OR REPLACE VIEW crm_activity_summary AS
SELECT
  a.id,
  a.org_id,
  a.contact_id,
  a.type,
  a.title,
  a.description,
  a.scheduled_at,
  a.completed_at,
  a.due_at,
  a.assigned_to,
  a.priority,
  a.status,
  a.metadata,
  a.created_by,
  a.created_at,
  a.updated_at,
  a.is_visible_to_contact,

  -- Contact info
  c.email AS contact_email,
  c.first_name AS contact_first_name,
  c.last_name AS contact_last_name,
  c.company AS contact_company,

  -- Assigned user info
  u_assigned.name AS assigned_user_name,
  u_assigned.email AS assigned_user_email,

  -- Created by user info
  u_created.name AS created_by_name,
  u_created.email AS created_by_email,

  -- Completed by user info
  u_completed.name AS completed_by_name,
  u_completed.email AS completed_by_email

FROM crm_activities a
LEFT JOIN crm_contacts c ON c.id = a.contact_id
LEFT JOIN users u_assigned ON u_assigned.id = a.assigned_to
LEFT JOIN users u_created ON u_created.id = a.created_by
LEFT JOIN users u_completed ON u_completed.id = a.completed_by;
