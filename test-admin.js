// Test script to check/create admin user
const https = require('https');
const http = require('http');

// Test admin login
function testAdminLogin() {
  const postData = JSON.stringify({
    email: 'admin@palani.com',
    password: 'admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      try {
        const response = JSON.parse(data);
        if (response.accessToken) {
          console.log('✅ Admin login successful!');
          console.log('Token:', response.accessToken.substring(0, 20) + '...');
        } else {
          console.log('❌ Admin login failed:', response.error);
        }
      } catch (e) {
        console.log('Error parsing response:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

console.log('Testing admin login...');
testAdminLogin();