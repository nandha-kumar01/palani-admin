import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import { withAuth } from '@/lib/middleware';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


async function getAnnouncements(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    
    const skip = (page - 1) * limit;
    
    let query: any = {};
    
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } },
        ],
      };
    }

    if (type) {
      query.type = type;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'scheduled') {
      query.scheduledAt = { $gt: new Date() };
      query.sentAt = null;
    } else if (status === 'sent') {
      query.sentAt = { $ne: null };
    }
    
    const announcements = await withTimeout(Announcement.find(query).maxTimeMS(10000)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit), 15000, 'Database operation timeout');
    
    const total = await withTimeout(Announcement.countDocuments(query).maxTimeMS(10000), 15000, 'Database operation timeout') as number;
    
    // Get stats
    const stats = {
      total: await withTimeout(Announcement.countDocuments().maxTimeMS(10000), 15000, 'Database operation timeout'),
      active: await withTimeout(Announcement.countDocuments({ isActive: true }).maxTimeMS(10000), 15000, 'Database operation timeout'),
      scheduled: await withTimeout(Announcement.countDocuments({ 
        scheduledAt: { $gt: new Date() }, 
        sentAt: null 
      }).maxTimeMS(10000), 15000, 'Database operation timeout'),
      sent: await withTimeout(Announcement.countDocuments({ sentAt: { $ne: null } }).maxTimeMS(10000), 15000, 'Database operation timeout'),
      info: await withTimeout(Announcement.countDocuments({ type: 'info' }).maxTimeMS(10000), 15000, 'Database operation timeout'),
      warning: await withTimeout(Announcement.countDocuments({ type: 'warning' }).maxTimeMS(10000), 15000, 'Database operation timeout'),
      urgent: await withTimeout(Announcement.countDocuments({ type: 'urgent' }).maxTimeMS(10000), 15000, 'Database operation timeout'),
      celebration: await withTimeout(Announcement.countDocuments({ type: 'celebration' }).maxTimeMS(10000), 15000, 'Database operation timeout'),
    };
    
    return NextResponse.json({
      announcements,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error: any) {
    console.error('Get announcements error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAnnouncements, true);

async function createAnnouncement(request: NextRequest) {
  try {
    await dbConnect();
    
    const { 
      title, 
      message, 
      type = 'info', 
      targetAudience = 'all',
      location,
      isActive = true,
      sendPushNotification = true,
      scheduledAt,
      createdBy
    } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['info', 'warning', 'urgent', 'celebration'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid announcement type' },
        { status: 400 }
      );
    }

    // Validate target audience
    const validAudiences = ['all', 'active_users', 'specific_location'];
    if (!validAudiences.includes(targetAudience)) {
      return NextResponse.json({ success: false, error: 'Invalid target audience' },
        { status: 400 }
      );
    }

    // If targeting specific location, location data is required
    if (targetAudience === 'specific_location' && !location) {
      return NextResponse.json({ success: false, error: 'Location data is required for location-specific announcements' },
        { status: 400 }
      );
    }

    // Create new announcement
    const newAnnouncement = new Announcement({
      title,
      message,
      type,
      targetAudience,
      location,
      isActive,
      sendPushNotification,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      createdBy,
    });

    await withTimeout(newAnnouncement.save(), 15000, 'Database operation timeout');

    // Populate created by for response
    const savedAnnouncement = await withTimeout(await Announcement.findById(newAnnouncement._id).maxTimeMS(10000)
      .populate('createdBy', 'name email'), 15000, 'Database operation timeout');

    return NextResponse.json({
      message: 'Announcement created successfully',
      announcement: savedAnnouncement,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create announcement error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createAnnouncement, true);
