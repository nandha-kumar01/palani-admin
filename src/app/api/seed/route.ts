import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Temple from '@/models/Temple';
import Annadhanam from '@/models/Annadhanam';
import Madangal from '@/models/Madangal';
import { hashPassword } from '@/lib/auth';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Create admin user
    const adminEmail = 'admin@palani.com';
    const existingAdmin = await withTimeout(User.findOne({ email: adminEmail }).maxTimeMS(10000), 15000, 'Database operation timeout');
    
    if (!existingAdmin) {
      const hashedPassword = await hashPassword('admin123');
      
      const adminUser = new User({
        name: 'Admin',
        email: adminEmail,
        phone: '+91-9876543210',
        password: hashedPassword,
        isAdmin: true,
      });
      
      await withTimeout(adminUser.save(), 15000, 'Database operation timeout');
    }
    
    // Create sample temples
    const sampleTemples = [
      {
        name: 'Arulmigu Dhandayuthapani Swamy Temple',
        description: 'The main temple dedicated to Lord Murugan at Palani',
        location: {
          latitude: 10.4475,
          longitude: 77.5227,
          address: 'Palani Hill, Palani, Tamil Nadu 624601'
        },
        deity: 'Lord Murugan',
        timings: {
          opening: '04:00',
          closing: '22:00',
        },
        contact: {
          phone: '+91-4545-241203',
          email: 'info@palanimurugan.org',
        },
        specialFeatures: ['Panchamirtham', 'Hill Temple', 'Abhishekam'],
        facilities: ['Parking', 'Drinking Water', 'Restrooms', 'Prasadam Counter'],
        isActive: true,
      },
      {
        name: 'Thiru Avinankudi Temple',
        description: 'Ancient temple dedicated to Lord Murugan',
        location: {
          latitude: 10.4395,
          longitude: 77.5167,
          address: 'Avinankudi, Palani, Tamil Nadu'
        },
        deity: 'Lord Murugan',
        timings: {
          opening: '06:00',
          closing: '20:00',
        },
        contact: {
          phone: '+91-4545-241204',
          email: 'avinankudi@temple.org',
        },
        specialFeatures: ['Ancient Architecture', 'Peaceful Environment'],
        facilities: ['Parking', 'Drinking Water'],
        isActive: true,
      }
    ];
    
    // Insert temples if they don't exist
    for (const templeData of sampleTemples) {
      const existingTemple = await withTimeout(Temple.findOne({ name: templeData.name }).maxTimeMS(10000), 15000, 'Database operation timeout');
      if (!existingTemple) {
        const temple = new Temple(templeData);
        await withTimeout(temple.save(), 15000, 'Database operation timeout');
      }
    }
    
    // Create sample Annadhanam spots
    const sampleAnnadhanam = [
      {
        name: 'Palani Temple Annadhanam',
        description: 'Free food service at the main temple',
        location: {
          latitude: 10.4475,
          longitude: 77.5227,
          address: 'Palani Hill, Palani, Tamil Nadu 624601'
        },
        timings: [
          {
            day: 'Monday',
            startTime: '12:00',
            endTime: '14:00',
            isAvailable: true,
          },
          {
            day: 'Tuesday',
            startTime: '12:00',
            endTime: '14:00',
            isAvailable: true,
          },
          {
            day: 'Wednesday',
            startTime: '12:00',
            endTime: '14:00',
            isAvailable: true,
          },
          {
            day: 'Thursday',
            startTime: '12:00',
            endTime: '14:00',
            isAvailable: true,
          },
          {
            day: 'Friday',
            startTime: '12:00',
            endTime: '14:00',
            isAvailable: true,
          },
          {
            day: 'Saturday',
            startTime: '12:00',
            endTime: '14:00',
            isAvailable: true,
          },
          {
            day: 'Sunday',
            startTime: '12:00',
            endTime: '14:00',
            isAvailable: true,
          }
        ],
        foodType: 'lunch',
        capacity: 500,
        organizer: {
          name: 'Temple Trust',
          contact: '+91-4545-241203',
        },
        isActive: true,
      }
    ];
    
    // Insert annadhanam spots if they don't exist
    for (const annadhanamData of sampleAnnadhanam) {
      const existingAnnadhanam = await withTimeout(Annadhanam.findOne({ name: annadhanamData.name }).maxTimeMS(10000), 15000, 'Database operation timeout');
      if (!existingAnnadhanam) {
        const annadhanam = new Annadhanam(annadhanamData);
        await withTimeout(annadhanam.save(), 15000, 'Database operation timeout');
      }
    }
    
    // Create sample Madangal (stay places)
    const sampleMadangal = [
      {
        name: 'Palani Pilgrim Rest House',
        description: 'Comfortable stay for devotees',
        location: {
          latitude: 10.4445,
          longitude: 77.5197,
          address: 'Near Temple, Palani, Tamil Nadu 624601'
        },
        capacity: 100,
        facilities: ['Bed', 'Bathroom', 'Drinking Water', 'Parking'],
        cost: 0,
        costType: 'free',
        contact: {
          name: 'Rest House Manager',
          phone: '+91-4545-241205',
          email: 'resthouse@palani.org',
        },
        checkInTime: '14:00',
        checkOutTime: '12:00',
        isActive: true,
      }
    ];
    
    // Insert madangal if they don't exist
    for (const madangalData of sampleMadangal) {
      const existingMadangal = await withTimeout(Madangal.findOne({ name: madangalData.name }).maxTimeMS(10000), 15000, 'Database operation timeout');
      if (!existingMadangal) {
        const madangal = new Madangal(madangalData);
        await withTimeout(madangal.save(), 15000, 'Database operation timeout');
      }
    }
    
    // Create some sample users
    const sampleUsers = [
      {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+91-9876543210',
        password: await hashPassword('123456'),
        pathayathiraiStatus: 'not_started',
        isTracking: false,
        totalDistance: 0,
      },
      {
        name: 'Ravi Kumar',
        email: 'ravi@example.com',
        phone: '+91-9876543211',
        password: await hashPassword('user123'),
        pathayathiraiStatus: 'in_progress',
        isTracking: true,
        currentLocation: {
          latitude: 10.4400,
          longitude: 77.5200,
          timestamp: new Date(),
        },
        totalDistance: 15000, // 15km
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+91-9876543212',
        password: await hashPassword('user123'),
        pathayathiraiStatus: 'completed',
        isTracking: false,
        totalDistance: 45000, // 45km
      },
      {
        name: 'Suresh Babu',
        email: 'suresh@example.com',
        phone: '+91-9876543213',
        password: await hashPassword('user123'),
        pathayathiraiStatus: 'in_progress',
        isTracking: true,
        currentLocation: {
          latitude: 10.4300,
          longitude: 77.5100,
          timestamp: new Date(),
        },
        totalDistance: 8000, // 8km
      }
    ];
    
    // Insert sample users if they don't exist
    for (const userData of sampleUsers) {
      const existingUser = await withTimeout(User.findOne({ email: userData.email }).maxTimeMS(10000), 15000, 'Database operation timeout');
      if (!existingUser) {
        const user = new User(userData);
        await withTimeout(user.save(), 15000, 'Database operation timeout');
      }
    }
    

    
    return NextResponse.json({
      message: 'Sample data seeded successfully',
      data: {
        admin: { email: adminEmail, password: 'admin123' },
        temples: sampleTemples.length,
        annadhanam: sampleAnnadhanam.length,
        madangal: sampleMadangal.length,
        users: sampleUsers.length,
      }
    });
    
  } catch (error: any) {

    return NextResponse.json({ success: false, error: 'Failed to seed data', details: error.message },
      { status: 500 }
    );
  }
}
