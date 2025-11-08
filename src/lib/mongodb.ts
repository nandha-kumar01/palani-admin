import mongoose from 'mongoose';
import { MongoClient, Db } from 'mongodb';
import { validateEnvironmentVariables } from './env-validation';

// Import all models at the top to ensure they're registered
// This prevents "Schema hasn't been registered" errors in production
import User from '@/models/User';
import Quote from '@/models/Quote';
import Temple from '@/models/Temple';
import Annadhanam from '@/models/Annadhanam';
import Madangal from '@/models/Madangal';
import Song from '@/models/Song';
import Gallery from '@/models/Gallery';
import Group from '@/models/Group';
import Announcement from '@/models/Announcement';
import Notification from '@/models/Notification';
import Device from '@/models/Device';
import Country from '@/models/Country';
import State from '@/models/State';
import City from '@/models/City';
import UserSupport from '@/models/UserSupport';

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
  // In serverless environments, always check connection state
  if (cached.conn) {
    const state = cached.conn.connection.readyState;
    
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    if (state === 1) {
      // Connection is healthy
      return cached.conn;
    } else if (state === 2) {
      // Currently connecting, wait for the existing promise
      try {
        return await cached.promise;
      } catch (e) {
        // Connection failed, reset and try again
        cached.conn = null;
        cached.promise = null;
      }
    } else {
      // Connection is stale or disconnected, reset
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined');

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Core connection settings
      serverSelectionTimeoutMS: 15000, // 15 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      connectTimeoutMS: 15000, // 15 second connection timeout
      family: 4, // Use IPv4
      
      // Connection pool settings (optimized for serverless)
      maxPoolSize: 3, // Small pool for serverless
      minPoolSize: 0, // Allow connections to close
      maxIdleTimeMS: 30000, // Close idle connections after 30s
      waitQueueTimeoutMS: 15000, // Queue timeout
      
      // Reliability settings
      retryWrites: true,
      heartbeatFrequencyMS: 10000, // Health check every 10s
      
      // Performance optimizations
      compressors: ['zlib'] as ('zlib' | 'none' | 'snappy' | 'zstd')[],
      readPreference: 'primaryPreferred' as const,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully via Mongoose');
        console.log('🔧 Connection state:', mongoose.connection.readyState);
        console.log('📊 Registered models:', Object.keys(mongoose.models).length);
        
        // Add connection event listeners for better monitoring
        mongoose.connection.on('connected', () => {
          console.log('📡 Mongoose connected to MongoDB');
        });
        
        mongoose.connection.on('error', (err) => {
          console.error('❌ Mongoose connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
          console.log('📡 Mongoose disconnected from MongoDB');
        });
        
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection failed:', {
          message: error.message,
          code: error.code,
          name: error.name,
          timestamp: new Date().toISOString()
        });
        
        // Reset promise on failure
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    
    // Final health check
    if (cached.conn.connection.readyState !== 1) {
      throw new Error(`Connection established but not ready. State: ${cached.conn.connection.readyState}`);
    }
    
    return cached.conn;
    
  } catch (e: any) {
    cached.promise = null;
    cached.conn = null;
    
    console.error('❌ Failed to establish MongoDB connection:', {
      message: e.message,
      code: e.code,
      name: e.name,
      timestamp: new Date().toISOString()
    });
    
    throw e;
  }
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
