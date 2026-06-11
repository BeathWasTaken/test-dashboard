import { state } from './state.js';
import { initRouter, openSidebar, closeSidebar } from './router.js';
import { debounce } from './utils.js';
import { showToast } from './components/toast.js';

import { initDashboard } from './modules/dashboard.js';
import { initGrades } from './modules/grades.js';
import { initSchedule } from './modules/schedule.js';
import { initAssignments } from './modules/assignments.js';
import { initFinance } from './modules/finance.js';
import { initAttendance } from './modules/attendance.js';
import { initGoals } from './modules/goals.js';
import { initSettings, applyTheme, updateSidebarUser } from './modules/settings.js';
import { initNotifications, initNotificationPanel, generateNotifications } from './modules/notifications.js';

function initSplash() {
  return new Promise((resolve) => {
    const splash = document.getElementById('splash');
    const app = document.getElementById('app');

    const finish = () => {
      splash.classList.add('fade-out');
      app.classList.remove('hidden');
      app.removeAttribute('aria-hidden');
      setTimeout(() => {
        splash.remove();
        resolve();
      }, 400);
    };

    setTimeout(finish, 900);
  });
}

function initSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const close = document.getElementById('sidebar-close');
  const overlay = document.getElementById('sidebar-overlay');

  // Add both click and touchstart for better mobile responsiveness
  const addTouchEvents = (element, handler) => {
    if (element) {
      element.addEventListener('click', handler);
      element.addEventListener('touchstart', handler, { passive: true });
    }
  };

  addTouchEvents(toggle, () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  addTouchEvents(close, closeSidebar);
  addTouchEvents(overlay, closeSidebar);
}

function initTheme() {
  const theme = state.get().settings.theme || 'light';
  applyTheme(theme);

  const themeToggle = document.getElementById('theme-toggle');
  const handler = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    state.updateSettings({ theme: next });
  };

  themeToggle.addEventListener('click', handler);
  // Add touch support for mobile
  if ('ontouchstart' in window) {
    themeToggle.addEventListener('touchstart', handler, { passive: true });
  }
}

function initGlobalSearch() {
  const input = document.getElementById('global-search');
  const debouncedSearch = debounce((query) => {
    if (!query) return;
    const data = state.get();
    const q = query.toLowerCase();

    const courseMatch = data.courses.find(c => c.name.toLowerCase().includes(q));
    if (courseMatch) {
      window.location.hash = 'grades';
      return;
    }

    const assignMatch = data.assignments.find(a =>
      a.title.toLowerCase().includes(q) || a.course.toLowerCase().includes(q)
    );
    if (assignMatch) {
      window.location.hash = 'assignments';
      return;
    }

    const txMatch = (data.transactions || []).find(t =>
      t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    );
    if (txMatch) {
      window.location.hash = 'finance';
      return;
    }

    showToast('Tidak ada hasil ditemukan', 'info');
  }, 400);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      debouncedSearch(input.value.trim());
    }
  });
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;

    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      document.getElementById('global-search').focus();
    }

    if (e.key === 'Escape') {
      closeSidebar();
      document.getElementById('notification-panel')?.classList.add('hidden');
    }
  });
}

function handleResize() {
  if (window.innerWidth > 768) {
    closeSidebar();
  }

  const container = document.getElementById('page-container');
  if (container) {
    import('./components/charts.js').then(({ initCharts }) => {
      initCharts(container);
    });
  }
}

async function init() {
  applyTheme(state.get().settings?.theme || 'light');

  initDashboard();
  initGrades();
  initSchedule();
  initAssignments();
  initFinance();
  initAttendance();
  initGoals();
  initSettings();
  initNotifications();

  await initSplash();

  applyTheme(state.get().settings.theme || 'light');
  updateSidebarUser();
  initSidebar();
  initTheme();
  initGlobalSearch();
  initNotificationPanel();
  initKeyboardShortcuts();
  initRouter();

  generateNotifications();

  window.addEventListener('resize', debounce(handleResize, 250));

  state.subscribe(() => {
    updateSidebarUser();
  });
}

document.addEventListener('DOMContentLoaded', init);
