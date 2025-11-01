import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Group from '@/models/Group';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const group = await withTimeout(Group.findById(id).maxTimeMS(10000)
      .populate('createdBy', 'name email phone')
      .populate('members', 'name email phone currentLocation isTracking pathayathiraiStatus totalDistance lastLocationUpdate'), 15000, 'Database operation timeout') as any;
    
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' },
        { status: 404 }
      );
    }
    
    // Calculate group statistics
    const activeMembers = group.members.filter((member: any) => member.isTracking);
    const totalDistance = group.members.reduce((sum: number, member: any) => sum + (member.totalDistance || 0), 0);
    const averageDistance = group.members.length > 0 ? totalDistance / group.members.length : 0;
    
    const groupWithStats = {
      ...group.toObject(),
      memberCount: group.members.length,
      activeMemberCount: activeMembers.length,
      groupStats: {
        ...group.groupStats,
        totalDistance,
        averageDistance: Math.round(averageDistance * 100) / 100,
        activeMembers: activeMembers.length,
      },
    };
    
    return NextResponse.json({ success: true, group: groupWithStats });
  } catch (error: any) {
    console.error('Group GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch group' },
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
    const { id } = await params;
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    const { name, description, maxMembers, action, userId } = await request.json();
    
    const group = await withTimeout(Group.findById(id).maxTimeMS(10000), 15000, 'Database operation timeout') as any;
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' },
        { status: 404 }
      );
    }
    
    // Handle join/leave actions
    if (action === 'join') {
      const targetUserId = userId || decoded.userId;
      
      // Check if group is full
      if (group.members.length >= group.maxMembers) {
        return NextResponse.json({ success: false, error: 'Group is full' },
          { status: 400 }
        );
      }
      
      // Check if user is already a member
      if (group.members.includes(targetUserId)) {
        return NextResponse.json({ success: false, error: 'User is already a member of this group' },
          { status: 400 }
        );
      }
      
      // Add user to group
      group.members.push(targetUserId);
      await withTimeout(group.save(), 15000, 'Database operation timeout');
      
      // Update user's groupId
      await withTimeout(User.findByIdAndUpdate(targetUserId, {
        groupId: group._id,
        joinedGroupAt: new Date(),
      }), 15000, 'Database operation timeout');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Successfully joined group',
        group: await withTimeout(Group.findById(group._id).maxTimeMS(10000).populate('members', 'name email'), 15000, 'Database operation timeout')
      });
    }
    
    if (action === 'leave') {
      const targetUserId = userId || decoded.userId;
      
      // Remove user from group
      group.members = group.members.filter((memberId: any) => 
        memberId.toString() !== targetUserId
      );
      
      // If group creator leaves and there are other members, transfer ownership
      if (group.createdBy.toString() === targetUserId && group.members.length > 0) {
        group.createdBy = group.members[0];
      }
      
      await withTimeout(group.save(), 15000, 'Database operation timeout');
      
      // Update user's groupId
      await withTimeout(User.findByIdAndUpdate(targetUserId, {
        groupId: null,
        joinedGroupAt: null,
      }), 15000, 'Database operation timeout');
      
      return NextResponse.json({ success: true, message: 'Successfully left group', });
    }
    
    // Handle group info updates (only by creator or admin)
    if (group.createdBy.toString() !== decoded.userId) {
      const user = await withTimeout(User.findById(decoded.userId).maxTimeMS(10000), 15000, 'Database operation timeout') as any;
      if (!user?.isAdmin) {
        return NextResponse.json({ success: false, error: 'Only group creator or admin can update group info' },
          { status: 403 }
        );
      }
    }
    
    // Update group info
    if (name) group.name = name;
    if (description) group.description = description;
    if (maxMembers) group.maxMembers = maxMembers;
    
    await withTimeout(group.save(), 15000, 'Database operation timeout');
    
    const updatedGroup = await withTimeout(Group.findById(group._id).maxTimeMS(10000)
      .populate('createdBy', 'name email')
      .populate('members', 'name email currentLocation isTracking'), 15000, 'Database operation timeout');
    
    return NextResponse.json({ success: true, message: 'Group updated successfully',
      group: updatedGroup, });
  } catch (error: any) {
    console.error('Group PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    const group = await withTimeout(Group.findById(id).maxTimeMS(10000), 15000, 'Database operation timeout') as any;
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' },
        { status: 404 }
      );
    }
    
    // Check if user is group creator or admin
    if (group.createdBy.toString() !== decoded.userId) {
      const user = await withTimeout(User.findById(decoded.userId).maxTimeMS(10000), 15000, 'Database operation timeout') as any;
      if (!user?.isAdmin) {
        return NextResponse.json({ success: false, error: 'Only group creator or admin can delete group' },
          { status: 403 }
        );
      }
    }
    
    // Remove group reference from all members
    await User.updateMany(
      { groupId: group._id },
      { 
        $unset: { groupId: 1, joinedGroupAt: 1 }
      }
    );
    
    if (permanent) {
      // HARD DELETE: Permanently remove group from database
      await withTimeout(Group.findByIdAndDelete(id), 15000, 'Database operation timeout');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Group permanently deleted from database successfully'
      });
    } else {
      // SOFT DELETE: Mark as inactive
      group.isActive = false;
      group.deletedAt = new Date();
      await withTimeout(group.save(), 15000, 'Database operation timeout');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Group moved to inactive groups successfully'
      });
    }
  } catch (error: any) {
    console.error('Group DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
