import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function withAuth(handler: Function, requireAdmin = false) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'No token provided' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
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
      
      return handler(request, ...args);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
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
