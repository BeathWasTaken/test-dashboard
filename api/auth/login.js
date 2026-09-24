import connectDB from '../lib/mongodb.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Login hanya menerima POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed'
    });
  }

  try {
    await connectDB();

    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Cari user
    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Cek password
    const isValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Update status authenticated
    user.profile.authenticated = true;
    await user.save();

    // Generate JWT
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

    return res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
}