/**
 * Socket.io WebSocket Infrastructure
 *
 * Handles real-time features:
 * - Member presence (online/offline status)
 * - Community feed updates (new posts, replies, likes)
 * - Direct messages
 * - Typing indicators
 * - Notifications
 */

const { Server } = require('socket.io');
const cookie = require('cookie');
const db = require('../db');

// Track connected members by org
// Structure: { orgId: { memberId: Set<socketId> } }
const connectedMembers = new Map();

// Track typing indicators
// Structure: { threadId: { memberId: timestamp } }
const typingIndicators = new Map();

// Typing indicator timeout (5 seconds)
const TYPING_TIMEOUT = 5000;

/**
 * Initialize Socket.io server
 */
function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const sessionToken = cookies.member_session;

      if (!sessionToken) {
        return next(new Error('Authentication required'));
      }

      // Verify member session
      const result = await db.query(`
        SELECT m.id, m.org_id, m.first_name, m.last_name, m.email,
               m.community_banned_at, m.community_muted_until
        FROM members m
        JOIN member_sessions ms ON ms.member_id = m.id
        WHERE ms.token_hash = $1
          AND ms.expires_at > NOW()
          AND ms.revoked_at IS NULL
      `, [sessionToken]);

      if (result.rows.length === 0) {
        // Fallback: try the old sessions table
        const oldResult = await db.query(`
          SELECT m.id, m.org_id, m.first_name, m.last_name, m.email
          FROM members m
          JOIN sessions s ON s.member_id = m.id
          WHERE s.token = $1 AND s.expires_at > NOW()
        `, [sessionToken]);

        if (oldResult.rows.length === 0) {
          return next(new Error('Invalid session'));
        }

        socket.member = oldResult.rows[0];
      } else {
        socket.member = result.rows[0];
      }

      // Check if banned
      if (socket.member.community_banned_at) {
        return next(new Error('You are banned from the community'));
      }

      next();
    } catch (err) {
      console.error('Socket auth error:', err);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', async (socket) => {
    const member = socket.member;
    const orgId = member.org_id;
    const memberId = member.id;

    console.log(`Member connected: ${member.first_name} ${member.last_name} (${memberId})`);

    // Add to connected members tracking
    if (!connectedMembers.has(orgId)) {
      connectedMembers.set(orgId, new Map());
    }
    const orgMembers = connectedMembers.get(orgId);
    if (!orgMembers.has(memberId)) {
      orgMembers.set(memberId, new Set());
    }
    orgMembers.get(memberId).add(socket.id);

    // Join org room
    const orgRoom = `org:${orgId}`;
    socket.join(orgRoom);

    // Update online status in database
    await updatePresence(memberId, true);

    // Broadcast online status to org
    socket.to(orgRoom).emit('member:online', {
      memberId,
      name: `${member.first_name} ${member.last_name}`
    });

    // Send current online members to the newly connected socket
    const onlineMembers = await getOnlineMembers(orgId);
    socket.emit('members:online', onlineMembers);

    // ==========================================
    // EVENT HANDLERS
    // ==========================================

    // Join a specific room (e.g., forum, post, thread)
    socket.on('join', (room) => {
      if (room.startsWith('forum:') || room.startsWith('post:') || room.startsWith('thread:')) {
        socket.join(`${orgId}:${room}`);
        console.log(`${member.first_name} joined ${room}`);
      }
    });

    // Leave a specific room
    socket.on('leave', (room) => {
      if (room.startsWith('forum:') || room.startsWith('post:') || room.startsWith('thread:')) {
        socket.leave(`${orgId}:${room}`);
      }
    });

    // Typing indicator
    socket.on('typing:start', async ({ threadId }) => {
      if (!threadId) return;

      // Check if muted
      if (member.community_muted_until && new Date(member.community_muted_until) > new Date()) {
        return;
      }

      const threadRoom = `${orgId}:thread:${threadId}`;

      // Update typing indicator
      if (!typingIndicators.has(threadId)) {
        typingIndicators.set(threadId, new Map());
      }
      typingIndicators.get(threadId).set(memberId, Date.now());

      // Broadcast to thread room
      socket.to(threadRoom).emit('typing:update', {
        threadId,
        memberId,
        name: `${member.first_name} ${member.last_name}`,
        isTyping: true
      });

      // Auto-clear after timeout
      setTimeout(() => {
        const indicators = typingIndicators.get(threadId);
        if (indicators && indicators.get(memberId) <= Date.now() - TYPING_TIMEOUT + 100) {
          indicators.delete(memberId);
          socket.to(threadRoom).emit('typing:update', {
            threadId,
            memberId,
            isTyping: false
          });
        }
      }, TYPING_TIMEOUT);
    });

    socket.on('typing:stop', ({ threadId }) => {
      if (!threadId) return;

      const threadRoom = `${orgId}:thread:${threadId}`;

      // Clear typing indicator
      if (typingIndicators.has(threadId)) {
        typingIndicators.get(threadId).delete(memberId);
      }

      socket.to(threadRoom).emit('typing:update', {
        threadId,
        memberId,
        isTyping: false
      });
    });

    // Mark message as read (for read receipts)
    socket.on('message:read', async ({ threadId, messageId }) => {
      if (!threadId || !messageId) return;

      try {
        await db.query(`
          INSERT INTO message_read_status (thread_id, member_id, last_read_message_id, last_read_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (thread_id, member_id)
          DO UPDATE SET last_read_message_id = $3, last_read_at = NOW()
        `, [threadId, memberId, messageId]);

        // Broadcast read receipt to thread
        const threadRoom = `${orgId}:thread:${threadId}`;
        socket.to(threadRoom).emit('message:read', {
          threadId,
          messageId,
          memberId,
          readAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error marking message read:', err);
      }
    });

    // Ping to keep connection alive and update presence
    socket.on('ping', async () => {
      await updatePresence(memberId, true);
      socket.emit('pong');
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log(`Member disconnected: ${member.first_name} ${member.last_name}`);

      // Remove from connected members tracking
      const orgMembers = connectedMembers.get(orgId);
      if (orgMembers) {
        const memberSockets = orgMembers.get(memberId);
        if (memberSockets) {
          memberSockets.delete(socket.id);
          if (memberSockets.size === 0) {
            orgMembers.delete(memberId);
            // Member fully disconnected, update status
            await updatePresence(memberId, false);
            // Broadcast offline status
            io.to(orgRoom).emit('member:offline', { memberId });
          }
        }
      }

      // Clean up typing indicators
      for (const [threadId, indicators] of typingIndicators.entries()) {
        if (indicators.has(memberId)) {
          indicators.delete(memberId);
          io.to(`${orgId}:thread:${threadId}`).emit('typing:update', {
            threadId,
            memberId,
            isTyping: false
          });
        }
      }
    });
  });

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  /**
   * Update member presence in database
   */
  async function updatePresence(memberId, isOnline) {
    try {
      await db.query(`
        UPDATE members
        SET is_online = $1, last_seen_at = NOW()
        WHERE id = $2
      `, [isOnline, memberId]);
    } catch (err) {
      console.error('Error updating presence:', err);
    }
  }

  /**
   * Get list of online members for an org
   */
  async function getOnlineMembers(orgId) {
    try {
      const result = await db.query(`
        SELECT id, first_name, last_name, profile_photo_url
        FROM members
        WHERE org_id = $1 AND is_online = true
        ORDER BY first_name, last_name
      `, [orgId]);
      return result.rows;
    } catch (err) {
      console.error('Error getting online members:', err);
      return [];
    }
  }

  // ==========================================
  // BROADCAST FUNCTIONS (called from routes)
  // ==========================================

  /**
   * Broadcast a new post to the org feed
   */
  io.broadcastNewPost = (orgId, forumId, post) => {
    io.to(`org:${orgId}`).emit('post:new', { forumId, post });
    io.to(`${orgId}:forum:${forumId}`).emit('post:new', { post });
  };

  /**
   * Broadcast a new reply to a post
   */
  io.broadcastNewReply = (orgId, postId, reply) => {
    io.to(`org:${orgId}`).emit('reply:new', { postId, reply });
    io.to(`${orgId}:post:${postId}`).emit('reply:new', { reply });
  };

  /**
   * Broadcast a like/unlike on a post
   */
  io.broadcastLike = (orgId, postId, memberId, liked, likeCount) => {
    io.to(`org:${orgId}`).emit('post:like', { postId, memberId, liked, likeCount });
    io.to(`${orgId}:post:${postId}`).emit('post:like', { memberId, liked, likeCount });
  };

  /**
   * Broadcast a new direct message
   */
  io.broadcastMessage = (orgId, threadId, message, recipientIds) => {
    // Send to all participants in the thread
    io.to(`${orgId}:thread:${threadId}`).emit('message:new', { threadId, message });

    // Also send notification to recipients not in the room
    for (const recipientId of recipientIds) {
      const orgMembers = connectedMembers.get(orgId);
      if (orgMembers && orgMembers.has(recipientId)) {
        for (const socketId of orgMembers.get(recipientId)) {
          io.to(socketId).emit('message:notification', {
            threadId,
            preview: message.body.substring(0, 100),
            senderName: message.sender_name
          });
        }
      }
    }
  };

  /**
   * Broadcast a notification
   */
  io.broadcastNotification = (orgId, memberId, notification) => {
    const orgMembers = connectedMembers.get(orgId);
    if (orgMembers && orgMembers.has(memberId)) {
      for (const socketId of orgMembers.get(memberId)) {
        io.to(socketId).emit('notification:new', notification);
      }
    }
  };

  /**
   * Broadcast post deletion
   */
  io.broadcastPostDeleted = (orgId, forumId, postId) => {
    io.to(`org:${orgId}`).emit('post:deleted', { forumId, postId });
    io.to(`${orgId}:forum:${forumId}`).emit('post:deleted', { postId });
  };

  /**
   * Broadcast post update (edit, lock, pin)
   */
  io.broadcastPostUpdated = (orgId, forumId, postId, updates) => {
    io.to(`org:${orgId}`).emit('post:updated', { forumId, postId, updates });
    io.to(`${orgId}:forum:${forumId}`).emit('post:updated', { postId, updates });
    io.to(`${orgId}:post:${postId}`).emit('post:updated', { updates });
  };

  /**
   * Get online count for an org
   */
  io.getOnlineCount = (orgId) => {
    const orgMembers = connectedMembers.get(orgId);
    return orgMembers ? orgMembers.size : 0;
  };

  /**
   * Check if a specific member is online
   */
  io.isMemberOnline = (orgId, memberId) => {
    const orgMembers = connectedMembers.get(orgId);
    return orgMembers ? orgMembers.has(memberId) : false;
  };

  return io;
}

module.exports = { initializeSocket };
