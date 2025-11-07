import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import User from '@/models/User'; // Import User model to register schema for populate
import { withAuth } from '@/lib/middleware';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


async function getAnnouncement(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    const announcement = await withTimeout(await Announcement.findById(id).maxTimeMS(10000)
      .populate('createdBy', 'name email')
      .populate('readBy.userId', 'name email'), 15000, 'Database operation timeout');

    if (!announcement) {
      return NextResponse.json({ success: false, error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    console.error('Get announcement error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAnnouncement, true);

async function updateAnnouncement(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const updateData = await request.json();
    
    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.sentAt;
    delete updateData.readBy;

    // Validate type if provided
    if (updateData.type) {
      const validTypes = ['info', 'warning', 'urgent', 'celebration'];
      if (!validTypes.includes(updateData.type)) {
        return NextResponse.json({ success: false, error: 'Invalid announcement type' },
          { status: 400 }
        );
      }
    }

    // Validate target audience if provided
    if (updateData.targetAudience) {
      const validAudiences = ['all', 'active_users', 'specific_location'];
      if (!validAudiences.includes(updateData.targetAudience)) {
        return NextResponse.json({ success: false, error: 'Invalid target audience' },
          { status: 400 }
        );
      }
    }

    // If targeting specific location, location data is required
    if (updateData.targetAudience === 'specific_location' && !updateData.location) {
      return NextResponse.json({ success: false, error: 'Location data is required for location-specific announcements' },
        { status: 400 }
      );
    }

    // Convert scheduledAt to Date if provided
    if (updateData.scheduledAt) {
      updateData.scheduledAt = new Date(updateData.scheduledAt);
    }

    const updatedAnnouncement = await withTimeout(await Announcement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email'), 15000, 'Database operation timeout');

    if (!updatedAnnouncement) {
      return NextResponse.json({ success: false, error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Announcement updated successfully',
      announcement: updatedAnnouncement, });
  } catch (error: any) {
    console.error('Update announcement error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(updateAnnouncement, true);

async function deleteAnnouncement(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const deletedAnnouncement = await withTimeout(Announcement.findByIdAndDelete(id), 15000, 'Database operation timeout');

    if (!deletedAnnouncement) {
      return NextResponse.json({ success: false, error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Announcement deleted successfully', });
  } catch (error: any) {
    console.error('Delete announcement error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(deleteAnnouncement, true);
