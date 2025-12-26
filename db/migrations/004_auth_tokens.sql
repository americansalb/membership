-- Migration: 004_auth_tokens
-- Adds tables for password reset and email verification tokens

-- ============================================
-- PASSWORD RESET TOKENS
-- ============================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Can be for users OR members (not both)
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,

  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ, -- NULL if not yet used

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (
    (user_id IS NOT NULL AND member_id IS NULL) OR
    (user_id IS NULL AND member_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_member ON password_reset_tokens(member_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

-- ============================================
-- EMAIL VERIFICATION TOKENS
-- ============================================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Can be for users OR members (not both)
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,

  email VARCHAR(255) NOT NULL, -- Email being verified (in case they change it)
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ, -- NULL if not yet verified

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (
    (user_id IS NOT NULL AND member_id IS NULL) OR
    (user_id IS NULL AND member_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_email_verify_token ON email_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verify_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verify_member ON email_verification_tokens(member_id);
CREATE INDEX IF NOT EXISTS idx_email_verify_expires ON email_verification_tokens(expires_at);

-- ============================================
-- DEVELOPER PASSWORD RESET (if needed)
-- ============================================

CREATE TABLE IF NOT EXISTS developer_password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,

  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_password_reset_token ON developer_password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_dev_password_reset_dev ON developer_password_reset_tokens(developer_id);
