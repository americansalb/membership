-- Migration: 006_community_and_notifications
-- Create tables for in-app notifications and community features

-- ============================================
-- NOTIFICATIONS
-- In-app messages from org to members
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,

  -- Notification content
  type VARCHAR(50) NOT NULL DEFAULT 'announcement', -- announcement, reminder, system, direct
  title VARCHAR(255) NOT NULL,
  body TEXT,
  link VARCHAR(500), -- Optional link to navigate to

  -- Status
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_member ON notifications(member_id);
CREATE INDEX idx_notifications_org ON notifications(org_id);
CREATE INDEX idx_notifications_unread ON notifications(member_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);


-- ============================================
-- COMMUNITY FORUMS
-- Discussion spaces for members
-- ============================================

CREATE TABLE IF NOT EXISTS community_forums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Forum details
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- emoji or icon name
  color VARCHAR(7), -- hex color

  -- Settings
  is_public BOOLEAN DEFAULT true, -- visible to all members
  is_active BOOLEAN DEFAULT true,
  allow_member_posts BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,

  -- Stats (denormalized for performance)
  post_count INT DEFAULT 0,
  last_post_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, slug)
);

CREATE INDEX idx_forums_org ON community_forums(org_id);


-- ============================================
-- COMMUNITY POSTS
-- Discussion threads/posts
-- ============================================

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  forum_id UUID REFERENCES community_forums(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,

  -- Post content
  title VARCHAR(255),
  body TEXT NOT NULL,

  -- For threaded replies
  parent_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,

  -- Status
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false, -- no more replies
  is_approved BOOLEAN DEFAULT true,

  -- Stats (denormalized)
  reply_count INT DEFAULT 0,
  like_count INT DEFAULT 0,

  -- Metadata
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_forum ON community_posts(forum_id);
CREATE INDEX idx_posts_member ON community_posts(member_id);
CREATE INDEX idx_posts_parent ON community_posts(parent_id);
CREATE INDEX idx_posts_created ON community_posts(created_at DESC);
CREATE INDEX idx_posts_pinned ON community_posts(forum_id, is_pinned DESC, created_at DESC);


-- ============================================
-- POST LIKES
-- Members can like posts
-- ============================================

CREATE TABLE IF NOT EXISTS community_post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(post_id, member_id)
);


-- ============================================
-- DIRECT MESSAGES
-- Member-to-member messaging
-- ============================================

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Sender and recipient
  from_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  to_member_id UUID REFERENCES members(id) ON DELETE CASCADE,

  -- Message content
  subject VARCHAR(255),
  body TEXT NOT NULL,

  -- Status
  read_at TIMESTAMPTZ,
  deleted_by_sender BOOLEAN DEFAULT false,
  deleted_by_recipient BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dm_to ON direct_messages(to_member_id);
CREATE INDEX idx_dm_from ON direct_messages(from_member_id);
CREATE INDEX idx_dm_unread ON direct_messages(to_member_id, read_at) WHERE read_at IS NULL;


-- ============================================
-- MEMBER DIRECTORY SETTINGS
-- Control visibility in member directory
-- ============================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS directory_visible BOOLEAN DEFAULT true;
ALTER TABLE members ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN DEFAULT true;
ALTER TABLE members ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500);
