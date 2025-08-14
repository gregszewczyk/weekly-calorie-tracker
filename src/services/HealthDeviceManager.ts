/**
 * Unified Health Device Manager
 * 
 * This service provides a unified interface for all health device platforms
 * (Garmin, Samsung Health, Apple HealthKit). It handles connections,
 * data syncing, and provides a consistent API regardless of the platform.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  HealthPlatform, 
  HealthDeviceConnection, 
  UniversalActivity, 
  DailyHealthMetrics,
  ConnectionRequest,
  ConnectionResult,
  PLATFORM_INFO
} from '../types/HealthDeviceTypes';
import { garminProxyService } from './GarminProxyService';

export class HealthDeviceManager {
  private static readonly STORAGE_KEY = '@health_device_connections';
  private connections: Map<HealthPlatform, HealthDeviceConnection> = new Map();

  constructor() {
    console.log('🏥 [HealthDeviceManager] Initializing HealthDeviceManager...');
    this.loadStoredConnections();
    console.log('🏥 [HealthDeviceManager] Starting session validation...');
    this.validateExistingSessions();
  }

  /**
   * Load stored connections from AsyncStorage
   */
  private async loadStoredConnections(): Promise<void> {
    try {
      console.log('🗋 [HealthDeviceManager] Loading stored connections from key:', HealthDeviceManager.STORAGE_KEY);
      const stored = await AsyncStorage.getItem(HealthDeviceManager.STORAGE_KEY);
      console.log('🗋 [HealthDeviceManager] Raw stored connections:', stored ? 'EXISTS' : 'NULL');
      
      if (stored) {
        const connectionsArray: HealthDeviceConnection[] = JSON.parse(stored);
        console.log('🗋 [HealthDeviceManager] Parsed connections array:', connectionsArray.map(c => ({platform: c.platform, status: c.status})));
        
        connectionsArray.forEach(connection => {
          this.connections.set(connection.platform, connection);
        });
        console.log('🔗 [HealthDeviceManager] Loaded stored connections:', connectionsArray.length);
        console.log('🔗 [HealthDeviceManager] Connections map size after loading:', this.connections.size);
      } else {
        console.log('🗋 [HealthDeviceManager] No stored connections found');
      }
    } catch (error) {
      console.warn('⚠️ [HealthDeviceManager] Failed to load stored connections:', error);
    }
  }

  /**
   * Save connections to AsyncStorage
   */
  private async saveConnections(): Promise<void> {
    try {
      const connectionsArray = Array.from(this.connections.values());
      await AsyncStorage.setItem(
        HealthDeviceManager.STORAGE_KEY,
        JSON.stringify(connectionsArray)
      );
      console.log('💾 [HealthDeviceManager] Saved connections');
    } catch (error) {
      console.error('❌ [HealthDeviceManager] Failed to save connections:', error);
    }
  }

  /**
   * Validate existing sessions on startup to restore connections
   */
  private async validateExistingSessions(): Promise<void> {
    console.log('🔍 [HealthDeviceManager] Validating existing sessions...');
    console.log('🔍 [HealthDeviceManager] Current connections before validation:', this.connections.size);
    
    // Check Garmin session
    console.log('🔍 [HealthDeviceManager] Checking if Garmin has stored session...');
    const hasGarminSession = garminProxyService.hasStoredSession();
    console.log('🔍 [HealthDeviceManager] Garmin hasStoredSession result:', hasGarminSession);
    console.log('🔍 [HealthDeviceManager] Garmin isAuthenticated result:', garminProxyService.isAuthenticated());
    
    if (hasGarminSession) {
      console.log('🔍 [HealthDeviceManager] Found Garmin session, validating...');
      
      try {
        const isValid = await garminProxyService.isSessionValid();
        
        if (isValid) {
          const userProfile = garminProxyService.getCachedUserProfile();
          
          if (userProfile) {
            const connection: HealthDeviceConnection = {
              platform: 'garmin',
              status: 'connected',
              deviceName: userProfile.displayName || 'Garmin Connect',
              deviceModel: 'Garmin Connect Account',
              connectedAt: new Date(), // We don't know the exact time, use now
              lastSync: new Date(),
              userId: userProfile.userName
            };
            
            this.connections.set('garmin', connection);
            await this.saveConnections();
            
            console.log('✅ [HealthDeviceManager] Garmin session restored for:', userProfile.userName);
          }
        } else {
          console.log('❌ [HealthDeviceManager] Garmin session invalid, will require re-login');
          // Remove any stored Garmin connection since session is invalid
          this.connections.delete('garmin');
          await this.saveConnections();
        }
      } catch (error) {
        console.warn('⚠️ [HealthDeviceManager] Failed to validate Garmin session:', error);
        this.connections.delete('garmin');
        await this.saveConnections();
      }
    }
    
    // TODO: Add Samsung Health and Apple HealthKit session validation when implemented
    
    console.log('✅ [HealthDeviceManager] Session validation complete');
  }

  /**
   * Get all current connections
   */
  getConnections(): HealthDeviceConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connection for specific platform
   */
  getConnection(platform: HealthPlatform): HealthDeviceConnection | null {
    return this.connections.get(platform) || null;
  }

  /**
   * Check if any platform is connected
   */
  hasAnyConnection(): boolean {
    return Array.from(this.connections.values()).some(
      conn => conn.status === 'connected'
    );
  }

  /**
   * Check if specific platform is connected
   */
  isConnected(platform: HealthPlatform): boolean {
    const connection = this.connections.get(platform);
    return connection?.status === 'connected';
  }

  /**
   * Connect to a health platform
   */
  async connect(request: ConnectionRequest): Promise<ConnectionResult> {
    const { platform } = request;
    
    console.log(`🔗 [HealthDeviceManager] Connecting to ${platform}...`);
    
    // Update status to connecting
    const connectingConnection: HealthDeviceConnection = {
      platform,
      status: 'connecting',
    };
    this.connections.set(platform, connectingConnection);
    
    try {
      let result: ConnectionResult;
      
      switch (platform) {
        case 'garmin':
          result = await this.connectGarmin(request);
          break;
        case 'samsung':
          result = await this.connectSamsung(request);
          break;
        case 'apple':
          result = await this.connectApple(request);
          break;
        default:
          result = {
            success: false,
            error: `Platform ${platform} not supported`
          };
      }

      if (result.success && result.connection) {
        this.connections.set(platform, result.connection);
        await this.saveConnections();
      } else {
        // Update to error state
        this.connections.set(platform, {
          ...connectingConnection,
          status: 'error',
          error: result.error
        });
      }

      return result;
    } catch (error: any) {
      console.error(`❌ [HealthDeviceManager] Failed to connect to ${platform}:`, error);
      
      const errorConnection: HealthDeviceConnection = {
        ...connectingConnection,
        status: 'error',
        error: error.message || 'Connection failed'
      };
      this.connections.set(platform, errorConnection);
      
      return {
        success: false,
        error: error.message || 'Connection failed'
      };
    }
  }

  /**
   * Disconnect from a health platform
   */
  async disconnect(platform: HealthPlatform): Promise<boolean> {
    console.log(`🔌 [HealthDeviceManager] Disconnecting from ${platform}...`);
    
    try {
      let success = false;
      
      switch (platform) {
        case 'garmin':
          await garminProxyService.logout();
          success = true;
          break;
        case 'samsung':
          // Samsung disconnect logic will be implemented
          success = true;
          break;
        case 'apple':
          // Apple disconnect logic will be implemented
          success = true;
          break;
      }

      if (success) {
        this.connections.delete(platform);
        await this.saveConnections();
        console.log(`✅ [HealthDeviceManager] Disconnected from ${platform}`);
      }

      return success;
    } catch (error) {
      console.error(`❌ [HealthDeviceManager] Failed to disconnect from ${platform}:`, error);
      return false;
    }
  }

  /**
   * Get recent activities from all connected platforms
   * Default to 14 days for AI calorie calculations
   */
  async getRecentActivities(days: number = 14): Promise<UniversalActivity[]> {
    const activities: UniversalActivity[] = [];
    
    for (const [platform, connection] of this.connections) {
      if (connection.status !== 'connected') continue;
      
      try {
        let platformActivities: UniversalActivity[] = [];
        
        switch (platform) {
          case 'garmin':
            platformActivities = await this.getGarminActivities(days);
            break;
          case 'samsung':
            platformActivities = await this.getSamsungActivities(days);
            break;
          case 'apple':
            platformActivities = await this.getAppleActivities(days);
            break;
        }
        
        activities.push(...platformActivities);
      } catch (error) {
        console.error(`❌ [HealthDeviceManager] Failed to get activities from ${platform}:`, error);
      }
    }
    
    // Sort by start time, newest first
    return activities.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * Refresh connection status for all platforms
   * Useful when app becomes active or user manually refreshes
   */
  async refreshConnectionStatus(): Promise<void> {
    console.log('🔄 [HealthDeviceManager] Refreshing connection status...');
    await this.validateExistingSessions();
  }

  /**
   * Get platform display information
   */
  getPlatformInfo(platform: HealthPlatform) {
    return PLATFORM_INFO[platform];
  }

  // Private platform-specific connection methods

  private async connectGarmin(request: ConnectionRequest): Promise<ConnectionResult> {
    if (!request.credentials?.username || !request.credentials?.password) {
      return {
        success: false,
        error: 'Username and password are required for Garmin Connect'
      };
    }

    try {
      const success = await garminProxyService.login(
        request.credentials.username,
        request.credentials.password,
        request.consentOptions
      );

      if (success) {
        const userProfile = garminProxyService.getCachedUserProfile();
        
        const connection: HealthDeviceConnection = {
          platform: 'garmin',
          status: 'connected',
          deviceName: userProfile?.displayName || 'Garmin Connect',
          deviceModel: 'Garmin Connect Account',
          connectedAt: new Date(),
          lastSync: new Date(),
          userId: userProfile?.userName
        };

        return {
          success: true,
          connection,
          message: 'Successfully connected to Garmin Connect'
        };
      } else {
        return {
          success: false,
          error: 'Failed to authenticate with Garmin Connect'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Garmin connection failed'
      };
    }
  }

  private async connectSamsung(request: ConnectionRequest): Promise<ConnectionResult> {
    // Samsung Health connection will be implemented
    return {
      success: false,
      error: 'Samsung Health integration coming soon'
    };
  }

  private async connectApple(request: ConnectionRequest): Promise<ConnectionResult> {
    // Apple HealthKit connection will be implemented
    return {
      success: false,
      error: 'Apple HealthKit integration coming soon'
    };
  }

  // Private platform-specific activity retrieval methods

  private async getGarminActivities(days: number): Promise<UniversalActivity[]> {
    try {
      // Check if Garmin session is still valid before attempting to fetch activities
      console.log('🔍 [HealthDeviceManager] Checking Garmin session validity before fetching activities...');
      
      const hasStoredSession = garminProxyService.hasStoredSession();
      const isAuthenticated = garminProxyService.isAuthenticated();
      const userProfile = garminProxyService.getCachedUserProfile();
      
      console.log('🔍 [HealthDeviceManager] Session check details:');
      console.log('  - hasStoredSession():', hasStoredSession);
      console.log('  - isAuthenticated():', isAuthenticated);  
      console.log('  - cached user profile exists:', !!userProfile);
      console.log('  - cached user profile:', userProfile?.userName || 'none');
      
      if (!hasStoredSession) {
        console.log('❌ [HealthDeviceManager] No Garmin session stored, removing connection');
        this.connections.delete('garmin');
        await this.saveConnections();
        return [];
      }
      
      console.log('🔍 [HealthDeviceManager] Validating session with server...');
      const isSessionValid = await garminProxyService.isSessionValid();
      console.log('🔍 [HealthDeviceManager] Server validation result:', isSessionValid);
      
      if (!isSessionValid) {
        console.log('❌ [HealthDeviceManager] Garmin session invalid, removing connection');
        console.log('❌ [HealthDeviceManager] This means the server session has expired or been lost');
        this.connections.delete('garmin');
        await this.saveConnections();
        return [];
      }
      
      console.log('✅ [HealthDeviceManager] Garmin session valid, fetching activities...');
      const activities = await garminProxyService.getActivitiesForLastDays(days);
      
      return activities.map(activity => ({
        id: activity.activityId.toString(),
        platform: 'garmin' as HealthPlatform,
        activityType: activity.activityType.typeKey,
        displayName: activity.activityName,
        startTime: new Date(activity.startTimeLocal),
        duration: Math.round(activity.duration / 60), // Convert seconds to minutes
        calories: activity.calories,
        distance: activity.distance,
        averageHeartRate: activity.averageHR,
        maxHeartRate: activity.maxHR,
        elevation: activity.elevationGain,
        averageSpeed: activity.averageSpeed,
        syncedAt: new Date()
      }));
    } catch (error) {
      console.error('❌ [HealthDeviceManager] Failed to get Garmin activities:', error);
      
      // If authentication error, clean up the connection
      if ((error as Error)?.message?.includes('Not authenticated') || (error as Error)?.message?.includes('Session expired')) {
        console.log('🧹 [HealthDeviceManager] Authentication error, cleaning up Garmin connection');
        this.connections.delete('garmin');
        await this.saveConnections();
      }
      
      return [];
    }
  }

  private async getSamsungActivities(days: number): Promise<UniversalActivity[]> {
    // Samsung Health activities will be implemented
    return [];
  }

  private async getAppleActivities(days: number): Promise<UniversalActivity[]> {
    // Apple HealthKit activities will be implemented
    return [];
  }
}

export const healthDeviceManager = new HealthDeviceManager();