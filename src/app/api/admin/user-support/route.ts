import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserSupport from '@/models/UserSupport';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

// Define the UserSupport interface
interface UserSupportInterface {
  _id?: string;
  title: string;
  description: string;
  type: 'bug' | 'feature_request' | 'general_inquiry' | 'technical_support' | 'account_issue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  tags: string[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  adminNotes: string;
  replies: Array<{
    message: string;
    adminId: string;
    adminName: string;
    adminEmail: string;
    createdAt: Date;
  }>;
  userRating?: number;
}

// Verify JWT token and admin role
async function verifyAdminToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    if (token.length < 10) {
      return null;
    }
    
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.isAdmin) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// GET - Fetch support tickets with filtering and stats
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);

    // Get filter parameters
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build filter object
    const filter: any = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch support tickets with user information
    const tickets = await UserSupport.find(filter)
      .populate('userId', 'name email phone')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalTickets = await UserSupport.countDocuments(filter);

    // Calculate statistics
    const stats = await UserSupport.aggregate([
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          openTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
          },
          inProgressTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          avgRating: { $avg: '$userRating' },
          resolutionTimes: {
            $push: {
              $cond: [
                { $and: ['$resolvedAt', '$createdAt'] },
                {
                  $divide: [
                    { $subtract: ['$resolvedAt', '$createdAt'] },
                    1000 * 60 * 60 // Convert to hours
                  ]
                },
                null
              ]
            }
          }
        }
      }
    ]);

    const statsData = stats[0] || {
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
      avgRating: 0,
      resolutionTimes: []
    };

    // Calculate average resolution time
    const validResolutionTimes = statsData.resolutionTimes.filter((time: number) => time !== null);
    const averageResolutionTime = validResolutionTimes.length > 0 
      ? Math.round(validResolutionTimes.reduce((sum: number, time: number) => sum + time, 0) / validResolutionTimes.length)
      : 0;

    const responseData = {
      success: true,
      tickets,
      stats: {
        totalTickets: statsData.totalTickets,
        openTickets: statsData.openTickets,
        inProgressTickets: statsData.inProgressTickets,
        resolvedTickets: statsData.resolvedTickets,
        averageResolutionTime,
        userSatisfactionRating: Math.round((statsData.avgRating || 0) * 10) / 10
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTickets / limit),
        totalTickets,
        limit
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error in GET /api/admin/user-support:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create new support ticket (for users)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    // Validate required fields
    const { title, description, type, priority, userId } = body;

    if (!title || !description || !type || !priority || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, type, priority, userId' },
        { status: 400 }
      );
    }

    // Validate enum values
    const validTypes = ['bug', 'feature_request', 'general_inquiry', 'technical_support', 'account_issue'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: ' + validTypes.join(', ') },
        { status: 400 }
      );
    }

    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be one of: ' + validPriorities.join(', ') },
        { status: 400 }
      );
    }

    // Create new support ticket
    const newTicket = new UserSupport({
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      status: 'open',
      userId: userId,
      tags: body.tags || [],
      attachments: body.attachments || [],
      adminNotes: ''
    });

    const savedTicket = await newTicket.save();

    if (savedTicket) {
      return NextResponse.json({
        success: true,
        message: 'Support ticket created successfully',
        ticketId: savedTicket._id
      }, { status: 201 });
    } else {
      throw new Error('Failed to create support ticket');
    }

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update support ticket status/assignment (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    
    const { ticketId, status, assignedTo, adminNotes, userRating, resolvedAt, closedAt, replyMessage } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    // Get admin user info for replies
    const adminUserInfo = await User.findById(adminUser.userId).select('name email');
    if (!adminUserInfo) {
      return NextResponse.json(
        { error: 'Admin user information not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {};

    // Handle reply message (add to replies array)
    if (replyMessage && replyMessage.trim()) {
      const newReply = {
        message: replyMessage.trim(),
        adminId: adminUser.userId,
        adminName: adminUserInfo.name,
        adminEmail: adminUserInfo.email,
        createdAt: new Date()
      };

      updateData.$push = { replies: newReply };
    }

    if (status) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
          { status: 400 }
        );
      }
      updateData.status = status;
      
      // Set resolved date if status is resolved
      if (status === 'resolved') {
        updateData.resolvedAt = resolvedAt ? new Date(resolvedAt) : new Date();
      }
      
      // Set closed date if status is closed
      if (status === 'closed') {
        updateData.closedAt = closedAt ? new Date(closedAt) : new Date();
      }
    }

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }
    
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    
    if (userRating !== undefined) {
      updateData.userRating = userRating;
    }
    
    if (resolvedAt) {
      updateData.resolvedAt = new Date(resolvedAt);
    }
    
    if (closedAt) {
      updateData.closedAt = new Date(closedAt);
    }

    const updatedTicket = await UserSupport.findByIdAndUpdate(
      ticketId,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    ).populate('userId', 'name email phone');

    if (updatedTicket) {
      return NextResponse.json({
        success: true,
        message: replyMessage ? 'Reply added successfully!' : 'Support ticket updated successfully',
        ticket: updatedTicket
      });
    } else {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Delete support ticket (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    const deletedTicket = await UserSupport.findByIdAndDelete(ticketId);

    if (deletedTicket) {
      return NextResponse.json({
        success: true,
        message: 'Support ticket deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}