/**
 * Garmin Connect Proxy Server
 * 
 * This Node.js server acts as a proxy between your React Native app and Garmin Connect
 */

const express = require('express');
const cors = require('cors');
const { GarminConnect } = require('garmin-connect');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3005;

// Enable CORS for React Native app
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Store active sessions (in production, use Redis or database)
const sessions = new Map();

// Utility function to get session
function getSession(sessionId) {
  return sessions.get(sessionId);
}

// Create new session
function createSession() {
  const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const gc = new GarminConnect();
  sessions.set(sessionId, { gc, authenticated: false, userProfile: null });
  return sessionId;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Garmin Proxy Server is running' });
});

// Login endpoint
app.post('/api/garmin/login', async (req, res) => {
  try {
    console.log('📥 [Proxy] Received login request');
    console.log('📋 [Proxy] Request body keys:', Object.keys(req.body || {}));
    console.log('📋 [Proxy] Request body:', { username: req.body?.username ? 'PROVIDED' : 'MISSING', password: req.body?.password ? 'PROVIDED' : 'MISSING' });
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('❌ [Proxy] Missing credentials in request');
      return res.status(400).json({ error: 'Username and password required' });
    }

    console.log('🔐 [Proxy] Login attempt for:', username);
    
    const sessionId = createSession();
    const session = getSession(sessionId);
    
    // Perform login using garmin-connect library
    await session.gc.login(username, password);
    session.authenticated = true;
    
    // Get user profile
    try {
      const userSettings = await session.gc.getUserSettings();
      session.userProfile = {
        id: userSettings.id || 0,
        profileId: userSettings.profileId || 0,
        fullName: userSettings.displayName || username,
        userName: username,
        displayName: userSettings.displayName || username,
        profileImageUrlSmall: userSettings.profileImageUrlSmall,
        profileImageUrlMedium: userSettings.profileImageUrlMedium,
        profileImageUrlLarge: userSettings.profileImageUrlLarge,
      };
    } catch (profileError) {
      console.warn('⚠️ [Proxy] Could not fetch user profile:', profileError.message);
      session.userProfile = {
        id: 0,
        profileId: 0,
        fullName: username,
        userName: username,
        displayName: username,
      };
    }
    
    console.log('✅ [Proxy] Login successful for:', username);
    
    res.json({
      success: true,
      sessionId,
      userProfile: session.userProfile
    });
    
  } catch (error) {
    console.error('❌ [Proxy] Login failed:', error.message);
    res.status(401).json({ 
      error: 'Login failed', 
      message: error.message 
    });
  }
});

// Get activities endpoint
app.get('/api/garmin/activities/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { days = 7 } = req.query;
    
    const session = getSession(sessionId);
    if (!session || !session.authenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    console.log(`📊 [Proxy] Fetching activities for last ${days} days...`);
    
    const limit = Math.min(days * 2, 50);
    const activities = await session.gc.getActivities(0, limit);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentActivities = activities.filter(activity => {
      const activityDate = new Date(activity.startTimeLocal);
      return activityDate >= cutoffDate;
    });

    console.log(`✅ [Proxy] Retrieved ${recentActivities.length} activities`);

    const formattedActivities = recentActivities.map(activity => ({
      activityId: activity.activityId,
      activityName: activity.activityName || 'Unnamed Activity',
      activityType: {
        typeKey: activity.activityType?.typeKey || 'unknown',
        typeId: activity.activityType?.typeId || 0,
      },
      startTimeLocal: activity.startTimeLocal,
      duration: activity.duration || 0,
      distance: activity.distance,
      calories: activity.calories,
      averageHR: activity.averageHR,
      maxHR: activity.maxHR,
      elevationGain: activity.elevationGain,
      averageSpeed: activity.averageSpeed,
    }));
    
    res.json({ activities: formattedActivities });
    
  } catch (error) {
    console.error('❌ [Proxy] Failed to fetch activities:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch activities', 
      message: error.message 
    });
  }
});

// Get user profile endpoint
app.get('/api/garmin/profile/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = getSession(sessionId);
    if (!session || !session.authenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    res.json({ userProfile: session.userProfile });
    
  } catch (error) {
    console.error('❌ [Proxy] Failed to get profile:', error.message);
    res.status(500).json({ 
      error: 'Failed to get profile', 
      message: error.message 
    });
  }
});

// Logout endpoint
app.post('/api/garmin/logout/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    sessions.delete(sessionId);
    console.log('👋 [Proxy] Session logged out:', sessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Cleanup inactive sessions (every 30 minutes)
setInterval(() => {
  const now = Date.now();
  sessions.forEach((session, sessionId) => {
    // Remove sessions older than 2 hours
    if (now - parseInt(sessionId.split('_')[0]) > 2 * 60 * 60 * 1000) {
      sessions.delete(sessionId);
      console.log('🧹 [Proxy] Cleaned up inactive session:', sessionId);
    }
  });
}, 30 * 60 * 1000);

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 [Proxy] Garmin Connect Proxy Server running on port ${port}`);
  console.log(`🔗 [Proxy] Health check: http://localhost:${port}/health`);
  console.log(`📱 [Proxy] Android access: http://10.3.206.134:${port}/health`);
});