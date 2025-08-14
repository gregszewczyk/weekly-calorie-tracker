/**
 * Apple HealthKit Type Definitions
 * 
 * Comprehensive type definitions for Apple HealthKit integration
 * including permissions, data types, and service interfaces.
 */

export interface HealthKitPermissions {
  read: string[];
  write: string[];
}

export interface HealthKitPermissionStatus {
  type: string;
  status: 'authorized' | 'denied' | 'notDetermined' | 'restricted';
}

export interface HealthKitAvailability {
  isAvailable: boolean;
  platform: 'ios' | 'android' | 'other';
  version?: string;
  message?: string;
}

export interface HealthKitConnectionStatus {
  isConnected: boolean;
  connectedAt?: Date;
  lastSyncTime?: Date;
  permissionsGranted: string[];
  permissionsDenied: string[];
  totalPermissions: number;
  connectionHealth: 'excellent' | 'good' | 'limited' | 'poor';
}

// Apple HealthKit Workout Types
export interface AppleHealthKitWorkout {
  uuid: string;
  activityType: string; // HKWorkoutActivityType
  activityName: string; // Friendly name
  startDate: Date;
  endDate: Date;
  duration: number; // minutes
  totalEnergyBurned?: number; // kcal
  totalDistance?: number; // meters
  heartRateData?: {
    average?: number; // bpm
    maximum?: number; // bpm
    minimum?: number; // bpm
    samples?: { value: number; date: Date }[];
  };
  metadata?: {
    indoor?: boolean;
    weather?: string;
    device?: string;
    elevationGained?: number; // meters
  };
  source: string; // Which app/device recorded this
  calories: number; // For compatibility with existing WorkoutSession
  workoutType: string; // Mapped to app workout types
}

// HealthKit Workout Type Mapping
export const APPLE_WORKOUT_MAPPING: Record<string, string> = {
  // Cardio
  'HKWorkoutActivityTypeRunning': 'running',
  'HKWorkoutActivityTypeWalking': 'walking',
  'HKWorkoutActivityTypeCycling': 'cycling',
  'HKWorkoutActivityTypeSwimming': 'swimming',
  'HKWorkoutActivityTypeElliptical': 'cardio',
  'HKWorkoutActivityTypeRowing': 'rowing',
  'HKWorkoutActivityTypeStepTraining': 'cardio',
  'HKWorkoutActivityTypeStairClimbing': 'cardio',
  
  // Strength & Functional
  'HKWorkoutActivityTypeFunctionalStrengthTraining': 'strength',
  'HKWorkoutActivityTypeTraditionalStrengthTraining': 'strength',
  'HKWorkoutActivityTypeCoreTraining': 'strength',
  'HKWorkoutActivityTypeFlexibility': 'stretching',
  'HKWorkoutActivityTypeYoga': 'yoga',
  'HKWorkoutActivityTypePilates': 'pilates',
  
  // High Intensity
  'HKWorkoutActivityTypeHighIntensityIntervalTraining': 'hiit',
  'HKWorkoutActivityTypeCrossTraining': 'crossfit',
  'HKWorkoutActivityTypeKickboxing': 'martial_arts',
  'HKWorkoutActivityTypeBoxing': 'martial_arts',
  'HKWorkoutActivityTypeMartialArts': 'martial_arts',
  
  // Sports
  'HKWorkoutActivityTypeTennis': 'tennis',
  'HKWorkoutActivityTypeBasketball': 'basketball',
  'HKWorkoutActivityTypeSoccer': 'soccer',
  'HKWorkoutActivityTypeAmericanFootball': 'football',
  'HKWorkoutActivityTypeBaseball': 'baseball',
  'HKWorkoutActivityTypeVolleyball': 'volleyball',
  'HKWorkoutActivityTypeGolf': 'golf',
  
  // Water Sports
  'HKWorkoutActivityTypeSurfingSports': 'surfing',
  'HKWorkoutActivityTypePaddleSports': 'paddling',
  'HKWorkoutActivityTypeWaterFitness': 'swimming',
  'HKWorkoutActivityTypeWaterSports': 'water_sports',
  
  // Winter Sports
  'HKWorkoutActivityTypeDownhillSkiing': 'skiing',
  'HKWorkoutActivityTypeCrossCountrySkiing': 'skiing',
  'HKWorkoutActivityTypeSnowboarding': 'snowboarding',
  'HKWorkoutActivityTypeSnowSports': 'snow_sports',
  
  // Other
  'HKWorkoutActivityTypeDance': 'dance',
  'HKWorkoutActivityTypeOther': 'other',
  'HKWorkoutActivityTypeMixedCardio': 'cardio',
  'HKWorkoutActivityTypePreparationAndRecovery': 'recovery',
};

// Apple HealthKit Daily Metrics Interface
export interface AppleHealthDailyMetrics {
  date: string; // YYYY-MM-DD
  steps: number;
  activeEnergyBurned: number; // kcal
  basalEnergyBurned: number; // kcal
  distanceWalkingRunning: number; // meters
  sleepAnalysis?: {
    inBedStartTime: Date;
    inBedEndTime: Date;
    sleepStartTime: Date;
    sleepEndTime: Date;
    timeInBed: number; // minutes
    timeAsleep: number; // minutes
    sleepEfficiency: number; // percentage
    sleepStages?: {
      deep: number; // minutes
      core: number; // minutes  
      rem: number; // minutes
      awake: number; // minutes
    };
  };
  heartRateData?: {
    resting: number; // bpm
    average: number; // bpm
    variability: number; // SDNN in ms
  };
  standHours?: number; // Apple Watch stand goals
}

// Apple HealthKit Body Composition Interface
export interface AppleHealthBodyComposition {
  uuid: string;
  date: Date;
  bodyMass: number; // kg
  bodyFatPercentage?: number;
  leanBodyMass?: number; // kg
  bodyMassIndex?: number;
  source: string; // Which app/device recorded this
  metadata?: {
    device?: string;
    scale?: string;
  };
}

// Apple HealthKit Body Composition Interface
export interface AppleHealthBodyComposition {
  uuid: string;
  date: Date;
  bodyMass: number; // kg
  bodyFatPercentage?: number;
  leanBodyMass?: number; // kg
  bodyMassIndex?: number;
  source: string; // Which app/device recorded this
  metadata?: {
    device?: string;
    scale?: string;
  };
}

// HealthKit Body Measurement Types
export const BODY_METRICS = {
  weight: 'HKQuantityTypeIdentifierBodyMass',
  bodyFat: 'HKQuantityTypeIdentifierBodyFatPercentage', 
  leanMass: 'HKQuantityTypeIdentifierLeanBodyMass',
  bmi: 'HKQuantityTypeIdentifierBodyMassIndex'
};

// Apple HealthKit Data Types
export const HEALTHKIT_DATA_TYPES = {
  // Activity & Fitness
  STEPS: 'HKQuantityTypeIdentifierStepCount',
  ACTIVE_ENERGY: 'HKQuantityTypeIdentifierActiveEnergyBurned',
  BASAL_ENERGY: 'HKQuantityTypeIdentifierBasalEnergyBurned',
  DISTANCE_WALKING_RUNNING: 'HKQuantityTypeIdentifierDistanceWalkingRunning',
  FLIGHTS_CLIMBED: 'HKQuantityTypeIdentifierFlightsClimbed',
  EXERCISE_TIME: 'HKQuantityTypeIdentifierAppleExerciseTime',
  STAND_TIME: 'HKQuantityTypeIdentifierAppleStandTime',
  
  // Workouts
  WORKOUT: 'HKWorkoutTypeIdentifier',
  
  // Heart Rate
  HEART_RATE: 'HKQuantityTypeIdentifierHeartRate',
  RESTING_HEART_RATE: 'HKQuantityTypeIdentifierRestingHeartRate',
  HEART_RATE_VARIABILITY: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  
  // Sleep
  SLEEP_ANALYSIS: 'HKCategoryTypeIdentifierSleepAnalysis',
  
  // Body Measurements
  BODY_MASS: 'HKQuantityTypeIdentifierBodyMass',
  BODY_FAT_PERCENTAGE: 'HKQuantityTypeIdentifierBodyFatPercentage',
  LEAN_BODY_MASS: 'HKQuantityTypeIdentifierLeanBodyMass',
  BODY_MASS_INDEX: 'HKQuantityTypeIdentifierBodyMassIndex',
  HEIGHT: 'HKQuantityTypeIdentifierHeight',
  
  // Nutrition
  DIETARY_ENERGY_CONSUMED: 'HKQuantityTypeIdentifierDietaryEnergyConsumed',
  DIETARY_PROTEIN: 'HKQuantityTypeIdentifierDietaryProtein',
  DIETARY_CARBOHYDRATES: 'HKQuantityTypeIdentifierDietaryCarbohydrates',
  DIETARY_FAT_TOTAL: 'HKQuantityTypeIdentifierDietaryFatTotal',
  DIETARY_FIBER: 'HKQuantityTypeIdentifierDietaryFiber',
  DIETARY_WATER: 'HKQuantityTypeIdentifierDietaryWater',
  
  // Vitals
  BLOOD_OXYGEN: 'HKQuantityTypeIdentifierOxygenSaturation',
  BODY_TEMPERATURE: 'HKQuantityTypeIdentifierBodyTemperature',
  RESPIRATORY_RATE: 'HKQuantityTypeIdentifierRespiratoryRate',
} as const;

// HealthKit Sample Queries for Daily Metrics
export const DAILY_METRICS_QUERIES = {
  steps: HEALTHKIT_DATA_TYPES.STEPS,
  activeCalories: HEALTHKIT_DATA_TYPES.ACTIVE_ENERGY,
  basalCalories: HEALTHKIT_DATA_TYPES.BASAL_ENERGY,
  distance: HEALTHKIT_DATA_TYPES.DISTANCE_WALKING_RUNNING,
  sleep: HEALTHKIT_DATA_TYPES.SLEEP_ANALYSIS,
  heartRate: HEALTHKIT_DATA_TYPES.HEART_RATE,
  restingHeartRate: HEALTHKIT_DATA_TYPES.RESTING_HEART_RATE,
  hrv: HEALTHKIT_DATA_TYPES.HEART_RATE_VARIABILITY,
  standTime: HEALTHKIT_DATA_TYPES.STAND_TIME,
} as const;

// Permission Groups for UI
export interface HealthKitPermissionGroup {
  id: string;
  title: string;
  description: string;
  icon: string;
  dataTypes: string[];
  required: boolean;
  benefits: string[];
}

export const HEALTHKIT_PERMISSION_GROUPS: HealthKitPermissionGroup[] = [
  {
    id: 'activity',
    title: 'Activity & Fitness',
    description: 'Daily activity tracking for accurate calorie calculations',
    icon: '🏃‍♂️',
    dataTypes: [
      HEALTHKIT_DATA_TYPES.STEPS,
      HEALTHKIT_DATA_TYPES.ACTIVE_ENERGY,
      HEALTHKIT_DATA_TYPES.BASAL_ENERGY,
      HEALTHKIT_DATA_TYPES.DISTANCE_WALKING_RUNNING,
      HEALTHKIT_DATA_TYPES.FLIGHTS_CLIMBED,
      HEALTHKIT_DATA_TYPES.EXERCISE_TIME,
    ],
    required: true,
    benefits: [
      'Automatic calorie burn tracking',
      'More accurate TDEE calculations',
      'Real-time activity adjustments',
    ],
  },
  {
    id: 'workouts',
    title: 'Workouts & Exercise',
    description: 'Import Apple Watch workouts and exercise sessions',
    icon: '💪',
    dataTypes: [
      HEALTHKIT_DATA_TYPES.WORKOUT,
      HEALTHKIT_DATA_TYPES.HEART_RATE,
      HEALTHKIT_DATA_TYPES.ACTIVE_ENERGY,
    ],
    required: true,
    benefits: [
      'Automatic workout logging',
      'Heart rate zone analysis',
      'Exercise calorie precision',
    ],
  },
  {
    id: 'sleep',
    title: 'Sleep & Recovery',
    description: 'Sleep quality data for recovery-based nutrition',
    icon: '😴',
    dataTypes: [
      HEALTHKIT_DATA_TYPES.SLEEP_ANALYSIS,
      HEALTHKIT_DATA_TYPES.HEART_RATE_VARIABILITY,
      HEALTHKIT_DATA_TYPES.RESTING_HEART_RATE,
    ],
    required: false,
    benefits: [
      'Recovery-based meal timing',
      'Sleep quality nutrition tips',
      'Circadian rhythm optimization',
    ],
  },
  {
    id: 'body',
    title: 'Body Composition',
    description: 'Weight and body measurement tracking',
    icon: '⚖️',
    dataTypes: [
      HEALTHKIT_DATA_TYPES.BODY_MASS,
      HEALTHKIT_DATA_TYPES.BODY_FAT_PERCENTAGE,
      HEALTHKIT_DATA_TYPES.LEAN_BODY_MASS,
      HEALTHKIT_DATA_TYPES.HEIGHT,
    ],
    required: false,
    benefits: [
      'Automatic weight logging',
      'Body composition trends',
      'Smart scale integration',
    ],
  },
  {
    id: 'vitals',
    title: 'Health Vitals',
    description: 'Comprehensive health monitoring',
    icon: '❤️',
    dataTypes: [
      HEALTHKIT_DATA_TYPES.HEART_RATE,
      HEALTHKIT_DATA_TYPES.BLOOD_OXYGEN,
      HEALTHKIT_DATA_TYPES.RESPIRATORY_RATE,
    ],
    required: false,
    benefits: [
      'Stress-based nutrition',
      'Health trend monitoring',
      'Wellness optimization',
    ],
  },
];

// Required permissions for basic functionality
export const REQUIRED_PERMISSIONS: HealthKitPermissions = {
  read: [
    HEALTHKIT_DATA_TYPES.STEPS,
    HEALTHKIT_DATA_TYPES.ACTIVE_ENERGY,
    HEALTHKIT_DATA_TYPES.BASAL_ENERGY,
    HEALTHKIT_DATA_TYPES.WORKOUT,
    HEALTHKIT_DATA_TYPES.HEART_RATE,
    HEALTHKIT_DATA_TYPES.BODY_MASS,
  ],
  write: [
    HEALTHKIT_DATA_TYPES.WORKOUT,
    HEALTHKIT_DATA_TYPES.ACTIVE_ENERGY,
    HEALTHKIT_DATA_TYPES.DIETARY_ENERGY_CONSUMED,
  ],
};

// Optional permissions for enhanced features
export const OPTIONAL_PERMISSIONS: HealthKitPermissions = {
  read: [
    HEALTHKIT_DATA_TYPES.SLEEP_ANALYSIS,
    HEALTHKIT_DATA_TYPES.HEART_RATE_VARIABILITY,
    HEALTHKIT_DATA_TYPES.RESTING_HEART_RATE,
    HEALTHKIT_DATA_TYPES.BODY_FAT_PERCENTAGE,
    HEALTHKIT_DATA_TYPES.LEAN_BODY_MASS,
    HEALTHKIT_DATA_TYPES.BLOOD_OXYGEN,
  ],
  write: [
    HEALTHKIT_DATA_TYPES.DIETARY_PROTEIN,
    HEALTHKIT_DATA_TYPES.DIETARY_CARBOHYDRATES,
    HEALTHKIT_DATA_TYPES.DIETARY_FAT_TOTAL,
    HEALTHKIT_DATA_TYPES.DIETARY_WATER,
  ],
};

// Service interface
export interface IAppleHealthKitService {
  // Availability and Setup
  isAvailable(): Promise<HealthKitAvailability>;
  requestPermissions(permissions?: HealthKitPermissions): Promise<boolean>;
  getPermissionStatus(dataType: string): Promise<HealthKitPermissionStatus>;
  getAllPermissionStatuses(): Promise<HealthKitPermissionStatus[]>;
  
  // Connection Management
  getConnectionStatus(): Promise<HealthKitConnectionStatus>;
  testConnection(): Promise<{ success: boolean; message: string }>;
  disconnect(): Promise<void>;
  
  // Permission Management
  hasRequiredPermissions(): Promise<boolean>;
  getMissingPermissions(): Promise<string[]>;
  openHealthSettings(): Promise<void>;
  
  // Workout Data
  getWorkouts(startDate: Date, endDate: Date): Promise<AppleHealthKitWorkout[]>;
  syncWorkoutsWithCalorieStore(startDate: Date, endDate: Date): Promise<{ synced: number; skipped: number; errors: number; }>;
  
  // Daily Health Metrics
  getDailyMetrics(date: Date): Promise<AppleHealthDailyMetrics>;
  getDailyMetricsRange(startDate: Date, endDate: Date): Promise<AppleHealthDailyMetrics[]>;
  getSteps(date: Date): Promise<number>;
  getActiveCalories(date: Date): Promise<number>;
  getSleepData(date: Date): Promise<AppleHealthDailyMetrics['sleepAnalysis']>;
  getHeartRateData(date: Date): Promise<AppleHealthDailyMetrics['heartRateData']>;
  
  // Body Composition and Weight
  getBodyComposition(date: Date): Promise<AppleHealthBodyComposition | null>;
  getBodyCompositionRange(startDate: Date, endDate: Date): Promise<AppleHealthBodyComposition[]>;
  getWeightEntries(startDate: Date, endDate: Date): Promise<AppleHealthBodyComposition[]>;
  syncWeightWithCalorieStore(): Promise<{ synced: number; errors: any[] }>;
}

// Error types
export enum HealthKitErrorType {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN_PERMISSION = 'UNKNOWN_PERMISSION',
  ALREADY_AUTHORIZED = 'ALREADY_AUTHORIZED',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  QUERY_FAILED = 'QUERY_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PLATFORM_UNSUPPORTED = 'PLATFORM_UNSUPPORTED',
  FETCH_FAILED = 'FETCH_FAILED',
  UNKNOWN = 'UNKNOWN',
}

export interface HealthKitError {
  type: HealthKitErrorType;
  message: string;
  originalError?: any;
  dataType?: string;
}

// Setup configuration
export interface HealthKitSetupConfig {
  autoRequestPermissions: boolean;
  permissionGroups: string[]; // IDs from HEALTHKIT_PERMISSION_GROUPS
  skipOptionalPermissions: boolean;
  showPermissionRationale: boolean;
  enableBackgroundSync: boolean;
}

export const DEFAULT_SETUP_CONFIG: HealthKitSetupConfig = {
  autoRequestPermissions: false,
  permissionGroups: ['activity', 'workouts'],
  skipOptionalPermissions: false,
  showPermissionRationale: true,
  enableBackgroundSync: true,
};

// Background Sync Types
export type HealthKitDataType = 'workout' | 'activity' | 'bodyComposition' | 'sleep' | 'heartRate' | 'comprehensive';

export interface SyncConfiguration {
  syncEnabled: boolean;
  realTimeSync: boolean;
  periodicSync: boolean;
  periodicSyncInterval: number; // milliseconds
  batteryOptimization: boolean;
  wifiOnlySync: boolean;
  maxSyncRetries: number;
  syncTimeout: number; // milliseconds
}

export interface SyncStatus {
  enabled: boolean;
  realTimeEnabled: boolean;
  periodicEnabled: boolean;
  lastSyncTime: Date;
  timeSinceLastSync: number; // milliseconds
  syncInProgress: boolean;
  activeObservers: HealthKitDataType[];
  totalSyncs: number;
  successfulSyncs: number;
  lastError?: string;
}

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncDuration: number; // milliseconds
  averageSyncDuration: number; // milliseconds
  dataTypeMetrics: {
    [key: string]: {
      syncs: number;
      successes: number;
      failures: number;
    };
  };
  lastError?: string;
  batteryOptimizationEvents: number;
}

export interface SyncResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  syncedDataTypes: string[];
  errors: string[];
}

export interface ObserverConfiguration {
  type: HealthKitDataType;
  enabled: boolean;
  throttleInterval?: number; // milliseconds
  batchUpdates?: boolean;
}

export class HealthKitSyncError extends Error {
  constructor(
    public code: 'SETUP_FAILED' | 'SYNC_FAILED' | 'OBSERVER_FAILED' | 'PERMISSION_DENIED' | 'DATA_UNAVAILABLE',
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'HealthKitSyncError';
  }
}
