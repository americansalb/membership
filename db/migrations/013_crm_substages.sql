-- CRM Substages
-- Migration 013: Add substages to CRM stages for granular journey tracking

-- ============================================
-- ADD SUBSTAGES SUPPORT TO STAGES TABLE
-- ============================================

-- Add parent_stage_id to stages to create parent-child relationships
ALTER TABLE crm_stages ADD COLUMN parent_stage_id UUID REFERENCES crm_stages(id) ON DELETE CASCADE;
CREATE INDEX idx_crm_stages_parent ON crm_stages(parent_stage_id);

-- ============================================
-- UPDATE CONTACT STAGES TO TRACK SUBSTAGE
-- ============================================

-- Add substage_id to track which substage a contact is in
ALTER TABLE crm_contact_stages ADD COLUMN substage_id UUID REFERENCES crm_stages(id) ON DELETE SET NULL;
CREATE INDEX idx_crm_contact_stages_substage ON crm_contact_stages(substage_id);

-- ============================================
-- HELPER FUNCTION: Move Contact with Substage Support
-- ============================================

-- Enhanced version that supports substages
CREATE OR REPLACE FUNCTION crm_move_contact_to_stage(
  p_contact_id UUID,
  p_stage_id UUID,
  p_moved_by UUID,
  p_notes TEXT DEFAULT NULL,
  p_substage_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_pipeline_id UUID;
  v_org_id UUID;
  v_stage_entry_id UUID;
  v_old_stage_id UUID;
  v_parent_stage_id UUID;
BEGIN
  -- Get stage's pipeline and org
  SELECT pipeline_id, org_id, parent_stage_id INTO v_pipeline_id, v_org_id, v_parent_stage_id
  FROM crm_stages
  WHERE id = p_stage_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stage not found: %', p_stage_id;
  END IF;

  -- If this is a substage (has parent_stage_id), validate substage_id is not set
  IF v_parent_stage_id IS NOT NULL AND p_substage_id IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot set substage when moving to a substage';
  END IF;

  -- If substage is provided, validate it belongs to the stage
  IF p_substage_id IS NOT NULL THEN
    DECLARE
      v_substage_parent UUID;
    BEGIN
      SELECT parent_stage_id INTO v_substage_parent
      FROM crm_stages
      WHERE id = p_substage_id;

      IF v_substage_parent != p_stage_id THEN
        RAISE EXCEPTION 'Substage % does not belong to stage %', p_substage_id, p_stage_id;
      END IF;
    END;
  END IF;

  -- Exit current stage in this pipeline (if any)
  UPDATE crm_contact_stages
  SET exited_at = NOW()
  WHERE contact_id = p_contact_id
    AND pipeline_id = v_pipeline_id
    AND exited_at IS NULL
  RETURNING stage_id INTO v_old_stage_id;

  -- Enter new stage (with optional substage)
  INSERT INTO crm_contact_stages (
    contact_id,
    stage_id,
    substage_id,
    pipeline_id,
    org_id,
    moved_by,
    notes
  ) VALUES (
    p_contact_id,
    p_stage_id,
    p_substage_id,
    v_pipeline_id,
    v_org_id,
    p_moved_by,
    p_notes
  )
  RETURNING id INTO v_stage_entry_id;

  -- Update contact's last_contacted_at
  UPDATE crm_contacts
  SET updated_at = NOW()
  WHERE id = p_contact_id;

  -- Log activity for stage change
  PERFORM crm_log_activity(
    v_org_id,
    p_contact_id,
    'system',
    CASE
      WHEN p_substage_id IS NOT NULL THEN
        'Moved to ' || (SELECT name FROM crm_stages WHERE id = p_stage_id) || ' → ' || (SELECT name FROM crm_stages WHERE id = p_substage_id)
      ELSE
        'Moved to ' || (SELECT name FROM crm_stages WHERE id = p_stage_id)
    END,
    p_notes,
    jsonb_build_object(
      'stage_id', p_stage_id,
      'substage_id', p_substage_id,
      'old_stage_id', v_old_stage_id
    ),
    p_moved_by
  );

  RETURN v_stage_entry_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- UPDATE VIEW: Include Substages
-- ============================================

DROP VIEW IF EXISTS crm_contact_summary;

CREATE OR REPLACE VIEW crm_contact_summary AS
SELECT
  c.id,
  c.org_id,
  c.member_id,
  c.type,
  c.email,
  c.first_name,
  c.last_name,
  c.phone,
  c.company,
  c.title,
  c.source,
  c.lead_score,
  c.assigned_to,
  c.custom_fields,
  c.last_contacted_at,
  c.created_at,
  c.updated_at,

  -- Current stage info (per pipeline)
  cs.stage_id AS current_stage_id,
  cs.substage_id AS current_substage_id,
  cs.pipeline_id AS current_pipeline_id,
  s.name AS current_stage_name,
  s.color AS current_stage_color,
  ss.name AS current_substage_name,
  ss.color AS current_substage_color,
  p.name AS current_pipeline_name,
  cs.entered_at AS stage_entered_at,

  -- Assigned user info
  u.email AS assigned_user_email,
  u.name AS assigned_user_name,

  -- Member info (if converted)
  m.status AS member_status,

  -- Tags array
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
LEFT JOIN crm_stages ss ON ss.id = cs.substage_id
LEFT JOIN crm_pipelines p ON p.id = cs.pipeline_id
LEFT JOIN users u ON u.id = c.assigned_to
LEFT JOIN members m ON m.id = c.member_id;
