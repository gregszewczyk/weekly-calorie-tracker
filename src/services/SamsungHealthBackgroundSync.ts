/**
 * Samsung Health Background Sync Service
 * 
 * Handles automatic background synchronization of Samsung Health data
 * with configurable sync intervals and smart sync logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { SamsungHealthDataProcessor } from './SamsungHealthDataProcessor';
import { SamsungHealthService } from './SamsungHealthService';
import { 
  SamsungHealthSyncResult, 
  SamsungHealthException, 
  SamsungHealthErrorType,
  SamsungHealthSyncConfig 
} from '../types/SamsungHealthTypes';
import { addMinutes, differenceInMinutes, format } from 'date-fns';

interface SyncJobStatus {
  isRunning: boolean;
  lastSyncTime: Date | null;
  nextSyncTime: Date | null;
  syncInterval: number; // minutes
  consecutiveFailures: number;
  lastError: string | null;
  totalSyncsToday: number;
  totalActivitiesSync: number;
}

export class SamsungHealthBackgroundSync {
  private static instance: SamsungHealthBackgroundSync;
  private dataProcessor: SamsungHealthDataProcessor;
  private samsungHealthService: SamsungHealthService;
  private syncConfig: SamsungHealthSyncConfig;
  private jobStatus: SyncJobStatus;
  private isInitialized = false;
  private appStateSubscription: any;
  private syncInterval: number | null = null;

  private readonly STORAGE_KEYS = {
    SYNC_CONFIG: 'samsung_health_sync_config',
    JOB_STATUS: 'samsung_health_job_status',
    LAST_SYNC: 'samsung_health_last_sync'
  };

  private readonly DEFAULT_CONFIG: SamsungHealthSyncConfig = {
    enabled: true,
    syncActivities: true,
    syncDailyMetrics: false,
    syncBodyComposition: false,
    syncSleep: false,
    syncHeartRate: false,
    syncFrequency: 'hourly',
    enableBackgroundSync: true,
    syncIntervalMinutes: 60, // 1 hour
    syncOnAppOpen: true,
    syncOnAppBackground: false,
    maxDailySync: 24, // Max 24 syncs per day
    wifiOnlySync: false,
    batteryOptimization: true,
    quietHoursStart: 22, // 10 PM
    quietHoursEnd: 6 // 6 AM
  };

  private constructor() {
    this.dataProcessor = SamsungHealthDataProcessor.getInstance();
    this.samsungHealthService = SamsungHealthService.getInstance();
    this.syncConfig = this.DEFAULT_CONFIG;
    this.jobStatus = {
      isRunning: false,
      lastSyncTime: null,
      nextSyncTime: null,
      syncInterval: this.DEFAULT_CONFIG.syncIntervalMinutes,
      consecutiveFailures: 0,
      lastError: null,
      totalSyncsToday: 0,
      totalActivitiesSync: 0
    };
  }

  public static getInstance(): SamsungHealthBackgroundSync {
    if (!SamsungHealthBackgroundSync.instance) {
      SamsungHealthBackgroundSync.instance = new SamsungHealthBackgroundSync();
    }
    return SamsungHealthBackgroundSync.instance;
  }

  /**
   * Initialize the background sync service
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🚀 [Samsung Background Sync] Initializing...');

      if (this.isInitialized) {
        console.log('⚠️ [Samsung Background Sync] Already initialized');
        return;
      }

      // Load configuration and status from storage
      await this.loadConfiguration();
      await this.loadJobStatus();

      // Set up app state listener
      this.setupAppStateListener();

      // Start background sync if enabled
      if (this.syncConfig.enableBackgroundSync) {
        await this.startBackgroundSync();
      }

      this.isInitialized = true;
      console.log('✅ [Samsung Background Sync] Initialized successfully');

    } catch (error) {
      console.error('❌ [Samsung Background Sync] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start background sync service
   */
  public async startBackgroundSync(): Promise<void> {
    try {
      console.log('🔄 [Samsung Background Sync] Starting background sync...');

      // Check if Samsung Health is connected
      const isConnected = await this.samsungHealthService.isConnected();
      if (!isConnected) {
        console.log('⚠️ [Samsung Background Sync] Samsung Health not connected, skipping');
        return;
      }

      // Stop any existing job
      await this.stopBackgroundSync();

      // Calculate next sync time
      const nextSyncTime = this.calculateNextSyncTime();
      
      // Start the background interval
      this.syncInterval = this.scheduleBackgroundInterval();

      this.jobStatus.isRunning = true;
      this.jobStatus.nextSyncTime = nextSyncTime;
      
      await this.saveJobStatus();

      console.log(`✅ [Samsung Background Sync] Started - next sync at ${format(nextSyncTime, 'HH:mm')}`);

    } catch (error) {
      console.error('❌ [Samsung Background Sync] Failed to start:', error);
      this.jobStatus.lastError = (error as Error).message;
      await this.saveJobStatus();
    }
  }

  /**
   * Stop background sync service
   */
  public async stopBackgroundSync(): Promise<void> {
    try {
      console.log('🛑 [Samsung Background Sync] Stopping background sync...');

      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      this.jobStatus.isRunning = false;
      this.jobStatus.nextSyncTime = null;
      
      await this.saveJobStatus();

      console.log('✅ [Samsung Background Sync] Stopped successfully');

    } catch (error) {
      console.error('❌ [Samsung Background Sync] Failed to stop:', error);
    }
  }

  /**
   * Perform manual sync now
   */
  public async syncNow(): Promise<SamsungHealthSyncResult> {
    try {
      console.log('⚡ [Samsung Background Sync] Manual sync triggered');

      // Check sync limits
      if (!this.canPerformSync()) {
        throw new SamsungHealthException(
          SamsungHealthErrorType.RATE_LIMITED,
          'Daily sync limit reached or in quiet hours'
        );
      }

      // Perform the sync
      const result = await this.dataProcessor.performManualSync();

      // Update job status
      this.jobStatus.lastSyncTime = new Date();
      this.jobStatus.totalSyncsToday += 1;
      this.jobStatus.totalActivitiesSync += result.activitiesCount;
      this.jobStatus.consecutiveFailures = 0;
      this.jobStatus.lastError = null;

      // Schedule next sync
      this.jobStatus.nextSyncTime = this.calculateNextSyncTime();

      await this.saveJobStatus();

      console.log(`✅ [Samsung Background Sync] Manual sync completed - ${result.activitiesCount} activities`);
      return result;

    } catch (error) {
      console.error('❌ [Samsung Background Sync] Manual sync failed:', error);
      
      this.jobStatus.consecutiveFailures += 1;
      this.jobStatus.lastError = (error as Error).message;
      await this.saveJobStatus();

      throw error;
    }
  }

  /**
   * Update sync configuration
   */
  public async updateConfiguration(config: Partial<SamsungHealthSyncConfig>): Promise<void> {
    try {
      console.log('⚙️ [Samsung Background Sync] Updating configuration...');

      this.syncConfig = { ...this.syncConfig, ...config };
      await this.saveConfiguration();

      // Restart background sync if needed
      if (this.syncConfig.enableBackgroundSync && this.isInitialized) {
        await this.startBackgroundSync();
      } else if (!this.syncConfig.enableBackgroundSync) {
        await this.stopBackgroundSync();
      }

      console.log('✅ [Samsung Background Sync] Configuration updated');

    } catch (error) {
      console.error('❌ [Samsung Background Sync] Failed to update configuration:', error);
      throw error;
    }
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): {
    config: SamsungHealthSyncConfig;
    status: SyncJobStatus;
    canSync: boolean;
    minutesToNextSync: number | null;
  } {
    const minutesToNextSync = this.jobStatus.nextSyncTime 
      ? differenceInMinutes(this.jobStatus.nextSyncTime, new Date())
      : null;

    return {
      config: this.syncConfig,
      status: this.jobStatus,
      canSync: this.canPerformSync(),
      minutesToNextSync: minutesToNextSync && minutesToNextSync > 0 ? minutesToNextSync : null
    };
  }

  /**
   * Reset sync statistics (for new day)
   */
  public async resetDailyStats(): Promise<void> {
    this.jobStatus.totalSyncsToday = 0;
    this.jobStatus.consecutiveFailures = 0;
    this.jobStatus.lastError = null;
    await this.saveJobStatus();
    console.log('🔄 [Samsung Background Sync] Daily stats reset');
  }

  /**
   * Schedule background interval
   */
  private scheduleBackgroundInterval(): number {
    const intervalMs = this.syncConfig.syncIntervalMinutes * 60 * 1000; // Convert to milliseconds
    
    const intervalId = setInterval(async () => {
      try {
        await this.performBackgroundSync();
      } catch (error) {
        console.error('❌ [Samsung Background Sync] Background interval failed:', error);
      }
    }, intervalMs);

    console.log(`⏰ [Samsung Background Sync] Scheduled interval every ${this.syncConfig.syncIntervalMinutes} minutes`);
    return intervalId as any; // TypeScript workaround for interval ID
  }

  /**
   * Perform background sync
   */
  private async performBackgroundSync(): Promise<void> {
    try {
      console.log('🔄 [Samsung Background Sync] Performing background sync...');

      // Check if we can perform sync
      if (!this.canPerformSync()) {
        console.log('⏭️ [Samsung Background Sync] Skipping - cannot sync now');
        this.jobStatus.nextSyncTime = this.calculateNextSyncTime();
        await this.saveJobStatus();
        return;
      }

      // Perform the sync
      const result = await this.dataProcessor.performManualSync();

      // Update status
      this.jobStatus.lastSyncTime = new Date();
      this.jobStatus.totalSyncsToday += 1;
      this.jobStatus.totalActivitiesSync += result.activitiesCount;
      this.jobStatus.consecutiveFailures = 0;
      this.jobStatus.lastError = null;

      console.log(`✅ [Samsung Background Sync] Background sync completed - ${result.activitiesCount} activities`);

    } catch (error) {
      console.error('❌ [Samsung Background Sync] Background sync failed:', error);
      
      this.jobStatus.consecutiveFailures += 1;
      this.jobStatus.lastError = (error as Error).message;
    }

    // Schedule next sync
    this.jobStatus.nextSyncTime = this.calculateNextSyncTime();
    await this.saveJobStatus();
  }

  /**
   * Setup app state listener for sync triggers
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * Handle app state changes
   */
  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    try {
      console.log(`📱 [Samsung Background Sync] App state changed: ${nextAppState}`);

      if (nextAppState === 'active' && this.syncConfig.syncOnAppOpen) {
        // App became active - sync if enabled
        const timeSinceLastSync = this.jobStatus.lastSyncTime 
          ? differenceInMinutes(new Date(), this.jobStatus.lastSyncTime)
          : Infinity;

        if (timeSinceLastSync > this.syncConfig.syncIntervalMinutes) {
          console.log('🚀 [Samsung Background Sync] App opened - triggering sync');
          await this.syncNow();
        }
      }

      if (nextAppState === 'background' && this.syncConfig.syncOnAppBackground) {
        // App went to background - sync if enabled
        console.log('📱 [Samsung Background Sync] App backgrounded - triggering sync');
        await this.syncNow();
      }

    } catch (error) {
      console.error('❌ [Samsung Background Sync] App state change handler failed:', error);
    }
  }

  /**
   * Calculate next sync time based on configuration
   */
  private calculateNextSyncTime(): Date {
    const now = new Date();
    let nextSync = addMinutes(now, this.syncConfig.syncIntervalMinutes);

    // Apply battery optimization (longer intervals if many failures)
    if (this.syncConfig.batteryOptimization && this.jobStatus.consecutiveFailures > 0) {
      const backoffMultiplier = Math.min(Math.pow(2, this.jobStatus.consecutiveFailures), 8);
      nextSync = addMinutes(now, this.syncConfig.syncIntervalMinutes * backoffMultiplier);
    }

    // Avoid quiet hours
    const hour = nextSync.getHours();
    if (this.syncConfig.quietHoursStart < this.syncConfig.quietHoursEnd) {
      // Same day quiet hours (e.g., 22:00 - 06:00)
      if (hour >= this.syncConfig.quietHoursStart || hour < this.syncConfig.quietHoursEnd) {
        nextSync.setHours(this.syncConfig.quietHoursEnd, 0, 0, 0);
      }
    }

    return nextSync;
  }

  /**
   * Check if sync can be performed now
   */
  private canPerformSync(): boolean {
    // Check daily limit
    if (this.jobStatus.totalSyncsToday >= this.syncConfig.maxDailySync) {
      return false;
    }

    // Check quiet hours
    const hour = new Date().getHours();
    if (this.syncConfig.quietHoursStart < this.syncConfig.quietHoursEnd) {
      if (hour >= this.syncConfig.quietHoursStart || hour < this.syncConfig.quietHoursEnd) {
        return false;
      }
    }

    return true;
  }

  /**
   * Load configuration from storage
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.SYNC_CONFIG);
      if (stored) {
        this.syncConfig = { ...this.DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('❌ [Samsung Background Sync] Failed to load configuration:', error);
    }
  }

  /**
   * Save configuration to storage
   */
  private async saveConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SYNC_CONFIG, 
        JSON.stringify(this.syncConfig)
      );
    } catch (error) {
      console.error('❌ [Samsung Background Sync] Failed to save configuration:', error);
    }
  }

  /**
   * Load job status from storage
   */
  private async loadJobStatus(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.JOB_STATUS);
      if (stored) {
        const storedStatus = JSON.parse(stored);
        this.jobStatus = {
          ...this.jobStatus,
          ...storedStatus,
          isRunning: false, // Always start as not running
          lastSyncTime: storedStatus.lastSyncTime ? new Date(storedStatus.lastSyncTime) : null,
          nextSyncTime: storedStatus.nextSyncTime ? new Date(storedStatus.nextSyncTime) : null
        };
      }
    } catch (error) {
      console.error('❌ [Samsung Background Sync] Failed to load job status:', error);
    }
  }

  /**
   * Save job status to storage
   */
  private async saveJobStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.JOB_STATUS, 
        JSON.stringify(this.jobStatus)
      );
    } catch (error) {
      console.error('❌ [Samsung Background Sync] Failed to save job status:', error);
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    try {
      console.log('🧹 [Samsung Background Sync] Cleaning up...');

      await this.stopBackgroundSync();

      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }

      this.isInitialized = false;
      console.log('✅ [Samsung Background Sync] Cleanup completed');

    } catch (error) {
      console.error('❌ [Samsung Background Sync] Cleanup failed:', error);
    }
  }
}

export default SamsungHealthBackgroundSync;
