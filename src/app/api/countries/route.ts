import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Country from '@/models/Country';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';



export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const name = searchParams.get('name') || '';
    const code = searchParams.get('code') || '';
    const dialingCode = searchParams.get('dialingCode') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build search query
    let query: any = {};
    
    // Individual field filters
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (code) {
      query.code = { $regex: code, $options: 'i' };
    }
    if (dialingCode) {
      query.dialingCode = { $regex: dialingCode, $options: 'i' };
    }
    
    // Global search (overrides individual filters if present)
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { dialingCode: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get total count
    const total = await withTimeout(Country.countDocuments(query).maxTimeMS(10000), 15000, 'Database operation timeout');

    // Get paginated results
    const countries = await withTimeout(Country.find(query).maxTimeMS(10000)
      .sort({ serialNo: 1 })
      .skip(offset)
      .limit(limit)
      .lean(), 15000, 'Database operation timeout');

    // Convert MongoDB documents to the expected format
    const formattedCountries = countries.map(country => ({
      id: (country._id as any).toString(),
      serialNo: country.serialNo,
      name: country.name,
      code: country.code,
      dialingCode: country.dialingCode,
      isActive: country.isActive,
      createdAt: (country.createdAt as Date).toISOString(),
      updatedAt: (country.updatedAt as Date).toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        countries: formattedCountries,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      message: 'Countries fetched successfully',
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch countries',
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, code, dialingCode } = body;

    // Validate required fields
    if (!name || !code || !dialingCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Name, code, and dialing code are required',
        },
        { status: 400 }
      );
    }

    // Check if country already exists
    const existingCountry = await withTimeout(Country.findOne({
      code: code.toUpperCase().maxTimeMS(10000).trim()
    }), 15000, 'Database operation timeout');

    if (existingCountry) {
      return NextResponse.json(
        {
          success: false,
          error: 'Country already exists',
          message: 'A country with this code already exists',
        },
        { status: 409 }
      );
    }

    // Get the next serial number
    const lastCountry = await withTimeout(Country.findOne().maxTimeMS(10000).sort({ serialNo: -1 }), 15000, 'Database operation timeout');
    const nextSerialNo = lastCountry ? lastCountry.serialNo + 1 : 1;

    // Create new country
    const newCountry = new Country({
      serialNo: nextSerialNo,
      name: name.trim(),
      code: code.toUpperCase().trim(),
      dialingCode: dialingCode.trim(),
      isActive: true,
    });

    await withTimeout(newCountry.save(), 15000, 'Database operation timeout');

    // Format response
    const responseCountry = {
      id: newCountry._id.toString(),
      serialNo: newCountry.serialNo,
      name: newCountry.name,
      code: newCountry.code,
      dialingCode: newCountry.dialingCode,
      isActive: newCountry.isActive,
      createdAt: newCountry.createdAt.toISOString(),
      updatedAt: newCountry.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: responseCountry,
      message: 'Country created successfully',
    }, { status: 201 });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create country',
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { id, name, code, dialingCode } = body;

    // Validate required fields
    if (!id || !name || !code || !dialingCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'ID, name, code, and dialing code are required',
        },
        { status: 400 }
      );
    }

    // Check if another country with the same code exists
    const existingCountry = await withTimeout(await Country.findOne({
      code: code.toUpperCase().maxTimeMS(10000).trim(),
      _id: { $ne: id }
    }), 15000, 'Database operation timeout');

    if (existingCountry) {
      return NextResponse.json(
        {
          success: false,
          error: 'Country code already exists',
          message: 'Another country with this code already exists',
        },
        { status: 409 }
      );
    }

    // Update country
    const updatedCountry = await withTimeout(
      Country.findByIdAndUpdate(
        id,
        {
          name: name.trim(),
          code: code.toUpperCase().trim(),
          dialingCode: dialingCode.trim(),
        },
        { new: true, runValidators: true }
      ), 15000, 'Database operation timeout') as any;
    
    if (!updatedCountry) {
      return NextResponse.json(
        {
          success: false,
          error: 'Country not found',
          message: 'Country with the specified ID does not exist',
        },
        { status: 404 }
      );
    }

    // Format response
    const responseCountry = {
      id: updatedCountry._id.toString(),
      serialNo: updatedCountry.serialNo,
      name: updatedCountry.name,
      code: updatedCountry.code,
      dialingCode: updatedCountry.dialingCode,
      isActive: updatedCountry.isActive,
      createdAt: updatedCountry.createdAt.toISOString(),
      updatedAt: updatedCountry.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: responseCountry,
      message: 'Country updated successfully',
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update country',
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing country ID',
          message: 'Country ID is required for deletion',
        },
        { status: 400 }
      );
    }

    // Delete country
    const deletedCountry = await withTimeout(Country.findByIdAndDelete(id), 15000, 'Database operation timeout');
    
    if (!deletedCountry) {
      return NextResponse.json(
        {
          success: false,
          error: 'Country not found',
          message: 'Country with the specified ID does not exist',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Country deleted successfully',
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete country',
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
