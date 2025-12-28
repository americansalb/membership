-- Member Activity Tracking
-- Every meaningful thing that happens to or with a member

CREATE TABLE IF NOT EXISTS member_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,

  -- What happened
  type VARCHAR(50) NOT NULL,
  -- Types:
  -- 'joined' - member created
  -- 'renewed' - membership renewed
  -- 'expired' - membership expired
  -- 'payment_success' - payment processed
  -- 'payment_failed' - payment failed
  -- 'payment_retry' - payment retry attempted
  -- 'email_sent' - email sent to member
  -- 'email_opened' - member opened email
  -- 'email_clicked' - member clicked link in email
  -- 'sms_sent' - SMS sent
  -- 'login' - logged into portal
  -- 'login_failed' - failed login attempt
  -- 'password_reset' - password was reset
  -- 'profile_updated' - member updated their profile
  -- 'tier_changed' - moved to different tier
  -- 'status_changed' - status changed (active, expired, etc)
  -- 'ceu_earned' - earned CEU credits
  -- 'ceu_expiring' - CEU deadline approaching
  -- 'note_added' - admin added a note
  -- 'call_logged' - admin logged a phone call
  -- 'resource_accessed' - accessed protected resource

  title VARCHAR(255) NOT NULL,  -- Human readable: "Payment of $245.00 processed"
  description TEXT,             -- Additional context

  -- Metadata (flexible JSON for type-specific data)
  metadata JSONB DEFAULT '{}',
  -- Examples:
  -- payment_success: { "amount_cents": 24500, "card_last4": "4242", "transaction_id": "..." }
  -- email_sent: { "template": "renewal_reminder", "subject": "Your renewal is coming up" }
  -- tier_changed: { "from_tier": "Basic", "to_tier": "Professional" }
  -- ceu_earned: { "credits": 2.5, "course": "Ethics in Practice" }

  -- Who caused this (null = system/automated)
  caused_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  caused_by_member_id UUID REFERENCES members(id) ON DELETE SET NULL,

  -- For linking to related records
  related_type VARCHAR(50),  -- 'transaction', 'ceu_credit', 'email', etc
  related_id UUID,

  -- When
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Visibility (some activities are internal-only)
  visible_to_member BOOLEAN DEFAULT false
);

CREATE INDEX idx_member_activity_org ON member_activity(org_id);
CREATE INDEX idx_member_activity_member ON member_activity(member_id);
CREATE INDEX idx_member_activity_type ON member_activity(type);
CREATE INDEX idx_member_activity_created ON member_activity(created_at DESC);

-- Index for efficient timeline queries
CREATE INDEX idx_member_activity_timeline
  ON member_activity(member_id, created_at DESC);

-- ============================================
-- MEMBER COMPUTED FIELDS VIEW
-- Aggregates useful member stats
-- ============================================

CREATE OR REPLACE VIEW member_summary AS
SELECT
  m.id,
  m.org_id,
  m.email,
  m.first_name,
  m.last_name,
  m.phone,
  m.status,
  m.tier_id,
  t.name as tier_name,
  t.price_cents as tier_price_cents,
  m.joined_at,
  m.expires_at,
  m.auto_renew,
  m.ceu_required,
  m.ceu_earned,
  m.ceu_period_end,
  m.notes,
  m.last_login_at,
  m.created_at,

  -- Computed: Member tenure
  EXTRACT(DAYS FROM NOW() - m.joined_at) as member_days,
  EXTRACT(YEARS FROM NOW() - m.joined_at) as member_years,

  -- Computed: Days until expiration (negative = overdue)
  CASE
    WHEN m.expires_at IS NOT NULL THEN
      EXTRACT(DAYS FROM m.expires_at - NOW())::INT
    ELSE NULL
  END as days_until_expiration,

  -- Computed: CEU progress
  CASE
    WHEN m.ceu_required > 0 THEN
      ROUND((m.ceu_earned / m.ceu_required * 100)::NUMERIC, 1)
    ELSE NULL
  END as ceu_progress_percent,

  -- Computed: Days until CEU deadline
  CASE
    WHEN m.ceu_period_end IS NOT NULL THEN
      (m.ceu_period_end - CURRENT_DATE)
    ELSE NULL
  END as days_until_ceu_deadline,

  -- Aggregated: Total lifetime value
  COALESCE((
    SELECT SUM(amount_cents)
    FROM transactions tx
    WHERE tx.member_id = m.id AND tx.status = 'completed'
  ), 0) as lifetime_value_cents,

  -- Aggregated: Total transactions
  (
    SELECT COUNT(*)
    FROM transactions tx
    WHERE tx.member_id = m.id AND tx.status = 'completed'
  ) as total_transactions,

  -- Aggregated: Last payment date
  (
    SELECT MAX(created_at)
    FROM transactions tx
    WHERE tx.member_id = m.id AND tx.status = 'completed'
  ) as last_payment_at,

  -- Aggregated: Failed payment count (recent)
  (
    SELECT COUNT(*)
    FROM member_activity ma
    WHERE ma.member_id = m.id
      AND ma.type = 'payment_failed'
      AND ma.created_at > NOW() - INTERVAL '30 days'
  ) as recent_failed_payments,

  -- Aggregated: Last activity
  (
    SELECT MAX(created_at)
    FROM member_activity ma
    WHERE ma.member_id = m.id
  ) as last_activity_at,

  -- Aggregated: Last email opened
  (
    SELECT MAX(created_at)
    FROM member_activity ma
    WHERE ma.member_id = m.id AND ma.type = 'email_opened'
  ) as last_email_opened_at

FROM members m
LEFT JOIN tiers t ON m.tier_id = t.id;

-- ============================================
-- HELPER: Log member activity
-- ============================================

CREATE OR REPLACE FUNCTION log_member_activity(
  p_org_id UUID,
  p_member_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_caused_by_user_id UUID DEFAULT NULL,
  p_related_type VARCHAR(50) DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_visible_to_member BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO member_activity (
    org_id, member_id, type, title, description,
    metadata, caused_by_user_id, related_type, related_id, visible_to_member
  ) VALUES (
    p_org_id, p_member_id, p_type, p_title, p_description,
    p_metadata, p_caused_by_user_id, p_related_type, p_related_id, p_visible_to_member
  ) RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;
