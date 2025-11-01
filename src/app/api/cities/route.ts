import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import City from '@/models/City';
import State from '@/models/State';
import { withTimeout } from '@/lib/apiTimeout';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get('stateId');
    const countryId = searchParams.get('countryId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isActive = searchParams.get('isActive');

    if (!stateId && !countryId) {
      return NextResponse.json({
        success: false,
        error: 'Either stateId or countryId is required'
      }, { status: 400 });
    }

    // Build query
    let query: any = {};
    
    if (stateId) {
      query.stateId = stateId;
    }
    if (countryId) {
      query.countryId = countryId;
    }
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true; // Default to active only
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { stateName: { $regex: search, $options: 'i' } },
        { countryName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [cities, total] = await Promise.all([
      City.find(query).maxTimeMS(10000)
        .sort({ serialNo: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      City.countDocuments(query).maxTimeMS(10000)
    ]);

    return NextResponse.json({
      success: true,
      data: cities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cities'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, stateId, isActive = true } = body;


    if (!name || !stateId) {
      return NextResponse.json({
        success: false,
        error: 'Name and stateId are required'
      }, { status: 400 });
    }

    // Get state info using Mongoose
    const state = await withTimeout(
      State.findById(stateId).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );

    if (!state) {
      console.error('State not found with ID:', stateId);
      return NextResponse.json({
        success: false,
        error: 'State not found'
      }, { status: 404 });
    }


    // Check if city already exists in the state
    const existingCity = await withTimeout(
      City.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        stateId: stateId
      }).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );

    if (existingCity) {
      return NextResponse.json({
        success: false,
        error: 'City already exists in this state'
      }, { status: 409 });
    }

    // Get next serial number
    const lastCity = await withTimeout(
      City.findOne().maxTimeMS(10000).sort({ serialNo: -1 }),
      15000,
      'Database operation timeout'
    );
    const serialNo = lastCity ? lastCity.serialNo + 1 : 1;

    // Create new city using Mongoose model
    const city = new City({
      serialNo,
      name: name.trim(),
      stateId: state._id,
      stateName: state.name,
      stateCode: state.code || '',
      countryId: state.countryId,
      countryName: state.countryName || '',
      countryCode: state.countryCode || '',
      isActive,
      latitude: null,
      longitude: null,
      timezone: null
    });


    await withTimeout(city.save(), 15000, 'Database operation timeout');


    return NextResponse.json({
      success: true,
      data: city,
      message: 'City created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating city:', error);
    
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      return NextResponse.json({
        success: false,
        error: 'City with this name already exists in this state'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      error: `Failed to create city: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}