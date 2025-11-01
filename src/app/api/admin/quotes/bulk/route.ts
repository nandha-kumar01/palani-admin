import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Quote from '@/models/Quote';
import { withAuth } from '@/lib/middleware';
import { withTimeout } from '@/lib/apiTimeout';

// POST /api/admin/quotes/bulk - Bulk operations on quotes
async function bulkOperations(request: NextRequest) {
  try {
    await dbConnect();
    
    const {
      action,
      quoteIds,
      updateData,
      deletedBy,
    } = await request.json();

    if (!action || !Array.isArray(quoteIds) || quoteIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Action and quote IDs are required' },
        { status: 400 }
      );
    }

    const validActions = ['activate', 'deactivate', 'delete', 'restore', 'feature', 'unfeature', 'update'];
    
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    let updateQuery: any = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateQuery = { isActive: true };
        message = 'Quotes activated successfully';
        break;
      case 'deactivate':
        updateQuery = { isActive: false };
        message = 'Quotes deactivated successfully';
        break;
      case 'delete':
        updateQuery = { 
          isDeleted: true, 
          deletedAt: new Date(), 
          deletedBy: deletedBy,
          isActive: false 
        };
        message = 'Quotes deleted successfully';
        break;
      case 'restore':
        updateQuery = { 
          isDeleted: false, 
          deletedAt: null, 
          deletedBy: null 
        };
        message = 'Quotes restored successfully';
        break;
      case 'feature':
        updateQuery = { isFeatured: true };
        message = 'Quotes featured successfully';
        break;
      case 'unfeature':
        updateQuery = { isFeatured: false };
        message = 'Quotes unfeatured successfully';
        break;
      case 'update':
        if (!updateData || typeof updateData !== 'object') {
          return NextResponse.json(
            { success: false, error: 'Update data is required for update action' },
            { status: 400 }
          );
        }
        
        // Validate update data
        const allowedUpdates = ['category', 'language', 'priority', 'tags', 'isActive', 'isFeatured'];
        const updates: any = {};
        
        Object.keys(updateData).forEach(key => {
          if (allowedUpdates.includes(key)) {
            updates[key] = updateData[key];
          }
        });
        
        if (Object.keys(updates).length === 0) {
          return NextResponse.json(
            { success: false, error: 'No valid update fields provided' },
            { status: 400 }
          );
        }
        
        updateQuery = updates;
        message = 'Quotes updated successfully';
        break;
    }

    // Perform bulk update
    const result = await withTimeout(
      Quote.updateMany(
        { _id: { $in: quoteIds } },
        updateQuery
      ).maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );

    // Get updated quotes for response
    const updatedQuotes = await withTimeout(
      Quote.find({ _id: { $in: quoteIds } })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('deletedBy', 'name email')
        .maxTimeMS(10000),
      15000,
      'Database operation timeout'
    );

    return NextResponse.json({
      success: true,
      message,
      affectedCount: result.modifiedCount,
      quotes: updatedQuotes,
    });
  } catch (error: any) {
    console.error('Bulk operations error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const POST = withAuth(bulkOperations, true);