/**
 * Test script to get AI response for specific user profile
 * Usage: node test-ai-response.js
 */

// Mock the required types and services for testing
const API_CONFIG = {
  PERPLEXITY: {
    API_KEY: process.env.PERPLEXITY_API_KEY || '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',
    BASE_URL: 'https://api.perplexity.ai',
    DEFAULT_MODEL: 'sonar',
    DEFAULT_TEMPERATURE: 0,
    DEFAULT_MAX_TOKENS: 800,
    TIMEOUT: 60000
  }
};

// Your specific profile data
const testProfile = {
  personalInfo: {
    name: 'Test User',
    dateOfBirth: new Date('1991-01-01'),
    profileCreated: new Date(),
    lastUpdated: new Date(),
  },
  physicalStats: {
    age: 33,
    weight: 90, // kg
    height: 177, // cm
    gender: 'male',
    bodyFatPercentage: 16,
  },
  trainingProfile: {
    weeklyTrainingHours: 15, // 10h strength + 5h running
    sessionsPerWeek: 10,
    primarySport: 'running',
    secondarySports: ['strength-training'],
    currentFitnessLevel: 'intermediate',
    trainingExperience: '2-to-5-years',
    trainingPhaseFocus: 'endurance',
    preferredTrainingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    sessionDuration: {
      average: 90, // minutes
      minimum: 60,
      maximum: 120,
    },
  },
  performanceGoals: [{
    eventDate: new Date('2025-10-12'),
    eventType: 'race',
    targetOutcome: 'get to sub 10% body fat while training for Manchester half marathon in October without affecting the running performance',
    currentPerformanceLevel: 'competitive-local',
    priorityLevel: 'high',
    deadline: new Date('2025-10-12'),
  }],
  nutritionPreferences: {
    dietaryRestrictions: [],
    allergies: [],
    preferences: [],
    supplementsCurrently: [],
    mealPrepPreference: 'moderate',
  },
  activityLevel: {
    occupationActivityLevel: 'moderately-active',
    sleepHours: 8,
    stressLevel: 'moderate',
  },
  trackingPreferences: {
    weighInFrequency: 'weekly',
    progressPhotoFrequency: 'bi-weekly',
    measurementFrequency: 'weekly',
    performanceTestFrequency: 'monthly',
  },
};

const goalConfig = {
  mode: 'cut',
  performanceMode: true,
  startDate: '2025-08-09',
  targetDate: '2025-10-12',
  weeklyDeficitTarget: -3500, // 1 lb/week
  isOpenEnded: false,
  targetGoals: {
    weight: {
      target: 80, // Estimated target for sub 10% body fat
      current: 90,
      priority: 'secondary',
    },
    bodyComposition: {
      targetBodyFat: 10,
      currentBodyFat: 16,
      priority: 'primary',
    },
    performance: {
      targetMetrics: [{
        sport: 'running',
        metricName: 'Half Marathon Time',
        value: 90, // sub 1:30 goal
        unit: 'minutes',
        date: '2025-10-12',
      }],
      priority: 'primary',
    },
  },
  deficitLevel: 'moderate',
  cuttingStrategy: 'training-priority',
};

const enhancedTDEE = 1282; // Your active calories

async function testAIResponse() {
  console.log('🤖 Testing AI response with your profile data...\n');

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.PERPLEXITY.API_KEY}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.PERPLEXITY.DEFAULT_MODEL,
        temperature: API_CONFIG.PERPLEXITY.DEFAULT_TEMPERATURE,
        max_tokens: API_CONFIG.PERPLEXITY.DEFAULT_MAX_TOKENS,
        messages: [
          {
            role: 'system',
            content: 'You are a performance nutrition expert specialized in athletic training and body composition optimization. Provide structured, evidence-based nutrition recommendations.'
          },
          {
            role: 'user',
            content: `NUTRITION EXPERT: Analyze the complete user profile below and determine if their goal is achievable within the specified timeframe. Provide structured recommendations ONLY - no thinking process, no explanations.

ATHLETE PROFILE:
- Male, 33 years, 177cm, 90kg, 16% body fat
- Training: 15h/week (10h strength + 5h running), 10 sessions
- Experience: 2-5 years, intermediate level
- Enhanced TDEE: ${enhancedTDEE} active calories/day

GOAL CONFIGURATION:
- Mode: Cut with performance priority
- Target: Sub 10% body fat by 12.10.2025
- Event: Manchester half marathon (12.10.2025)
- Target Outcome: "${testProfile.performanceGoals[0].targetOutcome}"
- Weekly deficit: ${Math.abs(goalConfig.weeklyDeficitTarget)} calories
- Strategy: Training-priority (maintain performance)

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

### CONSERVATIVE APPROACH: X kcal/day (X% deficit from ${enhancedTDEE} TDEE)
- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
- Training days: +Xg carbs, Rest days: -Xg carbs
- Timeline Assessment: At X kg/week, ~Y weeks needed

### STANDARD APPROACH: X kcal/day (X% deficit from ${enhancedTDEE} TDEE) ★ RECOMMENDED
- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
- Training days: +Xg carbs, Rest days: -Xg carbs
- Timeline Assessment: At X kg/week, ~Y weeks needed

### AGGRESSIVE APPROACH: X kcal/day (X% deficit from ${enhancedTDEE} TDEE)
- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
- Training days: +Xg carbs, Rest days: -Xg carbs
- Timeline Assessment: At X kg/week, ~Y weeks needed

Calculate specific weeks for each approach - they should be DIFFERENT. Conservative should take LONGER (more weeks), Aggressive should be FASTER (fewer weeks). Base calculations on selected TDEE of ${enhancedTDEE} kcal/day.`
          }
        ]
      }),
      signal: AbortSignal.timeout(API_CONFIG.PERPLEXITY.TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'No response received';

    console.log('🎯 AI RESPONSE FOR YOUR PROFILE:');
    console.log('=====================================\n');
    console.log(aiResponse);
    console.log('\n=====================================');
    
    // Parse for feasibility assessment
    const feasibilityKeywords = [
      'possible', 'achievable', 'feasible', 'realistic', 'challenging but doable',
      'not possible', 'unrealistic', 'too aggressive', 'unlikely'
    ];
    
    const responseText = aiResponse.toLowerCase();
    const feasibilityMatches = feasibilityKeywords.filter(keyword => 
      responseText.includes(keyword.toLowerCase())
    );
    
    console.log('\n🎯 FEASIBILITY ASSESSMENT:');
    if (feasibilityMatches.length > 0) {
      console.log('Found feasibility indicators:', feasibilityMatches);
    }
    
    // Look for timeline mentions
    if (responseText.includes('october') || responseText.includes('10.2025') || responseText.includes('12.10')) {
      console.log('✅ AI mentioned your target date (October 12, 2025)');
    }
    
    // Look for performance impact
    if (responseText.includes('performance') || responseText.includes('running')) {
      console.log('✅ AI addressed performance concerns');
    }

    return aiResponse;

  } catch (error) {
    console.error('❌ Error testing AI:', error.message);
    return null;
  }
}

// Run the test
testAIResponse().then(result => {
  if (result) {
    console.log('\n✅ Test completed successfully!');
  } else {
    console.log('\n❌ Test failed!');
  }
});