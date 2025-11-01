import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Device from '@/models/Device';
import User from '@/models/User';
import { withAuth } from '@/lib/middleware';
import { withTimeout } from '@/lib/apiTimeout';

// GET - Fetch devices with filtering and pagination
async function getDevices(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const platform = searchParams.get('platform') || '';
    const installationSource = searchParams.get('installationSource') || '';
    const isActive = searchParams.get('isActive') || '';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (platform) query.platform = platform;
    if (installationSource) query.installationSource = installationSource;
    if (isActive !== '') query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { deviceModel: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
        { 'deviceInfo.brand': { $regex: search, $options: 'i' } },
        { 'deviceInfo.manufacturer': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute queries with timeout
    const [devices, totalCount] = await Promise.all([
      withTimeout(
        Device.find(query)
          .populate('userId', 'name email role isActive')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        15000,
        'Database query timeout'
      ),
      withTimeout(
        Device.countDocuments(query),
        10000,
        'Count query timeout'
      )
    ]);

    // Calculate analytics
    const analytics = await withTimeout(
      Device.aggregate([
        {
          $group: {
            _id: null,
            totalDevices: { $sum: 1 },
            activeDevices: { 
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } 
            },
            inactiveDevices: { 
              $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } 
            },
            androidDevices: { 
              $sum: { $cond: [{ $eq: ['$platform', 'android'] }, 1, 0] } 
            },
            iosDevices: { 
              $sum: { $cond: [{ $eq: ['$platform', 'ios'] }, 1, 0] } 
            },
            playstoreInstalls: { 
              $sum: { $cond: [{ $eq: ['$installationSource', 'playstore'] }, 1, 0] } 
            },
            appstoreInstalls: { 
              $sum: { $cond: [{ $eq: ['$installationSource', 'appstore'] }, 1, 0] } 
            },
            totalSessions: { $sum: '$totalSessions' },
            averageSessions: { $avg: '$totalSessions' }
          }
        }
      ]),
      10000,
      'Analytics query timeout'
    );

    const analyticsData = analytics[0] || {
      totalDevices: 0,
      activeDevices: 0,
      inactiveDevices: 0,
      androidDevices: 0,
      iosDevices: 0,
      playstoreInstalls: 0,
      appstoreInstalls: 0,
      totalSessions: 0,
      averageSessions: 0
    };

    // Get recent installations (last 7 days)
    const recentInstalls = await withTimeout(
      Device.countDocuments({
        createdAt: { 
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        }
      }),
      5000,
      'Recent installs query timeout'
    );

    return NextResponse.json({
      success: true,
      data: {
        devices,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        },
        analytics: {
          ...analyticsData,
          recentInstalls
        }
      }
    });

  } catch (error: any) {
    console.error('Get devices error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch devices', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Register new device installation
async function registerDevice(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      userId,
      deviceModel,
      deviceId,
      ipAddress,
      installationSource = 'unknown',
      appVersion,
      osVersion,
      platform,
      deviceInfo = {},
      location = {}
    } = body;

    // Validate required fields
    if (!userId || !deviceModel || !deviceId || !ipAddress || !appVersion || !osVersion || !platform) {
      return NextResponse.json(
        { success: false, error: 'Missing required device information' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await withTimeout(
      User.findById(userId).select('name email phone role isActive'),
      10000,
      'User lookup timeout'
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if device already exists
    let device = await withTimeout(
      Device.findOne({ deviceId }),
      10000,
      'Device lookup timeout'
    );

    if (device) {
      // Update existing device
      device.lastActiveDate = new Date();
      device.totalSessions += 1;
      device.isActive = true;
      device.appVersion = appVersion;
      device.osVersion = osVersion;
      device.ipAddress = ipAddress;
      
      if (device.uninstallDate) {
        device.uninstallDate = undefined;
      }

      await withTimeout(device.save(), 10000, 'Device update timeout');

      return NextResponse.json({
        success: true,
        message: 'Device session updated successfully',
        data: device
      });
    }

    // Create new device registration
    device = new Device({
      userId,
      username: user.name,
      mobileNumber: user.phone || 'Not provided',
      deviceModel,
      deviceId,
      ipAddress,
      installationSource,
      appVersion,
      osVersion,
      platform: platform.toLowerCase(),
      deviceInfo,
      location,
      firstInstallDate: new Date(),
      lastActiveDate: new Date(),
      isActive: true,
      totalSessions: 1
    });

    await withTimeout(device.save(), 15000, 'Save device timeout');

    // Populate the saved device for response
    const savedDevice = await withTimeout(
      Device.findById(device._id).populate('userId', 'name email role'),
      10000,
      'Populate device timeout'
    );

    return NextResponse.json({
      success: true,
      message: 'Device registered successfully',
      data: savedDevice
    });

  } catch (error: any) {
    console.error('Register device error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register device', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update device status (mark as uninstalled)
async function updateDevice(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const action = searchParams.get('action');

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const device = await withTimeout(
      Device.findOne({ deviceId }),
      10000,
      'Device lookup timeout'
    );

    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    if (action === 'uninstall') {
      device.isActive = false;
      device.uninstallDate = new Date();
    } else if (action === 'reactivate') {
      device.isActive = true;
      device.uninstallDate = undefined;
      device.lastActiveDate = new Date();
    }

    await withTimeout(device.save(), 10000, 'Update device timeout');

    return NextResponse.json({
      success: true,
      message: `Device ${action}ed successfully`,
      data: device
    });

  } catch (error: any) {
    console.error('Update device error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update device', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDevices, true);
export const POST = registerDevice; // No auth required for device registration
export const PUT = withAuth(updateDevice, true);