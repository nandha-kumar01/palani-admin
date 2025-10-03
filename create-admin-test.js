// Quick admin creation script for testing
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://marinandhu659:X1BMVtt0fnEFHrxb@cluster0.rlgy9uh.mongodb.net/palani_pathayathirai';

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  plainPassword: String,
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);

    const adminEmail = 'admin@palani.com';
    const adminPassword = 'admin123';

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      // Update admin status if needed
      if (!existingAdmin.isAdmin) {
        await User.updateOne({ email: adminEmail }, { isAdmin: true });
      }
      
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const adminUser = new User({
      name: 'Admin',
      email: adminEmail,
      phone: '+91-9876543210',
      password: hashedPassword,
      plainPassword: adminPassword, // For testing purposes
      isAdmin: true,
      isActive: true,
    });

    await adminUser.save();

  } catch (error) {
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

// Also check all users in the database
async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    const users = await User.find({}, 'name email isAdmin isActive');
  } catch (error) {
  } finally {
    await mongoose.disconnect();
  }
}

// Run based on command line argument
const action = process.argv[2] || 'create';

if (action === 'check') {
  checkUsers();
} else {
  createAdmin();
}