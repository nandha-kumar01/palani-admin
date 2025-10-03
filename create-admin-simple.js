const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create User schema directly
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

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://marinandhu659:X1BMVtt0fnEFHrxb@cluster0.rlgy9uh.mongodb.net/palani_pathayathirai');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@palani.com' });
    if (existingAdmin) {
      // Test login credentials
      const isPasswordValid = await bcrypt.compare('admin123', existingAdmin.password);
      
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = new User({
      name: 'Admin',
      email: 'admin@palani.com',
      phone: '+91-9876543210',
      password: hashedPassword,
      isAdmin: true,
      isActive: true,
      isVerified: true
    });

    await adminUser.save();
    
  } catch (error) {
  } finally {
    await mongoose.disconnect();
  }
}

createAdminUser();