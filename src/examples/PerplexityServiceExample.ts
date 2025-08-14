/**
 * PerplexityService Usage Example
 * 
 * This file demonstrates how to use the PerplexityService for AI-powered
 * sports nutrition calculations in your athlete onboarding flow.
 */

import { perplexityService, NutritionCalculationRequest, PerplexityService } from '../services/PerplexityService';
import { AthleteProfile } from '../types/AthleteTypes';
import { GoalConfiguration } from '../types/GoalTypes';
import { API_CONFIG, isServiceConfigured, validateAPIConfig } from '../config/apiConfig';

// Example: How to integrate PerplexityService with athlete onboarding
export const calculateAthleteNutrition = async (
  athleteProfile: AthleteProfile,
  goalConfig: GoalConfiguration,
  apiKey?: string
) => {
  try {
    // Initialize service with API key (if not already configured)
    let serviceToUse = perplexityService;
    if (apiKey) {
      serviceToUse = new PerplexityService(apiKey);
    }

    // Check if service is properly configured
    if (!isServiceConfigured('perplexity') && !apiKey) {
      console.warn('⚠️ Perplexity service not configured. Add API key to apiConfig.ts');
    }

    // Prepare nutrition calculation request
    const nutritionRequest: NutritionCalculationRequest = {
      athleteProfile,
      currentGoal: goalConfig,
      preferenceLevel: 'standard', // or 'conservative'/'aggressive' based on user preference
      periodizationPhase: 'base-building', // Could be determined from training plan
      // recentTrainingData: [], // Add if available from workout tracking
      // garminData: {}, // Add if Garmin integration is available
    };

    // Get AI-powered nutrition recommendations
    const nutritionResponse = await serviceToUse.calculateOptimalNutrition(nutritionRequest);

    console.log('🥗 Nutrition Recommendations:', {
      conservative: nutritionResponse.recommendations.conservative,
      standard: nutritionResponse.recommendations.standard,
      aggressive: nutritionResponse.recommendations.aggressive,
    });

    console.log('🏃‍♂️ Sport-Specific Guidance:', nutritionResponse.sportSpecificGuidance);
    console.log('📊 Monitoring Metrics:', nutritionResponse.monitoringMetrics);

    return nutritionResponse;

  } catch (error) {
    console.error('Error calculating nutrition:', error);
    
    // Fallback to basic calculations if API fails
    return perplexityService.calculateOptimalNutrition({
      athleteProfile,
      currentGoal: goalConfig,
      preferenceLevel: 'standard'
    });
  }
};

// Example: Get sport-specific guidance
export const getSportGuidance = async (sport: string, phase: string = 'base-building') => {
  try {
    const guidance = await perplexityService.getSportSpecificGuidance(sport as any, phase);
    console.log(`🎯 ${sport} Guidance for ${phase}:`, guidance);
    return guidance;
  } catch (error) {
    console.error('Error getting sport guidance:', error);
    return 'Focus on balanced nutrition supporting your training goals and recovery needs.';
  }
};

// Example: Validate API connection
export const checkPerplexityConnection = async (apiKey?: string) => {
  try {
    let serviceToUse = perplexityService;
    if (apiKey) {
      serviceToUse = new PerplexityService(apiKey);
    }
    
    const isConnected = await serviceToUse.validateConnection();
    
    if (isConnected) {
      console.log('✅ Perplexity API connection successful');
    } else {
      console.log('❌ Perplexity API connection failed - using fallback calculations');
    }
    
    return isConnected;
  } catch (error) {
    console.error('Connection validation error:', error);
    return false;
  }
};

// Example: Validate API configuration
export const checkAPIConfiguration = () => {
  const validation = validateAPIConfig();
  
  if (validation.isValid) {
    console.log('✅ API configuration is valid');
  } else {
    console.log('❌ API configuration issues:', validation.errors);
  }
  
  // Check individual services
  const perplexityConfigured = isServiceConfigured('perplexity');
  const garminConfigured = isServiceConfigured('garmin');
  
  console.log('🔧 Service Configuration Status:');
  console.log(`  Perplexity: ${perplexityConfigured ? '✅' : '❌'}`);
  console.log(`  Garmin: ${garminConfigured ? '✅' : '❌'}`);
  
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    services: {
      perplexity: perplexityConfigured,
      garmin: garminConfigured
    }
  };
};

// Example integration with AthleteOnboardingScreen
export const integrateWithOnboarding = async (athleteProfile: AthleteProfile, goalConfig: GoalConfiguration) => {
  console.log('🚀 Starting AI-powered nutrition calculation...');
  
  // 1. Calculate optimal nutrition
  const nutrition = await calculateAthleteNutrition(athleteProfile, goalConfig);
  
  // 2. Get sport-specific guidance
  const guidance = await getSportGuidance(athleteProfile.trainingProfile.primarySport);
  
  // 3. Combine with existing goal configuration
  const enhancedGoalConfig = {
    ...goalConfig,
    aiNutritionRecommendations: nutrition,
    sportSpecificGuidance: guidance,
    lastCalculated: new Date().toISOString(),
  };
  
  console.log('✨ Enhanced goal configuration with AI nutrition:', enhancedGoalConfig);
  
  return enhancedGoalConfig;
};

// Usage in your components:
/*

// In AthleteOnboardingScreen.tsx or similar:
import { integrateWithOnboarding, checkAPIConfiguration } from '../examples/PerplexityServiceExample';

const handleComplete = async () => {
  const athleteProfile = createAthleteProfile(); // your existing logic
  
  // Check API configuration first
  const configStatus = checkAPIConfiguration();
  
  // Get AI-powered nutrition recommendations
  const enhancedConfig = await integrateWithOnboarding(athleteProfile, goalConfig);
  
  // Save the enhanced configuration
  setGoalConfiguration(enhancedConfig);
  setAthleteProfile(athleteProfile);
  
  // Continue with navigation
  onComplete(athleteProfile);
};

// To configure API keys (in App.tsx or config):
import { API_CONFIG } from '../config/apiConfig';

const initializeAI = () => {
  // Method 1: Set API key in apiConfig.ts (recommended)
  // Edit src/config/apiConfig.ts and update PERPLEXITY_CONFIG.API_KEY
  
  // Method 2: Initialize with API key programmatically
  const API_KEY = 'your-perplexity-api-key'; // Store securely
  const aiService = new PerplexityService(API_KEY);
  
  // Test connection
  aiService.validateConnection().then(connected => {
    if (connected) {
      console.log('🤖 AI nutrition service ready');
    } else {
      console.log('📊 Using standard nutrition calculations');
    }
  });
};

// Environment variable setup (if using react-native-config):
// 1. Install: npm install react-native-config
// 2. Create .env file with: PERPLEXITY_API_KEY=your-key-here
// 3. Update apiConfig.ts getEnvVar function to use Config.PERPLEXITY_API_KEY

*/
