import { GoalConfiguration, PerformancePhase, TrainingIntensity } from './GoalTypes';
import { SportType } from './AthleteTypes';

// Training type classification for daily planning
export type TrainingType = 'rest' | 'recovery' | 'easy' | 'moderate' | 'hard' | 'competition';

// Sport focus for daily training emphasis
export type SportFocus = 'endurance' | 'strength' | 'power' | 'skill' | 'mixed';

// Macro targets interface for sport-specific nutrition
export interface MacroTargets {
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
  adjustedForSport: boolean;
  sportDemand: 'low-carb' | 'moderate-carb' | 'high-carb' | 'ultra-endurance';
}

export interface DailyCalorieData {
  date: string; // YYYY-MM-DD format
  consumed: number;
  burned: number;
  target: number;
  meals: MealEntry[];
  workouts?: WorkoutSession[]; // NEW - workout sessions for the day
  waterGlasses?: number; // NEW - glasses of water consumed
  // Calorie banking support
  bankingAdjustment?: number; // Calories adjusted due to banking (+/- amount)
  adjustedTarget?: number; // target + bankingAdjustment (calculated field)
  // Daily target locking - set once per day, remains stable
  lockedDailyTarget?: number; // Target calculated at start of day, doesn't change with meals
  targetLockedAt?: string; // Timestamp when target was locked (ISO string)
  // Athletic performance tracking
  macroTargets?: MacroTargets;
  trainingType?: TrainingType;
  sportFocus?: SportFocus;
  performancePhase?: PerformancePhase;
  primarySport?: SportType;
  trainingLoad?: {
    duration: number; // minutes
    intensity: TrainingIntensity;
    perceivedExertion?: number; // 1-10 scale
    caloriesBurned?: number;
    heartRateAvg?: number;
  };
  recoveryMetrics?: {
    sleepHours?: number;
    sleepQuality?: number; // 1-10 scale
    stressLevel?: number; // 1-10 scale
    motivation?: number; // 1-10 scale
    readiness?: number; // 1-10 scale
  };
}

export interface MealEntry {
  id: string;
  name: string;
  calories: number;
  timestamp: Date;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout';
  macros?: {
    protein: number; // grams
    carbohydrates: number; // grams
    fat: number; // grams
  };
  notes?: string;
  photoUri?: string;
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD format
  timestamp: Date;
  sport: SportType;
  name: string;
  duration: number; // minutes
  startTime?: Date;
  endTime?: Date;
  intensity: TrainingIntensity;
  caloriesBurned: number;
  distance?: number; // km
  avgHeartRate?: number; // bpm
  maxHeartRate?: number; // bpm
  avgPower?: number; // watts (for cycling/running)
  maxPower?: number; // watts
  rpe?: number; // 1-10 scale
  notes?: string;
  equipment?: string;
  location?: string;
  weather?: string;
  mood?: 'terrible' | 'bad' | 'okay' | 'good' | 'excellent';
}

// NEW interface for strategic calorie banking
export interface CalorieBankingPlan {
  id: string;
  weekStartDate: string; // YYYY-MM-DD - must match the associated week
  targetDate: string; // YYYY-MM-DD - day to receive extra calories
  dailyReduction: number; // Calories to reduce per remaining day (positive number)
  totalBanked: number; // Total calories being banked (calculated field)
  remainingDaysCount: number; // Days participating in banking (calculated field)
  createdAt: Date;
  isActive: boolean;
}

export interface WeeklyCalorieGoal {
  weekStartDate: string; // YYYY-MM-DD format (Monday)
  totalTarget: number; // Total calories for the week
  dailyBaseline: number; // Base daily allowance (totalTarget / 7)
  deficitTarget: number; // Weekly deficit goal (negative for deficit)
  goalConfig: GoalConfiguration; // NEW - goal configuration reference
  weeklyAllowance: number; // NEW - total calories allowed for the week
  currentWeekAllowance: number; // NEW - fixed allowance for current week (proportional on setup, full on Monday reset)
  bankingPlan?: CalorieBankingPlan; // NEW - optional active banking plan
}

export interface WeeklyProgress {
  goal: WeeklyCalorieGoal;
  dailyData: DailyCalorieData[];
  totalConsumed: number;
  totalBurned: number;
  remainingCalories: number;
  projectedOutcome: number; // Projected weekly surplus/deficit
}

export interface CalorieRedistribution {
  remainingDays: number;
  remainingCalories: number;
  recommendedDailyTargets: number[];
  adjustmentReason: 'on-track' | 'over-budget' | 'under-budget' | 'training-day' | 'rest-day';
}

// Interface for banking plan validation and preview
export interface BankingPlanValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  impactPreview: BankingImpactPreview;
}

export interface BankingImpactPreview {
  targetDate: string;
  targetDateBoost: number; // Extra calories on target date
  dailyReductions: { date: string; reduction: number; newTarget: number }[];
  minDailyCalories: number; // Lowest daily target after banking
  totalBanked: number;
  daysAffected: number;
}

// NEW interface for banking display
export interface CalorieBankStatus {
  weeklyAllowance: number;
  totalUsed: number; // Net calories (consumed - burned)
  totalConsumed: number; // Total food intake
  totalBurned: number; // Total calories burned from activity
  remaining: number; // Total remaining including today's target
  remainingForFutureDays: number; // Remaining excluding today's locked target
  daysLeft: number; // Days remaining including today
  daysLeftExcludingToday: number; // Future days only (for rest of week planning)
  dailyAverage: number; // Average for remaining days excluding today
  todayTarget: number; // Today's locked daily target
  avgDailyConsumption: number; // totalConsumed / days elapsed
  avgDailyBurned: number; // totalBurned / days elapsed
  projectedOutcome: 'on-track' | 'over-budget' | 'under-budget';
  safeToEatToday: number;
  activeBankingPlan?: CalorieBankingPlan; // Active banking plan if exists
  isBankingAdjusted: boolean; // Whether daily averages reflect banking
}

// Daily progress interface for the daily logging screen
export interface DailyProgress {
  date: string; // YYYY-MM-DD format
  calories: {
    consumed: number;
    burned: number;
    target: number;
    remaining: number;
  };
  macros: {
    protein: { current: number; target: number; };
    carbs: { current: number; target: number; };
    fat: { current: number; target: number; };
  };
  water: {
    glasses: number;
    target: number;
  };
  meals: MealEntry[];
  workouts: WorkoutSession[];
}

// Weekly performance summary for athletic tracking
export interface WeeklyPerformanceSummary {
  weekStartDate: string; // YYYY-MM-DD (Monday)
  weekEndDate: string; // YYYY-MM-DD (Sunday)
  performancePhase: PerformancePhase;
  primarySport: SportType;
  
  // Training load metrics
  trainingLoad: {
    totalMinutes: number;
    averageIntensity: number; // 1-5 scale
    sessionsCompleted: number;
    sessionsPlanned: number;
    completionRate: number; // percentage
    totalTSS?: number; // Training Stress Score
    weeklyTSSTarget?: number;
  };
  
  // Calorie and nutrition compliance
  calorieAccuracy: {
    targetVsActual: number; // percentage difference
    dailyVariance: number[]; // daily differences from target
    weeklyDeviation: number; // total week deviation
    consistencyScore: number; // 1-10 scale
  };
  
  // Macro compliance tracking
  macroCompliance: {
    protein: {
      targetGrams: number;
      actualGrams: number;
      compliance: number; // percentage
    };
    carbohydrates: {
      targetGrams: number;
      actualGrams: number;
      compliance: number; // percentage
    };
    fat: {
      targetGrams: number;
      actualGrams: number;
      compliance: number; // percentage
    };
    overallCompliance: number; // percentage
  };
  
  // Recovery and readiness metrics
  recoveryMetrics: {
    averageSleepHours: number;
    averageSleepQuality: number; // 1-10 scale
    averageStressLevel: number; // 1-10 scale
    averageMotivation: number; // 1-10 scale
    averageReadiness: number; // 1-10 scale
    recoveryTrend: 'improving' | 'stable' | 'declining';
    restDaysCompleted: number;
    restDaysPlanned: number;
  };
  
  // Sport-specific performance indicators
  performanceIndicators: {
    sport: SportType;
    keyMetrics: {
      [metricName: string]: {
        value: number;
        unit: string;
        trend: 'improving' | 'stable' | 'declining';
        targetValue?: number;
      };
    };
    benchmarkTests?: {
      testName: string;
      result: number;
      unit: string;
      previousResult?: number;
      improvement?: number;
    }[];
    skillDevelopment?: {
      skill: string;
      rating: number; // 1-10 scale
      focus: boolean;
      notes?: string;
    }[];
  };
  
  // Weekly recommendations
  recommendations: {
    calorie: string[];
    macro: string[];
    training: string[];
    recovery: string[];
    performance: string[];
  };
  
  // Overall weekly score
  weeklyScore: {
    nutrition: number; // 1-10 scale
    training: number; // 1-10 scale
    recovery: number; // 1-10 scale
    performance: number; // 1-10 scale
    overall: number; // 1-10 scale
  };
}