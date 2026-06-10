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



let viewMode = 'weekly';



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



function renderSchedule(container) {

  if (viewMode === 'list') viewMode = 'weekly';

  const data = state.get();

  const { schedule } = data;

  const conflicts = detectConflicts(schedule);

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

      </div>



      ${conflicts.size > 0 ? `

        <div class="alert alert--warning">

          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>

          <span>Konflik jadwal terdeteksi! Beberapa kelas bertabrakan pada hari yang sama.</span>

        </div>

      ` : ''}



      <div class="tabs">

        <button class="tab ${viewMode === 'weekly' ? 'active' : ''}" data-view="weekly">Mingguan</button>

        <button class="tab ${viewMode === 'daily' ? 'active' : ''}" data-view="daily">Harian</button>

        <button class="tab ${viewMode === 'manage' ? 'active' : ''}" data-view="manage">Kelola Kelas</button>

      </div>



      <p class="schedule-hint">

        ${viewMode === 'weekly' ? '💡 Klik blok kelas untuk menambahkan ke Google Calendar.' :

          viewMode === 'daily' ? '📅 Klik Kalender untuk menambahkan ke Google Calendar.' :

          '⚙️ Atur semua kelas — ubah jadwal, dosen, ruang, atau hapus.'}

      </p>



      <div id="schedule-content">

        ${viewMode === 'weekly' ? renderWeeklyView(schedule, conflicts, hours) :

          viewMode === 'daily' ? renderDailyView(schedule, today, conflicts) :

          renderManageView(schedule, conflicts)}

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



  bindScheduleEvents(container);

}



function renderWeeklyView(schedule, conflicts, hours) {

  const getEventsForCell = (day, hour) => {

    return schedule.filter(s => {

      if (!matchesDay(s.day, day)) return false;

      const startH = parseInt(s.startTime.split(':')[0]);

      return startH === parseInt(hour.split(':')[0]);

    });

  };



  let html = '<div class="schedule-grid-wrap"><div class="schedule-grid">';

  html += '<div class="schedule-grid__header"></div>';

  DAYS_SHORT.forEach(d => {

    html += `<div class="schedule-grid__header">${d}</div>`;

  });



  hours.forEach(hour => {

    html += `<div class="schedule-grid__time">${hour}</div>`;

    DAYS.forEach(day => {

      const events = getEventsForCell(day, hour);

      html += `<div class="schedule-grid__cell">`;

      events.forEach(e => {

        html += `

          <div class="schedule-event schedule-event--clickable ${conflicts.has(e.id) ? 'conflict' : ''}" data-id="${e.id}" role="button" tabindex="0" title="Klik untuk tambah ke Google Calendar">

            <div class="schedule-event__title">${escapeHtml(e.courseName)}</div>

            <div class="schedule-event__meta">${formatTime(e.startTime)}-${formatTime(e.endTime)}${e.mode === 'online' ? ' · Online' : ''}</div>

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

              <button type="button" class="btn-gcal add-gcal" data-id="${c.id}">📅 Kalender</button>

            </div>

          </div>

        `).join('') : '<div class="empty-state"><p>Tidak ada kelas hari ini</p></div>'}

      </div>

    </div>

  `;

}



function renderManageView(schedule, conflicts) {

  const sorted = sortSchedule(schedule);



  if (!sorted.length) {

    return `

      <div class="card">

        <div class="empty-state">

          <h3 class="empty-state__title">Belum ada kelas</h3>

          <p class="empty-state__text">Klik "Tambah Kelas" untuk mendaftarkan jadwal kuliah Anda.</p>

          <button class="btn btn-primary" id="add-schedule-empty">Tambah Kelas Pertama</button>

        </div>

      </div>

    `;

  }



  return `

    <div class="schedule-manage">

      <div class="schedule-manage__header">

        <span class="badge badge--primary">${sorted.length} kelas terdaftar</span>

      </div>

      ${sorted.map(s => `

        <div class="schedule-manage-card ${conflicts.has(s.id) ? 'schedule-manage-card--conflict' : ''}">

          <div class="schedule-manage-card__main">

            <div class="schedule-manage-card__day">${s.day}</div>

            <div class="schedule-manage-card__body">

              <h4 class="schedule-manage-card__title">${escapeHtml(s.courseName)}</h4>

              <p class="schedule-manage-card__meta">

                ${formatTime(s.startTime)} – ${formatTime(s.endTime)}

                · ${escapeHtml(s.lecturer || '—')}

                · ${formatLocation(s)}

              </p>

              ${conflicts.has(s.id) ? '<span class="badge badge--danger" style="margin-top:var(--space-2)">Konflik jadwal</span>' : ''}

            </div>

          </div>

          <div class="schedule-item-actions">

            <button class="btn btn-ghost btn-sm edit-schedule" data-id="${s.id}">Ubah</button>

            <button class="btn btn-ghost btn-sm delete-schedule" data-id="${s.id}" style="color:var(--color-danger)">Hapus</button>

            <button type="button" class="btn-gcal add-gcal" data-id="${s.id}" title="Google Calendar">📅</button>

          </div>

        </div>

      `).join('')}

    </div>

  `;

}



function openGCalForSchedule(id) {

  const item = state.get().schedule.find(s => s.id === id);

  if (!item) return;

  window.open(buildScheduleGCalUrl(item), '_blank', 'noopener,noreferrer');

  showToast('Membuka Google Calendar...', 'info');

}



function bindScheduleEvents(container) {

  container.querySelector('#add-schedule-empty')?.addEventListener('click', () => showScheduleModal());



  container.querySelectorAll('.schedule-event--clickable').forEach(el => {

    const open = () => openGCalForSchedule(el.dataset.id);

    el.addEventListener('click', open);

    el.addEventListener('keydown', (e) => {

      if (e.key === 'Enter' || e.key === ' ') {

        e.preventDefault();

        open();

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



  if (courses.length === 0) {

    showToast('Tambahkan mata kuliah di menu Nilai terlebih dahulu', 'warning');

    return;

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



    if (!courseName) return showToast('Masukkan nama mata kuliah', 'error');

    if (mode === 'offline' && !room) return showToast('Masukkan ruang untuk kelas offline', 'error');



    const payload = { courseName, lecturer, room, day, startTime, endTime, mode };



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

