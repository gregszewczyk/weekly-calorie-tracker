/**
 * Goal Types for Weekly Calorie Tracker
 * Defines types for goal management with Cut/Bulk/Maintenance modes,
 * timeline tracking, weight entries, and multi-sport athletic performance
 */

import { AthleteProfile, NutritionRecommendation, SportType } from './AthleteTypes';

export type GoalMode = 'cut' | 'bulk' | 'maintenance';

// Deficit levels for performance cutting - maintaining training capacity
export type DeficitLevel = 'mild' | 'moderate' | 'aggressive';

// Performance-focused cutting strategies
export type CuttingStrategy = 
  | 'training-priority'      // Minimal deficit, prioritize training performance
  | 'balanced-approach'      // Moderate deficit with training adaptations
  | 'competition-prep'       // Aggressive cut with periodized training reduction
  | 'off-season-lean'        // Gradual fat loss during low training periods
  | 'weight-class'           // Strategic cutting for weight class sports
  | 'body-composition';      // Focus on muscle retention during cut

// Performance phase types for athletic training periodization
export type PerformancePhase = 
  | 'base'
  | 'build'
  | 'peak'
  | 'taper'
  | 'recovery'
  | 'off-season';

// Training intensity levels for any sport
export type TrainingIntensity = 
  | 'recovery'
  | 'easy'
  | 'moderate'
  | 'hard'
  | 'max';

// Training session structure
export interface TrainingSession {
  id: string;
  date: string; // YYYY-MM-DD
  sport: SportType;
  duration: number; // minutes
  intensity: TrainingIntensity;
  plannedCalories?: number;
  actualCalories?: number;
  description?: string;
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
}

// Weekly training plan structure
export interface TrainingPlan {
  id: string;
  name: string;
  phase: PerformancePhase;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  weeklyStructure: {
    [day: string]: TrainingSession | null; // monday, tuesday, etc.
  };
  totalWeeklyHours: number;
  primarySport: SportType;
  secondarySports: SportType[];
  restDays: string[]; // e.g., ['sunday', 'wednesday']
  peakWeek?: string; // YYYY-MM-DD of peak week
  taperWeeks?: number;
  recoveryWeeks?: number;
}

// Athletic configuration combining profile, nutrition, and training
export interface AthleteConfiguration {
  profile: AthleteProfile;
  nutritionRecommendation: NutritionRecommendation;
  trainingPlan: TrainingPlan;
  currentPhase: PerformancePhase;
  seasonGoals: {
    primary: string;
    secondary?: string[];
    keyEvents?: {
      name: string;
      date: string; // YYYY-MM-DD
      importance: 'low' | 'medium' | 'high' | 'critical';
      sport: SportType;
    }[];
  };
  adaptations: {
    autoAdjustCalories: boolean;
    autoAdjustMacros: boolean;
    autoAdjustTraining: boolean;
    recoveryThreshold: number; // 1-10 scale
    performanceThreshold: number; // 1-10 scale
  };
}

export interface GoalConfiguration {
  mode: GoalMode;
  performanceMode: boolean; // NEW: Can be applied to any of the 3 base modes
  startDate: string; // YYYY-MM-DD
  targetDate?: string; // For races, events - optional
  weeklyDeficitTarget: number; // Negative for cut, positive for bulk
  isOpenEnded: boolean;
  athleteConfig?: AthleteConfiguration; // Optional athletic performance configuration (required when performanceMode = true)
  
  // Target goals - what the user wants to achieve
  targetGoals: {
    weight?: {
      target: number; // kg
      current: number; // kg (starting weight)
      priority: 'primary' | 'secondary'; // How important is weight vs other goals
    };
    bodyComposition?: {
      targetBodyFat?: number; // percentage
      currentBodyFat?: number; // percentage
      targetMuscleMass?: number; // kg
      currentMuscleMass?: number; // kg
      priority: 'primary' | 'secondary';
    };
    performance?: {
      targetMetrics: PerformanceMetric[]; // Specific performance goals
      priority: 'primary' | 'secondary';
    };
    general?: {
      description: string; // e.g., "Feel more energetic", "Fit into old clothes"
      priority: 'primary' | 'secondary';
    };
  };
  
  // Performance-specific properties (when performanceMode = true)
  deficitLevel?: DeficitLevel; // Required for cut + performance mode
  cuttingStrategy?: CuttingStrategy; // Strategy for performance-focused cutting (cut + performance)
  
  // Additional cutting configuration for athletes
  cuttingConfig?: {
    prioritizeTraining: boolean; // Whether to maintain training over deficit
    maxWeeklyWeightLoss: number; // kg per week limit
    refeedDays?: number; // Days per week with higher calories
    deloadWeeks?: number[]; // Week numbers for reduced training/higher calories
    competitionDate?: string; // Target competition date (YYYY-MM-DD)
    minimumBodyFat?: number; // Lowest acceptable body fat percentage
    muscleMaintenance: {
      proteinMultiplier: number; // g per kg bodyweight
      strengthTrainingDays: number; // Minimum days per week
      recoveryPriority: number; // 1-10 scale
    };
  };
  
  // Goal timeline and expectations
  timeline?: {
    estimatedWeeksToGoal?: number; // Auto-calculated based on targets and deficit
    milestones?: {
      date: string; // YYYY-MM-DD
      description: string;
      targetWeight?: number;
      targetBodyFat?: number;
    }[];
    reviewDates?: string[]; // YYYY-MM-DD - when to reassess progress
  };
  
  // Health device integration info
  enhancedDataUsed?: {
    deviceType: 'garmin' | 'apple' | 'samsung';
    confidenceScore: number; // 0-100%
    dataQuality: number; // 0-100%
    daysCovered: number; // days of data used
    enhancedTDEE: number; // calculated TDEE from real data
    standardTDEE: number; // estimated TDEE for comparison
    usedAt: string; // ISO timestamp when data was used
  };
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
  timestamp: Date;
  bodyFat?: number; // Body fat percentage
  muscleMass?: number; // Muscle mass in kg
  notes?: string; // Optional notes about the measurement
}

export interface WeightTrend {
  current: number;
  sevenDayAverage: number;
  trend: 'up' | 'down' | 'stable';
  weeklyChange: number;
}

// Performance tracking for athletic goals
export interface PerformanceMetric {
  id: string;
  sport: SportType;
  metricName: string; // e.g., "5K Time", "Bench Press 1RM", "FTP"
  value: number;
  unit: string; // e.g., "minutes", "kg", "watts"
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface TrainingLoad {
  date: string; // YYYY-MM-DD
  sport: SportType;
  duration: number; // minutes
  intensity: TrainingIntensity;
  perceivedExertion: number; // 1-10 scale
  trainingStressScore?: number; // TSS or equivalent
  heartRateData?: {
    average: number;
    maximum: number;
    timeInZones?: number[]; // minutes in each HR zone
  };
  powerData?: {
    average: number;
    maximum: number;
    normalizedPower?: number;
  };
  recoveryMetrics?: {
    sleepHours: number;
    sleepQuality: number; // 1-10 scale
    stressLevel: number; // 1-10 scale
    motivation: number; // 1-10 scale
  };
}

// Phase transition and periodization
// Goal progress tracking
export interface GoalProgress {
  weight?: {
    current: number;
    target: number;
    remaining: number;
    percentComplete: number;
    onTrack: boolean; // Based on timeline expectations
    estimatedCompletionDate?: string; // YYYY-MM-DD
  };
  bodyComposition?: {
    currentBodyFat?: number;
    targetBodyFat?: number;
    bodyFatProgress?: number; // percentage complete
    currentMuscleMass?: number;
    targetMuscleMass?: number;
    muscleMassProgress?: number; // percentage complete
  };
  timeline?: {
    weeksElapsed: number;
    totalWeeksPlanned?: number;
    percentTimeElapsed?: number;
    onSchedule: boolean;
  };
}

// Goal achievement predictions
export interface GoalPrediction {
  weightLoss?: {
    predictedDate: string; // YYYY-MM-DD
    confidence: 'high' | 'medium' | 'low';
    currentWeeklyRate: number; // kg per week
    requiredWeeklyRate: number; // kg per week to meet goal
    recommendation: string; // Advice for user
  };
  bodyComposition?: {
    predictedBodyFat?: number;
    achievableByTargetDate: boolean;
    recommendedAdjustments?: string[];
  };
}

export interface PhaseTransition {
  fromPhase: PerformancePhase;
  toPhase: PerformancePhase;
  transitionDate: string; // YYYY-MM-DD
  reason: string;
  adjustments: {
    calorieChange?: number;
    macroChanges?: {
      protein?: number;
      carbs?: number;
      fat?: number;
    };
    trainingVolumeChange?: number; // percentage change
    intensityFocus?: TrainingIntensity[];
  };
}

// Performance cutting specific adaptations
export interface CuttingAdaptation {
  weekNumber: number;
  deficitAdjustment: number; // Calorie adjustment
  trainingModifications: {
    volumeReduction?: number; // Percentage reduction in training volume
    intensityAdjustment?: 'maintain' | 'reduce' | 'increase';
    recoveryIncrease?: number; // Additional recovery days
    supplementalWork?: string[]; // Additional recovery/mobility work
  };
  nutritionAdjustments: {
    proteinIncrease?: number; // Additional protein (g)
    carbCycling?: boolean; // Whether to cycle carbs around training
    mealTiming?: 'standard' | 'pre-post-focused' | 'spread-evenly';
    hydrationIncrease?: number; // Additional water (ml)
  };
  monitoringMetrics: string[]; // What to track more closely
  exitCriteria?: string[]; // Conditions to pause/modify the cut
}

// Performance cutting periodization
export interface PerformanceCuttingPlan {
  totalWeeks: number;
  phases: {
    week: number;
    phase: 'initial' | 'steady' | 'final' | 'maintenance';
    deficitTarget: number; // Weekly deficit
    expectedWeightLoss: number; // kg per week
    trainingFocus: TrainingIntensity[];
    nutritionStrategy: CuttingStrategy;
    adaptations: CuttingAdaptation;
  }[];
  contingencyPlans: {
    plateauBreaker: CuttingAdaptation;
    overreachingRecovery: CuttingAdaptation;
    competitionDelay: CuttingAdaptation;
  };
}
