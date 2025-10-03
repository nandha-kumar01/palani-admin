import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  plainPassword: {
    type: String,
    required: false, // Optional field for admin viewing
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date,
  },
  isTracking: {
    type: Boolean,
    default: false,
  },
  pathayathiraiStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started',
  },
  startDate: Date,
  endDate: Date,
  totalDistance: {
    type: Number,
    default: 0,
  },
  visitedTemples: [{
    templeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Temple',
    },
    visitedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  profilePicture: String,
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null, // null means single traveler
  },
  joinedGroupAt: Date,
  lastLocationUpdate: {
    type: Date,
    default: Date.now,
  },
  resetPasswordOTP: {
    type: String,
    required: false,
  },
  resetPasswordExpiry: {
    type: Date,
    required: false,
  },
  fcmToken: {
    type: String,
    required: false,
  },
  deviceInfo: {
    platform: String, // 'android', 'ios', 'web'
    browser: String,
    version: String,
    model: String,
    ip: String,
    lastActive: {
      type: Date,
      default: Date.now,
    }
  },
  notificationPreferences: {
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    locationUpdates: {
      type: Boolean,
      default: true,
    },
    groupNotifications: {
      type: Boolean,
      default: true,
    },
    emergencyAlerts: {
      type: Boolean,
      default: true,
    }
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', userSchema);
