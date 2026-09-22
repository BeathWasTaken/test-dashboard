export const LABEL = {
  priority: { low: 'Mudah', medium: 'Sedang', high: 'Sulit' },
  status: { todo: 'Belum dikerjakan', 'in-progress': 'Sedang dikerjakan', done: 'Selesai' },
  attendance: { present: 'Hadir', absent: 'Tidak hadir', excused: 'Izin' }
};

export function tPriority(value) {
  return LABEL.priority[value] || value;
}

export function parsePriority(label) {
  const map = {
    Mudah: 'low', Sedang: 'medium', Sulit: 'high',
    Rendah: 'low', Tinggi: 'high', low: 'low', medium: 'medium', high: 'high'
  };
  return map[label] || 'medium';
}

export function parseStatus(label) {
  const map = {
    'Belum dikerjakan': 'todo', 'Sedang dikerjakan': 'in-progress', Selesai: 'done',
    todo: 'todo', 'in-progress': 'in-progress', done: 'done'
  };
  return map[label] || 'todo';
}

export function parseAttendance(label) {
  const map = {
    Hadir: 'present', 'Tidak hadir': 'absent', Izin: 'excused',
    present: 'present', absent: 'absent', excused: 'excused'
  };
  return map[label] || 'present';
}

export function tStatus(value) {
  return LABEL.status[value] || value;
}

export function tAttendance(value) {
  return LABEL.attendance[value] || value;
}
