const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token') || null;
    this.user = null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${window.location.origin}${API_BASE}${endpoint}`;

    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, config);

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {
          error: text || 'Empty response from server'
        };
      }

      if (!response.ok) {
        throw new Error(
          data.error || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Auth endpoints
  async register(name, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async logout() {
    this.setToken(null);
    return { success: true };
  }

  async getProfile() {
    return this.request('/auth', { method: 'GET' });
  }

  async updateProfile(profile, settings) {
    return this.request('/auth', {
      method: 'PUT',
      body: JSON.stringify({ profile, settings })
    });
  }

  // Data endpoints
  async getAllData() {
    return this.request('/data', { method: 'GET' });
  }

  async updateData(type, data, id = null) {
    return this.request('/data', {
      method: 'PUT',
      body: JSON.stringify({ type, data, id })
    });
  }

  async createData(type, data) {
    return this.request('/data', {
      method: 'POST',
      body: JSON.stringify({ type, data })
    });
  }

  async deleteData(type, id) {
    return this.request('/data', {
      method: 'DELETE',
      body: JSON.stringify({ type, id })
    });
  }

  // Convenience methods
  async getCourses() {
    const data = await this.getAllData();
    return data.data.courses || [];
  }

  async addCourse(course) {
    return this.createData('course', course);
  }

  async updateCourse(id, updates) {
    return this.updateData('course', updates, id);
  }

  async deleteCourse(id) {
    return this.deleteData('course', id);
  }

  async getSchedule() {
    const data = await this.getAllData();
    return data.data.schedule || [];
  }

  async addSchedule(item) {
    return this.createData('schedule', item);
  }

  async updateSchedule(id, updates) {
    return this.updateData('schedule', updates, id);
  }

  async deleteSchedule(id) {
    return this.deleteData('schedule', id);
  }

  async getAssignments() {
    const data = await this.getAllData();
    return data.data.assignments || [];
  }

  async addAssignment(assignment) {
    return this.createData('assignment', assignment);
  }

  async updateAssignment(id, updates) {
    return this.updateData('assignment', updates, id);
  }

  async deleteAssignment(id) {
    return this.deleteData('assignment', id);
  }

  async completeAssignment(id) {
    const assignments = await this.getAssignments();
    const assignment = assignments.find(a => a._id === id || a.id === id);
    if (assignment) {
      assignment.status = 'done';
      return this.updateAssignment(id, assignment);
    }
  }

  async getTransactions() {
    const data = await this.getAllData();
    return data.data.transactions || [];
  }

  async addTransaction(transaction) {
    return this.createData('transaction', transaction);
  }

  async updateTransaction(id, updates) {
    return this.updateData('transaction', updates, id);
  }

  async deleteTransaction(id) {
    return this.deleteData('transaction', id);
  }

  async getAttendance() {
    const data = await this.getAllData();
    return data.data.attendance || [];
  }

  async addAttendance(record) {
    return this.createData('attendance', record);
  }

  async updateAttendance(id, updates) {
    return this.updateData('attendance', updates, id);
  }

  async deleteAttendance(id) {
    return this.deleteData('attendance', id);
  }

  async getGoals() {
    const data = await this.getAllData();
    return data.data.goals || {};
  }

  async updateGoals(goals) {
    return this.updateData('goals', goals);
  }

  async addMilestone(milestone) {
    const goals = await this.getGoals();
    const milestones = goals.milestones || [];
    milestones.push(milestone);
    return this.updateGoals({ ...goals, milestones });
  }

  async updateMilestone(id, updates) {
    const goals = await this.getGoals();
    const milestones = (goals.milestones || []).map(m => 
      (m._id === id || m.id === id) ? { ...m, ...updates } : m
    );
    return this.updateGoals({ ...goals, milestones });
  }

  async deleteMilestone(id) {
    return this.deleteData('milestone', id);
  }

  async getNotifications() {
    const data = await this.getAllData();
    return data.data.notifications || [];
  }

  async addNotification(notification) {
    return this.createData('notification', notification);
  }

  async markNotificationRead(id) {
    return this.updateData('notifications', { read: true }, id);
  }

  async markAllNotificationsRead() {
    const notifications = await this.getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    return this.updateData('notifications', updated);
  }

  async getCompletedAssignments() {
    const data = await this.getAllData();
    return data.data.completedAssignments || 0;
  }

  async incrementCompletedAssignments() {
    const count = await this.getCompletedAssignments();
    return this.updateData('completedAssignments', count + 1);
  }

  get defaultData() {
    return {
      profile: {
        name: 'Mahasiswa',
        studentId: '',
        major: '',
        semester: 1,
        email: '',
        avatar: null,
        authenticated: false
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
  }
}

export const api = new ApiClient();