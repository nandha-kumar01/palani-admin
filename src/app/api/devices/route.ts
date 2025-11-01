import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Device from '@/models/Device';
import User from '@/models/User';
import { withTimeout } from '@/lib/apiTimeout';

// POST - Register device installation from mobile app
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      userId,
      deviceModel,
      deviceId,
      installationSource = 'unknown',
      appVersion,
      osVersion,
      platform,
      deviceInfo = {},
      location = {}
    } = body;

    // Get IP address from request
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';

    // Validate required fields
    if (!userId || !deviceModel || !deviceId || !appVersion || !osVersion || !platform) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required device information',
          required: ['userId', 'deviceModel', 'deviceId', 'appVersion', 'osVersion', 'platform']
        },
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

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User account is inactive' },
        { status: 403 }
      );
    }

    // Check if device already exists
    let device = await withTimeout(
      Device.findOne({ deviceId }),
      10000,
      'Device lookup timeout'
    );

    if (device) {
      // Update existing device - app session
      device.lastActiveDate = new Date();
      device.totalSessions += 1;
      device.isActive = true;
      device.appVersion = appVersion;
      device.osVersion = osVersion;
      device.ipAddress = ipAddress;
      
      // Clear uninstall date if device was marked as uninstalled
      if (device.uninstallDate) {
        device.uninstallDate = undefined;
      }

      // Update device info if provided
      if (Object.keys(deviceInfo).length > 0) {
        device.deviceInfo = { ...device.deviceInfo, ...deviceInfo };
      }

      // Update location if provided
      if (Object.keys(location).length > 0) {
        device.location = { ...device.location, ...location };
      }

      await withTimeout(device.save(), 10000, 'Device update timeout');

      return NextResponse.json({
        success: true,
        message: 'Device session updated successfully',
        data: {
          deviceId: device.deviceId,
          isNewInstallation: false,
          sessionCount: device.totalSessions,
          lastActive: device.lastActiveDate
        }
      });
    }

    // Detect installation source based on platform and other info
    let detectedSource = installationSource;
    if (installationSource === 'unknown') {
      if (platform.toLowerCase() === 'android') {
        detectedSource = 'playstore';
      } else if (platform.toLowerCase() === 'ios') {
        detectedSource = 'appstore';
      }
    }

    // Create new device registration
    device = new Device({
      userId,
      username: user.name,
      mobileNumber: user.phone || 'Not provided',
      deviceModel,
      deviceId,
      ipAddress,
      installationSource: detectedSource,
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

    return NextResponse.json({
      success: true,
      message: 'Device registered successfully',
      data: {
        deviceId: device.deviceId,
        isNewInstallation: true,
        sessionCount: device.totalSessions,
        firstInstall: device.firstInstallDate,
        installationSource: device.installationSource
      }
    });

  } catch (error: any) {
    console.error('Register device error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to register device', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update device status (for app uninstall tracking)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const action = searchParams.get('action'); // 'uninstall' or 'reactivate'

    if (!deviceId || !action) {
      return NextResponse.json(
        { success: false, error: 'Device ID and action are required' },
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
      device.totalSessions += 1;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "uninstall" or "reactivate"' },
        { status: 400 }
      );
    }

    await withTimeout(device.save(), 10000, 'Update device timeout');

    return NextResponse.json({
      success: true,
      message: `Device ${action}ed successfully`,
      data: {
        deviceId: device.deviceId,
        isActive: device.isActive,
        lastActive: device.lastActiveDate,
        uninstallDate: device.uninstallDate
      }
    });

  } catch (error: any) {
    console.error('Update device error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update device', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}