-- Migration: 001_add_developers_and_seat_limits
-- Adds developers table and seat limit columns to organizations

-- ============================================
-- DEVELOPERS (PLATFORM-LEVEL ACCESS)
-- ============================================

CREATE TABLE IF NOT EXISTS developers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),

  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_developers_email ON developers(email);

-- ============================================
-- ADD SEAT LIMITS TO ORGANIZATIONS
-- ============================================

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS admin_seat_limit INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS staff_seat_limit INT DEFAULT 0;

COMMENT ON COLUMN organizations.admin_seat_limit IS 'Free=0, Pro=2, Enterprise=-1 (unlimited)';
COMMENT ON COLUMN organizations.staff_seat_limit IS 'Free=0, Pro=3, Enterprise=-1 (unlimited)';

-- ============================================
-- TRIGGER FOR DEVELOPERS
-- ============================================

CREATE OR REPLACE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON developers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
