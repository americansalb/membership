# VillageKeep Business Plan

## Executive Summary

VillageKeep is an all-in-one platform for membership management and fundraising. We combine what Wild Apricot does for memberships with what Givebutter does for fundraising—but in a single, modern product with honest pricing.

**Revenue model:** Free platform + optional tips (user-controlled, no guilt) + payment processing pass-through
**Primary customer:** Americans Against Language Barriers (dogfooding)
**Target market:** Nonprofits, professional associations, trade organizations, clubs
**Competitors:** Wild Apricot (membership), Givebutter/Zeffy (fundraising)
**Corporate structure:** For-profit LLC

---

## Problem

Nonprofits and professional associations struggle with:

1. **Fragmented tools** - Spreadsheets for members, separate billing, manual CEU tracking
2. **Dated software** - Wild Apricot, MemberClicks look like 2010
3. **No CEU integration** - Manual tracking of continuing education credits
4. **Expensive at scale** - Pricing punishes growth (per-member fees)
5. **Poor API** - Can't integrate with modern tools

**For AALB specifically:**
- Need to track interpreter CEUs for certification maintenance
- Want LMS courses to auto-grant credits
- Need compliance reporting for credentialing bodies

---

## Solution

All-in-one platform with modular features:

| Module | Features |
|--------|----------|
| **Membership** | Member database, profiles, custom fields, lifecycle tracking, tiers |
| **Fundraising** | Donation pages, campaigns, peer-to-peer, recurring giving |
| **Billing** | Stripe-powered subscriptions, invoices, member portal |
| **CEU Tracking** | Credit types, requirements, auto-grant from LMS, compliance reports |
| **Events** | Registration, ticketing, check-in (future) |
| **Access Control** | Gate content/resources by membership tier |
| **LMS Integration** | Native connection to your learning platform |
| **Modern UX** | Clean design, dark mode, mobile-first |
| **API-First** | Integrate with anything |

**Key differentiator:** One product handles both membership AND fundraising. Competitors force you to use separate tools.

---

## Target Market

### Primary: Organizations with Members (Not Just 501(c)(3)s)

Unlike Givebutter (nonprofits only), VillageKeep serves anyone with members:

**Professional Associations (CEU requirements)**
- Medical interpreters (AALB's market)
- Healthcare professionals (nurses, therapists)
- Legal professionals (paralegals, court reporters)
- Real estate agents, financial advisors, teachers

**Trade Associations**
- Industry groups, chambers of commerce
- Professional networks

**Member-Based Nonprofits**
- Charities with donor/member programs
- Alumni associations
- Religious organizations

**Clubs & Societies**
- Hobbyist groups, sports clubs
- Alumni groups, social organizations

### Why This Market

1. **CEU tracking** is painful, required, and underserved
2. **Fundraising + membership** is usually two separate tools
3. **Trade associations** are ignored by Givebutter's nonprofit-only model

### Market Size

| Segment | US Count | Avg Members | Potential |
|---------|----------|-------------|-----------|
| Professional associations | ~7,500 | 5,000 | High |
| Trade associations | ~15,000 | 1,000 | High |
| Nonprofits with members | ~500K | 500 | Medium |
| Clubs & societies | ~100K | 200 | Medium |

**Competitor benchmarks:**
- Wild Apricot: 30,000+ customers, ~$60M ARR
- Givebutter: 100,000+ nonprofits, venture-backed
- Even 1% of Wild Apricot's market = $600K ARR

---

## Competitive Analysis

### Wild Apricot (Membership)

**Strengths:**
- Established brand (since 2006)
- Full feature set
- Integrations ecosystem
- Website builder included

**Weaknesses:**
- Dated UI/UX (looks like 2010)
- Weak CEU tracking (bolt-on)
- Per-contact pricing (expensive at scale)
- Poor mobile experience
- Slow, clunky interface
- Weak API
- No fundraising features

### Givebutter (Fundraising)

**Strengths:**
- Modern, beautiful UI
- Free platform (tips model)
- Strong fundraising features
- Good social/peer-to-peer tools

**Weaknesses:**
- 501(c)(3) nonprofits only
- No membership management
- Pre-selected 15% tip (feels manipulative)
- No CEU tracking
- Limited member lifecycle features

### Zeffy (Fundraising)

**Strengths:**
- 100% free, no platform fees
- Tips only (optional)
- Growing rapidly

**Weaknesses:**
- Very limited features
- No membership management
- Nonprofits only
- No CEU tracking

### Our Positioning

```
                    Modern UX
                        │
          Givebutter    │    VillageKeep
              ★         │    ★
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
- **vs Givebutter:** Membership features, serves all orgs (not just 501(c)(3)s), honest tips (no pre-select)
- **vs Zeffy:** Full feature set, CEU tracking, membership management

---

## Pricing Strategy

### Model: Free + Tips + Processing

**Platform:** 100% free to use. All features, unlimited members.

**Tips (Optional):**
- Donors/members can optionally add a tip at checkout
- NOT pre-selected (unlike Givebutter's 15% default)
- Clear, honest messaging: "Help keep VillageKeep free"
- No guilt, no manipulation

**Payment Processing:**
- Pass through Stripe fees: 2.9% + $0.30 per transaction
- Organization is merchant of record (via Stripe Connect Express)
- VillageKeep earns application fee on transactions

### Why This Works

| Competitor | Platform Fee | Processing | Tips |
|------------|--------------|------------|------|
| Wild Apricot | $60-420/mo | 2.9% + $0.30 | No |
| Givebutter | Free | 2.9% + $0.30 | 15% pre-selected |
| Zeffy | Free | Tips only | Optional |
| **VillageKeep** | **Free** | **2.9% + $0.30** | **Optional (honest)** |

**Our advantage:**
- Free like Givebutter, but more honest about tips
- Full features like Wild Apricot, but no monthly fee
- Serves everyone (not just 501(c)(3)s)

### Payment Architecture: Stripe Connect (Express)

- Each organization has their own Stripe account (Express)
- VillageKeep never holds funds—they're merchant of record
- We collect application fee per transaction
- Organizations handle their own disputes/refunds
- Enables instant payouts to orgs

### Revenue Streams

1. **Application fees** - Small % of each transaction via Stripe Connect
2. **Tips** - Optional donor/member contributions to VillageKeep
3. **Premium features** (future) - White-label, priority support, advanced analytics

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

Revenue comes from tips + application fees on payment processing.

### Revenue Model Assumptions

| Source | Rate | Notes |
|--------|------|-------|
| Tips | ~5% of transactions | Conservative (Givebutter sees higher with pre-select) |
| App fees | 0.5-1% of volume | Via Stripe Connect |

### Year 1 (Building + Early Orgs)

| Quarter | Orgs | Monthly Volume | Monthly Revenue |
|---------|------|----------------|-----------------|
| Q1 | 1 | $5,000 | $0 (AALB free) |
| Q2 | 10 | $25,000 | $500 |
| Q3 | 25 | $75,000 | $1,500 |
| Q4 | 50 | $150,000 | $3,000 |

**Year 1:** ~$20,000 revenue

### Year 2 (Growth)

| Quarter | Orgs | Monthly Volume | Monthly Revenue |
|---------|------|----------------|-----------------|
| Q1 | 100 | $400,000 | $8,000 |
| Q2 | 175 | $700,000 | $14,000 |
| Q3 | 275 | $1,100,000 | $22,000 |
| Q4 | 400 | $1,600,000 | $32,000 |

**Year 2:** ~$300,000 revenue

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
| **Total** | ~$100-400 | Extremely lean |

**Key insight:** Costs stay flat at ~$100-400/mo regardless of volume. Once past break-even, margins are 90%+.

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
- Monthly revenue (tips + app fees)
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

---

## Team

**Current:** Solo founder + Claude (AI dev)

**Future hires (when funded/profitable):**
1. Part-time support / onboarding
2. Marketing / content
3. Second developer

---

## Ask

**Not seeking funding currently.**

Building bootstrapped, revenue-funded. AALB provides:
- First customer (free)
- Real-world requirements
- Network for referrals
- Proof of concept

---

## Summary

VillageKeep = Wild Apricot + Givebutter combined, with honest pricing

**Product:** Membership + Fundraising + CEU in one platform
**Moat:** CEU tracking + LMS integration + serves all org types
**Wedge:** Interpreter associations (AALB network)
**Model:** Free platform + optional tips + payment processing fees
**Payments:** Stripe Connect (Express) - orgs are merchant of record
**Structure:** For-profit LLC
**Goal:** $100K+ monthly revenue in 3 years, bootstrapped
