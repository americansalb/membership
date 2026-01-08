-- Add tags system for member categorization and tracking
-- Migration 010: Tags System

-- ============================================
-- TAGS TABLE
-- ============================================

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1', -- Hex color code
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, name)
);

CREATE INDEX idx_tags_org ON tags(org_id);
CREATE INDEX idx_tags_name ON tags(name);

-- ============================================
-- MEMBER_TAGS (Junction Table)
-- ============================================

CREATE TABLE member_tags (
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,

  PRIMARY KEY (member_id, tag_id)
);

CREATE INDEX idx_member_tags_member ON member_tags(member_id);
CREATE INDEX idx_member_tags_tag ON member_tags(tag_id);
CREATE INDEX idx_member_tags_added ON member_tags(added_at);

-- ============================================
-- AUTO-UPDATE TRIGGER
-- ============================================

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SAMPLE TAGS (Optional - can be removed in production)
-- ============================================

-- Insert some common tags for orgs to use as examples
-- These will be org-specific, so they'll be added when orgs create their first tags
