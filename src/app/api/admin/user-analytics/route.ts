import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Group from '@/models/Group';
import { withAuth } from '@/lib/middleware';

async function getUserAnalytics(request: NextRequest) {
  try {
    await dbConnect();

    // Get all users (excluding deleted ones)
    const users = await User.find({ isDeleted: { $ne: true } }).populate('groupId', 'name');
    const groups = await Group.find({ isActive: true });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    // Basic Stats
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive).length;
    const trackingUsers = users.filter(user => user.isTracking).length;
    const usersOnPathayathirai = users.filter(user => user.pathayathiraiStatus === 'in_progress').length;
    const completedPathayathirai = users.filter(user => user.pathayathiraiStatus === 'completed').length;

    // Registration trends
    const newUsersLast7Days = users.filter(user => new Date(user.createdAt) >= sevenDaysAgo).length;
    const newUsersLast30Days = users.filter(user => new Date(user.createdAt) >= thirtyDaysAgo).length;

    // Group distribution
    const usersInGroups = users.filter(user => user.groupId).length;
    const soloTravelers = totalUsers - usersInGroups;

    // Pathayathirai status distribution
    const pathayathiraiStats = {
      notStarted: users.filter(user => user.pathayathiraiStatus === 'not_started').length,
      inProgress: usersOnPathayathirai,
      completed: completedPathayathirai
    };

    // Daily registration data for last 30 days
    const dailyRegistrations = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const count = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate >= dayStart && userDate <= dayEnd;
      }).length;

      dailyRegistrations.push({
        date: dayStart.toISOString().split('T')[0],
        count
      });
    }

    // User activity trends
    const userActivityTrends = {
      totalActive: activeUsers,
      totalTracking: trackingUsers,
      activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
      trackingPercentage: totalUsers > 0 ? Math.round((trackingUsers / totalUsers) * 100) : 0
    };

    // Top groups by member count
    const topGroups = groups
      .map(group => ({
        _id: group._id,
        name: group.name,
        memberCount: users.filter(user => user.groupId?.toString() === group._id.toString()).length,
        activeMemberCount: users.filter(user => 
          user.groupId?.toString() === group._id.toString() && user.isActive
        ).length
      }))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 5);

    // Geographic distribution (mock data - replace with actual location data)
    const geographicDistribution = [
      { state: 'Tamil Nadu', userCount: Math.floor(totalUsers * 0.4) },
      { state: 'Kerala', userCount: Math.floor(totalUsers * 0.2) },
      { state: 'Karnataka', userCount: Math.floor(totalUsers * 0.15) },
      { state: 'Andhra Pradesh', userCount: Math.floor(totalUsers * 0.1) },
      { state: 'Others', userCount: Math.floor(totalUsers * 0.15) }
    ];

    // Age distribution (mock data - add birthdate field to User model for actual data)
    const ageDistribution = [
      { ageGroup: '18-25', count: Math.floor(totalUsers * 0.25) },
      { ageGroup: '26-35', count: Math.floor(totalUsers * 0.35) },
      { ageGroup: '36-45', count: Math.floor(totalUsers * 0.25) },
      { ageGroup: '46-60', count: Math.floor(totalUsers * 0.1) },
      { ageGroup: '60+', count: Math.floor(totalUsers * 0.05) }
    ];

    // Device/Platform analytics (mock data - add device info tracking)
    const deviceStats = {
      mobile: Math.floor(totalUsers * 0.8),
      desktop: Math.floor(totalUsers * 0.15),
      tablet: Math.floor(totalUsers * 0.05)
    };

    // Recent user activities
    const recentActivities = users
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        lastActivity: user.updatedAt,
        status: user.isActive ? 'Active' : 'Inactive',
        pathayathiraiStatus: user.pathayathiraiStatus,
        location: user.currentLocation ? `${user.currentLocation.latitude}, ${user.currentLocation.longitude}` : null
      }));

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          trackingUsers,
          usersOnPathayathirai,
          completedPathayathirai,
          newUsersLast7Days,
          newUsersLast30Days,
          usersInGroups,
          soloTravelers
        },
        pathayathiraiStats,
        userActivityTrends,
        dailyRegistrations,
        topGroups,
        geographicDistribution,
        ageDistribution,
        deviceStats,
        recentActivities
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user analytics' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getUserAnalytics, true);