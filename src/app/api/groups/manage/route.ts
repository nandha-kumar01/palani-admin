import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Group from '@/models/Group';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


// Admin adds a user to a specific group
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
    
    // Check if user is admin
    const adminUser = await withTimeout(User.findById(decoded.userId).maxTimeMS(10000), 15000, 'Database operation timeout');
    if (!adminUser || !adminUser.isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const { userId, groupId } = await request.json();
    
    if (!userId || !groupId) {
      return NextResponse.json({ success: false, error: 'User ID and Group ID are required' },
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
    
    // Check if user exists
    const user = await withTimeout(User.findById(userId).maxTimeMS(10000), 15000, 'Database operation timeout');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' },
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
    if (group.members.includes(userId)) {
      return NextResponse.json({ success: false, error: 'User is already a member of this group' },
        { status: 409 }
      );
    }
    
    // If user is in another group, remove them first
    if (user.groupId) {
      await withTimeout(await Group.findByIdAndUpdate(user.groupId, {
        $pull: { members: userId }
      }), 15000, 'Database operation timeout');
    }
    
    // Add user to new group
    await withTimeout(await Group.findByIdAndUpdate(groupId, {
      $addToSet: { members: userId }
    }), 15000, 'Database operation timeout');
    
    // Update user's groupId
    await withTimeout(await User.findByIdAndUpdate(userId, {
      groupId: groupId,
      joinedGroupAt: new Date(),
    }), 15000, 'Database operation timeout');
    
    // Get updated group with full member details
    const updatedGroup = await withTimeout(await Group.findById(groupId).maxTimeMS(10000)
      .populate('createdBy', 'name email phone')
      .populate('members', 'name email phone currentLocation isTracking pathayathiraiStatus totalDistance visitedTemples profilePicture lastLocationUpdate joinedGroupAt'), 15000, 'Database operation timeout');
    
    return NextResponse.json({
      message: 'User successfully added to group',
      group: updatedGroup,
      success: true,
    });
  } catch (error: any) {
    console.error('Admin add user to group error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add user to group' },
      { status: 500 }
    );
  }
}

// Admin removes a user from a group
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
    
    // Check if user is admin
    const adminUser = await withTimeout(User.findById(decoded.userId).maxTimeMS(10000), 15000, 'Database operation timeout');
    if (!adminUser || !adminUser.isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const { userId, groupId } = await request.json();
    
    if (!userId || !groupId) {
      return NextResponse.json({ success: false, error: 'User ID and Group ID are required' },
        { status: 400 }
      );
    }
    
    // Remove user from group
    await withTimeout(await Group.findByIdAndUpdate(groupId, {
      $pull: { members: userId }
    }), 15000, 'Database operation timeout');
    
    // Update user's groupId to null
    await withTimeout(await User.findByIdAndUpdate(userId, {
      groupId: null,
      joinedGroupAt: null,
    }), 15000, 'Database operation timeout');
    
    // Get updated group with full member details
    const updatedGroup = await withTimeout(await Group.findById(groupId).maxTimeMS(10000)
      .populate('createdBy', 'name email phone')
      .populate('members', 'name email phone currentLocation isTracking pathayathiraiStatus totalDistance visitedTemples profilePicture lastLocationUpdate joinedGroupAt'), 15000, 'Database operation timeout');
    
    return NextResponse.json({
      message: 'User successfully removed from group',
      group: updatedGroup,
      success: true,
    });
  } catch (error: any) {
    console.error('Admin remove user from group error:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove user from group' },
      { status: 500 }
    );
  }
}
