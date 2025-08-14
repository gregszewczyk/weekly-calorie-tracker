const { PerplexityService } = require('./src/services/PerplexityService');

// Mock user data based on your profile
const mockAthleteProfile = {
  physicalStats: {
    age: 33,
    weight: 88,
    height: 177,
    gender: 'male',
    bodyFatPercentage: 15
  },
  trainingProfile: {
    primarySport: 'strength-training',
    trainingExperience: 'intermediate',
    currentFitnessLevel: 'intermediate',
    weeklyTrainingHours: 14,
    sessionsPerWeek: 10
  }
};

const mockGoalConfiguration = {
  mode: 'cut',
  performanceMode: true,
  targetDate: '2025-10-12',
  targetGoals: {
    performance: {
      targetMetrics: [
        { metricName: 'Half Marathon Time', value: 120, unit: 'minutes' },
        { metricName: 'Body Fat', value: 10, unit: '%' }
      ]
    }
  }
};

const mockRequest = {
  athleteProfile: mockAthleteProfile,
  currentGoal: mockGoalConfiguration,
  selectedTDEE: 3230,
  tdeeMethod: 'enhanced',
  recentTrainingData: [],
  garminData: null,
  appleHealthContext: null,
  historicalData: null,
  periodizationPhase: 'base-building',
  preferenceLevel: 'advanced'
};

async function testAINutritionAPI() {
  console.log('🧪 Testing AI Nutrition API...');
  console.log('📊 Mock User Profile:', {
    weight: mockAthleteProfile.physicalStats.weight + 'kg',
    bodyFat: mockAthleteProfile.physicalStats.bodyFatPercentage + '%',
    goal: mockGoalConfiguration.mode,
    tdee: mockRequest.selectedTDEE + ' kcal/day',
    timeline: mockGoalConfiguration.targetDate
  });
  
  try {
    const perplexityService = new PerplexityService();
    
    console.log('\n🚀 Calling Perplexity API...');
    const result = await perplexityService.calculateOptimalNutrition(mockRequest);
    
    console.log('\n✅ AI Response Received!');
    console.log('📋 Parsed Recommendations:');
    console.log('Conservative:', result.recommendations.conservative);
    console.log('Standard:', result.recommendations.standard); 
    console.log('Aggressive:', result.recommendations.aggressive);
    
    console.log('\n🏃 Sport-Specific Guidance:', result.sportSpecificGuidance);
    console.log('💊 Supplements:', result.supplementRecommendations);
    console.log('💧 Hydration:', result.hydrationGuidance);
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testAINutritionAPI();