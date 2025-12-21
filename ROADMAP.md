# VillageKeep Roadmap

Standalone membership management platform. Primary customer: Americans Against Language Barriers (dogfooding). Target market: nonprofits, professional associations, any org with members.

**Competitor:** Wild Apricot (dated UX, weak API, expensive at scale)

**Architecture:** Defined in learn repo's `MEMBERSHIP_STANDALONE_ARCHITECTURE.md`

---

## Tech Stack (Aligned with LMS)

- **Backend:** Node.js + Express
- **Database:** PostgreSQL (raw SQL)
- **Frontend:** Static HTML/JS (same pattern as LMS)
- **Payments:** Stripe
- **Email:** Nodemailer (already in LMS)
- **Hosting:** Render

---

## Phase 1: Core API & Database

### Database Setup
- [ ] Apps table (multi-tenant)
- [ ] Membership tiers table
- [ ] User memberships table
- [ ] Protected resources table (generic - not LMS-specific)
- [ ] Tier-resource assignments
- [ ] User resource access records

### Core API Endpoints
- [ ] `POST /api/v1/apps` - Register an app (e.g., LMS, mobile)
- [ ] `GET/POST/PUT/DELETE /api/v1/tiers` - Manage membership tiers
- [ ] `GET/POST /api/v1/resources` - Register protected resources
- [ ] `POST /api/v1/tiers/:id/resources` - Assign resources to tiers
- [ ] `POST /api/v1/users` - Register users
- [ ] `POST /api/v1/users/:id/subscribe` - Create subscription
- [ ] `GET /api/v1/access/check` - **Critical:** Check if user can access resource

### Authentication
- [ ] API key generation and validation
- [ ] App authentication middleware

**Goal:** LMS can call VillageKeep API to check access, manage tiers, and register resources.

---

## Phase 2: Billing & Member Portal

### Stripe Integration
- [ ] Checkout session creation
- [ ] Webhook handling (payment success/failure)
- [ ] Subscription lifecycle (create, cancel, pause, resume)
- [ ] Invoice generation
- [ ] Customer portal link

### Member-Facing UI
- [ ] Pricing page (embeddable)
- [ ] Checkout flow
- [ ] Account management (view subscription, update payment)
- [ ] Access dashboard (what resources I have)

**Goal:** End-to-end payment flow works. Members can self-serve.

---

## Phase 3: CEU Tracking (Differentiator)

### Credit System
- [ ] Credit types per org (CEU, contact hours, PDUs, etc.)
- [ ] Requirements by membership tier
- [ ] Manual credit entry (admin)
- [ ] Credit approval workflow
- [ ] Auto-credit via LMS webhook (course completion)

### Compliance
- [ ] Member compliance dashboard
- [ ] Org-wide compliance reporting
- [ ] Expiration warnings
- [ ] Certificate generation

**Goal:** Professional associations can track CE requirements. This is the moat.

---

## Phase 4: Webhooks & Integration

### Event System
- [ ] Webhook registration per app
- [ ] Event types: subscription.*, access.*, payment.*
- [ ] Delivery with retries
- [ ] Webhook logs

### LMS Integration
- [ ] LMS receives webhooks on access changes
- [ ] LMS auto-registers courses as protected resources
- [ ] Single sign-on (shared session or JWT)

**Goal:** LMS and VillageKeep work seamlessly together.

---

## Phase 5: Admin & Analytics

### Admin Dashboard
- [ ] Member management (search, filter, edit)
- [ ] Tier management UI
- [ ] Resource assignment UI
- [ ] Manual access grants/revokes

### Reporting
- [ ] Membership growth/churn
- [ ] Revenue (MRR, ARR)
- [ ] CEU compliance rates
- [ ] Tier distribution

**Goal:** Org admins have full visibility and control.

---

## Phase 6: Scale & SaaS

### Multi-Org SaaS
- [ ] Self-service org signup
- [ ] Org billing (VillageKeep charges orgs)
- [ ] Usage-based pricing
- [ ] White-label options

### Advanced Features
- [ ] Teams/group memberships
- [ ] Drip content (unlock over time)
- [ ] Usage limits per tier
- [ ] Public member directory
- [ ] Events with registration

---

## Immediate Next Steps

1. **Scaffold project** - Express app, PostgreSQL connection, folder structure
2. **Create database schema** - Tables from MEMBERSHIP_STANDALONE_ARCHITECTURE.md
3. **Build `/api/v1/access/check`** - This is the most critical endpoint
4. **Test with LMS** - Make one course gated by membership

---

## Files to Reference

- `/home/user/learn/MEMBERSHIP_STANDALONE_ARCHITECTURE.md` - Full API design
- `/home/user/learn/MEMBERSHIP_SYSTEM_DESIGN.md` - System design
- `/home/user/learn/MEMBERSHIP_SYSTEM_SPECIFICATION.md` - Detailed spec
- `/home/user/learn/db/queries-membership.js` - Existing membership queries in LMS
