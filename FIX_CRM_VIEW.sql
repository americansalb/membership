-- FIX FOR CRM CONTACT SUMMARY VIEW
-- Run this in your Render PostgreSQL console

-- Drop the broken view if it exists
DROP VIEW IF EXISTS crm_contact_summary;

-- Recreate the view with correct columns (removing non-existent m.subscription_status)
CREATE OR REPLACE VIEW crm_contact_summary AS
SELECT
  c.id, c.org_id, c.member_id, c.type, c.email, c.first_name, c.last_name,
  c.phone, c.company, c.title, c.source, c.lead_score, c.assigned_to,
  c.custom_fields, c.last_contacted_at, c.created_at, c.updated_at,
  cs.stage_id AS current_stage_id, cs.substage_id AS current_substage_id,
  cs.pipeline_id AS current_pipeline_id,
  s.name AS current_stage_name, s.color AS current_stage_color,
  ss.name AS current_substage_name, ss.color AS current_substage_color,
  p.name AS current_pipeline_name, cs.entered_at AS stage_entered_at,
  u.email AS assigned_user_email, u.name AS assigned_user_name,
  m.status AS member_status,
  -- REMOVED: m.subscription_status (this column doesn't exist)
  COALESCE(
    (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
     FROM crm_contact_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id),
    '[]'::json
  ) AS tags
FROM crm_contacts c
LEFT JOIN crm_contact_stages cs ON cs.contact_id = c.id AND cs.exited_at IS NULL
LEFT JOIN crm_stages s ON s.id = cs.stage_id
LEFT JOIN crm_stages ss ON ss.id = cs.substage_id
LEFT JOIN crm_pipelines p ON p.id = cs.pipeline_id
LEFT JOIN users u ON u.id = c.assigned_to
LEFT JOIN members m ON m.id = c.member_id;
