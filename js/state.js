<<<<<<< HEAD
import { api } from './api/client.js';

class AppState {
  constructor() {
    this.currentUserEmail = null;
    this.data = api.defaultData;
    this.listeners = new Set();
    this.currentPage = 'dashboard';
    this.pendingWrites = new Map();
=======
import { loadData, saveData } from './storage.js';

class AppState {
  constructor() {
    this.data = loadData();
    this.listeners = new Set();
    this.currentPage = 'dashboard';
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
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

<<<<<<< HEAD
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
=======
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
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
  }

  // Profile
  updateProfile(profile) {
    this.data.profile = { ...this.data.profile, ...profile };
<<<<<<< HEAD
    this.notify();
    this.queueWrite('profile', () => api.updateProfile(this.data.profile, this.data.settings));
=======
    this.persist();
    this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
  }

  // Courses
  addCourse(course) {
    this.data.courses.push(course);
<<<<<<< HEAD
    this.notify();
    this.queueWrite('courses', () => api.addCourse(course));
  }

  updateCourse(id, updates) {
    const idx = this.data.courses.findIndex(c => c._id === id || c.id === id);
    if (idx !== -1) {
      this.data.courses[idx] = { ...this.data.courses[idx], ...updates };
      this.notify();
      this.queueWrite(`course-${id}`, () => api.updateCourse(id, updates));
=======
    this.persist();
    this.notify();
  }

  updateCourse(id, updates) {
    const idx = this.data.courses.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.courses[idx] = { ...this.data.courses[idx], ...updates };
      this.persist();
      this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
    }
  }

  deleteCourse(id) {
<<<<<<< HEAD
    this.data.courses = this.data.courses.filter(c => c._id !== id && c.id !== id);
    this.notify();
    this.queueWrite(`course-del-${id}`, () => api.deleteCourse(id));
=======
    this.data.courses = this.data.courses.filter(c => c.id !== id);
    this.persist();
    this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
  }

  // Schedule
  addScheduleItem(item) {
    this.data.schedule.push(item);
<<<<<<< HEAD
    this.notify();
    this.queueWrite('schedule', () => api.addSchedule(item));
  }

  updateScheduleItem(id, updates) {
    const idx = this.data.schedule.findIndex(s => s._id === id || s.id === id);
    if (idx !== -1) {
      this.data.schedule[idx] = { ...this.data.schedule[idx], ...updates };
      this.notify();
      this.queueWrite(`schedule-${id}`, () => api.updateSchedule(id, updates));
=======
    this.persist();
    this.notify();
  }

  updateScheduleItem(id, updates) {
    const idx = this.data.schedule.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.schedule[idx] = { ...this.data.schedule[idx], ...updates };
      this.persist();
      this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
    }
  }

  deleteScheduleItem(id) {
<<<<<<< HEAD
    this.data.schedule = this.data.schedule.filter(s => s._id !== id && s.id !== id);
    this.notify();
    this.queueWrite(`schedule-del-${id}`, () => api.deleteSchedule(id));
=======
    this.data.schedule = this.data.schedule.filter(s => s.id !== id);
    this.persist();
    this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
  }

  // Assignments
  addAssignment(assignment) {
    this.data.assignments.push(assignment);
<<<<<<< HEAD
    this.notify();
    this.queueWrite('assignments', () => api.addAssignment(assignment));
  }

  updateAssignment(id, updates) {
    const idx = this.data.assignments.findIndex(a => a._id === id || a.id === id);
    if (idx !== -1) {
      this.data.assignments[idx] = { ...this.data.assignments[idx], ...updates };
      this.notify();
      this.queueWrite(`assignment-${id}`, () => api.updateAssignment(id, updates));
=======
    this.persist();
    this.notify();
  }

  updateAssignment(id, updates) {
    const idx = this.data.assignments.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.assignments[idx] = { ...this.data.assignments[idx], ...updates };
      this.persist();
      this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
    }
  }

  deleteAssignment(id) {
<<<<<<< HEAD
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
=======
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
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
  }

  updateTransaction(id, updates) {
    if (!this.data.transactions) this.data.transactions = [];
<<<<<<< HEAD
    const idx = this.data.transactions.findIndex(t => t._id === id || t.id === id);
    if (idx !== -1) {
      this.data.transactions[idx] = { ...this.data.transactions[idx], ...updates };
      this.notify();
      this.queueWrite(`transaction-${id}`, () => api.updateTransaction(id, updates));
=======
    const idx = this.data.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.data.transactions[idx] = { ...this.data.transactions[idx], ...updates };
      this.persist();
      this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
    }
  }

  deleteTransaction(id) {
    if (!this.data.transactions) this.data.transactions = [];
<<<<<<< HEAD
    this.data.transactions = this.data.transactions.filter(t => t._id !== id && t.id !== id);
    this.notify();
    this.queueWrite(`transaction-del-${id}`, () => api.deleteTransaction(id));
=======
    this.data.transactions = this.data.transactions.filter(t => t.id !== id);
    this.persist();
    this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
  }

  // Attendance
  addAttendance(record) {
    this.data.attendance.push(record);
<<<<<<< HEAD
    this.notify();
    this.queueWrite('attendance', () => api.addAttendance(record));
  }

  updateAttendance(id, updates) {
    const idx = this.data.attendance.findIndex(a => a._id === id || a.id === id);
    if (idx !== -1) {
      this.data.attendance[idx] = { ...this.data.attendance[idx], ...updates };
      this.notify();
      this.queueWrite(`attendance-${id}`, () => api.updateAttendance(id, updates));
=======
    this.persist();
    this.notify();
  }

  updateAttendance(id, updates) {
    const idx = this.data.attendance.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.attendance[idx] = { ...this.data.attendance[idx], ...updates };
      this.persist();
      this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
    }
  }

  deleteAttendance(id) {
<<<<<<< HEAD
    this.data.attendance = this.data.attendance.filter(a => a._id !== id && a.id !== id);
    this.notify();
    this.queueWrite(`attendance-del-${id}`, () => api.deleteAttendance(id));
=======
    this.data.attendance = this.data.attendance.filter(a => a.id !== id);
    this.persist();
    this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
  }

  // Goals
  updateGoals(goals) {
    this.data.goals = { ...this.data.goals, ...goals };
<<<<<<< HEAD
    this.notify();
    this.queueWrite('goals', () => api.updateGoals(this.data.goals));
=======
    this.persist();
    this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
  }

  addMilestone(milestone) {
    if (!this.data.goals.milestones) this.data.goals.milestones = [];
    this.data.goals.milestones.push(milestone);
<<<<<<< HEAD
    this.notify();
    this.queueWrite('goals', () => api.addMilestone(milestone));
=======
    this.persist();
    this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
  }

  updateMilestone(id, updates) {
    if (!this.data.goals.milestones) this.data.goals.milestones = [];
<<<<<<< HEAD
    const idx = this.data.goals.milestones.findIndex(m => m._id === id || m.id === id);
    if (idx !== -1) {
      this.data.goals.milestones[idx] = { ...this.data.goals.milestones[idx], ...updates };
      this.notify();
      this.queueWrite('goals', () => api.updateMilestone(id, updates));
=======
    const idx = this.data.goals.milestones.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.data.goals.milestones[idx] = { ...this.data.goals.milestones[idx], ...updates };
      this.persist();
      this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
    }
  }

  deleteMilestone(id) {
    if (!this.data.goals.milestones) this.data.goals.milestones = [];
<<<<<<< HEAD
    this.data.goals.milestones = this.data.goals.milestones.filter(m => m._id !== id && m.id !== id);
    this.notify();
    this.queueWrite('goals', () => api.deleteMilestone(id));
=======
    this.data.goals.milestones = this.data.goals.milestones.filter(m => m.id !== id);
    this.persist();
    this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
  }

  // Notifications
  addNotification(notification) {
    this.data.notifications.unshift(notification);
    if (this.data.notifications.length > 50) {
      this.data.notifications = this.data.notifications.slice(0, 50);
    }
<<<<<<< HEAD
    this.notify();
    this.queueWrite('notifications', () => api.addNotification(notification));
  }

  markNotificationRead(id) {
    const notif = this.data.notifications.find(n => n._id === id || n.id === id);
    if (notif) {
      notif.read = true;
      this.notify();
      this.queueWrite(`notif-${id}`, () => api.markNotificationRead(id));
=======
    this.persist();
    this.notify();
  }

  markNotificationRead(id) {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.persist();
      this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
    }
  }

  markAllNotificationsRead() {
    this.data.notifications.forEach(n => { n.read = true; });
<<<<<<< HEAD
    this.notify();
    this.queueWrite('notifications', () => api.markAllNotificationsRead());
=======
    this.persist();
    this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
  }

  // Settings
  updateSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
<<<<<<< HEAD
    this.notify();
    this.queueWrite('settings', () => api.updateProfile(this.data.profile, this.data.settings));
=======
    this.persist();
    this.notify();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
  }

  setPage(page) {
    this.currentPage = page;
    this.notify();
  }
}

<<<<<<< HEAD
export const state = new AppState();
=======
export const state = new AppState();
>>>>>>> 758bb0f7a4fd2994fc20e234804d8fe9b28ee0ff
