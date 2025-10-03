import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Annadhanam from '@/models/Annadhanam';
import { withAuth } from '@/lib/middleware';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


async function getAnnadhanam(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const annadhanam = await withTimeout(Annadhanam.findById(id).maxTimeMS(10000), 15000, 'Database operation timeout');
    
    if (!annadhanam) {
      return NextResponse.json({ success: false, error: 'Annadhanam not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, annadhanam });
  } catch (error: any) {
    console.error('Get annadhanam error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateAnnadhanam(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const annadhanamData = await request.json();
    
    const updatedAnnadhanam = await withTimeout(await Annadhanam.findByIdAndUpdate(
      id,
      annadhanamData,
      { new: true, runValidators: true }
    ), 15000, 'Database operation timeout');
    
    if (!updatedAnnadhanam) {
      return NextResponse.json({ success: false, error: 'Annadhanam not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Annadhanam updated successfully',
      annadhanam: updatedAnnadhanam, });
  } catch (error: any) {
    console.error('Update annadhanam error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

async function deleteAnnadhanam(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const deletedAnnadhanam = await withTimeout(Annadhanam.findByIdAndDelete(id), 15000, 'Database operation timeout');
    
    if (!deletedAnnadhanam) {
      return NextResponse.json({ success: false, error: 'Annadhanam not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Annadhanam deleted successfully', });
  } catch (error: any) {
    console.error('Delete annadhanam error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAnnadhanam, true);
export const PUT = withAuth(updateAnnadhanam, true);
export const DELETE = withAuth(deleteAnnadhanam, true);
