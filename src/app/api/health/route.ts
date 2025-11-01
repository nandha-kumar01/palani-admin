import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Quick health check - just verify DB connection
    const startTime = Date.now();
    
    // Test database connection with timeout
    const dbConnectPromise = dbConnect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 5000);
    });
    
    await Promise.race([dbConnectPromise, timeoutPromise]);
    
    const dbTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          responseTime: `${dbTime}ms`,
        },
        server: {
          uptime: process.uptime(),
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          },
        },
        success: true,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message || 'Unknown error',
        database: {
          connected: false,
        },
        success: false,
      },
      { status: 503 }
    );
  }
}

// Also support POST for compatibility
export const POST = GET;