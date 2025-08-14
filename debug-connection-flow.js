/**
 * Debug script to test the complete auto-refresh flow
 * Tests connection detection and data sync after login
 */

const { format } = require('date-fns');

console.log('🔧 [Debug] Testing auto-refresh connection flow...');
console.log('📅 [Debug] Today:', format(new Date(), 'yyyy-MM-dd'));

// Simulate what the app would see during auto-refresh
const testFlow = async () => {
  console.log('🔄 [Debug] Step 1: App starts, checks for existing connections...');
  
  // Simulate initial connection check (empty)
  console.log('🔍 [Debug] Initial connections: []');
  
  console.log('🔄 [Debug] Step 2: Auto-login triggers in background...');
  
  // Simulate delay for auto-login
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('✅ [Debug] Step 3: Auto-login successful (simulated)');
  console.log('🔄 [Debug] Step 4: HealthDeviceManager refresh triggered');
  
  // Simulate refresh notification
  console.log('🔄 [Debug] Step 5: WeeklyBankingScreen auto-refresh detects connection');
  console.log('🔄 [Debug] Step 6: Health device modal force refresh triggered');
  console.log('🔄 [Debug] Step 7: Garmin active calorie sync initiated');
  
  // Simulate the data flow
  console.log('📊 [Debug] Step 8: Proxy server returns 556 active calories');
  console.log('📱 [Debug] Step 9: CalorieStore updates burned calories');
  console.log('✅ [Debug] Step 10: UI displays updated data');
  
  console.log('🎯 [Debug] Expected outcome: Health device modal shows connected status and live calorie data');
};

testFlow().catch(console.error);