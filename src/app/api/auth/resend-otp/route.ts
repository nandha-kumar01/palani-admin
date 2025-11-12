import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ensureModelsRegistered } from '@/lib/ensureModels';
import { User } from '@/models';
import { sendOTPEmail } from '@/lib/emailService';
import crypto from 'crypto';

// Generate 6-digit OTP
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(request: NextRequest) {
  try {
    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email service not configured. Please contact administrator.' 
        },
        { status: 500 }
      );
    }

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
        { success: false, error: 'User not found with this email' },
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

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp, 'resend');
      console.log(`✅ OTP resent successfully to ${email}`);
    } catch (emailError: any) {
      console.error('Email sending failed:', emailError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send email. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'New OTP sent successfully to your email',
        // Show OTP in development mode only for testing
        ...(process.env.NODE_ENV === 'development' && { otp })
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Resend OTP error:', error);
    
    // Handle specific errors
    if (error.message?.includes('Email service')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to resend OTP. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
