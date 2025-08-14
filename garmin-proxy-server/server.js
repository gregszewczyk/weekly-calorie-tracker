/**
 * Backend Proxy Service for Garmin Connect Integration
 * 
 * This Node.js/Express service acts as a proxy between your React Native app
 * and Garmin Connect, handling the authentication and API calls that don't
 * work properly in the Hermes engine environment.
 */

const express = require('express');
const cors = require('cors');
const { GarminConnect } = require('garmin-connect');

const app = express();
const port = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());

// Store active sessions (in production, use Redis or similar)
const sessions = new Map();

// Session cleanup every hour
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastUsed > 3600000) { // 1 hour
      sessions.delete(sessionId);
    }
  }
}, 3600000);

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Generate realistic mock daily data with variation based on date
 * Simulates different activity levels: rest days, moderate days, high-intensity days
 */
function generateMockDailyData(dateString) {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Create consistent "random" variation based on date
  const seed = date.getDate() + date.getMonth() * 31;
  const random = (seed * 9301 + 49297) % 233280 / 233280; // Simple deterministic random
  
  let baseActivityLevel;
  let activityType;
  
  // Sunday = rest day, Saturday = moderate, weekdays vary
  if (dayOfWeek === 0) { // Sunday - rest day
    baseActivityLevel = 0.3 + random * 0.2; // 300-500 calories
    activityType = 'rest';
  } else if (dayOfWeek === 6) { // Saturday - long workout day
    baseActivityLevel = 1.8 + random * 0.4; // 1800-2200 calories
    activityType = 'long_workout';
  } else if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) { // Mon, Wed, Fri - strength days
    baseActivityLevel = 1.2 + random * 0.6; // 1200-1800 calories
    activityType = 'strength';
  } else { // Tue, Thu - cardio days
    baseActivityLevel = 1.4 + random * 0.5; // 1400-1900 calories
    activityType = 'cardio';
  }
  
  const activeCalories = Math.round(baseActivityLevel * 1000);
  const totalCalories = activeCalories + 1800; // BMR + active
  
  // Scale other metrics based on activity level
  const activityMultiplier = baseActivityLevel;
  
  console.log(`📊 [MockData] ${dateString} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}) - ${activityType}: ${activeCalories} active calories`);
  
  return {
    activeCalories,
    totalCalories,
    steps: Math.round(5000 + activityMultiplier * 7000), // 5k-19k steps
    distance: Math.round(activityMultiplier * 10000), // 0-18km in meters
    floors: Math.round(activityMultiplier * 20), // 0-36 floors
    moderateMinutes: Math.round(activityMultiplier * 30), // 0-54 minutes
    vigorousMinutes: Math.round(activityMultiplier * 25), // 0-45 minutes
    activityType
  };
}

/**
 * Calculate activity intensity for AI analysis
 * Returns: 'low', 'moderate', 'high', 'very_high'
 */
function calculateActivityIntensity(activity) {
  let score = 0;
  
  // Calorie burn rate (calories per minute)
  const caloriesPerMinute = activity.calories && activity.duration ? 
    activity.calories / (activity.duration / 60) : 0;
  
  // Score based on calorie burn rate
  if (caloriesPerMinute > 15) score += 3;
  else if (caloriesPerMinute > 10) score += 2;
  else if (caloriesPerMinute > 5) score += 1;
  
  // Score based on heart rate zones (if available)
  if (activity.averageHR) {
    if (activity.averageHR > 160) score += 3;
    else if (activity.averageHR > 140) score += 2;
    else if (activity.averageHR > 120) score += 1;
  }
  
  // Score based on training effects
  if (activity.aerobicTrainingEffect > 3) score += 2;
  else if (activity.aerobicTrainingEffect > 2) score += 1;
  
  if (activity.anaerobicTrainingEffect > 2) score += 2;
  else if (activity.anaerobicTrainingEffect > 1) score += 1;
  
  // Score based on duration (longer activities can be less intense but still valuable)
  const durationMinutes = activity.duration / 60;
  if (durationMinutes > 90) score += 1;
  else if (durationMinutes > 60) score += 0.5;
  
  // Convert score to intensity level
  if (score >= 6) return 'very_high';
  if (score >= 4) return 'high';
  if (score >= 2) return 'moderate';
  return 'low';
}

/**
 * Login endpoint
 * POST /api/garmin/login
 * Body: { username: string, password: string }
 */
app.post('/api/garmin/login', async (req, res) => {
  try {
    console.log('📥 [GarminProxy] Received login request');
    console.log('📋 [GarminProxy] Request headers:', req.headers);
    console.log('📋 [GarminProxy] Request body:', req.body);
    console.log('📋 [GarminProxy] Body type:', typeof req.body);
    console.log('📋 [GarminProxy] Body keys:', Object.keys(req.body || {}));
    
    const { username, password } = req.body;
    
    console.log('👤 [GarminProxy] Username received:', !!username, 'Length:', username?.length || 0);
    console.log('🔐 [GarminProxy] Password received:', !!password, 'Length:', password?.length || 0);
    
    if (!username || !password) {
      console.log('❌ [GarminProxy] Missing credentials - username:', !!username, 'password:', !!password);
      return res.status(400).json({ 
        error: 'Username and password are required',
        debug: { 
          receivedUsername: !!username, 
          receivedPassword: !!password,
          bodyKeys: Object.keys(req.body || {}),
          bodyType: typeof req.body
        }
      });
    }

    console.log('🔐 [GarminProxy] Login attempt for:', username);
    
    // Create new Garmin Connect client
    const gc = new GarminConnect({ username, password });
    await gc.login();
    
    // Get user profile immediately after login
    console.log('👤 [GarminProxy] Fetching user profile after login...');
    const userSettings = await gc.getUserSettings();
    
    const userProfile = {
      id: userSettings.id || 0,
      profileId: userSettings.profileId || 0,
      fullName: userSettings.displayName || username,
      userName: username,
      displayName: userSettings.displayName || username,
      profileImageUrlSmall: userSettings.profileImageUrlSmall,
      profileImageUrlMedium: userSettings.profileImageUrlMedium,
      profileImageUrlLarge: userSettings.profileImageUrlLarge,
    };
    
    // Generate session ID
    const sessionId = generateSessionId();
    
    // Store session with user profile
    sessions.set(sessionId, {
      gc,
      username,
      userProfile,
      lastUsed: Date.now(),
      authenticated: true
    });

    console.log('✅ [GarminProxy] Login successful, session:', sessionId);
    console.log('👤 [GarminProxy] User profile loaded:', userProfile.displayName);
    
    res.json({
      success: true,
      sessionId,
      userProfile,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('❌ [GarminProxy] Login failed:', error.message);
    res.status(401).json({
      success: false,
      error: 'Login failed: ' + error.message
    });
  }
});

/**
 * Get activities endpoint - FOR TDEE SETUP ONLY
 * GET /api/garmin/activities/:sessionId?days=14
 * Used during initial TDEE calculation to get 14 days of historical active calories
 * Should only be called once during setup, not for daily banking
 */
app.get('/api/garmin/activities/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const days = parseInt(req.query.days) || 14;
    
    const session = sessions.get(sessionId);
    if (!session || !session.authenticated) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    // Update last used time
    session.lastUsed = Date.now();
    
    console.log(`📊 [GarminProxy] Fetching activities for last ${days} days`);
    
    // Increase limit for 14 days to ensure we get all activities
    const limit = Math.min(days * 3, 100); // Allow up to 100 activities for comprehensive data
    const activities = await session.gc.getActivities(0, limit);
    
    // Filter activities by date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentActivities = activities.filter(activity => {
      const activityDate = new Date(activity.startTimeLocal);
      return activityDate >= cutoffDate;
    });
    
    console.log(`✅ [GarminProxy] Retrieved ${recentActivities.length} activities`);
    
    // Enhanced activity data for AI analysis
    const enhancedActivities = recentActivities.map(activity => ({
      // Basic activity info
      activityId: activity.activityId,
      activityName: activity.activityName || 'Unnamed Activity',
      activityType: {
        typeKey: activity.activityType?.typeKey || 'unknown',
        typeId: activity.activityType?.typeId || 0,
        parentTypeId: activity.activityType?.parentTypeId || 0,
      },
      
      // Timing data
      startTimeLocal: activity.startTimeLocal,
      startTimeGMT: activity.startTimeGMT,
      duration: activity.duration || 0, // in seconds
      elapsedDuration: activity.elapsedDuration || 0,
      movingDuration: activity.movingDuration || 0,
      
      // Performance metrics for AI analysis
      calories: activity.calories || 0,
      activeKilocalories: activity.activeKilocalories || 0, // Active calories specifically
      bmrKilocalories: activity.bmrKilocalories || 0, // BMR calories
      distance: activity.distance || 0,
      averageSpeed: activity.averageSpeed || 0,
      maxSpeed: activity.maxSpeed || 0,
      
      // Heart rate data for intensity analysis
      averageHR: activity.averageHR || 0,
      maxHR: activity.maxHR || 0,
      averageRunningCadence: activity.averageRunningCadence || 0,
      
      // Elevation and terrain
      elevationGain: activity.elevationGain || 0,
      elevationLoss: activity.elevationLoss || 0,
      minElevation: activity.minElevation || 0,
      maxElevation: activity.maxElevation || 0,
      
      // Training metrics
      aerobicTrainingEffect: activity.aerobicTrainingEffect || 0,
      anaerobicTrainingEffect: activity.anaerobicTrainingEffect || 0,
      trainingStressScore: activity.trainingStressScore || 0,
      intensityFactor: activity.intensityFactor || 0,
      normalizedPower: activity.normalizedPower || 0,
      leftRightBalance: activity.leftRightBalance || 0,
      
      // Activity quality indicators for AI
      avgPower: activity.avgPower || 0,
      maxPower: activity.maxPower || 0,
      avgVerticalOscillation: activity.avgVerticalOscillation || 0,
      avgGroundContactTime: activity.avgGroundContactTime || 0,
      avgStrideLength: activity.avgStrideLength || 0,
      
      // Weather and conditions (if available)
      avgTemperature: activity.avgTemperature,
      weather: activity.weather,
      
      // Device and source info
      deviceName: activity.deviceName || 'Unknown Device',
      activityName: activity.activityName || 'Workout',
      description: activity.description || '',
      
      // Calculated intensity for AI (custom metric)
      calculatedIntensity: calculateActivityIntensity(activity),
      caloriesPerMinute: activity.calories && activity.duration ? 
        Math.round((activity.calories / (activity.duration / 60)) * 100) / 100 : 0,
    }));
    
    console.log(`✅ [GarminProxy] Enhanced ${enhancedActivities.length} activities with AI metrics`);
    
    res.json({
      success: true,
      activities: enhancedActivities,
      summary: {
        totalActivities: enhancedActivities.length,
        totalCalories: enhancedActivities.reduce((sum, a) => sum + a.calories, 0),
        totalActiveCalories: enhancedActivities.reduce((sum, a) => sum + a.activeKilocalories, 0),
        averageCaloriesPerActivity: Math.round(enhancedActivities.reduce((sum, a) => sum + a.calories, 0) / enhancedActivities.length) || 0,
        daysWithActivities: [...new Set(enhancedActivities.map(a => new Date(a.startTimeLocal).toDateString()))].length,
        activityTypes: [...new Set(enhancedActivities.map(a => a.activityType.typeKey))],
      }
    });

  } catch (error) {
    console.error('❌ [GarminProxy] Failed to fetch activities:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities: ' + error.message
    });
  }
});

/**
 * Get activity details endpoint
 * GET /api/garmin/activity/:sessionId/:activityId
 * Used to show detailed activity information in the app
 */
app.get('/api/garmin/activity/:sessionId/:activityId', async (req, res) => {
  try {
    const { sessionId, activityId } = req.params;
    
    const session = sessions.get(sessionId);
    if (!session || !session.authenticated) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    // Update last used time
    session.lastUsed = Date.now();
    
    console.log(`📈 [GarminProxy] Fetching activity details for: ${activityId}`);
    
    const activity = await session.gc.getActivity(parseInt(activityId));
    
    console.log('✅ [GarminProxy] Activity details fetched');
    
    res.json({
      success: true,
      activity
    });

  } catch (error) {
    console.error('❌ [GarminProxy] Failed to fetch activity details:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity details: ' + error.message
    });
  }
});

// Profile endpoint removed - user profile is cached during login

/**
 * Validate session endpoint
 * GET /api/garmin/validate/:sessionId
 */
app.get('/api/garmin/validate/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  const session = sessions.get(sessionId);
  if (!session || !session.authenticated) {
    return res.status(401).json({ 
      valid: false, 
      error: 'Invalid or expired session' 
    });
  }
  
  // Update last used time
  session.lastUsed = Date.now();
  
  console.log('✅ [GarminProxy] Session validated:', sessionId);
  
  res.json({
    valid: true,
    userProfile: session.userProfile,
    message: 'Session is valid'
  });
});

/**
 * Logout endpoint
 * POST /api/garmin/logout/:sessionId
 */
app.post('/api/garmin/logout/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    sessions.delete(sessionId);
    console.log('👋 [GarminProxy] Session logged out:', sessionId);
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeSessions: sessions.size
  });
});

/**
 * Get daily summary endpoint
 * GET /api/garmin/daily-summary/:sessionId?date=YYYY-MM-DD
 * Returns total active calories, steps, and other daily metrics
 */
app.get('/api/garmin/daily-summary/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { date } = req.query;
    
    const session = sessions.get(sessionId);
    if (!session || !session.authenticated) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    // Update last used time
    session.lastUsed = Date.now();
    
    // Default to today if no date provided
    const targetDate = date || new Date().toISOString().split('T')[0];
    console.log(`📊 [GarminProxy] Fetching daily summary for: ${targetDate}`);
    
    // Convert date string to Date object for API call
    const summaryDate = new Date(targetDate);
    
    // Try to find the correct method for daily summary data
    const allMethods = Object.getOwnPropertyNames(session.gc.__proto__).filter(name => name.includes('get'));
    console.log('🔍 [GarminProxy] Available Garmin Connect methods:', allMethods);
    console.log('🔍 [GarminProxy] Methods containing "daily":', allMethods.filter(name => name.toLowerCase().includes('daily')));
    console.log('🔍 [GarminProxy] Methods containing "step":', allMethods.filter(name => name.toLowerCase().includes('step')));
    console.log('🔍 [GarminProxy] Methods containing "calorie":', allMethods.filter(name => name.toLowerCase().includes('calorie')));
    console.log('🔍 [GarminProxy] Methods containing "heart":', allMethods.filter(name => name.toLowerCase().includes('heart')));
    console.log('🔍 [GarminProxy] Methods containing "wellness":', allMethods.filter(name => name.toLowerCase().includes('wellness')));
    
    let dailySummary = null;
    let stepsData = null;
    let heartRateData = null;
    
    // Skip individual API calls - we'll get everything from usersummary endpoint
    
    // Use the authenticated session to make a proper API call to usersummary endpoint
    try {
      console.log('🔍 [GarminProxy] Making authenticated usersummary API call...');
      
      // Extract authentication from the garmin-connect library session
      let sessionCookies = '';
      let authToken = '';
      
      // Try to get cookies from the session - check multiple possible locations
      if (session.gc && session.gc.jar) {
        // Some versions of garmin-connect expose cookies via jar
        const cookies = session.gc.jar.getCookies('https://connect.garmin.com');
        sessionCookies = cookies.map(cookie => `${cookie.key}=${cookie.value}`).join('; ');
        console.log('📊 [GarminProxy] Found cookies from jar:', sessionCookies.length > 0 ? 'YES' : 'NO');
      } else if (session.gc && session.gc.client && session.gc.client.cookies) {
        // Try client cookies
        sessionCookies = session.gc.client.cookies;
        console.log('📊 [GarminProxy] Found cookies from client:', sessionCookies.length > 0 ? 'YES' : 'NO');
      }
      
      // Try to get auth token from OAuth client
      if (session.gc && session.gc.client && session.gc.client.oauth2Token) {
        authToken = session.gc.client.oauth2Token;
        console.log('📊 [GarminProxy] Found OAuth2 token from client:', authToken ? 'YES' : 'NO');
        console.log('📊 [GarminProxy] OAuth2 token type:', typeof authToken);
        
        // Check if it's an object with a token property or just a string
        if (typeof authToken === 'object' && authToken.access_token) {
          authToken = authToken.access_token;
          console.log('📊 [GarminProxy] Extracted access_token from OAuth2 object');
        }
      } else if (session.gc && session.gc.token) {
        authToken = session.gc.token;
        console.log('📊 [GarminProxy] Found auth token from session:', authToken ? 'YES' : 'NO');
      }
      
      // Check if we have authentication
      if (!sessionCookies && !authToken) {
        console.log('🔍 [GarminProxy] No session cookies/token found, inspecting client object...');
        
        // Specifically inspect the client object since that's where the auth data is
        if (session.gc && session.gc.client) {
          console.log('📊 [GarminProxy] Client object keys:', Object.keys(session.gc.client));
          
          for (const [key, value] of Object.entries(session.gc.client)) {
            console.log(`  client.${key}: ${typeof value} ${Array.isArray(value) ? `[${value.length} items]` : ''}`);
            
            // For oauth tokens, show more detail
            if (key.includes('oauth') || key.includes('token')) {
              if (typeof value === 'object' && value !== null) {
                console.log(`    └─ oauth object keys: ${Object.keys(value).join(', ')}`);
              } else if (typeof value === 'string') {
                console.log(`    └─ token string length: ${value.length}`);
              }
            }
          }
        } else {
          console.log('❌ [GarminProxy] No client object found in session');
        }
        
        // Check for common cookie jar patterns
        if (session.gc.cookieJar || session.gc.cookies || session.gc._cookieJar) {
          console.log('📊 [GarminProxy] Found cookie container, extracting...');
          const cookieContainer = session.gc.cookieJar || session.gc.cookies || session.gc._cookieJar;
          console.log('📊 [GarminProxy] Cookie container type:', typeof cookieContainer);
          console.log('📊 [GarminProxy] Cookie container keys:', Object.keys(cookieContainer || {}));
        }
        
        // Try to get cookies using common methods
        const possibleCookieMethods = ['getCookies', 'getCookieString', 'serialize'];
        for (const method of possibleCookieMethods) {
          if (typeof session.gc[method] === 'function') {
            try {
              const result = session.gc[method]('https://connect.garmin.com');
              console.log(`📊 [GarminProxy] ${method}() result:`, typeof result, result ? result.toString().substring(0, 100) : 'empty');
              if (result && result.toString && result.toString().length > 0) {
                sessionCookies = result.toString();
              }
            } catch (e) {
              console.log(`❌ [GarminProxy] ${method}() failed:`, e.message);
            }
          }
        }
      }
      
      // Use your known UUID from the working browser request
      const userUUID = 'c26b4b09-a3d2-4d5c-bc02-ce35dfeb75f9';
      const summaryUrl = `https://connect.garmin.com/usersummary-service/usersummary/daily/${userUUID}?calendarDate=${targetDate}`;
      
      console.log('🌐 [GarminProxy] Making direct API call to:', summaryUrl);
      
      // Build headers based on your successful browser request
      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Di-Backend': 'connectapi.garmin.com',
        'NK': 'NT',
        'Referer': `https://connect.garmin.com/modern/calories/${targetDate}/0`,
        'Sec-Ch-Ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        'X-App-Ver': '5.15.1.1d',
        'X-Lang': 'en-US'
      };
      
      // Add authentication if available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      if (sessionCookies) {
        headers['Cookie'] = sessionCookies;
      }
      
      console.log('📊 [GarminProxy] Request headers prepared (auth available):', !!(authToken || sessionCookies));
      
      const response = await fetch(summaryUrl, { headers });
      
      console.log('📊 [GarminProxy] Response status:', response.status);
      console.log('📊 [GarminProxy] Response content-type:', response.headers.get('content-type'));
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const summaryData = await response.json();
          console.log('✅ [GarminProxy] Successfully got usersummary data!');
          console.log('📊 [GarminProxy] Active calories:', summaryData.activeKilocalories);
          console.log('📊 [GarminProxy] Total steps:', summaryData.totalSteps);
          console.log('📊 [GarminProxy] Total calories:', summaryData.totalKilocalories);
          
          dailySummary = {
            activeKilocalories: summaryData.activeKilocalories || summaryData.wellnessActiveKilocalories || 0,
            totalKilocalories: summaryData.totalKilocalories || summaryData.wellnessKilocalories || 0,
            steps: summaryData.totalSteps || 0,
            bmrKilocalories: summaryData.bmrKilocalories || 0,
            restingHeartRate: summaryData.restingHeartRate || 0,
            totalDistanceMeters: summaryData.totalDistanceMeters || summaryData.wellnessDistanceMeters || 0,
            floorsAscended: summaryData.floorsAscended || 0,
            moderateIntensityMinutes: summaryData.moderateIntensityMinutes || 0,
            vigorousIntensityMinutes: summaryData.vigorousIntensityMinutes || 0,
            dailyStepGoal: summaryData.dailyStepGoal || 10000,
            netCalorieGoal: summaryData.netCalorieGoal || 2200
          };
          
        } else {
          console.log('❌ [GarminProxy] Response is not JSON, got:', contentType);
          const responseText = await response.text();
          console.log('❌ [GarminProxy] Response preview:', responseText.substring(0, 500));
        }
      } else {
        console.log('❌ [GarminProxy] API call failed with status:', response.status);
      }
      
    } catch (error) {
      console.log('❌ [GarminProxy] Usersummary API call failed:', error.message);
    }
    
    // If usersummary API failed, use fallback with basic data
    if (!dailySummary) {
      console.log('🔍 [GarminProxy] Usersummary API failed, using fallback data');
      dailySummary = {
        activeKilocalories: 0,
        totalKilocalories: 1800,
        steps: 0,
        bmrKilocalories: 1800,
        restingHeartRate: 0,
        totalDistanceMeters: 0,
        floorsAscended: 0,
        moderateIntensityMinutes: 0,
        vigorousIntensityMinutes: 0,
        dailyStepGoal: 10000,
        netCalorieGoal: 2200
      };
    }
    
    
    console.log(`✅ [GarminProxy] Daily summary fetched for ${targetDate}:`, {
      activeKilocalories: dailySummary?.activeKilocalories || 0,
      totalKilocalories: dailySummary?.totalKilocalories || 0,
      steps: dailySummary?.steps || 0
    });
    
    // Enhanced data mapping to handle different API response formats
    console.log('🔧 [GarminProxy] Raw daily summary data:', JSON.stringify(dailySummary, null, 2));
    
    // Format response to match expected interface with multiple fallback fields
    const formattedSummary = {
      date: targetDate,
      activeCalories: dailySummary?.activeKilocalories || dailySummary?.activeCalories || dailySummary?.calories || 0,
      totalCalories: dailySummary?.totalKilocalories || dailySummary?.totalCalories || (dailySummary?.activeKilocalories ? dailySummary.activeKilocalories + 1800 : 0) || 0,
      steps: dailySummary?.steps || dailySummary?.dailySteps || dailySummary?.totalSteps || 0,
      distance: dailySummary?.totalDistanceMeters || dailySummary?.distanceInMeters || dailySummary?.distance || 0,
      floorsClimbed: dailySummary?.floorsAscended || dailySummary?.floorsClimbed || 0,
      intensityMinutes: (dailySummary?.moderateIntensityMinutes || 0) + (dailySummary?.vigorousIntensityMinutes || 0),
      restingHeartRate: dailySummary?.restingHeartRate || dailySummary?.restingHR || 0,
      // Additional metrics that might be useful
      bmrKilocalories: dailySummary?.bmrKilocalories || dailySummary?.bmrCalories || 0,
      moderateIntensityMinutes: dailySummary?.moderateIntensityMinutes || 0,
      vigorousIntensityMinutes: dailySummary?.vigorousIntensityMinutes || 0,
      stepsGoal: dailySummary?.dailyStepGoal || dailySummary?.stepGoal || 10000,
      calorieGoal: dailySummary?.netCalorieGoal || dailySummary?.calorieGoal || 0
    };
    
    console.log('📤 [GarminProxy] Formatted summary being sent:', formattedSummary);
    
    res.json({
      success: true,
      ...formattedSummary
    });

  } catch (error) {
    console.error('❌ [GarminProxy] Failed to fetch daily summary:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily summary: ' + error.message
    });
  }
});

/**
 * Sessions management endpoint
 * GET /api/garmin/sessions - List all active sessions
 */
app.get('/api/garmin/sessions', (req, res) => {
  const sessionList = [];
  
  for (const [sessionId, session] of sessions.entries()) {
    sessionList.push({
      sessionId,
      username: session.username,
      authenticated: session.authenticated,
      lastUsed: new Date(session.lastUsed).toISOString(),
      ageMinutes: Math.round((Date.now() - session.lastUsed) / (1000 * 60))
    });
  }
  
  console.log(`📋 [GarminProxy] Sessions requested - ${sessionList.length} active sessions`);
  
  res.json({
    success: true,
    activeSessions: sessionList.length,
    sessions: sessionList
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ [GarminProxy] Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 [GarminProxy] Garmin Connect proxy server running on port ${port}`);
  console.log(`🔗 [GarminProxy] Health check: http://localhost:${port}/health`);
  console.log(`📱 [GarminProxy] Android access: http://10.3.206.134:${port}/health`);
});

module.exports = app;