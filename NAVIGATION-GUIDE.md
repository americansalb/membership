# Universal Navigation System

## Overview

Your admin pages now use a **universal navigation component** that eliminates duplicate code and makes navigation management effortless.

### Before (The Problem)
- Sidebar HTML copy-pasted across 15 different files
- Updating navigation meant editing 15 files
- Active states had to be manually set on each page
- High risk of inconsistencies

### After (The Solution)
- Sidebar defined **once** in `public/js/navigation.js`
- Automatically injected into every admin page
- Active states detected automatically
- Update navigation in **one place**

---

## How It Works

### 1. The Navigation Component (`public/js/navigation.js`)

This file contains:
- `NAVIGATION_CONFIG` - The complete navigation structure
- Auto-injection logic that adds the sidebar to any page with `.admin-layout`
- Active state detection based on current URL

### 2. In Your HTML Files

Each admin page simply includes:

```html
<body>
  <div class="admin-layout">
    <!-- Sidebar injected by navigation.js -->

    <main class="admin-main">
      <!-- Your page content -->
    </main>
  </div>

  <!-- Scripts -->
  <script src="/js/navigation.js"></script>
  <script src="/js/app.js"></script>
  <!-- Other scripts -->
</body>
```

The `navigation.js` script automatically:
1. Detects the `.admin-layout` container
2. Injects the complete sidebar HTML
3. Highlights the active page

---

## Adding a New Menu Item

Edit `public/js/navigation.js` and add your link to the appropriate section:

```javascript
const NAVIGATION_CONFIG = {
  sections: [
    {
      title: 'CRM',
      links: [
        {
          href: '/admin/crm-dashboard.html',
          icon: '<path d="...">',  // SVG path
          label: 'CRM Dashboard'
        },
        // Add your new link here
        {
          href: '/admin/crm-reports.html',
          icon: '<rect x="3" y="3" width="18" height="18"></rect>',
          label: 'CRM Reports'
        }
      ]
    }
  ]
};
```

**That's it!** The new menu item appears on all pages instantly.

---

## Adding a New Section

To add a completely new navigation section:

```javascript
const NAVIGATION_CONFIG = {
  sections: [
    // ... existing sections ...
    {
      title: 'Reports',  // New section
      links: [
        {
          href: '/admin/reports-overview.html',
          icon: '<circle cx="12" cy="12" r="10"></circle>',
          label: 'Overview'
        },
        {
          href: '/admin/reports-export.html',
          icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>',
          label: 'Export Data'
        }
      ]
    }
  ]
};
```

---

## Finding SVG Icons

The navigation uses [Feather Icons](https://feathericons.com/) SVG paths.

1. Go to https://feathericons.com/
2. Search for an icon (e.g., "chart")
3. Click the icon to view its SVG
4. Copy everything between `<svg>` and `</svg>` tags
5. Paste into the `icon` field

Example:
```html
<!-- Full Feather Icon SVG: -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="12" y1="5" x2="12" y2="19"></line>
  <line x1="5" y1="12" x2="19" y2="12"></line>
</svg>

<!-- You only need this part: -->
icon: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'
```

---

## Customizing the Logo

Edit the `logo` section in `navigation.js`:

```javascript
const NAVIGATION_CONFIG = {
  logo: {
    text: 'YourBrand',  // Change this
    href: '/admin/'
  },
  // ...
};
```

---

## Active State Logic

The navigation automatically highlights the current page by comparing:
- Current URL path (e.g., `/admin/crm-dashboard.html`)
- Each link's `href` in the config

**It works automatically** - no manual configuration needed!

---

## Adding Navigation to a New Page

When creating a new admin page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Your New Page</title>
  <!-- Styles -->
  <link rel="stylesheet" href="/css/variables.css">
  <link rel="stylesheet" href="/css/components.css">

  <style>
    .admin-layout { display: flex; min-height: 100vh; }
    .admin-main {
      flex: 1;
      margin-left: var(--sidebar-width);
      background-color: var(--bg-secondary);
    }
  </style>
</head>
<body>
  <div class="admin-layout">
    <!-- Sidebar injected by navigation.js -->

    <main class="admin-main">
      <h1>Your Content Here</h1>
    </main>
  </div>

  <!-- Include navigation.js FIRST -->
  <script src="/js/navigation.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>
```

**Important**: Always include `navigation.js` before other scripts.

---

## Troubleshooting

### Navigation not appearing?
- Check that `.admin-layout` container exists
- Verify `navigation.js` is included before page scripts
- Open browser console and look for errors

### Active state not working?
- Check that the `href` in navigation.js exactly matches the page URL
- For the dashboard (/admin/), the logic checks for exact match
- For other pages, it matches the filename

### Want to temporarily hide a menu item?
Add a condition in navigation.js:

```javascript
links: [
  {
    href: '/admin/beta-feature.html',
    icon: '...',
    label: 'Beta Feature',
    // Add this to hide it:
    hidden: true  // Or use environment check
  }
].filter(link => !link.hidden)  // Filter out hidden items
```

---

## Benefits Summary

✅ **Single Source of Truth**: Navigation defined in one file
✅ **Automatic Active States**: No manual class management
✅ **Consistent UX**: Same navigation on every page
✅ **Easy Updates**: Change once, updates everywhere
✅ **Less Code**: 443 lines removed from HTML files
✅ **Maintainable**: Clear structure in navigation.js

---

## File Locations

- **Navigation Component**: `public/js/navigation.js`
- **Admin Pages**: `public/admin/*.html`
- **Styles**: `public/css/components.css` (sidebar styles)

Need to update navigation? Edit `navigation.js`. That's it!
