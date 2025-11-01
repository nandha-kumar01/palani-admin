import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Temple from '@/models/Temple';
import { withAuth } from '@/lib/middleware';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


async function getTemple(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const temple = await withTimeout(Temple.findById(params.id).maxTimeMS(10000), 15000, 'Database operation timeout');
    
    if (!temple) {
      return NextResponse.json({ success: false, error: 'Temple not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, temple });
  } catch (error: any) {
    console.error('Get temple error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateTemple(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const updates = await request.json();
    
    const temple = await withTimeout(
      Temple.findByIdAndUpdate(
        params.id,
        updates,
        { new: true, runValidators: true }
      ).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );
    
    if (!temple) {
      return NextResponse.json({ success: false, error: 'Temple not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Temple updated successfully',
      temple, });
  } catch (error: any) {
    console.error('Update temple error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deleteTemple(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const temple = await withTimeout(
      Temple.findByIdAndDelete(params.id).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );
    
    if (!temple) {
      return NextResponse.json({ success: false, error: 'Temple not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Temple deleted successfully', });
  } catch (error: any) {
    console.error('Delete temple error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTemple, true);
export const PUT = withAuth(updateTemple, true);
export const DELETE = withAuth(deleteTemple, true);
