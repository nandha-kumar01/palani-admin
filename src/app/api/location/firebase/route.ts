import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Group from '@/models/Group';
import { verifyToken } from '@/lib/auth';
import { updateUserLocation, removeUserLocation, UserLocationUpdate } from '@/lib/firebase';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


// Update user location in Firebase (real-time)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    const { latitude, longitude, accuracy, speed, heading } = await request.json();
    
    if (!latitude || !longitude) {
      return NextResponse.json({ success: false, error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }
    
    // Get user data from MongoDB
    const user = await withTimeout(await User.findById(decoded.userId).maxTimeMS(10000)
      .populate('groupId', '_id name'), 15000, 'Database operation timeout');
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update location in MongoDB for persistence
    await withTimeout(await User.findByIdAndUpdate(decoded.userId, {
      currentLocation: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date(),
      },
      lastLocationUpdate: new Date(),
      isTracking: true,
    }), 15000, 'Database operation timeout');
    
    // Prepare Firebase location data
    const firebaseLocationData: UserLocationUpdate = {
      userId: user._id.toString(),
      groupId: user.groupId?._id?.toString(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: Date.now(),
      accuracy: accuracy ? parseFloat(accuracy) : undefined,
      speed: speed ? parseFloat(speed) : undefined,
      heading: heading ? parseFloat(heading) : undefined,
      userName: user.name,
      userEmail: user.email,
      isTracking: true,
      pathayathiraiStatus: user.pathayathiraiStatus || 'not_started',
      totalDistance: user.totalDistance || 0,
    };
    
    // Update location in Firebase for real-time tracking
    await updateUserLocation(firebaseLocationData);
    
    return NextResponse.json({
      message: 'Location updated successfully',
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date(),
      },
      firebase: true,
      success: true,
    });
  } catch (error: any) {
    console.error('Location update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

// Stop location tracking
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Get user data
    const user = await withTimeout(User.findById(decoded.userId).maxTimeMS(10000), 15000, 'Database operation timeout');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update tracking status in MongoDB
    await withTimeout(await User.findByIdAndUpdate(decoded.userId, {
      isTracking: false,
      lastLocationUpdate: new Date(),
    }), 15000, 'Database operation timeout');
    
    // Remove from Firebase real-time tracking
    await removeUserLocation(
      decoded.userId,
      user.groupId?.toString()
    );
    
    return NextResponse.json({
      message: 'Location tracking stopped',
      success: true,
    });
  } catch (error: any) {
    console.error('Stop tracking error:', error);
    return NextResponse.json({ success: false, error: 'Failed to stop location tracking' },
      { status: 500 }
    );
  }
}

// Get current user location from Firebase
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Get user data from MongoDB (Firebase data is handled by the frontend hooks)
    const user = await withTimeout(User.findById(decoded.userId).maxTimeMS(10000)
      .select('name email currentLocation isTracking pathayathiraiStatus totalDistance groupId'), 15000, 'Database operation timeout');
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        currentLocation: user.currentLocation,
        isTracking: user.isTracking,
        pathayathiraiStatus: user.pathayathiraiStatus,
        totalDistance: user.totalDistance,
        groupId: user.groupId,
      },
      firebase: true,
      success: true,
    });
  } catch (error: any) {
    console.error('Get location error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get location data' },
      { status: 500 }
    );
  }
}
