// Script to fix user passwords and ensure admin exists
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function fixPasswords() {
  try {
    // Use your actual MongoDB connection string here
    // Replace with your actual MongoDB URI
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/palani';
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    let fixedCount = 0;
    
    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2)
      if (!user.password.startsWith('$2')) {
        console.log(`Fixing password for user: ${user.email}`);
        const hashedPassword = await hashPassword(user.password);
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });
        fixedCount++;
      } else {
        console.log(`Password already hashed for user: ${user.email}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} passwords`);
    
    // Ensure admin user exists
    const adminEmail = 'admin@palani.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      console.log('Creating admin user...');
      const hashedPassword = await hashPassword('admin123');
      
      const adminUser = new User({
        name: 'Admin',
        email: adminEmail,
        phone: '+91-9876543210',
        password: hashedPassword,
        isAdmin: true,
      });
      
      await adminUser.save();
      console.log('Admin user created successfully!');
      console.log('Email: admin@palani.com');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists');
    }
    
    // List all users
    const allUsers = await User.find({});
    console.log('\nAll users:');
    allUsers.forEach(user => {
      const passwordType = user.password.startsWith('$2') ? 'HASHED (bcrypt)' : 'PLAIN TEXT';
      console.log(`Email: ${user.email}, Password type: ${passwordType}, IsAdmin: ${user.isAdmin}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

console.log('Starting password fix and admin creation...');
console.log('Make sure to set the correct MONGODB_URI environment variable or update the script with your MongoDB connection string');
fixPasswords();
