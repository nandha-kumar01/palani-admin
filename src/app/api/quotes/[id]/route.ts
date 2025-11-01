import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Quote from '@/models/Quote';
import { withTimeout } from '@/lib/apiTimeout';

// GET /api/quotes/[id] - Get single quote by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const quote = await withTimeout(
      Quote.findById(params.id)
        .select('text author category language tags source isFeatured priority viewCount likeCount shareCount createdAt metadata')
        .maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );
    
    if (!quote || quote.isDeleted || !quote.isActive) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    // Increment view count
    await withTimeout(
      Quote.findByIdAndUpdate(params.id, { $inc: { viewCount: 1 } }).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );
    
    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error: any) {
    console.error('Get quote by ID error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/quotes/[id] - Update quote stats (like, share)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { action } = await request.json();
    
    if (!action || !['like', 'share'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "like" or "share"' },
        { status: 400 }
      );
    }
    
    const quote = await withTimeout(
      Quote.findById(params.id).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );
    
    if (!quote || quote.isDeleted || !quote.isActive) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    let updateField = {};
    if (action === 'like') {
      updateField = { $inc: { likeCount: 1 } };
    } else if (action === 'share') {
      updateField = { $inc: { shareCount: 1 } };
    }
    
    const updatedQuote = await withTimeout(
      Quote.findByIdAndUpdate(
        params.id,
        updateField,
        { new: true, select: 'viewCount likeCount shareCount' }
      ).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );
    
    return NextResponse.json({
      success: true,
      message: `Quote ${action}d successfully`,
      stats: {
        viewCount: updatedQuote.viewCount,
        likeCount: updatedQuote.likeCount,
        shareCount: updatedQuote.shareCount,
      },
    });
  } catch (error: any) {
    console.error('Update quote stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}