# VillageKeep Pricing & Tier Specification

**Version:** 1.0
**Date:** December 2024
**Status:** Ready for Development

---

## Executive Summary

VillageKeep uses a **freemium + usage-based hybrid model**:

1. **Free tier** = Full-featured membership platform with pay-per-use email/SMS
2. **Paid tiers** = Volume discounts on email/SMS + advanced CRM features
3. **Transaction revenue** = Optional donor tips (less aggressive than Givebutter)

**Key differentiators:**
- Unlimited members on ALL tiers (unlike Wild Apricot)
- Works for all org types, not just 501(c)(3)s (unlike Givebutter)
- Integrated email/SMS tied to member data (unlike Mailchimp + separate CRM)

---

## Tier Structure

### Pricing

| Tier | Monthly | Annual (2 mo free) | Annual Effective |
|------|---------|-------------------|------------------|
| **Free** | $0 | $0 | $0 |
| **Starter** | $29 | $290 | $24.17/mo |
| **Pro** | $89 | $890 | $74.17/mo |
| **Enterprise** | $179 | $1,790 | $149.17/mo |

### Trial Period
- **7 days** free trial for all paid tiers
- No credit card required to start trial
- Full feature access during trial

---

## Feature Matrix

### Core Platform Features

| Feature | Free | Starter ($29) | Pro ($89) | Enterprise ($179) |
|---------|------|---------------|-----------|-------------------|
| **Members** | Unlimited | Unlimited | Unlimited | Unlimited |
| **Member tiers** | Unlimited | Unlimited | Unlimited | Unlimited |
| **Payments via Stripe** | Yes | Yes | Yes | Yes |
| **Payment history** | Full | Full | Full | Full |
| **Transaction data** | Full | Full | Full | Full |
| **Receipts & invoices** | Yes | Yes | Yes | Yes |
| **Refund capability** | Yes | Yes | Yes | Yes |
| **Export transactions** | CSV | CSV | CSV + API | CSV + API |
| **Automations/Workflows** | Yes | Yes | Yes | Yes |

> **IMPORTANT:** All tiers have full access to payment/transaction data. We are a payment processor—orgs must always see their financial data regardless of tier.

### Fundraising Features

| Feature | Free | Starter ($29) | Pro ($89) | Enterprise ($179) |
|---------|------|---------------|-----------|-------------------|
| **Donation pages** | Full | Full | Full | Full |
| **Campaigns with goals** | Yes | Yes | Yes | Yes |
| **Thermometers/progress** | Yes | Yes | Yes | Yes |
| **Peer-to-peer fundraising** | Yes | Yes | Yes | Yes |
| **Embeddable widget** | Yes | Yes | Yes | Yes |
| **Customization** | Full | Full | Full | Full |
| **Branding on donation pages** | VillageKeep footer | Clean | Clean | White-label |

> **IMPORTANT:** Full fundraising features on ALL tiers. We do not limit their ability to raise money. We profit from tips and want them to succeed.

### Contact & CRM Features

| Feature | Free | Starter ($29) | Pro ($89) | Enterprise ($179) |
|---------|------|---------------|-----------|-------------------|
| **Contact records** | Yes | Yes | Yes | Yes |
| **Basic fields** (name, email, phone, address) | Yes | Yes | Yes | Yes |
| **Membership status** | Active/Expired only | Active/Expired | Full lifecycle | Full lifecycle |
| **Activity timeline** | Last payment only | Full history | Full history | Full history |
| **Tags** | No | Yes | Yes | Yes |
| **Basic search/filters** | Yes | Yes | Yes | Yes |
| **Advanced filters** | No | Yes | Yes | Yes |
| **Saved segments/views** | No | No | Yes | Yes |
| **Custom fields** | No | No | Yes | Yes |
| **Engagement scoring** | No | No | Yes | Yes |
| **Lifecycle stages** | No | No | Yes | Yes |
| **Notes & tasks** | No | No | Yes | Yes |

**Lifecycle stages (Pro/Enterprise):**
- Prospect
- Applied
- Active
- Lapsed
- Churned

### Communication Features

| Feature | Free | Starter ($29) | Pro ($89) | Enterprise ($179) |
|---------|------|---------------|-----------|-------------------|
| **Email sending** | Pay-per-use | Included + overage | Included + overage | Included + overage |
| **SMS sending** | Pay-per-use | Included + overage | Included + overage | Included + overage |
| **Email templates** | Yes | Yes | Yes | Yes |
| **Merge fields** | Yes | Yes | Yes | Yes |
| **Scheduled sends** | Yes | Yes | Yes | Yes |
| **Send from domain** | @villagekeep.com | @villagekeep.com | Custom domain | Custom domain |
| **SMS from number** | Shared VK number | Shared VK number | Dedicated number | Dedicated number |

### Platform & Branding

| Feature | Free | Starter ($29) | Pro ($89) | Enterprise ($179) |
|---------|------|---------------|-----------|-------------------|
| **Member portal** | Yes | Yes | Yes | Yes |
| **Portal URL** | /p/orgname | /p/orgname | orgname.villagekeep.com | Custom domain |
| **Member directory** | No | No | Yes | Yes |
| **Certificates** | No | No | Yes | Yes |
| **Branding** | "Powered by VillageKeep" footer | Clean (no watermark) | Clean | Full white-label |
| **Storage** | 0 | 1 GB | 10 GB | 100 GB |
| **Team seats** | 1 (owner) | 2 | 6 | Unlimited |

### Analytics & Reporting

| Feature | Free | Starter ($29) | Pro ($89) | Enterprise ($179) |
|---------|------|---------------|-----------|-------------------|
| **Member counts** | Yes | Yes | Yes | Yes |
| **Revenue totals** | Yes | Yes | Yes | Yes |
| **Basic charts** | No | Yes | Yes | Yes |
| **Growth dashboards** | No | No | Yes | Yes |
| **Engagement reports** | No | No | Yes | Yes |
| **Custom reports** | No | No | No | Yes |
| **Data export** | CSV | CSV | CSV + API | CSV + API + webhooks |

### Support & Integrations

| Feature | Free | Starter ($29) | Pro ($89) | Enterprise ($179) |
|---------|------|---------------|-----------|-------------------|
| **Support** | Docs only | Email (48hr) | Priority email (24hr) | Dedicated rep |
| **Stripe** | Yes | Yes | Yes | Yes |
| **Zapier** | No | Yes | Yes | Yes |
| **Mailchimp** | No | No | Yes | Yes |
| **Salesforce** | No | No | No | Yes |
| **Zoom** | No | No | No | Yes |
| **SSO/SAML** | No | No | No | Yes |
| **SLA guarantee** | No | No | No | 99.9% |
| **API access** | No | No | Yes | Yes |
| **Webhooks** | No | No | No | Yes |

---

## Email & SMS Pricing

### Email Pricing

| Tier | Included/Month | Overage per 1,000 | Our Cost per 1,000 | Margin |
|------|----------------|-------------------|-------------------|--------|
| **Free** | 0 | $5.00 | $0.10 | 4900% |
| **Starter** | 2,000 | $3.00 | $0.10 | 2900% |
| **Pro** | 10,000 | $1.50 | $0.10 | 1400% |
| **Enterprise** | 50,000 | $0.75 | $0.10 | 650% |

### SMS Pricing

| Tier | Included/Month | Overage per 100 | Our Cost per 100 | Margin |
|------|----------------|-----------------|------------------|--------|
| **Free** | 0 | $4.00 | $1.00 | 300% |
| **Starter** | 50 | $2.50 | $1.00 | 150% |
| **Pro** | 200 | $1.50 | $1.00 | 50% |
| **Enterprise** | 1,000 | $1.00 | $1.00 | 0% |

> **Note:** Enterprise SMS is at-cost. The value is in the subscription, not SMS margin.

### Competitive Positioning

| Platform | Email per 1,000 | Notes |
|----------|-----------------|-------|
| Mailchimp | $2.60-4.00 | Plus $13-20/mo subscription |
| Brevo | $1.25 | Plus $25/mo subscription |
| **VillageKeep Free** | $5.00 | No subscription required |
| **VillageKeep Pro** | $1.50 | With $89/mo subscription |

**Our advantage:** Integrated with member data. No sync required. Automations tied to membership events.

---

## Email Domain Configuration

| Tier | Sends From | DNS Setup Required |
|------|------------|-------------------|
| **Free** | notifications@villagekeep.com | No |
| **Starter** | notifications@villagekeep.com | No |
| **Pro** | hello@customerdomain.com | Yes (SPF, DKIM, DMARC) |
| **Enterprise** | hello@customerdomain.com | Yes (SPF, DKIM, DMARC) |

### DNS Records Required (Pro/Enterprise)

```
SPF:   v=spf1 include:_spf.villagekeep.com ~all
DKIM:  selector._domainkey.domain.com -> provided CNAME
DMARC: _dmarc.domain.com -> "v=DMARC1; p=none;"
```

---

## SMS Phone Numbers

| Tier | SMS Sender | Cost to VillageKeep |
|------|------------|---------------------|
| **Free** | Shared VillageKeep number | $0 |
| **Starter** | Shared VillageKeep number | $0 |
| **Pro** | Dedicated number for org | ~$1/month |
| **Enterprise** | Dedicated number for org | ~$1/month |

**Implementation:** Provision via Twilio. Store `phone_number_sid` in org record for Pro/Enterprise.

---

## Transaction Revenue (Donor Tips)

### Model: Less Aggressive Than Givebutter

**Givebutter approach:**
- Pre-checked tip box
- Guilt-inducing language ("Help cover our costs")
- Prominent, hard to miss

**VillageKeep approach:**
- Unchecked by default
- Simple language: "Add $X to support VillageKeep?"
- Small checkbox at end of form, not prominent
- No guilt, no pressure

### Tip Options

Display as checkbox with suggested amounts:
```
[ ] Add $3 to support VillageKeep (optional)
```

Or percentage-based for larger donations:
```
[ ] Add 5% to support VillageKeep (optional)
```

### Tip Logic

| Donation Amount | Suggested Tip |
|-----------------|---------------|
| $1-25 | $2 |
| $26-50 | $3 |
| $51-100 | $5 |
| $101-250 | 5% |
| $251+ | 3% |

### When Tips Apply

| Tier | Tip Prompt Shown |
|------|------------------|
| **Free** | Yes (our revenue model) |
| **Starter** | No |
| **Pro** | No |
| **Enterprise** | No |

Paid tiers = no tip prompt. Clean donor experience.

---

## Storage

### What Counts as Storage

- Member profile photos/avatars
- Uploaded documents (PDFs, forms)
- Certificate templates
- Event images
- Email attachments (when stored)
- File library items

### Storage Limits

| Tier | Limit | Overage |
|------|-------|---------|
| **Free** | 0 (no uploads) | N/A |
| **Starter** | 1 GB | $2/GB/month |
| **Pro** | 10 GB | $1/GB/month |
| **Enterprise** | 100 GB | $0.50/GB/month |

### Free Tier Workaround

Free tier users can:
- Link to external files (Google Drive, Dropbox)
- Use member profile data (no photo upload)
- Reference external images by URL

---

## Branding & Watermarks

### Free Tier Watermark

**Location:** Footer of all public-facing pages

**Portal footer:**
```html
<footer class="vk-branding">
  Powered by <a href="https://villagekeep.com">VillageKeep</a>
</footer>
```

**Donation page footer:**
```html
<footer class="vk-branding">
  Secure payments powered by <a href="https://villagekeep.com">VillageKeep</a>
</footer>
```

**Email footer (auto-appended):**
```
---
Sent via VillageKeep | Membership + Fundraising
```

### Paid Tier Branding

| Tier | Portal | Donation Pages | Emails |
|------|--------|----------------|--------|
| **Starter** | No watermark | No watermark | No watermark |
| **Pro** | No watermark | No watermark | No watermark |
| **Enterprise** | White-label | White-label | White-label |

**White-label (Enterprise):** Complete removal of all VillageKeep references. Custom login page with their logo. Custom email domain.

---

## Automations

### Available to All Tiers

Automations/workflows are available on ALL tiers because:
1. Automations drive email/SMS sends
2. Email/SMS sends generate revenue (especially for Free tier)
3. We WANT users to automate

### Automation Triggers

| Trigger | All Tiers |
|---------|-----------|
| Member joins | Yes |
| Member tier changes | Yes |
| Membership expires (X days before) | Yes |
| Membership expired | Yes |
| Membership renewed | Yes |
| Donation received | Yes |
| Event registered | Yes |
| Custom date field (birthday, etc.) | Pro/Enterprise only |
| Engagement score changes | Pro/Enterprise only |

### Automation Actions

| Action | Free | Starter | Pro | Enterprise |
|--------|------|---------|-----|------------|
| Send email | Yes (pay per) | Yes | Yes | Yes |
| Send SMS | Yes (pay per) | Yes | Yes | Yes |
| Add tag | No | Yes | Yes | Yes |
| Update field | No | No | Yes | Yes |
| Add to segment | No | No | Yes | Yes |
| Create task | No | No | Yes | Yes |
| Webhook | No | No | No | Yes |

---

## Database Schema Updates

### platform_plans Table

```sql
CREATE TABLE platform_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,

  -- Pricing
  price_cents_monthly INT NOT NULL DEFAULT 0,
  price_cents_annual INT NOT NULL DEFAULT 0,

  -- Limits
  team_seat_limit INT DEFAULT 1,           -- -1 = unlimited
  storage_mb INT DEFAULT 0,
  emails_included INT DEFAULT 0,
  sms_included INT DEFAULT 0,

  -- Overage pricing (in cents)
  email_overage_cents_per_1k INT DEFAULT 500,  -- $5.00/1K
  sms_overage_cents_per_100 INT DEFAULT 400,   -- $4.00/100
  storage_overage_cents_per_gb INT DEFAULT 200, -- $2.00/GB

  -- Feature flags
  has_activity_timeline BOOLEAN DEFAULT FALSE,
  has_tags BOOLEAN DEFAULT FALSE,
  has_advanced_filters BOOLEAN DEFAULT FALSE,
  has_saved_segments BOOLEAN DEFAULT FALSE,
  has_custom_fields BOOLEAN DEFAULT FALSE,
  has_engagement_scoring BOOLEAN DEFAULT FALSE,
  has_lifecycle_stages BOOLEAN DEFAULT FALSE,
  has_notes_tasks BOOLEAN DEFAULT FALSE,
  has_member_directory BOOLEAN DEFAULT FALSE,
  has_certificates BOOLEAN DEFAULT FALSE,
  has_analytics_basic BOOLEAN DEFAULT FALSE,
  has_analytics_growth BOOLEAN DEFAULT FALSE,
  has_analytics_full BOOLEAN DEFAULT FALSE,
  has_custom_email_domain BOOLEAN DEFAULT FALSE,
  has_dedicated_sms_number BOOLEAN DEFAULT FALSE,
  has_subdomain BOOLEAN DEFAULT FALSE,
  has_custom_domain BOOLEAN DEFAULT FALSE,
  has_api_access BOOLEAN DEFAULT FALSE,
  has_webhooks BOOLEAN DEFAULT FALSE,
  has_zapier BOOLEAN DEFAULT FALSE,
  has_mailchimp BOOLEAN DEFAULT FALSE,
  has_salesforce BOOLEAN DEFAULT FALSE,
  has_zoom BOOLEAN DEFAULT FALSE,
  has_sso BOOLEAN DEFAULT FALSE,
  has_sla BOOLEAN DEFAULT FALSE,
  branding_removed BOOLEAN DEFAULT FALSE,
  whitelabel BOOLEAN DEFAULT FALSE,
  show_tip_prompt BOOLEAN DEFAULT TRUE,

  -- Support
  support_level VARCHAR(50) DEFAULT 'docs',  -- docs, email, priority, dedicated
  support_response_hours INT DEFAULT NULL,   -- NULL = no SLA

  -- Meta
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Seed Data

```sql
INSERT INTO platform_plans (id, name, price_cents_monthly, price_cents_annual,
  team_seat_limit, storage_mb, emails_included, sms_included,
  email_overage_cents_per_1k, sms_overage_cents_per_100, storage_overage_cents_per_gb,
  has_activity_timeline, has_tags, has_advanced_filters, has_saved_segments,
  has_custom_fields, has_engagement_scoring, has_lifecycle_stages, has_notes_tasks,
  has_member_directory, has_certificates, has_analytics_basic, has_analytics_growth,
  has_analytics_full, has_custom_email_domain, has_dedicated_sms_number,
  has_subdomain, has_custom_domain, has_api_access, has_webhooks,
  has_zapier, has_mailchimp, has_salesforce, has_zoom, has_sso, has_sla,
  branding_removed, whitelabel, show_tip_prompt, support_level, support_response_hours,
  sort_order)
VALUES

-- FREE
('free', 'Free', 0, 0,
  1, 0, 0, 0,
  500, 400, 200,
  FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, FALSE,
  FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, TRUE, 'docs', NULL,
  0),

-- STARTER
('starter', 'Starter', 2900, 29000,
  2, 1024, 2000, 50,
  300, 250, 200,
  TRUE, TRUE, TRUE, FALSE,
  FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, TRUE, FALSE,
  FALSE, FALSE, FALSE,
  FALSE, FALSE, FALSE, FALSE,
  TRUE, FALSE, FALSE, FALSE, FALSE, FALSE,
  TRUE, FALSE, FALSE, 'email', 48,
  1),

-- PRO
('pro', 'Pro', 8900, 89000,
  6, 10240, 10000, 200,
  150, 150, 100,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, TRUE, TRUE,
  TRUE, FALSE, TRUE, FALSE,
  TRUE, TRUE, FALSE, FALSE, FALSE, FALSE,
  TRUE, FALSE, FALSE, 'priority', 24,
  2),

-- ENTERPRISE
('enterprise', 'Enterprise', 17900, 179000,
  -1, 102400, 50000, 1000,
  75, 100, 50,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, FALSE, 'dedicated', 4,
  3);
```

### Usage Tracking Table

```sql
CREATE TABLE org_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Counts
  emails_sent INT DEFAULT 0,
  sms_sent INT DEFAULT 0,
  storage_bytes_used BIGINT DEFAULT 0,

  -- Billing
  emails_included INT DEFAULT 0,
  sms_included INT DEFAULT 0,
  emails_overage INT DEFAULT 0,
  sms_overage INT DEFAULT 0,
  overage_charges_cents INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, period_start)
);

CREATE INDEX idx_org_usage_org_period ON org_usage(org_id, period_start);
```

### Tips Table

```sql
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  donation_id UUID REFERENCES donations(id),

  amount_cents INT NOT NULL,
  stripe_charge_id VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tips_org ON tips(org_id);
CREATE INDEX idx_tips_created ON tips(created_at);
```

---

## API Endpoints

### Get Current Plan

```
GET /api/v1/organization/plan

Response:
{
  "plan": {
    "id": "pro",
    "name": "Pro",
    "price_monthly": 89.00,
    "price_annual": 890.00,
    "billing_period": "monthly",
    "current_period_start": "2024-12-01",
    "current_period_end": "2024-12-31",
    "trial_ends_at": null
  },
  "usage": {
    "emails_sent": 4523,
    "emails_included": 10000,
    "emails_remaining": 5477,
    "sms_sent": 87,
    "sms_included": 200,
    "sms_remaining": 113,
    "storage_used_mb": 2340,
    "storage_limit_mb": 10240,
    "team_seats_used": 4,
    "team_seats_limit": 6
  },
  "overage_charges": {
    "emails": 0,
    "sms": 0,
    "storage": 0,
    "total_cents": 0
  }
}
```

### Upgrade/Downgrade Plan

```
POST /api/v1/organization/plan

Request:
{
  "plan_id": "pro",
  "billing_period": "annual"
}

Response:
{
  "success": true,
  "plan": { ... },
  "proration_amount_cents": -2500,
  "next_invoice_date": "2025-01-01"
}
```

### Get Usage History

```
GET /api/v1/organization/usage?period=2024-12

Response:
{
  "period": "2024-12",
  "emails": {
    "sent": 4523,
    "included": 10000,
    "overage": 0,
    "overage_charge_cents": 0
  },
  "sms": {
    "sent": 87,
    "included": 200,
    "overage": 0,
    "overage_charge_cents": 0
  },
  "storage": {
    "used_mb": 2340,
    "limit_mb": 10240,
    "overage_mb": 0,
    "overage_charge_cents": 0
  }
}
```

---

## UI Requirements

### Pricing Page

1. **Billing toggle** at top: Monthly | Annual (save 17%)
2. **4 pricing cards** in a row (Free, Starter, Pro, Enterprise)
3. **Pro card featured** with "Most Popular" badge and slight visual emphasis
4. **Feature checklist** per card (6-8 key features)
5. **Email/SMS pricing** shown per card
6. **CTA buttons:**
   - Free: "Get Started Free"
   - Starter/Pro/Enterprise: "Start 7-Day Trial"
7. **Expandable comparison grid** below cards
8. **FAQ section** below grid
9. **Trust badges** (Stripe, security icons)

### Settings > Billing Page (Admin)

1. **Current plan card** with upgrade/downgrade button
2. **Usage meters** (emails, SMS, storage, seats)
3. **Billing history** table
4. **Payment method** management
5. **Invoice downloads**

### Usage Alerts

Trigger email/in-app alerts when:
- 80% of email/SMS/storage used
- 100% of allowance reached (overage begins)
- Approaching seat limit

---

## Revenue Projections

### Assumptions
- 90% Free, 5% Starter, 3% Pro, 2% Enterprise
- Free tier sends avg 750 emails/month, 30 SMS/month
- Paid tiers use 150% of included allowance on average
- 30% of donations include optional tip (avg $3)

### At Scale

| Orgs | Subscriptions | Email/SMS | Tips | Total/Month | Annual |
|------|---------------|-----------|------|-------------|--------|
| 1,000 | $7.7K | $6.5K | $3.6K | **$17.8K** | **$214K** |
| 10,000 | $77K | $65K | $36K | **$178K** | **$2.1M** |
| 50,000 | $385K | $325K | $180K | **$890K** | **$10.7M** |
| 100,000 | $770K | $650K | $360K | **$1.78M** | **$21.4M** |

### Revenue Mix
- Subscriptions: ~43%
- Email/SMS: ~37%
- Tips: ~20%

---

## Implementation Phases

### Phase 1: Core Tier System
- [ ] Update database schema (platform_plans, org_usage, tips)
- [ ] Implement tier feature flags in backend
- [ ] Create billing settings page
- [ ] Stripe subscription integration (monthly/annual)
- [ ] 7-day trial logic

### Phase 2: Usage Metering
- [ ] Email send tracking & metering
- [ ] SMS send tracking & metering
- [ ] Storage usage calculation
- [ ] Overage charge calculation
- [ ] Usage alerts (80%, 100%)

### Phase 3: Pricing Page Redesign
- [ ] 4-tier pricing cards
- [ ] Monthly/annual toggle
- [ ] Feature comparison grid
- [ ] FAQ section
- [ ] Mobile responsive

### Phase 4: Email/SMS Infrastructure
- [ ] Custom email domain verification (Pro/Enterprise)
- [ ] Dedicated SMS number provisioning (Pro/Enterprise)
- [ ] DNS setup wizard

### Phase 5: Tip System
- [ ] Tip checkbox on donation forms
- [ ] Tip calculation logic (amount-based suggestions)
- [ ] Tip tracking & reporting
- [ ] Only show for Free tier

### Phase 6: CRM Features (Per Tier)
- [ ] Activity timeline (Starter+)
- [ ] Tags system (Starter+)
- [ ] Advanced filters (Starter+)
- [ ] Custom fields (Pro+)
- [ ] Lifecycle stages (Pro+)
- [ ] Engagement scoring (Pro+)
- [ ] Member directory (Pro+)
- [ ] Certificates (Pro+)

---

## Embeddable Donation Widget

### Overview

A beautiful, customizable donation wizard that orgs can embed anywhere (their website, blog, Linktree, etc.).

### Widget Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Inline** | Renders directly in page | Dedicated donation page |
| **Modal** | Opens as popup overlay | "Donate" button on any page |
| **Button** | Just a styled button that opens modal | Minimal integration |

### Embed Code

```html
<!-- Inline Widget -->
<div id="vk-donate" data-org="aalb" data-campaign="annual-fund"></div>
<script src="https://villagekeep.com/embed.js"></script>

<!-- Button that opens Modal -->
<button class="vk-donate-btn" data-org="aalb">Donate Now</button>
<script src="https://villagekeep.com/embed.js"></script>
```

### Widget Steps (Wizard Flow)

```
Step 1: Amount Selection
┌─────────────────────────────────────────────┐
│  Support [Org Name]                         │
│                                             │
│  [$25]  [$50]  [$100]  [$250]  [Other]     │
│                                             │
│  ○ One-time   ● Monthly   ○ Annually       │
│                                             │
│  [Continue →]                               │
└─────────────────────────────────────────────┘

Step 2: Donor Information
┌─────────────────────────────────────────────┐
│  Your Information                           │
│                                             │
│  [First Name]  [Last Name]                  │
│  [Email Address]                            │
│  [Phone (optional)]                         │
│                                             │
│  [ ] Make this donation anonymous           │
│  [ ] Add $3 to support VillageKeep          │  ← Only on Free tier
│                                             │
│  [← Back]  [Continue →]                     │
└─────────────────────────────────────────────┘

Step 3: Payment
┌─────────────────────────────────────────────┐
│  Payment Details                            │
│                                             │
│  [Stripe Elements - Card Input]             │
│                                             │
│  ─────────────────────────────────────      │
│  Donation:           $50.00                 │
│  VillageKeep tip:     $3.00                 │  ← If checked
│  ─────────────────────────────────────      │
│  Total:              $53.00                 │
│                                             │
│  [← Back]  [Complete Donation →]            │
└─────────────────────────────────────────────┘

Step 4: Confirmation
┌─────────────────────────────────────────────┐
│  ✓ Thank You!                               │
│                                             │
│  Your donation of $50.00 to [Org Name]      │
│  has been processed.                        │
│                                             │
│  Receipt sent to: donor@email.com           │
│                                             │
│  [Share on Facebook]  [Share on Twitter]    │
│                                             │
│  Powered by VillageKeep                     │  ← Only on Free tier
└─────────────────────────────────────────────┘
```

### Customization Options

| Option | Free | Starter | Pro | Enterprise |
|--------|------|---------|-----|------------|
| Suggested amounts | Default only | Custom | Custom | Custom |
| Colors (primary, background) | No | Yes | Yes | Yes |
| Logo upload | No | Yes | Yes | Yes |
| Custom thank you message | No | Yes | Yes | Yes |
| Redirect after donation | No | No | Yes | Yes |
| Remove "Powered by" | No | Yes | Yes | Yes |
| Custom CSS injection | No | No | No | Yes |

### Campaign Features (All Tiers)

| Feature | Description |
|---------|-------------|
| **Goal thermometer** | Visual progress bar toward goal |
| **Donor count** | "Join 47 others who donated" |
| **Recent donors** | Live ticker of recent donations (with opt-in) |
| **Matching display** | "Every dollar matched up to $5,000!" |
| **Deadline countdown** | "3 days left to reach our goal" |
| **Impact statements** | "$25 = 1 meal" type messaging |

### Technical Implementation

```javascript
// embed.js initialization
window.VillageKeep = {
  init: function(config) {
    // config.org - required, org slug
    // config.campaign - optional, campaign ID
    // config.amounts - optional, custom amounts array
    // config.primaryColor - optional, hex color
    // config.mode - 'inline' | 'modal' | 'button'
  }
};
```

### API Endpoint for Widget Config

```
GET /api/v1/widget/config/:orgSlug

Response:
{
  "org": {
    "name": "AALB",
    "logo_url": "https://cdn.villagekeep.com/aalb/logo.png",
    "primary_color": "#102a43"
  },
  "campaign": {
    "id": "annual-fund",
    "name": "2024 Annual Fund",
    "goal_cents": 5000000,
    "raised_cents": 234500,
    "donor_count": 47,
    "ends_at": "2024-12-31T23:59:59Z"
  },
  "customization": {
    "amounts": [25, 50, 100, 250],
    "show_tip_prompt": true,
    "thank_you_message": "Thank you for supporting..."
  }
}
```

---

## Member Portal Features

### Portal URL Structure

| Tier | URL Pattern | Example |
|------|-------------|---------|
| **Free** | villagekeep.com/p/:orgSlug | villagekeep.com/p/aalb |
| **Starter** | villagekeep.com/p/:orgSlug | villagekeep.com/p/aalb |
| **Pro** | :orgSlug.villagekeep.com | aalb.villagekeep.com |
| **Enterprise** | Custom domain | members.aalb.org |

### Portal Sections

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  AALB Member Portal          [John Doe ▼]  [Logout]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │  Dashboard  │  Profile    │  Payments   │  Directory  │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
│                                                                 │
│  DASHBOARD                                                      │
│  ─────────────────────────────────────────────────              │
│                                                                 │
│  Membership Status                                              │
│  ┌─────────────────────────────────────┐                       │
│  │  ✓ Active - Professional Member    │                       │
│  │  Expires: Dec 31, 2025             │                       │
│  │  [Renew Early] [View Benefits]     │                       │
│  └─────────────────────────────────────┘                       │
│                                                                 │
│  Credentials (Pro/Enterprise only)                              │
│  ┌─────────────────────────────────────┐                       │
│  │  CEU Credits: 12.5 / 20 required   │                       │
│  │  ████████████░░░░░  62%            │                       │
│  │  [View Transcript] [Upload Cert]   │                       │
│  └─────────────────────────────────────┘                       │
│                                                                 │
│  Recent Activity                                                │
│  • Dec 15 - Certificate issued: Annual Training                │
│  • Dec 1 - Membership renewed                                  │
│  • Nov 20 - Donation: $50 to Annual Fund                       │
│                                                                 │
│  ───────────────────────────────────────────────────────────   │
│  Powered by VillageKeep  (Free tier only)                      │
└─────────────────────────────────────────────────────────────────┘
```

### Portal Features by Tier

| Section | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|------------|
| **Dashboard** | Basic | Basic | Full | Full |
| **Profile** - View | Yes | Yes | Yes | Yes |
| **Profile** - Edit basic fields | Yes | Yes | Yes | Yes |
| **Profile** - Edit custom fields | No | No | Yes | Yes |
| **Profile** - Upload photo | No | Yes | Yes | Yes |
| **Payments** - View history | Yes | Yes | Yes | Yes |
| **Payments** - Download receipts | Yes | Yes | Yes | Yes |
| **Payments** - Update payment method | Yes | Yes | Yes | Yes |
| **Directory** - View members | No | No | Yes | Yes |
| **Directory** - Search/filter | No | No | Yes | Yes |
| **Directory** - Contact members | No | No | Yes | Yes |
| **Credentials** - View status | No | No | Yes | Yes |
| **Credentials** - Download certs | No | No | Yes | Yes |
| **Events** - View upcoming | Yes | Yes | Yes | Yes |
| **Events** - Register | Yes | Yes | Yes | Yes |
| **Donations** - Make donation | Yes | Yes | Yes | Yes |
| **Donations** - View giving history | Yes | Yes | Yes | Yes |

### Member Login Flow

```
1. Member visits portal URL
2. Enters email address
3. Receives magic link email (no passwords)
4. Clicks link → logged in for 30 days
5. Optional: "Remember this device" for 90 days
```

### Portal Customization

| Setting | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|------------|
| Logo upload | No | Yes | Yes | Yes |
| Primary color | No | Yes | Yes | Yes |
| Welcome message | No | Yes | Yes | Yes |
| Custom sections | No | No | Yes | Yes |
| Custom CSS | No | No | No | Yes |
| Custom domain | No | No | No | Yes |
| Remove VK branding | No | Yes | Yes | Yes |

---

## Automation Workflows (Detailed)

### Available Triggers

| Trigger | Description | All Tiers | Data Available |
|---------|-------------|-----------|----------------|
| `member.created` | New member added | Yes | member object |
| `member.tier_changed` | Tier upgraded/downgraded | Yes | member, old_tier, new_tier |
| `membership.expiring_soon` | X days before expiration | Yes | member, days_remaining |
| `membership.expired` | Membership lapsed | Yes | member |
| `membership.renewed` | Renewal completed | Yes | member, payment |
| `donation.received` | Any donation | Yes | donor, donation, campaign |
| `event.registered` | Event registration | Yes | member, event |
| `event.attended` | Checked in to event | Yes | member, event |
| `custom_date.approaching` | Days before custom field date | Pro+ | member, field_name |
| `engagement.score_changed` | Engagement score threshold | Pro+ | member, old_score, new_score |
| `tag.added` | Tag applied to member | Starter+ | member, tag |
| `tag.removed` | Tag removed from member | Starter+ | member, tag |

### Available Actions

| Action | Description | Free | Starter | Pro | Enterprise |
|--------|-------------|------|---------|-----|------------|
| `send_email` | Send email template | Yes (pay) | Yes | Yes | Yes |
| `send_sms` | Send SMS message | Yes (pay) | Yes | Yes | Yes |
| `add_tag` | Apply tag to member | No | Yes | Yes | Yes |
| `remove_tag` | Remove tag from member | No | Yes | Yes | Yes |
| `update_field` | Change a field value | No | No | Yes | Yes |
| `change_lifecycle` | Move to lifecycle stage | No | No | Yes | Yes |
| `add_to_segment` | Add to saved segment | No | No | Yes | Yes |
| `create_task` | Create task for admin | No | No | Yes | Yes |
| `trigger_webhook` | POST to external URL | No | No | No | Yes |
| `wait` | Delay next action | Yes | Yes | Yes | Yes |
| `condition` | If/then branching | Yes | Yes | Yes | Yes |

### Pre-Built Automation Templates

**1. Welcome Series (All Tiers)**
```yaml
trigger: member.created
actions:
  - send_email: "welcome_email"
  - wait: 3 days
  - send_email: "getting_started_guide"
  - wait: 7 days
  - send_email: "member_benefits_reminder"
```

**2. Renewal Reminder (All Tiers)**
```yaml
trigger: membership.expiring_soon
conditions:
  - days_remaining: 30
actions:
  - send_email: "renewal_reminder_30_days"
  - wait: 15 days
  - condition: membership.status != "active"
    then:
      - send_email: "renewal_reminder_15_days"
  - wait: 10 days
  - condition: membership.status != "active"
    then:
      - send_sms: "renewal_urgent_5_days"
```

**3. Lapsed Member Win-Back (All Tiers)**
```yaml
trigger: membership.expired
actions:
  - wait: 7 days
  - send_email: "we_miss_you"
  - wait: 21 days
  - send_email: "special_offer_rejoin"
  - wait: 30 days
  - send_email: "final_invitation"
```

**4. New Donor Thank You (All Tiers)**
```yaml
trigger: donation.received
conditions:
  - donor.is_first_time: true
actions:
  - send_email: "first_time_donor_thank_you"
  - wait: 1 day
  - send_email: "impact_story"
  - add_tag: "first-time-donor"  # Starter+ only
```

**5. Re-Engagement (Pro+)**
```yaml
trigger: engagement.score_changed
conditions:
  - new_score: < 20
  - old_score: >= 20
actions:
  - change_lifecycle: "at_risk"
  - create_task:
      title: "Reach out to {member.name}"
      due_in: 3 days
  - send_email: "engagement_reactivation"
```

### Automation Builder UI

```
┌─────────────────────────────────────────────────────────────────┐
│  Automation: Renewal Reminder Series                            │
│  Status: ● Active                              [Edit] [Pause]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TRIGGER                                                        │
│  ┌────────────────────────────────────┐                        │
│  │ ⚡ Membership expiring soon        │                        │
│  │    When: 30 days before            │                        │
│  └────────────────────────────────────┘                        │
│              │                                                  │
│              ▼                                                  │
│  ┌────────────────────────────────────┐                        │
│  │ ✉️ Send email                       │                        │
│  │    Template: "30-day reminder"     │                        │
│  └────────────────────────────────────┘                        │
│              │                                                  │
│              ▼                                                  │
│  ┌────────────────────────────────────┐                        │
│  │ ⏱️ Wait                             │                        │
│  │    Duration: 15 days               │                        │
│  └────────────────────────────────────┘                        │
│              │                                                  │
│              ▼                                                  │
│  ┌────────────────────────────────────┐                        │
│  │ ❓ Condition                        │                        │
│  │    If: Membership status ≠ Active  │                        │
│  └─────────────┬──────────────────────┘                        │
│       YES ─────┘                                               │
│              ▼                                                  │
│  ┌────────────────────────────────────┐                        │
│  │ ✉️ Send email                       │                        │
│  │    Template: "15-day reminder"     │                        │
│  └────────────────────────────────────┘                        │
│                                                                 │
│  [+ Add Step]                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Engagement Scoring (Pro/Enterprise)

### Score Calculation

Engagement score is 0-100, calculated from weighted activities over the past 12 months.

### Activity Weights

| Activity | Points | Decay | Max per Year |
|----------|--------|-------|--------------|
| Membership active | +20 | None | 20 |
| Membership renewed on time | +10 | None | 10 |
| Donation made | +5 | 50%/6mo | 30 |
| Event attended | +5 | 50%/6mo | 25 |
| Event registered (not attended) | +2 | 50%/6mo | 10 |
| Email opened | +1 | 75%/3mo | 10 |
| Email clicked | +2 | 75%/3mo | 10 |
| Portal login | +2 | 75%/3mo | 10 |
| Profile updated | +3 | 50%/6mo | 6 |
| Referred new member | +15 | None | 15 |

### Score Decay

Points decay over time to reflect recency:
- 75% decay: After 3 months, points reduced to 25% of original
- 50% decay: After 6 months, points reduced to 50% of original
- No decay: One-time achievements don't decay

### Score Calculation Formula

```
score = min(100, sum(activity_points * decay_factor))
```

### Score Tiers

| Score | Label | Color | Description |
|-------|-------|-------|-------------|
| 80-100 | Champion | Green | Highly engaged, likely advocate |
| 60-79 | Active | Blue | Regular participant |
| 40-59 | Moderate | Yellow | Occasional engagement |
| 20-39 | Low | Orange | Minimal engagement |
| 0-19 | At Risk | Red | Disengaged, likely to churn |

### Score Recalculation

- Scores recalculated nightly via cron job
- Real-time updates for major events (donation, renewal)
- Historical scores stored for trend analysis

### Database Schema

```sql
CREATE TABLE engagement_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  org_id UUID NOT NULL REFERENCES organizations(id),

  score INT NOT NULL DEFAULT 0,
  score_tier VARCHAR(20) NOT NULL DEFAULT 'at_risk',

  -- Component scores
  membership_points INT DEFAULT 0,
  donation_points INT DEFAULT 0,
  event_points INT DEFAULT 0,
  email_points INT DEFAULT 0,
  portal_points INT DEFAULT 0,
  referral_points INT DEFAULT 0,

  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(member_id)
);

CREATE TABLE engagement_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  score INT NOT NULL,
  score_tier VARCHAR(20) NOT NULL,
  calculated_at DATE NOT NULL,

  UNIQUE(member_id, calculated_at)
);
```

---

## Lifecycle Stages (Pro/Enterprise)

### Stage Definitions

| Stage | Description | Entry Criteria | Exit Criteria |
|-------|-------------|----------------|---------------|
| **Prospect** | Interested but not member | Manual add or form submission | Applies or joins |
| **Applied** | Submitted application | Application submitted | Approved or rejected |
| **Pending Payment** | Approved, awaiting payment | Application approved | Payment received |
| **Active** | Current, paid member | Payment received | Expires or cancels |
| **Grace Period** | Recently expired, can still access | 0-30 days past expiration | Renews or hits 30 days |
| **Lapsed** | Expired, no access | 30+ days past expiration | Renews |
| **Churned** | Long-term lapsed | 180+ days lapsed | Rejoins |
| **Cancelled** | Voluntarily cancelled | Member requested cancel | Rejoins |

### Automatic Transitions

| Transition | Trigger | Automatic |
|------------|---------|-----------|
| Prospect → Applied | Submits application | Yes |
| Applied → Pending Payment | Admin approves | Manual |
| Applied → Prospect | Admin rejects | Manual |
| Pending Payment → Active | Payment received | Yes |
| Active → Grace Period | Membership expires | Yes |
| Grace Period → Active | Renewal payment | Yes |
| Grace Period → Lapsed | 30 days past expiration | Yes |
| Lapsed → Churned | 180 days past expiration | Yes |
| Any → Active | Payment received | Yes |
| Any → Cancelled | Member cancels | Yes |

### Manual Overrides

Admins can manually move members between stages with a reason:

```
┌─────────────────────────────────────────────────────────────────┐
│  Move Member: John Doe                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Current Stage: Lapsed                                          │
│                                                                 │
│  New Stage: [Active ▼]                                          │
│                                                                 │
│  Reason: [Comp membership granted for volunteer service    ]   │
│                                                                 │
│  [ ] Update expiration date                                     │
│      New expiration: [2025-12-31]                              │
│                                                                 │
│  [Cancel]  [Move Member]                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Stage History

All transitions logged with timestamp, previous stage, new stage, trigger (auto/manual), and admin ID if manual.

```sql
CREATE TABLE lifecycle_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  org_id UUID NOT NULL REFERENCES organizations(id),

  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  trigger_type VARCHAR(20) NOT NULL,  -- 'auto' | 'manual' | 'payment' | 'expiration'
  triggered_by UUID REFERENCES users(id),  -- NULL for auto
  reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Certificate System (Pro/Enterprise)

### Certificate Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Membership** | Proof of membership | General membership certificate |
| **Credential** | Professional credential | CEU, license verification |
| **Achievement** | Course/event completion | Training, workshop completion |
| **Recognition** | Award or honor | Volunteer, donor recognition |

### Certificate Template Builder

```
┌─────────────────────────────────────────────────────────────────┐
│  Certificate Template: Professional Member Certificate          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                    [ORG LOGO]                           │   │
│  │                                                         │   │
│  │              CERTIFICATE OF MEMBERSHIP                  │   │
│  │                                                         │   │
│  │  This is to certify that                               │   │
│  │                                                         │   │
│  │              {member.full_name}                        │   │
│  │                                                         │   │
│  │  is a Professional Member in good standing of         │   │
│  │  {org.name} through {membership.expires_at}           │   │
│  │                                                         │   │
│  │                                                         │   │
│  │  Member ID: {member.id}                                │   │
│  │  Issued: {certificate.issued_at}                       │   │
│  │                                                         │   │
│  │  [SIGNATURE IMAGE]        [QR CODE]                    │   │
│  │  Executive Director       Verify at:                   │   │
│  │                          villagekeep.com/verify/xxxxx  │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TEMPLATE SETTINGS                                              │
│  ──────────────────                                             │
│  Background: [Upload] or [Choose color]                         │
│  Logo: [Upload]                                                 │
│  Signature: [Upload]                                            │
│  Font: [Select ▼]                                               │
│  Orientation: ○ Landscape  ● Portrait                           │
│                                                                 │
│  AVAILABLE MERGE FIELDS                                         │
│  ──────────────────────                                         │
│  {member.full_name}  {member.email}  {member.id}               │
│  {membership.tier}  {membership.expires_at}                     │
│  {org.name}  {certificate.issued_at}  {certificate.id}         │
│  {custom_field.any_field_name}                                 │
│                                                                 │
│  [Preview]  [Save Template]                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Auto-Issue Rules

Certificates can be automatically issued based on triggers:

| Trigger | Example |
|---------|---------|
| Membership activated | Issue membership certificate |
| Membership renewed | Issue updated certificate |
| Event attended | Issue completion certificate |
| Course completed | Issue CEU certificate |
| Credential earned | Issue credential certificate |
| Manual | Admin issues manually |

### Auto-Issue Configuration

```yaml
# Example: Auto-issue membership certificate on join
trigger: membership.activated
template: "professional_member_certificate"
delivery:
  - email: true
  - portal: true
  - notify_member: true
conditions:
  - membership.tier: ["professional", "premium"]
```

### Certificate Verification

Each certificate has a unique ID and QR code linking to verification page:

```
GET /verify/:certificateId

Response (public page):
┌─────────────────────────────────────────────────────────────────┐
│  ✓ VERIFIED CERTIFICATE                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Certificate ID: CERT-2024-00847                                │
│                                                                 │
│  Type: Professional Member Certificate                          │
│  Issued To: John Smith                                          │
│  Issued By: American Association of Language Barriers           │
│  Issue Date: January 15, 2024                                   │
│  Valid Through: December 31, 2025                               │
│                                                                 │
│  Status: ● VALID                                                │
│                                                                 │
│  This certificate was verified on Dec 24, 2024                 │
└─────────────────────────────────────────────────────────────────┘
```

### Certificate Database Schema

```sql
CREATE TABLE certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- membership | credential | achievement | recognition

  -- Template content (JSON with layout, styles, merge fields)
  template_json JSONB NOT NULL,

  -- Assets
  background_url VARCHAR(500),
  logo_url VARCHAR(500),
  signature_url VARCHAR(500),

  -- Settings
  orientation VARCHAR(20) DEFAULT 'landscape',
  paper_size VARCHAR(20) DEFAULT 'letter',

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE certificates_issued (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  member_id UUID NOT NULL REFERENCES members(id),
  template_id UUID NOT NULL REFERENCES certificate_templates(id),

  -- Unique public ID for verification
  public_id VARCHAR(50) NOT NULL UNIQUE,

  -- Rendered content
  rendered_data JSONB NOT NULL,  -- Snapshot of merged data at issue time
  pdf_url VARCHAR(500),  -- Generated PDF location

  -- Validity
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  valid_from DATE,
  valid_until DATE,

  -- Status
  status VARCHAR(20) DEFAULT 'active',  -- active | revoked | expired
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,

  -- Delivery
  emailed_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certificates_public_id ON certificates_issued(public_id);
CREATE INDEX idx_certificates_member ON certificates_issued(member_id);
```

### PDF Generation

Certificates rendered server-side using Puppeteer/Playwright:

```javascript
// Generate certificate PDF
async function generateCertificatePDF(templateId, memberData) {
  const template = await db.getTemplate(templateId);
  const html = renderTemplate(template.template_json, memberData);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);

  const pdf = await page.pdf({
    format: template.paper_size,
    landscape: template.orientation === 'landscape',
    printBackground: true
  });

  await browser.close();

  // Upload to storage
  const url = await storage.upload(`certificates/${certificateId}.pdf`, pdf);
  return url;
}
```

---

## Open Questions

1. **Nonprofit discount?** Should we offer 20% off for verified 501(c)(3)s?
2. **Annual-only Enterprise?** Should Enterprise require annual commitment?
3. **Grandfathering?** How do we handle existing users when this launches?
4. **Overage limits?** Should we cap overages or allow unlimited (with alerts)?

---

## Appendix: Competitive Comparison

| Feature | VillageKeep | Wild Apricot | Givebutter | Memberful |
|---------|-------------|--------------|------------|-----------|
| Unlimited members (Free) | Yes | No (50 cap) | N/A | No |
| Platform fee | 0% | 0% | 0% + tips | 0% |
| Subscription price | $0-179 | $60-420 | $0 | $25-100 |
| Email included | Yes (paid tiers) | Basic | No | No |
| SMS included | Yes (paid tiers) | No | No | No |
| Works for all orgs | Yes | Yes | 501(c)(3) only | Yes |
| Modern UI | Yes | Dated | Yes | Yes |
| CRM features | Yes | Basic | No | No |

---

*End of Specification*
