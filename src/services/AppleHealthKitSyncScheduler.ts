import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { AppleHealthKitService } from './AppleHealthKitService';
import {
  SyncConfiguration,
  SyncStatus,
  SyncMetrics,
  SyncResult
} from '../types/AppleHealthKitTypes';
import { useCalorieStore } from '../stores/calorieStore';

export class AppleHealthKitSyncScheduler {
  private static instance: AppleHealthKitSyncScheduler;
  private syncConfiguration!: SyncConfiguration;
  private syncStatus!: SyncStatus;
  private syncMetrics!: SyncMetrics;
  private healthKitService: AppleHealthKitService;
  private syncTimer: number | null = null;
  private appStateSubscription: any = null;

  private constructor() {
    this.healthKitService = new AppleHealthKitService();
    this.initializeDefaults();
    this.loadConfiguration();
    this.setupAppStateListener();
  }

  public static getInstance(): AppleHealthKitSyncScheduler {
    if (!AppleHealthKitSyncScheduler.instance) {
      AppleHealthKitSyncScheduler.instance = new AppleHealthKitSyncScheduler();
    }
    return AppleHealthKitSyncScheduler.instance;
  }

  private initializeDefaults(): void {
    this.syncConfiguration = {
      syncEnabled: true,
      realTimeSync: true,
      periodicSync: true,
      periodicSyncInterval: 60000,
      batteryOptimization: true,
      wifiOnlySync: false,
      maxSyncRetries: 3,
      syncTimeout: 30000
    };

    this.syncStatus = {
      enabled: false,
      realTimeEnabled: false,
      periodicEnabled: false,
      lastSyncTime: new Date(),
      timeSinceLastSync: 0,
      syncInProgress: false,
      activeObservers: [],
      totalSyncs: 0,
      successfulSyncs: 0
    };

    this.syncMetrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastSyncDuration: 0,
      averageSyncDuration: 0,
      dataTypeMetrics: {},
      batteryOptimizationEvents: 0
    };
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const configData = await AsyncStorage.getItem('healthkit_sync_config');
      if (configData) {
        this.syncConfiguration = { ...this.syncConfiguration, ...JSON.parse(configData) };
      }
    } catch (error) {
      console.error('Failed to load sync configuration:', error);
    }
  }

  private async saveConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem('healthkit_sync_config', JSON.stringify(this.syncConfiguration));
    } catch (error) {
      console.error('Failed to save sync configuration:', error);
    }
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && this.syncConfiguration.periodicSync) {
        this.performManualSync();
      }
    });
  }

  public async setupBackgroundSync(): Promise<void> {
    if (!this.syncConfiguration.syncEnabled) {
      return;
    }

    try {
      await this.healthKitService.initialize();
      
      if (this.syncConfiguration.periodicSync) {
        this.schedulePeriodicSync(this.syncConfiguration.periodicSyncInterval);
      }

      await this.performComprehensiveSync();
      
      this.updateSyncStatus({ 
        enabled: true,
        periodicEnabled: this.syncConfiguration.periodicSync,
        realTimeEnabled: this.syncConfiguration.realTimeSync
      });
    } catch (error) {
      console.error('Failed to setup background sync:', error);
      this.updateSyncStatus({ lastError: (error as Error).message });
    }
  }

  private schedulePeriodicSync(intervalMs: number): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.performComprehensiveSync();
    }, intervalMs) as any;
  }

  private mapHealthKitWorkoutToCalorieStore(workout: any) {
    // Map HealthKit workout type to our SportType
    const sportMapping: { [key: string]: string } = {
      'running': 'running',
      'walking': 'running', // Walking mapped to running
      'cycling': 'cycling',
      'swimming': 'swimming',
      'strength': 'strength-training',
      'crossfit': 'crossfit',
      'hiit': 'crossfit', // HIIT mapped to crossfit
      'martial_arts': 'martial-arts',
      'tennis': 'team-sports',
      'basketball': 'team-sports',
      'soccer': 'team-sports',
      'cardio': 'general-fitness',
      'other': 'general-fitness'
    };

    const sport = sportMapping[workout.workoutType] || 'general-fitness';
    const today = new Date().toISOString().split('T')[0];

    return {
      date: today,
      sport: sport as any,
      name: workout.activityName || workout.workoutType,
      duration: workout.duration,
      startTime: workout.startDate,
      endTime: workout.endDate,
      intensity: 'moderate' as any, // Default to moderate intensity
      caloriesBurned: workout.calories,
      source: 'HealthKit'
    };
  }

  public async performComprehensiveSync(): Promise<SyncResult> {
    const startTime = new Date();
    
    try {
      this.updateSyncStatus({ syncInProgress: true });

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      const workouts = await this.healthKitService.getWorkouts(startDate, endDate);
      const store = useCalorieStore.getState();
      
      for (const workout of workouts) {
        const mappedWorkout = this.mapHealthKitWorkoutToCalorieStore(workout);
        store.logWorkout(mappedWorkout);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      this.updateSyncMetrics({
        totalSyncs: this.syncMetrics.totalSyncs + 1,
        successfulSyncs: this.syncMetrics.successfulSyncs + 1,
        lastSyncDuration: duration
      });

      this.updateSyncStatus({
        syncInProgress: false,
        lastSyncTime: endTime,
        timeSinceLastSync: 0
      });

      return { 
        success: true, 
        startTime, 
        endTime, 
        duration, 
        syncedDataTypes: ['workouts'], 
        errors: [] 
      };
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      this.updateSyncMetrics({
        totalSyncs: this.syncMetrics.totalSyncs + 1,
        failedSyncs: this.syncMetrics.failedSyncs + 1
      });

      this.updateSyncStatus({
        syncInProgress: false,
        lastError: (error as Error).message
      });

      return { 
        success: false, 
        startTime, 
        endTime, 
        duration, 
        syncedDataTypes: [], 
        errors: [(error as Error).message] 
      };
    }
  }

  public async performManualSync(): Promise<SyncResult> {
    try {
      return await this.performComprehensiveSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
      return { 
        success: false, 
        startTime: new Date(), 
        endTime: new Date(), 
        duration: 0, 
        syncedDataTypes: [], 
        errors: [(error as Error).message] 
      };
    }
  }

  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
  }

  private updateSyncMetrics(updates: Partial<SyncMetrics>): void {
    this.syncMetrics = { ...this.syncMetrics, ...updates };
    this.saveConfiguration();
  }

  public getConfiguration(): SyncConfiguration {
    return { ...this.syncConfiguration };
  }

  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  public getSyncMetrics(): SyncMetrics {
    return { ...this.syncMetrics };
  }

  public async forceSync(): Promise<SyncResult> {
    return await this.performComprehensiveSync();
  }

  public async resumeSync(): Promise<void> {
    await this.updateConfiguration({ syncEnabled: true });
  }

  public async pauseSync(): Promise<void> {
    await this.updateConfiguration({ syncEnabled: false });
  }

  public async enableRealTimeSync(): Promise<void> {
    await this.updateConfiguration({ realTimeSync: true });
  }

  public async disableRealTimeSync(): Promise<void> {
    await this.updateConfiguration({ realTimeSync: false });
  }

  public async updateConfiguration(config: Partial<SyncConfiguration>): Promise<void> {
    this.syncConfiguration = { ...this.syncConfiguration, ...config };
    await this.saveConfiguration();

    if (this.syncConfiguration.syncEnabled) {
      await this.setupBackgroundSync();
    } else {
      this.stopBackgroundSync();
    }
  }

  public stopBackgroundSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    this.updateSyncStatus({ 
      enabled: false,
      periodicEnabled: false,
      realTimeEnabled: false,
      syncInProgress: false
    });
  }

  public destroy(): void {
    this.stopBackgroundSync();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}
