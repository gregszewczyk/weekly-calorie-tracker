# API Types Documentation

This document provides comprehensive documentation for all TypeScript types used in API interactions throughout the Weekly Calorie Tracker application.

## 📁 File Overview

The `src/types/ApiTypes.ts` file contains structured TypeScript interfaces and types for:

- **Perplexity API Integration**: Request/response types for AI-powered nutrition calculations
- **Error Handling**: Standardized error interfaces across all API services
- **Nutrition Analysis**: Detailed types for macro calculations and sport-specific recommendations
- **Validation & Parsing**: Types for request validation and response parsing
- **Caching**: Types for API response caching and optimization

## 🔧 Core API Types

### Base API Response Structure

```typescript
interface APIResponse<T = any> {
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
```

**Usage Example:**
```typescript
const response: APIResponse<NutritionRecommendation> = await nutritionService.calculate(request);
if (response.success && response.data) {
  console.log('Calories:', response.data.macronutrients.protein.grams);
}
```

### Error Handling

```typescript
interface APIError {
  code: string;
  message: string;
  statusCode?: number;
  timestamp: string;
  requestId?: string;
  details?: Record<string, any>;
  retryable?: boolean;
  source: 'perplexity' | 'garmin' | 'strava' | 'internal';
}
```

**Error Handling Example:**
```typescript
try {
  const nutrition = await perplexityService.calculateOptimalNutrition(request);
} catch (error) {
  const apiError: APIError = {
    code: 'NUTRITION_CALC_FAILED',
    message: error.message,
    timestamp: new Date().toISOString(),
    source: 'perplexity',
    retryable: true
  };
  console.error('API Error:', apiError);
}
```

## 🤖 Perplexity API Types

### Request Structure

```typescript
interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  search_domain_filter?: string[];
  search_recency_filter?: 'month' | 'year' | 'week';
  return_citations?: boolean;
}
```

### Response Structure

```typescript
interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: PerplexityChoice[];
  citations?: string[];
}
```

**Integration Example:**
```typescript
const perplexityRequest: PerplexityRequest = {
  model: 'llama-3.1-sonar-large-128k-online',
  messages: [
    { role: 'system', content: 'You are a sports nutrition expert...' },
    { role: 'user', content: 'Calculate nutrition for endurance athlete...' }
  ],
  max_tokens: 4000,
  temperature: 0.2,
  search_domain_filter: ['pubmed.ncbi.nlm.nih.gov', 'mysportscience.com'],
  return_citations: true
};
```

## 🥗 Nutrition Calculation Types

### Comprehensive Nutrition Prompt

```typescript
interface NutritionPrompt {
  type: 'nutrition-calculation' | 'sport-guidance' | 'periodization-advice';
  athleteContext: AthleteContext;
  goalContext: GoalContext;
  preferences: NutritionPreferences;
  constraints?: NutritionConstraints;
  specializations?: SportSpecialization[];
}
```

### Athlete Context

```typescript
interface AthleteContext {
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
}
```

**Example Usage:**
```typescript
const athleteContext: AthleteContext = {
  personalStats: {
    age: 28,
    weight: 70,
    height: 175,
    gender: 'male',
    bodyFatPercentage: 12,
    experienceLevel: 'advanced'
  },
  trainingProfile: {
    sport: 'running',
    weeklyHours: 12,
    sessionsPerWeek: 6,
    trainingPhase: 'build',
    fitnessLevel: 'advanced'
  },
  lifestyle: {
    occupationActivityLevel: 'sedentary',
    sleepHours: 8,
    stressLevel: 'moderate'
  }
};
```

### Detailed Nutrition Results

```typescript
interface CalorieCalculationResult {
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
```

### Macronutrient Breakdown

```typescript
interface MacronutrientBreakdown {
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
}
```

**Macro Analysis Example:**
```typescript
const macros: MacronutrientBreakdown = {
  protein: {
    grams: 140,
    percentage: 25,
    perKgBodyweight: 2.0,
    timing: {
      preWorkout: 20,
      postWorkout: 30,
      beforeBed: 25,
      distributed: 65
    },
    sources: ['lean meats', 'dairy', 'legumes'],
    quality: 'complete'
  },
  carbohydrates: {
    grams: 350,
    percentage: 50,
    perKgBodyweight: 5.0,
    timing: {
      preWorkout: 60,
      duringWorkout: 40,
      postWorkout: 80,
      remainder: 170
    },
    types: {
      simple: 100,
      complex: 220,
      fiber: 30
    },
    sources: ['whole grains', 'fruits', 'vegetables']
  },
  fats: {
    grams: 78,
    percentage: 25,
    perKgBodyweight: 1.1,
    types: {
      saturated: 20,
      monounsaturated: 30,
      polyunsaturated: 20,
      omega3: 8
    },
    sources: ['nuts', 'oils', 'fish'],
    timing: 'avoid-pre-workout'
  }
};
```

## 🎯 Sport-Specific Types

### Sport Specialization

```typescript
interface SportSpecialization {
  sport: SportType;
  competitionLevel: string;
  seasonPhase: 'off-season' | 'pre-season' | 'in-season' | 'post-season';
  upcomingEvents?: {
    date: string;
    type: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
  }[];
}
```

### Sport-Specific Adjustments

```typescript
interface SportSpecificAdjustment {
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
```

**Sport-Specific Example:**
```typescript
const runningAdjustments: SportSpecificAdjustment = {
  sport: 'running',
  adjustments: {
    calories: 15, // 15% increase on training days
    protein: 0,   // Standard protein
    carbohydrates: 25, // 25% increase for glycogen
    fats: -10     // Slightly reduced pre-workout
  },
  timing: {
    preWorkout: '2-3 hours before: complex carbs + moderate protein',
    duringWorkout: 'Sports drink for runs >60 minutes',
    postWorkout: '3:1 carb:protein ratio within 30 minutes'
  },
  specialConsiderations: [
    'Higher carb needs for long runs',
    'Electrolyte replacement in hot weather',
    'Glycogen supercompensation before races'
  ],
  commonMistakes: [
    'Trying new foods on race day',
    'Insufficient carb intake during long runs',
    'Over-hydrating before races'
  ]
};
```

## 📊 Analysis & Implementation Types

### Nutrition Analysis

```typescript
interface NutritionAnalysis {
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
  riskAssessment: {
    level: 'low' | 'moderate' | 'high';
    factors: string[];
    mitigations: string[];
  };
}
```

### Implementation Guidance

```typescript
interface ImplementationGuidance {
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
  };
  troubleshooting: {
    commonIssues: string[];
    solutions: Record<string, string[]>;
    warningSigns: string[];
  };
}
```

## 🔄 Validation & Error Types

### Validation Results

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}
```

**Validation Example:**
```typescript
const validateNutritionRequest = (request: NutritionPrompt): ValidationResult => {
  const errors: ValidationError[] = [];
  
  if (request.athleteContext.personalStats.age < 13) {
    errors.push({
      field: 'age',
      message: 'Age must be at least 13 years',
      code: 'AGE_TOO_LOW',
      severity: 'error'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
};
```

### Response Parsing

```typescript
interface ParsedNutritionResponse {
  success: boolean;
  data?: CalorieCalculationResult;
  errors?: string[];
  warnings?: string[];
  fallbackUsed: boolean;
  parsingConfidence: number; // 0-1
}
```

## 💾 Caching Types

### Cached Results

```typescript
interface CachedNutritionResult {
  key: string;
  data: CalorieCalculationResult;
  timestamp: number;
  expiresAt: number;
  requestHash: string;
  hitCount: number;
}

interface CacheConfig {
  enabled: boolean;
  ttl: number; // time to live in ms
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'lfu';
}
```

**Cache Usage Example:**
```typescript
const cacheConfig: CacheConfig = {
  enabled: true,
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 100,
  strategy: 'lru'
};

const getCachedResult = (requestHash: string): CachedNutritionResult | null => {
  // Implementation for cache retrieval
  return cache.get(requestHash);
};
```

## 🔧 Utility Types

### Type Aliases

```typescript
export type RecommendationLevel = 'conservative' | 'standard' | 'aggressive';
export type NutritionPromptType = 'nutrition-calculation' | 'sport-guidance' | 'periodization-advice';
export type APISource = 'perplexity' | 'garmin' | 'strava' | 'internal';
export type EvidenceLevel = 'low' | 'moderate' | 'high';
export type PriorityLevel = 'essential' | 'beneficial' | 'optional';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
```

### Request Builder Pattern

```typescript
interface NutritionRequestBuilder {
  setAthlete(profile: AthleteProfile): NutritionRequestBuilder;
  setGoal(config: GoalConfiguration): NutritionRequestBuilder;
  setPreference(level: RecommendationLevel): NutritionRequestBuilder;
  addTrainingData(sessions: WorkoutSession[]): NutritionRequestBuilder;
  build(): NutritionPrompt;
}
```

**Builder Pattern Example:**
```typescript
const nutritionRequest = new NutritionRequestBuilder()
  .setAthlete(athleteProfile)
  .setGoal(goalConfiguration)
  .setPreference('standard')
  .addTrainingData(recentWorkouts)
  .build();

const result = await perplexityService.calculateOptimalNutrition(nutritionRequest);
```

## 🚀 Integration Examples

### Complete Workflow

```typescript
// 1. Build nutrition request
const request: NutritionPrompt = {
  type: 'nutrition-calculation',
  athleteContext: createAthleteContext(athleteProfile),
  goalContext: createGoalContext(goalConfiguration),
  preferences: {
    approachLevel: 'standard',
    dietaryRestrictions: [],
    mealPreferences: [],
    supplementTolerance: 'basic'
  }
};

// 2. Validate request
const validation = validateNutritionRequest(request);
if (!validation.isValid) {
  throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
}

// 3. Make API call
const response: APIResponse<CalorieCalculationResult> = await nutritionService.calculate(request);

// 4. Handle response
if (response.success && response.data) {
  const { recommendations, analysis, implementation } = response.data;
  
  // Use standard recommendation
  const nutrition = recommendations.standard;
  console.log(`Daily calories: ${nutrition.calories.daily.average}`);
  console.log(`Protein: ${nutrition.macronutrients.protein.grams}g`);
  
  // Show implementation guidance
  console.log('Week 1 guidance:', implementation.phaseIn.week1);
  
} else {
  console.error('Nutrition calculation failed:', response.error);
}
```

## 📚 Best Practices

### Type Safety

```typescript
// ✅ Good: Use specific types
const validateMacros = (macros: MacronutrientBreakdown): boolean => {
  return macros.protein.grams > 0 && 
         macros.carbohydrates.grams > 0 && 
         macros.fats.grams > 0;
};

// ❌ Avoid: Using any
const validateMacros = (macros: any): boolean => {
  return macros.protein > 0; // No type safety
};
```

### Error Handling

```typescript
// ✅ Good: Structured error handling
const handleAPIError = (error: APIError): void => {
  switch (error.source) {
    case 'perplexity':
      if (error.retryable) {
        // Retry logic
      }
      break;
    case 'garmin':
      // Handle OAuth refresh
      break;
    default:
      // Log and fallback
  }
};
```

### Response Validation

```typescript
// ✅ Good: Validate API responses
const isValidNutritionResponse = (data: any): data is CalorieCalculationResult => {
  return data && 
         data.recommendations &&
         data.recommendations.standard &&
         typeof data.recommendations.standard.calories.daily.average === 'number';
};
```

---

## 🔄 Version History

- **v1.0.0**: Initial API types with Perplexity integration
- **v1.1.0**: Added comprehensive nutrition calculation types
- **v1.2.0**: Enhanced sport-specific and periodization types
- **v1.3.0**: Added validation and caching types

---

This comprehensive type system ensures type safety, maintainability, and extensibility across all API interactions in the Weekly Calorie Tracker application.
