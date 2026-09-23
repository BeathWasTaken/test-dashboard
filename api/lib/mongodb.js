import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let cached = global.mongoose;
let mongoServer = null;
let connectionPromise = null;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  // If there's already a connection in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  // Read env vars at runtime
  const MONGODB_URI = process.env.MONGODB_URI;
  const NODE_ENV = process.env.NODE_ENV || 'development';

  const opts = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  let uri = MONGODB_URI;

  // Use in-memory MongoDB for development if no URI provided
  if (!uri && NODE_ENV === 'development') {
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
    console.log('Using in-memory MongoDB for development:', uri);
  }

  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  async function attemptConnection(connectionUri) {
    return mongoose.connect(connectionUri, opts).then((mongoose) => {
      cached.conn = mongoose;
      return mongoose;
    });
  }

  connectionPromise = attemptConnection(uri).catch(async (e) => {
    connectionPromise = null;
    console.error('Failed to connect to MongoDB:', e.message);
    
    // Fallback to in-memory MongoDB ONLY in development
    if (NODE_ENV === 'development' && MONGODB_URI) {
      console.log('Falling back to in-memory MongoDB...');
      mongoServer = await MongoMemoryServer.create();
      const fallbackUri = mongoServer.getUri();
      console.log('Using in-memory MongoDB for development:', fallbackUri);
      return attemptConnection(fallbackUri);
    }
    
    throw e;
  });

  try {
    cached.conn = await connectionPromise;
  } catch (e) {
    throw e;
  }

  return cached.conn;
}

export default connectDB;