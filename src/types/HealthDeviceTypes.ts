/**
 * Unified Health Device Integration Types
 * 
 * This file defines the unified interface for all health device platforms
 * (Garmin, Samsung Health, Apple HealthKit) to provide a consistent
 * experience regardless of the underlying platform.
 */

export type HealthPlatform = 'garmin' | 'samsung' | 'apple';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'expired' | 'error';

export interface HealthDeviceConnection {
  platform: HealthPlatform;
  status: ConnectionStatus;
  deviceName?: string;
  deviceModel?: string;
  connectedAt?: Date;
  lastSync?: Date;
  userId?: string;
  error?: string;
}

export interface UniversalActivity {
  id: string;
  platform: HealthPlatform;
  activityType: string;
  displayName: string;
  startTime: Date;
  duration: number; // minutes
  calories?: number;
  distance?: number; // meters
  averageHeartRate?: number;
  maxHeartRate?: number;
  steps?: number;
  elevation?: number; // meters
  averageSpeed?: number; // m/s
  maxSpeed?: number; // m/s
  sportSpecificData?: Record<string, any>;
  syncedAt: Date;
}

export interface DailyHealthMetrics {
  date: string; // YYYY-MM-DD
  platform: HealthPlatform;
  steps?: number;
  caloriesBurned?: number;
  activeMinutes?: number;
  restingHeartRate?: number;
  bodyBattery?: number; // Garmin specific
  stressLevel?: number;
  sleepDuration?: number; // minutes
  sleepQuality?: number; // 0-100
  syncedAt: Date;
}

export interface HealthDeviceCapabilities {
  platform: HealthPlatform;
  canImportActivities: boolean;
  canImportDailyMetrics: boolean;
  canImportSleep: boolean;
  canImportHeartRate: boolean;
  canImportBodyComposition: boolean;
  canTrackLiveWorkouts: boolean;
  requiresOAuth: boolean;
  requiresPermissions: string[];
}

export interface ConnectionRequest {
  platform: HealthPlatform;
  credentials?: {
    username?: string;
    password?: string;
    accessToken?: string;
    refreshToken?: string;
  };
  permissions?: string[];
  consentOptions?: import('../services/GarminCredentialManager').CredentialConsentOptions;
}

export interface ConnectionResult {
  success: boolean;
  connection?: HealthDeviceConnection;
  error?: string;
  message?: string;
}

// Platform-specific activity type mappings
export const ACTIVITY_TYPE_MAPPINGS: Record<HealthPlatform, Record<string, string>> = {
  garmin: {
    'running': 'Running',
    'cycling': 'Cycling',
    'swimming': 'Swimming',
    'strength_training': 'Strength Training',
    'cardio': 'Cardio',
    'yoga': 'Yoga',
    'walking': 'Walking',
    'hiking': 'Hiking',
  },
  samsung: {
    '1001': 'Running',
    '11007': 'Cycling',
    '14001': 'Swimming',
    '15011': 'Strength Training',
    '3001': 'Walking',
    '4001': 'Hiking',
  },
  apple: {
    'HKWorkoutActivityTypeRunning': 'Running',
    'HKWorkoutActivityTypeCycling': 'Cycling',
    'HKWorkoutActivityTypeSwimming': 'Swimming',
    'HKWorkoutActivityTypeFunctionalStrengthTraining': 'Strength Training',
    'HKWorkoutActivityTypeWalking': 'Walking',
    'HKWorkoutActivityTypeHiking': 'Hiking',
  }
};

// Platform display information
export const PLATFORM_INFO: Record<HealthPlatform, {
  displayName: string;
  description: string;
  icon: string;
  color: string;
  website: string;
}> = {
  garmin: {
    displayName: 'Garmin Connect',
    description: 'Import activities, training metrics, and advanced performance data from your Garmin devices',
    icon: '⌚',
    color: '#007CC3',
    website: 'https://connect.garmin.com'
  },
  samsung: {
    displayName: 'Samsung Health',
    description: 'Sync activities, daily metrics, and health data from Samsung Health app',
    icon: '📱',
    color: '#1BA1E2',
    website: 'https://health.samsung.com'
  },
  apple: {
    displayName: 'Apple HealthKit',
    description: 'Connect with Apple Health to import workouts and health metrics from your iPhone and Apple Watch',
    icon: '🍎',
    color: '#007AFF',
    website: 'https://www.apple.com/health/'
  }
};