/**
 * Comprehensive TypeScript types for multi-sport athletic performance tracking
 */

// Union type for different sports and activities
export type SportType = 
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'strength-training'
  | 'crossfit'
  | 'hyrox'
  | 'triathlon'
  | 'martial-arts'
  | 'team-sports'
  | 'general-fitness';

// Gender type for physiological calculations
export type Gender = 'male' | 'female' | 'other';

// Fitness level classifications
export type FitnessLevel = 
  | 'beginner'
  | 'novice'
  | 'intermediate'
  | 'advanced'
  | 'elite';

// Training experience levels
export type TrainingExperience = 
  | 'less-than-6-months'
  | '6-months-to-1-year'
  | '1-to-2-years'
  | '2-to-5-years'
  | '5-to-10-years'
  | 'more-than-10-years';

// Event types for goal setting
export type EventType = 
  | 'race'
  | 'competition'
  | 'personal-challenge'
  | 'fitness-milestone'
  | 'body-composition'
  | 'strength-goal'
  | 'endurance-goal'
  | 'skill-development';

// Performance level indicators
export type PerformanceLevel = 
  | 'recreational'
  | 'competitive-local'
  | 'competitive-regional'
  | 'competitive-national'
  | 'competitive-international'
  | 'elite-professional';

// Nutrition recommendation approaches
export type NutritionApproach = 'conservative' | 'standard' | 'aggressive';

// Macronutrient distribution
export interface MacronutrientTargets {
  protein: {
    grams: number;
    percentage: number;
    gramsPerKg: number;
  };
  carbohydrates: {
    grams: number;
    percentage: number;
    gramsPerKg: number;
  };
  fat: {
    grams: number;
    percentage: number;
    gramsPerKg: number;
  };
  fiber: number; // grams
}

// Nutrition recommendations based on training load and sport
export interface NutritionRecommendation {
  approach: NutritionApproach;
  dailyCalories: number;
  macros: MacronutrientTargets;
  hydration: {
    dailyWaterLiters: number;
    preWorkoutMl: number;
    duringWorkoutMlPerHour: number;
    postWorkoutMl: number;
  };
  timing: {
    preWorkoutWindow: string; // e.g., "30-60 minutes"
    postWorkoutWindow: string; // e.g., "within 30 minutes"
    mealFrequency: number;
  };
  supplementation?: {
    creatine?: boolean;
    protein?: boolean;
    electrolytes?: boolean;
    caffeine?: boolean;
    other?: string[];
  };
  notes: string[];
}

// Performance goals and targets
export interface PerformanceGoals {
  eventDate?: Date;
  eventType: EventType;
  targetOutcome: string; // e.g., "Complete first marathon", "Bench press 1.5x bodyweight"
  currentPerformanceLevel: PerformanceLevel;
  specificMetrics?: {
    distance?: number; // in kilometers or meters
    time?: string; // e.g., "3:30:00" for marathon time
    weight?: number; // for strength goals
    repetitions?: number;
    percentage?: number; // e.g., body fat percentage
  };
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  deadline?: Date;
}

// Training session details for scheduling
export interface TrainingSession {
  id: string;
  sport: SportType;
  duration: number; // minutes
  intensity: 'low' | 'moderate' | 'high' | 'very-high';
  sessionType: string; // e.g., 'endurance run', 'strength upper body', 'swim technique'
  plannedTime?: string; // e.g., '06:00' for 6 AM
  completed?: boolean;
  notes?: string;
}

// Weekly training schedule with multi-sport distribution
export interface TrainingSchedule {
  weekOfYear: number; // 1-52
  weekStartDate: string; // YYYY-MM-DD format
  
  // Daily training sessions
  monday?: TrainingSession[];
  tuesday?: TrainingSession[];
  wednesday?: TrainingSession[];
  thursday?: TrainingSession[];
  friday?: TrainingSession[];
  saturday?: TrainingSession[];
  sunday?: TrainingSession[];
  
  // Weekly training distribution by sport
  sportDistribution: {
    [sport in SportType]?: {
      sessions: number; // Number of sessions this week
      hours: number; // Total hours for this sport
      priority: 'primary' | 'secondary' | 'maintenance'; // Focus level
      intensityFocus: 'recovery' | 'base' | 'build' | 'peak'; // Training phase
    };
  };
  
  // Weekly training metrics
  totalSessions: number;
  totalHours: number;
  restDays: string[]; // e.g., ['sunday', 'wednesday']
  deloadWeek?: boolean; // Whether this is a planned deload week
  
  // Training load management
  plannedLoad: number; // Planned training stress/load
  actualLoad?: number; // Actual completed load
  recoveryScore?: number; // 1-10 recovery assessment
  notes?: string;
}

// Training details and schedule with multi-sport support
export interface TrainingProfile {
  weeklyTrainingHours: number; // Total across all sports
  sessionsPerWeek: number; // Total sessions across all sports
  primarySport: SportType; // Main focus sport
  secondarySports: SportType[]; // Additional sports practiced
  
  // Sport-specific training hours allocation
  sportSpecificTrainingHours?: {
    [sport in SportType]?: number; // Hours per week for each sport
  };
  
  currentFitnessLevel: FitnessLevel;
  trainingExperience: TrainingExperience;
  trainingPhaseFocus: 'base-building' | 'strength' | 'power' | 'endurance' | 'competition-prep' | 'recovery';
  preferredTrainingDays: string[]; // e.g., ['monday', 'wednesday', 'friday']
  sessionDuration: {
    average: number; // minutes
    minimum: number;
    maximum: number;
  };
  injuryHistory?: {
    currentInjuries: string[];
    pastInjuries: string[];
    limitations: string[];
  };
  
  // Training schedule for the week
  weeklySchedule?: TrainingSchedule;
}

// Personal physical stats
export interface PhysicalStats {
  age: number;
  weight: number; // in kg
  height: number; // in cm
  gender: Gender;
  bodyFatPercentage?: number;
  muscleMass?: number; // in kg
  bmr?: number; // Basal Metabolic Rate
  vo2Max?: number; // ml/kg/min
  restingHeartRate?: number; // bpm
  maxHeartRate?: number; // bpm
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  bodyMeasurements?: {
    chest?: number; // cm
    waist?: number; // cm
    hips?: number; // cm
    thighs?: number; // cm
    arms?: number; // cm
  };
}

// Comprehensive athlete profile with multi-sport support
export interface AthleteProfile {
  id: string;
  personalInfo: {
    name: string;
    email?: string;
    dateOfBirth: Date;
    profileCreated: Date;
    lastUpdated: Date;
  };
  physicalStats: PhysicalStats;
  trainingProfile: TrainingProfile;
  performanceGoals: PerformanceGoals[];
  nutritionPreferences: {
    dietaryRestrictions: string[];
    allergies: string[];
    preferences: string[]; // e.g., 'vegetarian', 'high-protein', 'low-carb'
    supplementsCurrently: string[];
    mealPrepPreference: 'none' | 'minimal' | 'moderate' | 'extensive';
  };
  activityLevel: {
    occupationActivityLevel: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active';
    dailySteps?: number;
    sleepHours: number;
    stressLevel: 'low' | 'moderate' | 'high';
  };
  trackingPreferences: {
    weighInFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    progressPhotoFrequency: 'weekly' | 'bi-weekly' | 'monthly' | 'never';
    measurementFrequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
    performanceTestFrequency: 'monthly' | 'quarterly' | 'bi-annually';
  };
  
  // Multi-sport specific additions
  sportPrioritization?: {
    [sport in SportType]?: {
      priority: 'primary' | 'secondary' | 'recreational';
      seasonality?: 'year-round' | 'seasonal' | 'off-season';
      competitionLevel: PerformanceLevel;
      weeklyHoursRange: { min: number; max: number };
    };
  };
  
  // Cross-training and sport combinations
  trainingPhilosophy?: {
    crossTrainingApproach: 'minimal' | 'balanced' | 'extensive';
    periodizationStyle: 'linear' | 'block' | 'concurrent' | 'conjugate';
    recoveryPriority: 'low' | 'moderate' | 'high';
    adaptationPreference: 'steady' | 'aggressive' | 'conservative';
  };
}

// Training load and recovery metrics
export interface TrainingLoad {
  weeklyLoad: number; // arbitrary units or TSS
  dailyLoad: number[];
  perceivedExertion: number[]; // 1-10 scale for each day
  recoveryScore: number; // 1-100
  readinessScore: number; // 1-100
  sleepQuality: number[]; // 1-10 scale for each day
  hrv?: number[]; // Heart Rate Variability
}

// Nutrition calculation helpers
export interface MetabolicCalculations {
  bmr: number;
  tdee: number; // Total Daily Energy Expenditure
  exerciseCalories: number;
  thermalEffect: number;
  adjustedCalories: number;
  macroDistribution: MacronutrientTargets;
}

// Sport-specific nutrition recommendations
export interface SportSpecificNutrition {
  sport: SportType;
  carbohydrateNeeds: 'low' | 'moderate' | 'high' | 'very-high';
  proteinNeeds: 'standard' | 'elevated' | 'high';
  fatNeeds: 'low' | 'moderate' | 'high';
  hydrationMultiplier: number; // multiplier for base hydration needs
  electrolyteNeeds: 'low' | 'moderate' | 'high';
  timingCritical: boolean;
  supplementRecommendations: string[];
}

// Progress tracking interface with multi-sport metrics
export interface ProgressMetrics {
  date: Date;
  weight?: number;
  bodyFatPercentage?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    thighs?: number;
    arms?: number;
  };
  performanceMetrics?: {
    [sport: string]: {
      [metricName: string]: number; // Flexible for sport-specific metrics
    };
  };
  photos?: {
    front?: string; // base64 or URL
    side?: string;
    back?: string;
  };
  notes?: string;
}

// Multi-sport training allocation helper
export interface SportAllocation {
  sport: SportType;
  weeklyHours: number;
  sessionsPerWeek: number;
  priority: 'primary' | 'secondary' | 'maintenance';
  seasonPhase: 'pre-season' | 'in-season' | 'post-season' | 'off-season';
  intensityDistribution: {
    low: number; // percentage
    moderate: number; // percentage
    high: number; // percentage
    veryHigh: number; // percentage
  };
}

// Training block for periodization across multiple sports
export interface MultiSportTrainingBlock {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  primaryFocus: SportType;
  secondaryFocus?: SportType[];
  
  // Sport-specific volume targets
  sportTargets: {
    [sport in SportType]?: {
      weeklyHours: number;
      weeklyVolume?: number; // sport-specific volume (km, kg, etc.)
      intensityFocus: 'recovery' | 'base' | 'build' | 'peak';
      skillFocus?: string[]; // specific skills/techniques to work on
    };
  };
  
  blockType: 'base' | 'build' | 'peak' | 'recovery' | 'competition';
  totalWeeks: number;
  deloadWeeks: number[]; // Week numbers within the block
  assessmentWeeks?: number[]; // Weeks for testing/evaluation
}
