import mongoose from 'mongoose';

export interface ISong {
  _id?: string;
  title: string;
  artist: string;
  audioUrl: string;
  publicId: string; // Cloudinary public ID for deletion
  thumbnailUrl?: string; // Thumbnail image URL
  thumbnailPublicId?: string; // Cloudinary public ID for thumbnail deletion
  duration?: number; // in seconds
  createdAt?: Date;
  updatedAt?: Date;
}

const songSchema = new mongoose.Schema<ISong>({
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
  timestamps: true,
  strict: false // Allow additional fields
});

// Create index for efficient searching
songSchema.index({ title: 'text', artist: 'text' });

// Force recreate the model to ensure schema is updated
let Song: mongoose.Model<ISong>;

if (mongoose.models.Song) {
  // Delete existing model to force schema update
  delete mongoose.models.Song;
}

Song = mongoose.model<ISong>('Song', songSchema);

export default Song;
