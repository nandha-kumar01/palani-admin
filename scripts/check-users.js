// Script to check existing users and their password format
const mongoose = require('mongoose');

// Database connection
async function dbConnect() {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/palani');
  } catch (error) {
    throw error;
  }
}

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    await dbConnect();
    const users = await User.find({});
    
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

checkUsers();
