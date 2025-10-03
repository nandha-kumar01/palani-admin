import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import { withAuth } from '@/lib/middleware';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


async function getPublicAnnouncements(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || '';
    
    const skip = (page - 1) * limit;
    
    let query: any = {
      isActive: true,
      $or: [
        { scheduledAt: null }, // Immediate announcements
        { scheduledAt: { $lte: new Date() } }, // Scheduled announcements that are due
      ],
    };
    
    if (type) {
      query.type = type;
    }
    
    const announcements = await withTimeout(Announcement.find(query).maxTimeMS(10000)
      .select('title message type targetAudience location sendPushNotification scheduledAt sentAt createdAt')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit), 15000, 'Database operation timeout');
    
    const total = await withTimeout(Announcement.countDocuments(query).maxTimeMS(10000), 15000, 'Database operation timeout');
    
    return NextResponse.json({
      success: true,
      announcements,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error: any) {
    console.error('Get public announcements error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = getPublicAnnouncements;

// API to mark announcement as read by a user
async function markAsRead(request: NextRequest) {
  try {
    await dbConnect();
    
    const { announcementId, userId } = await request.json();

    if (!announcementId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Announcement ID and User ID are required' },
        { status: 400 }
      );
    }

    const announcement = await withTimeout(Announcement.findById(announcementId).maxTimeMS(10000), 15000, 'Database operation timeout');
    if (!announcement) {
      return NextResponse.json(
        { success: false, error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Check if user has already read this announcement
    const alreadyRead = announcement.readBy.some(
      (read: any) => read.userId.toString() === userId
    );

    if (!alreadyRead) {
      announcement.readBy.push({
        userId,
        readAt: new Date(),
      });
      await withTimeout(announcement.save(), 15000, 'Database operation timeout');
    }

    return NextResponse.json({
      success: true,
      message: 'Announcement marked as read',
    });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(markAsRead, false); // Don't require admin access for marking as read
