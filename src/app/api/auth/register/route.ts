import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Group from '@/models/Group';
import { hashPassword, generateToken, generateRefreshToken } from '@/lib/auth';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { name, email, phone, password, groupId } = await request.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await withTimeout(await User.findOne({ 
      $or: [{ email }, { phone }] 
    }).maxTimeMS(10000), 15000, 'Database operation timeout');
    
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User with this email or phone already exists' },
        { status: 409 }
      );
    }

    // Validate group if provided
    let selectedGroup = null;
    if (groupId) {
      selectedGroup = await withTimeout(Group.findById(groupId).maxTimeMS(10000), 15000, 'Database operation timeout');
      if (!selectedGroup || !selectedGroup.isActive) {
        return NextResponse.json({ success: false, error: 'Selected group is not available' },
          { status: 400 }
        );
      }
      
      // Check if group is full
      if (selectedGroup.members.length >= selectedGroup.maxMembers) {
        return NextResponse.json({ success: false, error: 'Selected group is full' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      plainPassword: password, // Store plain password for admin viewing
      groupId: groupId || null,
      joinedGroupAt: groupId ? new Date() : null,
    });

    await withTimeout(newUser.save(), 15000, 'Database operation timeout');

    // Add user to group if selected
    if (selectedGroup) {
      selectedGroup.members.push(newUser._id);
      await withTimeout(selectedGroup.save(), 15000, 'Database operation timeout');
    }

    // Generate tokens
    const tokenPayload = {
      userId: newUser._id,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser.toObject();

    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        ...userWithoutPassword,
        groupName: selectedGroup ? selectedGroup.name : null,
      },
      accessToken,
      refreshToken,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
