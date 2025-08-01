export interface ActivityData {
  date: string; // YYYY-MM-DD format
  totalCaloriesBurned: number;
  activeCalories: number;
  basalMetabolicRate: number;
  steps: number;
  workouts: WorkoutSession[];
}

export interface WorkoutSession {
  id: string;
  startTime: Date;
  endTime: Date;
  type: WorkoutType;
  intensity: 'low' | 'moderate' | 'high' | 'very-high';
  caloriesBurned: number;
  source: 'watch' | 'manual';
}

export type WorkoutType = 
  | 'running' 
  | 'cycling' 
  | 'strength-training' 
  | 'cardio' 
  | 'walking' 
  | 'swimming' 
  | 'yoga' 
  | 'other';

export interface WatchConnectionStatus {
  isConnected: boolean;
  lastSyncTime: Date | null;
  deviceType: 'apple-watch' | 'garmin' | 'fitbit' | 'wear-os' | 'unknown';
  batteryLevel?: number;
}

export interface HealthPermissions {
  steps: boolean;
  activeEnergy: boolean;
  basalEnergy: boolean;
  workouts: boolean;
}