import { state } from '../state.js';

import { registerRoute } from '../router.js';

import { openModal, confirmDialog } from '../components/modal.js';

import { showToast } from '../components/toast.js';

import {
  DAYS, DAYS_SHORT, generateId, escapeHtml, formatTime, buildCourseSelectHtml,
  getDayName, detectConflicts, buildScheduleGCalUrl, matchesDay, createCustomSelect
} from '../utils.js';

export function initSchedule() {
  registerRoute('schedule', renderSchedule);
}

let filterDay = 'all';
let filterMode = 'all';

function renderSchedule(container) {
  const data = state.get();
  const { schedule, courses } = data;

  const courseNames = courses.map(c => c.name);

  const displaySchedule = schedule
    .filter(s => (filterDay === 'all' || s.day === filterDay) && (filterMode === 'all' || s.mode === filterMode))
    .sort((a, b) => {
      const dayOrder = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6, Minggu: 7 };
      const aDay = dayOrder[a.day] || 8;
      const bDay = dayOrder[b.day] || 8;
      if (aDay !== bDay) return aDay - bDay;
      return a.startTime.localeCompare(b.startTime);
    });

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-header__top">
          <div>
            <h1 class="page-header__title">Jadwal Kuliah</h1>
            <p class="page-header__subtitle">Kelola jadwal kuliah Anda per semester</p>
          </div>
          <button class="btn btn-primary" id="add-schedule-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Tambah Jadwal
          </button>
        </div>
      </div>

      <div class="card" style="margin-bottom: var(--space-6); padding: var(--space-4) var(--space-5);">
      <div class="filters-bar" style="margin-bottom: 0; gap: var(--space-3); flex-wrap: wrap;">
        <div id="day-filter-container"></div>
        <div id="mode-filter-container"></div>
      </div>
    </div>

      ${displaySchedule.length ? `
        <div class="schedule-grid">
          ${displaySchedule.map(s => `
            <div class="schedule-card schedule-card--${s.mode}">
              <div class="schedule-card__header">
                <div class="schedule-card__course">
                  <span class="schedule-card__course-name">${escapeHtml(s.courseName)}</span>
                  <span class="schedule-card__mode badge badge--${s.mode === 'online' ? 'secondary' : 'primary'}">${s.mode === 'online' ? 'Online' : 'Offline'}</span>
                </div>
                <span class="schedule-card__day">${escapeHtml(s.day)}</span>
              </div>
              <div class="schedule-card__details">
                <div class="schedule-card__time">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <span>${formatTime(s.startTime)} - ${formatTime(s.endTime)}</span>
                </div>
                ${s.lecturer ? `
                <div class="schedule-card__lecturer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <span>${escapeHtml(s.lecturer)}</span>
                </div>
                ` : ''}
                ${s.room ? `
                <div class="schedule-card__room">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <span>${escapeHtml(s.room)}</span>
                </div>
                ` : ''}
              </div>
              <div class="schedule-card__actions">
                <button type="button" class="btn btn-secondary btn-sm edit-schedule" data-id="${s._id || s.id}">Ubah</button>
                <button type="button" class="btn btn-ghost btn-sm delete-schedule" data-id="${s._id || s.id}">Hapus</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="card" style="text-align: center; padding: var(--space-12);">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: var(--space-4)"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <h3 style="margin-bottom: var(--space-2)">Belum ada jadwal</h3>
          <p style="color: var(--text-muted); margin-bottom: var(--space-6)">Tambah jadwal kuliah pertama Anda</p>
          <button class="btn btn-primary" id="add-schedule-btn-empty">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Tambah Jadwal
          </button>
        </div>
      `}
    </div>
  `;

  // Initialize custom select for day filter
  const dayOptions = [
    { value: 'all', label: 'Semua Hari' },
    ...DAYS.map(d => ({ value: d, label: d }))
  ];
  const daySelect = createCustomSelect(dayOptions, {
    value: filterDay,
    placeholder: 'Semua Hari',
    onChange: (val) => {
      filterDay = val;
      renderSchedule(container);
    }
  });
  container.querySelector('#day-filter-container').appendChild(daySelect);

  // Initialize custom select for mode filter
  const modeOptions = [
    { value: 'all', label: 'Semua Mode' },
    { value: 'offline', label: 'Offline' },
    { value: 'online', label: 'Online' }
  ];
  const modeSelect = createCustomSelect(modeOptions, {
    value: filterMode,
    placeholder: 'Semua Mode',
    onChange: (val) => {
      filterMode = val;
      renderSchedule(container);
    }
  });
  container.querySelector('#mode-filter-container').appendChild(modeSelect);

  function showScheduleModal(scheduleItem = null) {
    const isEdit = !!scheduleItem;

    const content = `
      <form id="schedule-form">
        <div class="form-group">
          <label class="form-label" for="schedule-course">Mata Kuliah</label>
          <select class="form-select" id="schedule-course" required>
            <option value="">— Pilih mata kuliah —</option>
            ${courseNames.map(name => `
              <option value="${escapeHtml(name)}" ${scheduleItem?.courseName === name ? 'selected' : ''}>${escapeHtml(name)}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="schedule-day">Hari</label>
            <select class="form-select" id="schedule-day" required>
              ${DAYS.map(d => `
                <option value="${d}" ${scheduleItem?.day === d ? 'selected' : ''}>${d}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="schedule-mode">Mode</label>
            <select class="form-select" id="schedule-mode" required>
              <option value="offline" ${scheduleItem?.mode === 'offline' ? 'selected' : ''}>Offline</option>
              <option value="online" ${scheduleItem?.mode === 'online' ? 'selected' : ''}>Online</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="schedule-start">Mulai</label>
            <input class="form-input" id="schedule-start" type="time" required value="${scheduleItem?.startTime || '08:00'}">
          </div>
          <div class="form-group">
            <label class="form-label" for="schedule-end">Selesai</label>
            <input class="form-input" id="schedule-end" type="time" required value="${scheduleItem?.endTime || '09:40'}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="schedule-lecturer">Dosen (opsional)</label>
          <input class="form-input" id="schedule-lecturer" type="text" value="${scheduleItem?.lecturer || ''}" placeholder="Nama dosen">
        </div>
        <div class="form-group">
          <label class="form-label" for="schedule-room">Ruangan (opsional)</label>
          <input class="form-input" id="schedule-room" type="text" value="${scheduleItem?.room || ''}" placeholder="Ruangan">
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary modal-cancel">Batal</button>
      <button class="btn btn-primary" id="save-schedule">${isEdit ? 'Perbarui' : 'Tambah'} Jadwal</button>
    `;

    const { close, modal } = openModal({
      title: isEdit ? 'Ubah Jadwal' : 'Tambah Jadwal',
      content,
      footer
    });

    modal.querySelector('.modal-cancel').addEventListener('click', close);
    modal.querySelector('#save-schedule').addEventListener('click', async () => {
      const courseName = modal.querySelector('#schedule-course').value;
      const day = modal.querySelector('#schedule-day').value;
      const mode = modal.querySelector('#schedule-mode').value;
      const startTime = modal.querySelector('#schedule-start').value;
      const endTime = modal.querySelector('#schedule-end').value;
      const lecturer = modal.querySelector('#schedule-lecturer').value.trim();
      const room = modal.querySelector('#schedule-room').value.trim();

      if (!courseName || !day || !startTime || !endTime) {
        return showToast('Lengkapi data jadwal', 'error');
      }

      const scheduleId = scheduleItem?._id || scheduleItem?.id;

      try {
        if (isEdit) {
          await state.updateScheduleItem(scheduleId, { courseName, day, mode, startTime, endTime, lecturer, room });
          showToast('Jadwal diperbarui', 'success');
        } else {
          await state.addScheduleItem({ courseName, day, mode, startTime, endTime, lecturer, room });
          showToast('Jadwal ditambahkan', 'success');
        }
        close();
        renderSchedule(document.getElementById('page-container'));
      } catch (error) {
        showToast('Gagal menyimpan jadwal', 'error');
      }
    });
  }

  container.querySelectorAll('#add-schedule-btn, #add-schedule-btn-empty').forEach(btn => {
    btn.addEventListener('click', () => showScheduleModal());
  });

  container.querySelectorAll('.edit-schedule').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = schedule.find(s => s._id === btn.dataset.id || s.id === btn.dataset.id);
      if (item) showScheduleModal(item);
    });
  });

  container.querySelectorAll('.delete-schedule').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Hapus Jadwal',
        message: 'Jadwal ini akan dihapus dari daftar.',
        confirmText: 'Ya, Hapus',
        variant: 'danger'
      });
      if (ok) {
        state.deleteScheduleItem(btn.dataset.id);
        showToast('Jadwal dihapus', 'success');
        renderSchedule(container);
      }
    });
  });
}