import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'urgent', 'celebration'],
    default: 'info',
  },
  targetAudience: {
    type: String,
    enum: ['all', 'active_users', 'specific_location'],
    default: 'all',
  },
  location: {
    latitude: Number,
    longitude: Number,
    radius: Number, // in kilometers
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sendPushNotification: {
    type: Boolean,
    default: true,
  },
  scheduledAt: Date,
  sentAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
