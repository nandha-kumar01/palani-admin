import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import State from '@/models/State';
import { withTimeout } from '@/lib/apiTimeout';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    const { name, code, isActive } = body;
    
    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      );
    }
    
    // Find and update the state
    const updatedState = await withTimeout(
      State.findByIdAndUpdate(
        id,
        {
          name,
          code: code.toUpperCase(),
          isActive: isActive !== undefined ? isActive : true
        },
        { new: true, runValidators: true }
      ).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );
    
    if (!updatedState) {
      return NextResponse.json(
        { success: false, error: 'State not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedState,
      message: 'State updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating state:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 11000) {
      return NextResponse.json(
        { success: false, error: 'State with this code already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update state' },
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
    
    const { id } = await params;
    
    // Find and delete the state
    const deletedState = await withTimeout(
      State.findByIdAndDelete(id).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );
    
    if (!deletedState) {
      return NextResponse.json(
        { success: false, error: 'State not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: deletedState,
      message: 'State deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete state' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Find the state by ID
    const state = await withTimeout(
      State.findById(id).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );
    
    if (!state) {
      return NextResponse.json(
        { success: false, error: 'State not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: state
    });
    
  } catch (error) {
    console.error('Error fetching state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch state' },
      { status: 500 }
    );
  }
}