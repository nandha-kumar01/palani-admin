import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import State from '@/models/State';
import Country from '@/models/Country';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    let query: any = { isActive: true };
    
    // Filter by country if countryId is provided
    if (countryId) {
      query.countryId = countryId;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { countryName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [states, total] = await Promise.all([
      State.find(query).maxTimeMS(10000)
        .sort({ serialNo: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      State.countDocuments(query).maxTimeMS(10000)
    ]);
    
    return NextResponse.json({
      success: true,
      data: states,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, code, countryId } = body;
    
    if (!name || !code || !countryId) {
      return NextResponse.json(
        { success: false, error: 'Name, code, and countryId are required' },
        { status: 400 }
      );
    }
    
    // Get country details
    const country = await withTimeout(Country.findById(countryId).maxTimeMS(10000), 15000, 'Database operation timeout');
    if (!country) {
      return NextResponse.json(
        { success: false, error: 'Country not found' },
        { status: 404 }
      );
    }
    
    // Get the next serial number
    const lastState = await withTimeout(State.findOne().maxTimeMS(10000).sort({ serialNo: -1 }), 15000, 'Database operation timeout');
    const serialNo = lastState ? lastState.serialNo + 1 : 1;
    
    const state = new State({
      serialNo,
      name,
      code: code.toUpperCase(),
      countryId,
      countryName: country.name,
      isActive: true
    });
    
    await withTimeout(state.save(), 15000, 'Database operation timeout');
    
    return NextResponse.json({
      success: true,
      data: state,
      message: 'State created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating state:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'State with this serial number already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create state' },
      { status: 500 }
    );
  }
}
