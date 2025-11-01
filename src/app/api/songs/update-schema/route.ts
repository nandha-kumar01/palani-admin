import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Force update the Song model schema
export async function POST() {
  try {
    await dbConnect();
    
    // Drop the existing model if it exists
    if (mongoose.models.Song) {
      delete mongoose.models.Song;
    }
    
    // Recreate the schema with thumbnail fields
    const songSchema = new mongoose.Schema({
      title: {
        type: String,
        required: [true, 'Song title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
      },
      artist: {
        type: String,
        required: [true, 'Artist name is required'],
        trim: true,
        maxlength: [100, 'Artist name cannot exceed 100 characters']
      },
      audioUrl: {
        type: String,
        required: [true, 'Audio URL is required']
      },
      publicId: {
        type: String,
        required: [true, 'Cloudinary public ID is required']
      },
      thumbnailUrl: {
        type: String,
        default: null
      },
      thumbnailPublicId: {
        type: String,
        default: null
      },
      duration: {
        type: Number,
        min: 0
      }
    }, {
      timestamps: true
    });

    // Create index for efficient searching
    songSchema.index({ title: 'text', artist: 'text' });

    // Create the model
    const Song = mongoose.model('Song', songSchema);
    
    // Test creating a document with thumbnail fields
    const testDoc = new Song({
      title: 'Test Schema Update',
      artist: 'Test Artist',
      audioUrl: 'https://test.com/audio.mp3',
      publicId: 'test-public-id',
      thumbnailUrl: 'https://test.com/thumbnail.jpg',
      thumbnailPublicId: 'test-thumbnail-id',
      duration: 180
    });
    
    // Don't save it, just validate the schema
    const validationResult = testDoc.validateSync();
    
    return NextResponse.json({
      success: true,
      message: 'Schema updated successfully',
      validation: validationResult ? 'Failed' : 'Passed',
      modelFields: Object.keys(songSchema.paths)
    });
    
  } catch (error: any) {
    console.error('Schema update error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}