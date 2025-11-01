const mongoose = require('mongoose');

// Since the models are TypeScript with ES6 exports, we need to create the schemas directly
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

const userSupportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['bug', 'feature_request', 'support', 'other'], 
    default: 'bug' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'resolved', 'closed'], 
    default: 'open' 
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [{ type: String }],
  attachments: [{
    filename: String,
    fileUrl: String,
    fileSize: Number,
    mimeType: String
  }],
  adminNotes: { type: String, default: '' },
  userFeedback: { type: String },
  isUrgent: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  closedAt: { type: Date }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const UserSupport = mongoose.models.UserSupport || mongoose.model('UserSupport', userSupportSchema);

async function addSampleSupportData() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://marinandhu659:X1BMVtt0fnEFHrxb@cluster0.rlgy9uh.mongodb.net/palani_pathayathirai');

    // Get or create sample users first
    let users = await User.find({ isAdmin: false }).limit(5);
    
    if (users.length < 5) {
      // Delete existing non-admin users to start fresh
      await User.deleteMany({ isAdmin: false });
      
      const sampleUsers = [
        {
          name: 'Ravi Kumar',
          email: 'ravi.kumar@example.com',
          phone: '+91-9876543210',
          password: '$2b$12$mvTmgPEl7APJ6B0/YXSkWeEV.Qj4iSnExT7eirTwMcE.QiqkczaxS', // password: user123
          isAdmin: false,
          isActive: true
        },
        {
          name: 'Priya Sharma',
          email: 'priya.sharma@example.com',
          phone: '+91-9876543211',
          password: '$2b$12$mvTmgPEl7APJ6B0/YXSkWeEV.Qj4iSnExT7eirTwMcE.QiqkczaxS',
          isAdmin: false,
          isActive: true
        },
        {
          name: 'Suresh Reddy',
          email: 'suresh.reddy@example.com',
          phone: '+91-9876543212',
          password: '$2b$12$mvTmgPEl7APJ6B0/YXSkWeEV.Qj4iSnExT7eirTwMcE.QiqkczaxS',
          isAdmin: false,
          isActive: true
        },
        {
          name: 'Lakshmi Devi',
          email: 'lakshmi.devi@example.com',
          phone: '+91-9876543213',
          password: '$2b$12$mvTmgPEl7APJ6B0/YXSkWeEV.Qj4iSnExT7eirTwMcE.QiqkczaxS',
          isAdmin: false,
          isActive: true
        },
        {
          name: 'Vikram Singh',
          email: 'vikram.singh@example.com',
          phone: '+91-9876543214',
          password: '$2b$12$mvTmgPEl7APJ6B0/YXSkWeEV.Qj4iSnExT7eirTwMcE.QiqkczaxS',
          isAdmin: false,
          isActive: true
        }
      ];

      users = await User.insertMany(sampleUsers);
    }

    // Check if support tickets already exist
    const existingTickets = await UserSupport.countDocuments();
    if (existingTickets > 0) {
      await UserSupport.deleteMany({});
    }

    // Sample support tickets data
    const sampleTickets = [
      {
        title: 'App crashes when uploading photos',
        description: 'The mobile app crashes every time I try to upload photos from the gallery. This happens on both Android and iOS devices. Please fix this urgent issue as I cannot share temple photos.',
        type: 'bug',
        priority: 'urgent',
        status: 'open',
        userId: users[0]._id,
        tags: ['mobile', 'crash', 'upload', 'photos'],
        attachments: [],
        adminNotes: '',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Need dark mode feature',
        description: 'Could you please add a dark mode option to the app? It would be very helpful during evening prayers and reduce eye strain. Many users have been requesting this feature.',
        type: 'feature_request',
        priority: 'medium',
        status: 'in_progress',
        userId: users[1]._id,
        tags: ['dark-mode', 'ui', 'enhancement'],
        attachments: [],
        adminNotes: 'Feature is under development. Expected completion in next release.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        title: 'Audio quality is poor during live streaming',
        description: 'When listening to live temple broadcasts, the audio quality is very poor with lots of static and interruptions. This makes it difficult to follow the prayers properly.',
        type: 'bug',
        priority: 'high',
        status: 'resolved',
        userId: users[2]._id,
        tags: ['audio', 'streaming', 'quality', 'live'],
        attachments: [],
        adminNotes: 'Issue resolved by upgrading streaming servers and improving audio compression.',
        resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Cannot find upcoming events section',
        description: 'I am looking for information about upcoming temple events and festivals but cannot find this section in the app. Could you please guide me or add this feature?',
        type: 'support',
        priority: 'low',
        status: 'closed',
        userId: users[3]._id,
        tags: ['events', 'festivals', 'navigation', 'help'],
        attachments: [],
        adminNotes: 'Provided user guide and created tutorial video. Events section is under Calendar tab.',
        resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Location sharing not working correctly',
        description: 'The location sharing feature is not working properly. When I enable it, other devotees cannot see my location on the map. GPS is enabled and permissions are granted.',
        type: 'bug',
        priority: 'high',
        status: 'open',
        userId: users[4]._id,
        tags: ['location', 'gps', 'sharing', 'map'],
        attachments: [],
        adminNotes: '',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Request for Tamil language support',
        description: 'Please add Tamil language interface to the app. Many devotees in our community prefer Tamil and would find the app more accessible with Tamil support.',
        type: 'feature_request',
        priority: 'medium',
        status: 'open',
        userId: users[0]._id,
        tags: ['tamil', 'language', 'localization', 'accessibility'],
        attachments: [],
        adminNotes: '',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Notification sound not working',
        description: 'I have enabled all notification settings but the app is not playing any sound for new announcements or prayer reminders. Silent notifications are working fine.',
        type: 'bug',
        priority: 'medium',
        status: 'in_progress',
        userId: users[1]._id,
        tags: ['notifications', 'sound', 'alerts', 'settings'],
        attachments: [],
        adminNotes: 'Investigating iOS notification sound permissions. Temporary workaround provided.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Cannot download songs for offline listening',
        description: 'The download option for devotional songs is not working. When I click download, it shows loading but never completes. I need offline access for travel.',
        type: 'bug',
        priority: 'high',
        status: 'resolved',
        userId: users[2]._id,
        tags: ['download', 'offline', 'songs', 'storage'],
        attachments: [],
        adminNotes: 'Fixed download service and increased server capacity for better download performance.',
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Add meditation timer feature',
        description: 'It would be wonderful if you could add a meditation timer with gentle bells and chanting background. This would help many devotees maintain their daily meditation practice.',
        type: 'feature_request',
        priority: 'low',
        status: 'open',
        userId: users[3]._id,
        tags: ['meditation', 'timer', 'bells', 'chanting', 'wellness'],
        attachments: [],
        adminNotes: '',
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
        updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Login issues with social media accounts',
        description: 'Having trouble logging in using Google and Facebook accounts. The login page redirects but then shows an error message. Direct email login works perfectly.',
        type: 'support',
        priority: 'medium',
        status: 'closed',
        userId: users[4]._id,
        tags: ['login', 'social-media', 'google', 'facebook', 'authentication'],
        attachments: [],
        adminNotes: 'Updated OAuth configurations and refreshed API keys. Issue resolved.',
        resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    const insertedTickets = await UserSupport.insertMany(sampleTickets);
    
    // Show statistics
    const stats = await UserSupport.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await UserSupport.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await UserSupport.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

  } catch (error) {
    // Error handling
  } finally {
    await mongoose.disconnect();
  }
}

// Run the function
addSampleSupportData();