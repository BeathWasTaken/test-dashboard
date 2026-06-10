import { state } from '../state.js';

import { registerRoute } from '../router.js';

import { initCharts } from '../components/charts.js';

import { tPriority } from '../i18n.js';

import {

  calculateGPA, calculateCGPA, getTotalCredits, getGPATrend,

  getGradeDistribution, formatDate, formatTime, getDayName,

  daysUntil, escapeHtml, animateValue, matchesDay, getGradeScale, formatCurrency

} from '../utils.js';



export function initDashboard() {

  registerRoute('dashboard', renderDashboard);

}



function renderDashboard(container) {

  const data = state.get();

  const { profile, courses, assignments, transactions, schedule, attendance, settings } = data;

  const gradeScale = getGradeScale(settings);



  const currentIP = calculateGPA(courses, profile.semester, gradeScale);

  const ipk = calculateCGPA(courses, gradeScale);

  const totalCredits = getTotalCredits(courses);

  const currentSemCredits = getTotalCredits(courses, profile.semester);

  const upcomingAssignments = assignments.filter(a => a.status !== 'done' && daysUntil(a.deadline) >= 0);

  const today = getDayName();

  const todayClasses = schedule.filter(s => matchesDay(s.day, today)).sort((a, b) => a.startTime.localeCompare(b.startTime));



  const courseNames = [...new Set(attendance.map(a => a.course))];

  let totalAttPct = 0;

  courseNames.forEach(name => {

    const records = attendance.filter(a => a.course === name);

    const present = records.filter(r => r.status === 'present' || r.status === 'excused').length;

    totalAttPct += records.length ? (present / records.length) * 100 : 100;

  });

  const attendancePct = courseNames.length ? Math.round(totalAttPct / courseNames.length) : 100;



  const completedAssignments = data.completedAssignments || 0;

  const totalTracked = assignments.length + completedAssignments;

  const progressPct = totalTracked ? Math.round((completedAssignments / totalTracked) * 100) : 0;



  const gpaTrend = getGPATrend(courses, gradeScale);

  const gradeDist = getGradeDistribution(courses.filter(c => c.semester === profile.semester));



  const txs = transactions || [];

  let finInc = 0, finExp = 0;

  txs.forEach(t => { if (t.type === 'income') finInc += t.amount; else finExp += t.amount; });

  const finBal = finInc - finExp;



  const hour = new Date().getHours();

  const greeting = hour < 11 ? 'Selamat pagi,' : hour < 15 ? 'Selamat siang,' : 'Selamat malam,';



  const quickLinks = [

    { nav: 'grades', label: 'Nilai', icon: '📊' },

    { nav: 'schedule', label: 'Jadwal', icon: '📅' },

    { nav: 'assignments', label: 'Tugas', icon: '✅' },

    { nav: 'finance', label: 'Keuangan', icon: '💰' }

  ];



  container.innerHTML = `

    <div class="page dashboard">

      <div class="welcome-banner animate-in">

        <div class="welcome-banner__content">

          <div class="welcome-banner__top">

            <div>

              <p class="welcome-banner__greeting">${greeting}</p>

              <h1 class="welcome-banner__name">${escapeHtml(profile.name)}</h1>

              <p class="welcome-banner__major">${escapeHtml(profile.major)} · Semester ${profile.semester}</p>

            </div>

            <div class="welcome-banner__gpa-cards">

              <div class="welcome-gpa-card">

                <span class="welcome-gpa-card__label">IP Semester</span>

                <span class="welcome-gpa-card__value" id="dash-gpa">0.00</span>

              </div>

              <div class="welcome-gpa-card welcome-gpa-card--highlight">

                <span class="welcome-gpa-card__label">IPK</span>

                <span class="welcome-gpa-card__value" id="dash-cgpa">0.00</span>

              </div>

            </div>

          </div>

          <div class="dash-quick-links">

            ${quickLinks.map(l => `

              <a href="#${l.nav}" class="dash-quick-link" data-nav="${l.nav}">

                <span class="dash-quick-link__icon">${l.icon}</span>

                <span>${l.label}</span>

              </a>

            `).join('')}

          </div>

        </div>

      </div>



      <div class="dash-overview">

        <div class="dash-overview__card animate-card stagger-1">

          <div class="dash-overview__icon dash-overview__icon--primary">📚</div>

          <div class="dash-overview__body">

            <span class="dash-overview__label">Mata Kuliah Aktif</span>

            <span class="dash-overview__value">${courses.filter(c => c.semester === profile.semester).length}</span>

            <span class="dash-overview__sub">${currentSemCredits} SKS semester ini</span>

          </div>

        </div>

        <div class="dash-overview__card animate-card stagger-2">

          <div class="dash-overview__icon dash-overview__icon--success">👤</div>

          <div class="dash-overview__body">

            <span class="dash-overview__label">Kehadiran</span>

            <span class="dash-overview__value">${attendancePct}%</span>

            <span class="dash-overview__sub">${courseNames.length} mata kuliah dilacak</span>

          </div>

        </div>

        <div class="dash-overview__card animate-card stagger-3">

          <div class="dash-overview__icon dash-overview__icon--warning">📝</div>

          <div class="dash-overview__body">

            <span class="dash-overview__label">Tugas Aktif</span>

            <span class="dash-overview__value">${upcomingAssignments.length}</span>

            <span class="dash-overview__sub">${completedAssignments} selesai · ${progressPct}%</span>

          </div>

        </div>

        <div class="dash-overview__card animate-card stagger-4">

          <div class="dash-overview__icon dash-overview__icon--info">🎓</div>

          <div class="dash-overview__body">

            <span class="dash-overview__label">Total SKS</span>

            <span class="dash-overview__value">${totalCredits}</span>

            <span class="dash-overview__sub">SKS kumulatif</span>

          </div>

        </div>

      </div>



      <div class="page-grid page-grid--2 dash-section" style="margin-top:var(--space-8)">

        <div class="card dash-card animate-in stagger-2">

          <div class="dash-card__header">

            <h3 class="card__title">Tren IP per Semester</h3>

          </div>

          <div class="chart-container">

            <canvas data-chart="line" data-config='${JSON.stringify({

              labels: gpaTrend.map(t => `Sem ${t.semester}`),

              datasets: [{ data: gpaTrend.map(t => t.gpa), fill: true, color: '#6366f1' }],

              options: { maxY: 4 }

            })}'></canvas>

          </div>

        </div>

        <div class="card dash-card animate-in stagger-3">

          <div class="dash-card__header">

            <h3 class="card__title">Distribusi Nilai Semester Ini</h3>

          </div>

          <div class="chart-container">

            <canvas data-chart="bar" data-config='${JSON.stringify({

              labels: Object.keys(gradeDist).filter(g => gradeDist[g] > 0),

              data: Object.keys(gradeDist).filter(g => gradeDist[g] > 0).map(g => gradeDist[g])

            })}'></canvas>

          </div>

        </div>

      </div>



      <div class="page-grid page-grid--2 dash-section" style="margin-top:var(--space-6)">

        <div class="card dash-card animate-in stagger-4">

          <div class="dash-card__header">

            <h3 class="card__title">Kelas Hari Ini</h3>

            <span class="badge badge--primary">${today}</span>

          </div>

          <div class="dash-list">

            ${todayClasses.length ? todayClasses.map(c => `

              <div class="dash-list__item">

                <div class="dash-list__time">${formatTime(c.startTime)}</div>

                <div class="dash-list__body">

                  <div class="dash-list__title">${escapeHtml(c.courseName)}</div>

                  <div class="dash-list__meta">${escapeHtml(c.lecturer)}${c.mode === 'online' ? ' · Online' : c.room ? ` · ${escapeHtml(c.room)}` : ''}</div>

                </div>

              </div>

            `).join('') : '<div class="dash-empty">Tidak ada kelas hari ini 🎉</div>'}

          </div>

        </div>



        <div class="card dash-card animate-in stagger-5">

          <div class="dash-card__header">

            <h3 class="card__title">Tenggat Mendatang</h3>

            <a href="#assignments" class="btn-text" data-nav="assignments">Lihat semua</a>

          </div>

          <div class="dash-list">

            ${upcomingAssignments.slice(0, 5).map(a => {

              const days = daysUntil(a.deadline);

              const urgent = days <= 2;

              return `

              <div class="dash-list__item ${urgent ? 'dash-list__item--urgent' : ''}">

                <div class="dash-list__body">

                  <div class="dash-list__title">${escapeHtml(a.title)}</div>

                  <div class="dash-list__meta">${escapeHtml(a.course)} · ${formatDate(a.deadline)}</div>

                </div>

                <span class="badge priority-${a.priority}">${tPriority(a.priority)}</span>

              </div>

            `}).join('') || '<div class="dash-empty">Tidak ada tenggat mendatang</div>'}

          </div>

        </div>

      </div>



      <div class="card dash-card animate-in stagger-6" style="margin-top:var(--space-6)">

        <div class="dash-card__header">

          <h3 class="card__title">Keuangan</h3>

          <a href="#finance" class="btn-text" data-nav="finance">Kelola keuangan</a>

        </div>

        <div class="dash-finance">

          <div class="dash-finance__summary">

            <div class="dash-finance__balance">

              <span class="dash-finance__label">Saldo</span>

              <span class="dash-finance__value" style="color:${finBal >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">${formatCurrency(finBal)}</span>

            </div>

            <div class="dash-finance__flow-box">

              <div class="dash-finance__flow-item">

                <span class="dash-finance__label">Pemasukan</span>

                <span class="dash-finance__in">+${formatCurrency(finInc)}</span>

              </div>

              <div class="dash-finance__flow-divider" aria-hidden="true"></div>

              <div class="dash-finance__flow-item">

                <span class="dash-finance__label">Pengeluaran</span>

                <span class="dash-finance__out">-${formatCurrency(finExp)}</span>

              </div>

            </div>

          </div>

          <div class="dash-finance__list">

            ${txs.slice(0, 4).map(t => `

              <div class="dash-finance__item">

                <div class="dash-finance__item-info">

                  <span class="dash-finance__item-title">${escapeHtml(t.title)}</span>

                  <span class="dash-finance__item-meta">${formatDate(t.date)} · ${escapeHtml(t.category)}</span>

                </div>

                <span class="dash-finance__item-amount ${t.type === 'income' ? 'dash-finance__item-amount--in' : 'dash-finance__item-amount--out'}">

                  ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}

                </span>

              </div>

            `).join('') || '<div class="dash-empty">Belum ada transaksi</div>'}

          </div>

        </div>

      </div>

    </div>

  `;



  requestAnimationFrame(() => {

    initCharts(container);

    const gpaEl = document.getElementById('dash-gpa');

    const cgpaEl = document.getElementById('dash-cgpa');

    if (gpaEl) animateValue(gpaEl, 0, currentIP);

    if (cgpaEl) animateValue(cgpaEl, 0, ipk);

  });



  container.querySelectorAll('[data-nav]').forEach(link => {

    link.addEventListener('click', (e) => {

      e.preventDefault();

      window.location.hash = link.dataset.nav;

    });

  });

}

