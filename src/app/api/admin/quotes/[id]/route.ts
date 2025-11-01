import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Quote from '@/models/Quote';
import { withAuth } from '@/lib/middleware';
import { withTimeout } from '@/lib/apiTimeout';

// GET /api/admin/quotes/[id] - Get single quote by ID for admin
async function getAdminQuoteById(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const quote = await withTimeout(
      Quote.findById(id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('deletedBy', 'name email')
        .maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );
    
    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error: any) {
    console.error('Get admin quote by ID error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAdminQuoteById, true);

// PUT /api/admin/quotes/[id] - Update quote
async function updateQuote(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const {
      text,
      author,
      category,
      language,
      tags,
      source,
      isActive,
      isFeatured,
      priority,
      scheduledAt,
      updatedBy,
      metadata,
    } = await request.json();

    // Check if quote exists
    const existingQuote = await withTimeout(
      Quote.findById(id).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );

    if (!existingQuote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Validate required fields if provided
    if ((text !== undefined && !text) || (author !== undefined && !author)) {
      return NextResponse.json(
        { success: false, error: 'Text and author cannot be empty' },
        { status: 400 }
      );
    }

    // Validate text length if provided
    if (text && text.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Quote text cannot exceed 1000 characters' },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category) {
      const validCategories = ['motivational', 'spiritual', 'wisdom', 'love', 'success', 'life', 'happiness', 'peace', 'devotional', 'inspirational'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { success: false, error: 'Invalid category' },
          { status: 400 }
        );
      }
    }

    // Validate language if provided
    if (language) {
      const validLanguages = ['tamil', 'english', 'hindi', 'sanskrit'];
      if (!validLanguages.includes(language)) {
        return NextResponse.json(
          { success: false, error: 'Invalid language' },
          { status: 400 }
        );
      }
    }

    // Validate priority if provided
    if (priority !== undefined && (priority < 0 || priority > 10)) {
      return NextResponse.json(
        { success: false, error: 'Priority must be between 0 and 10' },
        { status: 400 }
      );
    }

    // Prepare update object
    const updateObject: any = {};
    if (text !== undefined) updateObject.text = text;
    if (author !== undefined) updateObject.author = author;
    if (category !== undefined) updateObject.category = category;
    if (language !== undefined) updateObject.language = language;
    if (tags !== undefined) updateObject.tags = Array.isArray(tags) ? tags : [];
    if (source !== undefined) updateObject.source = source;
    if (isActive !== undefined) updateObject.isActive = isActive;
    if (isFeatured !== undefined) updateObject.isFeatured = isFeatured;
    if (priority !== undefined) updateObject.priority = priority;
    if (scheduledAt !== undefined) updateObject.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (updatedBy !== undefined) updateObject.updatedBy = updatedBy;
    
    // Handle publish date logic
    if (isActive !== undefined && isActive && !existingQuote.publishedAt && !scheduledAt) {
      updateObject.publishedAt = new Date();
    }
    
    // Update metadata if provided
    if (metadata !== undefined) {
      updateObject.metadata = {
        ...existingQuote.metadata,
        ...metadata,
      };
    }

    // Update quote
    const updatedQuote = await withTimeout(
      Quote.findByIdAndUpdate(
        id,
        updateObject,
        { new: true, runValidators: true }
      )
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );

    return NextResponse.json({
      success: true,
      message: 'Quote updated successfully',
      quote: updatedQuote,
    });
  } catch (error: any) {
    console.error('Update quote error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(updateQuote, true);

// DELETE /api/admin/quotes/[id] - Delete quote (soft delete)
async function deleteQuote(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const { permanent = false, deletedBy } = await request.json();

    // Check if quote exists
    const existingQuote = await withTimeout(
      Quote.findById(id).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );

    if (!existingQuote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    if (permanent) {
      // Permanent delete
      await withTimeout(
        Quote.findByIdAndDelete(id).maxTimeMS(10000),
        15000,
        'Database operation timeout'
      );
      
      return NextResponse.json({
        success: true,
        message: 'Quote permanently deleted',
      });
    } else {
      // Soft delete
      const updatedQuote = await withTimeout(
        Quote.findByIdAndUpdate(
          id,
          {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: deletedBy,
            isActive: false, // Also deactivate when deleted
          },
          { new: true }
        )
          .populate('deletedBy', 'name email')
          .maxTimeMS(10000),
        15000,
        'Database operation timeout'
      );

      return NextResponse.json({
        success: true,
        message: 'Quote deleted successfully',
        quote: updatedQuote,
      });
    }
  } catch (error: any) {
    console.error('Delete quote error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(deleteQuote, true);