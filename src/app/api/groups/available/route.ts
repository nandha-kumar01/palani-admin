import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Group from '@/models/Group';
import User from '@/models/User';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


// Get all available groups that users can join
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const includeFullMembers = searchParams.get('includeFullMembers') === 'true';
    
    // Get all active groups with basic info
    const groups = await withTimeout(await Group.find({ isActive: true }).maxTimeMS(10000)
      .populate('createdBy', 'name email phone')
      .populate('members', 'name email phone currentLocation isTracking pathayathiraiStatus totalDistance profilePicture joinedGroupAt')
      .sort({ createdAt: -1 }), 15000, 'Database operation timeout');
    
    // Calculate stats for each group
    const groupsWithStats = groups.map(group => {
      const groupObj = group.toObject();
      
      return {
        ...groupObj,
        memberCount: group.members.length,
        availableSlots: group.maxMembers - group.members.length,
        isFull: group.members.length >= group.maxMembers,
        activeMemberCount: group.members.filter((member: any) => member.isTracking).length,
        // Only include full member details if requested
        members: includeFullMembers ? group.members : group.members.map((member: any) => ({
          _id: member._id,
          name: member.name,
          profilePicture: member.profilePicture,
          isTracking: member.isTracking,
          pathayathiraiStatus: member.pathayathiraiStatus
        }))
      };
    });
    
    return NextResponse.json({
      groups: groupsWithStats,
      total: groups.length,
      success: true,
    });
  } catch (error: any) {
    console.error('Available groups fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch available groups' },
      { status: 500 }
    );
  }
}
