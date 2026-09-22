import authHandler from './routes/auth.js';
import dataHandler from './routes/data.js';

export default async function handler(req, res) {
  const { method, query } = req;
  const { route } = query;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (route === 'auth') {
      return await authHandler(req, res);
    } else if (route === 'data') {
      return await dataHandler(req, res);
    } else {
      return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}