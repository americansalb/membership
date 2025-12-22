# VillageKeep Roadmap

All-in-one platform for membership management and fundraising. Combines what Wild Apricot does for memberships with what Givebutter does for fundraising—in one modern product.

**Primary customer:** Americans Against Language Barriers (dogfooding)
**Target market:** Nonprofits, professional associations, trade groups, clubs
**Competitors:** Wild Apricot (membership), Givebutter/Zeffy (fundraising)

**Revenue model:** Free platform + optional tips + payment processing fees
**Corporate structure:** For-profit LLC

**Architecture:** Defined in learn repo's `MEMBERSHIP_STANDALONE_ARCHITECTURE.md`

---

## Tech Stack (Aligned with LMS)

- **Backend:** Node.js + Express
- **Database:** PostgreSQL (raw SQL)
- **Frontend:** Static HTML/JS (same pattern as LMS)
- **Payments:** Stripe Connect (Express) - orgs are merchant of record
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

## Phase 2: Stripe Connect & Member Portal

### Stripe Connect (Express)
- [ ] Org onboarding to Stripe Connect (Express account creation)
- [ ] Connected account verification flow
- [ ] Application fee collection on transactions
- [ ] Checkout session creation (on connected account)
- [ ] Webhook handling (payment success/failure)
- [ ] Subscription lifecycle (create, cancel, pause, resume)

### Tips System
- [ ] Optional tip at checkout (NOT pre-selected)
- [ ] Tip goes to VillageKeep platform account
- [ ] Clear, honest messaging

### Member-Facing UI
- [ ] Pricing page (embeddable)
- [ ] Checkout flow with Stripe Connect
- [ ] Account management (view subscription, update payment)
- [ ] Access dashboard (what resources I have)

**Goal:** End-to-end payment flow works. Orgs are merchant of record. Tips and app fees flow to VillageKeep.

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

## Phase 4: Fundraising Module

### Donation Pages
- [ ] One-time donation forms
- [ ] Recurring donation setup
- [ ] Custom donation amounts
- [ ] Suggested donation tiers
- [ ] Embeddable widgets

### Campaigns
- [ ] Campaign creation with goals
- [ ] Progress tracking
- [ ] Campaign pages with branding
- [ ] Social sharing

### Peer-to-Peer (Future)
- [ ] Supporter fundraising pages
- [ ] Team fundraising
- [ ] Leaderboards

### Donor Management
- [ ] Donor profiles
- [ ] Giving history
- [ ] Tax receipts
- [ ] Thank you emails

**Goal:** Orgs can run fundraising campaigns alongside membership. Competes with Givebutter.

---

## Phase 5: Webhooks & Integration

### Event System
- [ ] Webhook registration per app
- [ ] Event types: subscription.*, access.*, payment.*, donation.*
- [ ] Delivery with retries
- [ ] Webhook logs

### LMS Integration
- [ ] LMS receives webhooks on access changes
- [ ] LMS auto-registers courses as protected resources
- [ ] Single sign-on (shared session or JWT)

**Goal:** LMS and VillageKeep work seamlessly together.

---

## Phase 6: Admin & Analytics

### Admin Dashboard
- [ ] Member management (search, filter, edit)
- [ ] Donor management
- [ ] Tier management UI
- [ ] Resource assignment UI
- [ ] Manual access grants/revokes

### Reporting
- [ ] Membership growth/churn
- [ ] Payment volume & revenue
- [ ] Fundraising totals & campaigns
- [ ] CEU compliance rates
- [ ] Tier distribution

**Goal:** Org admins have full visibility and control.

---

## Phase 7: Scale & Growth

### Multi-Org Platform
- [ ] Self-service org signup
- [ ] Stripe Connect onboarding flow
- [ ] Org settings & customization
- [ ] White-label options (premium)

### Advanced Features
- [ ] Teams/group memberships
- [ ] Drip content (unlock over time)
- [ ] Usage limits per tier
- [ ] Public member directory
- [ ] Events with registration & ticketing

---

## Immediate Next Steps

1. **Scaffold project** - Express app, PostgreSQL connection, folder structure
2. **Create database schema** - Tables from MEMBERSHIP_STANDALONE_ARCHITECTURE.md
3. **Build `/api/v1/access/check`** - This is the most critical endpoint
4. **Set up Stripe Connect** - Platform account, Express account creation flow
5. **Test with AALB** - Membership + basic donation flow working

---

## Files to Reference

- `/home/user/learn/MEMBERSHIP_STANDALONE_ARCHITECTURE.md` - Full API design
- `/home/user/learn/MEMBERSHIP_SYSTEM_DESIGN.md` - System design
- `/home/user/learn/MEMBERSHIP_SYSTEM_SPECIFICATION.md` - Detailed spec
- `/home/user/learn/db/queries-membership.js` - Existing membership queries in LMS
