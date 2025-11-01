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
    unique: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be exactly 10 digits'
    }
  },
  whatsappNumber: {
    type: String,
    required: false,
    default: '',
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^\d{10}$/.test(v);
      },
      message: 'WhatsApp number must be exactly 10 digits'
    }
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    default: 'User',
  },
  department: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  city: {
    type: String,
    required: false,
  },
  state: {
    type: String,
    required: false,
  },
  country: {
    type: String,
    default: 'India',
  },
  bio: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  lastLogin: {
    type: Date,
    default: Date.now,
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

// Create indexes for better performance
// Note: email and phone indexes are already created by unique: true in schema
userSchema.index({ whatsappNumber: 1 }, { sparse: true });
userSchema.index({ isDeleted: 1, isActive: 1 });
userSchema.index({ pathayathiraiStatus: 1 });
userSchema.index({ groupId: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ name: 'text', email: 'text' }); // Text search index

// Pre-save middleware to ensure data consistency
userSchema.pre('save', function(next) {
  // Ensure phone numbers are cleaned
  if (this.phone) {
    this.phone = this.phone.replace(/\D/g, '');
  }
  if (this.whatsappNumber) {
    this.whatsappNumber = this.whatsappNumber.replace(/\D/g, '');
  }
  
  // Normalize email
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  
  // Normalize name
  if (this.name) {
    this.name = this.name.trim();
  }
  
  next();
});

export default mongoose.models.User || mongoose.model('User', userSchema);
