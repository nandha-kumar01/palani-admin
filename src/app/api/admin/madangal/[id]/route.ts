import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { ensureModelsRegistered } from '@/lib/ensureModels';
import { Madangal, User } from '@/models';
import { withAuth } from '@/lib/middleware';
import { withTimeout, withRetry } from '@/lib/apiTimeout';

// GET single madangal by ID
async function getMadangal(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure all models are registered
    await ensureModelsRegistered();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid madangal ID format'
      }, { status: 400 });
    }

    await withRetry(async () => {
      await dbConnect();
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database connection failed');
      }
    }, 3, 1000);
    
    const madangal = await withTimeout(
      Madangal.findById(id)
        .maxTimeMS(15000)
        .lean(true)
        .exec(),
      20000,
      'Database query timeout'
    );

    if (!madangal) {
      return NextResponse.json({ 
        success: false, 
        error: 'Madangal not found'
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      madangal,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('Get Madangal Error:', error.message);

    if (error.message.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Database operation timed out'
      }, { status: 504 });
    }

    if (error.message.includes('connection')) {
      return NextResponse.json({
        success: false,
        error: 'Database connection error'
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to get madangal'
    }, { status: 500 });
  }
}

// PUT - Update madangal by ID
async function updateMadangal(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure all models are registered
    await ensureModelsRegistered();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid madangal ID format' 
      }, { status: 400 });
    }

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

    await withRetry(async () => {
      await dbConnect();
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database connection failed');
      }
    }, 3, 1000);

    const updateData = {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(location && {
        location: {
          address: location.address?.trim() || '',
          latitude: Number(location.latitude) || 0,
          longitude: Number(location.longitude) || 0
        }
      }),
      ...(capacity && { capacity: Number(capacity) }),
      ...(facilities && { facilities: Array.isArray(facilities) ? facilities : [] }),
      ...(cost !== undefined && { cost: Number(cost) }),
      ...(costType && { costType }),
      ...(contact && { contact }),
      ...(images && { images: Array.isArray(images) ? images : [] }),
      ...(rules && { rules: Array.isArray(rules) ? rules : [] }),
      ...(checkInTime !== undefined && { checkInTime }),
      ...(checkOutTime !== undefined && { checkOutTime }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      ...(currentlyAvailable !== undefined && { currentlyAvailable: Boolean(currentlyAvailable) }),
      updatedAt: new Date(),
    };

    const updatedMadangal = await withTimeout(
      Madangal.findByIdAndUpdate(id, updateData, { 
        new: true, 
        runValidators: true,
        maxTimeMS: 15000
      }).exec(),
      20000,
      'Database update timeout'
    );

    if (!updatedMadangal) {
      return NextResponse.json({ 
        success: false, 
        error: 'Madangal not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Madangal updated successfully',
      madangal: updatedMadangal
    });

  } catch (error: any) {
    console.error('Update Madangal Error:', error.message);

    if (error.message.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Update operation timed out'
      }, { status: 504 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update madangal'
    }, { status: 500 });
  }
}

// DELETE madangal by ID
async function deleteMadangal(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure all models are registered
    await ensureModelsRegistered();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid madangal ID format' 
      }, { status: 400 });
    }

    await withRetry(async () => {
      await dbConnect();
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database connection failed');
      }
    }, 3, 1000);

    const deletedMadangal = await withTimeout(
      Madangal.findByIdAndDelete(id).exec(),
      15000,
      'Database delete timeout'
    );

    if (!deletedMadangal) {
      return NextResponse.json({ 
        success: false, 
        error: 'Madangal not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Madangal deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete Madangal Error:', error.message);

    if (error.message.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Delete operation timed out'
      }, { status: 504 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to delete madangal'
    }, { status: 500 });
  }
}

export const GET = withAuth(getMadangal, true);
export const PUT = withAuth(updateMadangal, true);
export const DELETE = withAuth(deleteMadangal, true);
