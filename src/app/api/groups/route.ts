import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Group from '@/models/Group';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';


export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const includeMembers = searchParams.get('includeMembers') === 'true';
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const userId = searchParams.get('userId');
    const memberId = searchParams.get('memberId');
    
    // If memberId is provided, return full member data from groups
    if (memberId) {
      try {
        // Find the member with full details
        const member = await User.findById(memberId)
          .populate('groupId', 'name description createdBy maxMembers pathayathiraiStatus startDate endDate totalGroupDistance groupStats')
          .populate('visitedTemples.templeId', 'name location address')
          .select('-password'); // Exclude password for security
        
        if (!member) {
          return NextResponse.json(
            { error: 'Member not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          member: member,
          success: true,
        });
      } catch (error: any) {
        console.error('Member fetch error:', error);
        return NextResponse.json(
          { error: 'Invalid member ID format' },
          { status: 400 }
        );
      }
    }
    
    let query: any = {};
    
    // Include inactive groups only if requested (for admin statistics)
    if (!includeInactive) {
      query.isActive = true;
    }
    
    // If userId provided, get user's groups or available groups
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.groupId) {
        // Get user's current group
        query = { _id: user.groupId };
        if (!includeInactive) {
          query.isActive = true;
        }
      }
    }
    
    let groupsQuery = Group.find(query)
      .populate('createdBy', 'name email phone')
      .sort({ createdAt: -1 });
    
    if (includeMembers) {
      groupsQuery = groupsQuery.populate('members', 'name email phone currentLocation isTracking pathayathiraiStatus totalDistance visitedTemples profilePicture lastLocationUpdate joinedGroupAt');
    }
    
    const groups = await groupsQuery.exec();
    
    // Calculate member counts and active status
    const groupsWithStats = await Promise.all(groups.map(async (group) => {
      // Get actual member count from users collection to ensure accuracy
      const actualMemberCount = await User.countDocuments({ groupId: group._id });
      const activeMemberCount = await User.countDocuments({ 
        groupId: group._id, 
        isTracking: true 
      });
      
      return {
        ...group.toObject(),
        memberCount: actualMemberCount,
        activeMemberCount: activeMemberCount,
      };
    }));
    
    return NextResponse.json({
      groups: groupsWithStats,
      total: groups.length,
    });
  } catch (error: any) {
    console.error('Groups GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    const { name, description, maxMembers } = await request.json();
    
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }
    
    // Check if group name already exists
    const existingGroup = await Group.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isActive: true 
    });
    
    if (existingGroup) {
      return NextResponse.json(
        { error: 'Group name already exists' },
        { status: 409 }
      );
    }
    
    // Create new group (admin is NOT automatically added as member)
    const newGroup = new Group({
      name,
      description,
      createdBy: decoded.userId,
      maxMembers: maxMembers || 50,
      members: [], // Empty members array - admin not auto-added
    });
    
    await newGroup.save();
    
    // Do NOT update admin's groupId - admin creates but doesn't join automatically
    
    // Populate the response with full member details
    const populatedGroup = await Group.findById(newGroup._id)
      .populate('createdBy', 'name email phone')
      .populate('members', 'name email phone currentLocation isTracking pathayathiraiStatus totalDistance visitedTemples profilePicture lastLocationUpdate joinedGroupAt');
    
    return NextResponse.json({
      message: 'Group created successfully',
      group: populatedGroup,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Groups POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
