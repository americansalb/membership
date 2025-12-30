-- ============================================
-- CREDENTIAL-BASED CEU SYSTEM
-- Replaces the tier-based CEU tracking with proper credential management
-- ============================================

-- Credentials: Professional certifications/credentials an org issues or tracks
-- e.g., "Certified Medical Interpreter (CMI)", "Licensed Clinical Social Worker"
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(200) NOT NULL,              -- "Certified Medical Interpreter"
  short_name VARCHAR(50),                   -- "CMI"
  description TEXT,

  -- Renewal configuration
  renewal_period_months INT NOT NULL DEFAULT 12,  -- 12, 24, 36, etc.
  renewal_type VARCHAR(50) DEFAULT 'anniversary', -- anniversary, calendar_year, fiscal_year, custom
  renewal_month INT,                        -- For calendar/fiscal: which month (1-12)
  renewal_day INT,                          -- For custom: which day

  -- CEU requirements
  total_credits_required DECIMAL(6,2) NOT NULL DEFAULT 0,

  -- Grace period after expiration before status changes
  grace_period_days INT DEFAULT 30,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credentials_org ON credentials(org_id);
CREATE INDEX IF NOT EXISTS idx_credentials_active ON credentials(org_id, is_active);

-- Credential Categories: CEU categories specific to each credential
-- e.g., For CMI: "Ethics" (5 required), "Medical Terminology" (10 required)
CREATE TABLE IF NOT EXISTS credential_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id UUID REFERENCES credentials(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,              -- "Ethics", "Medical Terminology"
  description TEXT,
  required_credits DECIMAL(5,2) DEFAULT 0, -- Minimum credits needed in this category

  -- If true, credits in this category also count toward total
  -- If false, these are "extra" requirements on top of total
  counts_toward_total BOOLEAN DEFAULT true,

  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credential_categories_credential ON credential_categories(credential_id);

-- Member Credentials: Which members hold which credentials
CREATE TABLE IF NOT EXISTS member_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES credentials(id) ON DELETE CASCADE,

  -- When they earned/received this credential
  earned_date DATE NOT NULL,

  -- Current renewal period
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'active',  -- active, expired, suspended, revoked

  -- External credential number if applicable
  credential_number VARCHAR(100),

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- A member can only have one instance of each credential
  UNIQUE(member_id, credential_id)
);

CREATE INDEX IF NOT EXISTS idx_member_credentials_member ON member_credentials(member_id);
CREATE INDEX IF NOT EXISTS idx_member_credentials_credential ON member_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_member_credentials_status ON member_credentials(status);
CREATE INDEX IF NOT EXISTS idx_member_credentials_period_end ON member_credentials(current_period_end);

-- CEU Credits: Now linked to member_credential, not just member
-- Drop the old foreign key approach and recreate properly
ALTER TABLE ceu_credits
  ADD COLUMN IF NOT EXISTS member_credential_id UUID REFERENCES member_credentials(id) ON DELETE CASCADE;

ALTER TABLE ceu_credits
  ADD COLUMN IF NOT EXISTS credential_category_id UUID REFERENCES credential_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ceu_credits_member_credential ON ceu_credits(member_credential_id);
CREATE INDEX IF NOT EXISTS idx_ceu_credits_credential_category ON ceu_credits(credential_category_id);

-- Custom Fields: Allow orgs to add custom questions to credential applications/renewals
CREATE TABLE IF NOT EXISTS credential_custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id UUID REFERENCES credentials(id) ON DELETE CASCADE,

  field_name VARCHAR(100) NOT NULL,        -- Internal name
  field_label VARCHAR(200) NOT NULL,       -- Display label
  field_type VARCHAR(50) NOT NULL,         -- text, textarea, number, date, select, checkbox, file

  -- For select fields: JSON array of options
  options JSONB,                           -- ["Option 1", "Option 2"] or [{value: "a", label: "A"}]

  -- Validation
  is_required BOOLEAN DEFAULT false,
  min_value DECIMAL(10,2),                 -- For number fields
  max_value DECIMAL(10,2),                 -- For number fields
  max_length INT,                          -- For text fields

  -- Display
  placeholder TEXT,
  help_text TEXT,
  sort_order INT DEFAULT 0,

  -- When to show this field
  show_on_application BOOLEAN DEFAULT true,   -- Show when member first gets credential
  show_on_renewal BOOLEAN DEFAULT true,       -- Show on renewal
  show_on_credit_submission BOOLEAN DEFAULT false, -- Show when submitting CEU credits

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credential_custom_fields_credential ON credential_custom_fields(credential_id);

-- Custom Field Values: Store responses to custom fields
CREATE TABLE IF NOT EXISTS credential_custom_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_credential_id UUID REFERENCES member_credentials(id) ON DELETE CASCADE,
  custom_field_id UUID REFERENCES credential_custom_fields(id) ON DELETE CASCADE,

  -- The value (stored as text, parse based on field_type)
  value TEXT,

  -- For file uploads
  file_url TEXT,
  file_name VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(member_credential_id, custom_field_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_field_values_member_cred ON credential_custom_field_values(member_credential_id);

-- Update triggers
CREATE OR REPLACE FUNCTION update_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_credentials_updated_at ON credentials;
CREATE TRIGGER update_credentials_updated_at
  BEFORE UPDATE ON credentials
  FOR EACH ROW EXECUTE FUNCTION update_credentials_updated_at();

DROP TRIGGER IF EXISTS update_credential_categories_updated_at ON credential_categories;
CREATE TRIGGER update_credential_categories_updated_at
  BEFORE UPDATE ON credential_categories
  FOR EACH ROW EXECUTE FUNCTION update_credentials_updated_at();

DROP TRIGGER IF EXISTS update_member_credentials_updated_at ON member_credentials;
CREATE TRIGGER update_member_credentials_updated_at
  BEFORE UPDATE ON member_credentials
  FOR EACH ROW EXECUTE FUNCTION update_credentials_updated_at();

DROP TRIGGER IF EXISTS update_credential_custom_fields_updated_at ON credential_custom_fields;
CREATE TRIGGER update_credential_custom_fields_updated_at
  BEFORE UPDATE ON credential_custom_fields
  FOR EACH ROW EXECUTE FUNCTION update_credentials_updated_at();

-- Function to calculate next renewal period dates
CREATE OR REPLACE FUNCTION calculate_renewal_period(
  p_credential_id UUID,
  p_from_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(period_start DATE, period_end DATE) AS $$
DECLARE
  v_credential credentials%ROWTYPE;
  v_period_months INT;
BEGIN
  SELECT * INTO v_credential FROM credentials WHERE id = p_credential_id;

  IF v_credential IS NULL THEN
    RETURN;
  END IF;

  v_period_months := v_credential.renewal_period_months;

  CASE v_credential.renewal_type
    WHEN 'anniversary' THEN
      -- Period starts from the given date
      period_start := p_from_date;
      period_end := p_from_date + (v_period_months || ' months')::INTERVAL - INTERVAL '1 day';

    WHEN 'calendar_year' THEN
      -- Period is Jan 1 - Dec 31
      period_start := DATE_TRUNC('year', p_from_date)::DATE;
      period_end := (DATE_TRUNC('year', p_from_date) + INTERVAL '1 year' - INTERVAL '1 day')::DATE;

    WHEN 'fiscal_year' THEN
      -- Fiscal year starting from renewal_month
      IF EXTRACT(MONTH FROM p_from_date) >= COALESCE(v_credential.renewal_month, 7) THEN
        period_start := MAKE_DATE(EXTRACT(YEAR FROM p_from_date)::INT, COALESCE(v_credential.renewal_month, 7), 1);
        period_end := MAKE_DATE(EXTRACT(YEAR FROM p_from_date)::INT + 1, COALESCE(v_credential.renewal_month, 7), 1) - INTERVAL '1 day';
      ELSE
        period_start := MAKE_DATE(EXTRACT(YEAR FROM p_from_date)::INT - 1, COALESCE(v_credential.renewal_month, 7), 1);
        period_end := MAKE_DATE(EXTRACT(YEAR FROM p_from_date)::INT, COALESCE(v_credential.renewal_month, 7), 1) - INTERVAL '1 day';
      END IF;

    ELSE
      -- Default to anniversary
      period_start := p_from_date;
      period_end := p_from_date + (v_period_months || ' months')::INTERVAL - INTERVAL '1 day';
  END CASE;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- View: Member credential progress
CREATE OR REPLACE VIEW member_credential_progress AS
SELECT
  mc.id AS member_credential_id,
  mc.member_id,
  mc.credential_id,
  c.name AS credential_name,
  c.short_name AS credential_short_name,
  mc.earned_date,
  mc.current_period_start,
  mc.current_period_end,
  mc.status,
  c.total_credits_required,
  COALESCE(SUM(
    CASE WHEN cc.status = 'verified'
         AND cc.completed_at >= mc.current_period_start
         AND cc.completed_at <= mc.current_period_end
    THEN cc.credits ELSE 0 END
  ), 0) AS credits_earned,
  c.total_credits_required - COALESCE(SUM(
    CASE WHEN cc.status = 'verified'
         AND cc.completed_at >= mc.current_period_start
         AND cc.completed_at <= mc.current_period_end
    THEN cc.credits ELSE 0 END
  ), 0) AS credits_remaining,
  CASE
    WHEN mc.current_period_end < CURRENT_DATE THEN 'expired'
    WHEN mc.current_period_end < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN COALESCE(SUM(
      CASE WHEN cc.status = 'verified'
           AND cc.completed_at >= mc.current_period_start
           AND cc.completed_at <= mc.current_period_end
      THEN cc.credits ELSE 0 END
    ), 0) >= c.total_credits_required THEN 'complete'
    ELSE 'in_progress'
  END AS progress_status
FROM member_credentials mc
JOIN credentials c ON c.id = mc.credential_id
LEFT JOIN ceu_credits cc ON cc.member_credential_id = mc.id
GROUP BY mc.id, mc.member_id, mc.credential_id, c.name, c.short_name,
         mc.earned_date, mc.current_period_start, mc.current_period_end,
         mc.status, c.total_credits_required;

COMMENT ON TABLE credentials IS 'Professional credentials/certifications that organizations issue or track';
COMMENT ON TABLE credential_categories IS 'CEU categories specific to each credential with minimum requirements';
COMMENT ON TABLE member_credentials IS 'Links members to credentials they hold with renewal tracking';
COMMENT ON TABLE credential_custom_fields IS 'Custom questions/fields orgs can add to credential forms';
