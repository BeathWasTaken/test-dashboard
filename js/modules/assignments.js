import { state } from '../state.js';
import { registerRoute } from '../router.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { tPriority, tStatus } from '../i18n.js';
import {
  PRIORITIES, STATUSES, generateId, escapeHtml, buildCourseSelectHtml,
  formatDate, daysUntil, buildGoogleCalendarUrl
} from '../utils.js';

export function initAssignments() {
  registerRoute('assignments', renderAssignments);
}

let filters = { search: '', status: 'all', priority: 'all', sort: 'deadline' };

function renderAssignments(container) {
  const data = state.get();
  let assignments = [...data.assignments];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    assignments = assignments.filter(a =>
      a.title.toLowerCase().includes(q) || a.course.toLowerCase().includes(q)
    );
  }
  if (filters.status !== 'all') {
    assignments = assignments.filter(a => a.status === filters.status);
  }
  if (filters.priority !== 'all') {
    assignments = assignments.filter(a => a.priority === filters.priority);
  }

  assignments.sort((a, b) => {
    if (filters.sort === 'deadline') return a.deadline.localeCompare(b.deadline);
    if (filters.sort === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    }
    if (filters.sort === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  const stats = {
    total: data.assignments.length,
    todo: data.assignments.filter(a => a.status === 'todo').length,
    progress: data.assignments.filter(a => a.status === 'in-progress').length,
    done: data.completedAssignments || 0
  };

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-header__top">
          <div>
            <h1 class="page-header__title">Tugas</h1>
            <p class="page-header__subtitle">Lacak dan kelola tugas akademik Anda</p>
          </div>
          <button class="btn btn-primary" id="add-assignment-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Tugas Baru
          </button>
        </div>
      </div>

      <div class="stat-grid" style="margin-bottom:var(--space-8)">
        <div class="stat-card">
          <div class="stat-card__label">Total</div>
          <div class="stat-card__value">${stats.total}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Belum Dikerjakan</div>
          <div class="stat-card__value">${stats.todo}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Sedang Dikerjakan</div>
          <div class="stat-card__value">${stats.progress}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Selesai</div>
          <div class="stat-card__value">${stats.done}</div>
        </div>
      </div>

      <div class="filters-bar">
        <input class="form-input" id="assign-search" type="search" placeholder="Cari tugas..." value="${escapeHtml(filters.search)}">
        <select class="form-select" id="assign-status">
          <option value="all" ${filters.status === 'all' ? 'selected' : ''}>Semua Status</option>
          ${STATUSES.map(s => `<option value="${s}" ${filters.status === s ? 'selected' : ''}>${tStatus(s)}</option>`).join('')}
        </select>
        <select class="form-select" id="assign-priority">
          <option value="all" ${filters.priority === 'all' ? 'selected' : ''}>Semua Prioritas</option>
          ${PRIORITIES.map(p => `<option value="${p}" ${filters.priority === p ? 'selected' : ''}>${tPriority(p)}</option>`).join('')}
        </select>
        <select class="form-select" id="assign-sort">
          <option value="deadline" ${filters.sort === 'deadline' ? 'selected' : ''}>Urutkan Tenggat</option>
          <option value="priority" ${filters.sort === 'priority' ? 'selected' : ''}>Urutkan Prioritas</option>
          <option value="title" ${filters.sort === 'title' ? 'selected' : ''}>Urutkan Judul</option>
        </select>
      </div>

      <div id="assignments-list">
        ${assignments.length ? assignments.map(a => {
          const days = daysUntil(a.deadline);
          const overdue = days < 0 && a.status !== 'done';
          const urgent = days <= 2 && days >= 0 && a.status !== 'done';
          return `
            <div class="list-item ${overdue ? 'conflict' : ''}">
              <div class="list-item__content">
                <div class="list-item__title">${escapeHtml(a.title)}</div>
                <div class="list-item__meta">${escapeHtml(a.course)} · Tenggat ${formatDate(a.deadline)} ${overdue ? '(Terlambat)' : urgent ? '(Mendesak)' : ''}</div>
                ${a.description ? `<p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:var(--space-1)">${escapeHtml(a.description)}</p>` : ''}
              </div>
              <span class="badge priority-${a.priority}">${tPriority(a.priority)}</span>
              <span class="badge status-${a.status === 'in-progress' ? 'progress' : a.status}">${tStatus(a.status)}</span>
              <div class="table-actions">
                <select class="form-select btn-sm status-select" data-id="${a.id}" style="width:auto">
                  ${STATUSES.map(s => `<option value="${s}" ${a.status === s ? 'selected' : ''}>${tStatus(s)}</option>`).join('')}
                </select>
                <button class="btn btn-ghost btn-sm edit-assignment" data-id="${a.id}">Ubah</button>
                <button class="btn btn-ghost btn-sm delete-assignment" data-id="${a.id}" style="color:var(--color-danger)">Hapus</button>
                <a class="btn-gcal" href="${buildGoogleCalendarUrl({ title: a.title, description: a.description || a.course, date: a.deadline, startTime: '23:59', endTime: '23:59' })}" target="_blank" rel="noopener">📅</a>
              </div>
            </div>
          `;
        }).join('') : `
          <div class="empty-state">
            <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            <h3 class="empty-state__title">Tidak ada tugas</h3>
            <p class="empty-state__text">Buat tugas pertama Anda untuk mulai melacak pekerjaan akademik.</p>
            <button class="btn btn-primary" id="add-assignment-empty">Buat Tugas</button>
          </div>
        `}
      </div>
    </div>
  `;

  container.querySelector('#add-assignment-btn')?.addEventListener('click', () => showAssignmentModal());
  container.querySelector('#add-assignment-empty')?.addEventListener('click', () => showAssignmentModal());

  container.querySelector('#assign-search').addEventListener('input', (e) => {
    filters.search = e.target.value;
    renderAssignments(container);
  });
  container.querySelector('#assign-status').addEventListener('change', (e) => {
    filters.status = e.target.value;
    renderAssignments(container);
  });
  container.querySelector('#assign-priority').addEventListener('change', (e) => {
    filters.priority = e.target.value;
    renderAssignments(container);
  });
  container.querySelector('#assign-sort').addEventListener('change', (e) => {
    filters.sort = e.target.value;
    renderAssignments(container);
  });

  container.querySelectorAll('.edit-assignment').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = data.assignments.find(x => x.id === btn.dataset.id);
      if (a) showAssignmentModal(a);
    });
  });

  container.querySelectorAll('.delete-assignment').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Hapus Tugas',
        message: 'Tugas ini akan dihapus permanen.',
        confirmText: 'Ya, Hapus',
        variant: 'danger'
      });
      if (ok) {
        state.deleteAssignment(btn.dataset.id);
        showToast('Tugas dihapus', 'success');
        renderAssignments(container);
      }
    });
  });

  container.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', () => {
      if (sel.value === 'done') {
        state.completeAssignment(sel.dataset.id);
        showToast('Tugas selesai — dihitung ke progres', 'success');
      } else {
        state.updateAssignment(sel.dataset.id, { status: sel.value });
        showToast('Status diperbarui', 'success');
      }
      renderAssignments(container);
    });
  });
}

function showAssignmentModal(assignment = null) {
  const isEdit = !!assignment;
  const courses = state.get().courses;

  if (courses.length === 0) {
    showToast('Tambahkan mata kuliah di menu Nilai terlebih dahulu', 'warning');
    return;
  }

  const content = `
    <form id="assignment-form">
      <div class="form-group">
        <label class="form-label" for="assign-title">Judul</label>
        <input class="form-input" id="assign-title" type="text" required value="${assignment ? escapeHtml(assignment.title) : ''}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="assign-course">Mata Kuliah</label>
          <select class="form-select" id="assign-course" required>
            ${buildCourseSelectHtml(courses, { selected: assignment?.course || '' })}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="assign-deadline">Tenggat Waktu</label>
          <input class="form-input" id="assign-deadline" type="date" required value="${assignment?.deadline || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="assign-priority-input">Prioritas</label>
          <select class="form-select" id="assign-priority-input">
            ${PRIORITIES.map(p => `<option value="${p}" ${assignment?.priority === p ? 'selected' : ''}>${tPriority(p)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="assign-status-input">Status</label>
          <select class="form-select" id="assign-status-input">
            ${STATUSES.map(s => `<option value="${s}" ${assignment?.status === s ? 'selected' : ''}>${tStatus(s)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="assign-desc">Deskripsi</label>
        <textarea class="form-textarea" id="assign-desc" rows="3">${assignment?.description || ''}</textarea>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary modal-cancel">Batal</button>
    <button class="btn btn-primary" id="save-assignment">${isEdit ? 'Perbarui' : 'Buat'}</button>
  `;

  const { close, modal } = openModal({
    title: isEdit ? 'Ubah Tugas' : 'Tugas Baru',
    content,
    footer
  });

  modal.querySelector('.modal-cancel').addEventListener('click', close);
  modal.querySelector('#save-assignment').addEventListener('click', () => {
    const title = modal.querySelector('#assign-title').value.trim();
    const course = modal.querySelector('#assign-course').value.trim();
    const deadline = modal.querySelector('#assign-deadline').value;
    const priority = modal.querySelector('#assign-priority-input').value;
    const status = modal.querySelector('#assign-status-input').value;
    const description = modal.querySelector('#assign-desc').value.trim();

    if (!title || !course || !deadline) return showToast('Lengkapi kolom wajib', 'error');

    const payload = { title, course, deadline, priority, status, description };

    if (status === 'done') {
      if (isEdit) {
        state.completeAssignment(assignment.id);
      } else {
        state.update('completedAssignments', (state.get().completedAssignments || 0) + 1);
      }
      showToast('Tugas selesai — dihitung ke progres', 'success');
    } else if (isEdit) {
      state.updateAssignment(assignment.id, payload);
      showToast('Tugas diperbarui', 'success');
    } else {
      state.addAssignment({ id: generateId(), ...payload });
      showToast('Tugas dibuat', 'success');
    }

    close();
    renderAssignments(document.getElementById('page-container'));
  });
}
