// Script to add sample support ticket data
// Run with: node scripts/add-sample-support-data.js

const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://marinandhu659:X1BMVtt0fnEFHrxb@cluster0.rlgy9uh.mongodb.net/palani_pathayathirai';

// Define User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Define UserSupport Schema
const userSupportSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [{ type: String, trim: true }],
  attachments: [{ type: String, trim: true }],
  adminNotes: { type: String, default: '', maxlength: 1000 },
  userRating: { type: Number, min: 1, max: 5 },
  resolvedAt: { type: Date }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const UserSupport = mongoose.models.UserSupport || mongoose.model('UserSupport', userSupportSchema);

async function addSampleSupportData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('🔌 Connected to database');

    // Get or create sample users first
    let users = await User.find({ isAdmin: false }).limit(5);
    
    if (users.length < 5) {
      console.log('📝 Creating additional sample users...');
      
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
      console.log('✅ Sample users created:', users.length);
    } else {
      console.log('✅ Using existing users:', users.length);
    }

    // Check if support tickets already exist
    const existingTickets = await UserSupport.countDocuments();
    if (existingTickets > 0) {
      console.log('⚠️ Support tickets already exist. Clearing existing data first...');
      await UserSupport.deleteMany({});
      console.log('🗑️ Existing tickets cleared');
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
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'How to join multiple temple groups?',
        description: 'I want to follow multiple temples in different cities. How can I join multiple temple groups? Is there a limit on how many groups I can join?',
        type: 'general_inquiry',
        priority: 'low',
        status: 'resolved',
        userId: users[2]._id,
        tags: ['groups', 'temples', 'help'],
        attachments: [],
        adminNotes: 'Provided step-by-step guide via email. User can join up to 10 temple groups.',
        resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        userRating: 5,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Location tracking not working',
        description: 'The location tracking feature is not working properly. It shows wrong location even when GPS is enabled. This is affecting the temple visit logs.',
        type: 'technical_support',
        priority: 'high',
        status: 'in_progress',
        userId: users[3]._id,
        tags: ['location', 'gps', 'tracking'],
        attachments: [],
        adminNotes: 'Investigating GPS accuracy issues. User provided device details.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      },
      {
        title: 'Cannot reset my password',
        description: 'I forgot my password and the reset email is not arriving in my inbox. I checked spam folder too. Please help me reset my password manually.',
        type: 'account_issue',
        priority: 'medium',
        status: 'resolved',
        userId: users[4]._id,
        tags: ['password', 'email', 'reset'],
        attachments: [],
        adminNotes: 'Password reset manually. User notified via phone call.',
        resolvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        userRating: 4,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        title: 'Audio playback stops during prayers',
        description: 'When playing devotional songs during temple visits, the audio stops automatically after 2-3 minutes. This is very disturbing during prayer time.',
        type: 'bug',
        priority: 'high',
        status: 'open',
        userId: users[0]._id,
        tags: ['audio', 'playback', 'prayers', 'songs'],
        attachments: [],
        adminNotes: '',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        title: 'Add Tamil language support',
        description: 'Please add Tamil language support to the app. Many devotees in Tamil Nadu find it difficult to use the app in English only.',
        type: 'feature_request',
        priority: 'medium',
        status: 'open',
        userId: users[1]._id,
        tags: ['tamil', 'language', 'localization'],
        attachments: [],
        adminNotes: '',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
      },
      {
        title: 'Temple timings are wrong',
        description: 'The temple timings shown in the app are outdated. Please update the morning and evening darshan timings for Palani Murugan Temple.',
        type: 'general_inquiry',
        priority: 'medium',
        status: 'resolved',
        userId: users[2]._id,
        tags: ['temple', 'timings', 'update'],
        attachments: [],
        adminNotes: 'Updated temple timings based on official temple website.',
        resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        userRating: 5,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        title: 'Push notifications not working',
        description: 'I am not receiving push notifications for temple events and announcements. I have enabled notifications in settings but still not getting any alerts.',
        type: 'technical_support',
        priority: 'medium',
        status: 'in_progress',
        userId: users[3]._id,
        tags: ['notifications', 'push', 'alerts'],
        attachments: [],
        adminNotes: 'Checking notification service configuration. User device registered.',
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        title: 'Profile picture upload fails',
        description: 'Cannot upload profile picture. Shows "Upload failed" error every time. Tried with different image formats but same issue persists.',
        type: 'bug',
        priority: 'low',
        status: 'closed',
        userId: users[4]._id,
        tags: ['profile', 'upload', 'image'],
        attachments: [],
        adminNotes: 'Issue was due to file size limit. User guided to compress image.',
        resolvedAt: new Date(Date.now() - 30 * 60 * 1000),
        userRating: 3,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        updatedAt: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];

    console.log('📝 Creating sample support tickets...');
    const tickets = await UserSupport.insertMany(sampleTickets);
    
    console.log('✅ Sample support tickets created successfully!');
    console.log(`📊 Total tickets created: ${tickets.length}`);
    
    // Show summary
    const stats = await UserSupport.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📈 Ticket Status Summary:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} tickets`);
    });

    const typeStats = await UserSupport.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📋 Ticket Type Summary:');
    typeStats.forEach(stat => {
      const typeLabels = {
        bug: 'Bug Reports',
        feature_request: 'Feature Requests',
        general_inquiry: 'General Inquiries',
        technical_support: 'Technical Support',
        account_issue: 'Account Issues'
      };
      console.log(`   ${typeLabels[stat._id]}: ${stat.count} tickets`);
    });

    console.log('\n🎉 Sample data creation completed!');
    console.log('🌐 You can now view the tickets in the admin panel at: http://localhost:3001/admin/user-support');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
}

addSampleSupportData();