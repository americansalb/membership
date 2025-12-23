-- VillageKeep Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DEVELOPERS (PLATFORM-LEVEL ACCESS)
-- ============================================

CREATE TABLE developers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),

  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_developers_email ON developers(email);

-- ============================================
-- ORGANIZATIONS (MULTI-TENANT)
-- ============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website VARCHAR(255),
  logo_url VARCHAR(500),

  -- Stripe Connect
  stripe_account_id VARCHAR(255),
  stripe_account_status VARCHAR(50) DEFAULT 'pending', -- pending, active, restricted

  -- Settings
  settings JSONB DEFAULT '{}',
  ceu_enabled BOOLEAN DEFAULT false,
  ceu_tracking_period VARCHAR(20) DEFAULT 'annual', -- annual, calendar_year, custom

  -- Subscription
  plan VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
  plan_status VARCHAR(50) DEFAULT 'active', -- active, past_due, canceled
  plan_started_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,

  -- Seat limits (based on plan)
  admin_seat_limit INT DEFAULT 0,  -- Free=0, Pro=2, Enterprise=unlimited(-1)
  staff_seat_limit INT DEFAULT 0,  -- Free=0, Pro=3, Enterprise=unlimited(-1)

  -- Usage tracking
  storage_used_bytes BIGINT DEFAULT 0,
  emails_sent_this_month INT DEFAULT 0,
  sms_sent_this_month INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_stripe_account ON organizations(stripe_account_id);

-- ============================================
-- USERS (ORG ADMINS)
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin', -- owner, admin, staff

  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, email)
);

CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- MEMBERSHIP TIERS
-- ============================================

CREATE TABLE tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_cents INT NOT NULL DEFAULT 0,
  billing_period VARCHAR(50) DEFAULT 'annual', -- monthly, annual, one_time, lifetime
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,

  -- Benefits/features as JSON for flexibility
  benefits JSONB DEFAULT '[]',

  -- Stripe
  stripe_product_id VARCHAR(255),
  stripe_price_id VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tiers_org ON tiers(org_id);

-- ============================================
-- MEMBERS
-- ============================================

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES tiers(id) ON DELETE SET NULL,

  -- Contact info
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'US',

  -- Membership status
  status VARCHAR(50) DEFAULT 'active', -- active, expired, pending, canceled
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,

  -- Stripe
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),

  -- Auth (for member portal)
  password_hash VARCHAR(255),
  last_login_at TIMESTAMPTZ,

  -- Custom fields as JSON
  custom_fields JSONB DEFAULT '{}',

  -- CEU tracking
  ceu_required DECIMAL(5,2) DEFAULT 0,
  ceu_earned DECIMAL(5,2) DEFAULT 0,
  ceu_period_start DATE,
  ceu_period_end DATE,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, email)
);

CREATE INDEX idx_members_org ON members(org_id);
CREATE INDEX idx_members_tier ON members(tier_id);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_stripe_customer ON members(stripe_customer_id);

-- ============================================
-- CEU CREDITS
-- ============================================

CREATE TABLE ceu_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  credits DECIMAL(5,2) NOT NULL,
  category VARCHAR(100), -- e.g., "Ethics", "Medical", "Legal"
  provider VARCHAR(255), -- Who provided the training
  completed_at DATE NOT NULL,

  -- Certificate
  certificate_url VARCHAR(500),
  certificate_number VARCHAR(100),

  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,

  -- Source (manual entry, LMS integration, etc.)
  source VARCHAR(50) DEFAULT 'manual',
  external_id VARCHAR(255), -- ID from external system

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ceu_credits_org ON ceu_credits(org_id);
CREATE INDEX idx_ceu_credits_member ON ceu_credits(member_id);
CREATE INDEX idx_ceu_credits_completed ON ceu_credits(completed_at);

-- ============================================
-- PROTECTED RESOURCES
-- ============================================

CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'page', 'file', 'video', 'course'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  external_id VARCHAR(255), -- For LMS integration

  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resources_org ON resources(org_id);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_external ON resources(external_id);

-- Which tiers can access which resources
CREATE TABLE tier_resources (
  tier_id UUID REFERENCES tiers(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  PRIMARY KEY (tier_id, resource_id)
);

-- ============================================
-- DONATIONS & CAMPAIGNS
-- ============================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  goal_cents INT,
  raised_cents INT DEFAULT 0,
  donor_count INT DEFAULT 0,

  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,

  -- Page customization
  cover_image_url VARCHAR(500),
  slug VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_org ON campaigns(org_id);
CREATE INDEX idx_campaigns_slug ON campaigns(slug);

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,

  -- Donor info (may not be a member)
  donor_email VARCHAR(255) NOT NULL,
  donor_name VARCHAR(255),
  is_anonymous BOOLEAN DEFAULT false,

  amount_cents INT NOT NULL,
  fee_cents INT DEFAULT 0, -- Platform fee if applicable
  net_cents INT NOT NULL, -- Amount org receives

  -- Payment
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded

  -- Recurring
  is_recurring BOOLEAN DEFAULT false,
  stripe_subscription_id VARCHAR(255),

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donations_org ON donations(org_id);
CREATE INDEX idx_donations_campaign ON donations(campaign_id);
CREATE INDEX idx_donations_member ON donations(member_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created ON donations(created_at);

-- ============================================
-- TRANSACTIONS (ALL PAYMENTS)
-- ============================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  donation_id UUID REFERENCES donations(id) ON DELETE SET NULL,

  type VARCHAR(50) NOT NULL, -- 'membership', 'donation', 'refund', 'payout'
  description VARCHAR(255),

  amount_cents INT NOT NULL,
  fee_cents INT DEFAULT 0,
  net_cents INT NOT NULL,

  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255), -- For payouts to org

  status VARCHAR(50) DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_org ON transactions(org_id);
CREATE INDEX idx_transactions_member ON transactions(member_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created ON transactions(created_at);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,

  action VARCHAR(100) NOT NULL, -- 'member.created', 'tier.updated', etc.
  entity_type VARCHAR(50), -- 'member', 'tier', 'donation', etc.
  entity_id UUID,
  changes JSONB, -- What changed

  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_org ON audit_log(org_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================
-- SESSIONS
-- ============================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,

  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,

  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (
    (user_id IS NOT NULL AND member_id IS NULL) OR
    (user_id IS NULL AND member_id IS NOT NULL)
  )
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_member ON sessions(member_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON developers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tiers_updated_at
  BEFORE UPDATE ON tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ceu_credits_updated_at
  BEFORE UPDATE ON ceu_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
