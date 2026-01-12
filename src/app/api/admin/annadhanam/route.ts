import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Annadhanam from '@/models/Annadhanam';
import { withAuth } from '@/lib/middleware';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


async function getAnnadhanamList(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '3000');
    const search = searchParams.get('search') || '';
    const foodType = searchParams.get('foodType') || '';
    
    const skip = (page - 1) * limit;
    
    let query: any = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { 'location.address': { $regex: search, $options: 'i' } },
          { 'organizer.name': { $regex: search, $options: 'i' } },
        ],
      };
    }
    
    if (foodType && foodType !== 'all') {
      query.foodType = foodType;
    }
    
    const annadhanamList = await withTimeout(
      Annadhanam.find(query)
        .maxTimeMS(10000)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      15000,
      'Database operation timeout'
    );

    const total = await withTimeout(
      Annadhanam.countDocuments(query)
        .maxTimeMS(10000)
        .exec(),
      15000,
      'Database operation timeout'
    ) as number;
    
    return NextResponse.json({
      annadhanamList,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error: any) {
    console.error('Get annadhanam error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createAnnadhanam(request: NextRequest) {
  try {
    await dbConnect();
    
    const annadhanamData = await request.json();
    
    const newAnnadhanam = new Annadhanam(annadhanamData);
    await withTimeout(newAnnadhanam.save(), 15000, 'Database operation timeout');
    
    return NextResponse.json({
      message: 'Annadhanam created successfully',
      annadhanam: newAnnadhanam,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create annadhanam error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAnnadhanamList, true);
export const POST = withAuth(createAnnadhanam, true);
