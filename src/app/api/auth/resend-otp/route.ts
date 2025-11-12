import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ensureModelsRegistered } from '@/lib/ensureModels';
import { User } from '@/models';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP
    user.resetPasswordOTP = otp;
    user.resetPasswordExpiry = otpExpiry;
    await user.save();

    // In production, send OTP via email/SMS
    // For now, return OTP in response (remove in production)
    console.log(`📧 OTP for ${email}: ${otp}`);

    // TODO: Send OTP via email service
    // await sendOTPEmail(email, otp);

    return NextResponse.json(
      { 
        success: true, 
        message: 'OTP sent successfully',
        // Remove this in production - for testing only
        ...(process.env.NODE_ENV === 'development' && { otp })
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend OTP' },
      { status: 500 }
    );
  }
}
