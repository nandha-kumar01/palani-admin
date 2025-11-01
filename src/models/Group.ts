import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  maxMembers: {
    type: Number,
    default: 50, // Maximum group size
  },
  pathayathiraiStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started',
  },
  startDate: Date,
  endDate: Date,
  totalGroupDistance: {
    type: Number,
    default: 0,
  },
  groupStats: {
    averageDistance: {
      type: Number,
      default: 0,
    },
    templesVisited: {
      type: Number,
      default: 0,
    },
    activeMembers: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Index for better query performance
groupSchema.index({ createdBy: 1 });
groupSchema.index({ name: 1 });
groupSchema.index({ isActive: 1 });

export default mongoose.models.Group || mongoose.model('Group', groupSchema);
