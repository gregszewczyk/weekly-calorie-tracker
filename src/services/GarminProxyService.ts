/**
 * Garmin Proxy Service
 * 
 * This service communicates with the Node.js proxy server instead of directly
 * with the garmin-connect library, solving React Native compatibility issues.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { GarminCredentialManager, GarminCredentials, CredentialConsentOptions } from './GarminCredentialManager';

export interface GarminDailySummary {
  date: string; // YYYY-MM-DD
  activeCalories: number; // Total active calories for the day
  totalCalories: number; // Total calories burned (active + BMR)
  steps: number;
  distance?: number; // Total distance in meters
  floorsClimbed?: number;
  intensityMinutes?: number;
  restingHeartRate?: number;
}

export interface GarminActivity {
  activityId: number;
  activityName: string;
  activityType: {
    typeKey: string;
    typeId: number;
  };
  startTimeLocal: string;
  duration: number;
  distance?: number;
  calories?: number;
  averageHR?: number;
  maxHR?: number;
  elevationGain?: number;
  averageSpeed?: number;
}

export interface GarminUserProfile {
  id: number;
  profileId: number;
  fullName: string;
  userName: string;
  displayName: string;
  profileImageUrlSmall?: string;
  profileImageUrlMedium?: string;
  profileImageUrlLarge?: string;
}

interface StoredSession {
  sessionId: string;
  userProfile: GarminUserProfile;
  loginTime: number;
}

export class GarminProxyService {
  private static readonly STORAGE_KEY = '@garmin_proxy_session';
  
  // Configure your proxy server URL here
  private baseUrl = this.getProxyUrl(); // Platform-specific URL
  
  private sessionId: string | null = null;
  private userProfile: GarminUserProfile | null = null;

  constructor() {
    console.log('🌐 [ProxyService] Initializing Garmin Proxy Service...');
    console.log('🔗 [ProxyService] Using proxy URL:', this.baseUrl);
    console.log('🗋 [ProxyService] Starting session loading...');
    this.loadStoredSession();
  }

  private getProxyUrl(): string {
    // Use production Vercel deployment for all platforms
    return 'https://garmin-proxy-server.vercel.app';
  }

  private async loadStoredSession(): Promise<void> {
    console.log('🔍 [ProxyService] Loading stored session...');
    console.log('🔍 [ProxyService] Using storage key:', GarminProxyService.STORAGE_KEY);
    try {
      const stored = await AsyncStorage.getItem(GarminProxyService.STORAGE_KEY);
      console.log('🔍 [ProxyService] Raw stored data:', stored ? 'EXISTS' : 'NULL');
      console.log('🔍 [ProxyService] Stored session exists:', !!stored);
      if (stored) {
        console.log('🔍 [ProxyService] Parsing stored session data...');
        const session: StoredSession = JSON.parse(stored);
        console.log('🔍 [ProxyService] Parsed session - sessionId exists:', !!session.sessionId);
        console.log('🔍 [ProxyService] Parsed session - userProfile exists:', !!session.userProfile);
        console.log('🔍 [ProxyService] Parsed session - loginTime:', new Date(session.loginTime).toISOString());
        
        // Check if session is still valid locally (24 hours)
        const isLocallyValid = session.loginTime > Date.now() - (24 * 60 * 60 * 1000);
        console.log('🔍 [ProxyService] Local session validity:', isLocallyValid);
        
        if (isLocallyValid) {
          console.log('🔍 [ProxyService] Local session found, validating with server...');
          
          // Validate with server to ensure session still exists
          const isServerValid = await this.validateSessionWithServer(session.sessionId);
          
          if (isServerValid) {
            this.sessionId = session.sessionId;
            this.userProfile = session.userProfile;
            console.log('✅ [ProxyService] Session validated with server for:', session.userProfile.userName);
          } else {
            console.log('❌ [ProxyService] Server session invalid, clearing local session');
            await this.clearStoredSession();
          }
        } else {
          console.log('⏰ [ProxyService] Local session expired (>24h)');
          await this.clearStoredSession();
        }
      }
    } catch (error) {
      console.warn('⚠️ [ProxyService] Failed to load stored session:', error);
      await this.clearStoredSession();
    }
  }

  private async validateSessionWithServer(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/garmin/validate/${sessionId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json() as any;
        return data.valid === true;
      }
      
      return false;
    } catch (error) {
      console.warn('⚠️ [ProxyService] Failed to validate session with server:', error);
      return false; // Assume invalid if we can't reach server
    }
  }

  private async storeSession(): Promise<void> {
    try {
      if (this.sessionId && this.userProfile) {
        const session: StoredSession = {
          sessionId: this.sessionId,
          userProfile: this.userProfile,
          loginTime: Date.now(),
        };
        
        await AsyncStorage.setItem(
          GarminProxyService.STORAGE_KEY,
          JSON.stringify(session)
        );
        console.log('💾 [ProxyService] Session stored successfully');
      }
    } catch (error) {
      console.error('❌ [ProxyService] Failed to store session:', error);
    }
  }

  private async clearStoredSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(GarminProxyService.STORAGE_KEY);
      this.sessionId = null;
      this.userProfile = null;
    } catch (error) {
      console.error('❌ [ProxyService] Failed to clear session:', error);
    }
  }

  /**
   * Login with optional credential storage consent
   */
  async login(
    username: string, 
    password: string, 
    consentOptions?: CredentialConsentOptions
  ): Promise<boolean> {
    try {
      console.log('🌐 [ProxyService] Attempting login via proxy server...');
      console.log('🔗 [ProxyService] Request URL:', `${this.baseUrl}/api/garmin/login`);
      console.log('📱 [ProxyService] Platform:', Platform.OS);
      console.log('👤 [ProxyService] Username provided:', !!username, 'Length:', username?.length || 0);
      console.log('🔐 [ProxyService] Password provided:', !!password, 'Length:', password?.length || 0);
      
      // First test if server is reachable
      console.log('🏥 [ProxyService] Testing server health...');
      try {
        const healthResponse = await fetch(`${this.baseUrl}/health`, {
          method: 'GET',
        });
        if (healthResponse.ok) {
          const healthData = await healthResponse.json() as { message?: string };
          console.log('✅ [ProxyService] Server health check passed:', healthData.message);
        } else {
          console.warn('⚠️ [ProxyService] Server health check failed with status:', healthResponse.status);
        }
      } catch (healthError: any) {
        console.error('❌ [ProxyService] Server health check failed:', healthError.message);
        throw new Error(`Cannot reach proxy server at ${this.baseUrl}. Make sure it's running and accessible.`);
      }
      
      const requestBody = { username, password };
      console.log('📤 [ProxyService] Sending request body:', { username: username ? 'PROVIDED' : 'MISSING', password: password ? 'PROVIDED' : 'MISSING' });
      
      const response = await fetch(`${this.baseUrl}/api/garmin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json() as any;
      
      if (data.success) {
        this.sessionId = data.sessionId;
        this.userProfile = data.userProfile;
        await this.storeSession();
        
        // Store credentials if user gave consent
        if (consentOptions && consentOptions.rememberCredentials) {
          await GarminCredentialManager.requestCredentialStorage(
            { username, password },
            consentOptions
          );
        }
        
        console.log('✅ [ProxyService] Login successful via proxy server');
        return true;
      } else {
        throw new Error('Login failed');
      }
      
    } catch (error: any) {
      console.error('❌ [ProxyService] Login failed:', error.message);
      
      if (error.message?.includes('fetch')) {
        throw new Error('Cannot connect to proxy server. Make sure it\'s running on ' + this.baseUrl);
      }
      
      throw error;
    }
  }

  async getActivitiesForLastDays(days: number): Promise<GarminActivity[]> {
    if (!this.sessionId) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      console.log(`🌐 [ProxyService] Fetching activities via proxy server...`);
      
      const response = await fetch(
        `${this.baseUrl}/api/garmin/activities/${this.sessionId}?days=${days}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔄 [ProxyService] Session expired during activities fetch, attempting auto-login...');
          await this.clearStoredSession();
          
          // Try automatic re-login
          const autoLoginSuccess = await this.attemptAutoLogin();
          if (autoLoginSuccess) {
            console.log('🔄 [ProxyService] Auto-login successful, retrying activities fetch...');
            // Retry the request with new session
            return this.getActivitiesForLastDays(days);
          } else {
            throw new Error('Session expired. Please login again.');
          }
        }
        
        const errorData = await response.json() as any;
        throw new Error(errorData.message || 'Failed to fetch activities');
      }

      const data = await response.json() as any;
      console.log(`✅ [ProxyService] Retrieved ${data.activities.length} activities via proxy`);
      
      return data.activities;
      
    } catch (error: any) {
      console.error('❌ [ProxyService] Failed to fetch activities:', error.message);
      throw error;
    }
  }

  async getDailySummary(date: string): Promise<GarminDailySummary | null> {
    if (!this.sessionId) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      console.log(`🌐 [ProxyService] Fetching daily summary for ${date}...`);
      
      const response = await fetch(
        `${this.baseUrl}/api/garmin/daily-summary/${this.sessionId}?date=${date}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔄 [ProxyService] Session expired during daily summary fetch, attempting auto-login...');
          await this.clearStoredSession();
          
          // Try automatic re-login
          const autoLoginSuccess = await this.attemptAutoLogin();
          if (autoLoginSuccess) {
            console.log('🔄 [ProxyService] Auto-login successful, retrying daily summary fetch...');
            // Retry the request with new session
            return this.getDailySummary(date);
          } else {
            throw new Error('Session expired. Please login again.');
          }
        }
        
        const errorData = await response.json() as any;
        throw new Error(errorData.message || 'Failed to fetch daily summary');
      }

      const data = await response.json() as any;
      console.log(`✅ [ProxyService] Retrieved daily summary for ${date}:`, {
        activeCalories: data.activeCalories,
        totalCalories: data.totalCalories,
        steps: data.steps
      });
      
      return data;
      
    } catch (error: any) {
      console.error('❌ [ProxyService] Failed to fetch daily summary:', error.message);
      throw error;
    }
  }

  async getUserProfile(): Promise<GarminUserProfile | null> {
    if (!this.sessionId) {
      return this.userProfile; // Return cached profile if available
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/garmin/profile/${this.sessionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearStoredSession();
          return null;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json() as any;
      this.userProfile = data.userProfile;
      return this.userProfile;
      
    } catch (error) {
      console.error('❌ [ProxyService] Failed to fetch profile:', error);
      return this.userProfile; // Return cached profile on error
    }
  }

  isAuthenticated(): boolean {
    return this.sessionId !== null;
  }

  getCachedUserProfile(): GarminUserProfile | null {
    return this.userProfile;
  }

  async isSessionValid(): Promise<boolean> {
    if (!this.sessionId) {
      return false;
    }
    
    return await this.validateSessionWithServer(this.sessionId);
  }

  // Method to check if we have a stored session and can potentially authenticate
  hasStoredSession(): boolean {
    return this.sessionId !== null;
  }

  /**
   * Attempt automatic re-login using stored credentials
   */
  async attemptAutoLogin(): Promise<boolean> {
    try {
      console.log('🔄 [ProxyService] Attempting automatic re-login...');
      
      // Check if auto-login is allowed and we have valid consent
      const canAutoLogin = await GarminCredentialManager.canAutoLogin();
      if (!canAutoLogin) {
        console.log('🚫 [ProxyService] Auto-login not permitted or consent expired');
        return false;
      }

      // Get stored credentials
      const credentials = await GarminCredentialManager.getStoredCredentials();
      if (!credentials) {
        console.log('🔍 [ProxyService] No stored credentials found for auto-login');
        return false;
      }

      console.log('🔓 [ProxyService] Found stored credentials, attempting login...');
      
      // Attempt login without credential consent (already have it)
      const success = await this.login(credentials.username, credentials.password);
      
      if (success) {
        console.log('✅ [ProxyService] Auto-login successful');
        
        // Notify HealthDeviceManager to refresh connection status
        try {
          const { healthDeviceManager } = await import('./HealthDeviceManager');
          console.log('🔄 [ProxyService] Refreshing HealthDeviceManager connection status...');
          await healthDeviceManager.refreshConnectionStatus();
          console.log('✅ [ProxyService] HealthDeviceManager connection status refreshed');
        } catch (error: any) {
          console.log('⚠️ [ProxyService] Failed to refresh HealthDeviceManager:', error.message);
        }

      } else {
        console.log('❌ [ProxyService] Auto-login failed, clearing stored credentials');
        await GarminCredentialManager.clearStoredCredentials();
      }
      
      return success;
    } catch (error: any) {
      console.error('❌ [ProxyService] Auto-login error:', error.message);
      // Clear potentially corrupted credentials
      await GarminCredentialManager.clearStoredCredentials();
      return false;
    }
  }

  /**
   * Get credential storage status
   */
  async getCredentialStatus() {
    return await GarminCredentialManager.getStorageStatus();
  }

  /**
   * Clear stored credentials (user privacy control)
   */
  async clearStoredCredentials(): Promise<void> {
    await GarminCredentialManager.clearStoredCredentials();
    console.log('🗑️ [ProxyService] Cleared stored Garmin credentials');
  }

  async logout(): Promise<void> {
    try {
      if (this.sessionId) {
        // Notify proxy server about logout
        await fetch(`${this.baseUrl}/api/garmin/logout/${this.sessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.warn('⚠️ [ProxyService] Failed to notify server about logout:', error);
    } finally {
      await this.clearStoredSession();
      console.log('👋 [ProxyService] Logged out successfully');
    }
  }

  /**
   * Logout and also clear stored credentials
   */
  async logoutAndClearCredentials(): Promise<void> {
    await this.logout();
    await this.clearStoredCredentials();
    console.log('🗑️ [ProxyService] Logged out and cleared all stored credentials');
  }

  // Method to update base URL for production deployment
  setProxyUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
    console.log('🔗 [ProxyService] Proxy URL updated to:', this.baseUrl);
  }
}

export const garminProxyService = new GarminProxyService();