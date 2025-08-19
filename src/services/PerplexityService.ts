import { AthleteProfile, SportType } from '../types/AthleteTypes';
import { GoalConfiguration } from '../types/GoalTypes';
import { WorkoutSession, SportSpecificMetrics } from '../types/ActivityTypes';
import { UserMetabolismProfile } from '../utils/HistoricalDataAnalyzer';
import { API_CONFIG, createAPIConfig, getAPIKey, isServiceConfigured } from '../config/apiConfig';
// Garmin AI context service removed - will be replaced with proxy-based solution
// import { GarminEnhancedContext } from './GarminAIContextService';
import { AppleHealthDailyMetrics, AppleHealthKitWorkout } from '../types/AppleHealthKitTypes';
import { 
  PerplexityRequest, 
  PerplexityResponse, 
  PerplexityError as ApiPerplexityError,
  CalorieCalculationResult,
  NutritionPrompt,
  AthleteContext,
  GoalContext,
  NutritionPreferences,
  RecommendationLevel,
  APIError
} from '../types/ApiTypes';

// API Configuration
const PERPLEXITY_API_BASE = API_CONFIG.endpoints.PERPLEXITY.BASE_URL;

// Historical data from user's actual patterns
export interface HistoricalNutritionData {
  averageDailyBurn: number; // User's actual average calorie burn
  averageDailyIntake: number; // User's actual average calorie intake
  trackingAccuracy: number; // How consistently user logs data (0-100%)
  metabolismProfile?: UserMetabolismProfile; // Full metabolism analysis
  personalizedCalories?: number; // AI-calculated personalized target
  confidenceLevel?: 'high' | 'medium' | 'low'; // Confidence in historical data
  adjustmentFromStandard?: number; // How much user differs from standard formulas
  reasoningFactors?: string[]; // Factors that influenced the calculation
}

// Request/Response Types
export interface NutritionCalculationRequest {
  athleteProfile: AthleteProfile;
  currentGoal: GoalConfiguration;
  recentTrainingData?: WorkoutSession[];
  targetDate?: Date;
  preferenceLevel: RecommendationLevel;
  periodizationPhase?: 'base-building' | 'build' | 'peak' | 'recovery' | 'off-season';
  garminData?: GarminIntegrationData;
  // garminEnhancedContext?: GarminEnhancedContext; // Removed for proxy-based solution // Enhanced Garmin context
  appleHealthContext?: AppleHealthEnhancedContext; // NEW: Apple Health context
  historicalData?: HistoricalNutritionData; // Historical patterns
  selectedTDEE?: number; // The TDEE value the user selected (Standard, Enhanced, or Athlete Profile)
  tdeeMethod?: 'standard' | 'enhanced' | 'athlete-profile' | 'estimated'; // Which TDEE calculation method was used
}

export interface GarminIntegrationData {
  averageHeartRate?: number;
  trainingStressScore?: number;
  vo2Max?: number;
  recoveryTime?: number;
  sleepScore?: number;
  bodyBattery?: number;
  recentWorkouts?: {
    date: string;
    type: string;
    duration: number;
    caloriesBurned: number;
    intensity: 'low' | 'moderate' | 'high' | 'very-high';
  }[];
}

export interface AppleHealthEnhancedContext {
  recentWorkouts: AppleHealthKitWorkout[];
  weeklyActivitySummary: {
    activeCalories: number;
    steps: number;
    workoutMinutes: number;
    standHours: number;
  };
  sleepTrends: {
    averageDuration: number;
    efficiency: number;
    deepSleepPercentage: number;
    recentTrend: 'improving' | 'declining' | 'stable';
  };
  recoveryMetrics: {
    restingHeartRate: number;
    heartRateVariability: number;
    trend: 'improving' | 'declining' | 'stable';
    overallRecoveryStatus: 'excellent' | 'good' | 'fair' | 'poor';
  };
  todaysActivity: {
    stepsSoFar: number;
    activeCalories: number;
    standHours: number;
    workoutPlanned?: AppleHealthKitWorkout;
  };
  activityRingCompletion: {
    move: number; // percentage
    exercise: number; // percentage  
    stand: number; // percentage
  };
  bodyComposition?: {
    currentWeight: number;
    recentWeightTrend: 'gaining' | 'losing' | 'stable';
    bodyFatPercentage?: number;
    leanBodyMass?: number;
  };
}

export interface OptimalNutritionResponse {
  recommendations: {
    conservative: NutritionRecommendation;
    standard: NutritionRecommendation;
    aggressive: NutritionRecommendation;
  };
  goalFeasibility: {
    isAchievable: boolean;
    analysis: string;
    keyInsights: string[];
    confidenceLevel: 'high' | 'medium' | 'low';
    warningsOrConcerns?: string[];
  };
  rationale: string;
  sportSpecificGuidance: string;
  periodizationAdjustments: string;
  supplementRecommendations?: SupplementRecommendation[];
  hydrationGuidance: HydrationGuidance;
  mealTimingRecommendations: MealTimingGuidance;
  adaptationPeriod: string;
  monitoringMetrics: string[];
}

export interface NutritionRecommendation {
  dailyCalories: number;
  weeklyCalorieTarget: number;
  macronutrients: {
    protein: { grams: number; percentage: number; perKgBodyweight: number };
    carbohydrates: { grams: number; percentage: number; perKgBodyweight: number };
    fats: { grams: number; percentage: number; perKgBodyweight: number };
  };
  trainingDayAdjustments: {
    preWorkout: { calories: number; carbs: number; protein: number };
    postWorkout: { calories: number; carbs: number; protein: number };
    totalTrainingDay: number;
  };
  restDayCalories: number;
  weeklyDeficit?: number;
  estimatedWeeklyWeightChange: number;
  timeToGoal?: string;
}

export interface SupplementRecommendation {
  name: string;
  purpose: string;
  timing: string;
  dosage: string;
  priority: 'essential' | 'beneficial' | 'optional';
  sportSpecific: boolean;
}

export interface HydrationGuidance {
  dailyBaselineFluid: number; // ml
  preWorkoutHydration: string;
  duringWorkoutFluidRate: string; // ml per hour
  postWorkoutRehydration: string;
  electrolyteRecommendations: string;
}

export interface MealTimingGuidance {
  preWorkoutMeal: {
    timing: string;
    composition: string;
    examples: string[];
  };
  postWorkoutMeal: {
    timing: string;
    composition: string;
    examples: string[];
  };
  dailyMealDistribution: {
    numberOfMeals: number;
    mealSpacing: string;
    largestMealTiming: string;
  };
}

export interface PerplexityAPIResponse extends PerplexityResponse {
  // Uses the standardized PerplexityResponse from ApiTypes
}

export interface PerplexityError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

// Main Service Class
export class PerplexityService {
  private apiKey: string;
  private baseURL: string;
  private config: ReturnType<typeof createAPIConfig>;

  constructor(apiKey?: string) {
    // Use API configuration for secure key management
    this.apiKey = apiKey || getAPIKey('perplexity');
    this.baseURL = PERPLEXITY_API_BASE; // Use base URL without version
    this.config = createAPIConfig('perplexity');
    
    if (!this.apiKey && !API_CONFIG.development.USE_MOCK_DATA) {
      console.warn('⚠️ Perplexity API key not found. Please configure API key in apiConfig.ts or provide when initializing the service.');
    }
  }

  /**
   * Calculate optimal nutrition recommendations using Perplexity Sonar API
   */
  async calculateOptimalNutrition(request: NutritionCalculationRequest): Promise<OptimalNutritionResponse> {
    try {
      // Check if service is properly configured
      if (!isServiceConfigured('perplexity')) {
        console.warn('Perplexity service not configured, using fallback calculations');
        return this.getFallbackNutritionRecommendations(request);
      }

      console.log('🤖 [PerplexityService] Building nutrition prompt...');
      const systemprompt = this.buildSystemPrompt(request);
      const prompt = this.buildNutritionPrompt(request);

      console.log('🤖 [PerplexityService] Prompt length:', prompt.length, 'chars');
      
      console.log('🤖 [PerplexityService] Making API request to Perplexity...');
      const response = await this.makeAPIRequest(prompt, systemprompt);
      console.log('🤖 [PerplexityService] API response received:', {
        hasResponse: !!response,
        hasChoices: !!(response?.choices),
        choicesLength: response?.choices?.length || 0,
        firstChoiceContent: response?.choices?.[0]?.message?.content ? 'YES' : 'NO'
      });
      
      return this.parseNutritionResponse(response, request);
    } catch (error) {
      console.error('❌ [PerplexityService] Error calculating optimal nutrition:', error);
      console.error('❌ [PerplexityService] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      console.log('🔄 [PerplexityService] Falling back to local calculations...');
      return this.getFallbackNutritionRecommendations(request);
    }
  }

  /**
   * Get sport-specific nutrition guidance
   */
  async getSportSpecificGuidance(sport: SportType, trainingPhase: string): Promise<string> {
         const systemprompt = "# SPORT-SPECIFIC NUTRITION EXPERT\n\n## EXPERTISE CONSTRAINTS\n- Evidence-based recommendations only\n- Sport-specific metabolic demands\n- Training phase periodization principles\n- Practical implementation focus\n- Performance optimization priority\n\n## CORE TASK\nProvide comprehensive sport-specific nutrition guidance tailored to training phase and sport demands.\n\n## MANDATORY OUTPUT STRUCTURE\n\n**SPORT OVERVIEW:**\nENERGY DEMANDS: [High/Moderate/Low intensity classification]\nPRIMARY SYSTEMS: [Energy systems utilized - aerobic/anaerobic/phosphocreatine]\nKEY NUTRIENTS: [Critical nutrients for this sport]\nTRAINING PHASE FOCUS: [Specific adaptations for current phase]\n\n**ENERGY & MACRO REQUIREMENTS:**\n\n### Daily Targets\n- Total Energy: X-Y kcal/kg bodyweight\n- Carbohydrates: X-Yg/kg bodyweight (X-Y% of total calories)\n- Protein: X-Yg/kg bodyweight (X-Y% of total calories)\n- Fats: X-Yg/kg bodyweight (X-Y% of total calories)\n\n### Training Phase Adjustments\n- [Specific macro adjustments for current training phase]\n- [Caloric modifications based on training volume/intensity]\n- [Periodization considerations]\n\n**TRAINING SESSION NUTRITION:**\n\n### Pre-Training (1-4 hours before)\n- Timing: X hours before\n- Carbohydrates: Xg\n- Protein: Xg\n- Fluids: X ml\n- Specific foods: [Examples]\n\n### During Training (if >90 minutes)\n- Carbohydrates: Xg/hour\n- Fluids: X ml/hour\n- Electrolytes: [Specific needs]\n- Products: [Specific recommendations]\n\n### Post-Training (within 2 hours)\n- Carbohydrates: Xg\n- Protein: Xg\n- Fluids: X ml per kg bodyweight lost\n- Timing priorities: [Recovery timeline]\n\n**RECOVERY & ADAPTATION:**\n- Sleep nutrition: [Evening/morning strategies]\n- Anti-inflammatory foods: [Specific recommendations]\n- Micronutrient focus: [Key vitamins/minerals]\n- Hydration protocols: [Daily targets and strategies]\n- Rest day nutrition: [Modifications for non-training days]\n\n**COMPETITION PREPARATION:**\n\n### 3-7 Days Before\n- [Carb loading protocols if applicable]\n- [Training taper nutrition adjustments]\n- [Digestive system preparation]\n\n### Day of Competition\n- Pre-event meal: [Timing and composition]\n- Warm-up nutrition: [If needed]\n- During event: [Sport-specific strategies]\n- Between events: [For multi-event competitions]\n\n**COMMON CHALLENGES & SOLUTIONS:**\n1. [Most frequent nutritional issue for this sport]\n   Solution: [Practical approach]\n\n2. [Second common challenge]\n   Solution: [Practical approach]\n\n3. [Third common challenge]\n   Solution: [Practical approach]\n\n**PERFORMANCE OPTIMIZATION:**\n- Ergogenic aids: [Evidence-based supplements]\n- Timing strategies: [Nutrient timing specifics]\n- Body composition: [Sport-specific considerations]\n- Seasonal periodization: [Annual nutrition planning]\n\n**PRACTICAL IMPLEMENTATION:**\n- Meal prep strategies: [Sport-specific approaches]\n- Travel nutrition: [Competition/training travel]\n- Budget considerations: [Cost-effective options]\n- Monitoring metrics: [Key indicators to track]\n\n## FORMATTING RULES\n- Use specific quantities with ranges (X-Y format)\n- Include practical food examples in each section\n- Provide timing specifics (hours, minutes)\n- Focus on actionable recommendations\n- Cite evidence level when relevant (High/Moderate/Limited evidence)\n- Address both training and competition scenarios\n- Include troubleshooting for common issues"

    try {
      if (!isServiceConfigured('perplexity')) {
        return this.getFallbackSportGuidance(sport);
      }

      const prompt = this.buildSportSpecificPrompt(sport, trainingPhase);
      const response = await this.makeAPIRequest(prompt, systemprompt);
      
      return response.choices[0]?.message.content || this.getFallbackSportGuidance(sport);
    } catch (error) {
      console.error('Error getting sport-specific guidance:', error);
      return this.getFallbackSportGuidance(sport);
    }
  }

  /**
   * Validate API key and connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      if (!isServiceConfigured('perplexity')) {
        return false;
      }
      
      const testPrompt = "What is sports nutrition in one sentence?";
      const systemPrompt = "sports nutrition expert";
      await this.makeAPIRequest(testPrompt, systemPrompt);
      return true;
    } catch (error) {
      console.error('Perplexity API connection validation failed:', error);
      return false;
    }
  }

  // Private Methods

  public buildSystemPrompt(request: NutritionCalculationRequest): string {
    const isBasicUser = !request.currentGoal.performanceMode;
    if (isBasicUser) {
      return "# NUTRITION GOAL PLANNING EXPERT\n\n## SAFETY CONSTRAINTS\n- Female minimum: 1200 kcal/day\n- Male minimum: 1500 kcal/day\n- Sport-appropriate protein targets\n- Safe deficit limits based on user profile\n\n## CORE TASK\nAnalyze goal feasibility and provide exactly 3 approaches: CONSERVATIVE, STANDARD, AGGRESSIVE.\n\n## DECISION LOGIC\n1. Can goal be achieved in specified timeframe?\n2. If YES: Create 3 approaches for actual goal\n3. If NO: Suggest realistic goal + 3 approaches for that\n4. CONSERVATIVE approach prioritized if achievable within timeline\n5. If CONSERVATIVE exceeds timeline, minimize overage (1-2 weeks max, not 10+ weeks)\n6. Open-ended goals: Make CONSERVATIVE as easy as possible\n\n## MANDATORY OUTPUT STRUCTURE\n\n**GOAL FEASIBILITY ASSESSMENT:**\nACHIEVABLE: [YES/NO]\nANALYSIS: [2-3 sentences explaining feasibility]\nKEY INSIGHTS:\n- [Profile/training insight]\n- [Approach/timeline insight] \n- [Performance/nutrition insight]\nCONFIDENCE: [HIGH/MEDIUM/LOW]\nWARNINGS: [Concerns or \"None\"]\n\n**RECOMMENDED APPROACHES:**\n\n### CONSERVATIVE APPROACH: X kcal/day (X% deficit)\n- Daily Calories: X kcal\n- Weekly Weight Change Rate: -X kg/week\n- Timeline Assessment: At X kg/week, ~X weeks needed\n- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)\n- Training days: +Xg carbs, Rest days: -Xg carbs\n- Weekly deficit: X kcal\n\n### STANDARD APPROACH: X kcal/day (X% deficit)\n- Daily Calories: X kcal\n- Weekly Weight Change Rate: -X kg/week\n- Timeline Assessment: At X kg/week, ~X weeks needed\n- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)\n- Training days: +Xg carbs, Rest days: -Xg carbs\n- Weekly deficit: X kcal\n\n### AGGRESSIVE APPROACH: X kcal/day (X% deficit)\n- Daily Calories: X kcal\n- Weekly Weight Change Rate: -X kg/week\n- Timeline Assessment: At X kg/week, ~X weeks needed\n- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)\n- Training days: +Xg carbs, Rest days: -Xg carbs\n- Weekly deficit: X kcal\n\n**MONITORING:**\nTrack: weight, performance metrics, energy levels. Adjust if weekly weight loss >X% or <X%.\n\n## FORMATTING RULES\n- Timeline MUST be exact numbers: \"8 weeks\" not \"Early October\"\n- Each approach must have DIFFERENT week calculations\n- Calculate specific weeks for each approach\n- Include both rate and timeline for each approach\n- Base all calculations on provided TDEE value";
    } else {
      return "# ATHLETE NUTRITION PLANNING EXPERT\n\n## SAFETY CONSTRAINTS\n- Female minimum: 1200 kcal/day\n- Male minimum: 1500 kcal/day\n- Sport-specific protein requirements\n- Performance-safe deficit limits\n- Maintain training capacity\n\n## CORE TASK\nAnalyze goal feasibility and provide exactly 3 approaches: CONSERVATIVE, STANDARD (recommended), AGGRESSIVE.\n\n## DECISION LOGIC\n1. Can goal be achieved in specified timeframe?\n2. If YES: Create 3 approaches for actual goal\n3. If NO: Suggest realistic goal + 3 approaches for that\n4. Prioritize performance maintenance\n5. STANDARD approach is default recommendation for athletes\n6. Timeline calculations: Conservative = longer, Aggressive = shorter\n\n## MANDATORY OUTPUT STRUCTURE\n\n**GOAL FEASIBILITY ASSESSMENT:**\nACHIEVABLE: [YES/NO]\nANALYSIS: [2-3 sentences explaining feasibility]\nKEY INSIGHTS:\n- [Profile/training insight]\n- [Performance/timeline insight]\n- [Nutrition strategy insight]\nCONFIDENCE: [HIGH/MEDIUM/LOW]\nWARNINGS: [Concerns or \"None\"]\n\n**RECOMMENDED APPROACHES:**\n\n### CONSERVATIVE APPROACH: X kcal/day (X% deficit)\n- Daily Calories: X kcal\n- Weekly Weight Change Rate: -X kg/week\n- Timeline Assessment: At X kg/week, ~X weeks needed\n- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)\n- Training days: +Xg carbs, Rest days: -Xg carbs\n- Weekly deficit: X kcal\n\n### STANDARD APPROACH: X kcal/day (X% deficit) ★ RECOMMENDED\n- Daily Calories: X kcal\n- Weekly Weight Change Rate: -X kg/week\n- Timeline Assessment: At X kg/week, ~X weeks needed\n- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)\n- Training days: +Xg carbs, Rest days: -Xg carbs\n- Weekly deficit: X kcal\n\n### AGGRESSIVE APPROACH: X kcal/day (X% deficit)\n- Daily Calories: X kcal\n- Weekly Weight Change Rate: -X kg/week\n- Timeline Assessment: At X kg/week, ~X weeks needed\n- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)\n- Training days: +Xg carbs, Rest days: -Xg carbs\n- Weekly deficit: X kcal\n\n**SPORT-SPECIFIC NUTRITION:**\nPre-workout: Xg carbs + Xg protein\nPost-workout: Xg carbs + Xg protein\nHydration: X liters/day\n\n**SUPPLEMENTS:**\nCreatine: Xg/day\nProtein powder: as needed\nOthers: [specific recommendations]\n\n**MONITORING:**\nTrack: weight, performance metrics, energy levels. Adjust if weekly weight loss >X% or <X%.\n\n## FORMATTING RULES\n- Timeline MUST be exact numbers: \"8 weeks\" not \"Early October\"\n- Each approach must have DIFFERENT week calculations\n- Conservative = longest timeline, Aggressive = shortest timeline\n- Include both rate and timeline for each approach\n- STANDARD approach is marked as recommended for athletes\n- Base all calculations on provided TDEE value\n- Sport name will be inserted dynamically in output header"
    }
  }

  private buildNutritionPrompt(request: NutritionCalculationRequest): string {
    // Determine user type and route to appropriate prompt
    const isBasicUser = !request.currentGoal.performanceMode;
    const userCategory = this.getUserCategory(request);
    const goalType = request.currentGoal.mode;
    
    console.log(`🎯 [PerplexityService] Building prompt for: ${userCategory} user with ${goalType} goal`);
    
    if (isBasicUser) {
      return this.buildBasicUserPrompt(request);
    } else {
      return this.buildAthletePrompt(request);
    }
  }


  private getUserCategory(request: NutritionCalculationRequest): 'basic' | 'athlete' {
    return request.currentGoal.performanceMode ? 'athlete' : 'basic';
  }

  // COMMENTED OUT - OLD BASIC USER PROMPT
  /*
  private buildBasicUserPrompt(request: NutritionCalculationRequest): string {
    const { athleteProfile, currentGoal, historicalData } = request;
    
    // Get basic user-friendly activity level description
    const getActivityDescription = (hours: number): string => {
      if (hours <= 2) return 'Sedentary (office work, minimal exercise)';
      if (hours <= 4) return 'Light activity (1-3 days exercise/week)';
      if (hours <= 6) return 'Moderate activity (3-5 days exercise/week)';
      if (hours <= 10) return 'Active (6-7 days exercise/week)';
      return 'Very active (daily exercise + physical job)';
    };

    // Basic user info (user-friendly for beginners)
    const userInfo = `
User Profile:
- Age: ${athleteProfile.physicalStats.age} years old
- Weight: ${athleteProfile.physicalStats.weight}kg  
- Height: ${athleteProfile.physicalStats.height}cm
- Gender: ${athleteProfile.physicalStats.gender}
- Activity Level: ${getActivityDescription(athleteProfile.trainingProfile.weeklyTrainingHours)}
- Goal: ${currentGoal.mode === 'cut' ? 'Lose weight' : currentGoal.mode === 'bulk' ? 'Gain weight' : 'Maintain current weight'}`;

    // Get selected TDEE 
    let selectedTDEE = request.selectedTDEE;
    if (!selectedTDEE) {
      // Fallback calculation
      const bmr = this.calculateBMR(athleteProfile.physicalStats);
      selectedTDEE = Math.round(this.calculateTDEE(bmr, athleteProfile.trainingProfile));
    }

    // Get target weight - for basic users it's in performance goals or use current weight
    const currentWeight = athleteProfile.physicalStats.weight;
    const targetWeight = athleteProfile.performanceGoals?.[0]?.specificMetrics?.weight || currentWeight;
    
    // Get goal from targetGoals if available
    const goalTargets = currentGoal.targetGoals;
    const actualTargetWeight = goalTargets?.weight?.target || targetWeight;

    const goalDetails = `
Target:
- Daily Calories Available: ${selectedTDEE} kcal/day
- Goal Type: ${currentGoal.mode}
- Current Weight: ${currentWeight}kg
- Target Weight: ${actualTargetWeight}kg
- Weight Change Needed: ${currentGoal.mode === 'maintenance' ? '0kg (maintain current weight)' : `${(actualTargetWeight - currentWeight).toFixed(1)}kg`}
- Timeline: ${currentGoal.targetDate || 'No specific deadline (flexible approach)'}`;


    return `You are a nutrition expert helping a beginner achieve their weight goal. Create simple, practical nutrition plans based on their TDEE of ${selectedTDEE} calories per day.

${userInfo}

${goalDetails}

**TASK:** Create 3 nutrition approaches. Calculate weekly weight ${currentGoal.mode === 'cut' ? 'loss' : currentGoal.mode === 'bulk' ? 'gain' : 'change'} rates and timelines using proper math.

**MATH REQUIREMENT - SHOW YOUR CALCULATIONS:**
Weight change needed: ${currentWeight}kg → ${actualTargetWeight}kg = ${(actualTargetWeight - currentWeight).toFixed(1)}kg total change
For each approach, choose a weekly rate, then calculate: Timeline = Total change ÷ Weekly rate

**RESPONSE FORMAT (MUST MATCH PERFORMANCE MODE FORMAT EXACTLY):**

### CONSERVATIVE APPROACH
- Daily Calories: X kcal
- Weekly Weight Change Rate: X kg/week
- Timeline Assessment: At X kg/week, ~X weeks needed
- Protein: Xg (X.Xg/kg bodyweight)
- Carbs: Xg 
- Fats: Xg

### STANDARD APPROACH
- Daily Calories: X kcal
- Weekly Weight Change Rate: X kg/week
- Timeline Assessment: At X kg/week, ~X weeks needed
- Protein: Xg (X.Xg/kg bodyweight)
- Carbs: Xg 
- Fats: Xg

### AGGRESSIVE APPROACH
- Daily Calories: X kcal
- Weekly Weight Change Rate: X kg/week
- Timeline Assessment: At X kg/week, ~X weeks needed
- Protein: Xg (X.Xg/kg bodyweight)
- Carbs: Xg 
- Fats: Xg

**SIMPLE MEAL STRUCTURE:**
- Meals per day: [NUMBER] meals
- Hydration: [LITERS] liters water daily
- Focus foods: [LIST 4 SIMPLE FOODS]

**BEGINNER SUCCESS TIPS:**
- [TIP 1 - keep simple and actionable]
- [TIP 2 - keep simple and actionable]
- [TIP 3 - keep simple and actionable]

**CRITICAL TIMELINE REQUIREMENTS:**
- Timeline MUST be expressed as exact numbers: "Timeline Assessment: At X kg/week, ~X weeks needed"
- Calculate specific weeks for each approach - they should be DIFFERENT
- Conservative should take LONGER (more weeks), Aggressive should be FASTER (fewer weeks)
- ${currentGoal.targetDate ? `IMPORTANT: User has target date ${currentGoal.targetDate} - ensure approaches consider this deadline` : 'User has flexible timeline - provide realistic options'}
- NEVER use vague terms - always specify exact weeks needed

**MATH CALCULATION PROCESS:**
STEP 1: Determine appropriate weekly rates for each approach (conservative = slower, aggressive = faster)
STEP 2: For each rate, calculate: Timeline = Total weight change ÷ Weekly rate
STEP 3: Verify the math works: Weekly rate × Timeline = Total weight change
${currentGoal.targetDate ? `STEP 4: Check if timeline fits user's target date of ${currentGoal.targetDate}` : ''}

**EXAMPLE CALCULATION:**
If user needs to change 8kg total:
- Choose weekly rate (e.g., 0.4kg/week)  
- Calculate timeline: 8kg ÷ 0.4kg/week = 20 weeks
- Verify: 0.4kg/week × 20 weeks = 8kg ✓

CRITICAL: Pick realistic weekly rates based on the goal type and user's timeline preferences. Do the division correctly!`;
  }
  */
  
  // NEW BASIC USER PROMPT - COPIED FROM ATHLETE PROMPT
  private buildBasicUserPrompt(request: NutritionCalculationRequest): string {
    const { 
      athleteProfile, 
      currentGoal, 
      recentTrainingData, 
      preferenceLevel, 
     // periodizationPhase, 
      garminData, 
      // garminEnhancedContext, // Removed for proxy solution
      appleHealthContext,
      historicalData 
    } = request;
    
    // Helper function for basic users
    const getActivityDescription = (hours: number): string => {
      if (hours <= 2) return 'Sedentary (office work, minimal exercise)';
      if (hours <= 4) return 'Light activity (1-3 days exercise/week)';
      if (hours <= 6) return 'Moderate activity (3-5 days exercise/week)';
      if (hours <= 10) return 'Active (6-7 days exercise/week)';
      return 'Very active (daily exercise + physical job)';
    };
    
    const userInfo = `
User Profile:
- Age: ${athleteProfile.physicalStats.age}
- Weight: ${athleteProfile.physicalStats.weight}kg
- Height: ${athleteProfile.physicalStats.height}cm
- Gender: ${athleteProfile.physicalStats.gender}
- Activity Level: ${getActivityDescription(athleteProfile.trainingProfile.weeklyTrainingHours)}
- Weekly Exercise: ${athleteProfile.trainingProfile.weeklyTrainingHours} hours`;


    const goalInfo = `
Current Goal:
- Mode: ${currentGoal.mode}
- Timeline: ${currentGoal.targetDate ? `Target date: ${currentGoal.targetDate}` : 'Open-ended'}`;

    const trainingInfo = recentTrainingData?.length 
      ? `Recent Training Data: ${recentTrainingData.length} workouts logged`
      : 'No recent training data available';

    // Enhanced Garmin data integration
    const garminInfo = this.buildGarminDataSection(garminData, null); // Enhanced context removed for proxy solution

    // Apple Health data integration
    const appleHealthInfo = this.buildAppleHealthDataSection(appleHealthContext);

    // Use the TDEE value the user actually selected (could be Standard, Enhanced, or Athlete Profile)
    // If no selected TDEE, calculate Standard TDEE as fallback (should always be possible)
    let selectedTDEEValue = request.selectedTDEE;
    if (!selectedTDEEValue) {
      // Try enhanced data first
      if (currentGoal.enhancedDataUsed?.enhancedTDEE) {
        selectedTDEEValue = currentGoal.enhancedDataUsed.enhancedTDEE;
      } else if (historicalData?.metabolismProfile?.estimatedTDEE) {
        selectedTDEEValue = historicalData.metabolismProfile.estimatedTDEE;
      } else {
        // Calculate Standard TDEE from athlete profile - should always be possible
        const bmr = this.calculateBMR(athleteProfile.physicalStats);
        selectedTDEEValue = Math.round(this.calculateTDEE(bmr, athleteProfile.trainingProfile));
        console.log(`🔢 [PerplexityService] Calculated Standard TDEE as fallback: ${selectedTDEEValue} kcal/day`);
      }
    }
    
    // Determine method name - be smarter about fallbacks
    let tdeeMethodName: 'standard' | 'enhanced' | 'athlete-profile' | 'estimated' = request.tdeeMethod || 'standard';
    if (!request.tdeeMethod) {
      // If we have user's selected TDEE, we might be able to infer the method
      if (request.selectedTDEE) {
        // This shouldn't happen if selectedTDEE exists without tdeeMethod
        // But if it does, we can't really know which method was used
        tdeeMethodName = 'estimated';
      } else if (currentGoal.enhancedDataUsed?.enhancedTDEE) {
        tdeeMethodName = 'enhanced';
      } else if (historicalData?.metabolismProfile?.estimatedTDEE) {
        tdeeMethodName = 'enhanced';
      } else {
        // Using calculated Standard TDEE as fallback
        tdeeMethodName = 'standard';
      }
    }
    const historicalInfo = `
SELECTED TDEE ANALYSIS (CRITICAL - BASE ALL CALCULATIONS ON THIS):
- Selected TDEE (${tdeeMethodName.toUpperCase()}): ${selectedTDEEValue} kcal/day
- This includes ALL daily movement (walking, activities, structured workouts)
- Data Source: ${tdeeMethodName === 'enhanced' ? 'Real Garmin device data with 10% conservative adjustment' : tdeeMethodName === 'athlete-profile' ? 'Athlete-specific calculations with training volume adjustments' : tdeeMethodName === 'estimated' ? 'Unable to determine calculation method' : 'Standard BMR × activity factor calculations'}
- Confidence Level: ${tdeeMethodName === 'enhanced' ? 'HIGH (based on actual device measurements)' : tdeeMethodName === 'athlete-profile' ? 'HIGH (based on detailed training profile)' : tdeeMethodName === 'estimated' ? 'UNKNOWN (method unclear)' : 'MODERATE (based on activity factor estimates)'}

GOAL DETAILS:
- Mode: ${currentGoal.mode}
- Performance Mode: NO - standard approach
- Timeline: ${currentGoal.targetDate ? `Target date: ${currentGoal.targetDate}` : 'Open-ended goal'}
- Goals: ${currentGoal.targetGoals?.performance?.targetMetrics?.map(m => `${m.metricName}: ${m.value} ${m.unit}`).join(', ') || 'Goals not specified - determine appropriate targets based on user profile'}`

    return `NUTRITION EXPERT: Analyze the complete user profile below and determine if their goal is achievable within the specified timeframe. Provide structured recommendations ONLY - no thinking process, no explanations.

${userInfo}

${goalInfo}

${trainingInfo}

${garminInfo}
${appleHealthInfo}
${historicalInfo}


Preference Level: ${preferenceLevel}

USER'S SELECTED BASELINE:
- TDEE: ${selectedTDEEValue} kcal/day (from ${tdeeMethodName.toUpperCase()} method)
- Timeline: ${currentGoal.targetDate ? 'Target date: ' + currentGoal.targetDate : 'Open-ended goal'}

USER'S TARGET OUTCOME:
- Weight Goals: ${currentGoal.targetGoals?.weight ? `Current: ${currentGoal.targetGoals.weight.current}kg → Target: ${currentGoal.targetGoals.weight.target}kg` : 'None specified'}
`;

// CRITICAL SAFETY RULES:
// - All recommendations must be above safe minimum (1200 kcal/day for females, 1500 kcal/day for males)
// - Determine appropriate protein intake based on user's sport and goals
// - Determine safe maximum deficit based on user's profile and goals


// **HARD CONSTRAINT CHECK:**
// 1.All recommendations should aim for goal achievement within the user's specified timeline
// 2.If CONSERVATIVE approach can achieve goal within timeline, prioritize it
// 3.If CONSERVATIVE approach cannot achieve goal within timeline it should be as close as possible to the goal for example extra 1-2 weeks not extra 10 weeks
// 4.If Open-ended goal, CONSERVATIVE should prioritize making hitting the goal as easy as possible

// TASK: 
// 1. Analyze if user's goal is achievable within their specified timeframe
// 2. If YES: Provide 3 approaches (conservative/standard/aggressive) for their actual goal
// 3. If NO: Suggest what IS achievable in timeframe + provide 3 approaches for that realistic goal

// USER'S SELECTED BASELINE:
// - TDEE: ${selectedTDEEValue} kcal/day (from ${tdeeMethodName.toUpperCase()} method)
// - Timeline: ${currentGoal.targetDate ? 'Target date: ' + currentGoal.targetDate : 'Open-ended goal'}

// USER'S TARGET OUTCOME:
// - Weight Goals: ${currentGoal.targetGoals?.weight ? `Current: ${currentGoal.targetGoals.weight.current}kg → Target: ${currentGoal.targetGoals.weight.target}kg` : 'None specified'}

// REQUIRED OUTPUT FORMAT:

// **GOAL FEASIBILITY ASSESSMENT:**
// ACHIEVABLE: [YES/NO]
// ANALYSIS: [2-3 sentences explaining why the goal is or isn't achievable within the timeframe]
// KEY INSIGHTS:
// - [Key insight about user's profile, training, or goals]
// - [Another key insight about their approach or timeline]
// - [Third insight about performance impact or nutrition strategy]
// CONFIDENCE: [HIGH/MEDIUM/LOW - based on data quality and goal complexity]
// WARNINGS: [Any concerns about the approach, timeline, or potential issues - if none, write "None"]

// **RECOMMENDED APPROACHES:**

// ### CONSERVATIVE APPROACH: X kcal/day (X% deficit from ${selectedTDEEValue} TDEE)
// - Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
// - Training days: +Xg carbs, Rest days: -Xg carbs
// - Weekly deficit: X kcal, Timeline: X weeks (be specific - calculate exact weeks or days)

// ### STANDARD APPROACH: X kcal/day (X% deficit from ${selectedTDEEValue} TDEE) 
// - Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
// - Training days: +Xg carbs, Rest days: -Xg carbs
// - Weekly deficit: X kcal, Timeline: X weeks (be specific - calculate exact weeks or days)

// ### AGGRESSIVE APPROACH: X kcal/day (X% deficit from ${selectedTDEEValue} TDEE)
// - Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
// - Training days: +Xg carbs, Rest days: -Xg carbs
// - Weekly deficit: X kcal, Timeline: X weeks (be specific - calculate exact weeks or days)

// **MONITORING:** 
// Track: weight, performance metrics, energy levels. Adjust if weekly weight loss >X% or <X%.

// CRITICAL FORMATTING REQUIREMENTS:
// - Timeline MUST be expressed as exact numbers: "Timeline: 8 weeks" or "Timeline: 12 weeks" 
// - ALWAYS include "X weeks needed" in timeline assessment for each approach
// - Calculate specific weeks for each approach - they should be DIFFERENT
// - For each approach, include both "At X kg/week, ~Y weeks needed" in timeline assessment  
// - NEVER use vague terms like "Early October" or "Mid-November" - always specify weeks


// REQUIRED FORMAT FOR EACH APPROACH:
// ### NAME OF THE APPROACH + APPROACH
// - Daily Calories: X kcal
// - Weekly Weight Change Rate: -X kg/week  
// - Timeline Assessment: At X kg/week, ~X weeks needed


//Base all calculations on user's selected TDEE of ${selectedTDEEValue} kcal/day. Calculate appropriate deficits for their specific goals and timeline.`;
  }

  private buildAthletePrompt(request: NutritionCalculationRequest): string {
    const { 
      athleteProfile, 
      currentGoal, 
      recentTrainingData, 
      preferenceLevel, 
      periodizationPhase, 
      garminData, 
      // garminEnhancedContext, // Removed for proxy solution
      appleHealthContext,
      historicalData 
    } = request;
    
    const athleteInfo = `
Athlete Profile:
- Age: ${athleteProfile.physicalStats.age}
- Weight: ${athleteProfile.physicalStats.weight}kg
- Height: ${athleteProfile.physicalStats.height}cm
- Gender: ${athleteProfile.physicalStats.gender}
- Body Fat: ${athleteProfile.physicalStats.bodyFatPercentage || 'Unknown'}%
- Primary Sport: ${athleteProfile.trainingProfile.primarySport}
- Training Experience: ${athleteProfile.trainingProfile.trainingExperience}
- Fitness Level: ${athleteProfile.trainingProfile.currentFitnessLevel}
- Weekly Training Hours: ${athleteProfile.trainingProfile.weeklyTrainingHours}
- Sessions Per Week: ${athleteProfile.trainingProfile.sessionsPerWeek}`;


    const goalInfo = `
Current Goal:
- Mode: ${currentGoal.mode}
- Timeline: ${currentGoal.targetDate ? `Target date: ${currentGoal.targetDate}` : 'Open-ended'}`;

    const trainingInfo = recentTrainingData?.length 
      ? `Recent Training Data: ${recentTrainingData.length} workouts logged`
      : 'No recent training data available';

    // Enhanced Garmin data integration
    const garminInfo = this.buildGarminDataSection(garminData, null); // Enhanced context removed for proxy solution

    // Apple Health data integration
    const appleHealthInfo = this.buildAppleHealthDataSection(appleHealthContext);

    // Use the TDEE value the user actually selected (could be Standard, Enhanced, or Athlete Profile)
    // If no selected TDEE, calculate Standard TDEE as fallback (should always be possible)
    let selectedTDEEValue = request.selectedTDEE;
    if (!selectedTDEEValue) {
      // Try enhanced data first
      if (currentGoal.enhancedDataUsed?.enhancedTDEE) {
        selectedTDEEValue = currentGoal.enhancedDataUsed.enhancedTDEE;
      } else if (historicalData?.metabolismProfile?.estimatedTDEE) {
        selectedTDEEValue = historicalData.metabolismProfile.estimatedTDEE;
      } else {
        // Calculate Standard TDEE from athlete profile - should always be possible
        const bmr = this.calculateBMR(athleteProfile.physicalStats);
        selectedTDEEValue = Math.round(this.calculateTDEE(bmr, athleteProfile.trainingProfile));
        console.log(`🔢 [PerplexityService] Calculated Standard TDEE as fallback: ${selectedTDEEValue} kcal/day`);
      }
    }
    
    // Determine method name - be smarter about fallbacks
    let tdeeMethodName: 'standard' | 'enhanced' | 'athlete-profile' | 'estimated' = request.tdeeMethod || 'standard';
    if (!request.tdeeMethod) {
      // If we have user's selected TDEE, we might be able to infer the method
      if (request.selectedTDEE) {
        // This shouldn't happen if selectedTDEE exists without tdeeMethod
        // But if it does, we can't really know which method was used
        tdeeMethodName = 'estimated';
      } else if (currentGoal.enhancedDataUsed?.enhancedTDEE) {
        tdeeMethodName = 'enhanced';
      } else if (historicalData?.metabolismProfile?.estimatedTDEE) {
        tdeeMethodName = 'enhanced';
      } else {
        // Using calculated Standard TDEE as fallback
        tdeeMethodName = 'standard';
      }
    }
    const historicalInfo = `
SELECTED TDEE ANALYSIS (CRITICAL - BASE ALL CALCULATIONS ON THIS):
- Selected TDEE (${tdeeMethodName.toUpperCase()}): ${selectedTDEEValue} kcal/day
- This includes ALL daily movement (walking, activities, structured workouts)
- Data Source: ${tdeeMethodName === 'enhanced' ? 'Real Garmin device data with 10% conservative adjustment' : tdeeMethodName === 'athlete-profile' ? 'Athlete-specific calculations with training volume adjustments' : tdeeMethodName === 'estimated' ? 'Unable to determine calculation method' : 'Standard BMR × activity factor calculations'}
- Confidence Level: ${tdeeMethodName === 'enhanced' ? 'HIGH (based on actual device measurements)' : tdeeMethodName === 'athlete-profile' ? 'HIGH (based on detailed training profile)' : tdeeMethodName === 'estimated' ? 'UNKNOWN (method unclear)' : 'MODERATE (based on activity factor estimates)'}

GOAL DETAILS:
- Mode: ${currentGoal.mode}
- Performance Mode: NO - standard approach
- Timeline: ${currentGoal.targetDate ? `Target date: ${currentGoal.targetDate}` : 'Open-ended goal'}
- Goals: ${currentGoal.targetGoals?.performance?.targetMetrics?.map(m => `${m.metricName}: ${m.value} ${m.unit}`).join(', ') || 'Goals not specified - determine appropriate targets based on user profile'}`

    return `NUTRITION EXPERT: Analyze the complete user profile below and determine if their goal is achievable within the specified timeframe. Provide structured recommendations ONLY - no thinking process, no explanations.

${athleteInfo}

${goalInfo}

${trainingInfo}

${garminInfo}
${appleHealthInfo}
${historicalInfo}

Periodization Phase: ${periodizationPhase || 'base-building'}
Preference Level: ${preferenceLevel}

CRITICAL SAFETY RULES:
- All recommendations must be above safe minimum (1200 kcal/day for females, 1500 kcal/day for males)
- Determine appropriate protein intake based on user's sport and goals
- Determine safe maximum deficit based on user's profile and goals

TASK: 
1. Analyze if user's goal is achievable within their specified timeframe
2. If YES: Provide 3 approaches (conservative/standard/aggressive) for their actual goal
3. If NO: Suggest what IS achievable in timeframe + provide 3 approaches for that realistic goal

USER'S SELECTED BASELINE:
- TDEE: ${selectedTDEEValue} kcal/day (from ${tdeeMethodName.toUpperCase()} method)
- Current Body Fat: ${athleteProfile.physicalStats.bodyFatPercentage || 'Unknown'}%
- Timeline: ${currentGoal.targetDate ? 'Target date: ' + currentGoal.targetDate : 'Open-ended goal'}

USER'S TARGET OUTCOME:
- Target Outcome: ${athleteProfile.performanceGoals?.[0]?.targetOutcome || currentGoal.athleteConfig?.seasonGoals?.primary || currentGoal.targetGoals?.general?.description || 'User did not specify target outcome - analyze profile to determine appropriate goals'}
- Performance Goals: ${currentGoal.targetGoals?.performance?.targetMetrics?.map(m => `${m.metricName}: ${m.value} ${m.unit}`).join(', ') || 'None specified'}
- Body Composition Goals: ${currentGoal.targetGoals?.bodyComposition ? `Current: ${currentGoal.targetGoals.bodyComposition.currentBodyFat || 'Unknown'}% → Target: ${currentGoal.targetGoals.bodyComposition.targetBodyFat || 'Not specified'}%` : 'None specified'}
- Weight Goals: ${currentGoal.targetGoals?.weight ? `Current: ${currentGoal.targetGoals.weight.current}kg → Target: ${currentGoal.targetGoals.weight.target}kg` : 'None specified'}

REQUIRED OUTPUT FORMAT:

**GOAL FEASIBILITY ASSESSMENT:**
ACHIEVABLE: [YES/NO]
ANALYSIS: [2-3 sentences explaining why the goal is or isn't achievable within the timeframe]
KEY INSIGHTS:
- [Key insight about user's profile, training, or goals]
- [Another key insight about their approach or timeline]
- [Third insight about performance impact or nutrition strategy]
CONFIDENCE: [HIGH/MEDIUM/LOW - based on data quality and goal complexity]
WARNINGS: [Any concerns about the approach, timeline, or potential issues - if none, write "None"]

**RECOMMENDED APPROACHES:**

### CONSERVATIVE APPROACH: X kcal/day (X% deficit from ${selectedTDEEValue} TDEE)
- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
- Training days: +Xg carbs, Rest days: -Xg carbs
- Weekly deficit: X kcal, Timeline: X weeks (be specific - calculate exact weeks or days)

### STANDARD APPROACH: X kcal/day (X% deficit from ${selectedTDEEValue} TDEE) ★ RECOMMENDED
- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
- Training days: +Xg carbs, Rest days: -Xg carbs
- Weekly deficit: X kcal, Timeline: X weeks (be specific - calculate exact weeks or days)

### AGGRESSIVE APPROACH: X kcal/day (X% deficit from ${selectedTDEEValue} TDEE)
- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
- Training days: +Xg carbs, Rest days: -Xg carbs
- Weekly deficit: X kcal, Timeline: X weeks (be specific - calculate exact weeks or days)

**${athleteProfile.trainingProfile.primarySport.toUpperCase()} SPECIFICS:**
Pre-workout: Xg carbs + Xg protein. Post-workout: Xg carbs + Xg protein. Hydration: X liters/day.

**SUPPLEMENTS:** 
Creatine: Xg/day, Protein powder: as needed, Others: [specific recommendations]

**MONITORING:** 
Track: weight, performance metrics, energy levels. Adjust if weekly weight loss >X% or <X%.

CRITICAL FORMATTING REQUIREMENTS:
- Timeline MUST be expressed as exact numbers: "Timeline: 8 weeks" or "Timeline: 12 weeks" 
- ALWAYS include "X weeks needed" in timeline assessment for each approach
- Calculate specific weeks for each approach - they should be DIFFERENT
- Conservative should take LONGER (more weeks), Aggressive should be FASTER (fewer weeks)
- For each approach, include both "At X kg/week, ~Y weeks needed" in timeline assessment
- NEVER use vague terms like "Early October" or "Mid-November" - always specify weeks

EXAMPLE FORMAT FOR EACH APPROACH:
### CONSERVATIVE APPROACH
- Daily Calories: 2400 kcal
- Weekly Weight Loss Rate: 0.6 kg/week  
- Timeline Assessment: At 0.6 kg/week, ~18 weeks needed

### STANDARD APPROACH  
- Daily Calories: 2200 kcal
- Weekly Weight Loss Rate: 0.8 kg/week
- Timeline Assessment: At 0.8 kg/week, ~14 weeks needed

### AGGRESSIVE APPROACH
- Daily Calories: 2000 kcal
- Weekly Weight Loss Rate: 1.0 kg/week
- Timeline Assessment: At 1.0 kg/week, ~11 weeks needed

Base all calculations on user's selected TDEE of ${selectedTDEEValue} kcal/day. Calculate appropriate deficits for their specific goals and timeline.`;
  }

  /**
   * Build Garmin data section for AI prompt
   */
  private buildGarminDataSection(garminData?: GarminIntegrationData, enhancedContext?: any): string { // Removed GarminEnhancedContext for proxy solution
    if (!enhancedContext && !garminData) {
      return 'No Garmin data available';
    }

    let garminSection = '\nGARMIN DATA INTEGRATION:\n';

    if (enhancedContext) {
      const { 
        recentActivities, 
        bodyBatteryTrend, 
        sleepQualityTrend, 
        trainingLoad, 
        vo2Max, 
        recoveryMetrics, 
        activitySummary, 
        fitnessLevel, 
        currentPhase 
      } = enhancedContext;

      garminSection += `
RECENT TRAINING ANALYSIS:
- Total Activities (28 days): ${recentActivities.length} workouts
- Average Calories per Session: ${activitySummary.avgCaloriesPerSession} kcal
- Weekly Training Volume: ${activitySummary.weeklyVolumeHours} hours
- Dominant Sports: ${activitySummary.dominantSports.join(', ') || 'None'}
- Intensity Distribution: ${activitySummary.intensityDistribution.easy}% easy, ${activitySummary.intensityDistribution.moderate}% moderate, ${activitySummary.intensityDistribution.hard}% hard, ${activitySummary.intensityDistribution.veryHard}% very hard

TRAINING LOAD ANALYSIS:
- Acute Training Load (7-day): ${trainingLoad.acute} TSS
- Chronic Training Load (28-day avg): ${trainingLoad.chronic} TSS
- Training Load Ratio: ${trainingLoad.ratio} ${this.getTrainingLoadStatus(trainingLoad.ratio)}
- Current Training Phase: ${currentPhase.toUpperCase()}
- Estimated Fitness Level: ${fitnessLevel.toUpperCase()}
${vo2Max ? `- Estimated VO2 Max: ${vo2Max} ml/kg/min` : ''}

RECOVERY STATUS:
- Body Battery Trend: ${this.formatTrend(bodyBatteryTrend)} (Status: ${recoveryMetrics.bodyBatteryStatus})
- Sleep Quality Trend: ${this.formatTrend(sleepQualityTrend)} (Status: ${recoveryMetrics.sleepQualityStatus})
- Overall Recovery: ${recoveryMetrics.overallRecoveryStatus.toUpperCase()}
- Stress Level: ${recoveryMetrics.stressLevel.toUpperCase()}`;

    } else if (garminData) {
      garminSection += `
BASIC GARMIN DATA:
- VO2 Max: ${garminData.vo2Max || 'N/A'}
- Recovery Time: ${garminData.recoveryTime || 'N/A'}h
- Sleep Score: ${garminData.sleepScore || 'N/A'}/100
- Body Battery: ${garminData.bodyBattery || 'N/A'}/100`;
    }

    return garminSection;
  }

  /**
   * Build Apple Health data section for AI prompt
   */
  private buildAppleHealthDataSection(appleHealthContext?: AppleHealthEnhancedContext): string {
    if (!appleHealthContext) {
      return 'No Apple Health data available';
    }

    const { 
      recentWorkouts, 
      weeklyActivitySummary, 
      sleepTrends, 
      recoveryMetrics, 
      todaysActivity, 
      activityRingCompletion,
      bodyComposition 
    } = appleHealthContext;

    let appleHealthSection = '\nAPPLE HEALTH DATA INTEGRATION:\n';

    appleHealthSection += `
RECENT TRAINING ANALYSIS (APPLE WATCH):
- Total Workouts (14 days): ${recentWorkouts.length} sessions
- Average Calories per Session: ${recentWorkouts.length > 0 ? Math.round(recentWorkouts.reduce((sum, w) => sum + (w.totalEnergyBurned || 0), 0) / recentWorkouts.length) : 0} kcal
- Weekly Activity Summary: ${weeklyActivitySummary.activeCalories} kcal, ${weeklyActivitySummary.steps} steps, ${weeklyActivitySummary.workoutMinutes} min
- Activity Ring Completion: Move ${activityRingCompletion.move}%, Exercise ${activityRingCompletion.exercise}%, Stand ${activityRingCompletion.stand}%

TODAY'S ACTIVITY (REAL-TIME):
- Steps So Far: ${todaysActivity.stepsSoFar} steps
- Active Calories: ${todaysActivity.activeCalories} kcal
- Stand Hours: ${todaysActivity.standHours}/12 hours
${todaysActivity.workoutPlanned ? `- Planned Workout: ${todaysActivity.workoutPlanned.activityName} (${todaysActivity.workoutPlanned.duration} min)` : '- No workout scheduled'}

SLEEP & RECOVERY STATUS:
- Average Sleep Duration: ${sleepTrends.averageDuration.toFixed(1)}h
- Sleep Efficiency: ${sleepTrends.efficiency}%
- Deep Sleep Percentage: ${sleepTrends.deepSleepPercentage}%
- Sleep Trend: ${sleepTrends.recentTrend.toUpperCase()}

RECOVERY METRICS:
- Resting Heart Rate: ${recoveryMetrics.restingHeartRate} bpm (${recoveryMetrics.trend})
- Heart Rate Variability: ${recoveryMetrics.heartRateVariability} ms (${recoveryMetrics.trend})
- Overall Recovery Status: ${recoveryMetrics.overallRecoveryStatus.toUpperCase()}`;

    if (bodyComposition) {
      appleHealthSection += `

BODY COMPOSITION (APPLE HEALTH):
- Current Weight: ${bodyComposition.currentWeight} kg (${bodyComposition.recentWeightTrend})
${bodyComposition.bodyFatPercentage ? `- Body Fat Percentage: ${bodyComposition.bodyFatPercentage}%` : ''}
${bodyComposition.leanBodyMass ? `- Lean Body Mass: ${bodyComposition.leanBodyMass} kg` : ''}`;
    }

    return appleHealthSection;
  }

  /**
   * Build specific Garmin-based adjustment guidance
   */
  private buildGarminAdjustmentGuidance(context: any): string { // Removed GarminEnhancedContext for proxy solution
    const adjustments: string[] = [];
    const { trainingLoad, recoveryMetrics, bodyBatteryTrend, sleepQualityTrend } = context;

    // Training load adjustments
    if (trainingLoad.ratio > 1.3) {
      adjustments.push('HIGH TRAINING LOAD DETECTED: Increase daily calories by 200-400 kcal to support recovery and adaptation');
    } else if (trainingLoad.ratio < 0.8) {
      adjustments.push('DELOAD/RECOVERY PHASE: Consider reducing calories to maintenance or slight deficit');
    }

    // Recovery-based adjustments
    if (recoveryMetrics.bodyBatteryStatus === 'poor' || recoveryMetrics.overallRecoveryStatus === 'poor') {
      adjustments.push('POOR RECOVERY STATUS: Reduce calorie deficit by 10-15%, increase carbohydrate intake by 1-2g/kg bodyweight');
    }

    if (recoveryMetrics.sleepQualityStatus === 'poor') {
      adjustments.push('POOR SLEEP QUALITY: Prioritize recovery nutrition - increase protein to 2.2-2.5g/kg, focus on anti-inflammatory foods');
    }

    if (recoveryMetrics.stressLevel === 'high' || recoveryMetrics.stressLevel === 'very_high') {
      adjustments.push('HIGH STRESS LEVELS: Increase calories by 5-10%, reduce refined carbohydrates, emphasize nutrient-dense foods');
    }

    // Body battery trend
    const avgBodyBattery = bodyBatteryTrend.reduce((a: number, b: number) => a + b, 0) / bodyBatteryTrend.length || 50;
    if (avgBodyBattery < 30) {
      adjustments.push('CRITICALLY LOW BODY BATTERY: Significantly reduce calorie deficit, increase carbs and overall calories for recovery');
    }

    // Sleep trend
    const avgSleep = sleepQualityTrend.reduce((a: number, b: number) => a + b, 0) / sleepQualityTrend.length || 75;
    if (avgSleep < 60) {
      adjustments.push('POOR SLEEP TREND: Focus on sleep-supporting nutrition - magnesium, tart cherry, avoid late caffeine');
    }

    if (adjustments.length === 0) {
      adjustments.push('OPTIMAL RECOVERY STATUS: Current nutrition approach appears suitable, maintain consistency');
    }

    return `
CRITICAL GARMIN-BASED ADJUSTMENTS:
${adjustments.map(adj => `- ${adj}`).join('\n')}

IMPORTANT: These adjustments should take priority over standard formulas as they reflect the athlete's current physiological state and training stress.`;
  }

  /**
   * Build specific Apple Health-based adjustment guidance
   */
  private buildAppleHealthAdjustmentGuidance(context: AppleHealthEnhancedContext): string {
    const adjustments: string[] = [];
    const { sleepTrends, recoveryMetrics, todaysActivity, activityRingCompletion, bodyComposition } = context;

    // Sleep-based adjustments
    if (sleepTrends.averageDuration < 7) {
      adjustments.push('POOR SLEEP DURATION: Increase calories by 100-200 kcal, focus on sleep-supporting nutrients (magnesium, tart cherry)');
    }
    
    if (sleepTrends.efficiency < 85) {
      adjustments.push('LOW SLEEP EFFICIENCY: Avoid late caffeine, increase tryptophan-rich foods, consider evening carb timing');
    }

    if (sleepTrends.recentTrend === 'declining') {
      adjustments.push('DECLINING SLEEP TREND: Reduce training stress, increase recovery nutrition, prioritize sleep hygiene');
    }

    // Recovery metrics adjustments
    if (recoveryMetrics.restingHeartRate > 60 && recoveryMetrics.trend === 'declining') {
      adjustments.push('ELEVATED RESTING HR: Reduce calorie deficit, increase anti-inflammatory foods, consider overreaching');
    }

    if (recoveryMetrics.heartRateVariability < 30 || recoveryMetrics.trend === 'declining') {
      adjustments.push('LOW HRV TREND: Increase protein to 2.2-2.5g/kg, focus on omega-3s, reduce refined carbohydrates');
    }

    if (recoveryMetrics.overallRecoveryStatus === 'poor') {
      adjustments.push('POOR RECOVERY STATUS: Reduce calorie deficit by 15-20%, increase carbohydrate intake post-workout');
    }

    // Activity ring completion adjustments
    if (activityRingCompletion.move < 80) {
      adjustments.push('LOW MOVE RING COMPLETION: Consider increasing daily calories and encouraging more NEAT activity');
    }

    if (activityRingCompletion.exercise < 50) {
      adjustments.push('INSUFFICIENT EXERCISE RING: May need to increase workout frequency or duration for optimal metabolic health');
    }

    // Today's activity real-time adjustments
    if (todaysActivity.stepsSoFar < 5000) {
      adjustments.push('LOW DAILY STEPS: Consider reducing rest day calories slightly, encourage more movement');
    }

    if (todaysActivity.activeCalories > 600 && !todaysActivity.workoutPlanned) {
      adjustments.push('HIGH UNPLANNED ACTIVITY: Add 200-300 kcal to today\'s intake to support recovery');
    }

    // Body composition trends
    if (bodyComposition?.recentWeightTrend === 'gaining' && recoveryMetrics.overallRecoveryStatus !== 'excellent') {
      adjustments.push('WEIGHT GAINING + POOR RECOVERY: May indicate inadequate deficit or overtraining - reassess calorie targets');
    }

    if (bodyComposition?.recentWeightTrend === 'losing' && activityRingCompletion.move < 60) {
      adjustments.push('RAPID WEIGHT LOSS + LOW ACTIVITY: Risk of metabolic slowdown - increase calories and activity');
    }

    if (adjustments.length === 0) {
      adjustments.push('OPTIMAL APPLE HEALTH METRICS: Current nutrition approach appears well-suited to your activity patterns and recovery status');
    }

    return `
CRITICAL APPLE HEALTH-BASED ADJUSTMENTS:
${adjustments.map(adj => `- ${adj}`).join('\n')}

APPLE WATCH INTEGRATION BENEFITS:
- Real-time activity tracking allows for dynamic calorie adjustments
- Heart rate variability monitoring helps optimize recovery nutrition
- Sleep stage analysis enables circadian rhythm-based meal timing
- Activity ring completion provides motivation and metabolic insight

IMPORTANT: These Apple Health insights provide real-time physiological feedback that should inform daily nutrition decisions.`;
  }

  /**
   * Get training load status description
   */
  private getTrainingLoadStatus(ratio: number): string {
    if (ratio > 1.5) return '(VERY HIGH - Risk of overreaching)';
    if (ratio > 1.3) return '(HIGH - Peak/Build phase)';
    if (ratio > 0.8) return '(OPTIMAL - Good adaptation stimulus)';
    return '(LOW - Recovery/Base phase)';
  }

  /**
   * Format trend data for display
   */
  private formatTrend(trend: number[]): string {
    if (trend.length === 0) return 'No data';
    if (trend.length === 1) return `${trend[0]}`;
    
    const recent = trend.slice(-3);
    const avg = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
    const direction = recent.length > 1 ? 
      (recent[recent.length - 1] > recent[0] ? '↑' : recent[recent.length - 1] < recent[0] ? '↓' : '→') : '';
    
    return `${avg} ${direction}`;
  }

  /**
   * Build sport-specific prompt
   */
  private buildSportSpecificPrompt(sport: SportType, trainingPhase: string): string {
    return `SPORT: ${sport.toUpperCase()}
TRAINING PHASE: ${trainingPhase.toUpperCase()}

ADDITIONAL CONTEXT:
- Focus on evidence-based recommendations
- Prioritize practical implementation
- Address sport-specific metabolic demands
- Consider training phase periodization needs
- Include both training and competition scenarios
`;
  }

  private async makeAPIRequest(prompt: string, systemprompt: string): Promise<PerplexityAPIResponse> {
    // Use configuration from apiConfig
    const requestConfig = API_CONFIG.perplexity.REQUEST_DEFAULTS;
    
    // const requestBody: PerplexityRequest = {
    //   model: API_CONFIG.perplexity.MODELS.SONAR_REASONING,
    //   messages: [
    //     {
    //       role: 'system',
    //       content: 'You are a nutrition expert. You MUST respond with ONLY the requested structured format. Never show thinking, analysis, or explanations. Just provide the exact format requested with calculated values.'
    //     },
    //     {
    //       role: 'user',
    //       content: prompt
    //     }
    //   ],
    //   max_tokens: requestConfig.max_tokens,
    //   temperature: requestConfig.temperature,
    //   top_p: requestConfig.top_p,
    //   search_domain_filter: [...requestConfig.search_domain_filter],
    //   return_citations: requestConfig.return_citations,
    //   search_recency_filter: requestConfig.search_recency_filter,
    //   top_k: requestConfig.top_k,
    //   stream: requestConfig.stream,
    //   presence_penalty: requestConfig.presence_penalty,
    //   frequency_penalty: requestConfig.frequency_penalty
    // };

        const requestBody: PerplexityRequest = {
      model: API_CONFIG.perplexity.MODELS.SONAR_REASONING,
      messages: [
        {
  "role": "system",
  "content": systemprompt 
},
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: requestConfig.max_tokens,
      temperature: requestConfig.temperature,
      top_p: requestConfig.top_p,
      search_domain_filter: [...requestConfig.search_domain_filter],
      return_citations: requestConfig.return_citations,
      search_recency_filter: requestConfig.search_recency_filter,
      top_k: requestConfig.top_k,
      stream: requestConfig.stream,
      presence_penalty: requestConfig.presence_penalty,
      frequency_penalty: requestConfig.frequency_penalty
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.perplexity.TIMEOUTS.total_timeout);

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'WeeklyCalorieTracker/1.0'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal as any
      });

      clearTimeout(timeoutId);

      console.log('🌐 [PerplexityService] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ [PerplexityService] API Error Response:', responseText);
        
        try {
          const errorData = JSON.parse(responseText) as PerplexityError;
          throw new Error(`Perplexity API Error: ${errorData.error.message}`);
        } catch (parseError) {
          throw new Error(`Perplexity API Error: ${response.status} ${response.statusText} - ${responseText}`);
        }
      }

      const responseText = await response.text();
      console.log('📥 [PerplexityService] Raw response length:', responseText.length);
      console.log('📥 [PerplexityService] Response preview:', responseText.substring(0, 200) + '...');
      
      try {
        return JSON.parse(responseText) as PerplexityAPIResponse;
      } catch (parseError) {
        console.error('❌ [PerplexityService] JSON Parse Error:', parseError);
        console.error('❌ [PerplexityService] Raw response that failed to parse:', responseText);
        throw parseError;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseNutritionResponse(response: PerplexityAPIResponse, request: NutritionCalculationRequest): OptimalNutritionResponse {
    const content = response.choices[0]?.message.content || '';
    
    try {
      // Debug logging
      console.log('Perplexity API Response:', JSON.stringify(response, null, 2));
      console.log('Response content:', content);
      
      // Parse the AI response and extract structured nutrition data
      // This is a simplified parser - in production, you'd want more robust parsing
      const recommendations = this.extractRecommendations(content, request);
      
      return {
        recommendations,
        goalFeasibility: this.extractGoalFeasibility(content),
        rationale: this.extractSection(content, 'rationale') || 'AI-generated recommendations based on athlete profile and goals.',
        sportSpecificGuidance: this.extractSection(content, 'sport-specific') || this.getFallbackSportGuidance(request.athleteProfile.trainingProfile.primarySport),
        periodizationAdjustments: this.extractSection(content, 'periodization') || 'Adjust calories and carbohydrates based on training phase intensity.',
        supplementRecommendations: this.extractSupplements(content),
        hydrationGuidance: this.extractHydrationGuidance(content, request),
        mealTimingRecommendations: this.extractMealTiming(content),
        adaptationPeriod: '2-4 weeks for metabolic adaptation',
        monitoringMetrics: ['Body weight', 'Performance metrics', 'Energy levels', 'Recovery quality', 'Sleep quality']
      };
    } catch (error) {
      console.error('Error parsing nutrition response:', error);
      console.error('Response content was:', content);
      return this.getFallbackNutritionRecommendations(request);
    }
  }

  private extractRecommendations(content: string, request: NutritionCalculationRequest): OptimalNutritionResponse['recommendations'] {
    const { athleteProfile, currentGoal } = request;
    const weight = athleteProfile.physicalStats.weight;
    const targetWeight = currentGoal?.targetGoals?.weight?.target || athleteProfile.physicalStats.weight;
    
    console.log('🔍 [PerplexityService] Parsing AI response for recommendations...');
    console.log('🔍 [PerplexityService] AI content length:', content.length);
    
    try {
      // Try to extract structured recommendations from AI response
      const aiRecommendations = this.parseAIRecommendations(content, request);
      if (aiRecommendations) {
        console.log('✅ [PerplexityService] Successfully parsed AI recommendations');
        return aiRecommendations;
      }
    } catch (error) {
      console.warn('⚠️ [PerplexityService] Failed to parse AI recommendations, using fallback:', error);
    }
    
    console.log('🔄 [PerplexityService] Using fallback calculations...');
    
    // For basic users, use their selected TDEE; for athletes, calculate from profile
    let baseCalories: number;
    if (request.selectedTDEE && !currentGoal.performanceMode) {
      // Basic users: use their selected TDEE from the comparison screen
      baseCalories = request.selectedTDEE;
      console.log('🔢 [PerplexityService] Using selected TDEE for basic user:', baseCalories);
    } else {
      // Athletes or fallback: calculate from profile
      const bmr = this.calculateBMR(athleteProfile.physicalStats);
      const tdee = this.calculateTDEE(bmr, athleteProfile.trainingProfile);
      baseCalories = Math.round(tdee);
      console.log('🔢 [PerplexityService] Calculated TDEE for athlete:', baseCalories);
    }
    
    // Fallback deficits based on goal mode and athlete profile
    let baseWeeklyDeficit = 0;
    const goalMode = currentGoal.mode;
    
    if (goalMode === 'cut') {
      // Base deficit: 1-2 lbs per week (3500-7000 cal/week)
      baseWeeklyDeficit = currentGoal.performanceMode ? -1750 : -2500; // Performance mode is more conservative
    } else if (goalMode === 'bulk') {
      baseWeeklyDeficit = 1500; // 0.5 lb per week lean gain
    } else if (goalMode === 'maintenance') {
      baseWeeklyDeficit = 0; // Maintenance
    }
    
    return {
      conservative: this.generateRecommendation(baseCalories, weight, baseWeeklyDeficit * 0.7, 'conservative', targetWeight),
      standard: this.generateRecommendation(baseCalories, weight, baseWeeklyDeficit * 1.0, 'standard', targetWeight),
      aggressive: this.generateRecommendation(baseCalories, weight, baseWeeklyDeficit * 1.3, 'aggressive', targetWeight)
    };
  }

  private generateRecommendationWithAIMacros(
    aiCalories: number, 
    weight: number, 
    weeklyDeficit: number, 
    level: string,
    aiProteinGrams: number | null,
    aiCarbGrams: number | null, 
    aiFatGrams: number | null,
    estimatedTimeline?: string, 
    targetDate?: string,
    aiWeeklyWeightChange?: number
  ): NutritionRecommendation {
    // Use AI's calorie and macro recommendations directly!
    const dailyCalories = aiCalories;
    
    let proteinGrams: number;
    let carbGrams: number;
    let fatGrams: number;
    
    // Use AI macros if available, otherwise calculate fallback
    if (aiProteinGrams && aiCarbGrams && aiFatGrams) {
      console.log('✅ [PerplexityService] Using AI macro recommendations:', {
        protein: aiProteinGrams,
        carbs: aiCarbGrams,
        fats: aiFatGrams
      });
      proteinGrams = aiProteinGrams;
      carbGrams = aiCarbGrams;
      fatGrams = aiFatGrams;
    } else {
      console.log('⚠️ [PerplexityService] Some AI macros missing, using hybrid approach');
      // Hybrid: Use AI macros where available, calculate missing ones
      
      // Protein: Use AI value or fallback calculation
      proteinGrams = aiProteinGrams || (() => {
        const proteinMultiplier = level === 'conservative' ? 1.6 : level === 'standard' ? 1.8 : 2.2;
        return Math.round(weight * proteinMultiplier);
      })();
      
      // Fat: Use AI value or fallback calculation
      fatGrams = aiFatGrams || (() => {
        const fatPercentage = level === 'conservative' ? 30 : level === 'standard' ? 25 : 20;
        const fatCalories = Math.round(dailyCalories * (fatPercentage / 100));
        return Math.round(fatCalories / 9);
      })();
      
      // Carbs: Use AI value or calculate remainder
      carbGrams = aiCarbGrams || (() => {
        const proteinCalories = proteinGrams * 4;
        const fatCalories = fatGrams * 9;
        const carbCalories = dailyCalories - proteinCalories - fatCalories;
        return Math.round(carbCalories / 4);
      })();
    }
    
    // Calculate calories from final macro values
    const proteinCalories = proteinGrams * 4;
    const carbCalories = carbGrams * 4; 
    const fatCalories = fatGrams * 9;
    
    return {
      dailyCalories,
      weeklyCalorieTarget: dailyCalories * 7,
      weeklyDeficit: weeklyDeficit,
      macronutrients: {
        protein: { 
          grams: proteinGrams, 
          percentage: Math.round((proteinCalories / dailyCalories) * 100),
          perKgBodyweight: Math.round((proteinGrams / weight) * 100) / 100
        },
        carbohydrates: { 
          grams: carbGrams, 
          percentage: Math.round((carbCalories / dailyCalories) * 100),
          perKgBodyweight: Math.round((carbGrams / weight) * 100) / 100
        },
        fats: { 
          grams: fatGrams, 
          percentage: Math.round((fatCalories / dailyCalories) * 100),
          perKgBodyweight: Math.round((fatGrams / weight) * 100) / 100
        }
      },
      trainingDayAdjustments: {
        preWorkout: { calories: 150, carbs: 30, protein: 10 },
        postWorkout: { calories: 200, carbs: 40, protein: 20 },
        totalTrainingDay: dailyCalories + 100
      },
      restDayCalories: Math.round(dailyCalories * 0.95),
      estimatedWeeklyWeightChange: aiWeeklyWeightChange !== undefined ? aiWeeklyWeightChange : -weeklyDeficit / 7700, // Use AI's rate if available, otherwise calculate
      timeToGoal: estimatedTimeline ? this.calculateEstimatedCompletionDate(estimatedTimeline, targetDate) : undefined
    };
  }

  private extractWeeklyWeightChangeRate(content: string, level: string, goalMode: string): number | undefined {
    const weeklyRatePatterns = [
      // Match "~1 Kg/Week Weight Loss" format (exact AI format)
      new RegExp(`${level}\\s+approach[\\s\\S]*?\\~?([+-]?[\\d.]+)\\s*kg\\/week\\s+weight\\s+(?:loss|gain)`, 'i'),
      // Match "Weekly Weight Change Rate: 0.5 kg/week" format (basic users)
      new RegExp(`${level}\\s+approach[\\s\\S]*?Weekly\\s+Weight\\s+Change\\s+Rate:\\s*([+-]?[\\d.]+)\\s*kg\\/week`, 'i'),
      // Match "Weekly Weight Loss Rate: 0.5 kg/week" format (athletes)  
      new RegExp(`${level}\\s+approach[\\s\\S]*?Weekly\\s+Weight\\s+(?:Loss|Gain)\\s+Rate:\\s*([+-]?[\\d.]+)\\s*kg\\/week`, 'i'),
      // Match "(~0.44 kg/week)" format from deficit lines
      new RegExp(`${level}\\s+approach[\\s\\S]*?\\(\\~?([+-]?[\\d.]+)\\s*kg\\/week\\)`, 'i'),
      // Match "at~1 kg/week" format from timeline assessment (flexible spacing)
      new RegExp(`${level}\\s+approach[\\s\\S]*?at\\s*~?([+-]?[\\d.]+)\\s*kg\\/week`, 'i'),
      // Match "At X kg/week" format from timeline assessment (original)
      new RegExp(`${level}\\s+approach[\\s\\S]*?At\\s+([+-]?[\\d.]+)\\s*kg\\/week`, 'i'),
    ];

    for (const pattern of weeklyRatePatterns) {
      const match = content.match(pattern);
      if (match) {
        let rate = parseFloat(match[1]);
        
        // Apply correct sign based on goal mode
        if (goalMode === 'cut') {
          // For weight loss, rate should be negative (losing weight)
          rate = Math.abs(rate) * -1;
        } else if (goalMode === 'bulk') {
          // For weight gain, rate should be positive (gaining weight)  
          rate = Math.abs(rate);
        } else {
          // For maintenance, rate should be close to 0 but preserve AI's sign
          // Keep the rate as-is since maintenance might have small variations
        }
        
        console.log(`📊 [PerplexityService] Found AI weekly weight change rate for ${level} (${goalMode}):`, rate, 'kg/week');
        return rate;
      }
    }

    console.log(`⚠️ [PerplexityService] Could not extract weekly weight change rate for ${level}`);
    return undefined;
  }

  private generateRecommendationFromAI(aiCalories: number, weight: number, weeklyDeficit: number, level: string, estimatedTimeline?: string, targetDate?: string): NutritionRecommendation {
    // Use AI's calorie recommendation directly - don't recalculate!
    const dailyCalories = aiCalories;
    
    // Protein: 1.6-2.2g/kg for athletes
    const proteinMultiplier = level === 'conservative' ? 1.6 : level === 'standard' ? 1.8 : 2.2;
    const proteinGrams = Math.round(weight * proteinMultiplier);
    const proteinCalories = proteinGrams * 4;
    
    // Fat: 20-35% of calories
    const fatPercentage = level === 'conservative' ? 30 : level === 'standard' ? 25 : 20;
    const fatCalories = Math.round(dailyCalories * (fatPercentage / 100));
    const fatGrams = Math.round(fatCalories / 9);
    
    // Carbs: remainder
    const carbCalories = dailyCalories - proteinCalories - fatCalories;
    const carbGrams = Math.round(carbCalories / 4);
    
    return {
      dailyCalories,
      weeklyCalorieTarget: dailyCalories * 7,
      weeklyDeficit: weeklyDeficit,
      macronutrients: {
        protein: { 
          grams: proteinGrams, 
          percentage: Math.round((proteinCalories / dailyCalories) * 100),
          perKgBodyweight: Math.round((proteinGrams / weight) * 100) / 100
        },
        carbohydrates: { 
          grams: carbGrams, 
          percentage: Math.round((carbCalories / dailyCalories) * 100),
          perKgBodyweight: Math.round((carbGrams / weight) * 100) / 100
        },
        fats: { 
          grams: fatGrams, 
          percentage: Math.round((fatCalories / dailyCalories) * 100),
          perKgBodyweight: Math.round((fatGrams / weight) * 100) / 100
        }
      },
      trainingDayAdjustments: {
        preWorkout: { calories: 150, carbs: 30, protein: 10 },
        postWorkout: { calories: 200, carbs: 40, protein: 15 },
        totalTrainingDay: dailyCalories + 100
      },
      restDayCalories: dailyCalories - 50,
      estimatedWeeklyWeightChange: -weeklyDeficit / 7700, // 7700 cal = 1kg fat (negative for weight loss)
      timeToGoal: estimatedTimeline ? this.calculateEstimatedCompletionDate(estimatedTimeline, targetDate) : undefined
    };
  }

  private generateRecommendation(baseCalories: number, weight: number, weeklyDeficit: number, level: string, targetWeight?: number): NutritionRecommendation {
    const dailyDeficit = weeklyDeficit / 7;
    const dailyCalories = Math.round(baseCalories + dailyDeficit); // For deficit (negative), this subtracts calories
    
    // Protein: 1.6-2.2g/kg for athletes
    const proteinMultiplier = level === 'conservative' ? 1.6 : level === 'standard' ? 1.8 : 2.2;
    const proteinGrams = Math.round(weight * proteinMultiplier);
    const proteinCalories = proteinGrams * 4;
    
    // Fat: 20-35% of calories
    const fatPercentage = level === 'conservative' ? 30 : level === 'standard' ? 25 : 20;
    const fatCalories = Math.round(dailyCalories * (fatPercentage / 100));
    const fatGrams = Math.round(fatCalories / 9);
    
    // Carbs: remainder
    const carbCalories = dailyCalories - proteinCalories - fatCalories;
    const carbGrams = Math.round(carbCalories / 4);
    
    return {
      dailyCalories,
      weeklyCalorieTarget: dailyCalories * 7,
      macronutrients: {
        protein: {
          grams: proteinGrams,
          percentage: Math.round((proteinCalories / dailyCalories) * 100),
          perKgBodyweight: proteinMultiplier
        },
        carbohydrates: {
          grams: carbGrams,
          percentage: Math.round((carbCalories / dailyCalories) * 100),
          perKgBodyweight: Math.round((carbGrams / weight) * 10) / 10
        },
        fats: {
          grams: fatGrams,
          percentage: fatPercentage,
          perKgBodyweight: Math.round((fatGrams / weight) * 10) / 10
        }
      },
      trainingDayAdjustments: {
        preWorkout: { calories: 150, carbs: 30, protein: 10 },
        postWorkout: { calories: 200, carbs: 40, protein: 25 },
        totalTrainingDay: dailyCalories + 200
      },
      restDayCalories: dailyCalories - 100,
      weeklyDeficit: weeklyDeficit,
      estimatedWeeklyWeightChange: -weeklyDeficit / 7700, // 7700 cal = 1kg fat (negative for weight loss)
      timeToGoal: weeklyDeficit > 0 ? this.calculateTimeToGoal(weeklyDeficit, weight, targetWeight) : undefined
    };
  }

  private calculateBMR(physicalStats: AthleteProfile['physicalStats']): number {
    const { age, weight, height, gender, bodyFatPercentage } = physicalStats;
    
    // If body fat percentage is available, use Katch-McArdle formula for more accuracy
    if (bodyFatPercentage && bodyFatPercentage > 0) {
      console.log('🔥 [PerplexityService] Using Katch-McArdle formula with body fat:', bodyFatPercentage);
      const leanBodyMass = weight * (1 - bodyFatPercentage / 100);
      return 370 + (21.6 * leanBodyMass);
    }
    
    // Otherwise use Mifflin-St Jeor Equation
    console.log('🔥 [PerplexityService] Using Mifflin-St Jeor formula (no body fat data)');
    if (gender === 'male') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  }

  private calculateTDEE(bmr: number, trainingProfile: AthleteProfile['trainingProfile']): number {
    const { weeklyTrainingHours, currentFitnessLevel } = trainingProfile;
    
    // Activity factor based on training volume and intensity
    let activityFactor = 1.4; // Sedentary base
    
    if (weeklyTrainingHours >= 15) activityFactor = 1.9; // Very active
    else if (weeklyTrainingHours >= 10) activityFactor = 1.7; // Very active
    else if (weeklyTrainingHours >= 6) activityFactor = 1.5; // Moderately active
    else if (weeklyTrainingHours >= 3) activityFactor = 1.4; // Lightly active
    
    // Adjust for fitness level
    if (currentFitnessLevel === 'elite') activityFactor *= 1.1;
    else if (currentFitnessLevel === 'advanced') activityFactor *= 1.05;
    
    return bmr * activityFactor;
  }

  private calculateTimeToGoal(weeklyDeficit: number, currentWeight?: number, targetWeight?: number): string {
    // If we have specific weight goals, calculate actual completion date
    if (currentWeight && targetWeight && Math.abs(currentWeight - targetWeight) > 0.5) {
      const weightToLose = Math.abs(currentWeight - targetWeight);
      const weeksNeeded = Math.round((weightToLose * 7700) / weeklyDeficit);
      
      if (weeksNeeded > 0) {
        const today = new Date();
        const completionDate = new Date(today);
        completionDate.setDate(today.getDate() + (weeksNeeded * 7));
        
        const formattedDate = completionDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short', 
          year: 'numeric'
        });
        
        if (weeksNeeded < 4) {
          return `${weeksNeeded} weeks (${formattedDate})`;
        } else if (weeksNeeded < 52) {
          const months = Math.round(weeksNeeded / 4.33);
          return `${months} ${months === 1 ? 'month' : 'months'} (${formattedDate})`;
        } else {
          const years = Math.round(weeksNeeded / 52);
          return `${years} ${years === 1 ? 'year' : 'years'} (${formattedDate})`;
        }
      }
    }
    
    // Fallback to generic calculation if no specific weights provided
    const weeksTo1kg = 7700 / weeklyDeficit;
    if (weeksTo1kg < 4) return `${Math.round(weeksTo1kg)} weeks per kg`;
    if (weeksTo1kg < 12) return `${Math.round(weeksTo1kg / 4)} months per kg`;
    return 'Long-term goal (>3 months per kg)';
  }

  private calculateEstimatedCompletionDate(weeksString: string, targetDate?: string): string {
    if (!weeksString) return '';
    
    const today = new Date();
    let estimatedWeeks: number;
    
    // Handle ranges like "8-10" or "8–10" - take the middle value
    if (weeksString.includes('-') || weeksString.includes('–')) {
      const [start, end] = weeksString.split(/[-–]/).map(n => parseInt(n.trim()));
      estimatedWeeks = Math.round((start + end) / 2);
    } else {
      estimatedWeeks = parseInt(weeksString);
    }
    
    if (isNaN(estimatedWeeks) || estimatedWeeks <= 0) return '';
    
    // Calculate estimated completion date
    const estimatedDate = new Date(today);
    estimatedDate.setDate(today.getDate() + (estimatedWeeks * 7));
    
    const formattedEstimated = estimatedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }).replace(/\//g, '.');

    // If we have a target date, compare them
    if (targetDate) {
      const target = new Date(targetDate);
      const formattedTarget = target.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '.');

      const timeDiff = estimatedDate.getTime() - target.getTime();
      const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));
      
      if (Math.abs(daysDiff) <= 7) {
        return `Est: ${formattedEstimated} (on target)`;
      } else if (daysDiff < 0) {
        return `Est: ${formattedEstimated} (${Math.abs(daysDiff)}d early)`;
      } else {
        return `Est: ${formattedEstimated} (${daysDiff}d late)`;
      }
    }
    
    return `Est: ${formattedEstimated} (~${estimatedWeeks}w)`;
  }

  private parseAIRecommendations(content: string, request: NutritionCalculationRequest): OptimalNutritionResponse['recommendations'] | null {
    const { athleteProfile } = request;
    const weight = athleteProfile.physicalStats.weight;
    
    console.log('🔍 [PerplexityService] Looking for AI recommendations in content...');
    console.log('🔍 [PerplexityService] AI response preview (first 500 chars):', content.substring(0, 500));
    
    // Remove thinking tags to get clean content
    const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<\/think>/g, '');
    
    // Look for AI patterns for calories AND macros
    const caloriePatterns = [
      // Match actual AI format: "Daily Calories:** ~2,500 kcal"
      { name: 'conservative', regex: /conservative\s+approach[\s\S]*?Daily\s+Calories:\*?\*?\s*~?([\d,]+)\s*kcal/i },
      { name: 'standard', regex: /standard\s+approach[\s\S]*?Daily\s+Calories:\*?\*?\s*~?([\d,]+)\s*kcal/i },
      { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?Daily\s+Calories:\*?\*?\s*~?([\d,]+)\s*kcal/i },
      // Fallback: New format: ### CONSERVATIVE APPROACH: 2500 kcal/day (22% deficit from 3200 TDEE)
      { name: 'conservative', regex: /#{2,}\s*conservative\s+approach[:\-\s]*([\d,]+)\s*kcal\/day/i },
      { name: 'standard', regex: /#{2,}\s*standard\s+approach[:\-\s]*([\d,]+)\s*kcal\/day/i },
      { name: 'aggressive', regex: /#{2,}\s*aggressive\s+approach[:\-\s]*([\d,]+)\s*kcal\/day/i },
      // More fallback patterns in case AI doesn't follow exact format
      { name: 'conservative', regex: /conservative[^:]*:[^0-9]*([\d,]+)\s*kcal/i },
      { name: 'standard', regex: /standard[^:]*:[^0-9]*([\d,]+)\s*kcal/i },
      { name: 'aggressive', regex: /aggressive[^:]*:[^0-9]*([\d,]+)\s*kcal/i },
      // Alternative formats AI might use
      { name: 'conservative', regex: /conservative\s+approach[^0-9]*([\d,]+)\s*(?:kcal|cal|calories)/i },
      { name: 'standard', regex: /standard\s+approach[^0-9]*([\d,]+)\s*(?:kcal|cal|calories)/i },
      { name: 'aggressive', regex: /aggressive\s+approach[^0-9]*([\d,]+)\s*(?:kcal|cal|calories)/i },
    ];

    // Macro parsing patterns for protein, carbs, fats
    const macroPatterns = {
      protein: [
        // Match: "Protein: 180g (2.25g/kg)" or "- Protein: 180g"
        { name: 'conservative', regex: /conservative\s+approach[\s\S]*?Protein:\s*([\d,]+)g/i },
        { name: 'standard', regex: /standard\s+approach[\s\S]*?Protein:\s*([\d,]+)g/i },
        { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?Protein:\s*([\d,]+)g/i },
        // Alternative format: "Protein: Xg (X.Xg/kg)"
        { name: 'conservative', regex: /conservative\s+approach[\s\S]*?-\s*Protein:\s*([\d,]+)g/i },
        { name: 'standard', regex: /standard\s+approach[\s\S]*?-\s*Protein:\s*([\d,]+)g/i },
        { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?-\s*Protein:\s*([\d,]+)g/i },
      ],
      carbs: [
        // Match: "Carbs: 250g" or "Carbohydrates: 250g"
        { name: 'conservative', regex: /conservative\s+approach[\s\S]*?(?:Carbs?|Carbohydrates?):\s*([\d,]+)g/i },
        { name: 'standard', regex: /standard\s+approach[\s\S]*?(?:Carbs?|Carbohydrates?):\s*([\d,]+)g/i },
        { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?(?:Carbs?|Carbohydrates?):\s*([\d,]+)g/i },
        // Alternative format with dash
        { name: 'conservative', regex: /conservative\s+approach[\s\S]*?-\s*(?:Carbs?|Carbohydrates?):\s*([\d,]+)g/i },
        { name: 'standard', regex: /standard\s+approach[\s\S]*?-\s*(?:Carbs?|Carbohydrates?):\s*([\d,]+)g/i },
        { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?-\s*(?:Carbs?|Carbohydrates?):\s*([\d,]+)g/i },
      ],
      fats: [
        // Match: "Fats: 67g" or "Fat: 67g"
        { name: 'conservative', regex: /conservative\s+approach[\s\S]*?Fats?:\s*([\d,]+)g/i },
        { name: 'standard', regex: /standard\s+approach[\s\S]*?Fats?:\s*([\d,]+)g/i },
        { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?Fats?:\s*([\d,]+)g/i },
        // Alternative format with dash
        { name: 'conservative', regex: /conservative\s+approach[\s\S]*?-\s*Fats?:\s*([\d,]+)g/i },
        { name: 'standard', regex: /standard\s+approach[\s\S]*?-\s*Fats?:\s*([\d,]+)g/i },
        { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?-\s*Fats?:\s*([\d,]+)g/i },
      ]
    };

    // Timeline parsing patterns to extract estimated completion dates/weeks
    const timelinePatterns = [
      // Match exact aggressive format: "At~1 .13kg /week ,~9weeks needed" 
      { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?at\s*~?\d+\s*\.\s*\d+\s*kg\s*\/\s*week\s*,\s*~?(\d+(?:[–\-]\d+)?)\s*weeks\s*needed/i },
      // Match "At ~0.85 kg/week, ~12 weeks needed" format (standard working format)
      { name: 'conservative', regex: /conservative\s+approach[\s\S]*?at\s*~?[\d\s.]+\s*kg\s*\/\s*week\s*,\s*~?(\d+(?:[–\-]\d+)?)\s*weeks?\s*needed/i },
      { name: 'standard', regex: /standard\s+approach[\s\S]*?at\s*~?[\d\s.]+\s*kg\s*\/\s*week\s*,\s*~?(\d+(?:[–\-]\d+)?)\s*weeks?\s*needed/i },
      { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?at\s*~?[\d\s.]+\s*kg\s*\/\s*week\s*,\s*~?(\d+(?:[–\-]\d+)?)\s*weeks?\s*needed/i },
      // Fallback: Match original format "at~1 Kg/Week ,~10 Weeks Needed" (no space between kg/week)
      { name: 'conservative', regex: /conservative\s+approach[\s\S]*?at\s*~?[\d.]+\s*kg\/week\s*,\s*~?(\d+(?:[–\-]\d+)?)\s*weeks?\s*needed/i },
      { name: 'standard', regex: /standard\s+approach[\s\S]*?at\s*~?[\d.]+\s*kg\/week\s*,\s*~?(\d+(?:[–\-]\d+)?)\s*weeks?\s*needed/i },
      { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?at\s*~?[\d.]+\s*kg\/week\s*,\s*~?(\d+(?:[–\-]\d+)?)\s*weeks?\s*needed/i },
      // Match "At X kg/week, ~Y weeks needed" format (with capital A and proper spacing)
      { name: 'conservative', regex: /conservative\s+approach[\s\S]*?At\s+[\d.]+\s*kg\/week,\s*~?(\d+(?:[–\-]\d+)?)\s*weeks?\s*needed/i },
      { name: 'standard', regex: /standard\s+approach[\s\S]*?At\s+[\d.]+\s*kg\/week,\s*~?(\d+(?:[–\-]\d+)?)\s*weeks?\s*needed/i },
      { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?At\s+[\d.]+\s*kg\/week,\s*~?(\d+(?:[–\-]\d+)?)\s*weeks?\s*needed/i },
      // Fallback patterns for exact format requests: "Timeline: 8 weeks"
      { name: 'conservative', regex: /conservative\s+approach[\s\S]*?Timeline:\s*~?(\d+(?:[–\-]\d+)?)\s*(?:weeks?|days?)/i },
      { name: 'standard', regex: /standard\s+approach[\s\S]*?Timeline:\s*~?(\d+(?:[–\-]\d+)?)\s*(?:weeks?|days?)/i },
      { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?Timeline:\s*~?(\d+(?:[–\-]\d+)?)\s*(?:weeks?|days?)/i },
      // Additional patterns for "Estimated timeline:"
      { name: 'conservative', regex: /conservative\s+approach[\s\S]*?Estimated timeline:\s*~?(\d+(?:[–\-]\d+)?)\s*(?:weeks?|days?)/i },
      { name: 'standard', regex: /standard\s+approach[\s\S]*?Estimated timeline:\s*~?(\d+(?:[–\-]\d+)?)\s*(?:weeks?|days?)/i },
      { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?Estimated timeline:\s*~?(\d+(?:[–\-]\d+)?)\s*(?:weeks?|days?)/i },
    ];
    
    // Parse calorie values
    const calorieMatches: Record<string, string> = {};
    for (const pattern of caloriePatterns) {
      const match = cleanContent.match(pattern.regex);
      if (match && !calorieMatches[pattern.name]) {
        calorieMatches[pattern.name] = match[1].replace(/,/g, ''); // Remove commas from numbers
      }
    }

    // Parse macro values
    const macroMatches: Record<string, Record<string, string>> = {
      protein: {},
      carbs: {},
      fats: {}
    };

    // Extract protein values
    for (const pattern of macroPatterns.protein) {
      const match = cleanContent.match(pattern.regex);
      if (match && !macroMatches.protein[pattern.name]) {
        macroMatches.protein[pattern.name] = match[1].replace(/,/g, '');
      }
    }

    // Extract carb values
    for (const pattern of macroPatterns.carbs) {
      const match = cleanContent.match(pattern.regex);
      if (match && !macroMatches.carbs[pattern.name]) {
        macroMatches.carbs[pattern.name] = match[1].replace(/,/g, '');
      }
    }

    // Extract fat values
    for (const pattern of macroPatterns.fats) {
      const match = cleanContent.match(pattern.regex);
      if (match && !macroMatches.fats[pattern.name]) {
        macroMatches.fats[pattern.name] = match[1].replace(/,/g, '');
      }
    }

    // Parse timeline matches
    const timelineMatches: Record<string, string> = {};
    for (const pattern of timelinePatterns) {
      const match = cleanContent.match(pattern.regex);
      if (match && !timelineMatches[pattern.name]) {
        console.log(`📅 [PerplexityService] Timeline pattern matched for ${pattern.name}:`, match[0].substring(0, 100) + '...');
        timelineMatches[pattern.name] = match[1]; // Keep original format like "8-10" or "9"
      }
    }
    
    console.log('🔍 [PerplexityService] Calorie matches found:', calorieMatches);
    console.log('🥩 [PerplexityService] Macro matches found:', macroMatches);
    console.log('📅 [PerplexityService] Timeline matches found:', timelineMatches);
    
    // Try to get at least conservative recommendation
    if (calorieMatches.conservative || calorieMatches.standard || calorieMatches.aggressive) {
      const conservativeCals = calorieMatches.conservative ? parseInt(calorieMatches.conservative) : null;
      const standardCals = calorieMatches.standard ? parseInt(calorieMatches.standard) : null;  
      const aggressiveCals = calorieMatches.aggressive ? parseInt(calorieMatches.aggressive) : null;
      
      console.log('🎯 [PerplexityService] Extracted AI calorie recommendations:', {
        conservative: conservativeCals,
        standard: standardCals,
        aggressive: aggressiveCals
      });
      
      // Use the TDEE value the user actually selected (Standard, Enhanced, or Athlete Profile)
      // Get TDEE for deficit calculation - calculate Standard TDEE if needed
      let tdee = request.selectedTDEE || request.currentGoal.enhancedDataUsed?.enhancedTDEE || request.historicalData?.metabolismProfile?.estimatedTDEE;
      if (!tdee) {
        // Calculate Standard TDEE from athlete profile as fallback
        const bmr = this.calculateBMR(request.athleteProfile.physicalStats);
        tdee = Math.round(this.calculateTDEE(bmr, request.athleteProfile.trainingProfile));
      }
      console.log('🔢 [PerplexityService] Using TDEE for deficit calculation:', tdee);
      
      // Generate recommendations for whatever we found
      const recommendations: Partial<OptimalNutritionResponse['recommendations']> = {};
      
      if (conservativeCals && conservativeCals > 1500 && conservativeCals < 4000) {
        const weeklyDeficit = (tdee - conservativeCals) * 7; // Calculate actual deficit correctly
        const proteinGrams = macroMatches.protein.conservative ? parseInt(macroMatches.protein.conservative) : null;
        const carbGrams = macroMatches.carbs.conservative ? parseInt(macroMatches.carbs.conservative) : null;
        const fatGrams = macroMatches.fats.conservative ? parseInt(macroMatches.fats.conservative) : null;
        const aiWeeklyWeightChange = this.extractWeeklyWeightChangeRate(cleanContent, 'conservative', request.currentGoal.mode);
        
        recommendations.conservative = this.generateRecommendationWithAIMacros(
          conservativeCals, weight, weeklyDeficit, 'conservative', 
          proteinGrams, carbGrams, fatGrams,
          timelineMatches.conservative, request.currentGoal.targetDate,
          aiWeeklyWeightChange
        );
      }
      
      if (standardCals && standardCals > 1500 && standardCals < 4000) {
        const weeklyDeficit = (tdee - standardCals) * 7; // Calculate actual deficit correctly
        const proteinGrams = macroMatches.protein.standard ? parseInt(macroMatches.protein.standard) : null;
        const carbGrams = macroMatches.carbs.standard ? parseInt(macroMatches.carbs.standard) : null;
        const fatGrams = macroMatches.fats.standard ? parseInt(macroMatches.fats.standard) : null;
        const aiWeeklyWeightChange = this.extractWeeklyWeightChangeRate(cleanContent, 'standard', request.currentGoal.mode);
        
        recommendations.standard = this.generateRecommendationWithAIMacros(
          standardCals, weight, weeklyDeficit, 'standard',
          proteinGrams, carbGrams, fatGrams, 
          timelineMatches.standard, request.currentGoal.targetDate,
          aiWeeklyWeightChange
        );
      }
      
      if (aggressiveCals && aggressiveCals > 1500 && aggressiveCals < 4000) {
        const weeklyDeficit = (tdee - aggressiveCals) * 7; // Calculate actual deficit correctly
        const proteinGrams = macroMatches.protein.aggressive ? parseInt(macroMatches.protein.aggressive) : null;
        const carbGrams = macroMatches.carbs.aggressive ? parseInt(macroMatches.carbs.aggressive) : null;
        const fatGrams = macroMatches.fats.aggressive ? parseInt(macroMatches.fats.aggressive) : null;
        const aiWeeklyWeightChange = this.extractWeeklyWeightChangeRate(cleanContent, 'aggressive', request.currentGoal.mode);
        
        recommendations.aggressive = this.generateRecommendationWithAIMacros(
          aggressiveCals, weight, weeklyDeficit, 'aggressive',
          proteinGrams, carbGrams, fatGrams,
          timelineMatches.aggressive, request.currentGoal.targetDate,
          aiWeeklyWeightChange
        );
      }
      
      // If we got at least one valid recommendation, return it
      if (Object.keys(recommendations).length > 0) {
        console.log('✅ [PerplexityService] Successfully parsed AI recommendations:', Object.keys(recommendations));
        return {
          conservative: recommendations.conservative || this.generateFallbackRecommendation(tdee, weight, 'conservative', request.currentGoal?.targetGoals?.weight?.target),
          standard: recommendations.standard || this.generateFallbackRecommendation(tdee, weight, 'standard', request.currentGoal?.targetGoals?.weight?.target),
          aggressive: recommendations.aggressive || this.generateFallbackRecommendation(tdee, weight, 'aggressive', request.currentGoal?.targetGoals?.weight?.target)
        };
      }
    }
    
    // If we can't parse structured recommendations, return null to use fallback
    console.log('❌ [PerplexityService] Could not extract structured recommendations from AI response');
    console.log('📝 [PerplexityService] AI response preview:', content.substring(0, 500));
    return null;
  }

  private generateFallbackRecommendation(tdee: number, weight: number, approach: 'conservative' | 'standard' | 'aggressive', targetWeight?: number) {
    const deficits = { conservative: -1750, standard: -2500, aggressive: -3500 };
    const dailyCalories = tdee + (deficits[approach] / 7);
    return this.generateRecommendation(Math.round(dailyCalories), weight, deficits[approach], approach, targetWeight);
  }

  private extractSection(content: string, section: string): string | null {
    // Simple extraction - in production, use more sophisticated parsing
    const patterns: Record<string, RegExp> = {
      'rationale': /rationale[:\s]*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i,
      'sport-specific': /sport[- ]specific[:\s]*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i,
      'periodization': /periodization[:\s]*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i
    };
    
    const match = content.match(patterns[section]);
    return match ? match[1].trim() : null;
  }

  private extractSupplements(content: string): SupplementRecommendation[] {
    // Default evidence-based supplements for athletes
    return [
      {
        name: 'Whey Protein',
        purpose: 'Post-workout recovery and protein synthesis',
        timing: 'Within 30 minutes post-workout',
        dosage: '20-25g',
        priority: 'beneficial',
        sportSpecific: false
      },
      {
        name: 'Creatine Monohydrate',
        purpose: 'Power and strength performance',
        timing: 'Daily, timing not critical',
        dosage: '3-5g',
        priority: 'beneficial',
        sportSpecific: true
      }
    ];
  }

  private extractHydrationGuidance(content: string, request: NutritionCalculationRequest): HydrationGuidance {
    const weight = request.athleteProfile.physicalStats.weight;
    
    return {
      dailyBaselineFluid: Math.round(weight * 35), // 35ml per kg bodyweight
      preWorkoutHydration: '500ml 2-3 hours before, 200ml 15-30 min before',
      duringWorkoutFluidRate: '150-250ml every 15-20 minutes',
      postWorkoutRehydration: '150% of fluid lost (weigh before/after)',
      electrolyteRecommendations: 'Add electrolytes for sessions >60 minutes or high sweat rate'
    };
  }

  private extractGoalFeasibility(content: string): OptimalNutritionResponse['goalFeasibility'] {
    console.log('🔍 [PerplexityService] Extracting goal feasibility from AI response...');
    
    // Extract achievability
    const achievableMatch = content.match(/ACHIEVABLE:\s*(YES|NO)/i);
    const isAchievable = achievableMatch ? achievableMatch[1].toUpperCase() === 'YES' : true;
    
    // Extract analysis
    const analysisMatch = content.match(/ANALYSIS:\s*([^]*?)(?=KEY INSIGHTS:|CONFIDENCE:|$)/i);
    const analysis = analysisMatch ? analysisMatch[1].trim() : 'Goal appears achievable with proper approach and consistency.';
    
    // Extract key insights
    const insightsSection = content.match(/KEY INSIGHTS:\s*([^]*?)(?=CONFIDENCE:|WARNINGS:|$)/i);
    const keyInsights: string[] = [];
    if (insightsSection) {
      const insights = insightsSection[1].match(/^-\s*(.+)$/gm);
      if (insights) {
        keyInsights.push(...insights.map(insight => insight.replace(/^-\s*/, '').trim()));
      }
    }
    
    // Fallback insights if none extracted
    if (keyInsights.length === 0) {
      keyInsights.push(
        'Nutrition plan tailored to your training demands and goal timeline',
        'Approach balances performance maintenance with body composition changes',
        'Timeline provides realistic expectations for sustainable progress'
      );
    }
    
    // Extract confidence level
    const confidenceMatch = content.match(/CONFIDENCE:\s*(HIGH|MEDIUM|LOW)/i);
    const confidenceLevel = (confidenceMatch ? confidenceMatch[1].toLowerCase() : 'medium') as 'high' | 'medium' | 'low';
    
    // Extract warnings
    const warningsMatch = content.match(/WARNINGS:\s*([^]*?)(?=\*\*|$)/i);
    const warningsText = warningsMatch ? warningsMatch[1].trim() : '';
    const warningsOrConcerns: string[] = [];
    
    if (warningsText && warningsText.toLowerCase() !== 'none') {
      // Try to extract bullet points or split by sentences
      const warningPoints = warningsText.match(/^-\s*(.+)$/gm);
      if (warningPoints) {
        warningsOrConcerns.push(...warningPoints.map(warning => warning.replace(/^-\s*/, '').trim()));
      } else if (warningsText.length > 10) {
        // If no bullet points but substantial text, use as single warning
        warningsOrConcerns.push(warningsText);
      }
    }
    
    console.log('📊 [PerplexityService] Extracted goal feasibility:', {
      isAchievable,
      analysis: analysis.substring(0, 100) + '...',
      insightsCount: keyInsights.length,
      confidenceLevel,
      warningsCount: warningsOrConcerns.length
    });
    
    return {
      isAchievable,
      analysis,
      keyInsights,
      confidenceLevel,
      warningsOrConcerns: warningsOrConcerns.length > 0 ? warningsOrConcerns : undefined
    };
  }

  private extractMealTiming(content: string): MealTimingGuidance {
    return {
      preWorkoutMeal: {
        timing: '1-3 hours before training',
        composition: 'High carb, moderate protein, low fat/fiber',
        examples: ['Banana with honey', 'Oatmeal with berries', 'Toast with jam']
      },
      postWorkoutMeal: {
        timing: 'Within 30-60 minutes',
        composition: '3:1 or 4:1 carb to protein ratio',
        examples: ['Protein shake with fruit', 'Chocolate milk', 'Greek yogurt with granola']
      },
      dailyMealDistribution: {
        numberOfMeals: 4,
        mealSpacing: 'Every 3-4 hours',
        largestMealTiming: 'Post-workout or dinner'
      }
    };
  }

  private getFallbackNutritionRecommendations(request: NutritionCalculationRequest): OptimalNutritionResponse {
    const recommendations = this.extractRecommendations('', request);
    
    return {
      recommendations,
      goalFeasibility: {
        isAchievable: true,
        analysis: 'Goal appears achievable based on standard sports nutrition principles and your athlete profile.',
        keyInsights: [
          'Nutrition plan calculated using established formulas and athlete-specific adjustments',
          'Timeline allows for gradual, sustainable progress towards your goals',
          'Approach prioritizes both performance and body composition objectives'
        ],
        confidenceLevel: 'medium',
        warningsOrConcerns: undefined
      },
      rationale: 'Fallback recommendations based on established sports nutrition principles and athlete profile.',
      sportSpecificGuidance: this.getFallbackSportGuidance(request.athleteProfile.trainingProfile.primarySport),
      periodizationAdjustments: 'Adjust carbohydrate intake based on training volume: higher during intense phases, moderate during base building.',
      supplementRecommendations: this.extractSupplements(''),
      hydrationGuidance: this.extractHydrationGuidance('', request),
      mealTimingRecommendations: this.extractMealTiming(''),
      adaptationPeriod: '2-4 weeks for metabolic adaptation',
      monitoringMetrics: ['Body weight trends', 'Performance metrics', 'Energy levels', 'Recovery quality', 'Sleep quality', 'Training compliance']
    };
  }

  private getFallbackSportGuidance(sport: SportType): string {
    const guidance: Record<SportType, string> = {
      'running': 'Focus on carbohydrate periodization around key sessions. Emphasize glycogen replenishment post-long runs.',
      'cycling': 'High carbohydrate needs, especially for long rides. Practice race-day nutrition strategies during training.',
      'swimming': 'Maintain adequate protein for muscle recovery. Consider pool-side nutrition for long sessions.',
      'crossfit': 'Balanced macros to support both strength and conditioning. Time carbs around high-intensity sessions.',
      'hyrox': 'Hybrid endurance-strength nutrition. Emphasize both glycogen storage and protein synthesis.',
      'triathlon': 'Complex periodization needed for three disciplines. Practice transitions with nutrition timing.',
      'strength-training': 'Higher protein needs (2.0-2.2g/kg). Time protein intake around sessions for optimal synthesis.',
      'martial-arts': 'Weight management considerations. Maintain power while potentially cutting for competition.',
      'team-sports': 'Game-day carb loading. Recovery nutrition between training sessions and matches.',
      'general-fitness': 'Balanced approach focusing on sustainable habits and overall health markers.'
    };
    
    return guidance[sport] || 'Focus on balanced nutrition supporting your training goals and recovery needs.';
  }
}

// Export singleton instance
export const perplexityService = new PerplexityService();
