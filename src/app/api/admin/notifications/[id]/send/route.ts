import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User'; // Import User model to register schema for populate
import { withAuth } from '@/lib/middleware';
import { withTimeout } from '@/lib/apiTimeout';

// POST - Send notification immediately
async function sendNotification(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    const notification = await withTimeout(
      Notification.findById(params.id),
      10000,
      'Database query timeout'
    );

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.status === 'sent') {
      return NextResponse.json(
        { success: false, error: 'Notification already sent' },
        { status: 400 }
      );
    }

    // Update notification status
    notification.status = 'sent';
    notification.sentAt = new Date();
    
    // Here you would integrate with your push notification service
    // For example: Firebase Cloud Messaging, OneSignal, etc.
    
    // Simulate delivery to all recipients
    const deliveredTo = notification.recipients.map((recipient: any) => ({
      userId: recipient.userId,
      deliveredAt: new Date(),
      method: 'push',
      status: 'delivered'
    }));

    notification.deliveredTo = deliveredTo;
    notification.analytics.deliveredCount = deliveredTo.length;

    await withTimeout(notification.save(), 15000, 'Save notification timeout');

    // Here you would implement actual push notification sending
    // Example pseudo-code:
    /*
    if (notification.metadata.pushEnabled !== false) {
      await sendPushNotifications(notification.recipients, {
        title: notification.title,
        body: notification.message,
        icon: notification.metadata.icon || '/default-icon.png',
        badge: notification.metadata.badge,
        data: {
          notificationId: notification._id.toString(),
          type: notification.type,
          actionUrl: notification.metadata.actionUrl
        }
      });
    }
    */

    const updatedNotification = await withTimeout(
      Notification.findById(notification._id)
        .populate('senderId', 'name email role')
        .populate('recipients.userId', 'name email'),
      10000,
      'Populate notification timeout'
    );

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      data: updatedNotification
    });

  } catch (error: any) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification', details: error.message },
      { status: 500 }
    );
  }
}

export const POST = withAuth(sendNotification, true);
