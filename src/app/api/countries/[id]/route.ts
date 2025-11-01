import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Country from '@/models/Country';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const country = await withTimeout(Country.findById(params.id).maxTimeMS(10000), 15000, 'Database operation timeout');
    
    if (!country) {
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
      id: country._id.toString(),
      serialNo: country.serialNo,
      name: country.name,
      code: country.code,
      dialingCode: country.dialingCode,
      isActive: country.isActive,
      createdAt: country.createdAt.toISOString(),
      updatedAt: country.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: responseCountry,
      message: 'Country fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching country:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch country',
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, code, dialingCode, isActive } = body;

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

    // Check if another country with the same code exists
    const existingCountry = await withTimeout(await Country.findOne({
      code: code.toUpperCase().maxTimeMS(10000).trim(),
      _id: { $ne: params.id }
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
    const updatedCountry = await withTimeout(await Country.findByIdAndUpdate(
      params.id,
      {
        name: name.trim(),
        code: code.toUpperCase().trim(),
        dialingCode: dialingCode.trim(),
        isActive: isActive !== undefined ? isActive : true,
      },
      { new: true, runValidators: true }
    ), 15000, 'Database operation timeout');
    
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
    console.error('Error updating country:', error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const deletedCountry = await withTimeout(Country.findByIdAndDelete(params.id), 15000, 'Database operation timeout');
    
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
    console.error('Error deleting country:', error);
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
