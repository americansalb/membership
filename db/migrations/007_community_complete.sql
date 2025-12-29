-- Migration: 007_community_complete
-- Complete community features: moderation, 2FA, real-time, rich content

-- ============================================
-- MEMBER ONLINE STATUS & PRESENCE
-- ============================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_members_online ON members(org_id, is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_members_last_seen ON members(last_seen_at DESC);


-- ============================================
-- MEMBER 2FA (TOTP)
-- ============================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255);
ALTER TABLE members ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS totp_backup_codes JSONB;
ALTER TABLE members ADD COLUMN IF NOT EXISTS totp_enabled_at TIMESTAMPTZ;


-- ============================================
-- MEMBER SESSIONS
-- Track active sessions for security
-- ============================================

CREATE TABLE IF NOT EXISTS member_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Session identification
  token_hash VARCHAR(255) NOT NULL,

  -- Device info
  user_agent TEXT,
  ip_address INET,
  device_name VARCHAR(255), -- Parsed from user agent

  -- Activity tracking
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Revocation
  revoked_at TIMESTAMPTZ,
  revoked_reason VARCHAR(100)
);

CREATE INDEX idx_member_sessions_member ON member_sessions(member_id);
CREATE INDEX idx_member_sessions_token ON member_sessions(token_hash);
CREATE INDEX idx_member_sessions_active ON member_sessions(member_id, expires_at) WHERE revoked_at IS NULL;


-- ============================================
-- ENHANCED MEMBER PROFILES
-- Rich profile fields
-- ============================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS title VARCHAR(255); -- Job title / role
ALTER TABLE members ADD COLUMN IF NOT EXISTS location_city VARCHAR(100);
ALTER TABLE members ADD COLUMN IF NOT EXISTS location_state VARCHAR(100);
ALTER TABLE members ADD COLUMN IF NOT EXISTS location_country VARCHAR(100);
ALTER TABLE members ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'; -- ["English", "Spanish"]
ALTER TABLE members ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'; -- [{name, year, issuer}]
ALTER TABLE members ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'; -- ["Medical", "Legal"]
ALTER TABLE members ADD COLUMN IF NOT EXISTS years_experience INT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'; -- {linkedin, twitter, website}
ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;


-- ============================================
-- POST MODERATION
-- ============================================

ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES users(id);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS lock_reason VARCHAR(255);

ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS delete_reason VARCHAR(255);

ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES users(id);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS edit_reason VARCHAR(255);

-- Rich content
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS content_html TEXT;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Index for soft deletes
CREATE INDEX IF NOT EXISTS idx_posts_not_deleted ON community_posts(forum_id, created_at DESC) WHERE deleted_at IS NULL;


-- ============================================
-- MEMBER COMMUNITY STATUS
-- Bans, mutes, warnings
-- ============================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS community_banned_at TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN IF NOT EXISTS community_banned_by UUID REFERENCES users(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS community_ban_reason VARCHAR(500);

ALTER TABLE members ADD COLUMN IF NOT EXISTS community_muted_until TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN IF NOT EXISTS community_muted_by UUID REFERENCES users(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS community_mute_reason VARCHAR(500);

ALTER TABLE members ADD COLUMN IF NOT EXISTS community_warning_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_members_banned ON members(org_id, community_banned_at) WHERE community_banned_at IS NOT NULL;


-- ============================================
-- COMMUNITY REPORTS
-- Members report inappropriate content
-- ============================================

CREATE TABLE IF NOT EXISTS community_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Reporter
  reporter_id UUID REFERENCES members(id) ON DELETE SET NULL,

  -- What's being reported
  target_type VARCHAR(20) NOT NULL, -- 'post', 'message', 'member'
  target_id UUID NOT NULL,

  -- Report details
  reason VARCHAR(50) NOT NULL, -- 'spam', 'harassment', 'inappropriate', 'other'
  details TEXT,

  -- Resolution
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'action_taken', 'dismissed'
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_org ON community_reports(org_id);
CREATE INDEX idx_reports_status ON community_reports(org_id, status) WHERE status = 'pending';
CREATE INDEX idx_reports_target ON community_reports(target_type, target_id);


-- ============================================
-- MODERATION LOG
-- Audit trail for all moderation actions
-- ============================================

CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Who performed the action
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin/staff

  -- What was done
  action VARCHAR(50) NOT NULL, -- 'delete_post', 'ban_member', 'lock_thread', 'warn_member', etc.

  -- Target of the action
  target_type VARCHAR(20) NOT NULL, -- 'post', 'member', 'forum'
  target_id UUID NOT NULL,

  -- Context
  reason VARCHAR(500),
  details JSONB, -- Additional context, previous state, etc.

  -- Related report (if action was from a report)
  report_id UUID REFERENCES community_reports(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_modlog_org ON moderation_log(org_id);
CREATE INDEX idx_modlog_created ON moderation_log(org_id, created_at DESC);
CREATE INDEX idx_modlog_target ON moderation_log(target_type, target_id);
CREATE INDEX idx_modlog_user ON moderation_log(user_id);


-- ============================================
-- MENTIONS
-- @mentions in posts
-- ============================================

CREATE TABLE IF NOT EXISTS mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Where the mention occurred
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,

  -- Who was mentioned
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Has the mentioned member seen it?
  seen_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(post_id, member_id)
);

CREATE INDEX idx_mentions_member ON mentions(member_id, seen_at) WHERE seen_at IS NULL;


-- ============================================
-- MESSAGE THREADS
-- Group conversations by thread
-- ============================================

CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Thread type
  is_group BOOLEAN DEFAULT false, -- Future: group chats

  -- For direct messages: participant IDs (sorted for consistent lookup)
  participant_ids UUID[] NOT NULL,

  -- Thread metadata
  subject VARCHAR(255),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_threads_org ON message_threads(org_id);
CREATE INDEX idx_threads_participants ON message_threads USING GIN(participant_ids);
CREATE INDEX idx_threads_last_message ON message_threads(last_message_at DESC);


-- ============================================
-- MESSAGES (New schema replacing direct_messages)
-- Supports threads, read receipts, reactions
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,

  -- Sender
  sender_id UUID REFERENCES members(id) ON DELETE SET NULL,

  -- Content
  body TEXT NOT NULL,
  content_html TEXT, -- Rich text version
  attachments JSONB DEFAULT '[]',

  -- Status
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_thread ON messages(thread_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);


-- ============================================
-- MESSAGE READ STATUS
-- Per-participant read tracking
-- ============================================

CREATE TABLE IF NOT EXISTS message_read_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Last read message in thread
  last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMPTZ,

  -- Notification settings for this thread
  muted_until TIMESTAMPTZ,

  UNIQUE(thread_id, member_id)
);

CREATE INDEX idx_read_status_member ON message_read_status(member_id);


-- ============================================
-- MESSAGE REACTIONS
-- Emoji reactions to messages
-- ============================================

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  emoji VARCHAR(10) NOT NULL, -- '👍', '❤️', etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(message_id, member_id, emoji)
);

CREATE INDEX idx_reactions_message ON message_reactions(message_id);


-- ============================================
-- TYPING INDICATORS
-- Ephemeral, but we track in DB for persistence across reconnects
-- ============================================

CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  started_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(thread_id, member_id)
);

-- Clean up old typing indicators periodically (done via scheduled job, no index needed)
CREATE INDEX IF NOT EXISTS idx_typing_started ON typing_indicators(started_at);


-- ============================================
-- MEMBER BADGES
-- Achievements, roles, flair
-- ============================================

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Badge details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- emoji or icon name
  color VARCHAR(7), -- hex color

  -- Display
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,

  -- Who awarded it
  awarded_by UUID REFERENCES users(id),
  awarded_reason VARCHAR(255),

  -- Display preference
  is_primary BOOLEAN DEFAULT false, -- Show on profile card

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(member_id, badge_id)
);

CREATE INDEX idx_member_badges_member ON member_badges(member_id);


-- ============================================
-- NOTIFICATION PREFERENCES
-- Granular control over notifications
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  email_digest VARCHAR(20) DEFAULT 'daily', -- 'immediate', 'daily', 'weekly', 'never'

  -- Type preferences (JSONB for flexibility)
  preferences JSONB DEFAULT '{
    "announcements": {"in_app": true, "email": true},
    "mentions": {"in_app": true, "email": true},
    "replies": {"in_app": true, "email": false},
    "messages": {"in_app": true, "email": true},
    "likes": {"in_app": true, "email": false}
  }',

  -- Quiet hours
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(member_id)
);


-- ============================================
-- ORGANIZATION COMMUNITY SETTINGS
-- Org-level community configuration
-- ============================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS community_settings JSONB DEFAULT '{
  "enabled": true,
  "require_2fa": false,
  "allow_member_posts": true,
  "allow_direct_messages": true,
  "allow_member_directory": true,
  "profile_fields": {
    "bio": {"enabled": true, "required": false},
    "title": {"enabled": true, "required": false},
    "location": {"enabled": true, "required": false},
    "languages": {"enabled": true, "required": false},
    "certifications": {"enabled": true, "required": false},
    "skills": {"enabled": true, "required": false},
    "social_links": {"enabled": false, "required": false}
  },
  "default_forums": ["announcements", "general", "questions"]
}';


-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update member online status
CREATE OR REPLACE FUNCTION update_member_presence()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark member as online and update last_seen
  UPDATE members
  SET is_online = true, last_seen_at = NOW()
  WHERE id = NEW.member_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators WHERE started_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Function to update thread last message
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_threads
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.body, 100)
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for thread last message
DROP TRIGGER IF EXISTS trigger_update_thread_last_message ON messages;
CREATE TRIGGER trigger_update_thread_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_message();

-- Function to update post reply count
CREATE OR REPLACE FUNCTION update_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE community_posts SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE community_posts SET reply_count = reply_count - 1 WHERE id = OLD.parent_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for reply count
DROP TRIGGER IF EXISTS trigger_update_post_reply_count ON community_posts;
CREATE TRIGGER trigger_update_post_reply_count
  AFTER INSERT OR DELETE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_reply_count();

-- Function to update post like count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for like count
DROP TRIGGER IF EXISTS trigger_update_post_like_count ON community_post_likes;
CREATE TRIGGER trigger_update_post_like_count
  AFTER INSERT OR DELETE ON community_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- Function to update forum post count
CREATE OR REPLACE FUNCTION update_forum_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NULL THEN
    UPDATE community_forums
    SET post_count = post_count + 1, last_post_at = NEW.created_at
    WHERE id = NEW.forum_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NULL THEN
    UPDATE community_forums SET post_count = post_count - 1 WHERE id = OLD.forum_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for forum post count
DROP TRIGGER IF EXISTS trigger_update_forum_post_count ON community_posts;
CREATE TRIGGER trigger_update_forum_post_count
  AFTER INSERT OR DELETE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_post_count();
