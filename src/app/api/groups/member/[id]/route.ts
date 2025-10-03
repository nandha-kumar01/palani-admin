import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Group from '@/models/Group';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id: memberId } = await params;
    
    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Member ID is required' },
        { status: 400 }
      );
    }
    
    // Find the member with full details
    const member = await withTimeout(await User.findById(memberId).maxTimeMS(10000)
      .populate({
        path: 'groupId',
        select: 'name description createdBy maxMembers pathayathiraiStatus startDate endDate totalGroupDistance groupStats members',
        populate: {
          path: 'createdBy members',
          select: 'name email currentLocation isTracking pathayathiraiStatus totalDistance'
        }
      })
      .populate('visitedTemples.templeId', 'name location address description')
      .select('-password'), 15000, 'Database operation timeout'); // Exclude password for security
    
    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' },
        { status: 404 }
      );
    }
    
    // Calculate additional stats
    const memberStats = {
      totalDistance: member.totalDistance || 0,
      templesVisited: member.visitedTemples?.length || 0,
      isCurrentlyTracking: member.isTracking || false,
      pathayathiraiProgress: member.pathayathiraiStatus || 'not_started',
      lastLocationUpdate: member.lastLocationUpdate,
      memberSince: member.joinedGroupAt || member.createdAt,
    };
    
    return NextResponse.json({
      member: {
        ...member.toObject(),
        stats: memberStats,
      },
      success: true,
    });
  } catch (error: any) {
    console.error('Member fetch error:', error);
    
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return NextResponse.json({ success: false, error: 'Invalid member ID format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: false, error: 'Failed to fetch member data' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id: memberId } = await params;
    const updateData = await request.json();
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    const { password, isAdmin, ...safeUpdateData } = updateData;
    
    const updatedMember = await withTimeout(await User.findByIdAndUpdate(
      memberId,
      safeUpdateData,
      { new: true, runValidators: true }
    )
      .populate('groupId', 'name description')
      .populate('visitedTemples.templeId', 'name location')
      .select('-password'), 15000, 'Database operation timeout');
    
    if (!updatedMember) {
      return NextResponse.json({ success: false, error: 'Member not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      member: updatedMember,
      message: 'Member updated successfully',
      success: true,
    });
  } catch (error: any) {
    console.error('Member update error:', error);
    
    if (error.name === 'CastError') {
      return NextResponse.json({ success: false, error: 'Invalid member ID format' },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: false, error: 'Failed to update member data' },
      { status: 500 }
    );
  }
}
