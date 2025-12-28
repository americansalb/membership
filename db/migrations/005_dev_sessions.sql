-- Migration: 005_dev_sessions
-- Create separate sessions table for developer logins

CREATE TABLE IF NOT EXISTS dev_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_sessions_developer ON dev_sessions(developer_id);
CREATE INDEX IF NOT EXISTS idx_dev_sessions_token ON dev_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_dev_sessions_expires ON dev_sessions(expires_at);
