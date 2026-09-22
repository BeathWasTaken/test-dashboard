import { state } from '../state.js';
import {
  generateId, formatRelativeTime, escapeHtml,
  daysUntil, getDayName, formatDate, formatTime, matchesDay,
  calculateAttendancePercentage, getAttendanceByCourse, formatCurrency
} from '../utils.js';

export function initNotifications() {
  generateNotifications();
  state.subscribe(() => {
    generateNotifications();
    updateNotificationUI();
  });
}

export function generateNotifications() {
  const data = state.get();
  const notifications = [];
  const now = new Date().toISOString();

  data.assignments.filter(a => a.status !== 'done').forEach(a => {
    const days = daysUntil(a.deadline);
    if (days <= 3 && days >= 0) {
      notifications.push({
        id: generateId(),
        type: 'assignment',
        title: days === 0 ? 'Tugas jatuh tempo hari ini!' : `Tugas jatuh tempo ${days} hari lagi`,
        message: `${a.title} — ${a.course}`,
        time: now,
        read: false,
        link: 'assignments'
      });
    } else if (days < 0) {
      notifications.push({
        id: generateId(),
        type: 'assignment',
        title: 'Tugas terlambat',
        message: `${a.title} seharusnya selesai ${formatDate(a.deadline)}`,
        time: now,
        read: false,
        link: 'assignments'
      });
    }
  });

  const today = getDayName();
  data.schedule.filter(s => matchesDay(s.day, today)).forEach(s => {
    notifications.push({
      id: generateId(),
      type: 'class',
      title: 'Kelas hari ini',
      message: `${s.courseName} pukul ${formatTime(s.startTime)} — ${s.room}`,
      time: now,
      read: false,
      link: 'schedule'
    });
  });

  const txs = data.transactions || [];
  let totalIncome = 0;
  let totalExpense = 0;
  txs.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });
  if (totalExpense > totalIncome && txs.length > 0) {
    notifications.push({
      id: generateId(),
      type: 'finance',
      title: 'Pengeluaran melebihi pemasukan',
      message: `Pengeluaran ${formatCurrency(totalExpense)} lebih besar dari pemasukan ${formatCurrency(totalIncome)}`,
      time: now,
      read: false,
      link: 'finance'
    });
  }

  const threshold = data.settings.attendanceWarningThreshold || 75;
  const courseNames = [...new Set(data.attendance.map(a => a.course))];
  courseNames.forEach(name => {
    const records = getAttendanceByCourse(data.attendance, name);
    const pct = calculateAttendancePercentage(records);
    if (pct < threshold && records.length > 0) {
      notifications.push({
        id: generateId(),
        type: 'attendance',
        title: 'Peringatan kehadiran rendah',
        message: `${name} hanya ${pct}% (di bawah batas ${threshold}%)`,
        time: now,
        read: false,
        link: 'attendance'
      });
    }
  });

  if (notifications.length > 0) {
    const existing = new Set(data.notifications.map(n => `${n.type}:${n.title}:${n.message}`));
    const fresh = notifications.filter(n => !existing.has(`${n.type}:${n.title}:${n.message}`));
    if (fresh.length > 0) {
      data.notifications = [...fresh, ...data.notifications].slice(0, 50);
      state.persist();
    }
  }
}

export function updateNotificationUI() {
  const data = state.get();
  const badge = document.getElementById('notification-badge');
  const list = document.getElementById('notification-list');
  const unread = data.notifications.filter(n => !n.read).length;

  if (badge) {
    badge.textContent = unread;
    badge.classList.toggle('hidden', unread === 0);
  }

  if (list) {
    if (data.notifications.length === 0) {
      list.innerHTML = '<div style="padding:var(--space-8);text-align:center;color:var(--text-muted)">Tidak ada notifikasi</div>';
    } else {
      list.innerHTML = data.notifications.slice(0, 20).map(n => {
        const icons = {
          assignment: { bg: 'rgba(245,158,11,0.1)', icon: '📝' },
          exam: { bg: 'rgba(239,68,68,0.1)', icon: '📋' },
          class: { bg: 'rgba(99,102,241,0.1)', icon: '📚' },
          attendance: { bg: 'rgba(239,68,68,0.1)', icon: '⚠️' },
          finance: { bg: 'rgba(239,68,68,0.1)', icon: '💸' },
          info: { bg: 'rgba(59,130,246,0.1)', icon: 'ℹ️' }
        };
        const style = icons[n.type] || icons.info;
        return `
          <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}" data-link="${n.link || ''}" role="listitem">
            <div class="notification-item__icon" style="background:${style.bg}">
              <span>${style.icon}</span>
            </div>
            <div>
              <div class="notification-item__title">${escapeHtml(n.title)}</div>
              <div class="notification-item__text">${escapeHtml(n.message)}</div>
              <div class="notification-item__time">${formatRelativeTime(n.time)}</div>
            </div>
          </div>
        `;
      }).join('');

      list.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
          state.markNotificationRead(item.dataset.id);
          if (item.dataset.link) {
            window.location.hash = item.dataset.link;
            document.getElementById('notification-panel').classList.add('hidden');
          }
        });
      });
    }
  }
}

export function initNotificationPanel() {
  const btn = document.getElementById('notification-btn');
  const panel = document.getElementById('notification-panel');
  const markAll = document.getElementById('mark-all-read');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !panel.classList.contains('hidden');
    panel.classList.toggle('hidden', isOpen);
    btn.setAttribute('aria-expanded', !isOpen);
    if (!isOpen) updateNotificationUI();
  });

  markAll.addEventListener('click', () => {
    state.markAllNotificationsRead();
    updateNotificationUI();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notification-wrapper')) {
      panel.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  updateNotificationUI();
}
