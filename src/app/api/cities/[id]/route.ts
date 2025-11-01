import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import City from '@/models/City';
import { withTimeout } from '@/lib/apiTimeout';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    
    const { id } = await params;

    const city = await withTimeout(
      City.findById(id).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );

    if (!city) {
      return NextResponse.json({
        success: false,
        error: 'City not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: city
    });

  } catch (error) {
    console.error('Error fetching city:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch city'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    const { name, isActive } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Name is required'
      }, { status: 400 });
    }

    const updateDoc = {
      name: name.trim(),
      isActive: isActive !== undefined ? isActive : true
    };

    const city = await withTimeout(
      City.findByIdAndUpdate(id, updateDoc, { new: true }).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );

    if (!city) {
      return NextResponse.json({
        success: false,
        error: 'City not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: city,
      message: 'City updated successfully'
    });

  } catch (error) {
    console.error('Error updating city:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update city'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    
    const { id } = await params;

    const city = await withTimeout(
      City.findByIdAndDelete(id).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );

    if (!city) {
      return NextResponse.json({
        success: false,
        error: 'City not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'City deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting city:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete city'
    }, { status: 500 });
  }
}