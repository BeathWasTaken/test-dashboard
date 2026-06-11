import { state } from '../state.js';
import { registerRoute } from '../router.js';
import { showToast } from '../components/toast.js';
import { importData, resetData } from '../storage.js';
import { exportDataToExcel } from '../export-excel.js';
import { importDataFromExcel } from '../import-excel.js';
import { confirmDialog } from '../components/modal.js';
import { escapeHtml, getInitials, resizeAvatarImage } from '../utils.js';

export function initSettings() {
  registerRoute('settings', renderSettings);
}

function renderSettings(container) {
  const data = state.get();
  const { profile, settings } = data;

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-header__top">
          <div>
            <h1 class="page-header__title">Pengaturan</h1>
            <p class="page-header__subtitle">Kelola profil, preferensi, dan data Anda</p>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="settings-section__title">Profil</h2>
        <div class="card">
          <div class="profile-avatar-section">
            <div class="profile-avatar-preview" id="profile-avatar-preview">
              ${profile.avatar
                ? `<img src="${profile.avatar}" alt="Foto profil" class="profile-avatar-preview__img">`
                : `<span class="profile-avatar-preview__initials">${getInitials(profile.name)}</span>`}
            </div>
            <div class="profile-avatar-actions">
              <label class="btn btn-secondary btn-sm" style="cursor:pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                Ubah Foto
                <input type="file" id="profile-avatar-input" accept="image/*" hidden>
              </label>
              ${profile.avatar ? '<button type="button" class="btn btn-ghost btn-sm" id="remove-avatar-btn" style="color:var(--color-danger)">Hapus Foto</button>' : ''}
            </div>
          </div>
          <form id="profile-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="profile-name">Nama Lengkap</label>
                <input class="form-input" id="profile-name" type="text" value="${escapeHtml(profile.name)}" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="profile-id">NIM</label>
                <input class="form-input" id="profile-id" type="text" value="${escapeHtml(profile.studentId || '')}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="profile-major">Program Studi</label>
                <input class="form-input" id="profile-major" type="text" value="${escapeHtml(profile.major || '')}">
              </div>
              <div class="form-group">
                <label class="form-label" for="profile-semester">Semester Aktif</label>
                <input class="form-input" id="profile-semester" type="number" min="1" max="14" value="${profile.semester}">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="profile-email">Email</label>
              <input class="form-input" id="profile-email" type="email" value="${escapeHtml(profile.email || '')}">
            </div>
            <button type="submit" class="btn btn-primary">Simpan Profil</button>
          </form>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="settings-section__title">Tampilan</h2>
        <div class="card">
          <div class="theme-switcher">
            <div class="theme-option ${settings.theme === 'light' ? 'active' : ''}" data-theme="light">
              <div class="theme-option__preview theme-option__preview--light"></div>
              <span>Terang</span>
            </div>
            <div class="theme-option ${settings.theme === 'dark' ? 'active' : ''}" data-theme="dark">
              <div class="theme-option__preview theme-option__preview--dark"></div>
              <span>Gelap</span>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="settings-section__title">Preferensi</h2>
        <div class="card">
          <form id="prefs-form">
            <div class="form-group">
              <label class="form-label" for="att-threshold">Batas Peringatan Kehadiran (%)</label>
              <input class="form-input" id="att-threshold" type="number" min="50" max="100" value="${settings.attendanceWarningThreshold || 75}">
              <p class="form-hint">Anda akan mendapat peringatan jika kehadiran di bawah persentase ini</p>
            </div>
            <button type="submit" class="btn btn-primary">Simpan Preferensi</button>
          </form>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="settings-section__title">Kelola Data</h2>
        <div class="card">
          <p style="margin-bottom:var(--space-5);color:var(--text-secondary)">Ekspor atau impor data melalui Excel (.xls). File JSON lama juga masih didukung untuk impor.</p>
          <div class="quick-actions">
            <button class="btn btn-secondary" id="export-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Ekspor
            </button>
            <label class="btn btn-secondary" style="cursor:pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              Impor
              <input type="file" id="import-file" accept=".xls,.json" style="display:none">
            </label>
            <button class="btn btn-danger" id="reset-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="settings-section__title">Tentang</h2>
        <div class="card">
          <p style="color:var(--text-secondary);margin-bottom:var(--space-2)"><strong>Campusify</strong> v1.0.0</p>
          <p style="color:var(--text-muted);font-size:var(--font-size-sm)">Dibuat untuk pacarku tercinta ❤️</p>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#profile-avatar-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const avatar = await resizeAvatarImage(file);
      state.updateProfile({ avatar });
      updateSidebarUser();
      showToast('Foto profil diperbarui', 'success');
      renderSettings(container);
    } catch (err) {
      showToast(err.message, 'error');
    }
    e.target.value = '';
  });

  container.querySelector('#remove-avatar-btn')?.addEventListener('click', () => {
    state.updateProfile({ avatar: null });
    updateSidebarUser();
    showToast('Foto profil dihapus', 'info');
    renderSettings(container);
  });

  container.querySelector('#profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.updateProfile({
      name: container.querySelector('#profile-name').value.trim(),
      studentId: container.querySelector('#profile-id').value.trim(),
      major: container.querySelector('#profile-major').value.trim(),
      semester: parseInt(container.querySelector('#profile-semester').value),
      email: container.querySelector('#profile-email').value.trim()
    });
    updateSidebarUser();
    showToast('Profil disimpan', 'success');
  });

  container.querySelector('#prefs-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.updateSettings({
      attendanceWarningThreshold: parseInt(container.querySelector('#att-threshold').value)
    });
    showToast('Preferensi disimpan', 'success');
  });

  container.querySelectorAll('.theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const theme = opt.dataset.theme;
      applyTheme(theme);
      state.updateSettings({ theme });
      container.querySelectorAll('.theme-option').forEach(o => o.classList.toggle('active', o.dataset.theme === theme));
    });
  });

  container.querySelector('#export-btn').addEventListener('click', () => {
    exportDataToExcel(state.get());
    showToast('Data berhasil diekspor ke Excel', 'success');
  });

  container.querySelector('#import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const prev = state.get();
      const data = ext === 'json'
        ? await importData(file)
        : await importDataFromExcel(file);
      data.settings = { ...prev.settings, ...data.settings };
      if (prev.profile?.avatar) data.profile.avatar = prev.profile.avatar;
      state.setData(data);
      updateSidebarUser();
      applyTheme(data.settings?.theme || 'light');
      showToast('Data berhasil diimpor', 'success');
      renderSettings(container);
    } catch (err) {
      showToast(err.message, 'error');
    }
    e.target.value = '';
  });

  container.querySelector('#reset-btn').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Reset Semua Data',
      message: 'Semua data akan dihapus permanen.',
      detail: 'Profil, nilai, jadwal, tugas, keuangan, dan catatan lainnya akan hilang. Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Reset Semua',
      variant: 'danger'
    });
    if (ok) {
      const data = resetData();
      state.setData(data);
      updateSidebarUser();
      applyTheme('light');
      showToast('Semua data telah direset', 'info');
      renderSettings(container);
    }
  });
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b0f1a' : '#6366f1');
  const sun = document.querySelector('.icon-sun');
  const moon = document.querySelector('.icon-moon');
  if (sun && moon) {
    sun.classList.toggle('hidden', theme === 'dark');
    moon.classList.toggle('hidden', theme !== 'dark');
  }
}

export function updateSidebarUser() {
  const { profile } = state.get();
  const nameEl = document.getElementById('sidebar-user-name');
  const semEl = document.getElementById('sidebar-user-semester');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl) nameEl.textContent = profile.name || 'Mahasiswa';
  if (semEl) semEl.textContent = `Semester ${profile.semester}`;
  if (avatarEl) {
    if (profile.avatar) {
      avatarEl.innerHTML = `<img src="${profile.avatar}" alt="" class="sidebar__avatar-img">`;
      avatarEl.classList.add('sidebar__avatar--has-image');
    } else {
      avatarEl.textContent = getInitials(profile.name);
      avatarEl.classList.remove('sidebar__avatar--has-image');
    }
  }
}
