import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import { v2 as cloudinary } from 'cloudinary';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET - Fetch all songs
export async function GET() {
  try {
    await dbConnect();
    const songs = await withTimeout(Song.find({}).maxTimeMS(10000).sort({ createdAt: -1 }), 15000, 'Database operation timeout');
    
    return NextResponse.json({
      success: true,
      data: songs
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error: any) {
    console.error('Error fetching songs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch songs' },
      { status: 500 }
    );
  }
}

// POST - Upload new song
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    const file = formData.get('file') as File;
    const thumbnail = formData.get('thumbnail') as File | null;
    
    // Validate required fields
    if (!title || !artist || !file) {
      return NextResponse.json(
        { success: false, error: 'Title, artist, and audio file are required' },
        { status: 400 }
      );
    }
    
    // Validate audio file type
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { success: false, error: 'Please upload a valid audio file' },
        { status: 400 }
      );
    }
    
    // Validate thumbnail file type if provided
    if (thumbnail && thumbnail.size > 0 && !['image/jpeg', 'image/jpg', 'image/png'].includes(thumbnail.type)) {
      return NextResponse.json(
        { success: false, error: 'Thumbnail must be in JPG, JPEG, or PNG format' },
        { status: 400 }
      );
    }
    
    // Check audio file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Audio file size must be less than 10MB' },
        { status: 400 }
      );
    }
    
    // Check thumbnail file size (max 5MB)
    if (thumbnail && thumbnail.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Thumbnail file size must be less than 5MB' },
        { status: 400 }
      );
    }
    
    // Convert audio file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload audio to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'palani-songs',
          format: 'mp3',
          transformation: [
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    }) as any;
    
    // Upload thumbnail to Cloudinary if provided
    let thumbnailResult = null;
    if (thumbnail && thumbnail.size > 0) {
      const thumbnailBytes = await thumbnail.arrayBuffer();
      const thumbnailBuffer = Buffer.from(thumbnailBytes);
      
      thumbnailResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'palani-thumbnails',
            transformation: [
              { width: 300, height: 300, crop: 'fill' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(thumbnailBuffer);
      }) as any;
    }
    
    // Create song record in database
    const songData = {
      title: title.trim(),
      artist: artist.trim(),
      audioUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      thumbnailUrl: thumbnailResult?.secure_url || null,
      thumbnailPublicId: thumbnailResult?.public_id || null,
      duration: uploadResult.duration
    };
    
    const song = new Song(songData);
    
    // Explicitly set thumbnail fields before saving
    if (thumbnailResult) {
      song.thumbnailUrl = thumbnailResult.secure_url;
      song.thumbnailPublicId = thumbnailResult.public_id;
    }
    
    await withTimeout(song.save(), 15000, 'Database operation timeout');
    
    return NextResponse.json({
      success: true,
      data: song
    });
    
  } catch (error: any) {
    console.error('Error uploading song:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload song' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a song
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('id');
    
    if (!songId) {
      return NextResponse.json(
        { success: false, error: 'Song ID is required' },
        { status: 400 }
      );
    }
    
    const song = await withTimeout(Song.findById(songId).maxTimeMS(10000), 15000, 'Database operation timeout');
    if (!song) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }
    
    // Delete from Cloudinary
    try {
      // Delete audio file
      await cloudinary.uploader.destroy(song.publicId, { resource_type: 'video' });
      
      // Delete thumbnail if exists
      if (song.thumbnailPublicId) {
        await cloudinary.uploader.destroy(song.thumbnailPublicId, { resource_type: 'image' });
      }
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }
    
    // Delete from database
    await withTimeout(Song.findByIdAndDelete(songId), 15000, 'Database operation timeout');
    
    return NextResponse.json({
      success: true,
      message: 'Song deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting song:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete song' },
      { status: 500 }
    );
  }
}
