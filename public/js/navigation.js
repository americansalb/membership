/**
 * Universal Navigation Component
 * Automatically injects sidebar navigation and sets active states
 * Usage: Include this script in any admin page and call renderNavigation()
 */

const NAVIGATION_CONFIG = {
  logo: {
    text: 'VillageMembers',
    href: '/admin/'
  },
  sections: [
    {
      title: null, // Main section (no header)
      links: [
        {
          href: '/admin/',
          icon: '<rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect>',
          label: 'Dashboard'
        },
        {
          href: '/admin/analytics.html',
          icon: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>',
          label: 'Analytics'
        },
        {
          href: '/admin/members.html',
          icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
          label: 'Members'
        },
        {
          href: '/admin/tiers.html',
          icon: '<path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path>',
          label: 'Tiers'
        }
      ]
    },
    {
      title: 'CRM',
      links: [
        {
          href: '/admin/crm-dashboard.html',
          icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><circle cx="17" cy="7" r="4"></circle>',
          label: 'CRM Dashboard'
        },
        {
          href: '/admin/crm-list.html',
          icon: '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>',
          label: 'Contacts List'
        },
        {
          href: '/admin/crm-pipelines.html',
          icon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>',
          label: 'Pipelines'
        },
        {
          href: '/admin/crm-automations.html',
          icon: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>',
          label: 'Automations'
        }
      ]
    },
    {
      title: 'Credentials & CEU',
      links: [
        {
          href: '/admin/credentials.html',
          icon: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path>',
          label: 'Credentials'
        },
        {
          href: '/admin/ceu-credits.html',
          icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>',
          label: 'Review Credits'
        }
      ]
    },
    {
      title: 'Community',
      links: [
        {
          href: '/admin/moderation.html',
          icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
          label: 'Moderation'
        }
      ]
    },
    {
      title: 'Settings',
      links: [
        {
          href: '/admin/settings.html',
          icon: '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>',
          label: 'Settings'
        }
      ]
    }
  ]
};

/**
 * Generate SVG icon HTML
 */
function createIcon(paths) {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${paths}</svg>`;
}

/**
 * Check if a link is active based on current page
 */
function isLinkActive(href) {
  const currentPath = window.location.pathname;

  // Exact match for root
  if (href === '/admin/' && currentPath === '/admin/') {
    return true;
  }

  // For other pages, check if current path ends with the href
  if (href !== '/admin/') {
    const hrefFile = href.split('/').pop();
    const currentFile = currentPath.split('/').pop();
    return hrefFile === currentFile;
  }

  return false;
}

/**
 * Render a navigation link
 */
function renderLink(link) {
  const isActive = isLinkActive(link.href);
  const activeClass = isActive ? ' active' : '';

  return `
    <a href="${link.href}" class="sidebar-link${activeClass}">
      ${createIcon(link.icon)}
      ${link.label}
    </a>
  `;
}

/**
 * Render a navigation section
 */
function renderSection(section) {
  const header = section.title ? `<div class="sidebar-section">${section.title}</div>` : '';
  const links = section.links.map(renderLink).join('\n');

  return `${header}\n${links}`;
}

/**
 * Render the complete sidebar navigation
 */
function renderSidebar() {
  const sections = NAVIGATION_CONFIG.sections.map(renderSection).join('\n');

  return `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <a href="${NAVIGATION_CONFIG.logo.href}" style="color: white; font-size: var(--text-xl); font-weight: var(--font-bold);">${NAVIGATION_CONFIG.logo.text}</a>
      </div>
      <nav class="sidebar-nav">
        ${sections}
      </nav>
    </aside>
  `;
}

/**
 * Inject the navigation into the page
 * Call this function when the DOM is ready
 */
function renderNavigation() {
  // Find the admin-layout container
  const layout = document.querySelector('.admin-layout');

  if (!layout) {
    console.error('Navigation: .admin-layout container not found');
    return;
  }

  // Check if sidebar already exists
  if (layout.querySelector('.sidebar')) {
    console.warn('Navigation: Sidebar already exists, skipping injection');
    return;
  }

  // Inject the sidebar at the beginning of admin-layout
  layout.insertAdjacentHTML('afterbegin', renderSidebar());

  console.log('Navigation: Sidebar injected successfully');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderNavigation);
} else {
  renderNavigation();
}
