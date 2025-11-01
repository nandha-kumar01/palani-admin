import mongoose from 'mongoose';

const annadhanamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
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
  timings: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    startTime: String,
    endTime: String,
    isAvailable: {
      type: Boolean,
      default: true,
    },
  }],
  foodType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snacks', 'all'],
    default: 'lunch',
  },
  capacity: Number, // number of people that can be served
  currentAvailability: {
    type: Boolean,
    default: true,
  },
  organizer: {
    name: String,
    contact: String,
  },
  images: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
  specialInstructions: String,
}, {
  timestamps: true,
});

// Index for geospatial queries
annadhanamSchema.index({ "location.latitude": 1, "location.longitude": 1 });

export default mongoose.models.Annadhanam || mongoose.model('Annadhanam', annadhanamSchema);
