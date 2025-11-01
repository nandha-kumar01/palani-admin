import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Group from '@/models/Group';
import { generateToken, generateRefreshToken } from '@/lib/auth';
import { withTimeout } from '@/lib/apiTimeout';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find temporary user data stored during registration
    const tempUser = await withTimeout(
      User.findOne({ 
        email: email.toLowerCase(),
        resetPasswordOTP: otp,
        resetPasswordExpiry: { $gt: new Date() },
        isActive: false // Temporary users are marked as inactive
      }).maxTimeMS(10000), 
      15000, 
      'Database operation timeout'
    );
    
    if (!tempUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Validate group if provided
    let selectedGroup = null;
    if (tempUser.groupId) {
      selectedGroup = await withTimeout(
        Group.findById(tempUser.groupId).maxTimeMS(10000), 
        15000, 
        'Database operation timeout'
      );
      if (!selectedGroup || !selectedGroup.isActive) {
        return NextResponse.json({ 
          success: false, 
          error: 'Selected group is not available' 
        }, { status: 400 });
      }
      
      // Check if group is full
      if (selectedGroup.members.length >= selectedGroup.maxMembers) {
        return NextResponse.json({ 
          success: false, 
          error: 'Selected group is full' 
        }, { status: 400 });
      }
    }

    // Activate the user account and clear OTP data
    tempUser.isActive = true;
    tempUser.resetPasswordOTP = undefined;
    tempUser.resetPasswordExpiry = undefined;
    tempUser.status = 'active';
    
    await withTimeout(tempUser.save(), 15000, 'Database operation timeout');

    // Add user to group if selected
    if (selectedGroup) {
      selectedGroup.members.push(tempUser._id);
      await withTimeout(selectedGroup.save(), 15000, 'Database operation timeout');
    }

    // Generate tokens
    const tokenPayload = {
      userId: tempUser._id,
      email: tempUser.email,
      isAdmin: tempUser.isAdmin,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Remove sensitive data from response
    const { 
      password: _, 
      resetPasswordOTP: __, 
      resetPasswordExpiry: ___, 
      ...userWithoutPassword 
    } = tempUser.toObject();

    return NextResponse.json({
      success: true,
      message: 'Email verified and user registered successfully',
      user: {
        ...userWithoutPassword,
        groupName: selectedGroup ? selectedGroup.name : null,
      },
      accessToken,
      refreshToken,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration verification error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to verify registration. Please try again.' 
    }, { status: 500 });
  }
}