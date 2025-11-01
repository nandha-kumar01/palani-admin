const mongoose = require('mongoose');

// Define User Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  mobile: String,
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Define Device Schema
const deviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  mobile: String,
  deviceModel: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['Android', 'iOS'],
    required: true
  },
  appVersion: String,
  osVersion: String,
  ipAddress: String,
  userAgent: String,
  installationSource: {
    type: String,
    enum: ['Play Store', 'App Store', 'Web'],
    required: true
  },
  location: {
    country: String,
    state: String,
    city: String,
    latitude: Number,
    longitude: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  installationDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Device = mongoose.models.Device || mongoose.model('Device', deviceSchema);

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUri = 'mongodb+srv://marinandhu659:X1BMVtt0fnEFHrxb@cluster0.rlgy9uh.mongodb.net/palani_pathayathirai';
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Sample device data
const deviceModels = [
  'Samsung Galaxy S23', 'iPhone 15', 'OnePlus 11', 'Google Pixel 8',
  'Xiaomi 13', 'Vivo V29', 'Oppo Find X6', 'Realme GT 3',
  'Nothing Phone (2)', 'Motorola Edge 40', 'Samsung Galaxy A54',
  'iPhone 14', 'Redmi Note 12', 'Honor 90', 'iQOO 11'
];

const platforms = ['Android', 'iOS'];
const sources = ['Play Store', 'App Store'];
const countries = ['India', 'USA', 'Canada', 'UK', 'Australia'];
const states = ['Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Maharashtra'];
const cities = ['Chennai', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Coimbatore'];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateIPAddress() {
  return `${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

async function createSampleUsers() {
  const users = [];
  
  for (let i = 1; i <= 50; i++) {
    const user = {
      username: `user${i}`,
      email: `user${i}@example.com`,
      mobile: `+91${9000000000 + i}`,
      role: 'user',
      isActive: Math.random() > 0.1, // 90% active users
      createdAt: getRandomDate(new Date(2023, 0, 1), new Date())
    };
    users.push(user);
  }

  try {
    await User.deleteMany({}); // Clear existing users
    const createdUsers = await User.insertMany(users);
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    return [];
  }
}

async function createSampleDevices(users) {
  const devices = [];
  
  // Create 1-3 devices per user
  for (const user of users) {
    const deviceCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 devices
    
    for (let i = 0; i < deviceCount; i++) {
      const platform = getRandomItem(platforms);
      const installationDate = getRandomDate(user.createdAt, new Date());
      const lastSeen = getRandomDate(installationDate, new Date());
      
      const device = {
        userId: user._id,
        username: user.username,
        mobile: user.mobile,
        deviceModel: getRandomItem(deviceModels),
        platform: platform,
        appVersion: platform === 'iOS' ? '1.2.0' : '1.1.5',
        osVersion: platform === 'iOS' ? 
          `iOS ${Math.floor(Math.random() * 3) + 16}.${Math.floor(Math.random() * 10)}` :
          `Android ${Math.floor(Math.random() * 4) + 11}`,
        ipAddress: generateIPAddress(),
        userAgent: platform === 'iOS' ? 
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' :
          'Mozilla/5.0 (Linux; Android 13; SM-G981B)',
        installationSource: platform === 'iOS' ? 'App Store' : 'Play Store',
        location: {
          country: getRandomItem(countries),
          state: getRandomItem(states),
          city: getRandomItem(cities),
          latitude: 13.0827 + (Math.random() - 0.5) * 0.1, // Around Chennai
          longitude: 80.2707 + (Math.random() - 0.5) * 0.1
        },
        isActive: Math.random() > 0.2, // 80% active devices
        lastSeen: lastSeen,
        installationDate: installationDate,
        createdAt: installationDate,
        updatedAt: lastSeen
      };
      
      devices.push(device);
    }
  }

  try {
    await Device.deleteMany({}); // Clear existing devices
    const createdDevices = await Device.insertMany(devices);
    return createdDevices;
  } catch (error) {
    console.error('❌ Error creating devices:', error);
    return [];
  }
}

async function seedDatabase() {
  try {
    await connectDB();
    
    // Create sample users
    const users = await createSampleUsers();
    if (users.length === 0) {
      return;
    }
    
    // Create sample devices
    const devices = await createSampleDevices(users);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();

  }
}

// Run the seeding process
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };