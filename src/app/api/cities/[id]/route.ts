import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const db = await connectDB();
    const collection = db.collection('cities');

    const city = await collection.findOne({ _id: id });

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
    const { id } = params;
    const body = await request.json();
    const { name, isActive } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Name is required'
      }, { status: 400 });
    }

    const db = await connectDB();
    const collection = db.collection('cities');

    const updateDoc = {
      name: name.trim(),
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date()
    };

    const result = await collection.updateOne(
      { _id: id },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'City not found'
      }, { status: 404 });
    }

    const updatedCity = await collection.findOne({ _id: id });

    return NextResponse.json({
      success: true,
      data: updatedCity,
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
    const { id } = params;

    const db = await connectDB();
    const collection = db.collection('cities');

    const result = await collection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
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