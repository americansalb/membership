# VillageKeep Roadmap

Membership management platform for nonprofits with CEU tracking, LMS integration, and CRM capabilities.

## Phase 1: Foundation (MVP)

### Core Member Management
- [ ] Member database (name, contact, custom fields)
- [ ] Membership tiers/levels
- [ ] Join/renewal/expiration tracking
- [ ] Member status lifecycle (prospect → active → lapsed → former)
- [ ] Basic member portal (self-service profile updates)

### Authentication & Multi-tenancy
- [ ] Org signup/onboarding
- [ ] User authentication (email/password, OAuth)
- [ ] Role-based permissions (admin, staff, member)
- [ ] Multi-tenant architecture (each nonprofit = isolated tenant)

### Payments
- [ ] Stripe integration
- [ ] Recurring billing for memberships
- [ ] Invoice generation
- [ ] Payment history

**Goal:** A nonprofit can sign up, create membership tiers, accept payments, and manage members.

---

## Phase 2: CEU & Professional Development

### CEU Tracking
- [ ] Credit types configuration (per org)
- [ ] Credit requirements by membership level
- [ ] Manual credit entry
- [ ] Credit approval workflows
- [ ] Compliance reporting (who's behind, who's current)
- [ ] Certificate generation

### LMS Integration
- [ ] API integration with your LMS
- [ ] Auto-credit on course completion
- [ ] Course catalog display in member portal
- [ ] Progress tracking

**Goal:** Professional associations can track continuing education requirements.

---

## Phase 3: Engagement & Communication

### Email & Communication
- [ ] Transactional emails (welcome, renewal reminders, receipts)
- [ ] Bulk email campaigns
- [ ] Email templates
- [ ] Automated sequences (onboarding drip, renewal series)

### Content Delivery
- [ ] Member-only content/resources
- [ ] Content gating by membership level
- [ ] Download tracking
- [ ] Resource library

**Goal:** Orgs can communicate with members and deliver gated content.

---

## Phase 4: CRM & Advanced Features

### CRM Capabilities
- [ ] Contact management (beyond members - donors, prospects, partners)
- [ ] Interaction/activity logging
- [ ] Notes and tags
- [ ] Custom pipelines (membership sales, sponsorships)
- [ ] Task management

### Events
- [ ] Event creation and registration
- [ ] Ticket types and pricing
- [ ] Member discounts
- [ ] Attendance tracking
- [ ] CEU credits for event attendance

### Reporting & Analytics
- [ ] Membership growth/churn dashboards
- [ ] Revenue reporting
- [ ] CEU compliance reports
- [ ] Custom report builder
- [ ] Data export

**Goal:** Full operational platform replacing spreadsheets and disconnected tools.

---

## Phase 5: Scale & Differentiation

### Integrations
- [ ] Zapier/Make integration
- [ ] QuickBooks/Xero sync
- [ ] Mailchimp/ConvertKit sync
- [ ] API for custom integrations

### Advanced
- [ ] White-label/custom domains
- [ ] Chapter/affiliate management
- [ ] Directory (public member directory)
- [ ] Job board
- [ ] Mobile app

---

## Tech Stack (Proposed)

- **Frontend:** Next.js + TypeScript
- **Backend:** Node.js or Python (FastAPI)
- **Database:** PostgreSQL
- **Auth:** Clerk or Auth0 (or custom)
- **Payments:** Stripe
- **Email:** Resend or SendGrid
- **Hosting:** Vercel + Railway/Render (or AWS)

---

## Competitive Advantages to Build

1. **Modern UX** - Wild Apricot looks dated. Clean, fast UI wins.
2. **CEU-first** - Most competitors bolt this on. Make it core.
3. **LMS integration** - Native connection to your LMS is a moat.
4. **Pricing** - Undercut Wild Apricot, especially at scale.
5. **API-first** - Let power users integrate; WA's API is weak.

---

## Questions to Answer

1. What's your nonprofit? (dogfooding = fastest feedback loop)
2. What LMS are you building? (tech stack alignment)
3. Solo founder or team?
4. Timeline pressure? (grant cycle, board expectations)
5. Budget for infrastructure/services?
