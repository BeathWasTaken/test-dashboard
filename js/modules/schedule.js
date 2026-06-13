import { state } from '../state.js';

import { registerRoute } from '../router.js';

import { openModal, confirmDialog } from '../components/modal.js';

import { showToast } from '../components/toast.js';

import {

  DAYS, DAYS_SHORT, generateId, escapeHtml, formatTime, buildCourseSelectHtml,

  getDayName, detectConflicts, buildScheduleGCalUrl, matchesDay

} from '../utils.js';



export function initSchedule() {

  registerRoute('schedule', renderSchedule);

}



let viewMode = 'daily';



function formatLocation(item) {

  if (item.mode === 'online') return '<span class="badge badge--info">Online</span>';

  return escapeHtml(item.room || '—');

}



function sortSchedule(schedule) {

  return [...schedule].sort((a, b) => {

    const dayA = DAYS.findIndex(d => matchesDay(a.day, d));

    const dayB = DAYS.findIndex(d => matchesDay(b.day, d));

    if (dayA !== dayB) return dayA - dayB;

    return a.startTime.localeCompare(b.startTime);

  });

}



function getFilteredSchedule(schedule) {

  const settings = state.get().settings;

  const year = parseInt(settings.scheduleYear) || new Date().getFullYear();

  return schedule.filter(s => {

    const sy = s.year ? parseInt(s.year) : new Date().getFullYear();

    return sy === year;

  });

}



function renderYearSelector() {

  const current = parseInt(state.get().settings.scheduleYear) || new Date().getFullYear();

  const years = [];

  const thisYear = new Date().getFullYear();

  for (let y = thisYear - 2; y <= thisYear + 4; y++) {

    years.push(y);

  }

  return `

    <div class="filters-bar" style="margin-top:var(--space-4)">

      <label style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--font-size-sm);color:var(--text-muted)">

        Tahun Akademik

        <select class="form-select" id="schedule-year-filter" style="width:auto">

          ${years.map(y => `<option value="${y}" ${y === current ? 'selected' : ''}>${y}/${y + 1}</option>`).join('')}

        </select>

      </label>

    </div>

  `;

}



function renderSchedule(container) {

  if (viewMode === 'list') viewMode = 'weekly';

  const data = state.get();

  const { schedule } = data;

  const filtered = getFilteredSchedule(schedule);

  const conflicts = detectConflicts(filtered);

  const today = getDayName();



  const hours = [];

  for (let h = 7; h <= 18; h++) {

    hours.push(`${String(h).padStart(2, '0')}:00`);

  }



  container.innerHTML = `

    <div class="page">

      <div class="page-header">

        <div class="page-header__top">

          <div>

            <h1 class="page-header__title">Jadwal Kuliah</h1>

            <p class="page-header__subtitle">Kelola jadwal kuliah mingguan Anda</p>

          </div>

          <div class="quick-actions">

            <button class="btn btn-secondary" id="add-schedule-btn">

              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>

              Tambah Kelas

            </button>

          </div>

        </div>

        ${renderYearSelector()}

      </div>



      ${conflicts.size > 0 ? `

        <div class="alert alert--warning">

          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>

          <span>Konflik jadwal terdeteksi! Beberapa kelas bertabrakan pada hari yang sama.</span>

        </div>

      ` : ''}



      <div class="tabs">

        <button class="tab ${viewMode === 'daily' ? 'active' : ''}" data-view="daily">Hari Ini</button>

        <button class="tab ${viewMode === 'weekly' ? 'active' : ''}" data-view="weekly">Jadwal</button>

      </div>



      <p class="schedule-hint">

        ${viewMode === 'daily' ? 'Jadwal kuliah Anda hari ini.' :

          'Klik blok kelas untuk melihat detail dan mengelola jadwal.'}

      </p>



      <div id="schedule-content">

        ${viewMode === 'daily' ? renderDailyView(filtered, today, conflicts) :

          renderWeeklyView(filtered, conflicts, hours)}

      </div>

    </div>

  `;



  container.querySelector('#add-schedule-btn').addEventListener('click', () => showScheduleModal());

  container.querySelectorAll('.tab').forEach(tab => {

    tab.addEventListener('click', () => {

      viewMode = tab.dataset.view;

      renderSchedule(container);

    });

  });



  container.querySelector('#schedule-year-filter')?.addEventListener('change', (e) => {

    state.updateSettings({ scheduleYear: parseInt(e.target.value) });

    renderSchedule(container);

  });



  bindScheduleEvents(container);

}



function renderWeeklyView(schedule, conflicts, hours) {

  const getEventsForCell = (day, hour) => {

    return schedule.filter(s => {

      if (!matchesDay(s.day, day)) return false;

      const startH = parseInt(s.startTime.split(':')[0]);

      const endH = parseInt(s.endTime.split(':')[0]);

      return startH <= parseInt(hour.split(':')[0]) && endH > parseInt(hour.split(':')[0]);

    });

  };



  let html = '<div class="cal-wrap"><div class="cal">';

  html += '<div class="cal__header"></div>';

  DAYS_SHORT.forEach(d => {

    html += `<div class="cal__header">${d}</div>`;

  });



  hours.forEach(hour => {

    html += `<div class="cal__time">${hour}</div>`;

    DAYS.forEach(day => {

      const events = getEventsForCell(day, hour);

      html += `<div class="cal__cell">`;

      events.forEach(e => {

        const span = Math.max(1, parseInt(e.endTime.split(':')[0]) - parseInt(e.startTime.split(':')[0]));

        const color = conflicts.has(e.id) ? 'cal__event--conflict' : '';

        html += `

          <div class="cal__event ${color}" data-id="${e.id}" role="button" tabindex="0" style="--span:${span}">

            <div class="cal__event-title">${escapeHtml(e.courseName)}</div>

            <div class="cal__event-meta">${formatTime(e.startTime)}-${formatTime(e.endTime)}${e.mode === 'online' ? ' · Online' : ''}</div>

          </div>

        `;

      });

      html += '</div>';

    });

  });



  html += '</div></div>';

  return html;

}



function renderDailyView(schedule, today, conflicts) {

  const todayClasses = schedule.filter(s => matchesDay(s.day, today)).sort((a, b) => a.startTime.localeCompare(b.startTime));



  return `

    <div class="card">

      <div class="section-header" style="margin-bottom:var(--space-4)">

        <h3 class="card__title">Hari Ini — ${today}</h3>

        <span class="badge badge--primary">${todayClasses.length} kelas</span>

      </div>

      <div class="daily-schedule">

        ${todayClasses.length ? todayClasses.map(c => `

          <div class="daily-class ${conflicts.has(c.id) ? 'conflict' : ''}">

            <div class="daily-class__time">${formatTime(c.startTime)}<br><small style="color:var(--text-muted)">${formatTime(c.endTime)}</small></div>

            <div class="daily-class__info">

              <h4>${escapeHtml(c.courseName)}</h4>

              <p>${escapeHtml(c.lecturer)} · ${formatLocation(c)}</p>

            </div>

            <div class="schedule-item-actions">

              <button type="button" class="btn btn-ghost btn-sm edit-schedule" data-id="${c.id}">Ubah</button>

              <button type="button" class="btn btn-ghost btn-sm delete-schedule" data-id="${c.id}" style="color:var(--color-danger)">Hapus</button>

              <button type="button" class="btn-gcal add-gcal" data-id="${c.id}" title="Google Calendar">📅</button>

            </div>

          </div>

        `).join('') : '<div class="empty-state"><p>Tidak ada kelas hari ini</p></div>'}

      </div>

    </div>

  `;

}



function showDetailModal(id) {

  const item = state.get().schedule.find(s => s.id === id);

  if (!item) return;



  const content = `

    <div style="display:flex;flex-direction:column;gap:var(--space-4)">

      <div>

        <h3 style="font-size:var(--font-size-xl);font-weight:700;margin-bottom:var(--space-1)">${escapeHtml(item.courseName)}</h3>

        <p style="font-size:var(--font-size-sm);color:var(--text-muted)">${item.day} · ${formatTime(item.startTime)} – ${formatTime(item.endTime)}</p>

      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">

        <div style="padding:var(--space-3);background:var(--bg-secondary);border-radius:var(--radius-lg);text-align:center">

          <div style="font-size:var(--font-size-xs);color:var(--text-muted)">Dosen</div>

          <div style="font-weight:600;font-size:var(--font-size-sm)">${escapeHtml(item.lecturer || '—')}</div>

        </div>

        <div style="padding:var(--space-3);background:var(--bg-secondary);border-radius:var(--radius-lg);text-align:center">

          <div style="font-size:var(--font-size-xs);color:var(--text-muted)">Ruangan</div>

          <div style="font-weight:600;font-size:var(--font-size-sm)">${item.mode === 'online' ? 'Online' : escapeHtml(item.room || '—')}</div>

        </div>

      </div>

      <div style="text-align:center">

        <button class="btn btn-outline" id="detail-gcal-btn" style="width:100%;justify-content:center">

          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>

          Tambah ke Google Calendar

        </button>

      </div>

    </div>

  `;



  const footer = `

    <button class="btn btn-secondary" id="detail-edit-btn">Ubah</button>

    <button class="btn btn-danger" id="detail-delete-btn">Hapus</button>

  `;



  const { close, modal } = openModal({

    title: 'Detail Jadwal',

    content,

    footer

  });



  modal.querySelector('#detail-gcal-btn').addEventListener('click', () => {

    openGCalForSchedule(id);

  });



  modal.querySelector('#detail-edit-btn').addEventListener('click', () => {

    close();

    showScheduleModal(item);

  });



  modal.querySelector('#detail-delete-btn').addEventListener('click', async () => {

    const ok = await confirmDialog({

      title: 'Hapus Kelas',

      message: 'Kelas ini akan dihapus dari jadwal.',

      confirmText: 'Ya, Hapus',

      variant: 'danger'

    });

    if (ok) {

      state.deleteScheduleItem(id);

      showToast('Kelas dihapus', 'success');

      close();

      renderSchedule(document.getElementById('page-container'));

    }

  });



  modal.querySelector('.modal-cancel').addEventListener('click', close);

}



function openGCalForSchedule(id) {

  const item = state.get().schedule.find(s => s.id === id);

  if (!item) return;

  window.open(buildScheduleGCalUrl(item), '_blank', 'noopener,noreferrer');

  showToast('Membuka Google Calendar...', 'info');

}



function bindScheduleEvents(container) {

  container.querySelector('#add-schedule-empty')?.addEventListener('click', () => showScheduleModal());



  container.querySelectorAll('.cal__event').forEach(el => {

    el.addEventListener('click', () => showDetailModal(el.dataset.id));

    el.addEventListener('keydown', (e) => {

      if (e.key === 'Enter' || e.key === ' ') {

        e.preventDefault();

        showDetailModal(el.dataset.id);

      }

    });

  });



  container.querySelectorAll('.add-gcal').forEach(btn => {

    btn.addEventListener('click', () => openGCalForSchedule(btn.dataset.id));

  });



  container.querySelectorAll('.edit-schedule').forEach(btn => {

    btn.addEventListener('click', () => {

      const item = state.get().schedule.find(s => s.id === btn.dataset.id);

      if (item) showScheduleModal(item);

    });

  });



  container.querySelectorAll('.delete-schedule').forEach(btn => {

    btn.addEventListener('click', async () => {

      const ok = await confirmDialog({

        title: 'Hapus Kelas',

        message: 'Kelas ini akan dihapus dari jadwal.',

        confirmText: 'Ya, Hapus',

        variant: 'danger'

      });

      if (ok) {

        state.deleteScheduleItem(btn.dataset.id);

        showToast('Kelas dihapus', 'success');

        renderSchedule(container);

      }

    });

  });

}



function showScheduleModal(item = null) {

  const isEdit = !!item;

  const isOnline = item?.mode === 'online';

  const courses = state.get().courses;

  const currentYear = parseInt(state.get().settings.scheduleYear) || new Date().getFullYear();



  if (courses.length === 0) {

    showToast('Tambahkan mata kuliah di menu Nilai terlebih dahulu', 'warning');

    return;

  }

  const years = [];

  const thisYear = new Date().getFullYear();

  for (let y = thisYear - 2; y <= thisYear + 4; y++) {

    years.push(y);

  }

  const content = `

    <form id="schedule-form">

      <div class="form-group">

        <label class="form-label" for="sched-course">Mata Kuliah</label>

        <select class="form-select" id="sched-course" required>

          ${buildCourseSelectHtml(courses, { selected: item?.courseName || '' })}

        </select>

      </div>

      <div class="form-group">

        <label class="form-label">Mode Kuliah</label>

        <div style="display:flex;gap:var(--space-4);flex-wrap:wrap">

          <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;font-size:var(--font-size-sm)">

            <input type="radio" name="sched-mode" value="offline" ${!isOnline ? 'checked' : ''}> Offline (tatap muka)

          </label>

          <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;font-size:var(--font-size-sm)">

            <input type="radio" name="sched-mode" value="online" ${isOnline ? 'checked' : ''}> Online

          </label>

        </div>

      </div>

      <div class="form-group">

        <label class="form-label" for="sched-lecturer">Dosen</label>

        <input class="form-input" id="sched-lecturer" type="text" value="${item ? escapeHtml(item.lecturer) : ''}">

      </div>

      <div class="form-group" id="sched-room-group" style="${isOnline ? 'display:none' : ''}">

        <label class="form-label" for="sched-room">Ruang</label>

        <input class="form-input" id="sched-room" type="text" value="${item && !isOnline ? escapeHtml(item.room) : ''}">

      </div>

      <div class="form-group">

        <label class="form-label" for="sched-day">Hari</label>

        <select class="form-select" id="sched-day" required>

          ${DAYS.map(d => `<option value="${d}" ${item ? (matchesDay(item.day, d) ? 'selected' : '') : (d === getDayName() ? 'selected' : '')}>${d}</option>`).join('')}

        </select>

      </div>

      <div class="form-row">

        <div class="form-group">

          <label class="form-label" for="sched-start">Waktu Mulai</label>

          <input class="form-input" id="sched-start" type="time" required value="${item?.startTime || '08:00'}">

        </div>

        <div class="form-group">

          <label class="form-label" for="sched-end">Waktu Selesai</label>

          <input class="form-input" id="sched-end" type="time" required value="${item?.endTime || '10:00'}">

        </div>

      </div>

      <div class="form-group">

        <label class="form-label" for="sched-year">Tahun Akademik</label>

        <select class="form-select" id="sched-year" required>

          ${years.map(y => `<option value="${y}" ${y === (item?.year ? parseInt(item.year) : currentYear) ? 'selected' : ''}>${y}/${y + 1}</option>`).join('')}

        </select>

      </div>

    </form>

  `;



  const footer = `

    <button class="btn btn-secondary modal-cancel">Batal</button>

    <button class="btn btn-primary" id="save-schedule">${isEdit ? 'Perbarui' : 'Tambah'} Kelas</button>

  `;



  const { close, modal } = openModal({

    title: isEdit ? 'Ubah Kelas' : 'Tambah Kelas',

    content,

    footer

  });



  const roomGroup = modal.querySelector('#sched-room-group');

  const roomInput = modal.querySelector('#sched-room');



  modal.querySelectorAll('input[name="sched-mode"]').forEach(radio => {

    radio.addEventListener('change', () => {

      const online = modal.querySelector('input[name="sched-mode"]:checked').value === 'online';

      roomGroup.style.display = online ? 'none' : '';

      if (online) roomInput.value = '';

    });

  });



  modal.querySelector('.modal-cancel').addEventListener('click', close);

  modal.querySelector('#save-schedule').addEventListener('click', () => {

    const courseName = modal.querySelector('#sched-course').value.trim();

    const lecturer = modal.querySelector('#sched-lecturer').value.trim();

    const mode = modal.querySelector('input[name="sched-mode"]:checked').value;

    const room = mode === 'online' ? '' : modal.querySelector('#sched-room').value.trim();

    const day = modal.querySelector('#sched-day').value;

    const startTime = modal.querySelector('#sched-start').value;

    const endTime = modal.querySelector('#sched-end').value;

    const year = modal.querySelector('#sched-year').value;



    if (!courseName) return showToast('Masukkan nama mata kuliah', 'error');

    if (mode === 'offline' && !room) return showToast('Masukkan ruang untuk kelas offline', 'error');



    const payload = { courseName, lecturer, room, day, startTime, endTime, mode, year };



    if (isEdit) {

      state.updateScheduleItem(item.id, payload);

      showToast('Kelas diperbarui', 'success');

    } else {

      state.addScheduleItem({ id: generateId(), ...payload });

      showToast('Kelas ditambahkan', 'success');

    }



    close();

    renderSchedule(document.getElementById('page-container'));

  });

}