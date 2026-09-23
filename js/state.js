import { api } from './api/client.js';

class AppState {
  constructor() {
    this.currentUserEmail = null;
    this.data = api.defaultData;
    this.listeners = new Set();
    this.currentPage = 'dashboard';
    this.pendingWrites = new Map();
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

  setData(newData) {
    this.data = newData;
    this.notify();
  }

  setUserEmail(email) {
    this.currentUserEmail = email;
  }

  async refreshFromServer() {
    if (!this.currentUserEmail) return;
    try {
      const data = await api.getAllData();
      if (data.success && data.data) {
        this.data = data.data;
        this.notify();
      }
    } catch (error) {
      console.error('Failed to sync from server:', error);
    }
  }

  // Queue writes to server
  queueWrite(key, fn) {
    if (this.pendingWrites.has(key)) {
      clearTimeout(this.pendingWrites.get(key));
    }
    const timeout = setTimeout(() => {
      fn().catch(err => console.error(`Sync failed for ${key}:`, err));
      this.pendingWrites.delete(key);
    }, 100);
    this.pendingWrites.set(key, timeout);
  }

  // Profile
  updateProfile(profile) {
    this.data.profile = { ...this.data.profile, ...profile };
    this.notify();
    this.queueWrite('profile', () => api.updateProfile(this.data.profile, this.data.settings));
  }

  // Courses
  addCourse(course) {
    this.data.courses.push(course);
    this.notify();
    this.queueWrite('courses', () => api.addCourse(course));
  }

  updateCourse(id, updates) {
    const idx = this.data.courses.findIndex(c => c._id === id || c.id === id);
    if (idx !== -1) {
      this.data.courses[idx] = { ...this.data.courses[idx], ...updates };
      this.notify();
      this.queueWrite(`course-${id}`, () => api.updateCourse(id, updates));
    }
  }

  deleteCourse(id) {
    this.data.courses = this.data.courses.filter(c => c._id !== id && c.id !== id);
    this.notify();
    this.queueWrite(`course-del-${id}`, () => api.deleteCourse(id));
  }

  // Schedule
  addScheduleItem(item) {
    this.data.schedule.push(item);
    this.notify();
    this.queueWrite('schedule', () => api.addSchedule(item));
  }

  updateScheduleItem(id, updates) {
    const idx = this.data.schedule.findIndex(s => s._id === id || s.id === id);
    if (idx !== -1) {
      this.data.schedule[idx] = { ...this.data.schedule[idx], ...updates };
      this.notify();
      this.queueWrite(`schedule-${id}`, () => api.updateSchedule(id, updates));
    }
  }

  deleteScheduleItem(id) {
    this.data.schedule = this.data.schedule.filter(s => s._id !== id && s.id !== id);
    this.notify();
    this.queueWrite(`schedule-del-${id}`, () => api.deleteSchedule(id));
  }

  // Assignments
  addAssignment(assignment) {
    this.data.assignments.push(assignment);
    this.notify();
    this.queueWrite('assignments', () => api.addAssignment(assignment));
  }

  updateAssignment(id, updates) {
    const idx = this.data.assignments.findIndex(a => a._id === id || a.id === id);
    if (idx !== -1) {
      this.data.assignments[idx] = { ...this.data.assignments[idx], ...updates };
      this.notify();
      this.queueWrite(`assignment-${id}`, () => api.updateAssignment(id, updates));
    }
  }

  deleteAssignment(id) {
    this.data.assignments = this.data.assignments.filter(a => a._id !== id && a.id !== id);
    this.notify();
    this.queueWrite(`assignment-del-${id}`, () => api.deleteAssignment(id));
  }

  completeAssignment(id) {
    const exists = this.data.assignments.some(a => a._id === id || a.id === id);
    if (exists) {
      this.data.completedAssignments = (this.data.completedAssignments || 0) + 1;
      this.data.assignments = this.data.assignments.filter(a => a._id !== id && a.id !== id);
      this.notify();
      this.queueWrite('assignments', () => api.completeAssignment(id));
    }
  }

  // Transactions
  addTransaction(transaction) {
    if (!this.data.transactions) this.data.transactions = [];
    this.data.transactions.push(transaction);
    this.notify();
    this.queueWrite('transactions', () => api.addTransaction(transaction));
  }

  updateTransaction(id, updates) {
    if (!this.data.transactions) this.data.transactions = [];
    const idx = this.data.transactions.findIndex(t => t._id === id || t.id === id);
    if (idx !== -1) {
      this.data.transactions[idx] = { ...this.data.transactions[idx], ...updates };
      this.notify();
      this.queueWrite(`transaction-${id}`, () => api.updateTransaction(id, updates));
    }
  }

  deleteTransaction(id) {
    if (!this.data.transactions) this.data.transactions = [];
    this.data.transactions = this.data.transactions.filter(t => t._id !== id && t.id !== id);
    this.notify();
    this.queueWrite(`transaction-del-${id}`, () => api.deleteTransaction(id));
  }

  // Attendance
  addAttendance(record) {
    this.data.attendance.push(record);
    this.notify();
    this.queueWrite('attendance', () => api.addAttendance(record));
  }

  updateAttendance(id, updates) {
    const idx = this.data.attendance.findIndex(a => a._id === id || a.id === id);
    if (idx !== -1) {
      this.data.attendance[idx] = { ...this.data.attendance[idx], ...updates };
      this.notify();
      this.queueWrite(`attendance-${id}`, () => api.updateAttendance(id, updates));
    }
  }

  deleteAttendance(id) {
    this.data.attendance = this.data.attendance.filter(a => a._id !== id && a.id !== id);
    this.notify();
    this.queueWrite(`attendance-del-${id}`, () => api.deleteAttendance(id));
  }

  // Goals
  updateGoals(goals) {
    this.data.goals = { ...this.data.goals, ...goals };
    this.notify();
    this.queueWrite('goals', () => api.updateGoals(this.data.goals));
  }

  addMilestone(milestone) {
    if (!this.data.goals.milestones) this.data.goals.milestones = [];
    this.data.goals.milestones.push(milestone);
    this.notify();
    this.queueWrite('goals', () => api.addMilestone(milestone));
  }

  updateMilestone(id, updates) {
    if (!this.data.goals.milestones) this.data.goals.milestones = [];
    const idx = this.data.goals.milestones.findIndex(m => m._id === id || m.id === id);
    if (idx !== -1) {
      this.data.goals.milestones[idx] = { ...this.data.goals.milestones[idx], ...updates };
      this.notify();
      this.queueWrite('goals', () => api.updateMilestone(id, updates));
    }
  }

  deleteMilestone(id) {
    if (!this.data.goals.milestones) this.data.goals.milestones = [];
    this.data.goals.milestones = this.data.goals.milestones.filter(m => m._id !== id && m.id !== id);
    this.notify();
    this.queueWrite('goals', () => api.deleteMilestone(id));
  }

  // Notifications
  addNotification(notification) {
    this.data.notifications.unshift(notification);
    if (this.data.notifications.length > 50) {
      this.data.notifications = this.data.notifications.slice(0, 50);
    }
    this.notify();
    this.queueWrite('notifications', () => api.addNotification(notification));
  }

  markNotificationRead(id) {
    const notif = this.data.notifications.find(n => n._id === id || n.id === id);
    if (notif) {
      notif.read = true;
      this.notify();
      this.queueWrite(`notif-${id}`, () => api.markNotificationRead(id));
    }
  }

  markAllNotificationsRead() {
    this.data.notifications.forEach(n => { n.read = true; });
    this.notify();
    this.queueWrite('notifications', () => api.markAllNotificationsRead());
  }

  // Settings
  updateSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.notify();
    this.queueWrite('settings', () => api.updateProfile(this.data.profile, this.data.settings));
  }

  setPage(page) {
    this.currentPage = page;
    this.notify();
  }
}

export const state = new AppState();