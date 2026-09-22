import { state } from './state.js';

const routes = {};

export function registerRoute(name, handler) {
  routes[name] = handler;
}

function getPageFromPath() {
  const path = window.location.pathname;
  const page = path.split('/').filter(Boolean)[0] || 'dashboard';
  return page;
}

function renderPage(page) {
  const container = document.getElementById('page-container');
  if (!container) return;

  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.classList.toggle('active', link.dataset.nav === page);
  });

  const userLink = document.querySelector('.sidebar__user[data-nav]');
  if (userLink) {
    userLink.classList.toggle('active', userLink.dataset.nav === page);
  }

  container.innerHTML = '<div class="skeleton-grid"><div class="skeleton skeleton--card"></div><div class="skeleton skeleton--card"></div><div class="skeleton skeleton--card"></div><div class="skeleton skeleton--card"></div></div>';

  requestAnimationFrame(() => {
    try {
      routes[page](container);
    } catch (err) {
      console.error(`Failed to render page "${page}":`, err);
      container.innerHTML = `
        <div class="alert alert--danger">
          <strong>Gagal memuat halaman ini.</strong> Buka DevTools (F12) → Console untuk detail.
        </div>
      `;
    }
  });

  if (window.innerWidth <= 768) {
    closeSidebar();
  }
}

export function navigate(page, { updatePath = true } = {}) {
  if (page === 'exams') {
    page = 'finance';
  }

  if (!routes[page]) {
    page = 'dashboard';
  }

  state.setPage(page);

  const currentPage = getPageFromPath();

  if (updatePath && currentPage !== page) {
    history.pushState({ page }, '', `/${page}`);
  }

  renderPage(page);
}

export function initRouter() {
  window.addEventListener('popstate', (e) => {
    const page = getPageFromPath();
    navigate(page, { updatePath: false });
  });

  document.querySelectorAll('[data-nav]').forEach(link => {
    const handler = (e) => {
      e.preventDefault();
      navigate(link.dataset.nav);
    };
    
    link.addEventListener('click', handler);
    // Add touch support for mobile
    if ('ontouchstart' in window) {
      link.addEventListener('touchstart', handler, { passive: false });
    }
  });

  // Update links to use clean paths
  document.querySelectorAll('[data-nav]').forEach(link => {
    const page = link.dataset.nav;
    link.href = `/${page}`;
  });

  const page = getPageFromPath();
  navigate(page, { updatePath: false });
}

export function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
  document.getElementById('sidebar-toggle').setAttribute('aria-expanded', 'false');
}

export function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('visible');
  document.getElementById('sidebar-toggle').setAttribute('aria-expanded', 'true');
}
