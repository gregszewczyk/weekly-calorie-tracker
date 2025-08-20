/**
 * API Types for External Service Interactions
 * 
 * This file contains TypeScript interfaces and types for all API interactions,
 * including Perplexity AI nutrition calculations, error handling, and structured
 * request/response formats for sports nutrition analysis.
 */

import { AthleteProfile, SportType } from './AthleteTypes';
import { GoalConfiguration } from './GoalTypes';
import { WorkoutSession } from './ActivityTypes';

// ============================================================================
// Base API Types
// ============================================================================

export interface APIError {
  code: string;
  message: string;
  statusCode?: number;
  timestamp: string;
  requestId?: string;
  details?: Record<string, any>;
  retryable?: boolean;
  source: 'perplexity' | 'garmin' | 'strava' | 'internal';
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
    version: string;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ============================================================================
// Perplexity API Types
// ============================================================================

export interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
  return_citations?: boolean;
  search_domain_filter?: string[];
  search_recency_filter?: 'month' | 'year' | 'week';
  search_mode?: 'academic' | 'general'; // New field for search mode
}

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: PerplexityChoice[];
  citations?: string[];
}

export interface PerplexityChoice {
  index: number;
  finish_reason: 'stop' | 'length' | 'content_filter';
  message: {
    role: string;
    content: string;
  };
  delta?: {
    role?: string;
    content?: string;
  };
}

export interface PerplexityError {
  error: {
    type: string;
    message: string;
    code?: string;
    param?: string;
  };
}

// ============================================================================
// Nutrition Calculation Types
// ============================================================================

export interface NutritionPrompt {
  type: 'nutrition-calculation' | 'sport-guidance' | 'periodization-advice';
  athleteContext: AthleteContext;
  goalContext: GoalContext;
  preferences: NutritionPreferences;
  constraints?: NutritionConstraints;
  specializations?: SportSpecialization[];
}

export interface AthleteContext {
  personalStats: {
    age: number;
    weight: number; // kg
    height: number; // cm
    gender: 'male' | 'female' | 'other';
    bodyFatPercentage?: number;
    experienceLevel: string;
  };
  trainingProfile: {
    sport: SportType;
    weeklyHours: number;
    sessionsPerWeek: number;
    trainingPhase: string;
    fitnessLevel: string;
  };
  lifestyle: {
    occupationActivityLevel: string;
    sleepHours: number;
    stressLevel: string;
  };
  medicalConsiderations?: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
}

export interface GoalContext {
  mode: 'cut' | 'bulk' | 'maintenance';
  performanceMode: boolean;
  timeframe: string;
  weeklyTarget: number; // calories
  priority: 'performance' | 'body-composition' | 'health';
  targetDate?: string;
  specificGoals: string[];
}

export interface NutritionPreferences {
  approachLevel: 'conservative' | 'standard' | 'aggressive';
  dietaryRestrictions: string[];
  mealPreferences: string[];
  supplementTolerance: 'none' | 'basic' | 'comprehensive';
  budgetConstraints?: 'low' | 'medium' | 'high';
}

export interface NutritionConstraints {
  maxWeeklyDeficit?: number;
  minProteinIntake?: number;
  maxFatPercentage?: number;
  requiredMicronutrients?: string[];
  forbiddenIngredients?: string[];
}

export interface SportSpecialization {
  sport: SportType;
  competitionLevel: string;
  seasonPhase: 'off-season' | 'pre-season' | 'in-season' | 'post-season';
  upcomingEvents?: {
    date: string;
    type: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
  }[];
}

// ============================================================================
// Nutrition Calculation Results
// ============================================================================

export interface CalorieCalculationResult {
  recommendations: {
    conservative: NutritionRecommendation;
    standard: NutritionRecommendation;
    aggressive: NutritionRecommendation;
  };
  analysis: NutritionAnalysis;
  implementation: ImplementationGuidance;
  monitoring: MonitoringRecommendations;
  metadata: CalculationMetadata;
}

export interface NutritionRecommendation {
  approach: 'conservative' | 'standard' | 'aggressive';
  calories: CalorieBreakdown;
  macronutrients: MacronutrientBreakdown;
  timing: NutritionTiming;
  adjustments: ConditionalAdjustments;
  expectedOutcomes: ExpectedOutcomes;
}

export interface CalorieBreakdown {
  daily: {
    baseline: number;
    training: number;
    rest: number;
    average: number;
  };
  weekly: {
    total: number;
    deficit: number;
    surplus: number;
  };
  distribution: {
    preWorkout: number;
    postWorkout: number;
    meals: number[];
    snacks: number;
  };
}

export interface MacronutrientBreakdown {
  protein: {
    grams: number;
    percentage: number;
    perKgBodyweight: number;
    timing: {
      preWorkout: number;
      postWorkout: number;
      beforeBed: number;
      distributed: number;
    };
    sources: string[];
    quality: 'complete' | 'complementary' | 'mixed';
  };
  carbohydrates: {
    grams: number;
    percentage: number;
    perKgBodyweight: number;
    timing: {
      preWorkout: number;
      duringWorkout: number;
      postWorkout: number;
      remainder: number;
    };
    types: {
      simple: number;
      complex: number;
      fiber: number;
    };
    sources: string[];
  };
  fats: {
    grams: number;
    percentage: number;
    perKgBodyweight: number;
    types: {
      saturated: number;
      monounsaturated: number;
      polyunsaturated: number;
      omega3: number;
    };
    sources: string[];
    timing: 'avoid-pre-workout' | 'post-workout-ok' | 'throughout-day';
  };
  micronutrients: {
    vitamins: MicronutrientRecommendation[];
    minerals: MicronutrientRecommendation[];
    antioxidants: MicronutrientRecommendation[];
  };
}

export interface MicronutrientRecommendation {
  name: string;
  amount: number;
  unit: string;
  purpose: string;
  sources: string[];
  timing?: string;
  sportSpecific: boolean;
}

export interface NutritionTiming {
  mealFrequency: number;
  mealSpacing: number; // hours
  preWorkout: {
    timing: string; // "2-3 hours before"
    composition: string;
    examples: string[];
    calories: number;
  };
  duringWorkout: {
    required: boolean;
    frequency: string; // "every 15-20 minutes"
    composition: string;
    examples: string[];
  };
  postWorkout: {
    timing: string; // "within 30 minutes"
    composition: string;
    examples: string[];
    calories: number;
  };
  bedtime: {
    recommended: boolean;
    composition: string;
    examples: string[];
  };
}

export interface ConditionalAdjustments {
  trainingDay: {
    calorieIncrease: number;
    macroAdjustments: Record<string, number>;
    timingChanges: string[];
  };
  restDay: {
    calorieDecrease: number;
    macroAdjustments: Record<string, number>;
  };
  highIntensityDay: {
    calorieIncrease: number;
    carbIncrease: number;
    hydrationIncrease: number;
  };
  competitionDay: {
    carbLoading: boolean;
    carbLoadingProtocol?: string;
    hydrationProtocol: string;
    avoidances: string[];
  };
  recoveryDay: {
    proteinFocus: boolean;
    antiInflammatory: string[];
    sleepSupport: string[];
  };
}

export interface ExpectedOutcomes {
  weightChange: {
    weekly: number; // kg
    monthly: number; // kg
    confidence: 'low' | 'medium' | 'high';
  };
  performanceImpact: {
    strength: 'decrease' | 'maintain' | 'improve';
    endurance: 'decrease' | 'maintain' | 'improve';
    recovery: 'decrease' | 'maintain' | 'improve';
    confidence: 'low' | 'medium' | 'high';
  };
  adherenceDifficulty: 'low' | 'medium' | 'high';
  timeToGoal: string;
  warningFlags: string[];
}

// ============================================================================
// Analysis and Guidance Types
// ============================================================================

export interface NutritionAnalysis {
  rationale: string;
  scientificBasis: {
    principles: string[];
    citations: string[];
    evidenceLevel: 'low' | 'moderate' | 'high';
  };
  sportSpecificConsiderations: {
    sport: SportType;
    uniqueRequirements: string[];
    commonChallenges: string[];
    successFactors: string[];
  };
  individualization: {
    factorsConsidered: string[];
    assumptions: string[];
    limitations: string[];
  };
  riskAssessment: {
    level: 'low' | 'moderate' | 'high';
    factors: string[];
    mitigations: string[];
  };
}

export interface ImplementationGuidance {
  phaseIn: {
    week1: string[];
    week2: string[];
    week3: string[];
    week4: string[];
  };
  mealPlanning: {
    strategies: string[];
    prepTips: string[];
    budgetTips: string[];
    timeManagement: string[];
  };
  supplementation: {
    essential: SupplementRecommendation[];
    beneficial: SupplementRecommendation[];
    optional: SupplementRecommendation[];
    timing: Record<string, string>;
  };
  hydration: {
    dailyTarget: number; // ml
    preWorkout: string;
    duringWorkout: string;
    postWorkout: string;
    electrolytes: string;
  };
  troubleshooting: {
    commonIssues: string[];
    solutions: Record<string, string[]>;
    warningSigns: string[];
  };
}

export interface SupplementRecommendation {
  name: string;
  purpose: string;
  dosage: string;
  timing: string;
  priority: 'essential' | 'beneficial' | 'optional';
  evidenceLevel: 'strong' | 'moderate' | 'limited';
  cost: 'low' | 'medium' | 'high';
  interactions?: string[];
  alternatives?: string[];
}

export interface MonitoringRecommendations {
  frequency: {
    bodyWeight: 'daily' | 'weekly' | 'bi-weekly';
    bodyComposition: 'weekly' | 'bi-weekly' | 'monthly';
    performance: 'weekly' | 'bi-weekly' | 'monthly';
    subjective: 'daily' | 'weekly';
  };
  metrics: {
    objective: string[];
    subjective: string[];
    performance: string[];
  };
  adjustmentTriggers: {
    plateau: string;
    fatigue: string;
    performance: string;
    adherence: string;
  };
  reviewSchedule: {
    minor: string; // "every 2 weeks"
    major: string; // "every 6 weeks"
    complete: string; // "every 12 weeks"
  };
}

export interface CalculationMetadata {
  requestId: string;
  timestamp: string;
  processingTime: number;
  apiVersion: string;
  modelUsed: string;
  confidence: number; // 0-1
  dataQuality: {
    completeness: number; // 0-1
    accuracy: number; // 0-1
    relevance: number; // 0-1
  };
  limitations: string[];
  disclaimers: string[];
}

// ============================================================================
// Sport-Specific Types
// ============================================================================

export interface SportSpecificAdjustment {
  sport: SportType;
  adjustments: {
    calories: number; // % adjustment
    protein: number; // % adjustment
    carbohydrates: number; // % adjustment
    fats: number; // % adjustment
  };
  timing: {
    preWorkout: string;
    duringWorkout: string;
    postWorkout: string;
  };
  specialConsiderations: string[];
  commonMistakes: string[];
}

export interface PeriodizationAdjustment {
  phase: 'base-building' | 'build' | 'peak' | 'recovery' | 'off-season';
  duration: string;
  focus: string;
  adjustments: {
    calories: number; // % change from baseline
    carbohydrates: number; // % change
    training: string[];
    recovery: string[];
  };
  transitionGuidance: string;
}

// ============================================================================
// Request Builder Types
// ============================================================================

export interface NutritionRequestBuilder {
  setAthlete(profile: AthleteProfile): NutritionRequestBuilder;
  setGoal(config: GoalConfiguration): NutritionRequestBuilder;
  setPreference(level: 'conservative' | 'standard' | 'aggressive'): NutritionRequestBuilder;
  addTrainingData(sessions: WorkoutSession[]): NutritionRequestBuilder;
  addConstraints(constraints: NutritionConstraints): NutritionRequestBuilder;
  setSpecialization(sport: SportSpecialization): NutritionRequestBuilder;
  build(): NutritionPrompt;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning extends ValidationError {
  suggestion?: string;
}

// ============================================================================
// Response Parser Types
// ============================================================================

export interface ParsedNutritionResponse {
  success: boolean;
  data?: CalorieCalculationResult;
  errors?: string[];
  warnings?: string[];
  fallbackUsed: boolean;
  parsingConfidence: number; // 0-1
}

export interface ResponseParserConfig {
  strictMode: boolean;
  allowPartialParsing: boolean;
  fallbackToDefaults: boolean;
  validationLevel: 'basic' | 'standard' | 'strict';
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CachedNutritionResult {
  key: string;
  data: CalorieCalculationResult;
  timestamp: number;
  expiresAt: number;
  requestHash: string;
  hitCount: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // time to live in ms
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'lfu';
}

// ============================================================================
// Export Utility Types
// ============================================================================

export type RecommendationLevel = 'conservative' | 'standard' | 'aggressive';
export type NutritionPromptType = 'nutrition-calculation' | 'sport-guidance' | 'periodization-advice';
export type APISource = 'perplexity' | 'garmin' | 'strava' | 'internal';
export type EvidenceLevel = 'low' | 'moderate' | 'high';
export type PriorityLevel = 'essential' | 'beneficial' | 'optional';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
