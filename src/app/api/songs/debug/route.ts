import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';

// Test endpoint to check existing songs and their thumbnail data
export async function GET() {
  try {
    await dbConnect();
    const songs = await Song.find({}).sort({ createdAt: -1 }).limit(5);
    
    const songData = songs.map(song => ({
      _id: song._id,
      title: song.title,
      artist: song.artist,
      thumbnailUrl: song.thumbnailUrl,
      thumbnailPublicId: song.thumbnailPublicId,
      hasImage: !!song.thumbnailUrl,
      rawData: song.toObject() // Include raw data to see all fields
    }));
    
    return NextResponse.json({
      success: true,
      data: songData,
      total: songs.length,
      schemaFields: Object.keys(Song.schema.paths)
    });
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Test creating a song with thumbnails
export async function POST() {
  try {
    await dbConnect();
    
    const testSong = new Song({
      title: 'Test Thumbnail Song',
      artist: 'Test Artist',
      audioUrl: 'https://test.com/audio.mp3',
      publicId: 'test-public-id',
      thumbnailUrl: 'https://test.com/thumbnail.jpg',
      thumbnailPublicId: 'test-thumbnail-id',
      duration: 180
    });
    
    await testSong.save();
    
    return NextResponse.json({
      success: true,
      message: 'Test song created successfully',
      song: testSong.toObject()
    });
    
  } catch (error: any) {
    console.error('Error creating test song:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}