import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Quote from '@/models/Quote';
import { withTimeout } from '@/lib/apiTimeout';

// GET /api/quotes - Get public quotes with pagination and filtering
async function getPublicQuotes(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || '';
    const language = searchParams.get('language') || '';
    const author = searchParams.get('author') || '';
    const search = searchParams.get('search') || '';
    const featured = searchParams.get('featured') === 'true';
    const random = searchParams.get('random') === 'true';
    
    const skip = (page - 1) * limit;
    
    let query: any = {
      isActive: true,
      isDeleted: false,
    };
    
    // Add filters
    if (category) query.category = category;
    if (language) query.language = language;
    if (author) query.author = { $regex: author, $options: 'i' };
    if (featured) query.isFeatured = true;
    
    // Add search functionality
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Handle random quote request
    if (random) {
      const randomQuotes: any[] = await withTimeout(
        Quote.aggregate([
          { $match: query },
          { $sample: { size: 1 } }
        ]), 
        15000, 
        'Database operation timeout'
      );
      
      if (randomQuotes.length > 0) {
        // Increment view count
        await Quote.findByIdAndUpdate(randomQuotes[0]._id, { $inc: { viewCount: 1 } });
      }
      
      return NextResponse.json({
        success: true,
        quotes: randomQuotes,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: randomQuotes.length,
          itemsPerPage: 1,
        },
      });
    }
    
    // Regular query with pagination
    const quotes = await withTimeout(
      Quote.find(query)
        .select('text author category language tags source isFeatured priority viewCount likeCount shareCount createdAt metadata')
        .sort({ priority: -1, createdAt: -1 })
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
    );
    
    return NextResponse.json({
      success: true,
      quotes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error: any) {
    console.error('Get public quotes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = getPublicQuotes;