import mongoose from 'mongoose';
import { MongoClient, Db } from 'mongodb';
import { validateEnvironmentVariables } from './env-validation';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
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
    console.warn('⚠️ MONGODB_URI not found - database connections will fail');
  }
}

/**
 * Cache mongoose connection for hot reloads
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined');

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      family: 4, // Use IPv4
      maxPoolSize: 10, // Maintain up to 10 connections
      retryWrites: true, // Safe for cluster writes
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully via Mongoose');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', {
          message: error.message,
          code: error.code,
          name: error.name,
        });
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    console.error('❌ Failed to establish MongoDB connection:', {
      message: e.message,
      code: e.code,
      name: e.name,
    });
    throw e;
  }

  return cached.conn;
}

/**
 * MongoDB native client connection (for direct DB ops)
 */
let mongoClient: MongoClient | null = null;

export async function connectDB(): Promise<Db> {
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined for native client');

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
      console.log('✅ MongoDB native client connected successfully');
    } catch (error: any) {
      console.error('❌ MongoDB native client connection error:', {
        message: error.message,
        code: error.code,
        name: error.name,
      });
      mongoClient = null;
      throw error;
    }
  }

  return mongoClient.db();
}

export default dbConnect;
