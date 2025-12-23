/**
 * VillageKeep - Core App JavaScript
 */

// Dark mode toggle
function initDarkMode() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const stored = localStorage.getItem('theme');

  if (stored === 'dark' || (!stored && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Toast notifications
const toast = {
  container: null,

  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', duration = 5000) {
    this.init();

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.innerHTML = `
      <span class="toast-content">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    this.container.appendChild(toastEl);

    // Auto-dismiss success toasts
    if (type === 'success' && duration > 0) {
      setTimeout(() => {
        toastEl.classList.add('toast-dismissing');
        setTimeout(() => toastEl.remove(), 200);
      }, duration);
    }
  },

  success(message) {
    this.show(message, 'success', 3000);
  },

  error(message) {
    this.show(message, 'error', 0); // Errors stay until dismissed
  },

  warning(message) {
    this.show(message, 'warning', 5000);
  },

  info(message) {
    this.show(message, 'info', 5000);
  }
};

// Modal helpers
function openModal(modalId) {
  const backdrop = document.getElementById(modalId + '-backdrop');
  const modal = document.getElementById(modalId);
  if (backdrop) backdrop.classList.add('open');
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const backdrop = document.getElementById(modalId + '-backdrop');
  const modal = document.getElementById(modalId);
  if (backdrop) backdrop.classList.remove('open');
  if (modal) modal.classList.remove('open');
}

// Form helpers
function setLoading(button, loading = true) {
  if (loading) {
    button.classList.add('btn-loading');
    button.disabled = true;
  } else {
    button.classList.remove('btn-loading');
    button.disabled = false;
  }
}

function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(inputId + '-error');

  if (input) input.classList.add('input-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function clearError(inputId) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(inputId + '-error');

  if (input) input.classList.remove('input-error');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
}

function clearAllErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  form.querySelectorAll('.error-text').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
});

// Export for use
window.toast = toast;
window.openModal = openModal;
window.closeModal = closeModal;
window.setLoading = setLoading;
window.showError = showError;
window.clearError = clearError;
window.clearAllErrors = clearAllErrors;
window.toggleDarkMode = toggleDarkMode;
