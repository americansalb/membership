/**
 * VillageKeep UI Utilities
 * Phase 1 & 2 improvements: Toast notifications, loading states, inline editing
 */

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
const Toast = {
  container: null,

  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', duration = 4000) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `ui-toast ui-toast-${type}`;
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--bg-primary, #fff);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 14px;
      color: var(--text-primary, #1a1a1a);
      pointer-events: auto;
      animation: toastSlideIn 0.3s ease;
      max-width: 400px;
    `;

    // Add color accent based on type
    const colors = {
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    toast.style.borderLeft = `4px solid ${colors[type] || colors.info}`;

    // Icon
    const icons = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    const iconSpan = document.createElement('span');
    iconSpan.style.color = colors[type] || colors.info;
    iconSpan.innerHTML = icons[type] || icons.info;

    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    textSpan.style.flex = '1';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: var(--gray-400, #9ca3af);
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeBtn.onclick = () => this.dismiss(toast);

    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);
    toast.appendChild(closeBtn);

    this.container.appendChild(toast);

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }

    return toast;
  },

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.animation = 'toastSlideOut 0.2s ease forwards';
    setTimeout(() => toast.remove(), 200);
  },

  success(message, duration) { return this.show(message, 'success', duration); },
  error(message, duration) { return this.show(message, 'error', duration); },
  warning(message, duration) { return this.show(message, 'warning', duration); },
  info(message, duration) { return this.show(message, 'info', duration); }
};

// Add toast animations to page
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  @keyframes toastSlideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes toastSlideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(toastStyles);

// Global toast shorthand
window.toast = Toast;


// ============================================
// LOADING BUTTON STATES
// ============================================
const LoadingButton = {
  originalStates: new WeakMap(),

  start(button, loadingText = 'Loading...') {
    if (!button || button.disabled) return;

    // Store original state
    this.originalStates.set(button, {
      html: button.innerHTML,
      disabled: button.disabled,
      width: button.offsetWidth
    });

    // Set fixed width to prevent jumping
    button.style.minWidth = button.offsetWidth + 'px';
    button.disabled = true;
    button.innerHTML = `
      <span class="btn-spinner" style="
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: btnSpin 0.6s linear infinite;
      "></span>
      <span>${loadingText}</span>
    `;
  },

  stop(button, successText = null) {
    if (!button) return;

    const original = this.originalStates.get(button);
    if (!original) return;

    if (successText) {
      // Show success state briefly
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--success, #22c55e)">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>${successText}</span>
      `;
      button.style.color = 'var(--success, #22c55e)';

      setTimeout(() => {
        button.innerHTML = original.html;
        button.disabled = original.disabled;
        button.style.minWidth = '';
        button.style.color = '';
      }, 1500);
    } else {
      button.innerHTML = original.html;
      button.disabled = original.disabled;
      button.style.minWidth = '';
    }

    this.originalStates.delete(button);
  },

  error(button) {
    if (!button) return;

    const original = this.originalStates.get(button);
    if (!original) return;

    button.innerHTML = original.html;
    button.disabled = original.disabled;
    button.style.minWidth = '';

    // Brief shake animation
    button.style.animation = 'btnShake 0.5s ease';
    setTimeout(() => button.style.animation = '', 500);

    this.originalStates.delete(button);
  }
};

// Add button animations
const btnStyles = document.createElement('style');
btnStyles.textContent = `
  @keyframes btnSpin {
    to { transform: rotate(360deg); }
  }
  @keyframes btnShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
`;
document.head.appendChild(btnStyles);

window.loadingBtn = LoadingButton;


// ============================================
// SKELETON LOADING
// ============================================
const Skeleton = {
  // Generate skeleton HTML for table rows
  tableRows(count = 5, columns = 6) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += '<tr class="skeleton-row">';
      for (let j = 0; j < columns; j++) {
        if (j === 0) {
          // Checkbox column
          html += '<td style="padding-left:var(--space-phi-md, 13px)"><div class="skeleton" style="width:16px;height:16px;border-radius:4px;"></div></td>';
        } else if (j === 1) {
          // Member cell with avatar
          html += `
            <td>
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="skeleton" style="width:40px;height:40px;border-radius:50%;"></div>
                <div>
                  <div class="skeleton" style="width:${120 + Math.random() * 60}px;height:14px;margin-bottom:6px;"></div>
                  <div class="skeleton" style="width:${100 + Math.random() * 40}px;height:12px;"></div>
                </div>
              </div>
            </td>`;
        } else {
          // Regular cell
          const width = 60 + Math.random() * 40;
          html += `<td><div class="skeleton" style="width:${width}px;height:14px;"></div></td>`;
        }
      }
      html += '</tr>';
    }
    return html;
  },

  // Generate skeleton for cards
  card(count = 4) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card" style="background:var(--bg-primary,#fff);border:1px solid var(--border-color,#e5e7eb);border-radius:12px;padding:20px;">
          <div class="skeleton" style="width:40%;height:12px;margin-bottom:12px;"></div>
          <div class="skeleton" style="width:60%;height:24px;margin-bottom:8px;"></div>
          <div class="skeleton" style="width:30%;height:12px;"></div>
        </div>
      `;
    }
    return html;
  },

  // Generate skeleton for credentials list
  credentials(count = 2) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div style="display:flex;align-items:center;gap:16px;padding:12px;background:var(--bg-secondary,#f9fafb);border-radius:8px;margin-bottom:12px;">
          <div class="skeleton" style="width:64px;height:64px;border-radius:50%;"></div>
          <div style="flex:1;">
            <div class="skeleton" style="width:60%;height:14px;margin-bottom:8px;"></div>
            <div class="skeleton" style="width:80%;height:12px;"></div>
          </div>
        </div>
      `;
    }
    return html;
  },

  // Generate skeleton for activity timeline
  timeline(count = 4) {
    let html = '<div class="skeleton-timeline">';
    for (let i = 0; i < count; i++) {
      html += `
        <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-color,#e5e7eb);">
          <div class="skeleton" style="width:32px;height:32px;border-radius:50%;flex-shrink:0;"></div>
          <div style="flex:1;">
            <div class="skeleton" style="width:70%;height:14px;margin-bottom:8px;"></div>
            <div class="skeleton" style="width:40%;height:12px;"></div>
          </div>
        </div>
      `;
    }
    html += '</div>';
    return html;
  }
};

// Add skeleton styles
const skeletonStyles = document.createElement('style');
skeletonStyles.textContent = `
  .skeleton {
    background: linear-gradient(90deg, var(--gray-200, #e5e7eb) 25%, var(--gray-100, #f3f4f6) 50%, var(--gray-200, #e5e7eb) 75%);
    background-size: 200% 100%;
    animation: skeletonShimmer 1.5s infinite;
    border-radius: 4px;
  }
  @keyframes skeletonShimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .skeleton-row td {
    padding: 16px 20px !important;
  }
`;
document.head.appendChild(skeletonStyles);

window.skeleton = Skeleton;


// ============================================
// INLINE FIELD EDITING
// ============================================
const InlineEdit = {
  activeEditor: null,

  // Make a field editable
  create(element, options = {}) {
    const {
      value = element.textContent,
      type = 'text',
      onSave = null,
      onCancel = null,
      placeholder = 'Enter value...'
    } = options;

    // Close any existing editor
    if (this.activeEditor) {
      this.cancel();
    }

    const originalContent = element.innerHTML;
    const originalValue = value;

    // Create editor
    const editor = document.createElement('div');
    editor.className = 'inline-editor';
    editor.style.cssText = 'display:flex;align-items:center;gap:8px;';

    let input;
    if (type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 3;
    } else if (type === 'select' && options.choices) {
      input = document.createElement('select');
      options.choices.forEach(choice => {
        const opt = document.createElement('option');
        opt.value = typeof choice === 'object' ? choice.value : choice;
        opt.textContent = typeof choice === 'object' ? choice.label : choice;
        if (opt.value === value) opt.selected = true;
        input.appendChild(opt);
      });
    } else {
      input = document.createElement('input');
      input.type = type;
    }

    input.className = 'input';
    input.value = value;
    input.placeholder = placeholder;
    input.style.cssText = 'flex:1;padding:6px 10px;font-size:14px;';

    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    saveBtn.className = 'btn btn-primary btn-sm';
    saveBtn.style.padding = '6px';
    saveBtn.title = 'Save (Enter)';

    const cancelBtn = document.createElement('button');
    cancelBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    cancelBtn.className = 'btn btn-ghost btn-sm';
    cancelBtn.style.padding = '6px';
    cancelBtn.title = 'Cancel (Esc)';

    editor.appendChild(input);
    editor.appendChild(saveBtn);
    editor.appendChild(cancelBtn);

    // Replace content
    element.innerHTML = '';
    element.appendChild(editor);

    // Focus input
    input.focus();
    if (input.select) input.select();

    // Store state
    this.activeEditor = {
      element,
      input,
      originalContent,
      originalValue,
      onSave,
      onCancel
    };

    // Event handlers
    const save = async () => {
      const newValue = input.value;
      if (newValue === originalValue) {
        this.cancel();
        return;
      }

      // Show loading state
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="btn-spinner" style="display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:btnSpin 0.6s linear infinite;"></span>';

      try {
        if (onSave) {
          await onSave(newValue);
        }
        // Update element with new value
        element.innerHTML = '';
        element.textContent = newValue || placeholder;
        if (!newValue) element.style.color = 'var(--gray-400)';
        toast.success('Saved');
      } catch (err) {
        toast.error(err.message || 'Failed to save');
        element.innerHTML = originalContent;
      }

      this.activeEditor = null;
    };

    const cancel = () => {
      element.innerHTML = originalContent;
      if (onCancel) onCancel();
      this.activeEditor = null;
    };

    saveBtn.onclick = save;
    cancelBtn.onclick = cancel;

    input.onkeydown = (e) => {
      if (e.key === 'Enter' && type !== 'textarea') {
        e.preventDefault();
        save();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    };

    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!editor.contains(e.target)) {
          cancel();
          document.removeEventListener('click', handler);
        }
      });
    }, 0);
  },

  cancel() {
    if (this.activeEditor) {
      this.activeEditor.element.innerHTML = this.activeEditor.originalContent;
      if (this.activeEditor.onCancel) this.activeEditor.onCancel();
      this.activeEditor = null;
    }
  }
};

window.inlineEdit = InlineEdit;


// ============================================
// CONFIRMATION DIALOG
// ============================================
const Confirm = {
  show(options = {}) {
    const {
      title = 'Confirm',
      message = 'Are you sure?',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      danger = false,
      details = null
    } = options;

    return new Promise((resolve) => {
      // Create backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'confirm-backdrop';
      backdrop.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(2px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: confirmFadeIn 0.2s ease;
      `;

      // Create dialog
      const dialog = document.createElement('div');
      dialog.className = 'confirm-dialog';
      dialog.style.cssText = `
        background: var(--bg-primary, #fff);
        border-radius: 12px;
        box-shadow: 0 25px 50px rgba(0,0,0,0.25);
        max-width: 400px;
        width: calc(100% - 32px);
        animation: confirmSlideIn 0.2s ease;
      `;

      dialog.innerHTML = `
        <div style="padding: 24px;">
          <div style="display: flex; align-items: flex-start; gap: 16px;">
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: ${danger ? 'var(--error-light, #fee2e2)' : 'var(--warning-light, #fef3c7)'};
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${danger ? 'var(--error, #ef4444)' : 'var(--warning, #f59e0b)'}" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 8px;">${title}</h3>
              <p style="color: var(--text-secondary, #6b7280); margin: 0; font-size: 14px; line-height: 1.5;">${message}</p>
              ${details ? `<div style="margin-top: 12px; padding: 12px; background: var(--bg-secondary, #f9fafb); border-radius: 8px; font-size: 13px; color: var(--text-secondary);">${details}</div>` : ''}
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid var(--border-color, #e5e7eb); background: var(--bg-secondary, #f9fafb); border-radius: 0 0 12px 12px;">
          <button class="confirm-cancel btn btn-secondary">${cancelText}</button>
          <button class="confirm-ok btn ${danger ? 'btn-danger' : 'btn-primary'}">${confirmText}</button>
        </div>
      `;

      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);

      // Focus confirm button
      const confirmBtn = dialog.querySelector('.confirm-ok');
      const cancelBtn = dialog.querySelector('.confirm-cancel');
      confirmBtn.focus();

      const close = (result) => {
        backdrop.style.animation = 'confirmFadeOut 0.15s ease forwards';
        setTimeout(() => backdrop.remove(), 150);
        resolve(result);
      };

      confirmBtn.onclick = () => close(true);
      cancelBtn.onclick = () => close(false);
      backdrop.onclick = (e) => {
        if (e.target === backdrop) close(false);
      };
      document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') {
          close(false);
          document.removeEventListener('keydown', handler);
        }
      });
    });
  },

  async danger(title, message, confirmText = 'Delete') {
    return this.show({ title, message, confirmText, danger: true });
  }
};

// Add confirm styles
const confirmStyles = document.createElement('style');
confirmStyles.textContent = `
  @keyframes confirmFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes confirmFadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes confirmSlideIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;
document.head.appendChild(confirmStyles);

window.confirm2 = Confirm;


// ============================================
// QUICK ACTIONS DROPDOWN
// ============================================
const QuickActions = {
  show(event, actions, options = {}) {
    event.stopPropagation();

    // Remove any existing dropdown
    const existing = document.querySelector('.quick-actions-dropdown');
    if (existing) existing.remove();

    const dropdown = document.createElement('div');
    dropdown.className = 'quick-actions-dropdown';
    dropdown.style.cssText = `
      position: fixed;
      background: var(--bg-primary, #fff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      min-width: 160px;
      z-index: 1000;
      animation: quickActionsIn 0.15s ease;
    `;

    actions.forEach(action => {
      if (action.divider) {
        const divider = document.createElement('div');
        divider.style.cssText = 'height: 1px; background: var(--border-color, #e5e7eb); margin: 4px 0;';
        dropdown.appendChild(divider);
        return;
      }

      const item = document.createElement('button');
      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 14px;
        font-size: 14px;
        color: ${action.danger ? 'var(--error, #ef4444)' : 'var(--text-primary, #1a1a1a)'};
        background: none;
        border: none;
        cursor: pointer;
        text-align: left;
        transition: background 0.1s;
      `;
      item.onmouseenter = () => item.style.background = 'var(--bg-secondary, #f9fafb)';
      item.onmouseleave = () => item.style.background = 'none';

      if (action.icon) {
        const iconSpan = document.createElement('span');
        iconSpan.style.cssText = 'display: flex; align-items: center;';
        iconSpan.innerHTML = action.icon;
        item.appendChild(iconSpan);
      }

      const label = document.createElement('span');
      label.textContent = action.label;
      item.appendChild(label);

      item.onclick = () => {
        dropdown.remove();
        if (action.onClick) action.onClick();
      };

      dropdown.appendChild(item);
    });

    document.body.appendChild(dropdown);

    // Position dropdown
    const rect = event.target.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();

    let left = rect.right - dropdownRect.width;
    let top = rect.bottom + 4;

    // Adjust if off screen
    if (left < 8) left = 8;
    if (top + dropdownRect.height > window.innerHeight - 8) {
      top = rect.top - dropdownRect.height - 4;
    }

    dropdown.style.left = left + 'px';
    dropdown.style.top = top + 'px';

    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', function handler() {
        dropdown.remove();
        document.removeEventListener('click', handler);
      });
    }, 0);

    return dropdown;
  }
};

// Add quick actions styles
const qaStyles = document.createElement('style');
qaStyles.textContent = `
  @keyframes quickActionsIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(qaStyles);

window.quickActions = QuickActions;


// ============================================
// Utility: Format relative time
// ============================================
function formatRelativeTime(date) {
  if (typeof date === 'string') date = new Date(date);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

window.formatRelativeTime = formatRelativeTime;


// ============================================
// Utility: Format currency
// ============================================
function formatCurrency(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
}

window.formatCurrency = formatCurrency;


// ============================================
// Utility: Escape HTML
// ============================================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.escapeHtml = escapeHtml;

console.log('UI Utils loaded');
