import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';

async function getUsers(request: NextRequest) {
  try {
    await dbConnect();
  
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // all, active, tracking
    
    const skip = (page - 1) * limit;
    
    let query: any = {};
    
    // Filter out deleted users by default
    query.isDeleted = { $ne: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'tracking') {
      query.isTracking = true;
    }
    
    const users = await User.find(query)
      .select('-password') // Exclude password field
      .populate('groupId', 'name description') // Populate group information
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Transform users to include group name for easier frontend handling
    const transformedUsers = users.map(user => {
      const userObj = user.toObject();
      return {
        ...userObj,
        groupName: userObj.groupId?.name || null,
        groupId: userObj.groupId?._id || null,
      };
    });
    
    const total = await User.countDocuments(query);
    
    // Get stats (excluding deleted users)
    const stats = {
      total: await User.countDocuments({ isDeleted: { $ne: true } }),
      active: await User.countDocuments({ isActive: true, isDeleted: { $ne: true } }),
      tracking: await User.countDocuments({ isTracking: true, isDeleted: { $ne: true } }),
      onPathayathirai: await User.countDocuments({ pathayathiraiStatus: 'in_progress', isDeleted: { $ne: true } }),
      deleted: await User.countDocuments({ isDeleted: true }),
    };
    
    return NextResponse.json({
      users: transformedUsers,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getUsers, true);

async function createUser(request: NextRequest) {
  try {
    await dbConnect();
    
    const requestData = await request.json();
    
    const { name, email, phone, password, isActive = true, isAdmin = false, pathayathiraiStatus = 'not_started', groupId } = requestData;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { 
          error: 'Name, email, and phone are required',
          missing: {
            name: !name,
            email: !email, 
            phone: !phone
          }
        },
        { status: 400 }
      );
    }

    // Check if user already exists (including deleted users)
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      return NextResponse.json(
        { 
          error: `User with this ${existingUser.email === email ? 'email' : 'phone number'} already exists`,
          details: `${existingUser.email === email ? 'Email' : 'Phone'}: ${existingUser.email === email ? email : phone} is already registered`
        },
        { status: 409 }
      );
    }

    // Validate group if provided
    if (groupId) {
      const Group = require('@/models/Group').default;
      const group = await Group.findById(groupId);
      if (!group) {
        return NextResponse.json(
          { error: 'Selected group does not exist' },
          { status: 400 }
        );
      }
      
      // Check if group has space
      const currentMemberCount = await User.countDocuments({ groupId });
      if (currentMemberCount >= group.maxMembers) {
        return NextResponse.json(
          { error: 'Selected group is full' },
          { status: 400 }
        );
      }
    }

    // Create user data object
    const userData: any = {
      name,
      email,
      phone,
      isActive,
      isAdmin,
      pathayathiraiStatus,
      groupId: groupId || undefined,
      joinedGroupAt: groupId ? new Date() : undefined,
    };

    // Only hash and set password if provided
    if (password && password.trim()) {
      const hashedPassword = await hashPassword(password);
      userData.password = hashedPassword;
      userData.plainPassword = password; // Store plain password for admin viewing
    } else {
      // Set a default password if none provided
      const defaultPassword = 'temp123456';
      const hashedPassword = await hashPassword(defaultPassword);
      userData.password = hashedPassword;
      userData.plainPassword = defaultPassword;
    }

    // Create new user
    const newUser = new User(userData);


    await newUser.save();

    // If user is assigned to a group, add them to the group's members array
    if (groupId) {
      const Group = require('@/models/Group').default;
      await Group.findByIdAndUpdate(
        groupId,
        { 
          $addToSet: { members: newUser._id } // $addToSet prevents duplicates
        }
      );
    }

    // Remove password from response and populate group
    const savedUser = await User.findById(newUser._id)
      .select('-password')
      .populate('groupId', 'name description');

    return NextResponse.json({
      message: 'User created successfully',
      user: savedUser,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create user error:', error);
    
    if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = error.keyPattern?.email ? 'email' : 'phone number';
      return NextResponse.json(
        { 
          error: `User with this ${field} already exists`,
          details: error.message 
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : 'Contact support if this persists'
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createUser, true);
