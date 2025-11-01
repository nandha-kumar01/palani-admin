import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';
import { getFirebaseAdminMessaging, getFirebaseAdminDatabase, isFirebaseAdminAvailable } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is available
    if (!isFirebaseAdminAvailable()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Firebase notifications are not configured' 
      }, { status: 503 });
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const { userId, title, body, data, tokens } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ success: false, error: 'Title and body are required' },
        { status: 400 }
      );
    }

    let targetTokens: string[] = [];

    if (tokens) {
      // Direct tokens provided
      targetTokens = Array.isArray(tokens) ? tokens : [tokens];
    } else if (userId) {
      // Get FCM token for specific user from Realtime Database
      const db = getFirebaseAdminDatabase();
      if (!db) {
        return NextResponse.json({ 
          success: false, 
          error: 'Firebase database not available' 
        }, { status: 503 });
      }

      const tokenSnapshot = await db.ref(`fcmTokens/${userId}`).once('value');
      const tokenData = tokenSnapshot.val();
      
      if (tokenData && tokenData.token) {
        targetTokens = [tokenData.token];
      }
    } else {
      return NextResponse.json({ success: false, error: 'Either userId or tokens must be provided' },
        { status: 400 }
      );
    }

    if (targetTokens.length === 0) {
      return NextResponse.json({ success: false, error: 'No FCM tokens found for the target user(s)' },
        { status: 404 }
      );
    }

    // Get Firebase messaging instance
    const messaging = getFirebaseAdminMessaging();
    if (!messaging) {
      return NextResponse.json({ 
        success: false, 
        error: 'Firebase messaging not available' 
      }, { status: 503 });
    }

    // Send the notification
    const response = await messaging.sendEachForMulticast({
      tokens: targetTokens,
      notification: {
        title,
        body,
      },
      data: data || {},
    });

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    });

  } catch (error: any) {
    console.error('Notification send error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
