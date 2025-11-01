import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { withAuth } from '@/lib/middleware';
import { withTimeout } from '@/lib/apiTimeout';
import { getFirebaseAdminMessaging, isFirebaseAdminAvailable } from '@/lib/firebase-admin';

// POST - Send push notification to devices
async function sendPushNotification(request: NextRequest) {
  try {
    // Check if Firebase is available
    if (!isFirebaseAdminAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Firebase notifications are not configured'
      }, { status: 503 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      notificationId,
      userIds = [],
      title,
      message,
      data = {},
      imageUrl,
      actionUrl,
      sound = 'default',
      badge,
      priority = 'high'
    } = body;

    // Get user FCM tokens
    let targetUsers = [];
    
    if (userIds.length > 0) {
      targetUsers = await withTimeout(
        User.find({ 
          _id: { $in: userIds },
          fcmToken: { $exists: true, $ne: null },
          isActive: true 
        }).select('_id name email fcmToken deviceInfo'),
        10000,
        'User tokens query timeout'
      );
    } else {
      // Send to all users with FCM tokens
      targetUsers = await withTimeout(
        User.find({ 
          fcmToken: { $exists: true, $ne: null },
          isActive: true 
        }).select('_id name email fcmToken deviceInfo'),
        15000,
        'All user tokens query timeout'
      );
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No users found with FCM tokens'
      }, { status: 400 });
    }

    // Prepare notification payload
    const notification = {
      title,
      body: message,
      ...(imageUrl && { image: imageUrl })
    };

    const messageData = {
      notification,
      data: {
        notificationId: notificationId || '',
        actionUrl: actionUrl || '',
        type: data.type || 'general',
        timestamp: Date.now().toString(),
        ...data
      },
      android: {
        priority: priority as any,
        notification: {
          icon: 'ic_notification',
          color: '#667eea',
          sound: sound,
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          channelId: 'palani_notifications',
          ...(imageUrl && { imageUrl })
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body: message
            },
            sound: sound,
            badge: badge || 1,
            'mutable-content': 1,
            category: 'GENERAL'
          }
        },
        fcm_options: {
          image: imageUrl
        }
      },
      webpush: {
        notification: {
          title,
          body: message,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          image: imageUrl,
          data: {
            url: actionUrl || '/',
            notificationId: notificationId || ''
          },
          actions: actionUrl ? [{
            action: 'open',
            title: 'View',
            icon: '/icon-192.png'
          }] : undefined
        },
        fcm_options: {
          link: actionUrl || '/'
        }
      }
    };

    // Group tokens by platform for better delivery
    const androidTokens = targetUsers
      .filter(user => user.deviceInfo?.platform === 'android')
      .map(user => user.fcmToken);
    
    const iosTokens = targetUsers
      .filter(user => user.deviceInfo?.platform === 'ios')
      .map(user => user.fcmToken);
    
    const webTokens = targetUsers
      .filter(user => !user.deviceInfo?.platform || user.deviceInfo?.platform === 'web')
      .map(user => user.fcmToken);

    const deliveryResults: {
      platform: string;
      successCount: number;
      failureCount: number;
      responses: any[];
    }[] = [];
    const failedDeliveries: {
      userId?: any;
      token?: string;
      error?: string;
      platform: string;
      tokenCount?: number;
    }[] = [];

    // Get Firebase messaging instance
    const messaging = getFirebaseAdminMessaging();
    if (!messaging) {
      return NextResponse.json({
        success: false,
        error: 'Firebase messaging not available'
      }, { status: 503 });
    }

    // Send to Android devices
    if (androidTokens.length > 0) {
      try {
        const response = await messaging.sendEachForMulticast({
          tokens: androidTokens,
          ...messageData
        });

        deliveryResults.push({
          platform: 'android',
          successCount: response.successCount,
          failureCount: response.failureCount,
          responses: response.responses
        });

        // Track failed tokens
        response.responses.forEach((result: any, index: number) => {
          if (!result.success) {
            failedDeliveries.push({
              userId: targetUsers.find(u => u.fcmToken === androidTokens[index])?._id,
              token: androidTokens[index],
              error: result.error?.message,
              platform: 'android'
            });
          }
        });
      } catch (error: any) {
        failedDeliveries.push({
          platform: 'android',
          error: error.message,
          tokenCount: androidTokens.length
        });
      }
    }

    // Send to iOS devices
    if (iosTokens.length > 0) {
      try {
        const response = await messaging.sendEachForMulticast({
          tokens: iosTokens,
          ...messageData
        });

        deliveryResults.push({
          platform: 'ios',
          successCount: response.successCount,
          failureCount: response.failureCount,
          responses: response.responses
        });

        // Track failed tokens
        response.responses.forEach((result: any, index: number) => {
          if (!result.success) {
            failedDeliveries.push({
              userId: targetUsers.find(u => u.fcmToken === iosTokens[index])?._id,
              token: iosTokens[index],
              error: result.error?.message,
              platform: 'ios'
            });
          }
        });
      } catch (error: any) {
        failedDeliveries.push({
          platform: 'ios',
          error: error.message,
          tokenCount: iosTokens.length
        });
      }
    }

    // Send to Web devices
    if (webTokens.length > 0) {
      try {
        const response = await messaging.sendEachForMulticast({
          tokens: webTokens,
          ...messageData
        });

        deliveryResults.push({
          platform: 'web',
          successCount: response.successCount,
          failureCount: response.failureCount,
          responses: response.responses
        });

        // Track failed tokens
        response.responses.forEach((result: any, index: number) => {
          if (!result.success) {
            failedDeliveries.push({
              userId: targetUsers.find(u => u.fcmToken === webTokens[index])?._id,
              token: webTokens[index],
              error: result.error?.message,
              platform: 'web'
            });
          }
        });
      } catch (error: any) {
        failedDeliveries.push({
          platform: 'web',
          error: error.message,
          tokenCount: webTokens.length
        });
      }
    }

    // Calculate total success/failure counts
    const totalSuccess = deliveryResults.reduce((sum, result) => sum + (result.successCount || 0), 0);
    const totalFailure = deliveryResults.reduce((sum, result) => sum + (result.failureCount || 0), 0);

    // Update notification record if provided
    if (notificationId) {
      try {
        await withTimeout(
          Notification.findByIdAndUpdate(notificationId, {
            $set: {
              'analytics.deliveredCount': totalSuccess,
              'deliveredTo': targetUsers
                .filter(user => !failedDeliveries.find(f => f.userId?.toString() === user._id.toString()))
                .map(user => ({
                  userId: user._id,
                  deliveredAt: new Date(),
                  method: 'push',
                  status: 'delivered'
                })),
              status: totalSuccess > 0 ? 'delivered' : 'failed',
              ...(totalFailure > 0 && { failureReason: `${totalFailure} deliveries failed` })
            }
          }),
          10000,
          'Update notification timeout'
        );
      } catch (error) {
        // Failed to update notification record
      }
    }

    // Clean up invalid tokens
    const invalidTokens = failedDeliveries
      .filter(failure => failure.error?.includes('registration-token-not-registered'))
      .map(failure => failure.token)
      .filter((token): token is string => token !== undefined);

    if (invalidTokens.length > 0) {
      try {
        await withTimeout(
          User.updateMany(
            { fcmToken: { $in: invalidTokens } },
            { $unset: { fcmToken: 1 } }
          ),
          10000,
          'Clean invalid tokens timeout'
        );
      } catch (error) {
        // Failed to clean invalid tokens
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Push notifications sent',
      data: {
        totalTargeted: targetUsers.length,
        totalSuccess,
        totalFailure,
        deliveryResults,
        failedDeliveries: failedDeliveries.length > 0 ? failedDeliveries : undefined,
        invalidTokensCleaned: invalidTokens.length
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to send push notification', details: error.message },
      { status: 500 }
    );
  }
}

export const POST = withAuth(sendPushNotification, true);