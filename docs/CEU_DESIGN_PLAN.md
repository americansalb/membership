# CEU Tracking Feature - Complete Design Plan

## Overview

Build a comprehensive, beautiful CEU (Continuing Education Unit) tracking system that serves both administrators and members. This is a key differentiator for VillageKeep targeting professional associations.

---

## Design Philosophy

1. **Progress-First** — Always show members where they stand
2. **Actionable** — Surface what needs attention (deadlines, incomplete requirements)
3. **Celebration** — Recognize achievements with certificates and visual milestones
4. **Professional** — Clean, credible design befitting professional certifications
5. **Mobile-First** — Members check CEU progress on their phones

---

## Color Semantics for CEU

| Status | Color | Use Case |
|--------|-------|----------|
| On Track | `--green-500` | ≥ 75% progress with time remaining |
| Warning | `--terra-500` | < 50% progress or deadline < 30 days |
| Critical | `--error` | Overdue or < 25% with < 14 days |
| Complete | `--green-600` | 100% of required credits earned |
| Verified | `--info` | Credits verified by admin |
| Pending | `--gray-400` | Credits awaiting verification |

---

## Pages to Build

### Admin Pages

1. **CEU Settings** (`/admin/ceu.html`)
   - Enable/disable CEU tracking for org
   - Configure tracking period (annual, calendar year, custom)
   - Define credit categories (Ethics, Medical, Legal, General, etc.)
   - Set default requirements per tier
   - Certificate branding settings

2. **CEU Management** (`/admin/ceu-credits.html`)
   - View all credits across members
   - Pending verification queue
   - Bulk operations (approve, reject, export)
   - Member compliance overview
   - Add credits to members

3. **CEU Compliance Report** (`/admin/ceu-report.html`)
   - Org-wide compliance dashboard
   - At-risk members list
   - Category breakdown
   - Export to CSV/PDF

### Member Portal Pages

4. **CEU Dashboard** (`/portal/ceu/index.html`)
   - Progress ring with current status
   - Credits by category breakdown
   - Recent activity
   - Deadline countdown
   - Quick actions (submit credits, view certificates)

5. **My Credits** (`/portal/ceu/credits.html`)
   - Full credit history table
   - Filter by category, status, date
   - Download certificates

6. **Submit Credit** (`/portal/ceu/submit.html`)
   - Form to submit new credit for approval
   - Upload certificate
   - Category selection

---

## Detailed Page Designs

### 1. Admin CEU Settings (`/admin/ceu.html`)

```
┌─────────────────────────────────────────────────────────────────┐
│  CEU Settings                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ CEU TRACKING                                             │    │
│  │ ─────────────────────────────────────────────────────────│    │
│  │ Enable CEU Tracking                           [Toggle ON]│    │
│  │                                                          │    │
│  │ Track continuing education credits for your members.     │    │
│  │ Members can view progress and submit credits for review. │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ TRACKING PERIOD                                          │    │
│  │ ─────────────────────────────────────────────────────────│    │
│  │ Period Type:  ( ) Annual (from join date)                │    │
│  │               (•) Calendar Year (Jan-Dec)                │    │
│  │               ( ) Custom                                 │    │
│  │                                                          │    │
│  │ Period Length: [12] months                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ CREDIT CATEGORIES                                        │    │
│  │ ─────────────────────────────────────────────────────────│    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────┐                  │    │
│  │  │ 📚 General          [Edit] [Delete]│                  │    │
│  │  │ Default category for all credits   │                  │    │
│  │  └────────────────────────────────────┘                  │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────┐                  │    │
│  │  │ ⚖️ Ethics            [Edit] [Delete]│                  │    │
│  │  │ Professional ethics training       │                  │    │
│  │  └────────────────────────────────────┘                  │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────┐                  │    │
│  │  │ 🏥 Medical           [Edit] [Delete]│                  │    │
│  │  │ Medical terminology & procedures   │                  │    │
│  │  └────────────────────────────────────┘                  │    │
│  │                                                          │    │
│  │  [+ Add Category]                                        │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ TIER REQUIREMENTS                                        │    │
│  │ ─────────────────────────────────────────────────────────│    │
│  │                                                          │    │
│  │  Tier              Total Required   Ethics Min           │    │
│  │  ─────────────────────────────────────────────────────   │    │
│  │  Basic             [0    ] credits  [0    ] ethics       │    │
│  │  Professional      [15   ] credits  [3    ] ethics       │    │
│  │  Premium           [20   ] credits  [4    ] ethics       │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│                                         [Save Settings]          │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Toggle to enable/disable CEU tracking org-wide
- Period configuration with visual explanation
- Category management with icons/emojis
- Per-tier requirements (total + category minimums)

---

### 2. Admin CEU Management (`/admin/ceu-credits.html`)

```
┌─────────────────────────────────────────────────────────────────┐
│  CEU Credit Management                          [+ Add Credit]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   127    │ │    8     │ │   94%    │ │    12    │           │
│  │ Total    │ │ Pending  │ │ Compliant│ │ At Risk  │           │
│  │ Credits  │ │ Review   │ │ Members  │ │ Members  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  [All Credits] [Pending (8)] [Verified] [Rejected]              │
│                                                                  │
│  🔍 Search members...          Category [All ▼]  Date [All ▼]   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ☐  Member          Credit Title       Credits  Status  Date ││
│  │ ─────────────────────────────────────────────────────────── ││
│  │ ☐  Sarah Chen      Medical Ethics 101   2.0   ⏳ Pending 12/15││
│  │    📎 Certificate                        [✓ Approve][✗ Reject]││
│  │ ─────────────────────────────────────────────────────────── ││
│  │ ☐  James Wilson    Legal Interpreting   3.5   ⏳ Pending 12/14││
│  │    📎 Certificate                        [✓ Approve][✗ Reject]││
│  │ ─────────────────────────────────────────────────────────── ││
│  │ ☐  Maria Lopez     Terminology Course   2.0   ✓ Verified 12/10││
│  │ ─────────────────────────────────────────────────────────── ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ☐ Select All                        [Bulk Approve] [Export CSV]│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Stats cards at top (total, pending, compliance rate, at-risk)
- Tabbed view for filtering by status
- Expandable rows showing certificate attachment
- Quick approve/reject actions
- Bulk operations for efficiency
- Search and filter capabilities

---

### 3. Member CEU Dashboard (`/portal/ceu/index.html`)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Portal                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MY CEU PROGRESS                                                 │
│                                                                  │
│           ┌─────────────────────┐                               │
│           │                     │                               │
│           │    ╭───────────╮    │    You're on track! 🎉        │
│           │   ╱             ╲   │                               │
│           │  │    12.5      │   │    7.5 credits needed         │
│           │  │    ────      │   │    by Dec 31, 2025            │
│           │  │     20       │   │                               │
│           │   ╲   credits  ╱    │    89 days remaining          │
│           │    ╰───────────╯    │                               │
│           │       62.5%         │                               │
│           └─────────────────────┘                               │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                 │
│  │ [+ Submit Credit]  │  │ [📄 View Certificates]│               │
│  └────────────────────┘  └────────────────────┘                 │
│                                                                  │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  CREDITS BY CATEGORY                                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ General                                                      ││
│  │ ████████████████████████████░░░░░░░░░░  8.0 / 12 credits    ││
│  │                                                              ││
│  │ Ethics (required: 4)                                         ││
│  │ ██████████████████░░░░░░░░░░░░░░░░░░░░  3.0 / 4 credits     ││
│  │                                                              ││
│  │ Medical                                                      ││
│  │ ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  1.5 / 4 credits     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  RECENT CREDITS                                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ✓  Medical Ethics 101                         Dec 15, 2024  ││
│  │    2.0 credits • Ethics • Verified                          ││
│  │ ─────────────────────────────────────────────────────────── ││
│  │ ✓  Advanced Terminology                       Dec 10, 2024  ││
│  │    3.5 credits • Medical • Verified                         ││
│  │ ─────────────────────────────────────────────────────────── ││
│  │ ⏳ Legal Interpreting Workshop                 Dec 8, 2024   ││
│  │    2.0 credits • General • Pending Review                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [View All Credits →]                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Large, prominent progress ring (SVG-based)
- Status message with emoji (on track, warning, critical)
- Days remaining countdown
- Quick action buttons
- Category breakdown with progress bars
- Highlight any category requirements not met
- Recent credits with status indicators
- Mobile-responsive design

---

### 4. Member Submit Credit (`/portal/ceu/submit.html`)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to CEU Dashboard                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SUBMIT CEU CREDIT                                               │
│                                                                  │
│  Complete the form below to submit continuing education          │
│  credits for verification by your organization.                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  Course/Activity Title *                                     ││
│  │  ┌─────────────────────────────────────────────────────┐    ││
│  │  │ Medical Ethics in Healthcare Settings               │    ││
│  │  └─────────────────────────────────────────────────────┘    ││
│  │                                                              ││
│  │  Provider/Organization *                                     ││
│  │  ┌─────────────────────────────────────────────────────┐    ││
│  │  │ American Medical Interpreters Association           │    ││
│  │  └─────────────────────────────────────────────────────┘    ││
│  │                                                              ││
│  │  ┌─────────────────────┐  ┌─────────────────────┐           ││
│  │  │ Credits Earned *    │  │ Category *          │           ││
│  │  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │           ││
│  │  │ │ 2.0             │ │  │ │ Ethics       ▼  │ │           ││
│  │  │ └─────────────────┘ │  │ └─────────────────┘ │           ││
│  │  └─────────────────────┘  └─────────────────────┘           ││
│  │                                                              ││
│  │  Completion Date *                                           ││
│  │  ┌─────────────────────────────────────────────────────┐    ││
│  │  │ 📅 December 15, 2024                                │    ││
│  │  └─────────────────────────────────────────────────────┘    ││
│  │                                                              ││
│  │  Certificate/Proof                                           ││
│  │  ┌─────────────────────────────────────────────────────┐    ││
│  │  │                                                     │    ││
│  │  │     📄  certificate_of_completion.pdf               │    ││
│  │  │         1.2 MB • PDF                                │    ││
│  │  │                                    [Remove]         │    ││
│  │  │                                                     │    ││
│  │  │  ─────────────────── or ───────────────────         │    ││
│  │  │                                                     │    ││
│  │  │  Certificate Number: [                        ]     │    ││
│  │  │                                                     │    ││
│  │  └─────────────────────────────────────────────────────┘    ││
│  │                                                              ││
│  │  Additional Notes (optional)                                 ││
│  │  ┌─────────────────────────────────────────────────────┐    ││
│  │  │                                                     │    ││
│  │  │                                                     │    ││
│  │  └─────────────────────────────────────────────────────┘    ││
│  │                                                              ││
│  │                              [Cancel]  [Submit for Review]   ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Clean, focused form layout
- Required field indicators
- Category dropdown populated from org settings
- File upload with drag-and-drop
- Alternative: certificate number for lookup
- Validation before submission

---

## Progress Ring Component

The centerpiece of the member dashboard is a beautiful SVG progress ring:

```html
<svg viewBox="0 0 100 100" class="progress-ring">
  <!-- Background circle -->
  <circle
    cx="50" cy="50" r="40"
    fill="none"
    stroke="var(--gray-200)"
    stroke-width="8"
  />
  <!-- Progress arc -->
  <circle
    cx="50" cy="50" r="40"
    fill="none"
    stroke="var(--green-500)"
    stroke-width="8"
    stroke-linecap="round"
    stroke-dasharray="251.2"
    stroke-dashoffset="94.2"  <!-- 251.2 * (1 - 0.625) -->
    transform="rotate(-90 50 50)"
  />
  <!-- Center text -->
  <text x="50" y="45" text-anchor="middle" class="progress-value">12.5</text>
  <text x="50" y="55" text-anchor="middle" class="progress-divider">────</text>
  <text x="50" y="65" text-anchor="middle" class="progress-total">20</text>
</svg>
```

**Color Logic:**
- Green: On track (>= 75% or plenty of time)
- Terracotta: Warning (< 50% or < 30 days)
- Red: Critical (overdue or < 25% with < 14 days)

---

## Database Additions

The current schema is sufficient, but we should add:

```sql
-- CEU Categories (org-configurable)
CREATE TABLE ceu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),  -- emoji or icon name
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tier CEU Requirements
CREATE TABLE tier_ceu_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_id UUID REFERENCES tiers(id) ON DELETE CASCADE,
  total_required DECIMAL(5,2) DEFAULT 0,
  category_id UUID REFERENCES ceu_categories(id) ON DELETE SET NULL,
  category_min DECIMAL(5,2) DEFAULT 0,  -- Minimum in this category
  UNIQUE(tier_id, category_id)
);
```

---

## API Endpoints to Add

```javascript
// CEU Settings (Admin)
GET    /api/v1/ceu/settings          // Get org CEU configuration
PUT    /api/v1/ceu/settings          // Update CEU settings

// CEU Categories (Admin)
GET    /api/v1/ceu/categories        // List categories
POST   /api/v1/ceu/categories        // Create category
PUT    /api/v1/ceu/categories/:id    // Update category
DELETE /api/v1/ceu/categories/:id    // Delete category

// CEU Credits (Admin)
GET    /api/v1/ceu/credits           // List all credits (with filters)
GET    /api/v1/ceu/credits/pending   // Pending verification queue
POST   /api/v1/ceu/credits/:id/verify    // Approve credit
POST   /api/v1/ceu/credits/:id/reject    // Reject credit
POST   /api/v1/ceu/credits/bulk-verify   // Bulk approve

// CEU Reporting (Admin)
GET    /api/v1/ceu/compliance        // Compliance report data
GET    /api/v1/ceu/at-risk           // Members at risk of non-compliance

// Member CEU (Portal)
GET    /api/v1/member/ceu/progress   // Current member's CEU progress
GET    /api/v1/member/ceu/credits    // Current member's credit history
POST   /api/v1/member/ceu/credits    // Submit credit for approval
GET    /api/v1/member/ceu/certificates  // Download certificates
```

---

## Implementation Order

1. **Admin CEU Settings Page** — Enable the feature, configure basics
2. **API Endpoints** — Settings, categories, credits CRUD
3. **Admin CEU Credits Page** — View/manage all credits
4. **Member CEU Dashboard** — Beautiful progress display
5. **Member Submit Credit** — Allow members to submit
6. **Admin Compliance Report** — Overview and at-risk

---

## Mobile Considerations

- Progress ring scales beautifully on all screens
- Category bars stack vertically on mobile
- Touch-friendly action buttons
- Pull-to-refresh on credit lists
- Bottom sheet for submit form on mobile (optional enhancement)

---

## Success Metrics

- Members can see their CEU progress instantly
- Admins can verify credits in < 30 seconds each
- 90%+ of members complete requirements before deadline
- Zero compliance surprises (system alerts before deadlines)

---

*Design Plan Created: December 2024*
