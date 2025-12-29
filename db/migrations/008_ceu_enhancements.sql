-- ============================================
-- CEU ENHANCEMENTS
-- Adds categories, tier requirements, and org settings
-- ============================================

-- CEU Categories (org-configurable credit types)
CREATE TABLE IF NOT EXISTS ceu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '📚',  -- emoji or icon name
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceu_categories_org ON ceu_categories(org_id);

-- Tier-specific CEU Requirements
-- Allows setting different requirements per membership tier
CREATE TABLE IF NOT EXISTS tier_ceu_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_id UUID REFERENCES tiers(id) ON DELETE CASCADE,
  total_required DECIMAL(5,2) DEFAULT 0,
  -- Per-category minimums stored as JSONB: {"ethics": 3, "medical": 2}
  category_minimums JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tier_id)
);

CREATE INDEX IF NOT EXISTS idx_tier_ceu_requirements_tier ON tier_ceu_requirements(tier_id);

-- Add CEU settings to organizations table
DO $$
BEGIN
  -- Add ceu_categories_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'ceu_settings'
  ) THEN
    ALTER TABLE organizations ADD COLUMN ceu_settings JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add category_id to ceu_credits if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ceu_credits' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE ceu_credits ADD COLUMN category_id UUID REFERENCES ceu_categories(id) ON DELETE SET NULL;
  END IF;

  -- Add rejection reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ceu_credits' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE ceu_credits ADD COLUMN rejection_reason TEXT;
  END IF;

  -- Add submitted_by to track member vs admin entry
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ceu_credits' AND column_name = 'submitted_by_member'
  ) THEN
    ALTER TABLE ceu_credits ADD COLUMN submitted_by_member BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Update trigger for ceu_categories
CREATE OR REPLACE FUNCTION update_ceu_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ceu_categories_updated_at ON ceu_categories;
CREATE TRIGGER update_ceu_categories_updated_at
  BEFORE UPDATE ON ceu_categories
  FOR EACH ROW EXECUTE FUNCTION update_ceu_categories_updated_at();

-- Update trigger for tier_ceu_requirements
DROP TRIGGER IF EXISTS update_tier_ceu_requirements_updated_at ON tier_ceu_requirements;
CREATE TRIGGER update_tier_ceu_requirements_updated_at
  BEFORE UPDATE ON tier_ceu_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create default categories function (called when org enables CEU)
CREATE OR REPLACE FUNCTION create_default_ceu_categories(p_org_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO ceu_categories (org_id, name, description, icon, sort_order)
  VALUES
    (p_org_id, 'General', 'General continuing education credits', '📚', 0),
    (p_org_id, 'Ethics', 'Professional ethics and standards', '⚖️', 1),
    (p_org_id, 'Medical', 'Medical terminology and procedures', '🏥', 2),
    (p_org_id, 'Legal', 'Legal terminology and procedures', '⚖️', 3)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
