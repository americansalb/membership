const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireUser, requireMember } = require('../lib/middleware');
const twoFactor = require('../lib/twoFactor');

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
// THREAD-BASED MESSAGES
// ============================================

// Get message threads (inbox)
router.get('/threads', requireMember, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*,
        (SELECT json_agg(json_build_object(
          'id', m.id,
          'first_name', m.first_name,
          'last_name', m.last_name,
          'profile_photo_url', m.profile_photo_url,
          'is_online', m.is_online
        ))
        FROM members m WHERE m.id = ANY(t.participant_ids) AND m.id != $1
        ) as other_participants,
        mrs.last_read_at,
        mrs.muted_until,
        (SELECT COUNT(*) FROM messages msg
         WHERE msg.thread_id = t.id
         AND msg.created_at > COALESCE(mrs.last_read_at, '1970-01-01')
         AND msg.sender_id != $1
        ) as unread_count
       FROM message_threads t
       LEFT JOIN message_read_status mrs ON mrs.thread_id = t.id AND mrs.member_id = $1
       WHERE t.org_id = $2 AND $1 = ANY(t.participant_ids)
       ORDER BY t.last_message_at DESC NULLS LAST
       LIMIT 50`,
      [req.member.id, req.member.orgId]
    );

    // Get total unread count
    const unreadResult = await db.query(
      `SELECT COUNT(*) as total FROM (
        SELECT t.id FROM message_threads t
        LEFT JOIN message_read_status mrs ON mrs.thread_id = t.id AND mrs.member_id = $1
        WHERE t.org_id = $2 AND $1 = ANY(t.participant_ids)
        AND EXISTS (
          SELECT 1 FROM messages msg
          WHERE msg.thread_id = t.id
          AND msg.created_at > COALESCE(mrs.last_read_at, '1970-01-01')
          AND msg.sender_id != $1
        )
      ) unread_threads`,
      [req.member.id, req.member.orgId]
    );

    res.json({
      threads: result.rows,
      unreadThreads: parseInt(unreadResult.rows[0].total)
    });
  } catch (err) {
    console.error('Get threads error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Get a single thread with messages
router.get('/threads/:id', requireMember, async (req, res) => {
  try {
    // Get thread
    const threadResult = await db.query(
      `SELECT t.*,
        (SELECT json_agg(json_build_object(
          'id', m.id,
          'first_name', m.first_name,
          'last_name', m.last_name,
          'profile_photo_url', m.profile_photo_url,
          'is_online', m.is_online,
          'allow_messages', m.allow_messages
        ))
        FROM members m WHERE m.id = ANY(t.participant_ids)
        ) as participants
       FROM message_threads t
       WHERE t.id = $1 AND t.org_id = $2 AND $3 = ANY(t.participant_ids)`,
      [req.params.id, req.member.orgId, req.member.id]
    );

    if (threadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const thread = threadResult.rows[0];

    // Get messages
    const messagesResult = await db.query(
      `SELECT msg.*,
        m.first_name, m.last_name, m.profile_photo_url,
        (SELECT json_agg(json_build_object('emoji', r.emoji, 'member_id', r.member_id))
         FROM message_reactions r WHERE r.message_id = msg.id
        ) as reactions
       FROM messages msg
       LEFT JOIN members m ON msg.sender_id = m.id
       WHERE msg.thread_id = $1 AND msg.deleted_at IS NULL
       ORDER BY msg.created_at ASC`,
      [req.params.id]
    );

    // Update read status
    await db.query(
      `INSERT INTO message_read_status (thread_id, member_id, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (thread_id, member_id)
       DO UPDATE SET last_read_at = NOW()`,
      [req.params.id, req.member.id]
    );

    res.json({
      thread,
      messages: messagesResult.rows
    });
  } catch (err) {
    console.error('Get thread error:', err);
    res.status(500).json({ error: 'Failed to load thread' });
  }
});

// Start new thread or find existing
router.post('/threads', requireMember, async (req, res) => {
  try {
    const { recipient_id, subject, body } = req.body;

    if (!recipient_id) {
      return res.status(400).json({ error: 'Recipient is required' });
    }

    // Verify recipient
    const recipientResult = await db.query(
      'SELECT id, allow_messages, first_name, last_name FROM members WHERE id = $1 AND org_id = $2',
      [recipient_id, req.member.orgId]
    );

    if (recipientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    if (recipientResult.rows[0].allow_messages === false) {
      return res.status(403).json({ error: 'This member does not accept messages' });
    }

    // Sort participant IDs for consistent lookup
    const participantIds = [req.member.id, recipient_id].sort();

    // Check for existing thread
    let threadResult = await db.query(
      `SELECT * FROM message_threads
       WHERE org_id = $1 AND participant_ids = $2::uuid[] AND is_group = false`,
      [req.member.orgId, participantIds]
    );

    let thread;
    let isNew = false;

    if (threadResult.rows.length > 0) {
      thread = threadResult.rows[0];
    } else {
      // Create new thread
      const newThread = await db.query(
        `INSERT INTO message_threads (org_id, participant_ids, subject)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [req.member.orgId, participantIds, subject || null]
      );
      thread = newThread.rows[0];
      isNew = true;

      // Initialize read status for both participants
      await db.query(
        `INSERT INTO message_read_status (thread_id, member_id, last_read_at)
         VALUES ($1, $2, NOW()), ($1, $3, NULL)`,
        [thread.id, req.member.id, recipient_id]
      );
    }

    // If body provided, send first message
    let message = null;
    if (body) {
      const msgResult = await db.query(
        `INSERT INTO messages (thread_id, sender_id, body)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [thread.id, req.member.id, body]
      );
      message = msgResult.rows[0];

      // Broadcast via socket
      const io = req.app.get('io');
      if (io) {
        io.to(`member:${recipient_id}`).emit('message:new', {
          threadId: thread.id,
          message: {
            ...message,
            first_name: req.member.firstName,
            last_name: req.member.lastName,
            profile_photo_url: req.member.profilePhotoUrl
          }
        });
      }
    }

    res.json({ thread, message, isNew });
  } catch (err) {
    console.error('Create thread error:', err);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// Send message in thread
router.post('/threads/:id/messages', requireMember, async (req, res) => {
  try {
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Verify thread access
    const threadResult = await db.query(
      `SELECT * FROM message_threads
       WHERE id = $1 AND org_id = $2 AND $3 = ANY(participant_ids)`,
      [req.params.id, req.member.orgId, req.member.id]
    );

    if (threadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const thread = threadResult.rows[0];

    // Insert message
    const result = await db.query(
      `INSERT INTO messages (thread_id, sender_id, body)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.id, req.member.id, body.trim()]
    );

    const message = result.rows[0];

    // Update sender's read status
    await db.query(
      `UPDATE message_read_status SET last_read_at = NOW()
       WHERE thread_id = $1 AND member_id = $2`,
      [req.params.id, req.member.id]
    );

    // Broadcast to other participants
    const io = req.app.get('io');
    if (io) {
      thread.participant_ids
        .filter(id => id !== req.member.id)
        .forEach(recipientId => {
          io.to(`member:${recipientId}`).emit('message:new', {
            threadId: thread.id,
            message: {
              ...message,
              first_name: req.member.firstName,
              last_name: req.member.lastName,
              profile_photo_url: req.member.profilePhotoUrl
            }
          });
        });
    }

    res.json({
      message: {
        ...message,
        first_name: req.member.firstName,
        last_name: req.member.lastName
      }
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark thread as read
router.post('/threads/:id/read', requireMember, async (req, res) => {
  try {
    await db.query(
      `INSERT INTO message_read_status (thread_id, member_id, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (thread_id, member_id)
       DO UPDATE SET last_read_at = NOW()`,
      [req.params.id, req.member.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// React to a message
router.post('/messages/:id/react', requireMember, async (req, res) => {
  try {
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    // Verify message access
    const msgResult = await db.query(
      `SELECT m.*, t.participant_ids FROM messages m
       JOIN message_threads t ON m.thread_id = t.id
       WHERE m.id = $1 AND t.org_id = $2 AND $3 = ANY(t.participant_ids)`,
      [req.params.id, req.member.orgId, req.member.id]
    );

    if (msgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Toggle reaction
    const existing = await db.query(
      'SELECT id FROM message_reactions WHERE message_id = $1 AND member_id = $2 AND emoji = $3',
      [req.params.id, req.member.id, emoji]
    );

    if (existing.rows.length > 0) {
      await db.query('DELETE FROM message_reactions WHERE id = $1', [existing.rows[0].id]);
      res.json({ added: false, emoji });
    } else {
      await db.query(
        'INSERT INTO message_reactions (message_id, member_id, emoji) VALUES ($1, $2, $3)',
        [req.params.id, req.member.id, emoji]
      );
      res.json({ added: true, emoji });
    }
  } catch (err) {
    console.error('React error:', err);
    res.status(500).json({ error: 'Failed to react' });
  }
});

// Typing indicator
router.post('/threads/:id/typing', requireMember, async (req, res) => {
  try {
    const threadResult = await db.query(
      'SELECT participant_ids FROM message_threads WHERE id = $1 AND $2 = ANY(participant_ids)',
      [req.params.id, req.member.id]
    );

    if (threadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Broadcast typing to other participants
    const io = req.app.get('io');
    if (io) {
      threadResult.rows[0].participant_ids
        .filter(id => id !== req.member.id)
        .forEach(recipientId => {
          io.to(`member:${recipientId}`).emit('typing', {
            threadId: req.params.id,
            memberId: req.member.id,
            firstName: req.member.firstName
          });
        });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Typing error:', err);
    res.status(500).json({ error: 'Failed' });
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

// Get member profile with full details
router.get('/directory/:id', requireMember, async (req, res) => {
  try {
    // Get member with all profile fields
    const result = await db.query(
      `SELECT m.id, m.first_name, m.last_name, m.email, m.bio, m.profile_photo_url,
              m.tier_id, m.allow_messages, m.created_at, m.title, m.location_city,
              m.location_state, m.location_country, m.languages, m.certifications,
              m.skills, m.social_links, m.is_online, m.last_seen_at,
              t.name as tier_name
       FROM members m
       LEFT JOIN tiers t ON m.tier_id = t.id
       WHERE m.id = $1 AND m.org_id = $2 AND m.directory_visible = true`,
      [req.params.id, req.member.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = result.rows[0];

    // Get member badges
    const badgesResult = await db.query(
      `SELECT b.id, b.name, b.description, b.icon, b.color, mb.awarded_at
       FROM member_badges mb
       JOIN badges b ON mb.badge_id = b.id
       WHERE mb.member_id = $1
       ORDER BY mb.awarded_at DESC`,
      [req.params.id]
    );

    // Get recent activity (posts and replies)
    const activityResult = await db.query(
      `SELECT p.id, p.title, p.body, p.created_at, p.parent_id,
              f.name as forum_name, f.slug as forum_slug,
              CASE WHEN p.parent_id IS NULL THEN 'post' ELSE 'reply' END as type
       FROM community_posts p
       JOIN community_forums f ON p.forum_id = f.id
       WHERE p.member_id = $1 AND p.is_approved = true AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT 10`,
      [req.params.id]
    );

    // Get community stats
    const statsResult = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM community_posts WHERE member_id = $1 AND parent_id IS NULL AND deleted_at IS NULL) as post_count,
        (SELECT COUNT(*) FROM community_posts WHERE member_id = $1 AND parent_id IS NOT NULL AND deleted_at IS NULL) as reply_count,
        (SELECT COUNT(*) FROM community_post_likes WHERE member_id = $1) as likes_given,
        (SELECT COUNT(*) FROM community_post_likes cpl
         JOIN community_posts cp ON cpl.post_id = cp.id
         WHERE cp.member_id = $1) as likes_received`,
      [req.params.id]
    );

    res.json({
      member,
      badges: badgesResult.rows,
      activity: activityResult.rows,
      stats: statsResult.rows[0]
    });
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


// ============================================
// ADMIN: MODERATION
// ============================================

// Get moderation dashboard stats
router.get('/admin/moderation/stats', requireUser, async (req, res) => {
  try {
    const orgId = req.user.orgId;

    const stats = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM community_reports WHERE org_id = $1 AND status = 'pending') as pending_reports,
        (SELECT COUNT(*) FROM members WHERE org_id = $1 AND community_banned_at IS NOT NULL) as banned_members,
        (SELECT COUNT(*) FROM members WHERE org_id = $1 AND community_muted_until > NOW()) as muted_members,
        (SELECT COUNT(*) FROM community_posts p
         JOIN community_forums f ON p.forum_id = f.id
         WHERE f.org_id = $1 AND p.deleted_at IS NOT NULL) as deleted_posts`,
      [orgId]
    );

    res.json(stats.rows[0]);
  } catch (err) {
    console.error('Moderation stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// List reports
router.get('/admin/moderation/reports', requireUser, async (req, res) => {
  try {
    const { status = 'pending', limit = 50, offset = 0 } = req.query;
    const orgId = req.user.orgId;

    const result = await db.query(
      `SELECT r.*,
        rm.first_name as reporter_first_name, rm.last_name as reporter_last_name,
        ru.email as resolved_by_email
       FROM community_reports r
       LEFT JOIN members rm ON r.reporter_id = rm.id
       LEFT JOIN users ru ON r.resolved_by = ru.id
       WHERE r.org_id = $1 AND r.status = $2
       ORDER BY r.created_at DESC
       LIMIT $3 OFFSET $4`,
      [orgId, status, parseInt(limit), parseInt(offset)]
    );

    res.json({ reports: result.rows });
  } catch (err) {
    console.error('List reports error:', err);
    res.status(500).json({ error: 'Failed to load reports' });
  }
});

// Get report details with target info
router.get('/admin/moderation/reports/:id', requireUser, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*,
        rm.first_name as reporter_first_name, rm.last_name as reporter_last_name, rm.email as reporter_email
       FROM community_reports r
       LEFT JOIN members rm ON r.reporter_id = rm.id
       WHERE r.id = $1 AND r.org_id = $2`,
      [req.params.id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];

    // Get target details based on type
    let target = null;
    if (report.target_type === 'post') {
      const postResult = await db.query(
        `SELECT p.*, m.first_name, m.last_name, m.email
         FROM community_posts p
         LEFT JOIN members m ON p.member_id = m.id
         WHERE p.id = $1`,
        [report.target_id]
      );
      target = postResult.rows[0];
    } else if (report.target_type === 'member') {
      const memberResult = await db.query(
        'SELECT id, first_name, last_name, email, community_banned_at, community_muted_until, community_warning_count FROM members WHERE id = $1',
        [report.target_id]
      );
      target = memberResult.rows[0];
    }

    res.json({ report, target });
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: 'Failed to load report' });
  }
});

// Resolve a report
router.post('/admin/moderation/reports/:id/resolve', requireUser, async (req, res) => {
  try {
    const { action, notes } = req.body;

    const validActions = ['dismiss', 'warn', 'delete', 'ban', 'mute'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Get the report
    const reportResult = await db.query(
      'SELECT * FROM community_reports WHERE id = $1 AND org_id = $2',
      [req.params.id, req.user.orgId]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reportResult.rows[0];

    // Take action based on type
    if (action === 'delete' && report.target_type === 'post') {
      await db.query(
        `UPDATE community_posts SET deleted_at = NOW(), deleted_by = $1, delete_reason = $2
         WHERE id = $3`,
        [req.user.userId, notes || 'Removed due to community report', report.target_id]
      );
    } else if (action === 'ban' && report.target_type === 'member') {
      await db.query(
        `UPDATE members SET community_banned_at = NOW(), community_banned_by = $1, community_ban_reason = $2
         WHERE id = $3`,
        [req.user.userId, notes || 'Banned due to community report', report.target_id]
      );
    } else if (action === 'mute' && report.target_type === 'member') {
      await db.query(
        `UPDATE members SET community_muted_until = NOW() + INTERVAL '7 days', community_muted_by = $1, community_mute_reason = $2
         WHERE id = $3`,
        [req.user.userId, notes || 'Muted due to community report', report.target_id]
      );
    } else if (action === 'warn') {
      await db.query(
        'UPDATE members SET community_warning_count = community_warning_count + 1 WHERE id = $1',
        [report.target_type === 'member' ? report.target_id : null]
      );
    }

    // Update report status
    const status = action === 'dismiss' ? 'dismissed' : 'action_taken';
    await db.query(
      `UPDATE community_reports
       SET status = $1, resolved_by = $2, resolved_at = NOW(), resolution_notes = $3
       WHERE id = $4`,
      [status, req.user.userId, notes || null, req.params.id]
    );

    // Log the action
    await db.query(
      `INSERT INTO moderation_log (org_id, user_id, action, target_type, target_id, reason, report_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.orgId, req.user.userId, `report_${action}`, report.target_type, report.target_id, notes || null, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Resolve report error:', err);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});

// Ban a member
router.post('/admin/moderation/members/:id/ban', requireUser, async (req, res) => {
  try {
    const { reason } = req.body;

    const result = await db.query(
      `UPDATE members
       SET community_banned_at = NOW(), community_banned_by = $1, community_ban_reason = $2
       WHERE id = $3 AND org_id = $4
       RETURNING id, first_name, last_name`,
      [req.user.userId, reason || null, req.params.id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Log action
    await db.query(
      `INSERT INTO moderation_log (org_id, user_id, action, target_type, target_id, reason)
       VALUES ($1, $2, 'ban_member', 'member', $3, $4)`,
      [req.user.orgId, req.user.userId, req.params.id, reason || null]
    );

    res.json({ success: true, member: result.rows[0] });
  } catch (err) {
    console.error('Ban member error:', err);
    res.status(500).json({ error: 'Failed to ban member' });
  }
});

// Unban a member
router.post('/admin/moderation/members/:id/unban', requireUser, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE members
       SET community_banned_at = NULL, community_banned_by = NULL, community_ban_reason = NULL
       WHERE id = $1 AND org_id = $2
       RETURNING id, first_name, last_name`,
      [req.params.id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Log action
    await db.query(
      `INSERT INTO moderation_log (org_id, user_id, action, target_type, target_id, reason)
       VALUES ($1, $2, 'unban_member', 'member', $3, 'Ban lifted')`,
      [req.user.orgId, req.user.userId, req.params.id]
    );

    res.json({ success: true, member: result.rows[0] });
  } catch (err) {
    console.error('Unban member error:', err);
    res.status(500).json({ error: 'Failed to unban member' });
  }
});

// Mute a member
router.post('/admin/moderation/members/:id/mute', requireUser, async (req, res) => {
  try {
    const { reason, duration_days = 7 } = req.body;

    const result = await db.query(
      `UPDATE members
       SET community_muted_until = NOW() + ($1 || ' days')::interval, community_muted_by = $2, community_mute_reason = $3
       WHERE id = $4 AND org_id = $5
       RETURNING id, first_name, last_name, community_muted_until`,
      [duration_days, req.user.userId, reason || null, req.params.id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Log action
    await db.query(
      `INSERT INTO moderation_log (org_id, user_id, action, target_type, target_id, reason, details)
       VALUES ($1, $2, 'mute_member', 'member', $3, $4, $5)`,
      [req.user.orgId, req.user.userId, req.params.id, reason || null, JSON.stringify({ duration_days })]
    );

    res.json({ success: true, member: result.rows[0] });
  } catch (err) {
    console.error('Mute member error:', err);
    res.status(500).json({ error: 'Failed to mute member' });
  }
});

// Unmute a member
router.post('/admin/moderation/members/:id/unmute', requireUser, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE members
       SET community_muted_until = NULL, community_muted_by = NULL, community_mute_reason = NULL
       WHERE id = $1 AND org_id = $2
       RETURNING id, first_name, last_name`,
      [req.params.id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Log action
    await db.query(
      `INSERT INTO moderation_log (org_id, user_id, action, target_type, target_id, reason)
       VALUES ($1, $2, 'unmute_member', 'member', $3, 'Mute lifted')`,
      [req.user.orgId, req.user.userId, req.params.id]
    );

    res.json({ success: true, member: result.rows[0] });
  } catch (err) {
    console.error('Unmute member error:', err);
    res.status(500).json({ error: 'Failed to unmute member' });
  }
});

// Delete a post
router.post('/admin/moderation/posts/:id/delete', requireUser, async (req, res) => {
  try {
    const { reason } = req.body;

    const result = await db.query(
      `UPDATE community_posts
       SET deleted_at = NOW(), deleted_by = $1, delete_reason = $2
       FROM community_forums f
       WHERE community_posts.id = $3 AND community_posts.forum_id = f.id AND f.org_id = $4
       RETURNING community_posts.id, community_posts.title`,
      [req.user.userId, reason || null, req.params.id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Log action
    await db.query(
      `INSERT INTO moderation_log (org_id, user_id, action, target_type, target_id, reason)
       VALUES ($1, $2, 'delete_post', 'post', $3, $4)`,
      [req.user.orgId, req.user.userId, req.params.id, reason || null]
    );

    res.json({ success: true, post: result.rows[0] });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Lock/unlock a post
router.post('/admin/moderation/posts/:id/lock', requireUser, async (req, res) => {
  try {
    const { reason, lock = true } = req.body;

    const result = await db.query(
      `UPDATE community_posts
       SET locked_at = $1, locked_by = $2, lock_reason = $3
       FROM community_forums f
       WHERE community_posts.id = $4 AND community_posts.forum_id = f.id AND f.org_id = $5
       RETURNING community_posts.id, community_posts.title`,
      [lock ? new Date() : null, lock ? req.user.userId : null, lock ? (reason || null) : null, req.params.id, req.user.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Log action
    await db.query(
      `INSERT INTO moderation_log (org_id, user_id, action, target_type, target_id, reason)
       VALUES ($1, $2, $3, 'post', $4, $5)`,
      [req.user.orgId, req.user.userId, lock ? 'lock_post' : 'unlock_post', req.params.id, reason || null]
    );

    res.json({ success: true, post: result.rows[0], locked: lock });
  } catch (err) {
    console.error('Lock post error:', err);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Get moderation log
router.get('/admin/moderation/log', requireUser, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT ml.*, u.email as moderator_email
       FROM moderation_log ml
       LEFT JOIN users u ON ml.user_id = u.id
       WHERE ml.org_id = $1
       ORDER BY ml.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.orgId, parseInt(limit), parseInt(offset)]
    );

    res.json({ log: result.rows });
  } catch (err) {
    console.error('Moderation log error:', err);
    res.status(500).json({ error: 'Failed to load moderation log' });
  }
});

// ============================================
// ADMIN: BADGES
// ============================================

// List badges
router.get('/admin/badges', requireUser, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, (SELECT COUNT(*) FROM member_badges WHERE badge_id = b.id) as awarded_count
       FROM badges b
       WHERE b.org_id = $1
       ORDER BY b.sort_order, b.created_at`,
      [req.user.orgId]
    );

    res.json({ badges: result.rows });
  } catch (err) {
    console.error('List badges error:', err);
    res.status(500).json({ error: 'Failed to load badges' });
  }
});

// Create badge
router.post('/admin/badges', requireUser, async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO badges (org_id, name, description, icon, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.orgId, name, description || null, icon || null, color || null]
    );

    res.json({ badge: result.rows[0] });
  } catch (err) {
    console.error('Create badge error:', err);
    res.status(500).json({ error: 'Failed to create badge' });
  }
});

// Award badge to member
router.post('/admin/badges/:badgeId/award', requireUser, async (req, res) => {
  try {
    const { member_id, reason } = req.body;

    if (!member_id) {
      return res.status(400).json({ error: 'Member ID is required' });
    }

    // Verify badge belongs to org
    const badgeResult = await db.query(
      'SELECT id FROM badges WHERE id = $1 AND org_id = $2',
      [req.params.badgeId, req.user.orgId]
    );

    if (badgeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Badge not found' });
    }

    // Award badge
    const result = await db.query(
      `INSERT INTO member_badges (member_id, badge_id, awarded_by, awarded_reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (member_id, badge_id) DO NOTHING
       RETURNING *`,
      [member_id, req.params.badgeId, req.user.userId, reason || null]
    );

    res.json({ success: true, awarded: result.rows.length > 0 });
  } catch (err) {
    console.error('Award badge error:', err);
    res.status(500).json({ error: 'Failed to award badge' });
  }
});


// ============================================
// MEMBER 2FA SETUP
// ============================================

// Get 2FA status
router.get('/security/2fa', requireMember, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT totp_enabled, totp_enabled_at, totp_backup_codes
       FROM members WHERE id = $1`,
      [req.member.id]
    );

    const member = result.rows[0];
    const backupCodesRemaining = member.totp_backup_codes
      ? twoFactor.countRemainingBackupCodes(member.totp_backup_codes)
      : 0;

    res.json({
      enabled: member.totp_enabled || false,
      enabledAt: member.totp_enabled_at,
      backupCodesRemaining
    });
  } catch (err) {
    console.error('Get 2FA status error:', err);
    res.status(500).json({ error: 'Failed to get 2FA status' });
  }
});

// Start 2FA setup - generate secret and QR
router.post('/security/2fa/setup', requireMember, async (req, res) => {
  try {
    // Get org name for the authenticator label
    const orgResult = await db.query(
      'SELECT name FROM organizations WHERE id = $1',
      [req.member.orgId]
    );
    const orgName = orgResult.rows[0]?.name || 'Community';

    // Generate secret
    const secret = twoFactor.generateSecret(req.member.email, orgName);

    // Generate QR code
    const qrCode = await twoFactor.generateQRCode(secret.otpauthUrl);

    // Store secret temporarily (not enabled yet)
    await db.query(
      `UPDATE members SET totp_secret = $1, totp_enabled = false WHERE id = $2`,
      [secret.base32, req.member.id]
    );

    res.json({
      secret: secret.base32,
      qrCode,
      manualEntry: secret.base32
    });
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({ error: 'Failed to start 2FA setup' });
  }
});

// Verify and enable 2FA
router.post('/security/2fa/verify', requireMember, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Get stored secret
    const memberResult = await db.query(
      'SELECT totp_secret FROM members WHERE id = $1',
      [req.member.id]
    );

    const secret = memberResult.rows[0]?.totp_secret;
    if (!secret) {
      return res.status(400).json({ error: 'Please start 2FA setup first' });
    }

    // Verify token
    const valid = twoFactor.verifyToken(secret, token);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid code. Please try again.' });
    }

    // Generate backup codes
    const { codes, hashedCodes } = twoFactor.generateBackupCodes();

    // Enable 2FA
    await db.query(
      `UPDATE members
       SET totp_enabled = true, totp_enabled_at = NOW(), totp_backup_codes = $1
       WHERE id = $2`,
      [JSON.stringify(hashedCodes), req.member.id]
    );

    res.json({
      success: true,
      backupCodes: codes
    });
  } catch (err) {
    console.error('2FA verify error:', err);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// Disable 2FA
router.post('/security/2fa/disable', requireMember, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Current code is required' });
    }

    // Verify current token before disabling
    const memberResult = await db.query(
      'SELECT totp_secret FROM members WHERE id = $1 AND totp_enabled = true',
      [req.member.id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    const secret = memberResult.rows[0].totp_secret;
    const valid = twoFactor.verifyToken(secret, token);

    if (!valid) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    // Disable 2FA
    await db.query(
      `UPDATE members
       SET totp_enabled = false, totp_secret = NULL, totp_enabled_at = NULL, totp_backup_codes = NULL
       WHERE id = $1`,
      [req.member.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('2FA disable error:', err);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// Regenerate backup codes
router.post('/security/2fa/backup-codes', requireMember, async (req, res) => {
  try {
    const { token } = req.body;

    // Verify token
    const memberResult = await db.query(
      'SELECT totp_secret FROM members WHERE id = $1 AND totp_enabled = true',
      [req.member.id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    const valid = twoFactor.verifyToken(memberResult.rows[0].totp_secret, token);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    // Generate new backup codes
    const { codes, hashedCodes } = twoFactor.generateBackupCodes();

    await db.query(
      'UPDATE members SET totp_backup_codes = $1 WHERE id = $2',
      [JSON.stringify(hashedCodes), req.member.id]
    );

    res.json({ backupCodes: codes });
  } catch (err) {
    console.error('Regenerate backup codes error:', err);
    res.status(500).json({ error: 'Failed to regenerate backup codes' });
  }
});


// ============================================
// NOTIFICATION PREFERENCES
// ============================================

// Get notification preferences
router.get('/settings/notifications', requireMember, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM notification_preferences WHERE member_id = $1',
      [req.member.id]
    );

    if (result.rows.length === 0) {
      // Return defaults
      res.json({
        email_enabled: true,
        email_digest: 'daily',
        preferences: {
          announcements: { in_app: true, email: true },
          mentions: { in_app: true, email: true },
          replies: { in_app: true, email: false },
          messages: { in_app: true, email: true },
          likes: { in_app: true, email: false }
        }
      });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Get notification prefs error:', err);
    res.status(500).json({ error: 'Failed to load preferences' });
  }
});

// Update notification preferences
router.put('/settings/notifications', requireMember, async (req, res) => {
  try {
    const { email_enabled, email_digest, preferences, quiet_hours_start, quiet_hours_end, quiet_hours_timezone } = req.body;

    const result = await db.query(
      `INSERT INTO notification_preferences (member_id, email_enabled, email_digest, preferences, quiet_hours_start, quiet_hours_end, quiet_hours_timezone, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (member_id)
       DO UPDATE SET
         email_enabled = COALESCE($2, notification_preferences.email_enabled),
         email_digest = COALESCE($3, notification_preferences.email_digest),
         preferences = COALESCE($4, notification_preferences.preferences),
         quiet_hours_start = $5,
         quiet_hours_end = $6,
         quiet_hours_timezone = $7,
         updated_at = NOW()
       RETURNING *`,
      [req.member.id, email_enabled, email_digest, JSON.stringify(preferences), quiet_hours_start || null, quiet_hours_end || null, quiet_hours_timezone || null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update notification prefs error:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});


// ============================================
// MEMBER PROFILE SETTINGS
// ============================================

// Get own profile
router.get('/settings/profile', requireMember, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, first_name, last_name, email, bio, profile_photo_url, title,
              location_city, location_state, location_country, languages,
              certifications, skills, social_links, directory_visible, allow_messages
       FROM members WHERE id = $1`,
      [req.member.id]
    );

    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Update own profile
router.put('/settings/profile', requireMember, async (req, res) => {
  try {
    const {
      first_name, last_name, bio, title,
      location_city, location_state, location_country,
      languages, certifications, skills, social_links,
      directory_visible, allow_messages
    } = req.body;

    const result = await db.query(
      `UPDATE members SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        bio = COALESCE($3, bio),
        title = COALESCE($4, title),
        location_city = COALESCE($5, location_city),
        location_state = COALESCE($6, location_state),
        location_country = COALESCE($7, location_country),
        languages = COALESCE($8, languages),
        certifications = COALESCE($9, certifications),
        skills = COALESCE($10, skills),
        social_links = COALESCE($11, social_links),
        directory_visible = COALESCE($12, directory_visible),
        allow_messages = COALESCE($13, allow_messages),
        updated_at = NOW()
       WHERE id = $14
       RETURNING id, first_name, last_name, bio, title`,
      [first_name, last_name, bio, title, location_city, location_state, location_country,
       languages ? JSON.stringify(languages) : null,
       certifications ? JSON.stringify(certifications) : null,
       skills ? JSON.stringify(skills) : null,
       social_links ? JSON.stringify(social_links) : null,
       directory_visible, allow_messages, req.member.id]
    );

    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});


module.exports = router;
