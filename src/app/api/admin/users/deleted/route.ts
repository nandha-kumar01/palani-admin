import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth } from '@/lib/middleware';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


async function getDeletedUsers(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    let query: { isDeleted: boolean; [key: string]: any } = {
      isDeleted: true // Only get deleted users
    };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    
    const deletedUsers = await withTimeout(
      User.find(query)
        .maxTimeMS(10000)
        .select('-password')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      15000,
      'Database operation timeout'
    ) as any[];

    // Transform users for easier frontend handling
    const transformedUsers = deletedUsers.map((user: any) => {
      const userObj = user.toObject();
      return {
        ...userObj,
        deletedDate: userObj.deletedAt ? new Date(userObj.deletedAt).toLocaleDateString() : null,
        deletedTime: userObj.deletedAt ? new Date(userObj.deletedAt).toLocaleTimeString() : null,
      };
    });

    const total = await withTimeout(
      User.countDocuments(query)
        .maxTimeMS(10000)
        .exec(),
      15000,
      'Database operation timeout'
    ) as number;
    
    // Get deleted users stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const deletedToday = await withTimeout(
      User.countDocuments({
        isDeleted: true,
        deletedAt: { $gte: today }
      })
        .maxTimeMS(10000)
        .exec(),
      15000,
      'Database operation timeout'
    ) as number;

    const deletedThisWeek = await withTimeout(
      User.countDocuments({
        isDeleted: true,
        deletedAt: { $gte: weekAgo }
      })
        .maxTimeMS(10000)
        .exec(),
      15000,
      'Database operation timeout'
    ) as number;

    const deletedThisMonth = await withTimeout(
      User.countDocuments({
        isDeleted: true,
        deletedAt: { $gte: monthStart }
      })
        .maxTimeMS(10000)
        .exec(),
      15000,
      'Database operation timeout'
    ) as number;

    const stats = {
      totalDeleted: total,
      deletedToday,
      deletedThisWeek,
      deletedThisMonth,
    };
    
    return NextResponse.json({
      deletedUsers: transformedUsers,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error: any) {
    console.error('Get deleted users error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add restore function
async function restoreUser(request: NextRequest) {
  try {
    await dbConnect();
    
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    type UserDoc = { isDeleted?: boolean };
    const user = await withTimeout(
      User.findById(userId).maxTimeMS(10000).exec(),
      15000,
      'Database operation timeout'
    ) as UserDoc;

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isDeleted) {
      return NextResponse.json({ success: false, error: 'User is not deleted' },
        { status: 400 }
      );
    }
    
    // Restore user
    const restoredUser = await withTimeout(await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: false,
        deletedAt: null,
        isActive: true,
      },
      { new: true }
    ).select('-password'), 15000, 'Database operation timeout');
    
    return NextResponse.json({ success: true, message: 'User restored successfully',
      user: restoredUser, });
  } catch (error: any) {
    console.error('Restore user error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add permanent delete function for deleted users
async function permanentlyDeleteUser(request: NextRequest) {
  try {
    await dbConnect();
    
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const user = await withTimeout(
      User.findOne({ _id: userId, isDeleted: true }).maxTimeMS(10000).exec(),
      15000,
      'Database operation timeout'
    ) as any;

    if (!user) {
      return NextResponse.json({ success: false, error: 'Deleted user not found' },
        { status: 404 }
      );
    }
    
    // Permanently remove from database
    await withTimeout(await User.findByIdAndDelete(userId), 15000, 'Database operation timeout');
    
    return NextResponse.json({ 
      success: true, 
      message: 'User permanently deleted from database successfully'
    });
  } catch (error: any) {
    console.error('Permanent delete user error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDeletedUsers, true);
export const POST = withAuth(restoreUser, true); // POST for restore functionality
export const DELETE = withAuth(permanentlyDeleteUser, true); // DELETE for permanent deletion
