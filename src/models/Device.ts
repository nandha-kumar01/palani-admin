import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  mobileNumber: string;
  deviceModel: string;
  deviceId: string;
  ipAddress: string;
  installationSource: 'playstore' | 'appstore' | 'sideload' | 'unknown';
  appVersion: string;
  osVersion: string;
  platform: 'android' | 'ios';
  deviceInfo: {
    brand?: string;
    manufacturer?: string;
    screenResolution?: string;
    batteryLevel?: number;
    isRooted?: boolean;
    isJailbroken?: boolean;
  };
  location?: {
    country?: string;
    state?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  firstInstallDate: Date;
  lastActiveDate: Date;
  isActive: boolean;
  uninstallDate?: Date;
  totalSessions: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  deviceModel: {
    type: String,
    required: true,
    trim: true
  },
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  ipAddress: {
    type: String,
    required: true,
    trim: true
  },
  installationSource: {
    type: String,
    enum: ['playstore', 'appstore', 'sideload', 'unknown'],
    default: 'unknown'
  },
  appVersion: {
    type: String,
    required: true
  },
  osVersion: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['android', 'ios'],
    required: true
  },
  deviceInfo: {
    brand: { type: String },
    manufacturer: { type: String },
    screenResolution: { type: String },
    batteryLevel: { type: Number, min: 0, max: 100 },
    isRooted: { type: Boolean, default: false },
    isJailbroken: { type: Boolean, default: false }
  },
  location: {
    country: { type: String },
    state: { type: String },
    city: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  firstInstallDate: {
    type: Date,
    default: Date.now
  },
  lastActiveDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uninstallDate: {
    type: Date
  },
  totalSessions: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
DeviceSchema.index({ userId: 1 });
// Note: deviceId index is already created by unique: true in schema
DeviceSchema.index({ platform: 1 });
DeviceSchema.index({ installationSource: 1 });
DeviceSchema.index({ isActive: 1 });
DeviceSchema.index({ createdAt: -1 });
DeviceSchema.index({ lastActiveDate: -1 });

// Virtual for installation source display
DeviceSchema.virtual('installationSourceDisplay').get(function(this: IDevice) {
  const sourceMap: { [key: string]: string } = {
    'Play Store': '📱 Play Store',
    'App Store': '🍎 App Store',
    'Web': '🌐 Web'
  };
  return sourceMap[this.installationSource as string] || 'Unknown Source';
});

// Virtual for platform display
DeviceSchema.virtual('platformDisplay').get(function() {
  return this.platform === 'android' ? 'Android' : 'iOS';
});

// Method to update last active
DeviceSchema.methods.updateLastActive = function() {
  this.lastActiveDate = new Date();
  this.totalSessions += 1;
  return this.save();
};

// Method to mark as uninstalled
DeviceSchema.methods.markUninstalled = function() {
  this.isActive = false;
  this.uninstallDate = new Date();
  return this.save();
};

// Static method to get active devices count
DeviceSchema.statics.getActiveDevicesCount = function() {
  return this.countDocuments({ isActive: true });
};

// Static method to get devices by platform
DeviceSchema.statics.getDevicesByPlatform = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$platform', count: { $sum: 1 } } }
  ]);
};

// Static method to get devices by installation source
DeviceSchema.statics.getDevicesBySource = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$installationSource', count: { $sum: 1 } } }
  ]);
};

export default mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema);