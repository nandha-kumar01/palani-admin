import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  finalText: {
    type: String,
    required: false,
    trim: true,
    maxlength: 1000,
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  category: {
    type: String,
    required: true,
    enum: ['motivational', 'spiritual', 'wisdom', 'love', 'success', 'life', 'happiness', 'peace', 'devotional', 'inspirational'],
    default: 'motivational',
  },
  language: {
    type: String,
    required: true,
    enum: ['tamil', 'english', 'hindi', 'sanskrit'],
    default: 'tamil',
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50,
  }],
  source: {
    type: String,
    required: false,
    trim: true,
    maxlength: 200,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  shareCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  publishedAt: {
    type: Date,
    default: null,
  },
  scheduledAt: {
    type: Date,
    default: null,
  },
  metadata: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    readingTime: {
      type: Number, // in seconds
      default: 10,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'positive',
    },
  },
}, {
  timestamps: true,
});

// Indexes for better performance
quoteSchema.index({ category: 1, language: 1 });
quoteSchema.index({ isActive: 1, isDeleted: 1 });
quoteSchema.index({ createdAt: -1 });
quoteSchema.index({ author: 1 });
quoteSchema.index({ tags: 1 });
quoteSchema.index({ isFeatured: 1, priority: -1 });

// Text search index with language override disabled to support Tamil content
quoteSchema.index({ 
  text: 'text', 
  author: 'text', 
  tags: 'text', 
  source: 'text' 
}, { 
  default_language: 'none',
  language_override: 'none'
});

// Pre-save middleware to update reading time based on text length
quoteSchema.pre('save', function(next) {
  if (this.isModified('text') && this.text) {
    const wordCount = this.text.split(' ').length;
    if (!this.metadata) {
      this.metadata = { difficulty: 'easy', readingTime: 10, sentiment: 'positive' };
    }
    this.metadata.readingTime = Math.max(5, Math.ceil(wordCount / 2)); // 2 words per second minimum 5 seconds
  }
  next();
});

// Method to increment view count
quoteSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to increment like count
quoteSchema.methods.incrementLike = function() {
  this.likeCount += 1;
  return this.save();
};

// Method to increment share count
quoteSchema.methods.incrementShare = function() {
  this.shareCount += 1;
  return this.save();
};

// Static method to get featured quotes
quoteSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ 
    isActive: true, 
    isDeleted: false, 
    isFeatured: true 
  })
  .sort({ priority: -1, createdAt: -1 })
  .limit(limit)
  .populate('createdBy', 'name email');
};

// Static method to get random quote
quoteSchema.statics.getRandom = function(category?: string, language?: string) {
  const match: any = { 
    isActive: true, 
    isDeleted: false 
  };
  
  if (category) match.category = category;
  if (language) match.language = language;
  
  return this.aggregate([
    { $match: match },
    { $sample: { size: 1 } }
  ]);
};

// Static method to get quotes by category
quoteSchema.statics.getByCategory = function(category: string, limit = 20, page = 1) {
  const skip = (page - 1) * limit;
  return this.find({ 
    category, 
    isActive: true, 
    isDeleted: false 
  })
  .sort({ priority: -1, createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('createdBy', 'name email');
};

export default mongoose.models.Quote || mongoose.model('Quote', quoteSchema);