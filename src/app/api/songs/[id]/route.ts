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

// GET - Get a specific song
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const song = await withTimeout(Song.findById(params.id).maxTimeMS(10000), 15000, 'Database operation timeout');
    
    if (!song) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: song
    });
  } catch (error: any) {
    console.error('Error fetching song:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch song' },
      { status: 500 }
    );
  }
}

// PUT - Update a song
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { title, artist } = await request.json();
    
    if (!title || !artist) {
      return NextResponse.json(
        { success: false, error: 'Title and artist are required' },
        { status: 400 }
      );
    }
    
    const song = await withTimeout(await Song.findByIdAndUpdate(
      params.id,
      { title: title.trim(), artist: artist.trim() },
      { new: true, runValidators: true }
    ), 15000, 'Database operation timeout');
    
    if (!song) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: song
    });
  } catch (error: any) {
    console.error('Error updating song:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update song' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific song
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const song = await withTimeout(Song.findById(params.id).maxTimeMS(10000), 15000, 'Database operation timeout');
    if (!song) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }
    
    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(song.publicId, { resource_type: 'video' });
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }
    
    // Delete from database
    await withTimeout(Song.findByIdAndDelete(params.id), 15000, 'Database operation timeout');
    
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
