import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Madangal from '@/models/Madangal';
import User from '@/models/User'; // Import User model to register schema for populate
import { withAuth } from '@/lib/middleware';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


// GET single madangal by ID
async function getMadangal(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const madangal = await withTimeout(
      Madangal.findById(id)
        .maxTimeMS(10000)
        .populate('bookings.userId', 'name email phone')
        .exec(),
      15000,
      'Database operation timeout'
    );

    if (!madangal) {
      return NextResponse.json({ success: false, error: 'Madangal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      madangal 
    });
  } catch (error) {
    console.error('Error fetching madangal:', error);
    return NextResponse.json(
      { error: 'Failed to get madangal' },
      { status: 500 }
    );
  }
}

// PUT - Update madangal by ID
async function updateMadangal(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    await dbConnect();

    const { id } = await params;
    const updatedMadangal = await withTimeout(
      Madangal.findByIdAndUpdate(
        id,
        {
          name,
          description,
          location,
          capacity: parseInt(capacity) || 1,
          facilities: facilities || [],
          cost: parseInt(cost) || 0,
          costType: costType || 'free',
          contact,
          images: images || [],
          rules: rules || [],
          checkInTime,
          checkOutTime,
          isActive: isActive !== undefined ? isActive : true,
          currentlyAvailable: currentlyAvailable !== undefined ? currentlyAvailable : true,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      ).exec(),
      15000,
      'Database operation timeout'
    );

    if (!updatedMadangal) {
      return NextResponse.json({ success: false, error: 'Madangal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Madangal updated successfully',
      madangal: updatedMadangal,
    });
  } catch (error) {
    console.error('Error updating madangal:', error);
    return NextResponse.json(
      { error: 'Failed to update madangal' },
      { status: 500 }
    );
  }
}

// DELETE madangal by ID
async function deleteMadangal(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    const { id } = await params;
    const deletedMadangal = await withTimeout(
      Madangal.findByIdAndDelete(id).exec(),
      15000,
      'Database operation timeout'
    );

    if (!deletedMadangal) {
      return NextResponse.json({ success: false, error: 'Madangal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Madangal deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting madangal:', error);
    return NextResponse.json(
      { error: 'Failed to delete madangal' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getMadangal, true);
export const PUT = withAuth(updateMadangal, true);
export const DELETE = withAuth(deleteMadangal, true);
