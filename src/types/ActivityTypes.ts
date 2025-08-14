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
  // Enhanced multi-sport tracking
  sportSpecificMetrics?: SportSpecificMetrics;
  trainingFocus?: TrainingFocus;
  notes?: string;
  tags?: string[]; // e.g., ['competition-prep', 'technique-work', 'personal-best']
  personalBests?: {
    metric: string;
    value: number;
    unit: string;
    previousBest?: number;
  }[];
  weather?: {
    temperature?: number;
    conditions?: string;
    humidity?: number;
  };
  equipment?: string[]; // e.g., ['barbell', 'dumbbells', 'running-shoes']
  coach?: string;
  trainingPartner?: string[];
}

export type WorkoutType = 
  | 'running' 
  | 'cycling' 
  | 'strength-training'
  | 'strength-training-powerlifting'
  | 'strength-training-bodybuilding'
  | 'cardio' 
  | 'walking' 
  | 'swimming' 
  | 'yoga'
  | 'crossfit'
  | 'hyrox'
  | 'triathlon'
  | 'martial-arts'
  | 'team-sports'
  | 'rock-climbing'
  | 'skiing'
  | 'rowing'
  | 'other';

// Training focus for each workout session
export type TrainingFocus = 
  | 'technique'
  | 'endurance'
  | 'strength'
  | 'power'
  | 'recovery'
  | 'skill-development'
  | 'competition-prep';

// Sport-specific metrics interface for flexible tracking
export interface SportSpecificMetrics {
  // Distance-based metrics
  distance?: {
    value: number;
    unit: 'meters' | 'kilometers' | 'miles' | 'yards';
  };
  
  // Time-based metrics
  time?: {
    total: number; // total seconds
    splits?: number[]; // split times in seconds
    pace?: {
      value: number;
      unit: 'min/km' | 'min/mile' | 'sec/100m';
    };
  };
  
  // Strength training metrics
  strength?: {
    sets?: number;
    reps?: number[];
    weight?: number[];
    restTime?: number[]; // seconds between sets
    oneRepMax?: number;
    volume?: number; // total kg lifted
    intensity?: number; // percentage of 1RM
  };
  
  // Power and performance metrics
  power?: {
    average: number; // watts
    maximum: number; // watts
    normalizedPower?: number;
    powerZones?: number[]; // time in each power zone (minutes)
  };
  
  // Heart rate metrics
  heartRate?: {
    average: number; // bpm
    maximum: number; // bpm
    minimum?: number; // bpm
    zones?: {
      zone1: number; // minutes in zone 1
      zone2: number; // minutes in zone 2
      zone3: number; // minutes in zone 3
      zone4: number; // minutes in zone 4
      zone5: number; // minutes in zone 5
    };
  };
  
  // CrossFit/Hyrox specific metrics
  crossfitHyrox?: {
    rounds?: number;
    repsCompleted?: number;
    targetReps?: number;
    workoutName?: string; // e.g., "Fran", "Murph", "Hyrox Simulation"
    rx?: boolean; // prescribed weights/movements
    scaled?: boolean;
    movementBreakdown?: {
      movement: string;
      reps: number;
      weight?: number;
      time?: number;
    }[];
  };
  
  // Swimming specific metrics
  swimming?: {
    stroke?: 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'individual-medley';
    poolLength?: number; // meters
    laps?: number;
    strokeRate?: number; // strokes per minute
    swolf?: number; // stroke count + time
  };
  
  // Martial arts specific metrics
  martialArts?: {
    art?: 'boxing' | 'muay-thai' | 'bjj' | 'karate' | 'taekwondo' | 'mma' | 'judo' | 'other';
    rounds?: number;
    roundDuration?: number; // seconds
    techniques?: string[];
    sparring?: boolean;
    belt?: string;
  };
  
  // Team sports metrics
  teamSports?: {
    sport?: 'football' | 'basketball' | 'soccer' | 'volleyball' | 'tennis' | 'hockey' | 'rugby' | 'other';
    position?: string;
    gameTime?: number; // minutes played
    score?: {
      points?: number;
      goals?: number;
      assists?: number;
      saves?: number;
    };
    drills?: string[];
  };
  
  // Climbing specific metrics
  climbing?: {
    type?: 'indoor' | 'outdoor' | 'bouldering' | 'sport' | 'traditional' | 'multi-pitch';
    routes?: {
      grade: string; // e.g., "5.10a", "V4", "6a+"
      attempts: number;
      completed: boolean;
      style?: 'onsight' | 'flash' | 'redpoint' | 'toprope';
    }[];
    maxGrade?: string;
    verticalDistance?: number; // meters climbed
  };
  
  // Rowing specific metrics
  rowing?: {
    strokeRate?: number; // strokes per minute
    split?: number; // seconds per 500m
    technique?: string[];
    waterConditions?: 'calm' | 'choppy' | 'rough';
    boatType?: 'single' | 'double' | 'quad' | 'eight' | 'erg';
  };
  
  // Skiing specific metrics
  skiing?: {
    type?: 'alpine' | 'nordic' | 'freestyle' | 'snowboard';
    runs?: number;
    verticalDistance?: number; // meters
    maxSpeed?: number; // km/h
    conditions?: 'powder' | 'groomed' | 'icy' | 'slush';
    difficulty?: 'green' | 'blue' | 'black' | 'double-black';
  };
  
  // General fitness metrics
  general?: {
    perceivedExertion?: number; // 1-10 RPE scale
    enjoyment?: number; // 1-10 scale
    fatigue?: number; // 1-10 scale
    technique?: number; // 1-10 scale
    motivation?: number; // 1-10 scale
  };
  
  // Environmental factors
  environment?: {
    temperature?: number; // celsius
    humidity?: number; // percentage
    altitude?: number; // meters
    windSpeed?: number; // km/h
    location?: string;
    indoor?: boolean;
  };
}

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