import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement' | 'emergency' | 'location' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: 'admin' | 'user' | 'system';
  recipientType: 'individual' | 'group' | 'all' | 'role-based' | 'location-based';
  recipients: {
    userId?: mongoose.Types.ObjectId;
    groupId?: mongoose.Types.ObjectId;
    role?: string;
    location?: {
      country?: string;
      state?: string;
      city?: string;
      radius?: number;
    };
  }[];
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
    deviceInfo?: {
      platform: string;
      browser: string;
      ip: string;
    };
  }[];
  deliveredTo: {
    userId: mongoose.Types.ObjectId;
    deliveredAt: Date;
    method: 'push' | 'email' | 'sms' | 'in-app';
    status: 'delivered' | 'failed';
    error?: string;
  }[];
  scheduledFor?: Date;
  expiresAt?: Date;
  metadata: {
    imageUrl?: string;
    actionUrl?: string;
    actionText?: string;
    sound?: string;
    vibrate?: number[];
    icon?: string;
    badge?: string;
    category?: string;
    customData?: Record<string, any>;
  };
  analytics: {
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    clickCount: number;
    openRate: number;
    clickRate: number;
  };
  isActive: boolean;
  isDeleted: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  failureReason?: string;
}

const NotificationSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'announcement', 'emergency', 'location', 'system'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true,
    trim: true
  },
  senderRole: {
    type: String,
    enum: ['admin', 'user', 'system'],
    default: 'admin'
  },
  recipientType: {
    type: String,
    enum: ['individual', 'group', 'all', 'role-based', 'location-based'],
    default: 'individual'
  },
  recipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    },
    role: String,
    location: {
      country: String,
      state: String,
      city: String,
      radius: Number
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'sent', 'delivered', 'read', 'failed'],
    default: 'draft'
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    },
    deviceInfo: {
      platform: String,
      browser: String,
      ip: String
    }
  }],
  deliveredTo: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['push', 'email', 'sms', 'in-app'],
      default: 'in-app'
    },
    status: {
      type: String,
      enum: ['delivered', 'failed'],
      default: 'delivered'
    },
    error: String
  }],
  scheduledFor: Date,
  expiresAt: Date,
  metadata: {
    imageUrl: String,
    actionUrl: String,
    actionText: String,
    sound: String,
    vibrate: [Number],
    icon: String,
    badge: String,
    category: String,
    customData: mongoose.Schema.Types.Mixed
  },
  analytics: {
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    readCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  tags: [String],
  sentAt: Date,
  failureReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
NotificationSchema.index({ senderId: 1, createdAt: -1 });
NotificationSchema.index({ 'recipients.userId': 1, status: 1 });
NotificationSchema.index({ type: 1, priority: 1 });
NotificationSchema.index({ scheduledFor: 1 });
NotificationSchema.index({ expiresAt: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ tags: 1 });

// Virtual for unread count
NotificationSchema.virtual('unreadCount').get(function(this: INotification) {
  return this.analytics.sentCount - this.analytics.readCount;
});

// Pre-save middleware to update analytics
NotificationSchema.pre('save', function(this: INotification, next) {
  if (this.readBy && this.analytics) {
    this.analytics.readCount = this.readBy.length;
    if (this.analytics.sentCount > 0) {
      this.analytics.openRate = (this.analytics.readCount / this.analytics.sentCount) * 100;
    }
  }
  if (this.deliveredTo && this.analytics) {
    this.analytics.deliveredCount = this.deliveredTo.filter((d: { status: string }) => d.status === 'delivered').length;
  }
  next();
});

// Static methods
NotificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({
    'recipients.userId': userId,
    'readBy.userId': { $ne: userId },
    isActive: true,
    isDeleted: false,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: { $exists: false } }
    ]
  });
};

NotificationSchema.statics.markAsRead = function(notificationId: string, userId: string, deviceInfo?: any) {
  return this.findByIdAndUpdate(
    notificationId,
    {
      $addToSet: {
        readBy: {
          userId,
          readAt: new Date(),
          deviceInfo
        }
      }
    },
    { new: true }
  );
};

NotificationSchema.statics.getNotificationsForUser = function(
  userId: string, 
  options: { 
    page?: number; 
    limit?: number; 
    type?: string; 
    status?: string;
    priority?: string;
  } = {}
) {
  const { page = 1, limit = 20, type, status, priority } = options;
  const skip = (page - 1) * limit;
  
  const query: any = {
    'recipients.userId': userId,
    isActive: true,
    isDeleted: false,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: { $exists: false } }
    ]
  };
  
  if (type) query.type = type;
  if (priority) query.priority = priority;
  
  let notifications = this.find(query)
    .populate('senderId', 'name email')
    .sort({ priority: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  if (status === 'read') {
    notifications = notifications.find({ 'readBy.userId': userId });
  } else if (status === 'unread') {
    notifications = notifications.find({ 'readBy.userId': { $ne: userId } });
  }
  
  return notifications;
};

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);