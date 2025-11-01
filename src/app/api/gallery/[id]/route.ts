import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Gallery from '@/models/Gallery';
import { v2 as cloudinary } from 'cloudinary';
import { withAuth } from '@/lib/middleware';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET - Get single gallery image
async function getGalleryImage(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const image = await withTimeout(Gallery.findById(id).maxTimeMS(10000), 15000, 'Database operation timeout');
    
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: image
    });
  } catch (error: any) {
    console.error('Error fetching gallery image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}

// PUT - Update gallery image (admin only)
async function updateGalleryImage(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    
    const { title, description, isActive } = body;
    
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }
    
    const updateData: any = {
      title: title.trim(),
      description: description.trim()
    };
    
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedImage = await withTimeout(await Gallery.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ), 15000, 'Database operation timeout');
    
    if (!updatedImage) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedImage,
      message: 'Image updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating gallery image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update image' },
      { status: 500 }
    );
  }
}

// DELETE - Delete gallery image (admin only)
async function deleteGalleryImage(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const image = await withTimeout(Gallery.findById(id).maxTimeMS(10000), 15000, 'Database operation timeout');
    
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // Try to delete from Cloudinary if we have the imageUrl
    if (image.imageUrl) {
      try {
        // Extract public_id from the Cloudinary URL
        const urlParts = image.imageUrl.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        await cloudinary.uploader.destroy(`palani-gallery/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }
    
    // Delete from database
    await withTimeout(Gallery.findByIdAndDelete(id), 15000, 'Database operation timeout');
    
    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = getGalleryImage; // Public route
export const PUT = withAuth(updateGalleryImage, true); // Admin only
export const DELETE = withAuth(deleteGalleryImage, true); // Admin only
