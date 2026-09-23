import connectDB from '../../lib/mongodb.js';
import User from '../../models/User.js';
import { verifyToken } from '../../middleware/auth.js';

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

function getUpdatedData(user, type) {
  const data = {};
  data[type] = user[type];
  return data;
}

async function handleGetAllData(req, res, userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
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
    console.error('Get data error:', error);
    return res.status(500).json({ error: 'Failed to get data' });
  }
}

async function handleUpdateData(req, res, userId) {
  try {
    const { type, data, id } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    switch (type) {
      case 'profile':
        user.profile = { ...user.profile.toObject(), ...data };
        break;
      case 'settings':
        user.settings = { ...user.settings.toObject(), ...data };
        break;
      case 'course':
        if (id) {
          const idx = user.courses.findIndex(c => c._id.toString() === id);
          if (idx !== -1) {
            user.courses[idx] = { ...user.courses[idx].toObject(), ...data };
          } else {
            return res.status(404).json({ error: 'Course not found' });
          }
        } else {
          user.courses.push(data);
        }
        break;
      case 'schedule':
        if (id) {
          const idx = user.schedule.findIndex(s => s._id.toString() === id);
          if (idx !== -1) {
            user.schedule[idx] = { ...user.schedule[idx].toObject(), ...data };
          } else {
            return res.status(404).json({ error: 'Schedule item not found' });
          }
        } else {
          user.schedule.push(data);
        }
        break;
      case 'assignment':
        if (id) {
          const idx = user.assignments.findIndex(a => a._id.toString() === id);
          if (idx !== -1) {
            user.assignments[idx] = { ...user.assignments[idx].toObject(), ...data };
          } else {
            return res.status(404).json({ error: 'Assignment not found' });
          }
        } else {
          user.assignments.push(data);
        }
        break;
      case 'transaction':
        if (id) {
          const idx = user.transactions.findIndex(t => t._id.toString() === id);
          if (idx !== -1) {
            user.transactions[idx] = { ...user.transactions[idx].toObject(), ...data };
          } else {
            return res.status(404).json({ error: 'Transaction not found' });
          }
        } else {
          user.transactions.push(data);
        }
        break;
      case 'attendance':
        if (id) {
          const idx = user.attendance.findIndex(a => a._id.toString() === id);
          if (idx !== -1) {
            user.attendance[idx] = { ...user.attendance[idx].toObject(), ...data };
          } else {
            return res.status(404).json({ error: 'Attendance record not found' });
          }
        } else {
          user.attendance.push(data);
        }
        break;
      case 'goals':
        user.goals = { ...user.goals.toObject(), ...data };
        break;
      case 'notifications':
        if (id) {
          const idx = user.notifications.findIndex(n => n._id.toString() === id);
          if (idx !== -1) {
            user.notifications[idx] = { ...user.notifications[idx].toObject(), ...data };
          } else {
            return res.status(404).json({ error: 'Notification not found' });
          }
        } else {
          user.notifications.unshift(data);
          if (user.notifications.length > 50) {
            user.notifications = user.notifications.slice(0, 50);
          }
        }
        break;
      case 'completedAssignments':
        user.completedAssignments = data;
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      data: getUpdatedData(user, type)
    });
  } catch (error) {
    console.error('Update data error:', error);
    return res.status(500).json({ error: 'Failed to update data' });
  }
}

async function handleCreateData(req, res, userId) {
  try {
    const { type, data } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    switch (type) {
      case 'course':
        user.courses.push(data);
        break;
      case 'schedule':
        user.schedule.push(data);
        break;
      case 'assignment':
        user.assignments.push(data);
        break;
      case 'transaction':
        user.transactions.push(data);
        break;
      case 'attendance':
        user.attendance.push(data);
        break;
      case 'notification':
        user.notifications.unshift(data);
        if (user.notifications.length > 50) {
          user.notifications = user.notifications.slice(0, 50);
        }
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    await user.save();

    return res.status(201).json({
      success: true,
      data: getUpdatedData(user, type)
    });
  } catch (error) {
    console.error('Create data error:', error);
    return res.status(500).json({ error: 'Failed to create data' });
  }
}

async function handleDeleteData(req, res, userId) {
  try {
    const { type, id } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    switch (type) {
      case 'course':
        user.courses = user.courses.filter(c => c._id.toString() !== id);
        break;
      case 'schedule':
        user.schedule = user.schedule.filter(s => s._id.toString() !== id);
        break;
      case 'assignment':
        user.assignments = user.assignments.filter(a => a._id.toString() !== id);
        break;
      case 'transaction':
        user.transactions = user.transactions.filter(t => t._id.toString() !== id);
        break;
      case 'attendance':
        user.attendance = user.attendance.filter(a => a._id.toString() !== id);
        break;
      case 'notification':
        user.notifications = user.notifications.filter(n => n._id.toString() !== id);
        break;
      case 'milestone':
        if (user.goals.milestones) {
          user.goals.milestones = user.goals.milestones.filter(m => m._id.toString() !== id);
        }
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      data: getUpdatedData(user, type)
    });
  } catch (error) {
    console.error('Delete data error:', error);
    return res.status(500).json({ error: 'Failed to delete data' });
  }
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authError = requireAuth(req, res);
  if (authError) return authError;

  await connectDB();

  const { method, url } = req;
  const path = url.split('?')[0];

  try {
    if (path === '/' || path === '') {
      if (method === 'GET') {
        return handleGetAllData(req, res, req.userId);
      } else if (method === 'PUT') {
        return handleUpdateData(req, res, req.userId);
      } else if (method === 'POST') {
        return handleCreateData(req, res, req.userId);
      } else if (method === 'DELETE') {
        return handleDeleteData(req, res, req.userId);
      }
    }

    return res.status(404).json({ error: 'Route not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}