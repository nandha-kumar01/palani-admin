#!/usr/bin/env node

/**
 * CLI tool to manage Palani Pathayathirai Admin Panel
 * Usage: node scripts/admin-cli.js [command]
 */

import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const BASE_URL = 'http://localhost:3002';

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function seedData() {
  try {
    console.log('🌱 Seeding sample data...');
    
    const response = await fetch(`${BASE_URL}/api/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sample data seeded successfully!');
      console.log('\n📊 Created:');
      console.log(`- Admin user: ${data.data.admin.email} / ${data.data.admin.password}`);
      console.log(`- Temples: ${data.data.temples}`);
      console.log(`- Annadhanam spots: ${data.data.annadhanam}`);
      console.log(`- Madangal places: ${data.data.madangal}`);
      console.log(`- Sample users: ${data.data.users}`);
      console.log(`\n🌐 Admin Panel: ${BASE_URL}/admin/login`);
    } else {
      const error = await response.text();
      console.log('❌ Failed to seed data:', error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

async function testLogin() {
  try {
    const email = await ask('Enter email: ');
    const password = await ask('Enter password: ');
    
    console.log('🔐 Testing login...');
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful!');
      console.log(`User: ${data.user.name} (${data.user.email})`);
      console.log(`Admin: ${data.user.isAdmin ? 'Yes' : 'No'}`);
    } else {
      const error = await response.json();
      console.log('❌ Login failed:', error.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

async function showMenu() {
  console.log('\n🛕 Palani Pathayathirai Admin CLI');
  console.log('================================');
  console.log('1. Seed sample data');
  console.log('2. Test login');
  console.log('3. Exit');
  
  const choice = await ask('\nSelect option (1-3): ');
  
  switch (choice) {
    case '1':
      await seedData();
      break;
    case '2':
      await testLogin();
      break;
    case '3':
      console.log('👋 Goodbye!');
      rl.close();
      return;
    default:
      console.log('❌ Invalid option');
  }
  
  const continueChoice = await ask('\nPress Enter to continue...');
  showMenu();
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/seed`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running!');
  await showMenu();
}

main().catch(console.error);
