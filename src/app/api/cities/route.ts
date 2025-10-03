import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get('stateId');
    const countryId = searchParams.get('countryId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isActive = searchParams.get('isActive');

    // Debug logging
    console.log('Cities API called with params:', {
      stateId,
      countryId,
      page,
      limit,
      search,
      isActive,
      url: request.url
    });

    if (!stateId && !countryId) {
      return NextResponse.json({
        success: false,
        error: 'Either stateId or countryId is required'
      }, { status: 400 });
    }

    const db = await connectDB();
    const collection = db.collection('cities');

    // Build query
    const query: any = {};
    if (stateId) {
      // Convert stateId to ObjectId for proper MongoDB comparison
      try {
        query.stateId = new ObjectId(stateId);
      } catch (e) {
        // If stateId is not a valid ObjectId format, use as string
        query.stateId = stateId;
      }
    }
    if (countryId) {
      // Convert countryId to ObjectId for proper MongoDB comparison
      try {
        query.countryId = new ObjectId(countryId);
      } catch (e) {
        // If countryId is not a valid ObjectId format, use as string
        query.countryId = countryId;
      }
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

    console.log('MongoDB query built:', JSON.stringify(query, null, 2));

    // Get total count
    const total = await collection.countDocuments(query);
    console.log('Total cities found:', total);
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Get cities with pagination
    const cities = await collection
      .find(query)
      .sort({ serialNo: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      data: cities,
      pagination: {
        page,
        limit,
        total,
        pages
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
    const body = await request.json();
    const { name, stateId, isActive = true } = body;

    if (!name || !stateId) {
      return NextResponse.json({
        success: false,
        error: 'Name and stateId are required'
      }, { status: 400 });
    }

    const db = await connectDB();
    const citiesCollection = db.collection('cities');
    const statesCollection = db.collection('states');

    // Get state info
    const state = await statesCollection.findOne({ _id: new ObjectId(stateId) });
    if (!state) {
      return NextResponse.json({
        success: false,
        error: 'State not found'
      }, { status: 404 });
    }

    // Get next serial number
    const lastCity = await citiesCollection
      .findOne({}, { sort: { serialNo: -1 } });
    const serialNo = (lastCity?.serialNo || 0) + 1;

    // Generate new ID
    const lastIdCity = await citiesCollection
      .findOne({}, { sort: { _id: -1 } });
    const newId = lastIdCity ? (parseInt(lastIdCity._id.toString()) + 1).toString() : '1';

    const cityDoc = {
      _id: newId,
      name: name.trim(),
      stateId: new ObjectId(stateId),
      stateName: state.name,
      stateCode: state.iso2,
      countryId: new ObjectId(state.countryId?.toString() || state.countryId),
      countryName: state.countryName,
      countryCode: state.countryCode,
      serialNo,
      isActive,
      latitude: null,
      longitude: null,
      timezone: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;

    await citiesCollection.insertOne(cityDoc);

    return NextResponse.json({
      success: true,
      data: cityDoc,
      message: 'City created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating city:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create city'
    }, { status: 500 });
  }
}