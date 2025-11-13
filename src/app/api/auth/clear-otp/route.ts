import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ensureModelsRegistered } from '@/lib/ensureModels';
import { User } from '@/models';

/**
 * Cleanup endpoint to clear expired OTPs from user accounts
 * This helps users who have expired OTPs and can't login
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure models are registered
    await ensureModelsRegistered();
    
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has OTP fields
    if (!user.resetPasswordOTP && !user.resetPasswordExpiry) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'User account is already clean. You can login now.',
          canLogin: true
        },
        { status: 200 }
      );
    }

    // Check if OTP is expired or clear it anyway
    const now = new Date();
    const isExpired = user.resetPasswordExpiry ? now > user.resetPasswordExpiry : true;

    // Clear OTP fields
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpiry = undefined;
    
    // Ensure user is active if they have expired OTP
    if (isExpired && user.status === 'inactive') {
      user.isActive = true;
      user.status = 'active';
    }
    
    await user.save();

    return NextResponse.json(
      { 
        success: true, 
        message: 'Account cleaned successfully. You can now login.',
        wasExpired: isExpired,
        canLogin: true
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Clear OTP error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear OTP data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
