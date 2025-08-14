# PerplexityService - AI-Powered Sports Nutrition

This service integrates with the Perplexity Sonar API to provide AI-powered sports nutrition calculations for athletes. It analyzes athlete profiles, training data, and goals to deliver personalized calorie and macro recommendations.

## 🚀 Features

- **AI-Powered Calculations**: Uses Perplexity's Sonar API with access to real-time sports science research
- **Multi-Sport Support**: Specialized nutrition strategies for 10+ sports
- **Conservative/Standard/Aggressive Options**: Three recommendation levels for different athlete preferences
- **Periodization-Aware**: Adjusts recommendations based on training phases
- **Garmin Integration Ready**: Supports Garmin Connect data for enhanced accuracy
- **Fallback Calculations**: Reliable offline calculations when API is unavailable
- **Sport-Specific Expertise**: Tailored guidance for each sport's unique demands

## 📦 Installation & Setup

### 1. Get Perplexity API Key
1. Sign up at [Perplexity](https://www.perplexity.ai/)
2. Get your API key from the dashboard
3. Store it securely in your app

### 2. Initialize the Service
```typescript
import { PerplexityService } from '../services/PerplexityService';

// Initialize with API key
const nutritionService = new PerplexityService('your-api-key-here');

// Or use the singleton with API key set later
import { perplexityService } from '../services/PerplexityService';
```

## 🏃‍♂️ Usage Examples

### Basic Nutrition Calculation
```typescript
import { perplexityService, NutritionCalculationRequest } from '../services/PerplexityService';

const calculateNutrition = async (athleteProfile, goalConfig) => {
  const request: NutritionCalculationRequest = {
    athleteProfile,
    currentGoal: goalConfig,
    preferenceLevel: 'standard',
    periodizationPhase: 'base-building'
  };

  const recommendations = await perplexityService.calculateOptimalNutrition(request);
  
  console.log('Daily Calories:', recommendations.recommendations.standard.dailyCalories);
  console.log('Protein:', recommendations.recommendations.standard.macronutrients.protein);
  console.log('Carbs:', recommendations.recommendations.standard.macronutrients.carbohydrates);
  console.log('Fats:', recommendations.recommendations.standard.macronutrients.fats);
};
```

### Integration with Athlete Onboarding
```typescript
// In AthleteOnboardingScreen.tsx
import { integrateWithOnboarding } from '../examples/PerplexityServiceExample';

const handleComplete = async () => {
  const athleteProfile = createAthleteProfile();
  
  // Get AI-powered recommendations
  const enhancedConfig = await integrateWithOnboarding(athleteProfile, goalConfig);
  
  // Save enhanced configuration with AI recommendations
  setGoalConfiguration(enhancedConfig);
  setAthleteProfile(athleteProfile);
  
  onComplete(athleteProfile);
};
```

### Sport-Specific Guidance
```typescript
const getRunningAdvice = async () => {
  const guidance = await perplexityService.getSportSpecificGuidance('running', 'peak');
  console.log('Running Peak Phase Nutrition:', guidance);
};
```

## 🎯 API Response Structure

### Nutrition Recommendations
```typescript
{
  recommendations: {
    conservative: {
      dailyCalories: 2200,
      macronutrients: {
        protein: { grams: 132, percentage: 24, perKgBodyweight: 1.6 },
        carbohydrates: { grams: 275, percentage: 50, perKgBodyweight: 3.3 },
        fats: { grams: 64, percentage: 26, perKgBodyweight: 0.8 }
      },
      trainingDayAdjustments: {
        preWorkout: { calories: 150, carbs: 30, protein: 10 },
        postWorkout: { calories: 200, carbs: 40, protein: 25 },
        totalTrainingDay: 2400
      },
      restDayCalories: 2100,
      estimatedWeeklyWeightChange: -0.3
    },
    standard: { /* Similar structure with different values */ },
    aggressive: { /* Similar structure with different values */ }
  },
  sportSpecificGuidance: "Focus on carbohydrate periodization...",
  hydrationGuidance: {
    dailyBaselineFluid: 2800,
    preWorkoutHydration: "500ml 2-3 hours before...",
    // ... more guidance
  },
  supplementRecommendations: [
    {
      name: "Whey Protein",
      purpose: "Post-workout recovery",
      timing: "Within 30 minutes post-workout",
      dosage: "20-25g",
      priority: "beneficial"
    }
  ]
}
```

## 🔧 Configuration Options

### Preference Levels
- **Conservative**: Lower deficits, higher protein, safer approach
- **Standard**: Balanced approach based on sports science
- **Aggressive**: Higher deficits, competition-focused

### Periodization Phases
- **base-building**: Building aerobic capacity
- **build**: Increasing training intensity
- **peak**: Competition preparation
- **recovery**: Active recovery period
- **off-season**: Maintenance phase

### Supported Sports
- Running, Cycling, Swimming
- CrossFit, Hyrox, Triathlon
- Strength Training, Martial Arts
- Team Sports, General Fitness

## 🛡️ Error Handling & Fallbacks

The service includes comprehensive error handling:

```typescript
// API failures automatically fall back to evidence-based calculations
const recommendations = await perplexityService.calculateOptimalNutrition(request);
// Always returns valid recommendations, even if API is down
```

### Fallback Features
- BMR calculation using Mifflin-St Jeor equation
- TDEE estimation based on training volume
- Evidence-based macro distributions
- Sport-specific guidance database
- Default supplement recommendations

## 🔐 Security Considerations

1. **API Key Storage**: Store API keys securely, never in source code
2. **Rate Limiting**: Perplexity API has rate limits - cache responses when possible
3. **Error Logging**: Monitor API usage and errors
4. **Data Privacy**: Athlete data is only sent to Perplexity for calculation

## 📊 Monitoring & Analytics

Track these metrics to optimize nutrition recommendations:

- Body weight trends (weekly weigh-ins)
- Performance metrics (training data)
- Energy levels (subjective ratings)
- Recovery quality (sleep, soreness)
- Training compliance (session completion rates)

## 🚀 Advanced Features

### Garmin Integration
```typescript
const request: NutritionCalculationRequest = {
  athleteProfile,
  currentGoal: goalConfig,
  preferenceLevel: 'standard',
  garminData: {
    vo2Max: 55,
    trainingStressScore: 85,
    recoveryTime: 18,
    recentWorkouts: [/* workout data */]
  }
};
```

### Custom Periodization
```typescript
// Adjust recommendations based on training calendar
const recommendations = await perplexityService.calculateOptimalNutrition({
  athleteProfile,
  currentGoal: goalConfig,
  preferenceLevel: 'standard',
  periodizationPhase: 'peak', // 2 weeks before competition
  targetDate: new Date('2025-03-15') // Competition date
});
```

## 🤝 Contributing

This service is designed to be extensible. You can:

1. Add new sports to the `SportType` enum
2. Extend `GarminIntegrationData` for additional metrics
3. Add new preference levels or periodization phases
4. Enhance the prompt engineering for better AI responses

## 📚 Resources

- [Perplexity API Documentation](https://docs.perplexity.ai/)
- [Sports Nutrition Guidelines](https://www.mysportscience.com/)
- [Periodization Principles](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3761555/)

---

**Note**: This service provides general nutrition guidance and should not replace professional medical or nutrition advice. Always consult with qualified professionals for personalized recommendations.
