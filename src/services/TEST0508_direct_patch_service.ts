/**
 * TEST0508 - Direct Patch Service
 * 
 * This service patches garmin-connect AFTER it's imported to fix its FormData usage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Import form-data FIRST to ensure we have a stable reference
const FormDataClass = require('form-data');

// Import garmin-connect after we have form-data
const { GarminConnect } = require('garmin-connect');

// Now let's try to patch its internal FormData usage
console.log('🔧 [DirectPatch] Attempting to patch garmin-connect internals...');

// Store original prototype methods that might use FormData
const originalPrototypeMethods = {};

// Try to find and patch any methods that might create FormData internally
Object.getOwnPropertyNames(GarminConnect.prototype).forEach(methodName => {
  const method = GarminConnect.prototype[methodName];
  if (typeof method === 'function' && methodName !== 'constructor') {
    // Store original
    (originalPrototypeMethods as any)[methodName] = method;
    
    // Wrap with our own version that ensures FormData is fixed
    GarminConnect.prototype[methodName] = function(...args: any[]) {
      // Temporarily replace FormData while this method executes
      const originalFormData = global.FormData;
      
      // Create our safe FormData
      (global as any).FormData = class SafeFormData {
        private _formData: any;
        
        constructor() {
          // Use the already imported FormDataClass instead of requiring again
          this._formData = new FormDataClass();
        }
        
        append(name: any, value: any, options?: any) {
          let safeOptions = options;
          
          if (typeof options === 'string') {
            safeOptions = { filename: options };
          } else if (!options) {
            safeOptions = { filename: 'file' };
          } else if (typeof options === 'object' && options !== null && !options.filename) {
            safeOptions = { ...options, filename: 'file' };
          }
          
          console.log(`🔧 [DirectPatch] Safe FormData.append in ${methodName}:`, name, safeOptions);
          
          try {
            return this._formData.append(name, value, safeOptions);
          } catch (error) {
            console.error('❌ [DirectPatch] Append failed:', error);
            return this._formData.append(name, value, { filename: 'file' });
          }
        }
        
        getBoundary() { return this._formData.getBoundary(); }
        getHeaders() { return this._formData.getHeaders(); }
        toString() { return this._formData.toString(); }
        getLength(callback: any) { return this._formData.getLength(callback); }
        pipe(stream: any) { return this._formData.pipe(stream); }
      };
      
      try {
        // Call original method with safe FormData
        const result = (originalPrototypeMethods as any)[methodName].apply(this, args);
        
        // Restore original FormData
        (global as any).FormData = originalFormData;
        
        return result;
      } catch (error) {
        // Restore original FormData even on error
        (global as any).FormData = originalFormData;
        throw error;
      }
    };
  }
});

console.log('✅ [DirectPatch] GarminConnect prototype methods patched');

// ====== INTERFACES ======
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
  isLoggedIn: boolean;
  loginTime: number;
  username: string;
}

// ====== DIRECT PATCH GARMIN SERVICE ======
export class DirectPatchGarminService {
  private static readonly STORAGE_KEYS = {
    SESSION: '@direct_patch_garmin_session',
    USER_PROFILE: '@direct_patch_garmin_profile',
  };

  private gc: any = null;
  private isLoggedIn: boolean = false;
  private userProfile: GarminUserProfile | null = null;
  private username: string = '';
  private password: string = '';

  constructor() {
    console.log('🔧 [DirectPatchGarminService] Initializing with patched garmin-connect...');
    this.loadStoredSession();
  }

  private async loadStoredSession(): Promise<void> {
    try {
      console.log('📂 [DirectPatchGarminService] Loading stored session...');
      
      const [sessionData, profileData] = await Promise.all([
        AsyncStorage.getItem(DirectPatchGarminService.STORAGE_KEYS.SESSION),
        AsyncStorage.getItem(DirectPatchGarminService.STORAGE_KEYS.USER_PROFILE),
      ]);

      if (profileData) {
        this.userProfile = JSON.parse(profileData);
        console.log('👤 [DirectPatchGarminService] Loaded profile:', this.userProfile?.displayName);
      }

      if (sessionData) {
        const session: StoredSession = JSON.parse(sessionData);
        
        const isSessionValid = session.loginTime > Date.now() - (24 * 60 * 60 * 1000);
        
        if (isSessionValid && session.isLoggedIn) {
          console.log('✅ [DirectPatchGarminService] Valid session found for:', session.username);
          this.isLoggedIn = true;
          this.username = session.username;
        } else {
          console.log('⏰ [DirectPatchGarminService] Stored session expired');
          await this.clearStoredData();
        }
      }
    } catch (error: any) {
      console.warn('❌ [DirectPatchGarminService] Failed to load stored session:', error);
      await this.clearStoredData();
    }
  }

  private async storeSession(): Promise<void> {
    try {
      const session: StoredSession = {
        isLoggedIn: this.isLoggedIn,
        loginTime: Date.now(),
        username: this.username,
      };

      const promises = [
        AsyncStorage.setItem(
          DirectPatchGarminService.STORAGE_KEYS.SESSION,
          JSON.stringify(session)
        )
      ];

      if (this.userProfile) {
        promises.push(
          AsyncStorage.setItem(
            DirectPatchGarminService.STORAGE_KEYS.USER_PROFILE,
            JSON.stringify(this.userProfile)
          )
        );
      }

      await Promise.all(promises);
      console.log('💾 [DirectPatchGarminService] Session stored successfully');
    } catch (error: any) {
      console.error('❌ [DirectPatchGarminService] Failed to store session:', error);
    }
  }

  private async clearStoredData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(DirectPatchGarminService.STORAGE_KEYS.SESSION),
        AsyncStorage.removeItem(DirectPatchGarminService.STORAGE_KEYS.USER_PROFILE),
      ]);
      
      this.gc = null;
      this.isLoggedIn = false;
      this.userProfile = null;
      this.username = '';
      this.password = '';
      
      console.log('🗑️ [DirectPatchGarminService] Stored data cleared');
    } catch (error: any) {
      console.error('❌ [DirectPatchGarminService] Failed to clear stored data:', error);
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      console.log('🔧 [DirectPatchGarminService] Starting login with directly patched garmin-connect...');

      this.username = username;
      this.password = password;

      console.log('🏗️ [DirectPatchGarminService] Creating patched GarminConnect instance...');
      
      this.gc = new GarminConnect({
        username,
        password
      });

      console.log('🔄 [DirectPatchGarminService] Attempting authentication with patched methods...');
      
      // This should now use our patched methods that temporarily replace FormData
      await this.gc.login();
      this.isLoggedIn = true;
      
      console.log('🎉 [DirectPatchGarminService] DIRECT PATCH SUCCESS! Authentication worked!');

      await this.fetchUserProfile();
      await this.storeSession();

      return true;

    } catch (error: any) {
      console.error('💀 [DirectPatchGarminService] Direct patch failed:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n')[0]
      });
      
      await this.clearStoredData();
      
      if (error.message?.includes('filename')) {
        throw new Error('FILENAME ERROR PERSISTS - direct patching failed');
      } else if (error.message?.includes('prototype')) {
        throw new Error('PROTOTYPE ERROR PERSISTS - even direct patching failed');
      } else if (error.message?.includes('401')) {
        throw new Error('Invalid credentials (but patching is working!)');
      } else {
        throw new Error(`DIRECT PATCH FAILED: ${error.message}`);
      }
    }
  }

  private async fetchUserProfile(): Promise<void> {
    try {
      console.log('👤 [DirectPatchGarminService] Fetching user profile...');
      
      const userSettings = await this.gc.getUserSettings();
      
      this.userProfile = {
        id: userSettings.id || 0,
        profileId: userSettings.profileId || 0,
        fullName: userSettings.displayName || this.username,
        userName: this.username,
        displayName: userSettings.displayName || this.username,
        profileImageUrlSmall: userSettings.profileImageUrlSmall,
        profileImageUrlMedium: userSettings.profileImageUrlMedium,
        profileImageUrlLarge: userSettings.profileImageUrlLarge,
      };

      console.log('✅ [DirectPatchGarminService] User profile fetched');
    } catch (error: any) {
      console.warn('⚠️ [DirectPatchGarminService] Could not fetch full user profile:', error);
      
      this.userProfile = {
        id: 0,
        profileId: 0,
        fullName: this.username,
        userName: this.username,
        displayName: this.username,
      };
    }
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn && this.gc !== null;
  }

  getUserProfile(): GarminUserProfile | null {
    return this.userProfile;
  }

  async getActivitiesForLastDays(days: number): Promise<GarminActivity[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      console.log(`📈 [DirectPatchGarminService] Fetching activities from last ${days} days...`);
      
      const limit = Math.min(days * 2, 50);
      const activities = await this.gc.getActivities(0, limit);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentActivities = activities.filter((activity: any) => {
        const activityDate = new Date(activity.startTimeLocal);
        return activityDate >= cutoffDate;
      });

      console.log(`✅ [DirectPatchGarminService] Retrieved ${recentActivities.length} activities from last ${days} days`);

      return recentActivities.map((activity: any) => ({
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
    } catch (error: any) {
      console.error('❌ [DirectPatchGarminService] Failed to fetch activities:', error);
      throw error;
    }
  }

  async getActivityDetails(activityId: number): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      console.log(`📊 [DirectPatchGarminService] Fetching details for activity ${activityId}...`);
      const activity = await this.gc.getActivity(activityId);
      console.log('✅ [DirectPatchGarminService] Activity details retrieved');
      return activity;
    } catch (error: any) {
      console.error(`❌ [DirectPatchGarminService] Failed to fetch activity ${activityId}:`, error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    console.log('👋 [DirectPatchGarminService] Logging out...');
    await this.clearStoredData();
    console.log('✅ [DirectPatchGarminService] Logged out successfully');
  }
}

export const directPatchGarminService = new DirectPatchGarminService();