import mongoose, { Schema, Document } from 'mongoose';

// Interface for reply structure
export interface IReply {
  message: string;
  adminId: mongoose.Types.ObjectId;
  adminName: string;
  adminEmail: string;
  createdAt: Date;
}

export interface IUserSupport extends Document {
  title: string;
  description: string;
  type: 'bug' | 'feature_request' | 'general_inquiry' | 'technical_support' | 'account_issue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  userId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  tags: string[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  adminNotes: string;
  replies: IReply[];
  userRating?: number;
}

const UserSupportSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    required: true,
    enum: ['bug', 'feature_request', 'general_inquiry', 'technical_support', 'account_issue'],
    default: 'general_inquiry'
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    type: String,
    trim: true
  }],
  adminNotes: {
    type: String,
    default: '',
    maxlength: 1000
  },
  replies: [{
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    adminName: {
      type: String,
      required: true
    },
    adminEmail: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  userRating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
UserSupportSchema.index({ status: 1, createdAt: -1 });
UserSupportSchema.index({ userId: 1, createdAt: -1 });
UserSupportSchema.index({ type: 1, priority: 1 });
UserSupportSchema.index({ assignedTo: 1, status: 1 });

// Virtual for user information
UserSupportSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for assigned admin information
UserSupportSchema.virtual('assignedAdmin', {
  ref: 'User',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update the updatedAt field
UserSupportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get support statistics
UserSupportSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalTickets: { $sum: 1 },
        openTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
        },
        inProgressTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        resolvedTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        closedTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
        },
        averageRating: { $avg: '$userRating' },
        bugReports: {
          $sum: { $cond: [{ $eq: ['$type', 'bug'] }, 1, 0] }
        },
        featureRequests: {
          $sum: { $cond: [{ $eq: ['$type', 'feature_request'] }, 1, 0] }
        },
        urgentTickets: {
          $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    averageRating: 0,
    bugReports: 0,
    featureRequests: 0,
    urgentTickets: 0
  };
};

// Instance method to calculate resolution time
UserSupportSchema.methods.getResolutionTime = function() {
  if (!this.resolvedAt || !this.createdAt) {
    return null;
  }
  
  const diffInMs = this.resolvedAt.getTime() - this.createdAt.getTime();
  const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
  return diffInHours;
};

// Instance method to check if ticket is overdue (more than 48 hours for urgent, 7 days for others)
UserSupportSchema.methods.isOverdue = function() {
  if (this.status === 'resolved' || this.status === 'closed') {
    return false;
  }
  
  const now = new Date();
  const diffInMs = now.getTime() - this.createdAt.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  
  if (this.priority === 'urgent') {
    return diffInHours > 48; // 48 hours for urgent tickets
  } else if (this.priority === 'high') {
    return diffInHours > 72; // 72 hours for high priority
  } else {
    return diffInHours > 168; // 7 days for medium/low priority
  }
};

export default mongoose.models.UserSupport || mongoose.model<IUserSupport>('UserSupport', UserSupportSchema);