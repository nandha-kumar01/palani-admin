import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Migrate existing songs to add thumbnail fields
export async function POST() {
  try {
    await dbConnect();
    
    // Check if database connection exists
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    // Update all existing songs to have thumbnail fields
    const result = await mongoose.connection.db.collection('songs').updateMany(
      { thumbnailUrl: { $exists: false } },
      { 
        $set: { 
          thumbnailUrl: null,
          thumbnailPublicId: null 
        } 
      }
    );
    
    // Get some sample documents to verify
    const sampleSongs = await mongoose.connection.db.collection('songs')
      .find({})
      .limit(3)
      .toArray();
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      updated: result.modifiedCount,
      sampleSongs: sampleSongs.map(song => ({
        _id: song._id,
        title: song.title,
        hasThumbnailUrl: 'thumbnailUrl' in song,
        hasThumbnailPublicId: 'thumbnailPublicId' in song,
        thumbnailUrl: song.thumbnailUrl,
        thumbnailPublicId: song.thumbnailPublicId
      }))
    });
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}