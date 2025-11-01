import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Gallery from '@/models/Gallery';
import { v2 as cloudinary } from 'cloudinary';
import { withAuth, withAuthOptional } from '@/lib/middleware';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET - Fetch all gallery images (public route)
async function getGalleryImages(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    let query: any = { isActive: true };

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const images = await withTimeout(Gallery.find(query).maxTimeMS(10000)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit), 15000, 'Database operation timeout');

    const total = await withTimeout(Gallery.countDocuments(query).maxTimeMS(10000), 15000, 'Database operation timeout');

    return NextResponse.json({
      success: true,
      data: images,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: images.length,
        totalImages: total
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
}

// POST - Upload new gallery image (admin only)
async function uploadGalleryImage(request: NextRequest) {
  try {
    await dbConnect();
    
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;
   
    
    // Validate required fields
    if (!title || !description || !file) {
      return NextResponse.json(
        { success: false, error: 'Title, description and image file are required' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Please upload a valid image file' },
        { status: 400 }
      );
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'palani-gallery',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    }) as any;
    
    // Create gallery record in database
    
    // Get user ID from request (added by withAuth middleware)
    const userFromAuth = (request as any).user;
    const userId = (request as any).userId || userFromAuth?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User authentication error' },
        { status: 401 }
      );
    }
    
    const galleryImage = new Gallery({
      title: title.trim(),
      description: description.trim(),
      imageUrl: uploadResult.secure_url,
      uploadedBy: userId
    });
    
    const savedImage = await withTimeout(galleryImage.save(), 15000, 'Database operation timeout') as any;
    
    return NextResponse.json({
      success: true,
      data: savedImage || galleryImage,
      message: 'Image uploaded successfully'
    });
    
  } catch (error: any) {
    // Provide more specific error messages
    let errorMessage = 'Failed to upload image';
    
    if (error.message?.includes('Cloudinary')) {
      errorMessage = 'Image upload to cloud storage failed. Please try again.';
    } else if (error.message?.includes('Database') || error.message?.includes('timeout')) {
      errorMessage = 'Database error. Please try again.';
    } else if (error.message?.includes('Invalid token') || error.message?.includes('Admin access')) {
      errorMessage = 'Authentication failed. Please login again.';
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}

// Export handlers with proper authentication
export const GET = getGalleryImages; // Public route
export const POST = withAuth(uploadGalleryImage, true); // Admin only for POST
