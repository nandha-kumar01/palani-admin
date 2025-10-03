import mongoose from 'mongoose';
import { MongoClient, Db } from 'mongodb';
import { validateEnvironmentVariables } from './env-validation';

// Validate environment variables
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error('Environment validation failed:', error);
  if (process.env.NODE_ENV === 'production') {
    throw error;
  }
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  console.error('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    MONGODB_URI_exists: !!process.env.MONGODB_URI,
    all_env_keys: Object.keys(process.env).filter(key => key.includes('MONGO'))
  });
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local or Vercel environment variables'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// MongoDB native client for direct database operations
let mongoClient: MongoClient | null = null;

export async function connectDB(): Promise<Db> {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
  }
  return mongoClient.db();
}

export default dbConnect;
