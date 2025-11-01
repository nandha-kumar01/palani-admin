import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    let query: any = {};
    
    // Filter out deleted users by default
    query.isDeleted = { $ne: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Get users with their passwords (for security management)
    // Note: This is for admin security purposes only
    const users = await withTimeout(
      User.find(query)
        .maxTimeMS(10000)
        .select('name email phone password plainPassword isActive isDeleted createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      15000,
      'Database operation timeout'
    );
    
    const total = await withTimeout(
      User.countDocuments(query).maxTimeMS(10000).exec(),
      15000,
      'Database operation timeout'
    ) as number;
    
    // Get basic stats
    const totalCount = await withTimeout(
      User.countDocuments({ isDeleted: { $ne: true } }).maxTimeMS(10000).exec(),
      15000,
      'Database operation timeout'
    ) as number;
    
    const activeCount = await withTimeout(
      User.countDocuments({ isActive: true, isDeleted: { $ne: true } }).maxTimeMS(10000).exec(),
      15000,
      'Database operation timeout'
    ) as number;
    
    const inactiveCount = await withTimeout(
      User.countDocuments({ isActive: false, isDeleted: { $ne: true } }).maxTimeMS(10000).exec(),
      15000,
      'Database operation timeout'
    ) as number;
    
    const deletedCount = await withTimeout(
      User.countDocuments({ isDeleted: true }).maxTimeMS(10000).exec(),
      15000,
      'Database operation timeout'
    ) as number;
    
    const stats = {
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount,
      deleted: deletedCount,
    };
    
    return NextResponse.json({
      users: users || [],
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error: any) {
    console.error('Get security data error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
