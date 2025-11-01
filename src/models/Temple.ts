import mongoose from 'mongoose';

const templeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
  },
  photo: {
    type: String, // Single photo URL from Cloudinary
  },
  timings: {
    opening: {
      type: String,
      required: true,
    },
    closing: {
      type: String,
      required: true,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  visitCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for geospatial queries
templeSchema.index({ "location.latitude": 1, "location.longitude": 1 });

// Delete the model if it exists to avoid caching issues
if (mongoose.models.Temple) {
  delete mongoose.models.Temple;
}

export default mongoose.model('Temple', templeSchema);
