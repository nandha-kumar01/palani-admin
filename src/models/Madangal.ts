import mongoose from 'mongoose';

const madangalSchema = new mongoose.Schema({
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
  capacity: {
    type: Number,
    required: true,
  },
  currentOccupancy: {
    type: Number,
    default: 0,
  },
  facilities: [String], // bed, bathroom, kitchen, parking, etc.
  cost: {
    type: Number,
    default: 0, // 0 for free
  },
  costType: {
    type: String,
    enum: ['free', 'donation', 'fixed'],
    default: 'free',
  },
  contact: {
    name: String,
    phone: String,
    email: String,
  },
  images: [String],
  rules: [String],
  checkInTime: String,
  checkOutTime: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  currentlyAvailable: {
    type: Boolean,
    default: true,
  },
  bookings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    checkIn: Date,
    checkOut: Date,
    numberOfPeople: Number,
    status: {
      type: String,
      enum: ['confirmed', 'checked_in', 'checked_out', 'cancelled'],
      default: 'confirmed',
    },
  }],
}, {
  timestamps: true,
});

// Index for geospatial queries
madangalSchema.index({ "location.latitude": 1, "location.longitude": 1 });

export default mongoose.models.Madangal || mongoose.model('Madangal', madangalSchema);
