import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Madangal from '@/models/Madangal';
import User from '@/models/User';
import { withAuth } from '@/lib/middleware';
import { withTimeout, withRetry } from '@/lib/apiTimeout';

// GET all madangals
async function getMadangals(request: NextRequest) {
  try {
    // Validate environment
    if (!process.env.MONGODB_URI) {
      throw new Error('MongoDB URI not configured');
    }

    // Establish database connection with retry
    await withRetry(async () => {
      await dbConnect();
      if (mongoose.connection.readyState !== 1) {
        throw new Error(`Database not ready`);
      }
      if (!mongoose.connection.db) {
        throw new Error('Database instance not available');
      }
    }, 3, 1000);

    // Execute query with timeout
    const madangals = await withTimeout(
      Madangal.find({})
        .maxTimeMS(20000)
        .populate({
          path: 'bookings.userId',
          select: 'name email phone',
          options: { maxTimeMS: 5000 }
        })
        .sort({ createdAt: -1 })
        .lean(true)
        .exec(),
      25000,
      'Database query timeout'
    );

    return NextResponse.json({ 
      success: true, 
      madangals: madangals || [],
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

  } catch (error: any) {
    console.error('Madangal API Error:', error.message);

    if (error.message.includes('timeout') || error.name === 'MongoServerSelectionError') {
      return NextResponse.json({
        success: false,
        error: 'Database operation timed out. Please try again.',
        timestamp: new Date().toISOString()
      }, { status: 504 });
    }

    if (error.message.includes('connection') || error.message.includes('URI')) {
      return NextResponse.json({
        success: false,
        error: 'Database connection error. Please try again.',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch madangals',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST - Create new madangal
async function createMadangal(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      location,
      capacity,
      facilities,
      cost,
      costType,
      contact,
      images,
      rules,
      checkInTime,
      checkOutTime,
      isActive,
      currentlyAvailable,
    } = body;

    // Validation
    const validationErrors: string[] = [];
    
    if (!name?.trim()) validationErrors.push('Name is required');
    if (!location?.address?.trim()) validationErrors.push('Address is required');
    if (typeof location?.latitude !== 'number' || isNaN(location.latitude)) {
      validationErrors.push('Valid latitude is required');
    }
    if (typeof location?.longitude !== 'number' || isNaN(location.longitude)) {
      validationErrors.push('Valid longitude is required');
    }
    if (!capacity || capacity < 1) validationErrors.push('Capacity must be at least 1');

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      }, { status: 400 });
    }

    // Database connection
    await withRetry(async () => {
      await dbConnect();
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database connection failed');
      }
    }, 3, 1000);

    // Create madangal document
    const newMadangal = new Madangal({
      name: name.trim(),
      description: description?.trim() || '',
      location: {
        address: location.address.trim(),
        latitude: Number(location.latitude),
        longitude: Number(location.longitude)
      },
      capacity: Number(capacity),
      facilities: Array.isArray(facilities) ? facilities.filter(f => f?.trim()) : [],
      cost: Number(cost) || 0,
      costType: costType || 'free',
      contact: {
        name: contact?.name?.trim() || '',
        phone: contact?.phone?.trim() || '',
        email: contact?.email?.trim() || ''
      },
      images: Array.isArray(images) ? images.filter(img => img?.trim()) : [],
      rules: Array.isArray(rules) ? rules.filter(rule => rule?.trim()) : [],
      checkInTime: checkInTime?.trim() || '',
      checkOutTime: checkOutTime?.trim() || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      currentlyAvailable: currentlyAvailable !== undefined ? Boolean(currentlyAvailable) : true,
      currentOccupancy: 0,
      bookings: [],
    });

    const savedMadangal = await withTimeout(
      newMadangal.save(),
      20000,
      'Database save operation timeout'
    );

    return NextResponse.json({
      success: true,
      message: 'Madangal created successfully',
      madangal: savedMadangal,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create Madangal Error:', error.message);

    if (error.message.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Create operation timed out'
      }, { status: 504 });
    }

    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        error: 'A madangal with this name already exists'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create madangal'
    }, { status: 500 });
  }
}

export const GET = withAuth(getMadangals, true);
export const POST = withAuth(createMadangal, true);
