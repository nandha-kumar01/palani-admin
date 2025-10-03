import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserSupport from '@/models/UserSupport';
import jwt from 'jsonwebtoken';

// Verify JWT token for regular users
async function verifyUserToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// POST - Create new support ticket (for users)
export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await verifyUserToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to submit a support ticket' },
        { status: 401 }
      );
    }

    await dbConnect();
    const body = await request.json();

    // Validate required fields
    const { title, description, type, priority } = body;

    if (!title || !description || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, type' },
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

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be one of: ' + validPriorities.join(', ') },
        { status: 400 }
      );
    }

    // Create new support ticket using Mongoose
    const newTicket = new UserSupport({
      title: title.trim(),
      description: description.trim(),
      type,
      priority: priority || 'medium',
      status: 'open',
      userId: user.userId,
      tags: body.tags || [],
      attachments: body.attachments || [],
      adminNotes: ''
    });

    const savedTicket = await newTicket.save();

    if (savedTicket) {
      return NextResponse.json({
        success: true,
        message: 'Support ticket submitted successfully. Our team will review it soon.',
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

// GET - Fetch user's support tickets
export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await verifyUserToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to view your support tickets' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);

    // Get filter parameters
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filter object for user's tickets only
    const filter: any = {
      userId: user.userId
    };

    if (status) filter.status = status;
    if (type) filter.type = type;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch user's support tickets using Mongoose
    const tickets = await UserSupport.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-adminNotes') // Don't show admin notes to users
      .lean();

    // Get total count for pagination
    const totalTickets = await UserSupport.countDocuments(filter);

    return NextResponse.json({
      success: true,
      tickets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTickets / limit),
        totalTickets,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching user support tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user rating for resolved ticket
export async function PUT(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await verifyUserToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to rate support' },
        { status: 401 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const { ticketId, userRating } = body;

    if (!ticketId || !userRating) {
      return NextResponse.json(
        { error: 'Ticket ID and rating are required' },
        { status: 400 }
      );
    }

    if (userRating < 1 || userRating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Update only if the ticket belongs to the user and is resolved
    const updatedTicket = await UserSupport.findOneAndUpdate(
      { 
        _id: ticketId,
        userId: user.userId,
        status: { $in: ['resolved', 'closed'] }
      },
      { userRating },
      { new: true }
    );

    if (updatedTicket) {
      return NextResponse.json({
        success: true,
        message: 'Thank you for your rating!'
      });
    } else {
      return NextResponse.json(
        { error: 'Ticket not found, not yours, or not resolved yet' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error updating ticket rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}