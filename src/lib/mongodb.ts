import mongoose from 'mongoose';
import { MongoClient, Db } from 'mongodb';
import { validateEnvironmentVariables } from './env-validation';

// Environment validation will be done when actually connecting, not during module import

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // Only throw error if we're trying to actually connect (not during build)
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV) {
    console.error('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      MONGODB_URI_exists: !!process.env.MONGODB_URI,
      all_env_keys: Object.keys(process.env).filter(key => key.includes('MONGO'))
    });
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local or Vercel environment variables'
    );
  } else {
    console.warn('MONGODB_URI not found - database connections will fail');
  }
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

  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined');
    throw new Error('MONGODB_URI is not defined');
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionRetryMinDelay: 1000, // Wait 1 second before retrying
      retryWrites: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully via Mongoose');
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB connection error:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack?.substring(0, 500)
      });
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    console.error('Failed to establish MongoDB connection:', {
      message: e.message,
      code: e.code,
      name: e.name
    });
    throw e;
  }

  return cached.conn;
}

// MongoDB native client for direct database operations
let mongoClient: MongoClient | null = null;

export async function connectDB(): Promise<Db> {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined for native client');
    throw new Error('MONGODB_URI is not defined');
  }
  
  if (!mongoClient) {
    try {
      mongoClient = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        maxPoolSize: 10,
        retryWrites: true,
      });
      await mongoClient.connect();
      console.log('MongoDB native client connected successfully');
    } catch (error: any) {
      console.error('MongoDB native client connection error:', {
        message: error.message,
        code: error.code,
        name: error.name
      });
      mongoClient = null;
      throw error;
    }
  }
  return mongoClient.db();
}

export default dbConnect;
