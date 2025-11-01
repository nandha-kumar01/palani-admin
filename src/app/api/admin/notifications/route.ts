import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';
import Group from '@/models/Group';
import { withAuth } from '@/lib/middleware';
import { withTimeout } from '@/lib/apiTimeout';

// Ensure all models are properly registered with Mongoose
const ensureModelsRegistered = () => {
  try {
    // Force model registration by accessing them
    User;
    Group;
    Notification;
  } catch (error) {

  }
};

// Call this at module level to ensure models are registered
ensureModelsRegistered();

// GET - Fetch notifications with filtering and pagination
async function getNotifications(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const recipientType = searchParams.get('recipientType') || '';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const userId = searchParams.get('userId') || '';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      isDeleted: false
    };

    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (recipientType) query.recipientType = recipientType;
    if (userId) query['recipients.userId'] = userId;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { senderName: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute queries with timeout
    const [notifications, totalCount] = await Promise.all([
      withTimeout(
        Notification.find(query)
          .populate('senderId', 'name email role')
          .populate('recipients.userId', 'name email')
          .populate('recipients.groupId', 'name')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        15000,
        'Database query timeout'
      ),
      withTimeout(
        Notification.countDocuments(query),
        10000,
        'Count query timeout'
      )
    ]);

    // Calculate analytics
    const analytics = await withTimeout(
      Notification.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalNotifications: { $sum: 1 },
            totalSent: { $sum: '$analytics.sentCount' },
            totalDelivered: { $sum: '$analytics.deliveredCount' },
            totalRead: { $sum: '$analytics.readCount' },
            averageOpenRate: { $avg: '$analytics.openRate' },
            byType: {
              $push: {
                type: '$type',
                count: 1
              }
            },
            byPriority: {
              $push: {
                priority: '$priority',
                count: 1
              }
            }
          }
        }
      ]),
      10000,
      'Analytics query timeout'
    );

    const analyticsData = analytics[0] || {
      totalNotifications: 0,
      totalSent: 0,
      totalDelivered: 0,
      totalRead: 0,
      averageOpenRate: 0,
      byType: [],
      byPriority: []
    };

    // Process type and priority counts
    const typeStats = analyticsData.byType.reduce((acc: any, item: any) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    const priorityStats = analyticsData.byPriority.reduce((acc: any, item: any) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        },
        analytics: {
          ...analyticsData,
          typeStats,
          priorityStats
        }
      }
    });

  } catch (error: any) {

    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new notification
async function createNotification(request: NextRequest) {
  try {
    await dbConnect();
    
    // Ensure models are registered
    ensureModelsRegistered();

    const body = await request.json();
    const {
      title,
      message,
      type = 'info',
      priority = 'medium',
      recipientType = 'individual',
      recipients = [],
      scheduledFor,
      expiresAt,
      metadata = {},
      tags = []
    } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Get sender info from request (from auth middleware)
    const senderId = (request as any).userId;
    const senderData = await withTimeout(
      User.findById(senderId).select('name role'),
      10000,
      'User lookup timeout'
    );

    if (!senderData) {
      return NextResponse.json(
        { success: false, error: 'Sender not found' },
        { status: 404 }
      );
    }

    // Validate recipients based on type
    let processedRecipients = [];
    
    try {
      if (recipientType === 'all') {
        // Get all active users
        const allUsers = await withTimeout(
          User.find({ isActive: true, isDeleted: false }).select('_id'),
          15000,
          'All users query timeout'
        );
        processedRecipients = allUsers.map((user: any) => ({ userId: user._id }));
      } else if (recipientType === 'group') {
        // Handle group recipients with better error handling
        try {
          for (const recipient of recipients) {
            if (recipient.groupId) {
              // Use Group model safely
              const group = await withTimeout(
                Group.findById(recipient.groupId).populate('members'),
                10000,
                'Group lookup timeout'
              );
              
              if (group && group.members) {
                processedRecipients.push(...group.members.map((user: any) => ({ userId: user._id })));
              }
            }
          }
        } catch (groupError) {
          console.error('Group processing error:', groupError);
          // Fallback to all users if group processing fails
          const allUsers = await withTimeout(
            User.find({ isActive: true, isDeleted: false }).select('_id'),
            15000,
            'Fallback all users query timeout'
          );
          processedRecipients = allUsers.map((user: any) => ({ userId: user._id }));
        }
      } else if (recipientType === 'role-based') {
        // Get users by role
        for (const recipient of recipients) {
          if (recipient.role) {
            const roleUsers = await withTimeout(
              User.find({ role: recipient.role, isActive: true }).select('_id'),
              10000,
              'Role users query timeout'
            );
            processedRecipients.push(...roleUsers.map((user: any) => ({ userId: user._id })));
          }
        }
      } else {
        // Individual recipients
        processedRecipients = recipients.filter((r: any) => r.userId);
      }
    } catch (recipientError: any) {
      console.error('Recipient processing error:', recipientError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to process recipients',
          details: recipientError.message 
        },
        { status: 500 }
      );
    }

    // Create notification
    const notification = new Notification({
      title,
      message,
      type,
      priority,
      senderId,
      senderName: senderData.name,
      senderRole: (senderData.role || 'admin').toLowerCase(),
      recipientType,
      recipients: processedRecipients,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata,
      tags,
      analytics: {
        sentCount: processedRecipients.length,
        deliveredCount: 0,
        readCount: 0,
        clickCount: 0,
        openRate: 0,
        clickRate: 0
      }
    });

    // If not scheduled, mark as sent immediately
    if (!scheduledFor) {
      notification.status = 'sent';
      notification.sentAt = new Date();
    }

    await withTimeout(notification.save(), 15000, 'Save notification timeout');

    // Populate the saved notification for response
    const savedNotification = await withTimeout(
      Notification.findById(notification._id)
        .populate('senderId', 'name email role')
        .populate('recipients.userId', 'name email')
        .populate('recipients.groupId', 'name'),
      10000,
      'Populate notification timeout'
    );

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      data: savedNotification
    });

  } catch (error: any) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getNotifications, true);
export const POST = withAuth(createNotification, true);