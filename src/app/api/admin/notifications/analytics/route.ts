import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { withAuth } from '@/lib/middleware';
import { withTimeout } from '@/lib/apiTimeout';

// GET - Get notifications analytics
async function getNotificationAnalytics(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, 1y
    const type = searchParams.get('type') || '';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case '90d':
        startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        break;
      case '1y':
        startDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        break;
      default: // 30d
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    }

    const baseQuery: any = {
      isDeleted: false,
      createdAt: { $gte: startDate }
    };

    if (type) baseQuery.type = type;

    // Main analytics aggregation
    const [analytics, dailyStats, typeDistribution, priorityDistribution] = await Promise.all([
      // Overall analytics
      withTimeout(
        Notification.aggregate([
          { $match: baseQuery },
          {
            $group: {
              _id: null,
              totalNotifications: { $sum: 1 },
              totalSent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
              totalDrafts: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
              totalDelivered: { $sum: '$analytics.deliveredCount' },
              totalRead: { $sum: '$analytics.readCount' },
              totalClicks: { $sum: '$analytics.clickCount' },
              averageOpenRate: { $avg: '$analytics.openRate' },
              averageClickRate: { $avg: '$analytics.clickRate' },
              urgentNotifications: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
              highPriorityNotifications: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
            }
          }
        ]),
        15000,
        'Analytics query timeout'
      ),

      // Daily statistics
      withTimeout(
        Notification.aggregate([
          { $match: baseQuery },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
              count: { $sum: 1 },
              sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
              delivered: { $sum: '$analytics.deliveredCount' },
              read: { $sum: '$analytics.readCount' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]),
        15000,
        'Daily stats query timeout'
      ),

      // Type distribution
      withTimeout(
        Notification.aggregate([
          { $match: baseQuery },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
              averageOpenRate: { $avg: '$analytics.openRate' }
            }
          },
          { $sort: { count: -1 } }
        ]),
        10000,
        'Type distribution query timeout'
      ),

      // Priority distribution
      withTimeout(
        Notification.aggregate([
          { $match: baseQuery },
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 },
              sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
              averageOpenRate: { $avg: '$analytics.openRate' }
            }
          },
          { $sort: { count: -1 } }
        ]),
        10000,
        'Priority distribution query timeout'
      )
    ]);

    const mainAnalytics = analytics[0] || {
      totalNotifications: 0,
      totalSent: 0,
      totalDrafts: 0,
      totalDelivered: 0,
      totalRead: 0,
      totalClicks: 0,
      averageOpenRate: 0,
      averageClickRate: 0,
      urgentNotifications: 0,
      highPriorityNotifications: 0
    };

    // Calculate additional metrics
    const deliveryRate = mainAnalytics.totalSent > 0 
      ? ((mainAnalytics.totalDelivered / mainAnalytics.totalSent) * 100).toFixed(2)
      : '0';

    const readRate = mainAnalytics.totalDelivered > 0 
      ? ((mainAnalytics.totalRead / mainAnalytics.totalDelivered) * 100).toFixed(2)
      : '0';

    const clickThroughRate = mainAnalytics.totalRead > 0 
      ? ((mainAnalytics.totalClicks / mainAnalytics.totalRead) * 100).toFixed(2)
      : '0';

    // Top performers (most read notifications)
    const topPerformers = await withTimeout(
      Notification.find(baseQuery)
        .sort({ 'analytics.openRate': -1 })
        .limit(5)
        .select('title type analytics.openRate analytics.readCount createdAt')
        .populate('senderId', 'name'),
      10000,
      'Top performers query timeout'
    );

    // Recent activity
    const recentActivity = await withTimeout(
      Notification.find(baseQuery)
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title type status createdAt sentAt analytics.readCount')
        .populate('senderId', 'name'),
      10000,
      'Recent activity query timeout'
    );

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          ...mainAnalytics,
          deliveryRate: parseFloat(deliveryRate),
          readRate: parseFloat(readRate),
          clickThroughRate: parseFloat(clickThroughRate)
        },
        trends: {
          dailyStats,
          typeDistribution,
          priorityDistribution
        },
        topPerformers,
        recentActivity,
        timeframe
      }
    });

  } catch (error: any) {
    console.error('Get notification analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getNotificationAnalytics, true);