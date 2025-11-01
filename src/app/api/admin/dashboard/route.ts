import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Temple from '@/models/Temple';
import Annadhanam from '@/models/Annadhanam';
import Madangal from '@/models/Madangal';
import Song from '@/models/Song';
import Gallery from '@/models/Gallery';
import { withAuth } from '@/lib/middleware';

// GET - Fetch dashboard statistics (admin only)
async function getDashboardStats(request: NextRequest) {
  try {
    await dbConnect();

    // Fetch all stats in parallel for better performance
    const [
      totalUsers,
      activeUsers,
      totalTemples,
      totalAnnadhanam,
      totalMadangal,
      totalSongs,
      totalPhotos,
      usersOnPathayathirai,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ isActive: true, isDeleted: { $ne: true } }),
      Temple.countDocuments({ isActive: true }),
      Annadhanam.countDocuments({ isActive: true }),
      Madangal.countDocuments({ isActive: true }),
      Song.countDocuments(),
      Gallery.countDocuments({ isActive: true }),
      User.countDocuments({ 
        pathayathiraiStatus: 'in_progress', 
        isDeleted: { $ne: true } 
      }),
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      totalTemples,
      totalAnnadhanam,
      totalMadangal,
      totalSongs,
      totalPhotos,
      usersOnPathayathirai,
    };

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {

    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDashboardStats, true); // Admin only
