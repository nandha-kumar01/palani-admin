import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, generateToken, generateRefreshToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Log incoming request for debugging
    console.log('Login attempt started at:', new Date().toISOString());
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      hasMongoURI: !!process.env.MONGODB_URI,
      hasJWTSecret: !!process.env.JWT_SECRET,
      mongoURILength: process.env.MONGODB_URI?.length || 0
    });
    
    // Check if required environment variables exist
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not found in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));
      return NextResponse.json(
        { error: 'Database configuration error - MONGODB_URI missing' },
        { status: 500 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not found in environment variables');
      return NextResponse.json(
        { error: 'Authentication configuration error - JWT_SECRET missing' },
        { status: 500 }
      );
    }

    // Try to connect to database
    try {
      await dbConnect();
      console.log('Database connected successfully for login request');
    } catch (dbError: any) {
      console.error('Database connection failed:', {
        message: dbError.message,
        name: dbError.name,
        stack: dbError.stack,
        mongoURI: process.env.MONGODB_URI?.substring(0, 20) + '...'
      });
      return NextResponse.json(
        { error: 'Database connection failed: ' + dbError.message },
        { status: 500 }
      );
    }
    
    const { email, password } = await request.json();
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email - first check if user exists at all
    const user = await User.findOne({ 
      email: email.toLowerCase()
    });
    
    console.log('User found:', !!user);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('User details:', {
      isActive: user.isActive,
      status: user.status,
      isAdmin: user.isAdmin,
      hasOTP: !!user.resetPasswordOTP,
      otpExpired: user.resetPasswordExpiry ? new Date() > user.resetPasswordExpiry : false
    });

    // Check if user is active
    if (!user.isActive || user.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active or verified' },
        { status: 401 }
      );
    }

    // Check if user has valid (non-expired) pending OTP verification
    // Only block if OTP exists AND is not expired
    if (user.resetPasswordOTP && user.resetPasswordExpiry) {
      const now = new Date();
      const isOTPExpired = now > user.resetPasswordExpiry;
      
      // If OTP is expired, clear it and allow login
      if (isOTPExpired) {
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();
        console.log('Cleared expired OTP for user:', email);
      } else if (!user.isAdmin) {
        // OTP is still valid and user is not admin, require verification
        return NextResponse.json(
          { error: 'Please complete your registration by verifying your email first' },
          { status: 401 }
        );
      }
    }

    // Check password
    console.log('Checking password...');
    const isPasswordValid = await comparePassword(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate tokens
    console.log('Generating tokens...');
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Remove password from response
    const { password: _, resetPasswordOTP, resetPasswordExpiry, ...userWithoutPassword } = user.toObject();

    console.log('Login successful for:', email);
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    
    // Return more specific error messages
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error: ' + error.message },
        { status: 400 }
      );
    }
    
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
