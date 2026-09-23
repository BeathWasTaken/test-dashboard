import connectDB from '../../lib/mongodb.js';
import User from '../../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from '../../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function requireAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }

  req.userId = decoded.userId;
  return null;
}

async function handleRegister(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      profile: {
        name,
        email: email.toLowerCase(),
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
        graduationDate: new Date(new Date().getFullYear() + 4, 5, 15).toISOString().split('T')[0],
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
    return res.status(500).json({ error: 'Registration failed' });
  }
}

async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.profile.authenticated = true;
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
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
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}

async function handleGetProfile(req, res) {
  const authError = requireAuth(req, res);
  if (authError) return authError;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        settings: user.settings,
        courses: user.courses,
        schedule: user.schedule,
        assignments: user.assignments,
        transactions: user.transactions,
        attendance: user.attendance,
        goals: user.goals,
        notifications: user.notifications,
        completedAssignments: user.completedAssignments
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to get profile' });
  }
}

async function handleUpdateProfile(req, res) {
  const authError = requireAuth(req, res);
  if (authError) return authError;

  try {
    const { profile, settings } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (profile) {
      user.profile = { ...user.profile.toObject(), ...profile };
    }
    if (settings) {
      user.settings = { ...user.settings.toObject(), ...settings };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await connectDB();

  const { method, url } = req;
  const path = url.split('?')[0];

  try {
    if (path.endsWith('/register') && method === 'POST') {
      return handleRegister(req, res);
    } else if (path.endsWith('/login') && method === 'POST') {
      return handleLogin(req, res);
    } else if (path === '/' || path === '') {
      if (method === 'GET') {
        return handleGetProfile(req, res);
      } else if (method === 'PUT') {
        return handleUpdateProfile(req, res);
      }
    }

    return res.status(404).json({ error: 'Route not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}