# NutritionRecommendationScreen Documentation

## Overview
The `NutritionRecommendationScreen` is a comprehensive AI-powered nutrition recommendation interface that displays personalized nutrition plans based on athlete profiles and training goals.

## Features

### 🤖 AI-Powered Recommendations
- **Perplexity AI Integration**: Uses advanced sports nutrition AI to calculate personalized recommendations
- **Sport-Specific Guidance**: Tailored advice based on the athlete's primary sport
- **Evidence-Based Calculations**: Recommendations based on scientific literature and best practices

### 📊 Three Recommendation Levels
1. **Conservative** (Green) - Safer approach with moderate deficit
   - Lower calorie deficit
   - Gentle progression
   - Suitable for beginners or maintenance phases

2. **Standard** (Blue) - Balanced evidence-based approach
   - Moderate calorie deficit
   - Research-backed macro ratios
   - Recommended for most athletes

3. **Aggressive** (Orange) - Faster results with higher deficit
   - Higher calorie deficit
   - More intensive approach
   - For experienced athletes with specific deadlines

### 🎯 Detailed Nutrition Breakdown
Each recommendation level includes:
- **Daily Calorie Target**: Total daily energy requirements
- **Macronutrient Distribution**: 
  - Protein (g and g/kg bodyweight)
  - Carbohydrates (g and g/kg bodyweight)
  - Fats (g and g/kg bodyweight)
  - Visual percentage breakdown with color-coded bar
- **Training Day Adjustments**: Additional calories for training days
- **Rest Day Calories**: Reduced intake for recovery days
- **Expected Outcomes**: Projected weight change and timeline

### ⏰ Meal Timing Guidelines
- **Pre-Workout Nutrition**: Timing and composition recommendations
- **Post-Workout Recovery**: Optimal nutrition for recovery
- **Daily Meal Distribution**: Number of meals and spacing

### 💧 Hydration Protocols
- **Daily Baseline**: Standard daily fluid intake
- **Pre-Workout**: Hydration strategy before training
- **During Workout**: Fluid intake rate during exercise
- **Post-Workout**: Rehydration protocols
- **Electrolyte Recommendations**: Sport-specific electrolyte needs

### 💊 Supplement Recommendations
- **Priority-Based System**: Essential, beneficial, and optional supplements
- **Dosage Guidelines**: Specific amounts and timing
- **Purpose Explanation**: Why each supplement is recommended

### 🧠 AI Rationale
- **Reasoning Display**: Transparent explanation of recommendations
- **Sport-Specific Notes**: Tailored advice for the athlete's sport
- **Periodization Adjustments**: Training phase considerations

### 📈 Monitoring & Adaptation
- **Key Metrics**: What to track for success
- **Adaptation Period**: Expected timeframe for adjustments
- **Progress Indicators**: Signs of effective nutrition implementation

## User Interface

### Visual Design
- **Professional Cards**: Clean, card-based layout for easy comparison
- **Color Coding**: Intuitive color scheme for different recommendation levels
- **Visual Hierarchy**: Clear organization of information
- **Interactive Selection**: Touch-based recommendation level selection
- **Progress Indicators**: Visual feedback during AI calculation

### User Experience
- **Loading States**: Engaging loading screen with progress messages
- **Error Handling**: Graceful error recovery with retry options
- **Customization Options**: Future-ready customization capabilities
- **Save Functionality**: Direct integration with goal configuration

### Navigation Flow
1. **Entry**: Accessed from athlete onboarding or goal setup
2. **Loading**: AI calculation with progress feedback
3. **Selection**: Choose from three recommendation levels
4. **Review**: Detailed breakdown of selected plan
5. **Save**: Integration with weekly calorie banking system

## Technical Implementation

### Dependencies
- **PerplexityService**: AI-powered nutrition calculations
- **Zustand Store**: State management for goal configuration
- **React Navigation**: Type-safe navigation with parameters
- **Expo Vector Icons**: Consistent iconography

### Type Safety
- **Full TypeScript Integration**: Comprehensive type checking
- **Navigation Types**: Type-safe route parameters
- **API Response Types**: Structured data from AI service

### Performance
- **Async Loading**: Non-blocking AI calculations
- **Error Boundaries**: Graceful error handling
- **Memory Optimization**: Efficient data management

## Integration Points

### Data Flow
1. **Input**: AthleteProfile + GoalConfiguration from previous screens
2. **Processing**: AI calculation via PerplexityService
3. **Output**: Enhanced goal configuration saved to store
4. **Navigation**: Redirect to WeeklyBankingScreen

### Store Integration
- **Goal Configuration**: Updates existing goal with nutrition data
- **Weekly Goal**: Creates new weekly goal based on recommendations
- **State Persistence**: Maintains nutrition preferences

## Usage Example

```typescript
// Navigation to NutritionRecommendationScreen
navigation.navigate('NutritionRecommendation', {
  athleteProfile: {
    // Complete athlete profile with sport, goals, metrics
  },
  goalConfig: {
    // Goal configuration with targets and preferences
  }
});
```

## Future Enhancements

### Planned Features
- **Custom Macro Adjustment**: In-screen macro ratio editing
- **Meal Plan Generation**: AI-generated meal plans
- **Recipe Suggestions**: Sport-specific recipe recommendations
- **Progress Tracking**: Long-term nutrition adherence monitoring

### Integration Opportunities
- **Garmin Connect**: Training load integration
- **MyFitnessPal**: Food logging synchronization
- **Wearable Devices**: Real-time energy expenditure

## Accessibility
- **Screen Reader Support**: Semantic markup and labels
- **High Contrast**: Clear visual distinctions
- **Touch Targets**: Adequate button sizes for mobile
- **Error Messages**: Clear, actionable error descriptions

## Performance Considerations
- **API Optimization**: Efficient Perplexity API usage
- **Caching Strategy**: Intelligent recommendation caching
- **Background Processing**: Non-blocking calculations
- **Memory Management**: Efficient data handling

This comprehensive nutrition recommendation system provides athletes with professional-grade nutrition planning powered by AI, delivering personalized, evidence-based recommendations that adapt to their specific sport, goals, and training demands.
