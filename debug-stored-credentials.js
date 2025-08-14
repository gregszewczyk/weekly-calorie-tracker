/**
 * Debug script to check stored credentials and session persistence
 */

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function checkStoredData() {
  console.log('🔧 [Debug] Checking stored credentials and sessions...');
  
  try {
    // Check for Garmin credentials
    console.log('🔑 [Debug] Checking stored Garmin credentials...');
    const credentialsKey = '@garmin_credentials_v2';
    const storedCredentials = await AsyncStorage.getItem(credentialsKey);
    console.log('📊 [Debug] Stored credentials:', storedCredentials ? 'EXISTS' : 'NULL');
    
    if (storedCredentials) {
      const parsed = JSON.parse(storedCredentials);
      console.log('🔍 [Debug] Credentials info:', {
        username: parsed.username || 'missing',
        hasPassword: !!parsed.encryptedPassword,
        consentTimestamp: parsed.consentTimestamp ? new Date(parsed.consentTimestamp).toISOString() : 'missing',
        lastUsed: parsed.lastUsed ? new Date(parsed.lastUsed).toISOString() : 'missing',
        durationDays: parsed.consentDurationDays || 'missing'
      });
      
      // Check if consent is still valid
      if (parsed.consentTimestamp && parsed.consentDurationDays) {
        const consentExpiry = new Date(parsed.consentTimestamp + (parsed.consentDurationDays * 24 * 60 * 60 * 1000));
        const isExpired = consentExpiry < new Date();
        console.log('⏰ [Debug] Consent expiry:', consentExpiry.toISOString());
        console.log('✅ [Debug] Consent valid:', !isExpired);
      }
    }
    
    // Check for Garmin proxy session
    console.log('🔗 [Debug] Checking stored Garmin proxy session...');
    const sessionKey = '@garmin_proxy_session';
    const storedSession = await AsyncStorage.getItem(sessionKey);
    console.log('📊 [Debug] Stored session:', storedSession ? 'EXISTS' : 'NULL');
    
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      console.log('🔍 [Debug] Session info:', {
        sessionId: parsed.sessionId || 'missing',
        userProfile: parsed.userProfile ? parsed.userProfile.userName || 'missing' : 'missing',
        loginTime: parsed.loginTime ? new Date(parsed.loginTime).toISOString() : 'missing'
      });
      
      // Check if session is expired (24 hours)
      if (parsed.loginTime) {
        const sessionExpiry = new Date(parsed.loginTime + (24 * 60 * 60 * 1000));
        const isExpired = sessionExpiry < new Date();
        console.log('⏰ [Debug] Session expiry:', sessionExpiry.toISOString());
        console.log('✅ [Debug] Session valid:', !isExpired);
      }
    }
    
    // Check for health device connections
    console.log('🏥 [Debug] Checking stored health device connections...');
    const connectionsKey = '@health_device_connections';
    const storedConnections = await AsyncStorage.getItem(connectionsKey);
    console.log('📊 [Debug] Stored connections:', storedConnections ? 'EXISTS' : 'NULL');
    
    if (storedConnections) {
      const parsed = JSON.parse(storedConnections);
      console.log('🔍 [Debug] Connections info:', parsed.map(conn => ({
        platform: conn.platform,
        status: conn.status,
        deviceName: conn.deviceName,
        connectedAt: conn.connectedAt ? new Date(conn.connectedAt).toISOString() : 'missing'
      })));
    }
    
  } catch (error) {
    console.error('❌ [Debug] Error checking stored data:', error.message);
  }
}

// Note: This won't work in Node.js since AsyncStorage is React Native specific
// This is conceptual code to show what we need to check
console.log('⚠️ [Debug] This debug script is conceptual - AsyncStorage only works in React Native');
console.log('🔍 [Debug] To debug this properly, add similar logging to the app startup');

checkStoredData().catch(console.error);