#!/usr/bin/env node

// Simple environment check script for Vercel builds
const fs = require('fs');
const path = require('path');

// Load .env.local if it exists (for local development)
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !process.env[key]) {
      process.env[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
    }
  });
}

const requiredVars = [
  'MONGODB_URI',
  'NEXTAUTH_SECRET',
  'JWT_SECRET',
  'FIREBASE_PROJECT_ID',
  'CLOUDINARY_CLOUD_NAME',
];



const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(varName => {
    console.error(`  - ${varName}`);
  });
  console.error('\n💡 To fix this in Vercel:');
  console.error('1. Go to your Vercel project dashboard');
  console.error('2. Navigate to Settings → Environment Variables');
  console.error('3. Add the missing variables with their values');
  process.exit(1);
}

