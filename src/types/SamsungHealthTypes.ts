/**
 * Samsung Health Integration Types
 * 
 * Type definitions for Samsung Health API integration
 */

// Authentication & Credentials
export interface SamsungHealthCredentials {
  accessToken: string;
  refreshToken: string;
  userId: string;
  expiresAt: Date;
}

export interface SamsungOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface SamsungAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  user_id: string;
}

// Connection Status
export interface SamsungHealthConnectionStatus {
  isConnected: boolean;
  isAuthenticating: boolean;
  lastSyncTime: Date | null;
  connectionError: string | null;
  userId: string | null;
  permissions: string[];
}

// Activity & Exercise Data
export interface SamsungHealthActivity {
  uuid: string;
  exercise_type: number; // Samsung's exercise type codes
  start_time: string; // ISO string
  end_time: string;
  duration: number; // milliseconds
  calorie: number;
  distance?: number; // meters
  step_count?: number;
  heart_rate?: {
    average: number;
    max: number;
    min: number;
  };
  location_data?: {
    latitude: number;
    longitude: number;
  }[];
  additional_info?: {
    max_speed?: number;
    max_altitude?: number;
    live_data?: any[];
  };
}

// Daily Health Metrics
export interface SamsungHealthDailyMetrics {
  date: string; // YYYY-MM-DD
  step_count: number;
  calorie: number;
  active_calorie: number;
  distance: number; // meters
  sleep_data?: {
    start_time: string;
    end_time: string;
    duration: number; // minutes
    efficiency: number; // percentage
    deep_sleep: number; // minutes
    light_sleep: number; // minutes
    rem_sleep: number; // minutes
    awake_time: number; // minutes
  };
  heart_rate?: {
    resting: number;
    average: number;
    variability?: number;
  };
  stress_level?: number; // 0-100
}

// Body Composition
export interface SamsungHealthBodyComposition {
  uuid: string;
  create_time: string;
  weight: number; // kg
  body_fat_percentage?: number;
  muscle_mass?: number; // kg
  bone_mass?: number; // kg
  body_water?: number; // percentage
  basal_metabolic_rate?: number; // kcal
  visceral_fat_level?: number;
}

// API Response Types
export interface SamsungHealthApiResponse<T> {
  result: T[];
  count: number;
  has_more: boolean;
  next_page_token?: string;
}

export interface SamsungHealthError {
  error_code: string;
  error_msg: string;
  detail?: string;
}

// Exercise Type Mappings
export enum SamsungExerciseType {
  RUNNING = 1001,
  WALKING = 1002,
  HIKING = 1003,
  CYCLING = 11007,
  INDOOR_CYCLING = 11008,
  SWIMMING = 14001,
  WEIGHT_TRAINING = 13001,
  YOGA = 12001,
  PILATES = 12002,
  BASKETBALL = 15001,
  SOCCER = 15002,
  TENNIS = 15003,
  GOLF = 15004,
  CLIMBING = 16001,
  ELLIPTICAL = 11001,
  ROWING = 11002,
  GENERAL_FITNESS = 10001,
  OTHER = 90000
}

// Sync Configuration
export interface SamsungHealthSyncConfig {
  enabled: boolean;
  syncActivities: boolean;
  syncDailyMetrics: boolean;
  syncBodyComposition: boolean;
  syncSleep: boolean;
  syncHeartRate: boolean;
  syncFrequency: 'manual' | 'daily' | 'hourly';
  lastSyncTime?: Date;
  // Background sync specific settings
  enableBackgroundSync: boolean;
  syncIntervalMinutes: number;
  syncOnAppOpen: boolean;
  syncOnAppBackground: boolean;
  maxDailySync: number;
  wifiOnlySync: boolean;
  batteryOptimization: boolean;
  quietHoursStart: number; // Hour (0-23)
  quietHoursEnd: number; // Hour (0-23)
}

// Sync Results
export interface SamsungHealthSyncResult {
  success: boolean;
  activitiesCount: number;
  newWorkouts: SamsungHealthActivity[];
  dailyMetrics?: SamsungHealthDailyMetrics;
  bodyComposition?: SamsungHealthBodyComposition[];
  error?: string;
  lastSyncTime: Date;
}

// Permission Scopes
export const SAMSUNG_HEALTH_SCOPES = {
  ACTIVITY: 'read:health:activity',
  NUTRITION: 'read:health:nutrition',
  SLEEP: 'read:health:sleep',
  BODY_COMPOSITION: 'read:health:body_composition',
  HEART_RATE: 'read:health:heart_rate',
  STRESS: 'read:health:stress'
} as const;

export type SamsungHealthScope = typeof SAMSUNG_HEALTH_SCOPES[keyof typeof SAMSUNG_HEALTH_SCOPES];

// API Endpoints
export const SAMSUNG_HEALTH_ENDPOINTS = {
  BASE_URL: 'https://shealthapi.samsung.com/v1.1',
  OAUTH_BASE: 'https://account.samsung.com/mobile/account',
  AUTHORIZE: '/oauth2/authorize',
  TOKEN: '/oauth2/token',
  USER_PROFILE: '/user/profile',
  ACTIVITIES: '/workouts',
  DAILY_STEPS: '/steps/daily_totals',
  SLEEP: '/sleep',
  HEART_RATE: '/heart_rate',
  BODY_COMPOSITION: '/body_composition',
  DAILY_SUMMARY: '/daily_summary'
} as const;

// Samsung Health Service Configuration
export interface SamsungHealthServiceConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: SamsungHealthScope[];
  apiTimeout: number;
  retryAttempts: number;
  enableLogging: boolean;
}

// Error Types
export enum SamsungHealthErrorType {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class SamsungHealthException extends Error {
  public readonly type: SamsungHealthErrorType;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    type: SamsungHealthErrorType,
    message: string,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = 'SamsungHealthException';
    this.type = type;
    this.code = code;
    this.details = details;
  }
}

// Exercise Type Mapping to App Categories
export const SAMSUNG_EXERCISE_MAPPING: Record<number, string> = {
  [SamsungExerciseType.RUNNING]: 'running',
  [SamsungExerciseType.WALKING]: 'walking',
  [SamsungExerciseType.HIKING]: 'hiking',
  [SamsungExerciseType.CYCLING]: 'cycling',
  [SamsungExerciseType.INDOOR_CYCLING]: 'cycling',
  [SamsungExerciseType.SWIMMING]: 'swimming',
  [SamsungExerciseType.WEIGHT_TRAINING]: 'strength',
  [SamsungExerciseType.YOGA]: 'yoga',
  [SamsungExerciseType.PILATES]: 'yoga',
  [SamsungExerciseType.BASKETBALL]: 'sports',
  [SamsungExerciseType.SOCCER]: 'sports',
  [SamsungExerciseType.TENNIS]: 'sports',
  [SamsungExerciseType.GOLF]: 'sports',
  [SamsungExerciseType.CLIMBING]: 'climbing',
  [SamsungExerciseType.ELLIPTICAL]: 'cardio',
  [SamsungExerciseType.ROWING]: 'cardio',
  [SamsungExerciseType.GENERAL_FITNESS]: 'other',
  [SamsungExerciseType.OTHER]: 'other'
};

export default {
  SamsungExerciseType,
  SAMSUNG_HEALTH_SCOPES,
  SAMSUNG_HEALTH_ENDPOINTS,
  SAMSUNG_EXERCISE_MAPPING,
  SamsungHealthErrorType,
  SamsungHealthException
};
