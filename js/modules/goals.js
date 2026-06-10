import { state } from '../state.js';

import { registerRoute } from '../router.js';

import { openModal, confirmDialog } from '../components/modal.js';

import { showToast } from '../components/toast.js';

import { initCharts } from '../components/charts.js';

import {

  calculateGPA, calculateCGPA, getTotalCredits, generateId,

  escapeHtml, daysUntil, animateValue, getGradeScale, formatCurrency

} from '../utils.js';



export function initGoals() {

  registerRoute('goals', renderGoals);

}



function resolveMilestone(m, currentIP, totalCredits) {

  if (m.type === 'auto') {

    if (m.autoKey === 'sks') return { ...m, current: totalCredits };

    if (m.autoKey === 'ip') return { ...m, current: currentIP };

  }

  if (m.type === 'checkbox') {

    return { ...m, current: m.completed ? 1 : 0 };

  }

  return m;

}



function formatMilestoneValue(m, value) {

  if (m.unit === 'currency') return formatCurrency(value);

  if (m.type === 'auto' && m.autoKey === 'ip') return value.toFixed(2);

  return typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value;

}



function formatMilestoneTarget(m) {

  if (m.unit === 'currency') return formatCurrency(m.target);

  if (m.type === 'auto' && m.autoKey === 'ip') return m.target.toFixed(2);

  return m.target;

}



function getMilestoneTypeLabel(m) {

  if (m.type === 'checkbox') return 'Sekali selesai';

  if (m.type === 'numeric') return 'Target angka';

  return 'Otomatis';

}



function renderMilestoneCard(m) {

  const progress = m.type === 'checkbox'

    ? (m.completed ? 100 : 0)

    : (m.target > 0 ? Math.min((m.current / m.target) * 100, 100) : 0);

  const achieved = m.type === 'checkbox' ? m.completed : progress >= 100;



  let footerHtml = '';

  if (m.type === 'checkbox') {

    footerHtml = achieved

      ? `<div class="milestone-card__footer">

          <span class="badge badge--success milestone-card__status-badge">✓ Selesai</span>

          <button type="button" class="btn btn-secondary btn-sm unmark-milestone" data-id="${m.id}">Batalkan</button>

        </div>`

      : `<div class="milestone-card__footer milestone-card__footer--action">

          <button type="button" class="btn btn-primary mark-milestone" data-id="${m.id}">Ya, Selesai!</button>

        </div>`;

  } else if (m.type === 'numeric') {

    footerHtml = `

      <div class="milestone-card__footer milestone-card__footer--numeric">

        <div class="milestone-card__input-wrap">

          <label class="milestone-card__input-label">Progres saat ini</label>

          <div class="milestone-card__input-row">

            <input class="form-input milestone-current-input" type="number" min="0" step="${m.unit === 'currency' ? 1000 : 1}" value="${m.current}" data-id="${m.id}">

            <span class="milestone-card__target-text">/ ${formatMilestoneTarget(m)}</span>

          </div>

        </div>

        <button type="button" class="btn btn-primary update-milestone-current" data-id="${m.id}">Update</button>

      </div>

    `;

  } else {

    footerHtml = `<div class="milestone-card__footer"><span class="milestone-card__auto-note">Diperbarui otomatis dari data akademik</span></div>`;

  }



  const progressText = m.type === 'checkbox'

    ? (achieved ? 'Pencapaian tercapai' : 'Menunggu ditandai selesai')

    : `${formatMilestoneValue(m, m.current)} dari ${formatMilestoneTarget(m)}`;



  return `

    <div class="milestone-card ${achieved ? 'milestone-card--done' : ''}" data-id="${m.id}">

      <div class="milestone-card__header">

        <div class="milestone-card__header-left">

          <span class="milestone-card__badge milestone-card__badge--${m.type}">${getMilestoneTypeLabel(m)}</span>

          <h4 class="milestone-card__title">${escapeHtml(m.title)}</h4>

        </div>

        <div class="milestone-card__header-right">

          ${achieved ? '<span class="milestone-trophy" aria-hidden="true">🏆</span>' : ''}

          <button type="button" class="btn btn-ghost btn-sm delete-milestone" data-id="${m.id}" title="Hapus" aria-label="Hapus pencapaian">

            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>

          </button>

        </div>

      </div>

      <div class="milestone-card__progress-section">

        <div class="milestone-card__progress-top">

          <span class="milestone-card__progress-text">${progressText}</span>

          <span class="milestone-card__progress-pct">${progress.toFixed(0)}%</span>

        </div>

        <div class="progress-bar milestone-progress">

          <div class="progress-bar__fill ${achieved ? 'progress-bar__fill--success' : ''}" style="width:${progress}%"></div>

        </div>

      </div>

      ${footerHtml}

    </div>

  `;

}



function renderGoals(container) {

  const data = state.get();

  const { goals, courses, profile, settings } = data;

  const gradeScale = getGradeScale(settings);



  const currentIP = calculateGPA(courses, profile.semester, gradeScale);

  const ipk = calculateCGPA(courses, gradeScale);

  const totalCredits = getTotalCredits(courses);



  const ipProgress = Math.min((currentIP / goals.targetGPA) * 100, 100);

  const ipkProgress = Math.min((ipk / goals.targetCGPA) * 100, 100);

  const gradDays = daysUntil(goals.graduationDate);



  const milestones = (goals.milestones || []).map(m => resolveMilestone(m, currentIP, totalCredits));



  container.innerHTML = `

    <div class="page">

      <div class="page-header">

        <div class="page-header__top">

          <div>

            <h1 class="page-header__title">Target Akademik</h1>

            <p class="page-header__subtitle">Tetapkan target dan pantau progres akademik Anda</p>

          </div>

        </div>

      </div>



      <div class="page-grid page-grid--2" style="margin-bottom:var(--space-8)">

        <div class="card">

          <h3 class="card__title" style="margin-bottom:var(--space-5)">Target IP</h3>

          <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2)">

            <span style="font-size:var(--font-size-2xl);font-weight:700" id="goal-gpa-current">0.00</span>

            <span style="color:var(--text-muted)">/ ${goals.targetGPA.toFixed(2)}</span>

          </div>

          <div class="progress-bar" style="height:12px;margin-bottom:var(--space-3)">

            <div class="progress-bar__fill" style="width:${ipProgress}%"></div>

          </div>

          <p style="font-size:var(--font-size-sm);color:var(--text-muted)">${ipProgress.toFixed(0)}% dari target tercapai</p>

        </div>

        <div class="card">

          <h3 class="card__title" style="margin-bottom:var(--space-5)">Target IPK</h3>

          <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2)">

            <span style="font-size:var(--font-size-2xl);font-weight:700" id="goal-cgpa-current">0.00</span>

            <span style="color:var(--text-muted)">/ ${goals.targetCGPA.toFixed(2)}</span>

          </div>

          <div class="progress-bar" style="height:12px;margin-bottom:var(--space-3)">

            <div class="progress-bar__fill" style="width:${ipkProgress}%"></div>

          </div>

          <p style="font-size:var(--font-size-sm);color:var(--text-muted)">${ipkProgress.toFixed(0)}% dari target tercapai</p>

        </div>

      </div>



      <div class="card" style="margin-bottom:var(--space-8)">

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-5)">

          <div>

            <h3 class="card__title">Hitung Mundur Kelulusan</h3>

            <p style="font-size:var(--font-size-sm);color:var(--text-muted)">Target: ${goals.graduationDate}</p>

          </div>

          <div style="text-align:right">

            <div style="font-size:var(--font-size-3xl);font-weight:700;color:var(--color-primary)">${gradDays > 0 ? gradDays : 0}</div>

            <div style="font-size:var(--font-size-xs);color:var(--text-muted)">hari tersisa</div>

          </div>

        </div>

        <div class="progress-bar" style="height:8px">

          <div class="progress-bar__fill" style="width:${Math.max(0, 100 - (gradDays / 1460) * 100)}%"></div>

        </div>

      </div>



      <div class="section">

        <div class="section-header" style="margin-bottom:var(--space-5)">

          <h2 class="section-title">Pencapaian</h2>

          <button class="btn btn-primary btn-sm" id="add-milestone-btn">

            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>

            Tambah Pencapaian

          </button>

        </div>

        <div class="milestone-grid">

          ${milestones.length ? milestones.map(m => renderMilestoneCard(m)).join('') : `

            <div class="empty-state" style="grid-column:1/-1">

              <h3 class="empty-state__title">Belum ada pencapaian</h3>

              <p class="empty-state__text">Tambahkan pencapaian seperti "Selesaikan skripsi" atau "Kumpulkan Rp 400.000".</p>

            </div>

          `}

        </div>

      </div>



      <div class="card" style="margin-top:var(--space-8)">

        <h3 class="card__title" style="margin-bottom:var(--space-5)">Ringkasan Progres</h3>

        <div class="chart-container">

          <canvas data-chart="bar" data-config='${JSON.stringify({

            labels: ['IP', 'IPK', 'SKS'],

            data: [

              Math.round((currentIP / goals.targetGPA) * 100),

              Math.round((ipk / goals.targetCGPA) * 100),

              Math.round((totalCredits / (milestones.find(m => m.autoKey === 'sks')?.target || 120)) * 100)

            ]

          })}'></canvas>

        </div>

      </div>



      <div class="card" style="margin-top:var(--space-6)">

        <h3 class="card__title" style="margin-bottom:var(--space-5)">Ubah Target</h3>

        <form id="goals-form">

          <div class="form-row">

            <div class="form-group">

              <label class="form-label" for="goal-gpa">Target IP</label>

              <input class="form-input" id="goal-gpa" type="number" step="0.01" min="0" max="4" value="${goals.targetGPA}">

            </div>

            <div class="form-group">

              <label class="form-label" for="goal-cgpa">Target IPK</label>

              <input class="form-input" id="goal-cgpa" type="number" step="0.01" min="0" max="4" value="${goals.targetCGPA}">

            </div>

          </div>

          <div class="form-group">

            <label class="form-label" for="goal-grad">Perkiraan Tanggal Kelulusan</label>

            <input class="form-input" id="goal-grad" type="date" value="${goals.graduationDate}">

          </div>

          <button type="submit" class="btn btn-primary">Simpan Target</button>

        </form>

      </div>

    </div>

  `;



  requestAnimationFrame(() => {

    initCharts(container);

    animateValue(document.getElementById('goal-gpa-current'), 0, currentIP);

    animateValue(document.getElementById('goal-cgpa-current'), 0, ipk);

  });



  container.querySelector('#goals-form').addEventListener('submit', (e) => {

    e.preventDefault();

    state.updateGoals({

      targetGPA: parseFloat(container.querySelector('#goal-gpa').value),

      targetCGPA: parseFloat(container.querySelector('#goal-cgpa').value),

      graduationDate: container.querySelector('#goal-grad').value

    });

    showToast('Target diperbarui', 'success');

    renderGoals(container);

  });



  container.querySelector('#add-milestone-btn')?.addEventListener('click', () => showMilestoneModal());



  container.querySelectorAll('.delete-milestone').forEach(btn => {

    btn.addEventListener('click', async () => {

      const ok = await confirmDialog({

        title: 'Hapus Pencapaian',

        message: 'Pencapaian ini akan dihapus permanen.',

        detail: 'Tindakan ini tidak dapat dibatalkan.',

        confirmText: 'Ya, Hapus',

        variant: 'danger'

      });

      if (ok) {

        state.deleteMilestone(btn.dataset.id);

        showToast('Pencapaian dihapus', 'success');

        renderGoals(container);

      }

    });

  });



  container.querySelectorAll('.mark-milestone').forEach(btn => {

    btn.addEventListener('click', () => {

      state.updateMilestone(btn.dataset.id, { completed: true, current: 1 });

      showToast('Pencapaian ditandai selesai!', 'success');

      renderGoals(container);

    });

  });



  container.querySelectorAll('.unmark-milestone').forEach(btn => {

    btn.addEventListener('click', () => {

      state.updateMilestone(btn.dataset.id, { completed: false, current: 0 });

      showToast('Status pencapaian dibatalkan', 'info');

      renderGoals(container);

    });

  });



  container.querySelectorAll('.update-milestone-current').forEach(btn => {

    btn.addEventListener('click', () => {

      const input = container.querySelector(`.milestone-current-input[data-id="${btn.dataset.id}"]`);

      const val = parseFloat(input.value) || 0;

      const target = goals.milestones.find(m => m.id === btn.dataset.id)?.target || 0;

      state.updateMilestone(btn.dataset.id, { current: val, completed: val >= target });

      showToast('Progres diperbarui', 'success');

      renderGoals(container);

    });

  });

}



function showMilestoneModal() {

  const content = `

    <form id="milestone-form">

      <div class="form-group">

        <label class="form-label" for="ms-title">Judul Pencapaian</label>

        <input class="form-input" id="ms-title" type="text" required placeholder="cth. Selesaikan skripsi">

      </div>

      <div class="form-group">

        <label class="form-label" for="ms-type">Tipe Pencapaian</label>

        <select class="form-select" id="ms-type">

          <option value="checkbox">Sekali selesai (tombol Ya)</option>

          <option value="numeric">Target angka custom</option>

        </select>

      </div>

      <div id="ms-numeric-fields" style="display:none">

        <div class="form-group">

          <label class="form-label" for="ms-target">Target</label>

          <input class="form-input" id="ms-target" type="number" min="1" step="1" placeholder="cth. 400000">

        </div>

        <div class="form-group">

          <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;font-size:var(--font-size-sm)">

            <input type="checkbox" id="ms-currency"> Format mata uang (Rp)

          </label>

        </div>

        <div class="form-group">

          <label class="form-label" for="ms-current">Progres saat ini</label>

          <input class="form-input" id="ms-current" type="number" min="0" step="1" value="0">

        </div>

      </div>

    </form>

  `;



  const footer = `

    <button class="btn btn-secondary modal-cancel">Batal</button>

    <button class="btn btn-primary" id="save-milestone">Tambah</button>

  `;



  const { close, modal } = openModal({ title: 'Tambah Pencapaian', content, footer });



  const typeSelect = modal.querySelector('#ms-type');

  const numericFields = modal.querySelector('#ms-numeric-fields');



  typeSelect.addEventListener('change', () => {

    numericFields.style.display = typeSelect.value === 'numeric' ? '' : 'none';

  });



  modal.querySelector('.modal-cancel').addEventListener('click', close);

  modal.querySelector('#save-milestone').addEventListener('click', () => {

    const title = modal.querySelector('#ms-title').value.trim();

    const type = typeSelect.value;



    if (!title) return showToast('Masukkan judul pencapaian', 'error');



    if (type === 'checkbox') {

      state.addMilestone({

        id: generateId(), title, type: 'checkbox', target: 1, current: 0, completed: false

      });

    } else {

      const target = parseFloat(modal.querySelector('#ms-target').value);

      const current = parseFloat(modal.querySelector('#ms-current').value) || 0;

      const isCurrency = modal.querySelector('#ms-currency').checked;



      if (!target || target <= 0) return showToast('Masukkan target yang valid', 'error');



      state.addMilestone({

        id: generateId(), title, type: 'numeric', target, current,

        completed: current >= target, unit: isCurrency ? 'currency' : 'number'

      });

    }



    showToast('Pencapaian ditambahkan', 'success');

    close();

    renderGoals(document.getElementById('page-container'));

  });

}

