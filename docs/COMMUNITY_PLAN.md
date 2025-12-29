# Community Feature Plan

## Vision

Build a social platform that members don't want to leave. Not a forum attached to membership software—a **village** where people come for work and stay for connection.

Inspiration: Reddit's threading + LMS structure + LinkedIn profiles + Discord's stickiness

---

## Core Philosophy

### "Freedom of choice is a curse"

Members (and org admins) don't know what they want until they see it. We provide:
- **Opinionated defaults** that work out of the box
- **Templates** that guide, not restrict
- **Guardrails** on free tier (not punishment—protection from decision paralysis)
- **Full customization** on paid tier for those ready for it

### Free vs Paid Community

| Aspect | Free Tier | Paid Tier |
|--------|-----------|-----------|
| Forums | 3 default forums (General, Announcements, Q&A) | Unlimited custom forums |
| Themes | 1 clean default theme | Full color/branding customization |
| Profiles | Basic (name, photo, bio, role) | Rich (certifications, portfolio, social links, badges) |
| Messaging | Direct messages only | Group chats, message reactions |
| Member directory | Simple list view | Advanced search, filters, map view |
| Content | Text posts only | Rich media, file attachments, embeds |

The paid experience should be so good that orgs *want* to upgrade—not because free is crippled, but because paid is irresistible.

---

## Information Architecture

```
/portal/community/
├── index.html          # Community home (feed + navigation)
├── forum.html?id=xxx   # Single forum view
├── post.html?id=xxx    # Single post with replies
├── members/
│   ├── index.html      # Member directory
│   └── profile.html?id=xxx  # Member profile
├── messages/
│   ├── index.html      # Inbox
│   └── thread.html?id=xxx   # Conversation thread
└── notifications.html  # All notifications
```

---

## Page-by-Page Design

### 1. Community Home (`/portal/community/`)

The heartbeat. First thing members see when they click "Community."

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  [Back to Portal]              [🔔] [✉️ 3]  [Profile ▼] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌─────────────────────────────────┐ │
│  │ FORUMS       │  │  FEED                           │ │
│  │              │  │                                 │ │
│  │ 📢 Announce  │  │  ┌─────────────────────────────┐│ │
│  │ 💬 General   │  │  │ [Avatar] Sarah Chen         ││ │
│  │ ❓ Q&A       │  │  │ in General · 2h ago         ││ │
│  │              │  │  │                             ││ │
│  │ ───────────  │  │  │ Anyone attending the       ││ │
│  │ + New Forum  │  │  │ spring conference?          ││ │
│  │   (paid)     │  │  │                             ││ │
│  │              │  │  │ 💬 12  ❤️ 5                 ││ │
│  ├──────────────┤  │  └─────────────────────────────┘│ │
│  │ MEMBERS      │  │                                 │ │
│  │              │  │  ┌─────────────────────────────┐│ │
│  │ 47 online    │  │  │ [Avatar] Admin             ││ │
│  │ 234 total    │  │  │ in Announcements · 1d ago  ││ │
│  │              │  │  │ 📌 PINNED                   ││ │
│  │ [See all →]  │  │  │                             ││ │
│  │              │  │  │ New CEU requirements for   ││ │
│  │ ┌──┐ ┌──┐    │  │  │ 2025 - please read...      ││ │
│  │ └──┘ └──┘    │  │  │                             ││ │
│  │ (avatars)    │  │  │ 💬 28  ❤️ 45                ││ │
│  └──────────────┘  │  └─────────────────────────────┘│ │
│                    │                                 │ │
│                    │  [Load more...]                 │ │
│                    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Key elements:**
- Left sidebar: Forums list, member count, quick member avatars
- Main area: Unified feed across all forums (or filtered by forum)
- Each post shows: author, forum, time, preview, engagement counts
- Pinned posts float to top
- "New Forum" button visible but locked for free tier (shows upgrade prompt)

---

### 2. Forum View (`/portal/community/forum.html?id=xxx`)

Single forum with all its posts.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Community    💬 General Discussion                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [New Post]                         [Sort: Recent ▼]    │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [Avatar] Maria Lopez                          2h ago││
│  │                                                     ││
│  │ Best practices for medical interpreting?           ││
│  │                                                     ││
│  │ I'm looking for resources on medical terminology   ││
│  │ and protocols. Anyone have recommendations?        ││
│  │                                                     ││
│  │ 💬 8 replies  ❤️ 12  [Reply]                        ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [Avatar] James Wright                         1d ago││
│  │ ...                                                 ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 3. Post View (`/portal/community/post.html?id=xxx`)

Single post with threaded replies. This is where conversations happen.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← General Discussion                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [Large Avatar]                                      ││
│  │ Maria Lopez · Certified Interpreter                 ││
│  │ Posted 2 hours ago                                  ││
│  │                                                     ││
│  │ ─────────────────────────────────────────────────── ││
│  │                                                     ││
│  │ Best practices for medical interpreting?           ││
│  │                                                     ││
│  │ I'm looking for resources on medical terminology   ││
│  │ and protocols. Has anyone found good training      ││
│  │ materials or have tips from experience?            ││
│  │                                                     ││
│  │ I've been interpreting for 3 years but just        ││
│  │ started taking on medical assignments.             ││
│  │                                                     ││
│  │ ─────────────────────────────────────────────────── ││
│  │ ❤️ 12        💬 8 replies        [♡ Like] [Reply]   ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  REPLIES                                                │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [Avatar] Dr. Sarah Chen · Medical Specialist        ││
│  │ 1 hour ago                                          ││
│  │                                                     ││
│  │ Great question! I'd recommend starting with the    ││
│  │ IMIA medical terminology course. Also, shadowing   ││
│  │ is invaluable if you can arrange it.               ││
│  │                                                     ││
│  │ ❤️ 5   [♡ Like] [Reply]                             ││
│  │                                                     ││
│  │   ┌─────────────────────────────────────────────── ││
│  │   │ [Avatar] Maria Lopez · 45m ago                 ││
│  │   │ Thank you! I'll check out that course.         ││
│  │   │ ❤️ 2   [♡ Like] [Reply]                         ││
│  │   └─────────────────────────────────────────────── ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Write a reply...                                    ││
│  │                                                     ││
│  │                                        [Post Reply] ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key elements:**
- Threaded replies (Reddit-style nesting, but max 2-3 levels to prevent chaos)
- Author shows role/certification (from their profile)
- Like and Reply on every post/reply
- Quick reply box at bottom

---

### 4. Member Directory (`/portal/community/members/`)

Browse the village.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Community    Member Directory                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [🔍 Search members...]          [Filter ▼] [Sort ▼]   │
│                                                         │
│  234 members · 47 online now                            │
│                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐│
│  │   [Avatar]     │  │   [Avatar]     │  │  [Avatar]  ││
│  │                │  │                │  │            ││
│  │  Sarah Chen    │  │  James Wright  │  │  Maria L.  ││
│  │  Medical Spec. │  │  Legal Interp. │  │  General   ││
│  │  🟢 Online     │  │  ⚪ Offline     │  │  🟢 Online ││
│  │                │  │                │  │            ││
│  │  [View] [💬]   │  │  [View] [💬]   │  │ [View][💬] ││
│  └────────────────┘  └────────────────┘  └────────────┘│
│                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐│
│  │   ...          │  │   ...          │  │  ...       ││
│  └────────────────┘  └────────────────┘  └────────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Paid tier additions:**
- Advanced filters (by certification, location, specialty)
- Map view (members by location)
- Export member list

---

### 5. Member Profile (`/portal/community/members/profile.html?id=xxx`)

The soul of each villager.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Members                                 [✉️ Message] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │                                                     ││
│  │        [Large Avatar Photo]                         ││
│  │                                                     ││
│  │           Sarah Chen                                ││
│  │     Medical Interpreting Specialist                 ││
│  │           🟢 Online now                             ││
│  │                                                     ││
│  │   San Francisco, CA · Member since 2021             ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ABOUT                                                  │
│  ───────────────────────────────────────────────────────│
│  Certified medical interpreter with 8 years of         │
│  experience. Specializing in oncology and cardiology   │
│  settings. Passionate about patient advocacy.          │
│                                                         │
│  CERTIFICATIONS                                         │
│  ───────────────────────────────────────────────────────│
│  ✓ CMI - Certified Medical Interpreter (2019)          │
│  ✓ CoreCHI - Healthcare Interpreter (2018)             │
│  ✓ BLS Certified                                        │
│                                                         │
│  LANGUAGES                                              │
│  ───────────────────────────────────────────────────────│
│  English (Native) · Mandarin (Native) · Spanish (Prof) │
│                                                         │
│  RECENT ACTIVITY                                        │
│  ───────────────────────────────────────────────────────│
│  💬 Replied to "Medical terminology resources" · 2h    │
│  ❤️ Liked "New CEU requirements for 2025" · 1d         │
│  💬 Started "Virtual interpreting equipment recs" · 3d │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Profile sections (configurable by org):**
- Photo + Name + Title/Role
- Online status
- Location + Member since
- Bio
- Certifications/Credentials
- Languages/Skills
- Social links (paid tier)
- Recent community activity
- Contact button (triggers DM)

---

### 6. Messages Inbox (`/portal/community/messages/`)

The mailroom.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Messages                              [+ New Message]  │
├───────────────────────┬─────────────────────────────────┤
│                       │                                 │
│  CONVERSATIONS        │  [Select a conversation]        │
│                       │                                 │
│  ┌─────────────────┐  │  or                             │
│  │ [Av] Sarah Chen │  │                                 │
│  │ Thanks for the  │  │  [Start a new conversation]     │
│  │ tip! I'll...    │  │                                 │
│  │           2h ●  │  │                                 │
│  └─────────────────┘  │                                 │
│                       │                                 │
│  ┌─────────────────┐  │                                 │
│  │ [Av] James W.   │  │                                 │
│  │ Are you going   │  │                                 │
│  │ to the conf...  │  │                                 │
│  │           1d    │  │                                 │
│  └─────────────────┘  │                                 │
│                       │                                 │
│  ┌─────────────────┐  │                                 │
│  │ [Av] Admin      │  │                                 │
│  │ Welcome to the  │  │                                 │
│  │ community!      │  │                                 │
│  │           5d    │  │                                 │
│  └─────────────────┘  │                                 │
│                       │                                 │
└───────────────────────┴─────────────────────────────────┘
```

**When conversation selected:**
```
┌───────────────────────┬─────────────────────────────────┐
│                       │  Sarah Chen              [···]  │
│  CONVERSATIONS        ├─────────────────────────────────┤
│                       │                                 │
│  ┌─────────────────┐  │  ┌─────────────────────────┐    │
│  │ [Av] Sarah Chen │  │  │ Hey! I saw your post    │    │
│  │ Thanks for the  │◀─│  │ about medical interp.   │    │
│  │ tip! I'll...    │  │  │ I have some resources.  │    │
│  │           2h ●  │  │  │                   10:30am│   │
│  └─────────────────┘  │  └─────────────────────────┘    │
│                       │                                 │
│  ...                  │         ┌─────────────────────┐ │
│                       │         │ That would be great!│ │
│                       │         │ Thank you so much.  │ │
│                       │         │              10:32am│ │
│                       │         └─────────────────────┘ │
│                       │                                 │
│                       │  ┌─────────────────────────┐    │
│                       │  │ Thanks for the tip!     │    │
│                       │  │ I'll definitely check   │    │
│                       │  │ out that course.        │    │
│                       │  │                   2:15pm│    │
│                       │  └─────────────────────────┘    │
│                       │                                 │
│                       ├─────────────────────────────────┤
│                       │ [Type a message...]     [Send]  │
└───────────────────────┴─────────────────────────────────┘
```

**Key elements:**
- Two-panel layout (conversation list + active conversation)
- Unread indicator (●)
- Messages styled like iMessage/WhatsApp (bubbles, timestamps)
- Real-time updates (polling or WebSocket)

---

## Default Forums (Dev-created templates)

Every new org gets these three forums:

1. **📢 Announcements** (admin-only posting)
   - For org-wide updates
   - Members can comment but not start threads
   - Posts here also create notifications

2. **💬 General Discussion**
   - Open to all members
   - The village square

3. **❓ Questions & Help**
   - For member-to-member support
   - Encourages community self-service

Paid tier: Orgs can add custom forums, rename defaults, or hide them.

---

## Profile Fields (Configurable by Org)

**Core fields (always shown):**
- Profile photo
- Display name
- Title/Role
- Bio

**Optional fields (org enables/disables):**
- Location (city, state)
- Languages
- Certifications
- Skills/Specialties
- Years of experience
- Social links (LinkedIn, etc.)
- Contact preferences

**Privacy:**
- Members control: "Show in directory" toggle
- Members control: "Allow messages" toggle
- Org controls: Which fields are required vs optional

---

## Mobile Experience

The community MUST be mobile-first. Members will check this on their phones.

- Bottom navigation: Home | Community | Messages | Profile
- Pull-to-refresh on feeds
- Native-feeling transitions
- Push notifications (future: PWA)

---

## Implementation Scope

**No layers. No MVP. Build it complete.**

### Community Pages (all features from day one)
1. **Community home** - Feed, forum sidebar, member preview, search, real-time updates
2. **Forum view** - Posts, sorting, pinning, admin controls
3. **Post view** - Threaded replies (nested), likes with animations, rich text
4. **Member directory** - Grid view, search, filters, online status, map view (paid)
5. **Member profile** - Full rich profiles, all fields, activity feed, badges
6. **Messages inbox** - Two-panel, real-time, read receipts, reactions

### Moderation Tools (built-in from start)
- Delete any post/reply
- Edit any post/reply
- Pin/unpin posts
- Lock threads (prevent new replies)
- Ban member from community
- Mute member (can read, can't post)
- Report system (members flag content)
- Moderation log (audit trail)

### Admin Controls
- Create/edit/delete forums
- Set forum permissions (who can post, who can view)
- Customize profile fields
- Enable/disable community features per tier
- View community analytics (posts, engagement, active members)

### Security
- 2FA for members (optional, org can require)
- Session management (see active sessions, logout all)
- Rate limiting on posts/messages
- Content filtering (profanity, spam detection)
- Audit logs for admin actions

### Real-time Features
- WebSocket connections for:
  - New posts in feed
  - New replies on posts you're viewing
  - New messages
  - Online status updates
  - Typing indicators in messages
- Graceful fallback to polling if WebSocket fails

### Rich Content
- Rich text editor (bold, italic, lists, links)
- Image uploads in posts (with compression)
- File attachments (PDF, docs) - paid tier
- Embeds (YouTube, links with previews)
- @mentions with autocomplete
- Emoji picker

### Notifications
- In-app notification center
- Email digests (daily/weekly summary) - paid tier
- Push notifications (PWA) - future
- Granular preferences (what to notify, how often)

---

## Database Schema Additions

```sql
-- Member online status tracking
ALTER TABLE members ADD COLUMN last_seen_at TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN is_online BOOLEAN DEFAULT false;

-- 2FA for members
ALTER TABLE members ADD COLUMN totp_secret VARCHAR(255);
ALTER TABLE members ADD COLUMN totp_enabled BOOLEAN DEFAULT false;
ALTER TABLE members ADD COLUMN backup_codes JSONB;

-- Member sessions
CREATE TABLE member_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  user_agent TEXT,
  ip_address INET,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Moderation
ALTER TABLE community_posts ADD COLUMN locked_at TIMESTAMPTZ;
ALTER TABLE community_posts ADD COLUMN locked_by UUID REFERENCES users(id);
ALTER TABLE community_posts ADD COLUMN edited_at TIMESTAMPTZ;
ALTER TABLE community_posts ADD COLUMN edited_by UUID;

ALTER TABLE members ADD COLUMN community_banned_at TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN community_banned_by UUID REFERENCES users(id);
ALTER TABLE members ADD COLUMN community_muted_until TIMESTAMPTZ;

CREATE TABLE community_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES members(id) ON DELETE SET NULL,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE moderation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Read receipts for messages
ALTER TABLE direct_messages ADD COLUMN read_at TIMESTAMPTZ;

-- Typing indicators (ephemeral, handled in-memory/redis)

-- Rich content
ALTER TABLE community_posts ADD COLUMN content_html TEXT;
ALTER TABLE community_posts ADD COLUMN attachments JSONB DEFAULT '[]';

-- @mentions
CREATE TABLE mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Tech Decisions

1. **Real-time**: WebSocket with Socket.io (fallback to polling built-in)
2. **Rich text**: Tiptap editor (ProseMirror-based, clean output)
3. **Image uploads**: Sharp for compression, store in /uploads or S3
4. **2FA**: TOTP with speakeasy library, QR codes with qrcode library
5. **Rate limiting**: express-rate-limit per endpoint
6. **Content filtering**: Basic profanity filter, spam heuristics

---

## Build Order

Not layers. Just the order we write code:

1. Database migrations (all schema above)
2. WebSocket infrastructure (Socket.io setup)
3. Community home page (complete)
4. Forum page (complete with moderation)
5. Post page (complete with threading, rich text)
6. Member directory (complete with search/filters)
7. Member profile (complete with all fields)
8. Messages (complete with real-time)
9. Admin moderation panel
10. 2FA setup flow
11. Notification preferences

Each page is DONE before moving to the next. No skeletons. No "we'll add that later."
