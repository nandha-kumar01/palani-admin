import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function withAuth(handler: Function, requireAdmin = false) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { 
            error: 'No token provided',
            success: false,
            timestamp: new Date().toISOString()
          },
          { 
            status: 401,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            }
          }
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      if (!token.trim()) {
        return NextResponse.json(
          { 
            error: 'Invalid token format',
            success: false,
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        );
      }

      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (tokenError: any) {
        let errorMessage = 'Invalid or expired token';
        
        if (tokenError.name === 'TokenExpiredError') {
          errorMessage = 'Token has expired - please login again';
        } else if (tokenError.name === 'JsonWebTokenError') {
          errorMessage = 'Invalid token format';
        } else if (tokenError.name === 'NotBeforeError') {
          errorMessage = 'Token not active yet';
        }
        
        return NextResponse.json(
          { 
            error: errorMessage,
            success: false,
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        );
      }

      if (!decoded || !decoded.userId) {
        return NextResponse.json(
          { 
            error: 'Invalid token payload',
            success: false,
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        );
      }

      if (requireAdmin && !decoded.isAdmin) {
        return NextResponse.json(
          { 
            error: 'Admin access required',
            success: false,
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Add user info to request
      (request as any).user = decoded;
      (request as any).userId = decoded.userId; // For backward compatibility
      
      try {
        return await handler(request, ...args);
      } catch (handlerError: any) {
        console.error('Handler error in withAuth:', handlerError);
        return NextResponse.json(
          { 
            error: 'Internal server error',
            success: false,
            timestamp: new Date().toISOString(),
            ...(process.env.NODE_ENV === 'development' && { 
              details: handlerError.message 
            })
          },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('Middleware error:', error);
      return NextResponse.json(
        { 
          error: 'Authentication error',
          success: false,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  };
}

export function withAuthOptional(handler: Function, requireAdmin = false) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const authHeader = request.headers.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (requireAdmin && !decoded.isAdmin) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }

        // Add user info to request
        (request as any).user = decoded;
        (request as any).userId = decoded.userId; // For backward compatibility
      }
      
      return handler(request, ...args);
    } catch (error) {
      // If requireAdmin is true and token is invalid, return error
      if (requireAdmin) {
        return NextResponse.json(
          { error: 'Invalid token or admin access required' },
          { status: 401 }
        );
      }
      
      // Otherwise continue without user context
      return handler(request, ...args);
    }
  };
}

export function getAuthUser(request: NextRequest) {
  return (request as any).user;
}
