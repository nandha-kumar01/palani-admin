// Script to create admin user
// Run with: node scripts/create-admin.js

import dbConnect from '../src/lib/mongodb.js';
import User from '../src/models/User.js';
import { hashPassword } from '../src/lib/auth.js';

async function createAdminUser() {
  try {
    await dbConnect();
    
    const adminEmail = 'admin@palani.com';
    const adminPassword = 'admin123';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      return;
    }
    
    // Create admin user
    const hashedPassword = await hashPassword(adminPassword);
    
    const adminUser = new User({
      name: 'Admin',
      email: adminEmail,
      phone: '+91-9876543210',
      password: hashedPassword,
      isAdmin: true,
    });
    
    await adminUser.save();
    
  } catch (error) {
    // Error handling
  } finally {
    process.exit();
  }
}

createAdminUser();
