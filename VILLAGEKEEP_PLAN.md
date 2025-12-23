# VillageKeep: Complete Business & Product Plan

*Membership Management + Fundraising Platform*

---

## Executive Summary

**VillageKeep** is an all-in-one platform for membership management and fundraising. We combine what Wild Apricot does for memberships with what Givebutter does for fundraising—in a single, modern product with honest pricing.

| | |
|---|---|
| **Product** | Membership + Fundraising + CEU Tracking |
| **Revenue Model** | Free platform + optional tips + payment processing fees |
| **Target Market** | Nonprofits, professional associations, trade groups, clubs |
| **Competitors** | Wild Apricot (membership), Givebutter/Zeffy (fundraising) |
| **Corporate Structure** | For-profit LLC |
| **First Customer** | Americans Against Language Barriers (dogfooding) |

---

## The Problem

### For Professional Associations
- CEU/continuing education tracking is painful and manual
- Wild Apricot has weak CEU features (bolt-on, not native)
- Need to track member compliance for credentialing bodies

### For Nonprofits & Fundraisers
- Givebutter only serves 501(c)(3) organizations
- Membership and fundraising require separate tools
- Existing tools use manipulative tip prompts (15% pre-selected)

### For All Organizations with Members
- Wild Apricot is dated (2010-era UX) and expensive at scale
- No single platform handles membership + fundraising + CEU
- Per-contact pricing punishes growth

---

## The Solution

One platform with modular features:

| Module | What It Does |
|--------|--------------|
| **Membership** | Member database, profiles, custom fields, lifecycle tracking, tiers |
| **Fundraising** | Donation pages, campaigns, peer-to-peer, recurring giving |
| **CEU Tracking** | Credit types, requirements, auto-grant from LMS, compliance reports |
| **Billing** | Stripe-powered subscriptions, invoices, member portal |
| **Events** | Registration, ticketing, check-in (future) |
| **Access Control** | Gate content/resources by membership tier |
| **LMS Integration** | Native connection to learning management system |

### Key Differentiators

1. **CEU-first design** — Not a bolt-on; built for professional associations
2. **Membership + Fundraising combined** — One tool, not two
3. **Serves everyone** — Not just 501(c)(3)s; trade associations, clubs welcome
4. **Honest pricing** — Tips not pre-selected, no guilt tactics
5. **Modern UX** — Clean, fast, mobile-first (not 2010-era)
6. **API-first** — Integrate with anything

---

## Target Market

### Primary: Organizations with Members

Unlike Givebutter (nonprofits only), VillageKeep serves anyone with members:

**Professional Associations (CEU requirements)**
- Medical/legal interpreters (our first market via AALB)
- Healthcare professionals (nurses, therapists, pharmacists)
- Legal professionals (paralegals, court reporters)
- Real estate agents, financial advisors, teachers

**Trade Associations**
- Industry groups, chambers of commerce
- Professional networks, business associations

**Member-Based Nonprofits**
- Charities with donor/member programs
- Alumni associations
- Religious organizations

**Clubs & Societies**
- Hobbyist groups, sports clubs
- Social organizations, community groups

### Market Size

| Segment | US Count | Avg Members | Opportunity |
|---------|----------|-------------|-------------|
| Professional associations | ~7,500 | 5,000 | High |
| Trade associations | ~15,000 | 1,000 | High |
| Nonprofits with members | ~500,000 | 500 | Medium |
| Clubs & societies | ~100,000 | 200 | Medium |

**Competitor benchmarks:**
- Wild Apricot: 30,000+ customers, ~$60M ARR
- Givebutter: 100,000+ nonprofits, venture-backed
- Even 1% of Wild Apricot's market = $600K ARR

---

## Competitive Analysis

### Wild Apricot (Membership)

| Strengths | Weaknesses |
|-----------|------------|
| Established brand (since 2006) | Dated UI/UX (looks like 2010) |
| Full feature set | Weak CEU tracking (bolt-on) |
| Integrations ecosystem | Per-contact pricing (expensive at scale) |
| Website builder included | Poor mobile experience |
| | Slow, clunky interface |
| | Weak API |
| | No fundraising features |

### Givebutter (Fundraising)

| Strengths | Weaknesses |
|-----------|------------|
| Modern, beautiful UI | 501(c)(3) nonprofits only |
| Free platform (tips model) | No membership management |
| Strong fundraising features | Pre-selected 15% tip (manipulative) |
| Good social/peer-to-peer tools | No CEU tracking |
| | Limited member lifecycle features |

### Zeffy (Fundraising)

| Strengths | Weaknesses |
|-----------|------------|
| 100% free, no platform fees | Very limited features |
| Tips only (optional) | No membership management |
| Growing rapidly | Nonprofits only |
| | No CEU tracking |

### Our Positioning

```
                    Modern UX
                        │
          Givebutter    │    VillageKeep
              ★         │         ★
                        │
 Fundraising ──────────┼──────────── Membership
   Only                 │              + CEU
                        │
            Wild Apricot│
                   ★    │
                        │
                    Dated UX
```

**We win on:**
- **vs Wild Apricot:** Modern UX, CEU-first, free pricing, fundraising included
- **vs Givebutter:** Membership features, serves all orgs (not just 501(c)(3)s), honest tips
- **vs Zeffy:** Full feature set, CEU tracking, membership management

---

## Revenue Model

### Freemium Tiers

| Feature | Free | Pro ($49/mo or $490/yr) | Enterprise ($149/mo or $1,490/yr) |
|---------|------|-------------------------|-----------------------------------|
| **Contacts** | Unlimited | Unlimited | Unlimited |
| **Members** | Unlimited | Unlimited | Unlimited |
| **Membership & payments** | ✅ | ✅ | ✅ |
| **Fundraising & donations** | ✅ | ✅ | ✅ |
| **CEU tracking** | Basic | Advanced | Advanced |
| **Member portal** | ✅ | ✅ | ✅ |
| **Reporting** | Basic | Advanced | Advanced |
| **API access** | ✅ | ✅ | ✅ |
| **Data export** | CSV | CSV + PDF | CSV + PDF + API |
| **Emails included** | 1,000/mo | 10,000/mo | 50,000/mo |
| **SMS included** | 0 | 100/mo | 500/mo |
| **Storage** | 500 MB | 10 GB | 100 GB |
| **VillageKeep branding** | Shown | **Removed** | Removed |
| **Custom domain** | ❌ | **✅** | ✅ |
| **Priority support** | ❌ | **✅** | ✅ |
| **Zoom integration** | ❌ | ❌ | **✅** |
| **Salesforce/CRM sync** | ❌ | ❌ | **✅** |
| **SSO/SAML** | ❌ | ❌ | **✅** |
| **SLA guarantee** | ❌ | ❌ | **✅** |

**Annual pricing:** 2 months free (17% discount)

#### CEU Tracking: Basic vs Advanced

| Feature | Basic (Free) | Advanced (Pro+) |
|---------|--------------|-----------------|
| Manual credit entry | ✅ | ✅ |
| Member CEU dashboard | ✅ | ✅ |
| Export to CSV | ✅ | ✅ |
| Auto-grant from LMS | ❌ | ✅ |
| Compliance reports | ❌ | ✅ |
| Certificate generation (PDF) | ❌ | ✅ |
| Expiration email reminders | ❌ | ✅ |
| Bulk credit operations | ❌ | ✅ |

#### Reporting: Basic vs Advanced

| Feature | Basic (Free) | Advanced (Pro+) |
|---------|--------------|-----------------|
| Member count & totals | ✅ | ✅ |
| Revenue summary | ✅ | ✅ |
| Growth trends over time | ❌ | ✅ |
| Churn analysis | ❌ | ✅ |
| Donation & campaign reports | ❌ | ✅ |
| CEU compliance % | ❌ | ✅ |
| Export reports (PDF/CSV) | ❌ | ✅ |

**Why people upgrade:**
- **Pro:** CEU automation, compliance reports, white-label, advanced analytics
- **Enterprise:** Integrations, SSO, compliance requirements, SLA guarantees

### Usage-Based Pricing

| Channel | Free Tier | Pro | Enterprise | Overage |
|---------|-----------|-----|------------|---------|
| **Email** | 1,000/mo | 10,000/mo | 50,000/mo | $0.001/email |
| **SMS** | — | 100/mo | 500/mo | $0.02/SMS |
| **Storage** | 500 MB | 10 GB | 100 GB | $0.50/GB (Pro), $0.25/GB (Ent) |

- SMS pricing covers Twilio costs (~$0.008) with healthy margin
- Storage covers Bunny.net costs (~$0.01/GB) with healthy margin
- Free tier cannot exceed storage limit (must upgrade)

### Payment Processing

- Pass through Stripe fees only: 2.9% + $0.30 per transaction
- Organization is merchant of record (via Stripe Connect Express)
- **No VillageKeep fee** — payment processing is free

### Tips & Platform Fee (Free Tier Only)

**Free tier has two options:**

| Option | What Happens |
|--------|--------------|
| **Tips Enabled** (default) | Tip prompt at payout: *"You received $5,000. Consider tipping to keep VillageKeep free."* [$25] [$50] [$100] [Skip] |
| **Tips Disabled** | No prompts, but 0.5% platform fee on transactions |

**Pro & Enterprise:** No tips, no platform fee. Subscription covers it.

**Key differences from Givebutter:**
- We ask the *org* at payout, not donors at checkout
- Org sees the value first (just got paid!)
- Skip is always easy—no guilt

### Payout Schedule

- **Standard payouts:** Free (2-day to org's bank)
- **Instant payouts:** 1% fee (Stripe charges this, not us)

### Downgrade Policy

If org downgrades from Pro/Enterprise to Free:

| Item | What Happens |
|------|--------------|
| **Data** | Preserved for 90 days (read-only) |
| **Access** | Can view but not edit until upgrade |
| **Storage over limit** | Oldest files auto-deleted after 90 days |
| **CEU/Analytics** | Reverts to Basic features |
| **Notification** | Banner: "Upgrade to edit. Data deletes in X days."

### Competitive Pricing Comparison

| Platform | Platform Fee | Processing | Members |
|----------|--------------|------------|---------|
| Wild Apricot | $60-420/mo | 2.9% + $0.30 | Capped by tier |
| Givebutter | Free | 2.9% + $0.30 | N/A (fundraising only) |
| Zeffy | Free | Tips only | N/A (fundraising only) |
| **VillageKeep Free** | **Free** | **2.9% + $0.30** | **Unlimited** |
| **VillageKeep Pro** | **$49/mo** | **2.9% + $0.30** | **Unlimited** |

### Premium Integrations (Enterprise)

| Integration | Extra Fee | Use Case |
|-------------|-----------|----------|
| **Zoom Live Giving** | +1% on transactions | Virtual events, galas, conferences |

#### Zoom Integration Details

Display a donation/payment widget during Zoom meetings:

```
┌─────────────────────────────────────────┐
│  Zoom Meeting                           │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │      Main Video Content           │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│  ┌─────────────────┐                    │
│  │ VillageKeep     │  ← Zoom App panel  │
│  │ ─────────────── │                    │
│  │ Support AALB    │                    │
│  │ [$25] [$50] [$] │                    │
│  │ [Donate Now]    │                    │
│  │                 │                    │
│  │  $1,250 raised  │  ← Live ticker     │
│  └─────────────────┘                    │
└─────────────────────────────────────────┘
```

- Zoom App sidebar widget
- One-click donations (Stripe Link for saved cards)
- Live donation ticker/goal progress
- Host controls (enable/disable, set goal)
- QR code overlay for hybrid events

**Why 1% premium is justified:**
- Captures unique "live event" giving moment
- Real value-add (telethon effect)
- Users opt in by using the feature
- No competitor has this

### Revenue Streams Summary

1. **Subscriptions** — Pro ($49/mo), Enterprise ($149/mo)
2. **Usage overage** — Email, SMS, and storage beyond included limits
3. **Tips or Platform Fee** — Org tips at payout, or 0.5% fee if tips disabled
4. **Premium integrations** — Zoom (+1% on transactions, Enterprise only)

---

## Payment Architecture

### Stripe Connect (Express)

We use Stripe Connect with Express accounts:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Donor/    │────▶│  VillageKeep │────▶│   Org's     │
│   Member    │     │   Platform   │     │   Stripe    │
│             │     │              │     │   Account   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  VillageKeep │
                    │  Platform    │
                    │  Account     │
                    │  (app fees   │
                    │   + tips)    │
                    └──────────────┘
```

**How it works:**
- Each organization has their own Stripe Express account
- VillageKeep never holds funds—orgs are merchant of record
- We collect application fee per transaction automatically
- Organizations handle their own disputes/refunds
- Enables instant payouts to orgs

**Why Express (not Standard or Custom):**
- Faster onboarding than Standard
- Less liability than Custom
- Stripe handles most compliance
- Good balance of control and simplicity

---

## Tech Stack

Aligned with existing LMS for code reuse and consistency.

**Architecture docs:** See `/home/user/learn/MEMBERSHIP_STANDALONE_ARCHITECTURE.md` for detailed API design.

| Component | Technology |
|-----------|------------|
| Backend | Node.js + Express |
| Database | PostgreSQL (raw SQL, no ORM) |
| Frontend | Static HTML/JS/CSS |
| Payments | Stripe Connect (Express) |
| Email | Nodemailer |
| File Storage | Bunny.net (storage + CDN) |
| Hosting | Render |

**Why this stack:**
- Already built and proven in the LMS
- Simple, maintainable, no framework churn
- PostgreSQL is rock-solid for multi-tenant SaaS
- Render is affordable and scales well

---

## UI Foundation (Build First)

> **Rule: No feature code until the foundation exists.**
> Every screen should assemble existing components, not create new styles.

### Build Order

```
1. CSS Variables     →  Colors, typography, spacing
2. Base Components   →  Button, Input, Card, Table, Modal
3. Layout Templates  →  Admin, Portal, Public
4. Feature Screens   →  Now you can build features
```

### 1. CSS Foundation (Day 1)

Create `variables.css` with everything from DESIGN_PLAN.md:

```css
:root {
  /* Colors */
  --navy-900: #102a43;
  --navy-800: #243b53;
  --orange-500: #c45a2c;
  /* ... all colors ... */

  /* Typography */
  --font-sans: 'Inter', sans-serif;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  /* ... all sizes ... */

  /* Spacing (4px grid) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  /* ... */

  /* Shadows, radii, etc. */
}

/* Dark mode ready from day 1 */
.dark {
  --bg-primary: #0f172a;
  --text-primary: #f1f5f9;
}
```

### 2. Core Components (Before Any Features)

Build and test these FIRST:

| Component | Priority | Why |
|-----------|----------|-----|
| Button | P0 | Every action uses it |
| Input/Form | P0 | Every form needs it |
| Card | P0 | Content containers everywhere |
| Table | P0 | Member lists, transactions, reports |
| Modal | P0 | Confirmations, quick forms |
| Toast/Alert | P0 | User feedback |
| Loading/Skeleton | P0 | Async states |
| Sidebar Nav | P1 | Admin layout |
| Top Nav | P1 | Public/portal layout |
| Empty State | P1 | No data yet messaging |
| Pagination | P1 | Long lists |

### 3. Layout Templates

```
layouts/
├── base.html         # Head, scripts, shared elements
├── public.html       # Marketing: header + content + footer
├── admin.html        # Sidebar + topbar + content area
└── portal.html       # Member-facing: nav + content
```

### 4. Responsive Strategy (Different Layouts, Not Just CSS)

> **Rule: Mobile and desktop can be completely different.**
> Don't force desktop layouts into mobile. Build separate experiences where needed.

#### Approach by Section

| Section | Desktop | Mobile | Strategy |
|---------|---------|--------|----------|
| **Admin** | Sidebar nav + data tables | Bottom nav + card lists | **Separate components** |
| **Member Portal** | Horizontal nav + grid | Bottom nav + stacked | **Separate components** |
| **Public/Marketing** | Full hero + multi-column | Stacked single column | **CSS-only** (simpler) |

#### How to Implement

```html
<!-- Option 1: CSS show/hide (simple layouts) -->
<div class="hidden md:block">Desktop version</div>
<div class="md:hidden">Mobile version</div>

<!-- Option 2: Separate components (complex layouts) -->
<!-- admin/members.html loads: -->
<script>
  if (window.innerWidth < 768) {
    loadComponent('member-card-list');   // Cards for mobile
  } else {
    loadComponent('member-data-table');  // Table for desktop
  }
</script>
```

#### Key Transformations

| Desktop | → | Mobile |
|---------|---|--------|
| Data table | → | Card list |
| Sidebar nav | → | Bottom nav |
| Multi-column grid | → | Single column stack |
| Hover actions | → | Swipe/tap actions |
| Dropdown menus | → | Full-screen menus |
| Modal dialogs | → | Full-screen pages |

#### Breakpoint Strategy

```css
/* Mobile first */
/* Base: 0-639px (phones) */
/* sm: 640px (large phones) */
/* md: 768px (tablets - MAJOR LAYOUT CHANGE) */
/* lg: 1024px (laptops) */
/* xl: 1280px (desktops) */
```

**Main breakpoint: 768px** — This is where layouts fundamentally change (mobile → desktop).

### 5. Accessibility From Day 1

| Requirement | How |
|-------------|-----|
| Keyboard navigation | All interactive elements focusable |
| Focus indicators | Visible focus rings (don't remove outlines) |
| Color contrast | 4.5:1 minimum (WCAG AA) |
| Form labels | Every input has a label |
| Alt text | Every image has alt attribute |
| Semantic HTML | Use button, nav, main, header, not just divs |
| Screen reader | Test with VoiceOver/NVDA |

### 6. File Structure

```
public/
├── css/
│   ├── variables.css      # Foundation
│   ├── reset.css          # Normalize
│   ├── typography.css     # Font styles
│   ├── components.css     # All components
│   └── utilities.css      # Helper classes
├── js/
│   ├── components/
│   │   ├── modal.js
│   │   ├── toast.js
│   │   └── dropdown.js
│   ├── api.js             # API client
│   └── app.js             # Shared utilities
├── admin/                 # Admin pages
├── portal/                # Member pages
└── index.html             # Public landing
```

### 7. Component Documentation

Create a `/styleguide` page that shows:
- All buttons (states: default, hover, disabled, loading)
- All form inputs (states: empty, filled, error, disabled)
- All cards
- All table variations
- Color palette
- Typography scale

This becomes your reference and ensures consistency.

### 8. Component States

Every component needs these states built from the start:

| Component | States |
|-----------|--------|
| **Button** | default → hover → active → disabled → loading |
| **Input** | empty → filled → focused → error → disabled |
| **Card** | default → loading (skeleton) → error |
| **Table** | loading → empty → data → error |
| **Modal** | closed → opening → open → closing |
| **Toast** | appearing → visible → dismissing |

**Loading states:** Use skeleton loaders (gray shapes), not spinners, for content areas. Spinners only for button actions.

### 9. Error Handling Patterns

| Error Type | UI Pattern | Example |
|------------|------------|---------|
| **Form validation** | Inline under field | "Email is required" |
| **Action failed** | Toast notification | "Save failed. Try again." |
| **Network error** | Toast + retry button | "Connection lost. [Retry]" |
| **Page load failed** | Full-page error | "Something went wrong. [Refresh]" |
| **Not found** | Full-page 404 | "This page doesn't exist" |
| **Unauthorized** | Redirect to login | — |

**Toast rules:**
- Success: Auto-dismiss after 3 seconds
- Error: Stays until dismissed (user needs to read it)
- Position: Top-right on desktop, top-center on mobile

### 10. Image & Storage (Bunny.net)

Using Bunny.net for file storage + CDN.

#### Upload Limits

| File Type | Max Size | Formats |
|-----------|----------|---------|
| Profile photos | 2 MB | JPG, PNG, WebP |
| Documents | 10 MB | PDF, DOC, DOCX |
| General uploads | 25 MB | Any |

#### Image Processing

```
Upload flow:
1. User uploads → Bunny Storage Zone
2. Serve via Bunny CDN: cdn.villagekeep.com/[org-id]/[file]
3. Resize on-the-fly with Bunny Optimizer (if enabled)
```

**Transformations:**
- Thumbnails: 150x150
- Profile: 300x300
- Full: max 1200px wide
- Auto WebP conversion

#### Storage Organization

```
/[org-id]/
├── profiles/       # Member photos
├── documents/      # PDFs, certificates
├── logos/          # Org branding
└── uploads/        # General files
```

### 11. Testing Strategy

#### What We Test

| Type | Tool | When |
|------|------|------|
| **Manual QA** | Checklist | Before every release |
| **Accessibility** | axe DevTools | During development |
| **Visual** | Screenshots | Major UI changes |
| **API** | Postman/curl | Endpoint changes |

#### Manual QA Checklist (Every Release)

- [ ] Login/logout works
- [ ] Can create/edit/delete members
- [ ] Payments process correctly (test mode)
- [ ] Emails send
- [ ] Mobile layout works
- [ ] Dark mode doesn't break
- [ ] Forms show validation errors
- [ ] Empty states display correctly

#### Accessibility Audit (Monthly)

- [ ] Run axe DevTools on all pages
- [ ] Keyboard-navigate entire app
- [ ] Check color contrast
- [ ] Test with screen reader

**No automated test suite initially** — manual QA is enough for MVP. Add unit tests when the codebase stabilizes.

---

## Product Roadmap

### Phase 1: Core API & Database

**Database Setup**
- [ ] Apps table (multi-tenant)
- [ ] Membership tiers table
- [ ] User memberships table
- [ ] Protected resources table (generic)
- [ ] Tier-resource assignments
- [ ] User resource access records

**Core API Endpoints**
- [ ] `POST /api/v1/apps` — Register an app
- [ ] `GET/POST/PUT/DELETE /api/v1/tiers` — Manage membership tiers
- [ ] `GET/POST /api/v1/resources` — Register protected resources
- [ ] `POST /api/v1/tiers/:id/resources` — Assign resources to tiers
- [ ] `POST /api/v1/users` — Register users
- [ ] `POST /api/v1/users/:id/subscribe` — Create subscription
- [ ] `GET /api/v1/access/check` — Check if user can access resource

**Authentication**
- [ ] API key generation and validation
- [ ] App authentication middleware

**Goal:** LMS can call VillageKeep API to check access and manage tiers.

---

### Phase 2: Stripe Connect & Member Portal

**Stripe Connect (Express)**
- [ ] Org onboarding to Stripe Connect
- [ ] Connected account verification flow
- [ ] Application fee collection on transactions
- [ ] Checkout session creation (on connected account)
- [ ] Webhook handling (payment success/failure)
- [ ] Subscription lifecycle (create, cancel, pause, resume)

**Tips System**
- [ ] Optional tip at checkout (NOT pre-selected)
- [ ] Tip goes to VillageKeep platform account
- [ ] Clear, honest messaging

**Member-Facing UI**
- [ ] Pricing page (embeddable)
- [ ] Checkout flow with Stripe Connect
- [ ] Account management (view subscription, update payment)
- [ ] Access dashboard (what resources I have)

**Goal:** End-to-end payment flow works. Orgs are merchant of record.

---

### Phase 3: CEU Tracking (Differentiator)

**Credit System**
- [ ] Credit types per org (CEU, contact hours, PDUs, etc.)
- [ ] Requirements by membership tier
- [ ] Manual credit entry (admin)
- [ ] Credit approval workflow
- [ ] Auto-credit via LMS webhook (course completion)

**Compliance**
- [ ] Member compliance dashboard
- [ ] Org-wide compliance reporting
- [ ] Expiration warnings
- [ ] Certificate generation

**Goal:** Professional associations can track CE requirements. This is the moat.

---

### Phase 4: Fundraising Module

**Donation Pages**
- [ ] One-time donation forms
- [ ] Recurring donation setup
- [ ] Custom donation amounts
- [ ] Suggested donation tiers
- [ ] Embeddable widgets

**Campaigns**
- [ ] Campaign creation with goals
- [ ] Progress tracking
- [ ] Campaign pages with branding
- [ ] Social sharing

**Peer-to-Peer (Future)**
- [ ] Supporter fundraising pages
- [ ] Team fundraising
- [ ] Leaderboards

**Donor Management**
- [ ] Donor profiles
- [ ] Giving history
- [ ] Tax receipts
- [ ] Thank you emails

**Goal:** Orgs can run fundraising campaigns alongside membership.

---

### Phase 5: Webhooks & Integration

**Event System**
- [ ] Webhook registration per app
- [ ] Event types: subscription.*, access.*, payment.*, donation.*
- [ ] Delivery with retries
- [ ] Webhook logs

**LMS Integration**
- [ ] LMS receives webhooks on access changes
- [ ] LMS auto-registers courses as protected resources
- [ ] Single sign-on (shared session or JWT)

**Goal:** LMS and VillageKeep work seamlessly together.

---

### Phase 6: Admin & Analytics

**Admin Dashboard**
- [ ] Member management (search, filter, edit)
- [ ] Donor management
- [ ] Tier management UI
- [ ] Resource assignment UI
- [ ] Manual access grants/revokes

**Reporting**
- [ ] Membership growth/churn
- [ ] Payment volume & revenue
- [ ] Fundraising totals & campaigns
- [ ] CEU compliance rates
- [ ] Tier distribution

**Goal:** Org admins have full visibility and control.

---

### Phase 7: Premium Integrations

**Zoom Live Giving**
- [ ] Zoom App marketplace submission
- [ ] Sidebar widget for meetings
- [ ] One-click donations (Stripe Link)
- [ ] Live donation ticker
- [ ] Host controls
- [ ] QR code overlay option
- [ ] +1% processing for Zoom transactions

**Future Integrations**
- [ ] Slack notifications
- [ ] Salesforce sync
- [ ] Mailchimp/email marketing
- [ ] Zapier connector

**Goal:** Premium integrations that justify extra fees.

---

### Phase 8: Scale & Growth

**Multi-Org Platform**
- [ ] Self-service org signup
- [ ] Stripe Connect onboarding flow
- [ ] Org settings & customization
- [ ] White-label options (premium)

**Advanced Features**
- [ ] Teams/group memberships
- [ ] Drip content (unlock over time)
- [ ] Usage limits per tier
- [ ] Public member directory
- [ ] Events with registration & ticketing

---

## Go-to-Market Strategy

### Phase 1: Dogfooding (Now)

- Build for AALB (membership + fundraising + CEU)
- Use daily, find pain points
- Get it production-ready

### Phase 2: Interpreter Market

- Target medical/legal interpreter associations
- AALB network and referrals
- Content marketing: "CEU tracking for interpreters"
- 10-20 organizations

### Phase 3: Professional Associations

- Expand to other CEU-required professions
- Healthcare, legal, education
- SEO: "membership software for [profession]"
- Partnerships with certification bodies
- 100+ organizations

### Phase 4: Broader Nonprofits + Fundraising

- Market fundraising features to nonprofits
- Position as "Givebutter alternative with membership"
- Target orgs frustrated by Givebutter's 501(c)(3) requirement
- 500+ organizations

### Phase 5: Trade Associations + Clubs

- Expand beyond nonprofits
- Trade groups, chambers, hobbyist clubs
- Position as "membership software for everyone"
- 1000+ organizations

---

## Financial Projections

Revenue from subscriptions + usage overage + tips.

### Revenue Model Assumptions

| Source | Rate | Notes |
|--------|------|-------|
| Pro subscriptions | $49/mo | ~10% of orgs convert (industry avg 2-5%) |
| Enterprise subscriptions | $149/mo | ~3% of orgs convert |
| Tips/Platform fee | Variable | Free tier only |
| SMS overage | $0.02/SMS | Above included |
| Email overage | $0.001/email | Above included |
| Storage overage | $0.25-0.50/GB | Above included |

### Year 1 (Building + Early Orgs)

| Quarter | Total Orgs | Free | Pro (10%) | Ent (3%) | MRR |
|---------|------------|------|-----------|----------|-----|
| Q1 | 1 | 1 | 0 | 0 | $0 |
| Q2 | 15 | 13 | 2 | 0 | $98 |
| Q3 | 30 | 26 | 3 | 1 | $296 |
| Q4 | 50 | 43 | 5 | 2 | $543 |

**Year 1 Total:** ~$3,500

### Year 2 (Growth)

| Quarter | Total Orgs | Free | Pro (10%) | Ent (3%) | MRR |
|---------|------------|------|-----------|----------|-----|
| Q1 | 100 | 87 | 10 | 3 | $937 |
| Q2 | 175 | 152 | 18 | 5 | $1,627 |
| Q3 | 275 | 239 | 28 | 8 | $2,564 |
| Q4 | 400 | 348 | 40 | 12 | $3,748 |

**Year 2 Total:** ~$35,000

### Year 3 (Scale)

- 1,000+ organizations
- 100 Pro ($4,900/mo) + 30 Enterprise ($4,470/mo) = **~$9,400/mo MRR**
- Plus usage overage (SMS, email, storage) ~$1,000/mo
- **~$10,000 MRR / $120K ARR**

### Operating Costs

| Item | Monthly | Notes |
|------|---------|-------|
| Hosting (Render) | $50-200 | Scales with usage |
| Database (Render) | $20-100 | PostgreSQL |
| Email (Resend) | $20-50 | Transactional + marketing |
| Domain/SSL | $2 | villagekeep.com |
| **Total** | **~$100-400** | Extremely lean |

**Key insight:** Costs stay flat at ~$100-400/mo regardless of volume. Once past break-even (~$500/mo revenue), margins are 90%+.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low conversion to paid | High | Free tier is genuinely valuable; white-label drives Pro upgrades |
| Wild Apricot improves | Medium | Move fast, lock in CEU niche |
| Givebutter adds membership | Medium | Already ahead on CEU; serve non-501(c)(3)s |
| Slow org acquisition | High | AALB network, content marketing, low CAC |
| Technical complexity | Medium | Leverage LMS codebase, proven patterns |
| Churn | Medium | CEU is sticky; subscriptions create recurring need |
| Stripe changes pricing | Low | Volume unlocks better rates over time |
| SMS/email costs spike | Low | Usage-based pricing covers costs with margin |

---

## Legal & Compliance

### Required Documents
- **Privacy Policy** — How we handle org and member data
- **Terms of Service** — Usage rules, liability limits, refund policy
- **DPA (Data Processing Agreement)** — Required for EU customers (GDPR)
- **Cookie Policy** — For web tracking consent

### GDPR Requirements
- Data export on request (already in product as CSV/PDF)
- Right to deletion (must implement)
- Cookie consent banner
- Clear data retention policies

### Terms Highlights
- **Refunds:** No refunds on subscriptions (standard SaaS)
- **Data ownership:** Orgs own their data, we're a processor
- **Acceptable use:** No illegal activity, spam, or abuse
- **Termination:** We can terminate for ToS violations

### Tax Handling
- **Stripe Tax** handles VAT/sales tax on subscriptions
- Donations/membership fees: Org's responsibility (they're merchant of record)

---

## Operations & Reliability

### Monitoring (Set Up Day 1)

| Tool | Purpose | Cost |
|------|---------|------|
| **UptimeRobot** | Ping site every 5 min, alert if down | Free |
| **Sentry** | Error tracking, crash alerts | Free tier |
| **Render Dashboard** | Server metrics, logs | Included |

**Alerts go to:** Email + SMS (for critical)

### Health Checks

Build these endpoints from the start:
```
GET /health         → 200 OK (app running)
GET /health/db      → 200 OK (database connected)
GET /health/stripe  → 200 OK (Stripe API reachable)
```

UptimeRobot pings `/health` every 5 minutes.

### Status Page

Set up `status.villagekeep.com` (Better Uptime free tier):
- Shows current status
- Post updates during incidents
- Builds trust with orgs

### What Render Handles

| Feature | Benefit |
|---------|---------|
| Auto-restart | If app crashes, it restarts automatically |
| Daily backups | Database backed up, 7-day retention |
| Zero-downtime deploys | Updates don't cause outages |
| SSL certificates | HTTPS handled automatically |

### Support Model (No Time Guarantees)

| Tier | Support Level |
|------|---------------|
| **Free** | Email + help docs (best effort) |
| **Pro** | Priority email (answered before Free) |
| **Enterprise** | Dedicated contact + SLA |

**Only Enterprise gets time guarantees** — they pay for it.

### Reduce Support Load

1. **Help docs** — Answer common questions before they're asked
2. **In-app tooltips** — Explain features inline
3. **Onboarding flow** — Reduce confusion upfront
4. **Status page** — Orgs check status before emailing

---

## Success Metrics

### Product Metrics
- Monthly Active Orgs
- Members managed (total across all orgs)
- Total payment volume processed
- CEU credits tracked
- Donations/fundraising volume

### Business Metrics
- **MRR** (subscriptions + usage overage)
- Payment volume (leading indicator)
- Org count (Free / Pro / Enterprise)
- Paid conversion rate (target: 10% Pro, 3% Enterprise)
- Org churn rate (target: <5% monthly)

### Milestones

| Milestone | Target |
|-----------|--------|
| AALB live | Month 2 |
| 10 organizations | Month 6 |
| $100K monthly volume | Month 8 |
| 50 organizations | Month 12 |
| $1M monthly volume | Month 18 |
| 200 organizations | Month 24 |
| Zoom integration live | Month 15 |

---

## Team

**Current:** Solo founder + Claude (AI development)

**Future hires (when revenue supports):**
1. Part-time support / customer success
2. Marketing / content
3. Second developer

---

## Funding

**Not seeking funding currently.**

Building bootstrapped, revenue-funded. AALB provides:
- First customer (dogfooding)
- Real-world requirements
- Network for referrals
- Proof of concept

---

## Summary

**VillageKeep = Wild Apricot + Givebutter combined, with honest pricing**

| | |
|---|---|
| **Product** | Membership + Fundraising + CEU in one platform |
| **Moat** | CEU tracking + LMS integration + serves all org types |
| **Wedge** | Interpreter associations (AALB network) |
| **Model** | Freemium (Free/Pro $49/Enterprise $149) + usage overage |
| **Payments** | Free (just Stripe 2.9% + $0.30) — orgs are merchant of record |
| **Premium** | Zoom Live Giving (+1% fee, Enterprise only) |
| **Structure** | For-profit LLC |
| **Goal** | $10K MRR / $120K ARR in 3 years, bootstrapped |

---

## Immediate Next Steps

1. **Scaffold project** — Express app, PostgreSQL connection, folder structure
2. **Create database schema** — Tables from architecture docs
3. **Build `/api/v1/access/check`** — Most critical endpoint
4. **Set up Stripe Connect** — Platform account, Express account creation flow
5. **Test with AALB** — Membership + basic donation flow working

---

## Files to Reference

**In this repo:**
- `DESIGN_PLAN.md` — UI/UX specs, brand colors, component library, page layouts

**Architecture docs in the LMS repo:**

- `/home/user/learn/MEMBERSHIP_STANDALONE_ARCHITECTURE.md` — Full API design
- `/home/user/learn/MEMBERSHIP_SYSTEM_DESIGN.md` — System design
- `/home/user/learn/MEMBERSHIP_SYSTEM_SPECIFICATION.md` — Detailed spec
- `/home/user/learn/db/queries-membership.js` — Existing membership queries in LMS

---

*Document created: December 2024*
*For questions: [contact info]*
