import { loadData, saveData } from './storage.js';

class AppState {
  constructor() {
    this.data = loadData();
    this.listeners = new Set();
    this.currentPage = 'dashboard';
  }

  get() {
    return this.data;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.data));
  }

  update(path, value) {
    const keys = path.split('.');
    let obj = this.data;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    this.persist();
    this.notify();
  }

  setData(newData) {
    this.data = newData;
    this.persist();
    this.notify();
  }

  persist() {
    saveData(this.data);
  }

  // Profile
  updateProfile(profile) {
    this.data.profile = { ...this.data.profile, ...profile };
    this.persist();
    this.notify();
  }

  // Courses
  addCourse(course) {
    this.data.courses.push(course);
    this.persist();
    this.notify();
  }

  updateCourse(id, updates) {
    const idx = this.data.courses.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.courses[idx] = { ...this.data.courses[idx], ...updates };
      this.persist();
      this.notify();
    }
  }

  deleteCourse(id) {
    this.data.courses = this.data.courses.filter(c => c.id !== id);
    this.persist();
    this.notify();
  }

  // Schedule
  addScheduleItem(item) {
    this.data.schedule.push(item);
    this.persist();
    this.notify();
  }

  updateScheduleItem(id, updates) {
    const idx = this.data.schedule.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.schedule[idx] = { ...this.data.schedule[idx], ...updates };
      this.persist();
      this.notify();
    }
  }

  deleteScheduleItem(id) {
    this.data.schedule = this.data.schedule.filter(s => s.id !== id);
    this.persist();
    this.notify();
  }

  // Assignments
  addAssignment(assignment) {
    this.data.assignments.push(assignment);
    this.persist();
    this.notify();
  }

  updateAssignment(id, updates) {
    const idx = this.data.assignments.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.assignments[idx] = { ...this.data.assignments[idx], ...updates };
      this.persist();
      this.notify();
    }
  }

  deleteAssignment(id) {
    this.data.assignments = this.data.assignments.filter(a => a.id !== id);
    this.persist();
    this.notify();
  }

  // Tandai tugas selesai: hitung ke progres lalu hapus dari daftar aktif
  completeAssignment(id) {
    const exists = this.data.assignments.some(a => a.id === id);
    if (exists) {
      this.data.completedAssignments = (this.data.completedAssignments || 0) + 1;
      this.data.assignments = this.data.assignments.filter(a => a.id !== id);
    }
    this.persist();
    this.notify();
  }

  // Keuangan (transaksi)
  addTransaction(transaction) {
    if (!this.data.transactions) this.data.transactions = [];
    this.data.transactions.push(transaction);
    this.persist();
    this.notify();
  }

  updateTransaction(id, updates) {
    if (!this.data.transactions) this.data.transactions = [];
    const idx = this.data.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.data.transactions[idx] = { ...this.data.transactions[idx], ...updates };
      this.persist();
      this.notify();
    }
  }

  deleteTransaction(id) {
    if (!this.data.transactions) this.data.transactions = [];
    this.data.transactions = this.data.transactions.filter(t => t.id !== id);
    this.persist();
    this.notify();
  }

  // Attendance
  addAttendance(record) {
    this.data.attendance.push(record);
    this.persist();
    this.notify();
  }

  updateAttendance(id, updates) {
    const idx = this.data.attendance.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.attendance[idx] = { ...this.data.attendance[idx], ...updates };
      this.persist();
      this.notify();
    }
  }

  deleteAttendance(id) {
    this.data.attendance = this.data.attendance.filter(a => a.id !== id);
    this.persist();
    this.notify();
  }

  // Goals
  updateGoals(goals) {
    this.data.goals = { ...this.data.goals, ...goals };
    this.persist();
    this.notify();
  }

  addMilestone(milestone) {
    if (!this.data.goals.milestones) this.data.goals.milestones = [];
    this.data.goals.milestones.push(milestone);
    this.persist();
    this.notify();
  }

  updateMilestone(id, updates) {
    if (!this.data.goals.milestones) this.data.goals.milestones = [];
    const idx = this.data.goals.milestones.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.data.goals.milestones[idx] = { ...this.data.goals.milestones[idx], ...updates };
      this.persist();
      this.notify();
    }
  }

  deleteMilestone(id) {
    if (!this.data.goals.milestones) this.data.goals.milestones = [];
    this.data.goals.milestones = this.data.goals.milestones.filter(m => m.id !== id);
    this.persist();
    this.notify();
  }

  // Notifications
  addNotification(notification) {
    this.data.notifications.unshift(notification);
    if (this.data.notifications.length > 50) {
      this.data.notifications = this.data.notifications.slice(0, 50);
    }
    this.persist();
    this.notify();
  }

  markNotificationRead(id) {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.persist();
      this.notify();
    }
  }

  markAllNotificationsRead() {
    this.data.notifications.forEach(n => { n.read = true; });
    this.persist();
    this.notify();
  }

  // Settings
  updateSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.persist();
    this.notify();
  }

  setPage(page) {
    this.currentPage = page;
    this.notify();
  }
}

export const state = new AppState();
