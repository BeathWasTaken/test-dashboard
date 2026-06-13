const STORAGE_KEY = 'campusify_data';

export const defaultData = {
  profile: {
    name: 'Mahasiswa',
    studentId: '',
    major: '',
    semester: 1,
    email: '',
    avatar: null
  },
  settings: {
    theme: 'light',
    attendanceWarningThreshold: 75,
    gradeScale: null,
    scheduleYear: new Date().getFullYear()
  },
  courses: [],
  schedule: [],
  assignments: [],
  transactions: [],
  attendance: [],
  goals: {
    targetGPA: 3.5,
    targetCGPA: 3.6,
    graduationDate: new Date(new Date().getFullYear() + 4, 5, 15).toISOString().split('T')[0],
    milestones: []
  },
  notifications: [],
  completedAssignments: 0
};

export function normalizeMilestones(milestones) {
  return milestones.map(m => {
    if (m.type) return m;
    if (m.target === 1 && !/SKS|IP/i.test(m.title)) {
      return { ...m, type: 'checkbox', current: m.completed ? 1 : (m.current || 0) };
    }
    if (/SKS|kredit/i.test(m.title)) return { ...m, type: 'auto', autoKey: 'sks' };
    if (/IP/i.test(m.title)) return { ...m, type: 'auto', autoKey: 'ip' };
    return { ...m, type: 'numeric', unit: m.target >= 10000 ? 'currency' : 'number' };
  });
}

function getRelativeDate(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

export function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const merged = {
        ...defaultData,
        ...parsed,
        profile: { ...defaultData.profile, ...parsed.profile },
        settings: { ...defaultData.settings, ...parsed.settings, gradeScale: parsed.settings?.gradeScale ?? null },
        goals: {
          ...defaultData.goals,
          ...parsed.goals,
          milestones: normalizeMilestones(parsed.goals?.milestones ?? defaultData.goals.milestones)
        },
        transactions: parsed.transactions ?? defaultData.transactions,
        completedAssignments: Number.isFinite(parsed.completedAssignments) ? parsed.completedAssignments : 0
      };
      delete merged.exams;
      return merged;
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  return structuredClone(defaultData);
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save data:', e);
    return false;
  }
}

export function exportData(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `campusify-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(new Error('File JSON tidak valid'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsText(file);
  });
}

export function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  return structuredClone(defaultData);
}
