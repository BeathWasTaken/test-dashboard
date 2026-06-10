export const GRADE_SCALE = {
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'D': 1.0,
  'E': 0.0
};

export const GRADE_OPTIONS = Object.keys(GRADE_SCALE);

export const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
export const DAYS_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const DAY_ALIASES = {
  Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu',
  Thursday: 'Kamis', Friday: 'Jumat', Saturday: 'Sabtu', Sunday: 'Minggu'
};

export function normalizeDay(day) {
  return DAY_ALIASES[day] || day;
}

export function matchesDay(scheduleDay, targetDay) {
  return normalizeDay(scheduleDay) === normalizeDay(targetDay);
}

export function dayIndex(day) {
  return DAYS.indexOf(normalizeDay(day));
}

export const PRIORITIES = ['low', 'medium', 'high'];
export const STATUSES = ['todo', 'in-progress', 'done'];
export const ATTENDANCE_STATUS = ['present', 'absent', 'excused'];

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function resizeAvatarImage(file, maxSize = 128) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File harus berupa gambar'));
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      reject(new Error('Ukuran gambar maksimal 3 MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(maxSize / img.width, maxSize / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (maxSize - w) / 2, (maxSize - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

export function buildCourseSelectHtml(courses, { selected = '', showSemester = true } = {}) {
  const options = courses.map(c => {
    const label = showSemester ? `${c.name} (Sem ${c.semester})` : c.name;
    const isSelected = c.name === selected ? ' selected' : '';
    return `<option value="${escapeHtml(c.name)}"${isSelected}>${escapeHtml(label)}</option>`;
  }).join('');
  return `<option value="">— Pilih mata kuliah —</option>${options}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  return `${h.padStart(2, '0')}:${m}`;
}

export function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return formatDate(dateStr.split('T')[0]);
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function getDayName(date = new Date()) {
  return DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
}

export function getInitials(name) {
  if (!name) return 'M';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getGradeScale(settings) {
  return { ...GRADE_SCALE, ...(settings?.gradeScale || {}) };
}

export function getGradePoints(grade, gradeScale = GRADE_SCALE) {
  const scale = gradeScale || GRADE_SCALE;
  return scale[grade] ?? 0;
}

export function calculateGPA(courses, semester = null, gradeScale = GRADE_SCALE) {
  const filtered = semester
    ? courses.filter(c => c.semester === semester)
    : courses;

  if (filtered.length === 0) return 0;

  let totalPoints = 0;
  let totalCredits = 0;

  filtered.forEach(course => {
    const points = getGradePoints(course.grade, gradeScale);
    const credits = course.credits || 0;
    totalPoints += points * credits;
    totalCredits += credits;
  });

  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

export function calculateCGPA(courses, gradeScale = GRADE_SCALE) {
  return calculateGPA(courses, null, gradeScale);
}

export function getTotalCredits(courses, semester = null) {
  const filtered = semester
    ? courses.filter(c => c.semester === semester)
    : courses;
  return filtered.reduce((sum, c) => sum + (c.credits || 0), 0);
}

export function getGradeDistribution(courses) {
  const dist = {};
  GRADE_OPTIONS.forEach(g => { dist[g] = 0; });
  courses.forEach(c => {
    if (dist[c.grade] !== undefined) dist[c.grade]++;
  });
  return dist;
}

export function getGPATrend(courses, gradeScale = GRADE_SCALE) {
  const semesters = [...new Set(courses.map(c => c.semester))].sort((a, b) => a - b);
  return semesters.map(sem => ({
    semester: sem,
    gpa: calculateGPA(courses, sem, gradeScale),
    credits: getTotalCredits(courses, sem)
  }));
}

export function getCreditAccumulation(courses) {
  const trend = getGPATrend(courses);
  let cumulative = 0;
  return trend.map(t => {
    cumulative += t.credits;
    return { semester: t.semester, credits: cumulative };
  });
}

export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function detectConflicts(schedule) {
  const conflicts = new Set();
  const byDay = {};

  schedule.forEach(item => {
    if (!byDay[item.day]) byDay[item.day] = [];
    byDay[item.day].push(item);
  });

  Object.values(byDay).forEach(dayItems => {
    for (let i = 0; i < dayItems.length; i++) {
      for (let j = i + 1; j < dayItems.length; j++) {
        const a = dayItems[i];
        const b = dayItems[j];
        const aStart = timeToMinutes(a.startTime);
        const aEnd = timeToMinutes(a.endTime);
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);

        if (aStart < bEnd && bStart < aEnd) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }
      }
    }
  });

  return conflicts;
}

export function calculateAttendancePercentage(records) {
  if (records.length === 0) return 100;
  const present = records.filter(r => r.status === 'present' || r.status === 'excused').length;
  return Math.round((present / records.length) * 100);
}

export function getAttendanceByCourse(attendance, courseName) {
  return attendance.filter(a => a.course === courseName);
}

export function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / 86400000);
}

export function getCountdown(dateStr, timeStr = '00:00') {
  const target = new Date(`${dateStr}T${timeStr}:00`);
  const now = new Date();
  const diff = target - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return { days, hours, minutes, seconds, expired: false };
}

export function getNextDateForDay(dayName) {
  const targetIndex = dayIndex(dayName);
  if (targetIndex < 0) return getToday();
  const d = new Date();
  const currentIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
  let diff = targetIndex - currentIndex;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export function buildScheduleGCalUrl(item) {
  const date = getNextDateForDay(item.day);
  const isOnline = item.mode === 'online';
  return buildGoogleCalendarUrl({
    title: item.courseName,
    description: `Dosen: ${item.lecturer || '—'}${isOnline ? '\nMode: Online' : ''}`,
    date,
    startTime: item.startTime,
    endTime: item.endTime,
    location: isOnline ? 'Kuliah Online' : (item.room || '')
  });
}

export function buildGoogleCalendarUrl({ title, description, date, startTime, endTime, location }) {
  const formatGCalDate = (d, t) => {
    const dt = new Date(`${d}T${t || '00:00'}:00`);
    return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const start = formatGCalDate(date, startTime || '09:00');
  const end = formatGCalDate(date, endTime || startTime || '10:00');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Campusify Event',
    details: description || '',
    location: location || '',
    dates: `${start}/${end}`
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function animateValue(element, start, end, duration = 800, decimals = 2) {
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * eased;
    element.textContent = decimals > 0 ? current.toFixed(decimals) : Math.round(current);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}
