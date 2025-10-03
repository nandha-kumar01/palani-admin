import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Temple from '@/models/Temple';
import { withAuth } from '@/lib/middleware';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


async function getTemples(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    let query: any = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { 'location.address': { $regex: search, $options: 'i' } },
        ],
      };
    }
    
    const temples = await withTimeout(Temple.find(query).maxTimeMS(10000)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit), 15000, 'Database operation timeout');
    
    const total = await withTimeout(Temple.countDocuments(query).maxTimeMS(10000), 15000, 'Database operation timeout');
    
    return NextResponse.json({
      temples,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error: any) {
    console.error('Get temples error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createTemple(request: NextRequest) {
  try {
    await dbConnect();
    
    const templeData = await request.json();
    
    const newTemple = new Temple(templeData);
    await withTimeout(newTemple.save(), 15000, 'Database operation timeout');
    
    return NextResponse.json({
      message: 'Temple created successfully',
      temple: newTemple,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create temple error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTemples, true);
export const POST = withAuth(createTemple, true);
