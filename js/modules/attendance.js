import { state } from '../state.js';
import { registerRoute } from '../router.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { tAttendance } from '../i18n.js';
import {
  generateId, escapeHtml, formatDate,
  calculateAttendancePercentage, getAttendanceByCourse
} from '../utils.js';

export function initAttendance() {
  registerRoute('attendance', renderAttendance);
}

function renderAttendance(container) {
  const data = state.get();
  const { attendance, settings } = data;
  const threshold = settings.attendanceWarningThreshold || 75;

  const courseNames = [...new Set([
    ...data.courses.map(c => c.name),
    ...attendance.map(a => a.course)
  ])];

  const courseStats = courseNames.map(name => {
    const records = getAttendanceByCourse(attendance, name);
    const pct = calculateAttendancePercentage(records);
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const excused = records.filter(r => r.status === 'excused').length;
    return { name, records, pct, present, absent, excused, total: records.length };
  });

  const overallPct = courseStats.length
    ? Math.round(courseStats.reduce((s, c) => s + c.pct, 0) / courseStats.length)
    : 100;

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-header__top">
          <div>
            <h1 class="page-header__title">Kehadiran</h1>
            <p class="page-header__subtitle">Lacak dan pantau kehadiran kuliah Anda</p>
          </div>
          <button class="btn btn-primary" id="add-attendance-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Catat Kehadiran
          </button>
        </div>
      </div>

      <div class="stat-grid" style="margin-bottom:var(--space-8)">
        <div class="stat-card">
          <div class="stat-card__label">Kehadiran Keseluruhan</div>
          <div class="stat-card__value" style="color:${overallPct < threshold ? 'var(--color-danger)' : 'var(--color-success)'}">${overallPct}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Mata Kuliah Dilacak</div>
          <div class="stat-card__value">${courseNames.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Batas Peringatan</div>
          <div class="stat-card__value">${threshold}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Berisiko</div>
          <div class="stat-card__value" style="color:var(--color-danger)">${courseStats.filter(c => c.pct < threshold && c.total > 0).length}</div>
        </div>
      </div>

      ${courseStats.some(c => c.pct < threshold && c.total > 0) ? `
        <div class="alert alert--danger" style="margin-bottom:var(--space-6)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          <div>
            <strong>Peringatan Kehadiran!</strong> Mata kuliah berikut di bawah ${threshold}%:
            ${courseStats.filter(c => c.pct < threshold && c.total > 0).map(c => `<strong>${escapeHtml(c.name)} (${c.pct}%)</strong>`).join(', ')}
          </div>
        </div>
      ` : ''}

      <div class="attendance-grid">
        ${courseStats.map(c => {
          const status = c.pct < threshold * 0.8 ? 'danger' : c.pct < threshold ? 'warning' : '';
          return `
            <div class="attendance-card ${status}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
                <h3 style="font-size:var(--font-size-base)">${escapeHtml(c.name)}</h3>
                <span class="badge ${c.pct >= threshold ? 'badge--success' : c.pct >= threshold * 0.8 ? 'badge--warning' : 'badge--danger'}">${c.pct}%</span>
              </div>
              <div class="progress-bar" style="margin-bottom:var(--space-4)">
                <div class="progress-bar__fill" style="width:${c.pct}%;${c.pct < threshold ? 'background:var(--gradient-warm)' : ''}"></div>
              </div>
              <div style="display:flex;gap:var(--space-4);font-size:var(--font-size-xs);color:var(--text-muted)">
                <span>Hadir: ${c.present}</span>
                <span>Tidak hadir: ${c.absent}</span>
                <span>Izin: ${c.excused}</span>
              </div>
              ${c.records.length ? `
                <div style="margin-top:var(--space-4);max-height:120px;overflow-y:auto">
                  ${c.records.slice(-5).reverse().map(r => `
                    <div style="display:flex;justify-content:space-between;font-size:var(--font-size-xs);padding:var(--space-1) 0;border-bottom:1px solid var(--border-light)">
                      <span>${formatDate(r.date)}</span>
                      <span class="badge badge--${r.status === 'present' ? 'success' : r.status === 'absent' ? 'danger' : 'warning'}">${tAttendance(r.status)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:var(--space-3)">Belum ada catatan</p>'}
            </div>
          `;
        }).join('')}
      </div>

      <div class="section" style="margin-top:var(--space-8)">
        <h2 class="section-title" style="margin-bottom:var(--space-5)">Catatan Terbaru</h2>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr><th>Mata Kuliah</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              ${[...attendance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map(r => `
                <tr>
                  <td>${escapeHtml(r.course)}</td>
                  <td>${formatDate(r.date)}</td>
                  <td><span class="badge badge--${r.status === 'present' ? 'success' : r.status === 'absent' ? 'danger' : 'warning'}">${tAttendance(r.status)}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm delete-attendance" data-id="${r.id}" style="color:var(--color-danger)">Hapus</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#add-attendance-btn').addEventListener('click', () => showAttendanceModal());

  container.querySelectorAll('.delete-attendance').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Hapus Catatan',
        message: 'Catatan kehadiran ini akan dihapus.',
        confirmText: 'Ya, Hapus',
        variant: 'danger'
      });
      if (ok) {
        state.deleteAttendance(btn.dataset.id);
        showToast('Catatan dihapus', 'success');
        renderAttendance(container);
      }
    });
  });
}

function showAttendanceModal() {
  const courses = state.get().courses;

  if (courses.length === 0) {
    showToast('Tambahkan mata kuliah di menu Nilai terlebih dahulu', 'warning');
    return;
  }

  const content = `
    <form id="attendance-form">
      <div class="form-group">
        <label class="form-label" for="att-course">Mata Kuliah</label>
        <select class="form-select" id="att-course" required>
          <option value="">— Pilih mata kuliah —</option>
          ${courses.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (Sem ${c.semester})</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="att-date">Tanggal</label>
          <input class="form-input" id="att-date" type="date" required value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label" for="att-status">Status</label>
          <select class="form-select" id="att-status">
            <option value="present">Hadir</option>
            <option value="absent">Tidak hadir</option>
            <option value="excused">Izin</option>
          </select>
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary modal-cancel">Batal</button>
    <button class="btn btn-primary" id="save-attendance">Simpan</button>
  `;

  const { close, modal } = openModal({
    title: 'Catat Kehadiran',
    content,
    footer
  });

  modal.querySelector('.modal-cancel').addEventListener('click', close);
  modal.querySelector('#save-attendance').addEventListener('click', () => {
    const course = modal.querySelector('#att-course').value.trim();
    const date = modal.querySelector('#att-date').value;
    const status = modal.querySelector('#att-status').value;

    if (!course || !date) return showToast('Lengkapi kolom wajib', 'error');

    state.addAttendance({ id: generateId(), course, date, status });
    showToast('Kehadiran dicatat', 'success');
    close();
    renderAttendance(document.getElementById('page-container'));
  });
}
