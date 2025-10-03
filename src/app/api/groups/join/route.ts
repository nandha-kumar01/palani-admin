import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Group from '@/models/Group';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


// Join a group
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    const { groupId } = await request.json();
    
    if (!groupId) {
      return NextResponse.json({ success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }
    
    // Check if group exists and is active
    const group = await withTimeout(Group.findById(groupId).maxTimeMS(10000), 15000, 'Database operation timeout');
    if (!group || !group.isActive) {
      return NextResponse.json({ success: false, error: 'Group not found or inactive' },
        { status: 404 }
      );
    }
    
    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return NextResponse.json({ success: false, error: 'Group is full' },
        { status: 409 }
      );
    }
    
    // Check if user is already in this group
    if (group.members.includes(decoded.userId)) {
      return NextResponse.json({ success: false, error: 'You are already a member of this group' },
        { status: 409 }
      );
    }
    
    // Check if user is already in another group
    const user = await withTimeout(User.findById(decoded.userId).maxTimeMS(10000), 15000, 'Database operation timeout');
    if (user.groupId) {
      return NextResponse.json({ success: false, error: 'You are already a member of another group. Leave the current group first.' },
        { status: 409 }
      );
    }
    
    // Add user to group
    await withTimeout(await Group.findByIdAndUpdate(groupId, {
      $addToSet: { members: decoded.userId }
    }), 15000, 'Database operation timeout');
    
    // Update user's groupId
    await withTimeout(await User.findByIdAndUpdate(decoded.userId, {
      groupId: groupId,
      joinedGroupAt: new Date(),
    }), 15000, 'Database operation timeout');
    
    // Get updated group with full member details
    const updatedGroup = await withTimeout(await Group.findById(groupId).maxTimeMS(10000)
      .populate('createdBy', 'name email phone')
      .populate('members', 'name email phone currentLocation isTracking pathayathiraiStatus totalDistance visitedTemples profilePicture lastLocationUpdate joinedGroupAt'), 15000, 'Database operation timeout');
    
    return NextResponse.json({
      message: 'Successfully joined the group',
      group: updatedGroup,
      success: true,
    });
  } catch (error: any) {
    console.error('Group join error:', error);
    return NextResponse.json({ success: false, error: 'Failed to join group' },
      { status: 500 }
    );
  }
}

// Leave a group
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Get user's current group
    const user = await withTimeout(User.findById(decoded.userId).maxTimeMS(10000), 15000, 'Database operation timeout');
    if (!user.groupId) {
      return NextResponse.json({ success: false, error: 'You are not a member of any group' },
        { status: 400 }
      );
    }
    
    // Remove user from group
    await withTimeout(await Group.findByIdAndUpdate(user.groupId, {
      $pull: { members: decoded.userId }
    }), 15000, 'Database operation timeout');
    
    // Update user's groupId to null
    await withTimeout(await User.findByIdAndUpdate(decoded.userId, {
      groupId: null,
      joinedGroupAt: null,
    }), 15000, 'Database operation timeout');
    
    return NextResponse.json({
      message: 'Successfully left the group',
      success: true,
    });
  } catch (error: any) {
    console.error('Group leave error:', error);
    return NextResponse.json({ success: false, error: 'Failed to leave group' },
      { status: 500 }
    );
  }
}
