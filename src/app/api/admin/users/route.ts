import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';

async function getUsers(request: NextRequest) {
  try {
    // Connect to database with timeout
    const dbConnectPromise = dbConnect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 10000);
    });
    
    await Promise.race([dbConnectPromise, timeoutPromise]);
  
    const { searchParams } = new URL(request.url);
    
    // Validate and sanitize parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50'))); // Default 50, max 100
    const search = searchParams.get('search')?.trim().slice(0, 100) || ''; // Limit search length
    const status = searchParams.get('status')?.trim() || '';
    
    // Individual filter parameters with validation
    const nameFilter = searchParams.get('name')?.trim().slice(0, 50) || '';
    const emailFilter = searchParams.get('email')?.trim().slice(0, 100) || '';
    const phoneFilter = searchParams.get('phone')?.trim().slice(0, 15) || '';
    const whatsappFilter = searchParams.get('whatsapp')?.trim().slice(0, 15) || '';
    const groupFilter = searchParams.get('group')?.trim().slice(0, 50) || '';
    
    const skip = (page - 1) * limit;
    
    let query: any = {};
    
    // Filter out deleted users by default
    query.isDeleted = { $ne: true };
    
    // Build search query with error handling
    if (search) {
      try {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { whatsappNumber: { $regex: search, $options: 'i' } },
        ];
      } catch (regexError) {
        console.warn('Invalid regex in search:', regexError);
        // Use text search as fallback
        query.$text = { $search: search };
      }
    }

    // Individual field filters with error handling
    try {
      if (nameFilter) {
        query.name = { $regex: nameFilter, $options: 'i' };
      }
      if (emailFilter) {
        query.email = { $regex: emailFilter, $options: 'i' };
      }
      if (phoneFilter) {
        query.phone = { $regex: phoneFilter, $options: 'i' };
      }
      if (whatsappFilter) {
        query.whatsappNumber = { $regex: whatsappFilter, $options: 'i' };
      }
    } catch (regexError) {
      console.warn('Invalid regex in filters:', regexError);
      // Skip problematic filters
    }
    
    if (groupFilter) {
      if (groupFilter === 'solo') {
        query.groupId = { $in: [null, undefined] };
      } else {
        try {
          // Validate ObjectId format
          if (groupFilter.match(/^[0-9a-fA-F]{24}$/)) {
            query.groupId = groupFilter;
          } else {
            // Try to find group by name
            const Group = require('@/models/Group').default;
            const group = await Group.findOne({ name: { $regex: groupFilter, $options: 'i' } });
            if (group) {
              query.groupId = group._id;
            }
          }
        } catch (groupError) {
          console.warn('Group filter error:', groupError);
        }
      }
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'tracking') {
      query.isTracking = true;
    }
    
    // Execute queries with timeout
    const queryTimeout = 8000; // 8 seconds
    const queryPromise = User.find(query)
      .populate('groupId', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const timeoutPromise2 = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), queryTimeout);
    });
    
    const users = await Promise.race([queryPromise, timeoutPromise2]) as any[];

    // Transform users safely
    const transformedUsers = users.map((user: any) => {
      try {
        // Remove sensitive fields and transform
        const { password, resetPasswordOTP, ...userWithoutSensitive } = user;
        
        return {
          ...userWithoutSensitive,
          _id: user._id.toString(),
          groupName: user.groupId?.name || null,
          groupId: user.groupId?._id?.toString() || null,
          whatsappNumber: user.whatsappNumber || '',
          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
        };
      } catch (transformError) {
        console.warn('User transform error:', transformError);
        return null;
      }
    }).filter(Boolean); // Remove null entries
    
    // Get total count with timeout
    const countPromise = User.countDocuments(query);
    const timeoutPromise3 = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Count timeout')), 5000);
    });
    
    const total = await Promise.race([countPromise, timeoutPromise3]) as number;
    
    // Get stats in parallel with timeout
    const statsQueries = [
      User.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ isActive: true, isDeleted: { $ne: true } }),
      User.countDocuments({ isTracking: true, isDeleted: { $ne: true } }),
      User.countDocuments({ pathayathiraiStatus: 'in_progress', isDeleted: { $ne: true } }),
      User.countDocuments({ isDeleted: true }),
    ];
    
    const statsTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Stats timeout')), 5000);
    });
    
    const statsResults = await Promise.race([
      Promise.allSettled(statsQueries),
      statsTimeout
    ]) as PromiseSettledResult<number>[];
    
    const stats = {
      total: statsResults[0]?.status === 'fulfilled' ? statsResults[0].value : 0,
      active: statsResults[1]?.status === 'fulfilled' ? statsResults[1].value : 0,
      tracking: statsResults[2]?.status === 'fulfilled' ? statsResults[2].value : 0,
      onPathayathirai: statsResults[3]?.status === 'fulfilled' ? statsResults[3].value : 0,
      deleted: statsResults[4]?.status === 'fulfilled' ? statsResults[4].value : 0,
    };
    
    const response = {
      users: transformedUsers,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Get users error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
    });
    
    // Determine error type and return appropriate response
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error.message?.includes('timeout')) {
      statusCode = 504;
      errorMessage = 'Request timeout - please try again';
    } else if (error.message?.includes('connection')) {
      statusCode = 503;
      errorMessage = 'Database connection error - please try again';
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Invalid request parameters';
    } else if (error.name === 'CastError') {
      statusCode = 400;
      errorMessage = 'Invalid data format in request';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      },
      { status: statusCode }
    );
  }
}

export const GET = withAuth(getUsers, true);

async function createUser(request: NextRequest) {
  try {
    await dbConnect();
    
    const requestData = await request.json();
    
    const { name, email, phone, whatsappNumber, password, isActive = true, isAdmin = false, pathayathiraiStatus = 'not_started', groupId } = requestData;

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
    const existingUserQuery: any[] = [{ email }, { phone }];
    if (whatsappNumber && whatsappNumber.trim()) {
      existingUserQuery.push({ whatsappNumber: whatsappNumber.trim() });
    }
    
    const existingUser = await User.findOne({ 
      $or: existingUserQuery
    });
    
    if (existingUser) {
      let fieldName = 'email';
      let fieldValue = email;
      
      if (existingUser.phone === phone) {
        fieldName = 'phone number';
        fieldValue = phone;
      } else if (whatsappNumber && existingUser.whatsappNumber === whatsappNumber.trim()) {
        fieldName = 'WhatsApp number';
        fieldValue = whatsappNumber;
      }
      
      return NextResponse.json(
        { 
          error: `User with this ${fieldName} already exists`,
          details: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${fieldValue} is already registered`
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
      whatsappNumber: whatsappNumber && whatsappNumber.trim() ? whatsappNumber.trim() : '',
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
    } else {
      // Set a default password if none provided
      const defaultPassword = 'temp123456';
      const hashedPassword = await hashPassword(defaultPassword);
      userData.password = hashedPassword;
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
      .populate('groupId', 'name description')
      .lean();
    
    // Remove password field manually
    if (savedUser && typeof savedUser === 'object' && 'password' in savedUser) {
      const { password: _, ...userWithoutPassword } = savedUser as any;
      return NextResponse.json({
        message: 'User created successfully',
        user: userWithoutPassword,
      }, { status: 201 });
    }

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
