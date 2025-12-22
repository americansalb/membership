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

### Pricing: Free + Tips + Processing

**Platform:** 100% free to use. All features, unlimited members.

**Tips (Optional):**
- Donors/members can optionally add a tip at checkout
- NOT pre-selected (unlike Givebutter's 15% default)
- Clear, honest messaging: *"Help keep VillageKeep free"*
- No guilt, no manipulation

**Payment Processing:**
- Pass through Stripe fees: 2.9% + $0.30 per transaction
- Organization is merchant of record (via Stripe Connect Express)
- VillageKeep earns application fee on transactions

### Competitive Pricing Comparison

| Platform | Platform Fee | Processing | Tips |
|----------|--------------|------------|------|
| Wild Apricot | $60-420/mo | 2.9% + $0.30 | No |
| Givebutter | Free | 2.9% + $0.30 | 15% pre-selected |
| Zeffy | Free | Tips only | Optional |
| **VillageKeep** | **Free** | **2.9% + $0.30** | **Optional (honest)** |

### Premium Integrations (Extra Revenue)

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

1. **Application fees** — Small % of each transaction via Stripe Connect
2. **Tips** — Optional donor/member contributions to VillageKeep
3. **Premium integrations** — Zoom (+1%), future integrations
4. **Premium features** (future) — White-label, priority support, advanced analytics

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
| File Storage | Cloudinary (if needed) |
| Hosting | Render |

**Why this stack:**
- Already built and proven in the LMS
- Simple, maintainable, no framework churn
- PostgreSQL is rock-solid for multi-tenant SaaS
- Render is affordable and scales well

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

Revenue comes from tips + application fees + premium integration fees.

### Revenue Model Assumptions

| Source | Rate | Notes |
|--------|------|-------|
| Tips | ~5% of transactions | Conservative (Givebutter sees higher with pre-select) |
| App fees | 0.5-1% of volume | Via Stripe Connect |
| Zoom premium | +1% on Zoom transactions | Premium integration |

### Year 1 (Building + Early Orgs)

| Quarter | Orgs | Monthly Volume | Monthly Revenue |
|---------|------|----------------|-----------------|
| Q1 | 1 | $5,000 | $0 (AALB free) |
| Q2 | 10 | $25,000 | $500 |
| Q3 | 25 | $75,000 | $1,500 |
| Q4 | 50 | $150,000 | $3,000 |

**Year 1 Total:** ~$20,000

### Year 2 (Growth)

| Quarter | Orgs | Monthly Volume | Monthly Revenue |
|---------|------|----------------|-----------------|
| Q1 | 100 | $400,000 | $8,000 |
| Q2 | 175 | $700,000 | $14,000 |
| Q3 | 275 | $1,100,000 | $22,000 |
| Q4 | 400 | $1,600,000 | $32,000 |

**Year 2 Total:** ~$300,000

### Year 3 (Scale)

- 1,000+ organizations
- $5M+ monthly volume
- $100K+ monthly revenue
- $1.2M+ annual revenue

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
| Low tip rate | High | Don't rely on tips alone; app fees provide baseline |
| Wild Apricot improves | Medium | Move fast, lock in CEU niche |
| Givebutter adds membership | Medium | Already ahead on CEU; serve non-501(c)(3)s |
| Slow org acquisition | High | AALB network, content marketing, low CAC |
| Technical complexity | Medium | Leverage LMS codebase, proven patterns |
| Churn | Medium | CEU is sticky; fundraising creates recurring need |
| Stripe changes pricing | Low | Volume unlocks better rates over time |

---

## Success Metrics

### Product Metrics
- Monthly Active Orgs
- Members managed (total across all orgs)
- Total payment volume processed
- CEU credits tracked
- Donations/fundraising volume

### Business Metrics
- Monthly revenue (tips + app fees + premium)
- Payment volume (leading indicator)
- Org count
- Tip rate (% of transactions with tips)
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
| **Model** | Free platform + optional tips + processing fees + premium integrations |
| **Payments** | Stripe Connect (Express) — orgs are merchant of record |
| **Premium** | Zoom Live Giving (+1% fee) |
| **Structure** | For-profit LLC |
| **Goal** | $100K+ monthly revenue in 3 years, bootstrapped |

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
