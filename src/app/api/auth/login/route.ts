import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, generateToken, generateRefreshToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email - only active users who have completed OTP verification
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true,
      status: 'active'
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials or account not verified' },
        { status: 401 }
      );
    }

    // Check if user has pending OTP verification (shouldn't happen for active users, but extra safety)
    if (user.resetPasswordOTP || user.resetPasswordExpiry) {
      return NextResponse.json(
        { error: 'Please complete your registration by verifying your email first' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate tokens
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject();

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
