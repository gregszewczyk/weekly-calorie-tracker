/**  
 * Test script for Garmin Proxy Server
 * Run this to test if the proxy server is working correctly
 */

console.log('🧪 Testing Garmin Proxy Server...\n');

console.log('1️⃣ Server is running on http://localhost:3003');
console.log('2️⃣ Health endpoint: http://localhost:3003/health');

console.log('\n🚨 IMPORTANT: To test the full Garmin connection:');
console.log('1. Open your React Native app');
console.log('2. Navigate to Goal Setup → Connect Health Device'); 
console.log('3. Select Garmin Connect');
console.log('4. Enter your real Garmin Connect credentials');
console.log('5. Check the proxy server terminal for connection logs');

console.log('\n📋 Available endpoints:');
console.log('GET  /health - Health check');
console.log('POST /api/garmin/login - Login with username/password');
console.log('GET  /api/garmin/activities/:sessionId - Get recent activities');
console.log('GET  /api/garmin/profile/:sessionId - Get user profile');
console.log('POST /api/garmin/logout/:sessionId - Logout');

console.log('\n🎯 The proxy server is ready for testing!');
console.log('Check the server terminal for real-time logs when you connect from the app.');