import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { calculateDistance } from '@/lib/locationUtils';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


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
    
    const { latitude, longitude, accuracy } = await request.json();
    
    if (!latitude || !longitude) {
      return NextResponse.json({ success: false, error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }
    
    // Get current user
    const user = await withTimeout(User.findById(decoded.userId).maxTimeMS(10000), 15000, 'Database operation timeout');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Calculate distance traveled if there was a previous location
    let distanceTraveled = 0;
    if (user.currentLocation && user.currentLocation.latitude && user.currentLocation.longitude) {
      distanceTraveled = calculateDistance(
        user.currentLocation.latitude,
        user.currentLocation.longitude,
        latitude,
        longitude
      );
    }
    
    // Update user location and total distance
    const updatedUser = await withTimeout(await User.findByIdAndUpdate(
      decoded.userId,
      {
        currentLocation: {
          latitude,
          longitude,
          timestamp: new Date(),
          accuracy: accuracy || null,
        },
        lastLocationUpdate: new Date(),
        $inc: { totalDistance: distanceTraveled },
        isTracking: true,
      },
      { new: true }
    ), 15000, 'Database operation timeout');
    
    return NextResponse.json({ success: true, message: 'Location updated successfully',
      location: updatedUser.currentLocation,
      totalDistance: updatedUser.totalDistance,
      distanceTraveled, });
  } catch (error: any) {
    console.error('Location update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

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
    
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const userId = searchParams.get('userId');
    
    // Get current user's location
    const currentUser = await withTimeout(User.findById(decoded.userId).maxTimeMS(10000)
      .select('currentLocation name email groupId'), 15000, 'Database operation timeout');
    
    if (!currentUser || !currentUser.currentLocation) {
      return NextResponse.json({ success: false, error: 'User location not available' },
        { status: 404 }
      );
    }
    
    let targetUsers = [];
    
    if (userId) {
      // Get specific user's location and distance
      const targetUser = await withTimeout(User.findById(userId).maxTimeMS(10000)
        .select('name email currentLocation isTracking pathayathiraiStatus totalDistance'), 15000, 'Database operation timeout');
      
      if (targetUser && targetUser.currentLocation) {
        const distance = calculateDistance(
          currentUser.currentLocation.latitude,
          currentUser.currentLocation.longitude,
          targetUser.currentLocation.latitude,
          targetUser.currentLocation.longitude
        );
        
        targetUsers = [{
          ...targetUser.toObject(),
          distanceFromMe: distance,
        }];
      }
    } else if (groupId || currentUser.groupId) {
      // Get all group members' locations and distances
      const searchGroupId = groupId || currentUser.groupId;
      
      const groupMembers = await withTimeout(await User.find({
        groupId: searchGroupId,
        _id: { $ne: decoded.userId }, // Exclude current user
        isTracking: true,
      }).maxTimeMS(10000).select('name email currentLocation isTracking pathayathiraiStatus totalDistance'), 15000, 'Database operation timeout');
      
      targetUsers = groupMembers
        .filter(member => member.currentLocation)
        .map(member => {
          const distance = calculateDistance(
            currentUser.currentLocation.latitude,
            currentUser.currentLocation.longitude,
            member.currentLocation.latitude,
            member.currentLocation.longitude
          );
          
          return {
            ...member.toObject(),
            distanceFromMe: distance,
          };
        })
        .sort((a, b) => a.distanceFromMe - b.distanceFromMe); // Sort by distance
    } else {
      return NextResponse.json({ success: false, error: 'No group or user specified for location tracking' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      currentUser: {
        name: currentUser.name,
        email: currentUser.email,
        location: currentUser.currentLocation,
      },
      targetUsers,
      totalTracked: targetUsers.length,
    });
  } catch (error: any) {
    console.error('Location GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get location data' },
      { status: 500 }
    );
  }
}
