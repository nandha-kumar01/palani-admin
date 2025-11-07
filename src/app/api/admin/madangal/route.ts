import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Madangal from '@/models/Madangal';
import User from '@/models/User'; // Import User model to register schema for populate
import { withAuth } from '@/lib/middleware';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


// GET all madangals
async function getMadangals(request: NextRequest) {
  try {
    await dbConnect();
    
    const madangals = await withTimeout(
      Madangal.find({})
        .maxTimeMS(10000)
        .populate('bookings.userId', 'name email phone')
        .sort({ createdAt: -1 })
        .exec(),
      15000,
      'Database operation timeout'
    );

    return NextResponse.json({ 
      success: true, 
      madangals 
    });
  } catch (error) {
    console.error('Error fetching madangals:', error);
    return NextResponse.json(
      { error: 'Failed to get madangals' },
      { status: 500 }
    );
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
    if (!name || !location?.address || location?.latitude === undefined || location?.longitude === undefined || !capacity) {
      return NextResponse.json({ success: false, error: 'Required fields missing: name, location, capacity' },
        { status: 400 }
      );
    }

    await dbConnect();

    const newMadangal = new Madangal({
      name,
      description,
      location,
      capacity: parseInt(capacity),
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
      currentOccupancy: 0,
      bookings: [],
    });

    const savedMadangal = await withTimeout(
      newMadangal.save(),
      15000,
      'Database operation timeout'
    );

    return NextResponse.json({
      success: true,
      message: 'Madangal created successfully',
      madangal: savedMadangal,
    });
  } catch (error) {
    console.error('Error creating madangal:', error);
    return NextResponse.json(
      { error: 'Failed to create madangal' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getMadangals, true);
export const POST = withAuth(createMadangal, true);
