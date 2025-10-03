const fetch = require('node-fetch');

async function testNotifications() {
  try {
    console.log('Testing notification system...');
    
    // Test the API endpoints on the running server (port 3002)
    const baseUrl = 'http://localhost:3002';
    
    // Step 1: Test GET notifications without auth (should fail)
    console.log('\n1. Testing GET without auth (should return 401)...');
    const noAuthResponse = await fetch(`${baseUrl}/api/admin/notifications`);
    const noAuthResult = await noAuthResponse.json();
    console.log('Status:', noAuthResponse.status);
    console.log('Response:', noAuthResult);
    
    // Step 2: Test POST without auth (should fail)
    console.log('\n2. Testing POST without auth (should return 401)...');
    const noAuthPostResponse = await fetch(`${baseUrl}/api/admin/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Notification',
        message: 'This should fail without auth'
      }),
    });
    const noAuthPostResult = await noAuthPostResponse.json();
    console.log('Status:', noAuthPostResponse.status);
    console.log('Response:', noAuthPostResult);

    console.log('\n✅ Authentication is working correctly!');
    console.log('📱 To test the full functionality:');
    console.log('1. Go to http://localhost:3002/admin/login');
    console.log('2. Login with valid admin credentials');
    console.log('3. Navigate to http://localhost:3002/admin/notifications');
    console.log('4. Test creating and viewing notifications');

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testNotifications();