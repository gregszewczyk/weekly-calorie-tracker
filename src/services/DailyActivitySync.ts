/**
 * Daily Activity Sync Service
 * 
 * Handles automatic syncing of yesterday's activities to update daily calorie targets.
 * This ensures that when a new day starts, the app has yesterday's activity data
 * to make informed decisions about today's calorie allowance.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { healthDeviceManager } from './HealthDeviceManager';
import { useCalorieStore } from '../stores/calorieStore';
import { UniversalActivity } from '../types/HealthDeviceTypes';

export interface DailySyncStatus {
  lastSyncDate: string;
  lastSyncTimestamp: number;
  activitiesSynced: number;
  totalCaloriesBurned: number;
  syncSuccess: boolean;
  usedCachedData?: boolean;
  dataSource?: 'live_device' | 'cached_data' | 'no_data';
  error?: string;
}

export interface CachedActivity {
  id: string;
  date: string; // YYYY-MM-DD format
  activity: UniversalActivity;
  cachedAt: number; // timestamp
  platform: string;
}

export interface ActivityCache {
  activities: CachedActivity[];
  lastCacheUpdate: number;
}

export class DailyActivitySync {
  private static readonly SYNC_STATUS_KEY = '@daily_activity_sync_status';
  private static readonly ACTIVITY_CACHE_KEY = '@daily_activity_cache';
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly CACHE_RETENTION_DAYS = 14; // Keep activities for 2 weeks

  /**
   * Check if we need to sync yesterday's activities
   */
  static async shouldSyncYesterday(): Promise<boolean> {
    try {
      const lastSync = await this.getLastSyncStatus();
      const yesterday = this.getYesterdayDateString();
      
      // If we haven't synced yesterday's data yet, we should sync
      const needsSync = !lastSync || lastSync.lastSyncDate !== yesterday;
      
      console.log('🔄 [DailySync] Should sync check:', {
        lastSyncDate: lastSync?.lastSyncDate,
        yesterday,
        needsSync
      });
      
      return needsSync;
    } catch (error) {
      console.error('❌ [DailySync] Error checking sync status:', error);
      return true; // Default to syncing if we can't determine status
    }
  }

  /**
   * Sync yesterday's activities and update calorie store
   */
  static async syncYesterdaysActivities(): Promise<DailySyncStatus> {
    const yesterday = this.getYesterdayDate();
    const yesterdayString = this.getYesterdayDateString();
    
    console.log('🔄 [DailySync] Starting sync for yesterday:', yesterdayString);

    try {
      // Check if we have any health device connections
      if (!healthDeviceManager.hasAnyConnection()) {
        const status: DailySyncStatus = {
          lastSyncDate: yesterdayString,
          lastSyncTimestamp: Date.now(),
          activitiesSynced: 0,
          totalCaloriesBurned: 0,
          syncSuccess: false,
          usedCachedData: false,
          dataSource: 'no_data',
          error: 'No health device connections available'
        };
        
        await this.saveSyncStatus(status);
        console.log('⚠️ [DailySync] No health devices connected');
        return status;
      }

      // Get yesterday's activities
      const activities = await this.getActivitiesForDate(yesterday);
      const hasConnection = healthDeviceManager.hasAnyConnection();
      
      // Calculate total calories burned
      const totalCaloriesBurned = activities.reduce((total, activity) => {
        return total + (activity.calories || 0);
      }, 0);

      console.log('📊 [DailySync] Yesterday\'s activity summary:', {
        date: yesterdayString,
        activitiesFound: activities.length,
        totalCaloriesBurned,
        dataSource: hasConnection ? 'live_device' : 'cached_data',
        activities: activities.map(a => ({
          name: a.displayName,
          calories: a.calories,
          duration: a.duration,
          platform: a.platform
        }))
      });

      // Update the calorie store with yesterday's burned calories
      const { updateBurnedCalories } = useCalorieStore.getState();
      updateBurnedCalories(yesterdayString, totalCaloriesBurned);

      console.log('✅ [DailySync] Yesterday\'s burned calories added to store, weekly redistribution will automatically account for this');

      // Save sync status
      const status: DailySyncStatus = {
        lastSyncDate: yesterdayString,
        lastSyncTimestamp: Date.now(),
        activitiesSynced: activities.length,
        totalCaloriesBurned,
        syncSuccess: true,
        usedCachedData: !hasConnection,
        dataSource: activities.length > 0 ? (hasConnection ? 'live_device' : 'cached_data') : 'no_data'
      };

      await this.saveSyncStatus(status);
      
      console.log('✅ [DailySync] Successfully synced yesterday\'s activities:', status);
      return status;

    } catch (error) {
      console.error('❌ [DailySync] Failed to sync yesterday\'s activities:', error);
      
      const status: DailySyncStatus = {
        lastSyncDate: yesterdayString,
        lastSyncTimestamp: Date.now(),
        activitiesSynced: 0,
        totalCaloriesBurned: 0,
        syncSuccess: false,
        usedCachedData: false,
        dataSource: 'no_data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      await this.saveSyncStatus(status);
      return status;
    }
  }

  /**
   * Get activities for a specific date
   */
  private static async getActivitiesForDate(date: Date): Promise<UniversalActivity[]> {
    const targetDateString = date.toISOString().split('T')[0];
    
    try {
      // First, try to get activities from health device
      if (healthDeviceManager.hasAnyConnection()) {
        console.log('🔄 [DailySync] Fetching activities from health device for', targetDateString);
        
        // Get recent activities and filter for the specific date
        const recentActivities = await healthDeviceManager.getRecentActivities(7);
        const dateActivities = recentActivities.filter(activity => {
          const activityDate = new Date(activity.startTime);
          return activityDate.toDateString() === date.toDateString();
        });
        
        // Cache the fetched activities for future use
        if (dateActivities.length > 0) {
          await this.cacheActivities(dateActivities);
          console.log('✅ [DailySync] Fetched and cached', dateActivities.length, 'activities from health device');
        }
        
        return dateActivities;
      } else {
        console.log('⚠️ [DailySync] No health device connection, falling back to cached data');
        throw new Error('No health device connection available');
      }
    } catch (error) {
      console.log('❌ [DailySync] Failed to fetch from health device, using cached data:', error);
      
      // Fallback to cached activities
      const cachedActivities = await this.getCachedActivitiesForDate(date);
      
      if (cachedActivities.length > 0) {
        console.log('📱 [DailySync] Using', cachedActivities.length, 'cached activities for', targetDateString);
        return cachedActivities;
      } else {
        console.log('❌ [DailySync] No cached activities found for', targetDateString);
        return [];
      }
    }
  }

  /**
   * Get yesterday's date
   */
  private static getYesterdayDate(): Date {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  /**
   * Get yesterday's date as string (YYYY-MM-DD format for consistency with store)
   */
  private static getYesterdayDateString(): string {
    const yesterday = this.getYesterdayDate();
    return yesterday.toISOString().split('T')[0];
  }

  /**
   * Save sync status to storage
   */
  private static async saveSyncStatus(status: DailySyncStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(status));
    } catch (error) {
      console.error('❌ [DailySync] Failed to save sync status:', error);
    }
  }

  /**
   * Get last sync status from storage
   */
  private static async getLastSyncStatus(): Promise<DailySyncStatus | null> {
    try {
      const stored = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ [DailySync] Failed to get sync status:', error);
      return null;
    }
  }

  /**
   * Initialize daily sync - call this on app startup
   */
  static async initializeDailySync(): Promise<void> {
    console.log('🚀 [DailySync] Initializing daily activity sync...');
    
    try {
      // OPTIMIZATION: Skip activity-based sync since we use direct usersummary API for daily calories
      // This prevents unnecessary API calls on app startup
      
      console.log('ℹ️ [DailySync] Using direct usersummary API for daily calories - skipping activity sync');
      console.log('ℹ️ [DailySync] Activity sync only used for manual testing/debugging');
      
      // Still sync today's active calories using the direct API approach
      await this.syncTodaysActiveCalories();
      
    } catch (error) {
      console.error('❌ [DailySync] Failed to initialize daily sync:', error);
    }
  }

  /**
   * Sync today's active calories for real-time tracking
   */
  static async syncTodaysActiveCalories(): Promise<void> {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    try {
      console.log('🔄 [DailySync] Syncing today\'s active calories for date:', today);
      
      // Check health device connection status
      const hasConnection = healthDeviceManager.hasAnyConnection();
      console.log('🔍 [DailySync] Health device connection status:', hasConnection);
      
      if (!hasConnection) {
        console.log('⚠️ [DailySync] No health device connection for today\'s sync');
        return;
      }

      // Get current calorie data before sync
      const { getTodaysData } = useCalorieStore.getState();
      const beforeSync = getTodaysData();
      console.log('📊 [DailySync] Before sync - calories burned:', beforeSync?.burned || 0);

      // Use the store's sync method to get today's Garmin data
      const { syncGarminActiveCalories } = useCalorieStore.getState();
      console.log('🔄 [DailySync] Calling syncGarminActiveCalories...');
      await syncGarminActiveCalories(today);
      
      // Get calorie data after sync to verify changes
      const afterSync = getTodaysData();
      console.log('📊 [DailySync] After sync - calories burned:', afterSync?.burned || 0);
      
      console.log('✅ [DailySync] Today\'s active calories sync completed');
      
    } catch (error) {
      console.error('❌ [DailySync] Failed to sync today\'s active calories:', error);
      console.error('❌ [DailySync] Error details:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Manual sync for testing or user-triggered refresh
   */
  static async manualSync(): Promise<DailySyncStatus> {
    console.log('🔄 [DailySync] Manual sync triggered');
    return await this.syncYesterdaysActivities();
  }

  /**
   * Manual sync for today's active calories (for real-time updates)
   */
  static async refreshTodaysActiveCalories(): Promise<boolean> {
    try {
      console.log('🔄 [DailySync] Manual refresh of today\'s active calories triggered');
      await this.syncTodaysActiveCalories();
      return true;
    } catch (error) {
      console.error('❌ [DailySync] Manual refresh failed:', error);
      return false;
    }
  }

  /**
   * Get current sync status for debugging
   */
  static async getCurrentSyncStatus(): Promise<DailySyncStatus | null> {
    return await this.getLastSyncStatus();
  }

  /**
   * Cache activities locally for offline access
   */
  private static async cacheActivities(activities: UniversalActivity[]): Promise<void> {
    try {
      const existingCache = await this.getActivityCache();
      const now = Date.now();
      
      // Convert new activities to cached format
      const newCachedActivities: CachedActivity[] = activities.map(activity => ({
        id: activity.id,
        date: activity.startTime.toISOString().split('T')[0],
        activity,
        cachedAt: now,
        platform: activity.platform
      }));
      
      // Merge with existing cache, avoiding duplicates
      const allActivities = [...existingCache.activities];
      
      for (const newActivity of newCachedActivities) {
        const existingIndex = allActivities.findIndex(
          cached => cached.id === newActivity.id && cached.platform === newActivity.platform
        );
        
        if (existingIndex >= 0) {
          // Update existing activity with newer data
          allActivities[existingIndex] = newActivity;
        } else {
          // Add new activity
          allActivities.push(newActivity);
        }
      }
      
      // Clean up old activities (older than CACHE_RETENTION_DAYS)
      const cutoffTime = now - (this.CACHE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      const filteredActivities = allActivities.filter(cached => cached.cachedAt > cutoffTime);
      
      const updatedCache: ActivityCache = {
        activities: filteredActivities,
        lastCacheUpdate: now
      };
      
      await AsyncStorage.setItem(this.ACTIVITY_CACHE_KEY, JSON.stringify(updatedCache));
      
      console.log('💾 [DailySync] Cached activities:', {
        newActivities: newCachedActivities.length,
        totalCached: filteredActivities.length,
        oldActivitiesRemoved: allActivities.length - filteredActivities.length
      });
      
    } catch (error) {
      console.error('❌ [DailySync] Failed to cache activities:', error);
    }
  }

  /**
   * Get cached activities
   */
  private static async getActivityCache(): Promise<ActivityCache> {
    try {
      const stored = await AsyncStorage.getItem(this.ACTIVITY_CACHE_KEY);
      if (stored) {
        const cache = JSON.parse(stored) as ActivityCache;
        // Convert stored date strings back to Date objects
        cache.activities = cache.activities.map(cached => ({
          ...cached,
          activity: {
            ...cached.activity,
            startTime: new Date(cached.activity.startTime),
            syncedAt: new Date(cached.activity.syncedAt)
          }
        }));
        return cache;
      }
    } catch (error) {
      console.error('❌ [DailySync] Failed to get activity cache:', error);
    }
    
    // Return empty cache if not found or error
    return {
      activities: [],
      lastCacheUpdate: 0
    };
  }

  /**
   * Get activities for a date from cache
   */
  private static async getCachedActivitiesForDate(date: Date): Promise<UniversalActivity[]> {
    const cache = await this.getActivityCache();
    const targetDateString = date.toISOString().split('T')[0];
    
    const cachedActivities = cache.activities
      .filter(cached => cached.date === targetDateString)
      .map(cached => cached.activity);
    
    console.log('💾 [DailySync] Found cached activities for', targetDateString, ':', cachedActivities.length);
    
    return cachedActivities;
  }

  /**
   * Clear activity cache (for debugging or cleanup)
   */
  static async clearActivityCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ACTIVITY_CACHE_KEY);
      console.log('🗑️ [DailySync] Activity cache cleared');
    } catch (error) {
      console.error('❌ [DailySync] Failed to clear activity cache:', error);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  static async getCacheStats(): Promise<{
    totalActivities: number;
    dateRange: { oldest: string; newest: string } | null;
    platforms: string[];
    cacheSize: number;
  }> {
    const cache = await this.getActivityCache();
    
    if (cache.activities.length === 0) {
      return {
        totalActivities: 0,
        dateRange: null,
        platforms: [],
        cacheSize: 0
      };
    }
    
    const dates = cache.activities.map(a => a.date).sort();
    const platforms = [...new Set(cache.activities.map(a => a.platform))];
    
    return {
      totalActivities: cache.activities.length,
      dateRange: {
        oldest: dates[0],
        newest: dates[dates.length - 1]
      },
      platforms,
      cacheSize: JSON.stringify(cache).length
    };
  }

  /**
   * Proactively cache recent activities when connection is available
   */
  static async preloadActivityCache(): Promise<void> {
    try {
      if (!healthDeviceManager.hasAnyConnection()) {
        console.log('⚠️ [DailySync] No health device connection available for preloading cache');
        return;
      }

      console.log('🔄 [DailySync] Preloading activity cache...');
      
      // Get activities from the last 7 days
      const recentActivities = await healthDeviceManager.getRecentActivities(7);
      
      if (recentActivities.length > 0) {
        await this.cacheActivities(recentActivities);
        console.log('✅ [DailySync] Preloaded', recentActivities.length, 'activities into cache');
      } else {
        console.log('📱 [DailySync] No recent activities to preload');
      }
    } catch (error) {
      console.error('❌ [DailySync] Failed to preload activity cache:', error);
    }
  }

  /**
   * Sync and cache activities for a specific date range
   */
  static async syncActivityRange(startDate: Date, endDate: Date): Promise<{
    totalActivities: number;
    successfulDays: number;
    failedDays: number;
    usedCache: boolean;
  }> {
    const result = {
      totalActivities: 0,
      successfulDays: 0,
      failedDays: 0,
      usedCache: false
    };

    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      try {
        const activities = await this.getActivitiesForDate(new Date(currentDate));
        
        if (activities.length > 0) {
          result.totalActivities += activities.length;
          result.successfulDays++;
          
          // Check if any activities came from cache
          if (!healthDeviceManager.hasAnyConnection()) {
            result.usedCache = true;
          }
        }
      } catch (error) {
        console.error('❌ [DailySync] Failed to sync activities for', currentDate.toISOString().split('T')[0], ':', error);
        result.failedDays++;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('📊 [DailySync] Activity range sync complete:', result);
    return result;
  }
}
