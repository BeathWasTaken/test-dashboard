import { state } from './state.js';

const routes = {};

export function registerRoute(name, handler) {
  routes[name] = handler;
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

export function navigate(page, { updateHash = true } = {}) {
  if (page === 'exams') {
    page = 'finance';
    if (updateHash) {
      window.location.hash = page;
      return;
    }
  }

  if (!routes[page]) {
    page = 'dashboard';
  }

  state.setPage(page);

  const currentHash = window.location.hash.slice(1) || 'dashboard';

  if (updateHash && currentHash !== page) {
    window.location.hash = page;
    return;
  }

  renderPage(page);
}

export function initRouter() {
  window.addEventListener('hashchange', () => {
    const page = window.location.hash.slice(1) || 'dashboard';
    navigate(page, { updateHash: false });
  });

  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.dataset.nav);
    });
  });

  const page = window.location.hash.slice(1) || 'dashboard';

  if (!window.location.hash) {
    history.replaceState(null, '', `#${page}`);
  }

  navigate(page, { updateHash: false });
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
