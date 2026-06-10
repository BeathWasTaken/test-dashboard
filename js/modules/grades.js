import { state } from '../state.js';
import { registerRoute } from '../router.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { initCharts } from '../components/charts.js';
import {
  GRADE_OPTIONS, GRADE_SCALE, generateId, escapeHtml,
  calculateGPA, calculateCGPA, getTotalCredits, getGPATrend,
  getGradeDistribution, getCreditAccumulation, animateValue,
  getGradeScale, getGradePoints
} from '../utils.js';

export function initGrades() {
  registerRoute('grades', renderGrades);
}

let filterSemester = 'all';

function renderGrades(container) {
  const data = state.get();
  const { courses, profile, settings } = data;
  const gradeScale = getGradeScale(settings);
  const semesters = [...new Set(courses.map(c => c.semester))].sort((a, b) => b - a);

  const currentIP = calculateGPA(courses, profile.semester, gradeScale);
  const ipk = calculateCGPA(courses, gradeScale);
  const filtered = filterSemester === 'all'
    ? courses
    : courses.filter(c => c.semester === parseInt(filterSemester));

  const displayIP = filterSemester === 'all'
    ? currentIP
    : calculateGPA(courses, parseInt(filterSemester), gradeScale);

  const gpaTrend = getGPATrend(courses, gradeScale);
  const creditAccum = getCreditAccumulation(courses);
  const gradeDist = getGradeDistribution(courses);

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-header__top">
          <div>
            <h1 class="page-header__title">Nilai</h1>
            <p class="page-header__subtitle">Kelola mata kuliah dan pantau performa akademik Anda</p>
          </div>
          <button class="btn btn-primary" id="add-course-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Tambah Mata Kuliah
          </button>
        </div>
      </div>

      <div class="page-grid page-grid--3" style="margin-bottom:var(--space-8)">
        <div class="card">
          <div class="gpa-display">
            <div class="gpa-display__value" id="gpa-value">0.00</div>
            <div class="gpa-display__label">IP Semester Ini — Sem ${profile.semester}</div>
          </div>
        </div>
        <div class="card">
          <div class="gpa-display">
            <div class="gpa-display__value" id="cgpa-value">0.00</div>
            <div class="gpa-display__label">IPK Kumulatif</div>
          </div>
        </div>
        <div class="card">
          <div class="gpa-display">
            <div class="gpa-display__value" style="font-size:3rem">${getTotalCredits(courses)}</div>
            <div class="gpa-display__label">Total SKS</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-8)">
        <div class="section-header" style="margin-bottom:var(--space-4)">
          <div>
            <h3 class="card__title">Pengaturan Bobot Nilai</h3>
            <p style="font-size:var(--font-size-sm);color:var(--text-muted);margin-top:var(--space-1)">Ubah bobot per huruf nilai. IP & IPK diperbarui otomatis.</p>
          </div>
          <button class="btn btn-ghost btn-sm" id="reset-grade-scale">Reset Default</button>
        </div>
        <form id="grade-scale-form">
          <div class="page-grid page-grid--auto" style="gap:var(--space-3)">
            ${GRADE_OPTIONS.map(g => `
              <div class="form-group" style="margin:0">
                <label class="form-label" for="scale-${g.replace('+', 'plus').replace('-', 'minus')}">${g}</label>
                <input class="form-input grade-scale-input" id="scale-${g.replace('+', 'plus').replace('-', 'minus')}" type="number" step="0.01" min="0" max="4" data-grade="${g}" value="${gradeScale[g]}">
              </div>
            `).join('')}
          </div>
          <div style="margin-top:var(--space-5);display:flex;gap:var(--space-3);align-items:center">
            <button type="submit" class="btn btn-primary">Simpan Bobot</button>
            <span id="scale-preview" style="font-size:var(--font-size-sm);color:var(--text-muted)">IP: ${currentIP.toFixed(2)} · IPK: ${ipk.toFixed(2)}</span>
          </div>
        </form>
      </div>

      <div class="page-grid page-grid--2" style="margin-bottom:var(--space-8)">
        <div class="card">
          <h3 class="card__title" style="margin-bottom:var(--space-4)">Tren IP per Semester</h3>
          <div class="chart-container">
            <canvas data-chart="line" data-config='${JSON.stringify({
              labels: gpaTrend.map(t => `Sem ${t.semester}`),
              datasets: [{ data: gpaTrend.map(t => t.gpa), fill: true, color: '#6366f1' }],
              options: { maxY: 4 }
            })}'></canvas>
          </div>
        </div>
        <div class="card">
          <h3 class="card__title" style="margin-bottom:var(--space-4)">Akumulasi SKS</h3>
          <div class="chart-container">
            <canvas data-chart="bar" data-config='${JSON.stringify({
              labels: creditAccum.map(c => `Sem ${c.semester}`),
              data: creditAccum.map(c => c.credits)
            })}'></canvas>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Daftar Mata Kuliah</h2>
          <div class="filters-bar" style="margin:0">
            <select class="form-select" id="semester-filter">
              <option value="all" ${filterSemester === 'all' ? 'selected' : ''}>Semua Semester</option>
              ${semesters.map(s => `<option value="${s}" ${filterSemester == s ? 'selected' : ''}>Semester ${s}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="gpa-table-summary gpa-table-summary--single">
          <div class="gpa-table-summary__item">
            <span class="gpa-table-summary__label">IP ${filterSemester === 'all' ? `Semester ${profile.semester}` : `Semester ${filterSemester}`}</span>
            <span class="gpa-table-summary__value" id="table-ip">${displayIP.toFixed(2)}</span>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Mata Kuliah</th>
                <th>Semester</th>
                <th>SKS</th>
                <th>Nilai</th>
                <th>Bobot</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="courses-tbody">
              ${filtered.length ? filtered.map(c => `
                <tr data-course-id="${c.id}">
                  <td><strong>${escapeHtml(c.name)}</strong></td>
                  <td>Sem ${c.semester}</td>
                  <td>${c.credits}</td>
                  <td><span class="grade-pill grade-${c.grade.replace('+', '\\+')}">${c.grade}</span></td>
                  <td class="course-bobot">${getGradePoints(c.grade, gradeScale).toFixed(2)}</td>
                  <td class="table__actions-cell">
                    <div class="table-actions table-actions--compact">
                      <button type="button" class="btn btn-secondary btn-sm edit-course" data-id="${c.id}">Ubah</button>
                      <button type="button" class="btn btn-ghost btn-sm delete-course" data-id="${c.id}">Hapus</button>
                    </div>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="6" style="text-align:center;padding:var(--space-8);color:var(--text-muted)">Tidak ada mata kuliah</td></tr>'}
            </tbody>
            ${filtered.length ? `
            <tfoot>
              <tr class="table-summary-row">
                <td colspan="2"><strong>Ringkasan</strong></td>
                <td>${filtered.reduce((s, c) => s + c.credits, 0)} SKS</td>
                <td class="table-summary-row__ip-cell">IP <strong id="table-ip-foot">${displayIP.toFixed(2)}</strong></td>
                <td class="table-summary-row__ipk-cell">IPK <strong id="table-ipk-foot">${ipk.toFixed(2)}</strong></td>
                <td></td>
              </tr>
            </tfoot>
            ` : ''}
          </table>
        </div>
      </div>

      <div class="card" style="margin-top:var(--space-6)">
        <h3 class="card__title" style="margin-bottom:var(--space-4)">Distribusi Nilai Keseluruhan</h3>
        <div class="chart-container" style="height:200px">
          <canvas data-chart="bar" data-config='${JSON.stringify({
            labels: GRADE_OPTIONS.filter(g => gradeDist[g] > 0),
            data: GRADE_OPTIONS.filter(g => gradeDist[g] > 0).map(g => gradeDist[g])
          })}'></canvas>
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    initCharts(container);
    animateValue(document.getElementById('gpa-value'), 0, currentIP);
    animateValue(document.getElementById('cgpa-value'), 0, ipk);
  });

  function readScaleFromForm() {
    const scale = {};
    container.querySelectorAll('.grade-scale-input').forEach(input => {
      scale[input.dataset.grade] = parseFloat(input.value) || 0;
    });
    return scale;
  }

  function previewScale() {
    const scale = readScaleFromForm();
    const ip = filterSemester === 'all'
      ? calculateGPA(courses, profile.semester, scale)
      : calculateGPA(courses, parseInt(filterSemester), scale);
    const ipkVal = calculateCGPA(courses, scale);
    const preview = container.querySelector('#scale-preview');
    if (preview) preview.textContent = `IP: ${ip.toFixed(2)} · IPK: ${ipkVal.toFixed(2)}`;

    const ipEl = container.querySelector('#table-ip');
    const ipFoot = container.querySelector('#table-ip-foot');
    const ipkFoot = container.querySelector('#table-ipk-foot');
    if (ipEl) ipEl.textContent = ip.toFixed(2);
    if (ipFoot) ipFoot.textContent = ip.toFixed(2);
    if (ipkFoot) ipkFoot.textContent = ipkVal.toFixed(2);

    courses.forEach(c => {
      const row = container.querySelector(`tr[data-course-id="${c.id}"] .course-bobot`);
      if (row) row.textContent = getGradePoints(c.grade, scale).toFixed(2);
    });
  }

  container.querySelectorAll('.grade-scale-input').forEach(input => {
    input.addEventListener('input', previewScale);
  });

  container.querySelector('#grade-scale-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const gradeScaleCustom = readScaleFromForm();
    state.updateSettings({ gradeScale: gradeScaleCustom });
    showToast('Bobot nilai disimpan — IP & IPK diperbarui', 'success');
    renderGrades(container);
  });

  container.querySelector('#reset-grade-scale').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Reset Bobot Nilai',
      message: 'Kembalikan bobot nilai ke pengaturan default?',
      confirmText: 'Ya, Reset',
      variant: 'warning'
    });
    if (ok) {
      state.updateSettings({ gradeScale: null });
      showToast('Bobot nilai direset', 'info');
      renderGrades(container);
    }
  });

  container.querySelector('#add-course-btn').addEventListener('click', () => showCourseModal());
  container.querySelector('#semester-filter').addEventListener('change', (e) => {
    filterSemester = e.target.value;
    renderGrades(container);
  });

  container.querySelectorAll('.edit-course').forEach(btn => {
    btn.addEventListener('click', () => {
      const course = courses.find(c => c.id === btn.dataset.id);
      if (course) showCourseModal(course);
    });
  });

  container.querySelectorAll('.delete-course').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Hapus Mata Kuliah',
        message: 'Mata kuliah ini akan dihapus dari daftar.',
        confirmText: 'Ya, Hapus',
        variant: 'danger'
      });
      if (ok) {
        state.deleteCourse(btn.dataset.id);
        showToast('Mata kuliah dihapus', 'success');
        renderGrades(container);
      }
    });
  });
}

function showCourseModal(course = null) {
  const isEdit = !!course;
  const data = state.get();
  const gradeScale = getGradeScale(data.settings);

  const content = `
    <form id="course-form">
      <div class="form-group">
        <label class="form-label" for="course-name">Nama Mata Kuliah</label>
        <input class="form-input" id="course-name" type="text" required value="${course ? escapeHtml(course.name) : ''}" placeholder="cth. Struktur Data">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="course-credits">SKS</label>
          <input class="form-input" id="course-credits" type="number" min="1" max="6" required value="${course?.credits || 3}">
        </div>
        <div class="form-group">
          <label class="form-label" for="course-semester">Semester</label>
          <input class="form-input" id="course-semester" type="number" min="1" max="14" required value="${course?.semester || data.profile.semester}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="course-grade">Nilai</label>
        <select class="form-select" id="course-grade" required>
          ${GRADE_OPTIONS.map(g => `<option value="${g}" ${course?.grade === g ? 'selected' : ''}>${g} (bobot ${gradeScale[g]})</option>`).join('')}
        </select>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary modal-cancel">Batal</button>
    <button class="btn btn-primary" id="save-course">${isEdit ? 'Perbarui' : 'Tambah'} Mata Kuliah</button>
  `;

  const { close, modal } = openModal({
    title: isEdit ? 'Ubah Mata Kuliah' : 'Tambah Mata Kuliah',
    content,
    footer
  });

  modal.querySelector('.modal-cancel').addEventListener('click', close);
  modal.querySelector('#save-course').addEventListener('click', () => {
    const name = modal.querySelector('#course-name').value.trim();
    const credits = parseInt(modal.querySelector('#course-credits').value);
    const semester = parseInt(modal.querySelector('#course-semester').value);
    const grade = modal.querySelector('#course-grade').value;

    if (!name) return showToast('Masukkan nama mata kuliah', 'error');

    if (isEdit) {
      state.updateCourse(course.id, { name, credits, semester, grade });
      showToast('Mata kuliah diperbarui', 'success');
    } else {
      state.addCourse({ id: generateId(), name, credits, semester, grade });
      showToast('Mata kuliah ditambahkan', 'success');
    }

    close();
    renderGrades(document.getElementById('page-container'));
  });
}
