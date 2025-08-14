import { AthleteProfile } from './AthleteTypes';
import { GoalConfiguration } from './GoalTypes';
import { HealthKitConnectionStatus } from './AppleHealthKitTypes';
import { SamsungHealthConnectionStatus } from './SamsungHealthTypes';

// Navigation parameter types
export type RootStackParamList = {
  Loading: undefined;
  GoalSetup: undefined;
  AthleteOnboarding: undefined;
  WeeklyBanking: undefined;
  DailyLogging: undefined;
  DailyLoggingV2: undefined; // NEW V2 daily logging screen
  FoodLogging: undefined; // NEW - Dedicated food logging screen
  WorkoutLogging: undefined; // NEW - Dedicated workout logging screen
  WeightTracking: undefined; // NEW - Dedicated weight tracking screen
  NutritionRecommendation: {
    athleteProfile: AthleteProfile;
    goalConfiguration: GoalConfiguration;
    selectedTDEE?: number;
    tdeeMethod?: 'standard' | 'enhanced';
  };
  EnhancedTDEEComparison: {
    userStats: {
      age: number;
      gender: 'male' | 'female';
      weight: number; // kg
      height: number; // cm
      activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    };
    goalConfig: GoalConfiguration;
    onAcceptEnhanced: (enhancedTDEE: number) => void;
    onUseStandard: (standardTDEE: number) => void;
  };
  DebugStorage: undefined;
  // Unified Health Device Integration
  HealthDeviceSetup: undefined;
  // Apple HealthKit Integration Screens
  AppleHealthKitSetup: {
    onSetupComplete?: (connectionStatus: HealthKitConnectionStatus) => void;
    onSkip?: () => void;
    initialPermissionGroups?: string[];
  };
  AppleHealthExport: undefined;
  // Samsung Health Integration Screens
  SamsungHealthSetup: {
    onSetupComplete?: (connectionStatus: SamsungHealthConnectionStatus) => void;
    onSkip?: () => void;
  };
  CalorieBankCompare: undefined;
  CalorieBankingSetup: undefined; // NEW - Calorie Banking Setup screen
};
