import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { withAuth } from '@/lib/middleware';
import { withTimeout } from '@/lib/apiTimeout';

// GET - Get specific notification
async function getNotification(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = await params;

    const notification = await withTimeout(
      Notification.findById(id)
        .populate('senderId', 'name email role')
        .populate('recipients.userId', 'name email')
        .populate('recipients.groupId', 'name')
        .populate('readBy.userId', 'name email'),
      10000,
      'Database query timeout'
    );

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification
    });

  } catch (error: any) {
    console.error('Get notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update notification
async function updateNotification(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const { action, ...updateData } = body;

    if (action === 'mark-read') {
      const { userId, deviceInfo } = updateData;
      
      const notification = await withTimeout(
        Notification.findByIdAndUpdate(
          id,
          {
            $addToSet: {
              readBy: {
                userId,
                readAt: new Date(),
                deviceInfo
              }
            }
          },
          { new: true }
        ),
        10000,
        'Mark as read timeout'
      );

      if (!notification) {
        return NextResponse.json(
          { success: false, error: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    }

    if (action === 'update-status') {
      const { status } = updateData;
      
      const notification = await withTimeout(
        Notification.findByIdAndUpdate(
          id,
          { status, ...(status === 'sent' ? { sentAt: new Date() } : {}) },
          { new: true }
        ).populate('senderId', 'name email role'),
        10000,
        'Update status timeout'
      );

      if (!notification) {
        return NextResponse.json(
          { success: false, error: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notification status updated',
        data: notification
      });
    }

    // General update
    const notification = await withTimeout(
      Notification.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      ).populate('senderId', 'name email role'),
      10000,
      'Update notification timeout'
    );

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully',
      data: notification
    });

  } catch (error: any) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification
async function deleteNotification(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = await params;

    const notification = await withTimeout(
      Notification.findByIdAndDelete(id),
      10000,
      'Delete notification timeout'
    );

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getNotification, true);
export const PUT = withAuth(updateNotification, true);
export const DELETE = withAuth(deleteNotification, true);