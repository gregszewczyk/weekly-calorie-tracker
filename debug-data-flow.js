/**
 * Debug script to test the data flow from proxy server to app
 * Tests if the issue is in proxy->app communication or app data handling
 */

const fetch = require('node-fetch');
const { format } = require('date-fns');

const PROXY_URL = 'http://10.3.206.134:3006';
const today = format(new Date(), 'yyyy-MM-dd');

async function testProxyConnection() {
  try {
    console.log('🏥 [Debug] Testing proxy server health...');
    const healthResponse = await fetch(`${PROXY_URL}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ [Debug] Proxy server healthy:', health);
    } else {
      console.log('❌ [Debug] Proxy server health check failed:', healthResponse.status);
      return false;
    }

    console.log('📋 [Debug] Checking active sessions...');
    const sessionsResponse = await fetch(`${PROXY_URL}/api/garmin/sessions`);
    if (sessionsResponse.ok) {
      const sessions = await sessionsResponse.json();
      console.log('📊 [Debug] Active sessions:', sessions);
      
      if (sessions.sessions && sessions.sessions.length > 0) {
        const sessionId = sessions.sessions[0].sessionId;
        console.log(`🔑 [Debug] Using session: ${sessionId}`);
        
        console.log(`🔄 [Debug] Testing daily summary for ${today}...`);
        const summaryResponse = await fetch(`${PROXY_URL}/api/garmin/daily-summary/${sessionId}?date=${today}`);
        
        if (summaryResponse.ok) {
          const summary = await summaryResponse.json();
          console.log('📊 [Debug] Daily summary response:', summary);
          
          if (summary.activeCalories && summary.activeCalories > 0) {
            console.log(`✅ [Debug] PROXY WORKING: Got ${summary.activeCalories} active calories`);
            console.log('🎯 [Debug] This confirms proxy can get live data');
          } else {
            console.log('⚠️ [Debug] Proxy returned 0 or no active calories');
          }
        } else {
          console.log('❌ [Debug] Daily summary request failed:', summaryResponse.status);
          const error = await summaryResponse.text();
          console.log('❌ [Debug] Error details:', error.substring(0, 500));
        }
      } else {
        console.log('⚠️ [Debug] No active sessions found - user needs to login');
        return false;
      }
    } else {
      console.log('❌ [Debug] Sessions request failed:', sessionsResponse.status);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ [Debug] Proxy test failed:', error.message);
    return false;
  }
}

async function runDebugTests() {
  console.log('🔧 [Debug] Starting data flow debugging...');
  console.log('📅 [Debug] Testing for date:', today);
  console.log('🌐 [Debug] Proxy URL:', PROXY_URL);
  
  const proxyWorking = await testProxyConnection();
  
  if (proxyWorking) {
    console.log('✅ [Debug] PROXY LAYER: Working correctly');
    console.log('🔍 [Debug] NEXT STEPS: Check app-side data handling');
    console.log('   1. Verify GarminProxyService.getDailySummary() calls');
    console.log('   2. Check CalorieStore.syncGarminActiveCalories() processing');
    console.log('   3. Verify UI component data binding');
  } else {
    console.log('❌ [Debug] PROXY LAYER: Issues detected');
    console.log('🔍 [Debug] NEXT STEPS: Fix proxy authentication/connection');
  }
}

runDebugTests().catch(console.error);