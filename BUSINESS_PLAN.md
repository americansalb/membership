# VillageKeep Business Plan

## Executive Summary

VillageKeep is a membership management platform for nonprofits and professional associations. We differentiate through native CEU/continuing education tracking, modern UX, and tight LMS integration.

**Primary customer:** Americans Against Language Barriers (dogfooding)
**Target market:** Nonprofits, professional associations, trade organizations
**Competitor:** Wild Apricot (~$60M ARR, 30k+ customers, dated product)

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

All-in-one membership platform with:

| Feature | Description |
|---------|-------------|
| Member Management | Database, profiles, custom fields, lifecycle tracking |
| Billing | Stripe-powered subscriptions, invoices, member portal |
| CEU Tracking | Credit types, requirements, auto-grant from LMS, compliance reports |
| Access Control | Gate content/resources by membership tier |
| LMS Integration | Native connection to your learning platform |
| Modern UX | Clean design, dark mode, mobile-first |
| API-First | Integrate with anything |

---

## Target Market

### Primary: Professional Associations with CEU Requirements

- Medical interpreters (AALB's market)
- Healthcare professionals (nurses, therapists, etc.)
- Legal professionals (paralegals, court reporters)
- Real estate agents
- Financial advisors
- Teachers

**Why:** CEU tracking is painful, required, and underserved

### Secondary: General Nonprofits

- Member-based organizations
- Trade associations
- Alumni associations
- Clubs and societies

### Market Size

| Segment | US Count | Avg Members | Potential |
|---------|----------|-------------|-----------|
| Professional associations | ~7,500 | 5,000 | High |
| Trade associations | ~15,000 | 1,000 | Medium |
| Other nonprofits | ~1.5M | 500 | Low priority |

Wild Apricot has 30,000+ customers at ~$2,000/year avg = ~$60M ARR
Even 1% market share = $600K ARR

---

## Competitive Analysis

### Wild Apricot (Main Competitor)

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

### Our Positioning

```
                    Modern UX
                        │
                        │    VillageKeep
                        │    ★
                        │
 Basic CEU ────────────┼──────────── Strong CEU
                        │
            Wild Apricot│
                   ★    │
                        │
                    Dated UX
```

**We win on:** CEU-first, modern UX, LMS integration, API quality, pricing

---

## Pricing Strategy

### Model: Tiered by Members (not contacts)

| Tier | Members | Price/mo | Price/yr | Savings |
|------|---------|----------|----------|---------|
| Starter | Up to 100 | $29 | $290 | 17% |
| Growth | Up to 500 | $79 | $790 | 17% |
| Professional | Up to 2,000 | $149 | $1,490 | 17% |
| Enterprise | Unlimited | $299 | $2,990 | 17% |

### vs Wild Apricot

| Members | Wild Apricot | VillageKeep | Savings |
|---------|--------------|-------------|---------|
| 100 | $60/mo | $29/mo | 52% |
| 500 | $100/mo | $79/mo | 21% |
| 2,000 | $240/mo | $149/mo | 38% |
| 5,000 | $420/mo | $299/mo | 29% |

**Strategy:** Undercut on price, win on features (CEU), keep them on modern UX

### Revenue Model

1. **Subscription revenue** - Monthly/annual SaaS fees
2. **Payment processing** - Pass through Stripe fees + small margin (optional)
3. **Add-ons** (future) - White-label, extra storage, premium support

---

## Go-to-Market Strategy

### Phase 1: Dogfooding (Now)

- Build for AALB
- Use daily, find pain points
- Get it production-ready

### Phase 2: Interpreter Market (3-6 months)

- Target medical/legal interpreter associations
- AALB network and referrals
- Content marketing: "CEU tracking for interpreters"
- 10-20 customers

### Phase 3: Adjacent Professions (6-12 months)

- Expand to other CEU-required professions
- Healthcare, legal, education
- SEO: "membership software for [profession]"
- Partnerships with certification bodies
- 100+ customers

### Phase 4: General Market (12+ months)

- Compete directly with Wild Apricot
- Full feature parity + better UX
- Aggressive content marketing
- 500+ customers

---

## Financial Projections

### Year 1 (Building + Early Customers)

| Quarter | Customers | MRR | Notes |
|---------|-----------|-----|-------|
| Q1 | 1 | $0 | AALB (free) |
| Q2 | 5 | $200 | Beta customers |
| Q3 | 15 | $800 | Interpreter market |
| Q4 | 30 | $2,000 | Word of mouth |

**Year 1 ARR:** ~$24,000

### Year 2 (Growth)

| Quarter | Customers | MRR |
|---------|-----------|-----|
| Q1 | 50 | $4,000 |
| Q2 | 80 | $7,000 |
| Q3 | 120 | $11,000 |
| Q4 | 175 | $16,000 |

**Year 2 ARR:** ~$192,000

### Year 3 (Scale)

- 500+ customers
- $50,000+ MRR
- $600,000+ ARR

### Costs

| Item | Monthly | Notes |
|------|---------|-------|
| Hosting (Render) | $50-200 | Scales with usage |
| Database (Render) | $20-100 | PostgreSQL |
| Email (Resend) | $20-50 | Transactional + marketing |
| Stripe fees | 2.9% + 30¢ | Pass to customer |
| Domain/SSL | $2 | villagekeep.com |
| **Total** | ~$100-400 | Before revenue share |

**Margins:** 80%+ at scale (SaaS typical)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Wild Apricot improves | Medium | Move fast, lock in CEU niche |
| Slow customer acquisition | High | AALB network, content marketing, low CAC |
| Technical complexity | Medium | Leverage LMS codebase, proven patterns |
| Churn | High | Focus on CEU sticky feature, great support |
| Competitor copies CEU | Medium | LMS integration moat, execution speed |

---

## Success Metrics

### Product Metrics
- Monthly Active Orgs
- Members managed (total across all orgs)
- CEU credits tracked
- API calls (integration health)

### Business Metrics
- MRR / ARR
- Customer count
- Churn rate (target: <5% monthly)
- Net Revenue Retention (target: >100%)
- CAC / LTV ratio

### Milestones

| Milestone | Target |
|-----------|--------|
| AALB live | Month 2 |
| 10 paying customers | Month 6 |
| $1K MRR | Month 8 |
| 50 customers | Month 12 |
| $10K MRR | Month 18 |
| 200 customers | Month 24 |

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

VillageKeep = Wild Apricot killer for professional associations

**Moat:** CEU tracking + LMS integration
**Wedge:** Interpreter associations (AALB network)
**Model:** SaaS subscriptions, undercut incumbent
**Goal:** $50K MRR in 3 years, bootstrapped
