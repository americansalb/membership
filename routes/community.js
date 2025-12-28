const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireUser, requireMember } = require('../lib/middleware');

// ============================================
// NOTIFICATIONS (Admin sends to members)
// ============================================

// List notifications for current member
router.get('/notifications', requireMember, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM notifications
       WHERE member_id = $1
       AND dismissed_at IS NULL
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.member.id]
    );

    // Get unread count
    const countResult = await db.query(
      `SELECT COUNT(*) as unread FROM notifications
       WHERE member_id = $1 AND read_at IS NULL AND dismissed_at IS NULL`,
      [req.member.id]
    );

    res.json({
      notifications: result.rows,
      unread: parseInt(countResult.rows[0].unread)
    });
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// Mark notification as read
router.post('/notifications/:id/read', requireMember, async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE id = $1 AND member_id = $2`,
      [req.params.id, req.member.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Mark all notifications as read
router.post('/notifications/read-all', requireMember, async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE member_id = $1 AND read_at IS NULL`,
      [req.member.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Dismiss notification
router.post('/notifications/:id/dismiss', requireMember, async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET dismissed_at = NOW()
       WHERE id = $1 AND member_id = $2`,
      [req.params.id, req.member.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Dismiss error:', err);
    res.status(500).json({ error: 'Failed to dismiss' });
  }
});


// ============================================
// ADMIN: Send notifications
// ============================================

// Send announcement to all members (or filtered)
router.post('/admin/notifications/send', requireUser, async (req, res) => {
  try {
    const { title, body, link, tier_id, status_filter } = req.body;
    const orgId = req.user.orgId;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Build member filter
    let memberQuery = 'SELECT id FROM members WHERE org_id = $1';
    const params = [orgId];
    let paramIndex = 2;

    if (tier_id) {
      memberQuery += ` AND tier_id = $${paramIndex}`;
      params.push(tier_id);
      paramIndex++;
    }

    if (status_filter) {
      memberQuery += ` AND status = $${paramIndex}`;
      params.push(status_filter);
      paramIndex++;
    }

    const members = await db.query(memberQuery, params);

    // Create notification for each member
    let created = 0;
    for (const member of members.rows) {
      await db.query(
        `INSERT INTO notifications (org_id, member_id, type, title, body, link, created_by)
         VALUES ($1, $2, 'announcement', $3, $4, $5, $6)`,
        [orgId, member.id, title, body || null, link || null, req.user.userId]
      );
      created++;
    }

    res.json({ success: true, sent: created });
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});


// ============================================
// FEED (Unified feed across all forums)
// ============================================

// Get feed of posts (all forums or filtered)
router.get('/feed', requireMember, async (req, res) => {
  try {
    const { forum_id, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT p.*,
        m.first_name, m.last_name, m.email, m.profile_photo_url,
        f.name as forum_name, f.slug as forum_slug, f.icon as forum_icon,
        (SELECT COUNT(*) FROM community_posts WHERE parent_id = p.id AND deleted_at IS NULL) as reply_count,
        EXISTS(SELECT 1 FROM community_post_likes WHERE post_id = p.id AND member_id = $1) as liked_by_me
      FROM community_posts p
      JOIN community_forums f ON p.forum_id = f.id
      LEFT JOIN members m ON p.member_id = m.id
      WHERE f.org_id = $2
        AND p.parent_id IS NULL
        AND p.is_approved = true
        AND p.deleted_at IS NULL
        AND f.is_active = true
    `;
    const params = [req.member.id, req.member.orgId];
    let paramIndex = 3;

    if (forum_id) {
      query += ` AND p.forum_id = $${paramIndex}`;
      params.push(forum_id);
      paramIndex++;
    }

    query += ` ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({ posts: result.rows });
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: 'Failed to load feed' });
  }
});


// ============================================
// FORUMS
// ============================================

// List forums for an org
router.get('/forums', requireMember, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT f.*,
        (SELECT COUNT(*) FROM community_posts WHERE forum_id = f.id AND parent_id IS NULL) as topic_count
       FROM community_forums f
       WHERE f.org_id = $1 AND f.is_active = true
       ORDER BY f.sort_order, f.created_at`,
      [req.member.orgId]
    );

    res.json({ forums: result.rows });
  } catch (err) {
    console.error('List forums error:', err);
    res.status(500).json({ error: 'Failed to load forums' });
  }
});

// Get single forum with recent posts
router.get('/forums/:slug', requireMember, async (req, res) => {
  try {
    const forumResult = await db.query(
      `SELECT * FROM community_forums
       WHERE org_id = $1 AND slug = $2 AND is_active = true`,
      [req.member.orgId, req.params.slug]
    );

    if (forumResult.rows.length === 0) {
      return res.status(404).json({ error: 'Forum not found' });
    }

    const forum = forumResult.rows[0];

    // Get posts (topics only, not replies)
    const postsResult = await db.query(
      `SELECT p.*,
        m.first_name, m.last_name, m.email, m.profile_photo_url,
        (SELECT COUNT(*) FROM community_posts WHERE parent_id = p.id) as reply_count
       FROM community_posts p
       LEFT JOIN members m ON p.member_id = m.id
       WHERE p.forum_id = $1 AND p.parent_id IS NULL AND p.is_approved = true
       ORDER BY p.is_pinned DESC, p.created_at DESC
       LIMIT 50`,
      [forum.id]
    );

    res.json({ forum, posts: postsResult.rows });
  } catch (err) {
    console.error('Get forum error:', err);
    res.status(500).json({ error: 'Failed to load forum' });
  }
});

// Create new forum (admin only)
router.post('/admin/forums', requireUser, async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    const orgId = req.user.orgId;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await db.query(
      `INSERT INTO community_forums (org_id, name, slug, description, icon, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orgId, name, slug, description || null, icon || null, color || null]
    );

    res.json({ forum: result.rows[0] });
  } catch (err) {
    console.error('Create forum error:', err);
    res.status(500).json({ error: 'Failed to create forum' });
  }
});


// ============================================
// POSTS
// ============================================

// Get single post with replies
router.get('/posts/:id', requireMember, async (req, res) => {
  try {
    const postResult = await db.query(
      `SELECT p.*,
        m.first_name, m.last_name, m.email, m.profile_photo_url
       FROM community_posts p
       LEFT JOIN members m ON p.member_id = m.id
       WHERE p.id = $1 AND p.is_approved = true`,
      [req.params.id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postResult.rows[0];

    // Verify org access
    const forumResult = await db.query(
      'SELECT org_id FROM community_forums WHERE id = $1',
      [post.forum_id]
    );

    if (forumResult.rows[0]?.org_id !== req.member.orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get replies
    const repliesResult = await db.query(
      `SELECT p.*,
        m.first_name, m.last_name, m.email, m.profile_photo_url
       FROM community_posts p
       LEFT JOIN members m ON p.member_id = m.id
       WHERE p.parent_id = $1 AND p.is_approved = true
       ORDER BY p.created_at ASC`,
      [post.id]
    );

    // Check if current member liked this post
    const likeResult = await db.query(
      'SELECT 1 FROM community_post_likes WHERE post_id = $1 AND member_id = $2',
      [post.id, req.member.id]
    );

    post.liked_by_me = likeResult.rows.length > 0;

    res.json({ post, replies: repliesResult.rows });
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ error: 'Failed to load post' });
  }
});

// Create new post/topic
router.post('/forums/:forumId/posts', requireMember, async (req, res) => {
  try {
    const { title, body } = req.body;
    const forumId = req.params.forumId;

    if (!body) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Verify forum exists and member has access
    const forumResult = await db.query(
      `SELECT * FROM community_forums
       WHERE id = $1 AND org_id = $2 AND is_active = true`,
      [forumId, req.member.orgId]
    );

    if (forumResult.rows.length === 0) {
      return res.status(404).json({ error: 'Forum not found' });
    }

    const forum = forumResult.rows[0];

    if (!forum.allow_member_posts) {
      return res.status(403).json({ error: 'Posting is not allowed in this forum' });
    }

    const isApproved = !forum.require_approval;

    const result = await db.query(
      `INSERT INTO community_posts (org_id, forum_id, member_id, title, body, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.member.orgId, forumId, req.member.id, title || null, body, isApproved]
    );

    // Update forum stats
    if (isApproved) {
      await db.query(
        `UPDATE community_forums SET post_count = post_count + 1, last_post_at = NOW()
         WHERE id = $1`,
        [forumId]
      );
    }

    res.json({ post: result.rows[0] });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Reply to a post
router.post('/posts/:postId/replies', requireMember, async (req, res) => {
  try {
    const { body } = req.body;
    const parentId = req.params.postId;

    if (!body) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Get parent post
    const parentResult = await db.query(
      `SELECT p.*, f.org_id, f.require_approval
       FROM community_posts p
       JOIN community_forums f ON p.forum_id = f.id
       WHERE p.id = $1`,
      [parentId]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const parent = parentResult.rows[0];

    if (parent.org_id !== req.member.orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (parent.is_locked) {
      return res.status(403).json({ error: 'This discussion is locked' });
    }

    const isApproved = !parent.require_approval;

    const result = await db.query(
      `INSERT INTO community_posts (org_id, forum_id, member_id, body, parent_id, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.member.orgId, parent.forum_id, req.member.id, body, parentId, isApproved]
    );

    // Update reply count
    if (isApproved) {
      await db.query(
        'UPDATE community_posts SET reply_count = reply_count + 1 WHERE id = $1',
        [parentId]
      );
    }

    res.json({ reply: result.rows[0] });
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ error: 'Failed to post reply' });
  }
});

// Like/unlike a post
router.post('/posts/:postId/like', requireMember, async (req, res) => {
  try {
    const postId = req.params.postId;

    // Check if already liked
    const existing = await db.query(
      'SELECT id FROM community_post_likes WHERE post_id = $1 AND member_id = $2',
      [postId, req.member.id]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await db.query(
        'DELETE FROM community_post_likes WHERE post_id = $1 AND member_id = $2',
        [postId, req.member.id]
      );
      await db.query(
        'UPDATE community_posts SET like_count = like_count - 1 WHERE id = $1',
        [postId]
      );
      res.json({ liked: false });
    } else {
      // Like
      await db.query(
        'INSERT INTO community_post_likes (post_id, member_id) VALUES ($1, $2)',
        [postId, req.member.id]
      );
      await db.query(
        'UPDATE community_posts SET like_count = like_count + 1 WHERE id = $1',
        [postId]
      );
      res.json({ liked: true });
    }
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Failed to update like' });
  }
});


// ============================================
// DIRECT MESSAGES
// ============================================

// Get inbox
router.get('/messages', requireMember, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT dm.*,
        fm.first_name as from_first_name, fm.last_name as from_last_name, fm.email as from_email, fm.profile_photo_url as from_photo
       FROM direct_messages dm
       LEFT JOIN members fm ON dm.from_member_id = fm.id
       WHERE dm.to_member_id = $1 AND dm.deleted_by_recipient = false
       ORDER BY dm.created_at DESC
       LIMIT 50`,
      [req.member.id]
    );

    const unreadResult = await db.query(
      `SELECT COUNT(*) as unread FROM direct_messages
       WHERE to_member_id = $1 AND read_at IS NULL AND deleted_by_recipient = false`,
      [req.member.id]
    );

    res.json({
      messages: result.rows,
      unread: parseInt(unreadResult.rows[0].unread)
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Get sent messages
router.get('/messages/sent', requireMember, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT dm.*,
        tm.first_name as to_first_name, tm.last_name as to_last_name, tm.email as to_email
       FROM direct_messages dm
       LEFT JOIN members tm ON dm.to_member_id = tm.id
       WHERE dm.from_member_id = $1 AND dm.deleted_by_sender = false
       ORDER BY dm.created_at DESC
       LIMIT 50`,
      [req.member.id]
    );

    res.json({ messages: result.rows });
  } catch (err) {
    console.error('Get sent error:', err);
    res.status(500).json({ error: 'Failed to load sent messages' });
  }
});

// Send a message
router.post('/messages', requireMember, async (req, res) => {
  try {
    const { to_member_id, subject, body } = req.body;

    if (!to_member_id || !body) {
      return res.status(400).json({ error: 'Recipient and message are required' });
    }

    // Verify recipient exists in same org and allows messages
    const recipientResult = await db.query(
      'SELECT id, allow_messages FROM members WHERE id = $1 AND org_id = $2',
      [to_member_id, req.member.orgId]
    );

    if (recipientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    if (!recipientResult.rows[0].allow_messages) {
      return res.status(403).json({ error: 'This member does not accept messages' });
    }

    const result = await db.query(
      `INSERT INTO direct_messages (org_id, from_member_id, to_member_id, subject, body)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.member.orgId, req.member.id, to_member_id, subject || null, body]
    );

    res.json({ message: result.rows[0] });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark message as read
router.post('/messages/:id/read', requireMember, async (req, res) => {
  try {
    await db.query(
      `UPDATE direct_messages SET read_at = NOW()
       WHERE id = $1 AND to_member_id = $2`,
      [req.params.id, req.member.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});


// ============================================
// MEMBER DIRECTORY
// ============================================

// Search/list members in directory
router.get('/directory', requireMember, async (req, res) => {
  try {
    const { search, tier_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT id, first_name, last_name, email, bio, profile_photo_url, tier_id, created_at
      FROM members
      WHERE org_id = $1 AND directory_visible = true AND status = 'active'
    `;
    const params = [req.member.orgId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (tier_id) {
      query += ` AND tier_id = $${paramIndex}`;
      params.push(tier_id);
      paramIndex++;
    }

    query += ` ORDER BY first_name, last_name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({ members: result.rows });
  } catch (err) {
    console.error('Directory error:', err);
    res.status(500).json({ error: 'Failed to load directory' });
  }
});

// Get member profile
router.get('/directory/:id', requireMember, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, first_name, last_name, email, bio, profile_photo_url, tier_id, allow_messages, created_at
       FROM members
       WHERE id = $1 AND org_id = $2 AND directory_visible = true`,
      [req.params.id, req.member.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ member: result.rows[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// ============================================
// REPORTS
// ============================================

// Submit a report
router.post('/reports', requireMember, async (req, res) => {
  try {
    const { target_id, target_type, reason, details } = req.body;

    if (!target_id || !target_type || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validTypes = ['post', 'message', 'member'];
    if (!validTypes.includes(target_type)) {
      return res.status(400).json({ error: 'Invalid target type' });
    }

    const validReasons = ['spam', 'harassment', 'inappropriate', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' });
    }

    const result = await db.query(
      `INSERT INTO community_reports (org_id, reporter_id, target_type, target_id, reason, details)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [req.member.orgId, req.member.id, target_type, target_id, reason, details || null]
    );

    res.json({ success: true, reportId: result.rows[0].id });
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});


module.exports = router;
