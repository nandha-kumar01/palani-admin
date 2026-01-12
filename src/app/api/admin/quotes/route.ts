import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Quote from '@/models/Quote';
import User from '@/models/User'; // Import User model to register schema
import { withAuth } from '@/lib/middleware';
import { withTimeout } from '@/lib/apiTimeout';

// GET /api/admin/quotes - Get all quotes for admin with full details
async function getAdminQuotes(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '200');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const language = searchParams.get('language') || '';
    const status = searchParams.get('status') || '';
    const author = searchParams.get('author') || '';
    
    const skip = (page - 1) * limit;
    
    let query: any = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Add filters
    if (category) query.category = category;
    if (language) query.language = language;
    if (author) query.author = { $regex: author, $options: 'i' };
    
    // Add status filters
    if (status === 'active') {
      query.isActive = true;
      query.isDeleted = false;
    } else if (status === 'inactive') {
      query.isActive = false;
      query.isDeleted = false;
    } else if (status === 'deleted') {
      query.isDeleted = true;
    } else if (status === 'featured') {
      query.isFeatured = true;
      query.isActive = true;
      query.isDeleted = false;
    } else {
      // Default: exclude deleted
      query.isDeleted = false;
    }
    
    const quotes = await withTimeout(
      Quote.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('deletedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );
    
    const total = await withTimeout(
      Quote.countDocuments(query).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    ) as number;
    
    // Get statistics
    const stats = {
      total: await withTimeout(Quote.countDocuments({ isDeleted: false }).maxTimeMS(10000), 15000, 'Database operation timeout'),
      active: await withTimeout(Quote.countDocuments({ isActive: true, isDeleted: false }).maxTimeMS(10000), 15000, 'Database operation timeout'),
      inactive: await withTimeout(Quote.countDocuments({ isActive: false, isDeleted: false }).maxTimeMS(10000), 15000, 'Database operation timeout'),
      deleted: await withTimeout(Quote.countDocuments({ isDeleted: true }).maxTimeMS(10000), 15000, 'Database operation timeout'),
      featured: await withTimeout(Quote.countDocuments({ isFeatured: true, isDeleted: false }).maxTimeMS(10000), 15000, 'Database operation timeout'),
      categories: {
        motivational: await withTimeout(Quote.countDocuments({ category: 'motivational', isDeleted: false }).maxTimeMS(10000), 15000, 'Database operation timeout'),
        spiritual: await withTimeout(Quote.countDocuments({ category: 'spiritual', isDeleted: false }).maxTimeMS(10000), 15000, 'Database operation timeout'),
        wisdom: await withTimeout(Quote.countDocuments({ category: 'wisdom', isDeleted: false }).maxTimeMS(10000), 15000, 'Database operation timeout'),
        devotional: await withTimeout(Quote.countDocuments({ category: 'devotional', isDeleted: false }).maxTimeMS(10000), 15000, 'Database operation timeout'),
        inspirational: await withTimeout(Quote.countDocuments({ category: 'inspirational', isDeleted: false }).maxTimeMS(10000), 15000, 'Database operation timeout'),
      },
      languages: {
        tamil: await withTimeout(Quote.countDocuments({ language: 'tamil', isDeleted: false }).maxTimeMS(10000), 15000, 'Database operation timeout'),
        english: await withTimeout(Quote.countDocuments({ language: 'english', isDeleted: false }).maxTimeMS(10000), 15000, 'Database operation timeout'),
        hindi: await withTimeout(Quote.countDocuments({ language: 'hindi', isDeleted: false }).maxTimeMS(10000), 15000, 'Database operation timeout'),
        sanskrit: await withTimeout(Quote.countDocuments({ language: 'sanskrit', isDeleted: false }).maxTimeMS(10000), 15000, 'Database operation timeout'),
      },
    };
    
    return NextResponse.json({
      success: true,
      quotes,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error: any) {
    console.error('Get admin quotes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAdminQuotes, true);

// POST /api/admin/quotes - Create new quote
async function createQuote(request: NextRequest) {
  try {
    await dbConnect();
    
    const {
      text,
      author,
      category = 'motivational',
      language = 'tamil',
      tags = [],
      source,
      isActive = true,
      isFeatured = false,
      priority = 0,
      scheduledAt,
      createdBy,
      metadata = {},
    } = await request.json();

    // Validate required fields
    if (!text || !author) {
      return NextResponse.json(
        { success: false, error: 'Text and author are required' },
        { status: 400 }
      );
    }

    // Validate text length
    if (text.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Quote text cannot exceed 1000 characters' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['motivational', 'spiritual', 'wisdom', 'love', 'success', 'life', 'happiness', 'peace', 'devotional', 'inspirational'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate language
    const validLanguages = ['tamil', 'english', 'hindi', 'sanskrit'];
    if (!validLanguages.includes(language)) {
      return NextResponse.json(
        { success: false, error: 'Invalid language' },
        { status: 400 }
      );
    }

    // Validate priority
    if (priority < 0 || priority > 10) {
      return NextResponse.json(
        { success: false, error: 'Priority must be between 0 and 10' },
        { status: 400 }
      );
    }

    // Create new quote
    const newQuote = new Quote({
      text,
      author,
      category,
      language,
      tags: Array.isArray(tags) ? tags : [],
      source,
      isActive,
      isFeatured,
      priority,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      publishedAt: isActive && !scheduledAt ? new Date() : null,
      createdBy,
      metadata: {
        difficulty: metadata.difficulty || 'easy',
        sentiment: metadata.sentiment || 'positive',
        ...metadata,
      },
    });

    await withTimeout(newQuote.save(), 15000, 'Database operation timeout');

    // Populate created by for response
    const savedQuote = await withTimeout(
      Quote.findById(newQuote._id)
        .populate('createdBy', 'name email')
        .maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );

    return NextResponse.json({
      success: true,
      message: 'Quote created successfully',
      quote: savedQuote,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create quote error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createQuote, true);
