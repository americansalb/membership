# VillageKeep Design Plan

## Brand Colors (From Logo)

```css
:root {
    /* Primary - Navy (tower/protection) */
    --navy-50: #f0f4f8;
    --navy-100: #d9e2ec;
    --navy-200: #bcccdc;
    --navy-300: #9fb3c8;
    --navy-400: #829ab1;
    --navy-500: #627d98;
    --navy-600: #486581;
    --navy-700: #334e68;
    --navy-800: #243b53;
    --navy-900: #102a43;

    /* Accent - Burnt Orange (homes/warmth) */
    --orange-50: #fff3eb;
    --orange-100: #ffe4d1;
    --orange-200: #ffc9a3;
    --orange-300: #ffad75;
    --orange-400: #ff9147;
    --orange-500: #c45a2c;
    --orange-600: #a34a24;
    --orange-700: #823b1c;
    --orange-800: #612c15;
    --orange-900: #401d0e;

    /* Semantic */
    --success: #10b981;
    --warning: #f59e0b;
    --error: #ef4444;
    --info: #3b82f6;
}
```

## Typography

- **Headings:** Inter (clean, modern, professional)
- **Body:** Inter
- **Monospace:** JetBrains Mono (for codes, API keys)

```css
/* Font Scale */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

---

## Core Components

### 1. Buttons

```
Primary:    bg-navy-800 hover:bg-navy-900 text-white
Secondary:  bg-white border-navy-300 hover:bg-navy-50 text-navy-800
Accent:     bg-orange-500 hover:bg-orange-600 text-white
Ghost:      hover:bg-navy-100 text-navy-700
Danger:     bg-red-500 hover:bg-red-600 text-white
```

### 2. Cards

```
Default:    bg-white rounded-xl shadow-sm border border-gray-200
Elevated:   bg-white rounded-xl shadow-lg
Interactive: hover:shadow-md hover:-translate-y-0.5 transition-all
```

### 3. Forms

```
Input:      border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500
Label:      text-sm font-medium text-gray-700
Helper:     text-sm text-gray-500
Error:      text-sm text-red-600 + border-red-500 on input
```

### 4. Tables

```
Header:     bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase
Row:        hover:bg-gray-50 border-b border-gray-200
Cell:       px-6 py-4 text-sm text-gray-900
```

### 5. Navigation

```
Sidebar:    bg-navy-900 text-white w-64
Active:     bg-navy-800 border-l-4 border-orange-500
Hover:      bg-navy-800/50
```

### 6. Badges/Pills

```
Default:    bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm
Success:    bg-green-100 text-green-800
Warning:    bg-yellow-100 text-yellow-800
Error:      bg-red-100 text-red-800
Info:       bg-blue-100 text-blue-800
```

---

## Page Layouts

### Public Pages (Marketing)

```
┌─────────────────────────────────────────────────────────────┐
│  Logo          Features  Pricing  Login  [Get Started]      │  ← Header
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      Hero Section                           │
│              Headline + CTA + Social Proof                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Content Sections                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Logo   Links   Social   Legal                              │  ← Footer
└─────────────────────────────────────────────────────────────┘
```

### Admin Dashboard

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  Breadcrumb              Search    Notifications │
│  Logo    ├──────────────────────────────────────────────────┤
│          │                                                  │
│  Nav     │  Page Title              [Actions]               │
│  ────    │                                                  │
│  Dashboard│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  Members │  │ Stat 1  │ │ Stat 2  │ │ Stat 3  │           │
│  Tiers   │  └─────────┘ └─────────┘ └─────────┘           │
│  Content │                                                  │
│  CEU     │  ┌───────────────────────────────────────────┐  │
│  Reports │  │                                           │  │
│  ────    │  │              Main Content                 │  │
│  Settings│  │              (Table/Cards/Form)           │  │
│          │  │                                           │  │
│          │  └───────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────┘
```

### Member Portal

```
┌─────────────────────────────────────────────────────────────┐
│  Logo        Dashboard  CEU  Resources  Account  [Logout]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome, [Name]!                    Membership: [Tier]     │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────────────┐│
│  │                  │  │                                  ││
│  │  CEU Progress    │  │  Recent Activity                 ││
│  │  ██████░░ 60%    │  │  - Completed Course X            ││
│  │                  │  │  - Earned 2.0 CEU                ││
│  └──────────────────┘  └──────────────────────────────────┘│
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Available Resources                                   │ │
│  │  [Card] [Card] [Card] [Card]                          │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Screens

### Phase 1 (MVP)
1. Landing page (marketing)
2. Login/Register
3. Admin: Dashboard
4. Admin: Members list
5. Admin: Member detail
6. Admin: Tiers management

### Phase 2 (Billing)
7. Public: Pricing page
8. Checkout flow
9. Member: Account/billing
10. Admin: Revenue dashboard

### Phase 3 (CEU)
11. Admin: CEU configuration
12. Admin: Credit approval queue
13. Member: CEU dashboard
14. Member: Certificate view
15. Reports: Compliance

### Phase 4+ (Later)
16. Webhook configuration
17. API keys management
18. Team management
19. Events
20. Directory

---

## Responsive Breakpoints

```css
/* Mobile first */
sm: 640px   /* Large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Mobile Adaptations
- Sidebar → Bottom nav or hamburger menu
- Tables → Card list view
- Multi-column → Single column stack
- Reduce padding/margins

---

## Interaction Patterns

### Loading States
- Skeleton loaders for content
- Spinner for actions
- Progress bar for multi-step

### Empty States
- Illustration + message + CTA
- "No members yet. Invite your first member →"

### Error States
- Inline validation on forms
- Toast notifications for actions
- Full-page error for critical failures

### Success States
- Toast: "Member added successfully"
- Redirect + success message
- Confetti for milestones (optional)

---

## Dark Mode

Support dark mode from day 1 (same as LMS):

```css
.dark {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    /* Navy becomes lighter in dark mode */
    /* Orange stays vibrant */
}
```

---

## File Structure

```
public/
├── index.html              # Landing page
├── login.html              # Auth
├── pricing.html            # Public pricing
├── css/
│   ├── tailwind.css        # Design system + custom styles
│   └── components.css      # Reusable component classes
├── js/
│   ├── app.js              # Shared utilities
│   ├── auth.js             # Authentication
│   └── api.js              # API client
├── admin/
│   ├── index.html          # Dashboard
│   ├── members.html        # Members list
│   ├── member.html         # Member detail
│   ├── tiers.html          # Tier management
│   ├── ceu.html            # CEU management
│   ├── reports.html        # Reports
│   └── settings.html       # Org settings
└── portal/
    ├── index.html          # Member dashboard
    ├── ceu.html            # CEU progress
    ├── resources.html      # Available resources
    └── account.html        # Account management
```

---

## Design Principles

1. **Clean over clever** - No unnecessary decoration
2. **Consistent spacing** - 4px grid (4, 8, 12, 16, 24, 32, 48, 64)
3. **Clear hierarchy** - One primary action per screen
4. **Accessible** - WCAG 2.1 AA compliance
5. **Fast** - No heavy images, minimal JS
6. **Familiar** - Follow conventions, don't reinvent

---

## Comparison: Wild Apricot vs VillageKeep

| Aspect | Wild Apricot | VillageKeep |
|--------|--------------|-------------|
| Color | Dated blue/gray | Modern navy + warm orange |
| Typography | Small, cramped | Generous, readable |
| Whitespace | Cluttered | Breathing room |
| Cards | Flat, boxy | Subtle shadows, rounded |
| Navigation | Overwhelming menus | Clean sidebar |
| Mobile | Afterthought | First-class |
| Dark mode | None | Full support |
| Loading | Jarring refreshes | Smooth transitions |
