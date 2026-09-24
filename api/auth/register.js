import connectDB from '../lib/mongodb.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed'
    });
  }

  try {
    await connectDB();

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      email: normalizedEmail,
      password: hashedPassword,

      profile: {
        name,
        email: normalizedEmail,
        studentId: '',
        major: '',
        semester: 1,
        avatar: null,
        authenticated: true
      },

      settings: {
        theme: 'light',
        attendanceWarningThreshold: 75,
        gradeScale: new Map(),
        scheduleYear: new Date().getFullYear(),
        budgetIncome: 0,
        budgetExpense: 0
      },

      goals: {
        targetGPA: 3.5,
        targetCGPA: 3.6,
        graduationDate: new Date(
          new Date().getFullYear() + 4,
          5,
          15
        ).toISOString().split('T')[0],
        milestones: []
      }
    });

    await user.save();

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        settings: user.settings
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    return res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
}