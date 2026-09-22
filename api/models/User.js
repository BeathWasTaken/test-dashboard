import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  credits: { type: Number, required: true, default: 3 },
  grade: { type: String, required: true },
  semester: { type: Number, required: true, default: 1 }
});

const scheduleSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  lecturer: { type: String, default: '' },
  room: { type: String, default: '' },
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  mode: { type: String, enum: ['offline', 'online'], default: 'offline' },
  year: { type: Number, default: new Date().getFullYear() }
});

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course: { type: String, required: true },
  deadline: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  description: { type: String, default: '' }
});

const transactionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  description: { type: String, default: '' }
});

const attendanceSchema = new mongoose.Schema({
  course: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['present', 'absent', 'excused'], required: true },
  note: { type: String, default: '' }
});

const goalSchema = new mongoose.Schema({
  targetGPA: { type: Number, default: 3.5 },
  targetCGPA: { type: Number, default: 3.6 },
  graduationDate: { type: String, default: () => new Date(new Date().getFullYear() + 4, 5, 15).toISOString().split('T')[0] },
  milestones: [{
    title: { type: String, required: true },
    target: { type: Number, required: true },
    current: { type: Number, default: 0 },
    type: { type: String, enum: ['checkbox', 'numeric', 'auto'], default: 'numeric' },
    unit: { type: String, enum: ['number', 'currency', 'sks', 'ip'], default: 'number' },
    autoKey: { type: String },
    completed: { type: Boolean, default: false }
  }]
});

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  attendanceWarningThreshold: { type: Number, default: 75 },
  gradeScale: { type: Map, of: Number },
  scheduleYear: { type: Number, default: new Date().getFullYear() },
  budgetIncome: { type: Number, default: 0 },
  budgetExpense: { type: Number, default: 0 }
});

const profileSchema = new mongoose.Schema({
  name: { type: String, default: 'Mahasiswa' },
  studentId: { type: String, default: '' },
  major: { type: String, default: '' },
  semester: { type: Number, default: 1 },
  email: { type: String, default: '' },
  avatar: { type: String, default: null },
  authenticated: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  profile: { type: profileSchema, default: () => ({}) },
  settings: { type: settingsSchema, default: () => ({}) },
  courses: { type: [courseSchema], default: [] },
  schedule: { type: [scheduleSchema], default: [] },
  assignments: { type: [assignmentSchema], default: [] },
  transactions: { type: [transactionSchema], default: [] },
  attendance: { type: [attendanceSchema], default: [] },
  goals: { type: goalSchema, default: () => ({}) },
  notifications: { type: [notificationSchema], default: [] },
  completedAssignments: { type: Number, default: 0 }
}, {
  timestamps: true
});

userSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model('User', userSchema);