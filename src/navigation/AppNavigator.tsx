import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useCalorieStore } from '../stores/calorieStore';
import { useTheme } from '../contexts/ThemeContext';
import { AthleteProfile } from '../types/AthleteTypes';
import { GoalConfiguration } from '../types/GoalTypes';
import { RootStackParamList } from '../types/NavigationTypes';
import GoalSetupScreen from '../screens/GoalSetupScreen';
import AthleteOnboardingScreen from '../screens/AthleteOnboardingScreen';
import WeeklyBankingScreen from '../screens/WeeklyBankingScreen';
import NutritionRecommendationScreen from '../screens/NutritionRecommendationScreen';
import TestNutritionScreen from '../screens/TestNutritionScreen';
import DebugStorageScreen from '../screens/DebugStorageScreen';
import DailyLoggingScreen from '../screens/DailyLoggingScreen';
import FoodLoggingScreen from '../screens/FoodLoggingScreen';
import WorkoutLoggingScreen from '../screens/WorkoutLoggingScreen';
import WeightTrackingScreen from '../screens/WeightTrackingScreen';
import EnhancedTDEEComparisonScreen from '../screens/EnhancedTDEEComparisonScreen';
// Replace relative import with path alias to ensure TS resolves correctly
import CalorieBankCompareScreen from '@screens/CalorieBankCompareScreen';
import CalorieBankingSetupScreen from '../screens/CalorieBankingSetupScreen';
// Unified Health Device Integration
import HealthDeviceSetupScreen from '../screens/HealthDeviceSetupScreen';
// Apple HealthKit Integration Screens
import { AppleHealthKitSetupScreen } from '../screens/AppleHealthKitSetupScreen';
import { AppleHealthExportScreen } from '../screens/AppleHealthExportScreen';
// Samsung Health Integration Screens
import { SamsungHealthEnhancedSetupScreen } from '../screens/SamsungHealthEnhancedSetupScreen';
import { healthDeviceManager } from '../services/HealthDeviceManager';
import { startOfWeek, differenceInDays, format } from 'date-fns';

// Re-export for backwards compatibility
export type { RootStackParamList } from '../types/NavigationTypes';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Wrapper component for AppleHealthKitSetupScreen with navigation
const AppleHealthKitSetupWrapper: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleSetupComplete = (connectionStatus: any) => {
    console.log('🍎 [AppNavigator] Apple HealthKit setup completed:', connectionStatus);
    navigation.goBack();
  };

  const handleSkip = () => {
    console.log('⏭️ [AppNavigator] Apple HealthKit setup skipped');
    navigation.goBack();
  };

  return (
    <AppleHealthKitSetupScreen
      onSetupComplete={handleSetupComplete}
      onSkip={handleSkip}
    />
  );
};

// Garmin wrapper components removed - will be replaced with proxy-based solution

// Wrapper component for SamsungHealthSetupScreen with navigation
const SamsungHealthSetupWrapper: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleSetupComplete = (connectionStatus: any) => {
    console.log('📱 [AppNavigator] Samsung Health setup completed:', connectionStatus);
    navigation.goBack();
  };

  const handleSkip = () => {
    console.log('⏭️ [AppNavigator] Samsung Health setup skipped');
    navigation.goBack();
  };

  return (
    <SamsungHealthEnhancedSetupScreen
      navigation={navigation}
      onSetupComplete={handleSetupComplete}
      onSkip={handleSkip}
    />
  );
};

// Wrapper component for AthleteOnboardingScreen with navigation
// Helper function to calculate days remaining in current week (Monday-based)
const calculateDaysRemainingInWeek = (): { daysRemaining: number, weekStartDate: string } => {
  const today = new Date();
  const mondayOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday
  const daysRemaining = 7 - differenceInDays(today, mondayOfThisWeek);
  const weekStartDate = format(mondayOfThisWeek, 'yyyy-MM-dd');
  
  console.log(`📅 [AppNavigator] Today: ${format(today, 'yyyy-MM-dd')}, Week starts: ${weekStartDate}, Days remaining: ${daysRemaining}`);
  
  return { daysRemaining, weekStartDate };
};

// Helper function to create a full week goal (for new weeks starting Monday)
const createFullWeekGoal = (dailyBaseline: number, goalConfig: GoalConfiguration, setWeeklyGoal: any, context: string): void => {
  const today = new Date();
  const mondayOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartDate = format(mondayOfThisWeek, 'yyyy-MM-dd');
  const fullWeekAllowance = dailyBaseline * 7;

  const weeklyGoal = {
    weekStartDate,
    totalTarget: fullWeekAllowance, // Full week allocation
    dailyBaseline,
    deficitTarget: 0,
    goalConfig,
    weeklyAllowance: fullWeekAllowance,
    currentWeekAllowance: fullWeekAllowance, // Full week since it's Monday reset
  };

  setWeeklyGoal(weeklyGoal);
  console.log(`🎯 [AppNavigator] ${context}: Created full week goal: ${fullWeekAllowance} calories for 7 days (${dailyBaseline} cal/day)`);
};

// Helper function to create a weekly goal with partial week calculation
const createPartialWeekGoal = (dailyBaseline: number, goalConfig: GoalConfiguration, setWeeklyGoal: any, context: string): void => {
  const { daysRemaining, weekStartDate } = calculateDaysRemainingInWeek();
  const partialWeekAllowance = dailyBaseline * daysRemaining;
  const fullWeekAllowance = dailyBaseline * 7;

  const weeklyGoal = {
    weekStartDate,
    totalTarget: partialWeekAllowance,
    dailyBaseline,
    deficitTarget: 0,
    goalConfig,
    weeklyAllowance: fullWeekAllowance,
    currentWeekAllowance: partialWeekAllowance, // Partial week allowance for initial setup
  };

  setWeeklyGoal(weeklyGoal);
  console.log(`🎯 [AppNavigator] ${context}: Created partial week goal: ${partialWeekAllowance} calories for ${daysRemaining} days (${dailyBaseline} cal/day)`);
};

const AthleteOnboardingWrapper: React.FC = () => {
  const navigation = useNavigation<any>();
  const { setGoalConfiguration, goalConfiguration, setWeeklyGoal } = useCalorieStore();

  // Helper function to create weekly goal after TDEE selection
  const createWeeklyGoalWithTDEE = (dailyBaseline: number, goalConfig: GoalConfiguration, method: 'enhanced' | 'standard') => {
    createPartialWeekGoal(dailyBaseline, goalConfig, setWeeklyGoal, `TDEE ${method} method`);
    console.log('🏦 [AppNavigator] Navigating to WeeklyBanking with new goal');
    
    // Navigate to weekly banking to start tracking
    navigation.navigate('WeeklyBanking');
  };

  const handleAthleteOnboardingComplete = (athleteProfile: AthleteProfile) => {
    console.log('🏃 [AppNavigator] Athlete onboarding completed with profile:', athleteProfile);
    
    // Update the goal configuration with athlete config
    if (goalConfiguration) {
      console.log('🎯 [AppNavigator] Existing goal configuration found:', goalConfiguration);
      
      const updatedGoalConfig = {
        ...goalConfiguration,
        athleteConfig: {
          profile: athleteProfile,
          // You can add more athlete configuration here
          // For now, we'll use minimal config
          nutritionRecommendation: {
            approach: 'standard' as const,
            dailyCalories: 2000, // This should be calculated based on profile
            macros: {
              protein: { grams: 150, percentage: 30, gramsPerKg: 2 },
              carbohydrates: { grams: 200, percentage: 40, gramsPerKg: 2.5 },
              fat: { grams: 67, percentage: 30, gramsPerKg: 0.8 },
              fiber: 25,
            },
            hydration: {
              dailyWaterLiters: 2.5,
              preWorkoutMl: 300,
              duringWorkoutMlPerHour: 500,
              postWorkoutMl: 500,
            },
            timing: {
              preWorkoutWindow: '30-60 minutes',
              postWorkoutWindow: 'within 30 minutes',
              mealFrequency: 4,
            },
            notes: ['Automatically generated recommendations'],
          },
          trainingPlan: {
            id: Date.now().toString(),
            name: 'Default Training Plan',
            phase: 'base' as const,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            weeklyStructure: {},
            totalWeeklyHours: athleteProfile.trainingProfile.weeklyTrainingHours,
            primarySport: athleteProfile.trainingProfile.primarySport,
            secondarySports: athleteProfile.trainingProfile.secondarySports,
            restDays: ['sunday'],
          },
          currentPhase: 'base' as const,
          seasonGoals: {
            primary: athleteProfile.performanceGoals[0]?.targetOutcome || 'General fitness improvement',
          },
          adaptations: {
            autoAdjustCalories: true,
            autoAdjustMacros: true,
            autoAdjustTraining: false,
            recoveryThreshold: 7,
            performanceThreshold: 8,
          },
        },
      };
      
      console.log('💾 [AppNavigator] Saving updated goal configuration:', updatedGoalConfig);
      setGoalConfiguration(updatedGoalConfig);
      
      // ALWAYS navigate to TDEE comparison - Enhanced options will be available based on device connectivity
      console.log('🎯 [AppNavigator] Navigating to TDEE comparison (enhanced options based on device connectivity)');
      
      // Convert athleteProfile to userStats for the TDEE screen
      const userStats = {
        age: athleteProfile.physicalStats.age,
        gender: athleteProfile.physicalStats.gender,
        weight: athleteProfile.physicalStats.weight,
        height: athleteProfile.physicalStats.height,
        activityLevel: 'moderate' as const, // Default fallback
      };
      
      // Navigate to TDEE comparison - Enhanced TDEE will show if device connected
      navigation.navigate('EnhancedTDEEComparison', {
        athleteProfile,
        userStats,
        goalConfig: updatedGoalConfig,
        onAcceptEnhanced: (selectedTDEE: number) => {
          console.log('✅ [AppNavigator] User selected TDEE:', selectedTDEE);
          const finalGoalConfig = { ...updatedGoalConfig, enhancedTDEE: selectedTDEE };
          setGoalConfiguration(finalGoalConfig);
          
          // Navigate to nutrition recommendations 
          console.log('🍎 [AppNavigator] Navigating to nutrition recommendations with selected TDEE');
          navigation.navigate('NutritionRecommendation', {
            athleteProfile,
            goalConfiguration: finalGoalConfig,
            selectedTDEE,
            tdeeMethod: 'enhanced'
          });
        },
        onUseStandard: (standardTDEE: number) => {
          console.log('📊 [AppNavigator] User chose standard TDEE:', standardTDEE);
          const standardGoalConfig = { ...updatedGoalConfig, standardTDEE };
          setGoalConfiguration(standardGoalConfig);
          
          // Navigate to nutrition recommendations 
          console.log('🍎 [AppNavigator] Navigating to nutrition recommendations with standard TDEE');
          navigation.navigate('NutritionRecommendation', {
            athleteProfile,
            goalConfiguration: standardGoalConfig,
            selectedTDEE: standardTDEE,
            tdeeMethod: 'standard'
          });
        },
      });
    } else {
      console.log('⚠️ [AppNavigator] No goal configuration found, navigating to WeeklyBanking');
      // Fallback if no goal configuration exists
      navigation.navigate('WeeklyBanking');
    }
  };

  const handleAthleteOnboardingSkip = () => {
    console.log('⏭️ [AppNavigator] Athlete onboarding skipped, navigating to WeeklyBanking');
    // Skip directly to banking if user doesn't want athlete setup
    navigation.navigate('WeeklyBanking');
  };

  return (
    <AthleteOnboardingScreen
      onComplete={handleAthleteOnboardingComplete}
      onSkip={handleAthleteOnboardingSkip}
    />
  );
};

const AppNavigator: React.FC = () => {
  // Only subscribe to essential props to prevent excessive re-renders
  const { goalConfiguration, debugStore, _hasHydrated, isFullyReady, currentWeekGoal, setWeeklyGoal, resetGoal } = useCalorieStore(
    (state) => ({
      goalConfiguration: state.goalConfiguration,
      debugStore: state.debugStore,
      _hasHydrated: state._hasHydrated,
      isFullyReady: state.isFullyReady,
      currentWeekGoal: state.currentWeekGoal,
      setWeeklyGoal: state.setWeeklyGoal,
      resetGoal: state.resetGoal,
    })
  );
  const { theme, isDark } = useTheme();
  
  // // Force hydration after timeout to prevent infinite loading
  // const [forceHydrated, setForceHydrated] = useState(false);
  
  // // useEffect(() => {
  // //   const timeout = setTimeout(() => {
  // //     if (!_hasHydrated) {
  // //       console.log('🚨 [AppNavigator] Hydration timeout - forcing hydration complete');
  // //       setForceHydrated(true);
  // //     }
  // //   }, 5000); // 5 second timeout
    
  //   return () => clearTimeout(timeout);
  // }, [_hasHydrated]);

  // Helper function to create missing weekly goal for complete goal configurations
  const createMissingWeeklyGoal = (config: GoalConfiguration) => {
    console.log('🔧 [AppNavigator] Creating missing weekly goal for complete configuration');
    
    // For performance users with enhanced/standard TDEE stored
    if (config.performanceMode) {
      const storedTDEE = (config as any).enhancedTDEE || (config as any).standardTDEE;
      if (storedTDEE) {
        console.log('🔧 [AppNavigator] Using stored TDEE:', storedTDEE);
        createPartialWeekGoal(storedTDEE, config, setWeeklyGoal, 'Stored TDEE');
        return;
      }
      
      // No stored TDEE, use athletic estimate
      console.log('🔧 [AppNavigator] No stored TDEE, using athletic estimate');
      const athleticTDEE = 2500; // Use athletic estimate fallback
      createPartialWeekGoal(athleticTDEE, config, setWeeklyGoal, 'Athletic TDEE estimate');
      return;
    }
    
    // For basic users, don't create temporary goal - they should go through nutrition recommendations first
    console.log('🔧 [AppNavigator] Skipping temporary goal creation for basic user - will be created after AI nutrition recommendations');
    // Don't create a goal here - let the nutrition recommendation process handle it
  };

  // Wait for Zustand to rehydrate before determining initial route
  useEffect(() => {
    console.log('🔄 [AppNavigator] Component mounted');
    console.log('📊 [AppNavigator] Current goalConfiguration:', !!goalConfiguration);
    console.log('💧 [AppNavigator] Hydration status:', _hasHydrated);
    debugStore(); // Debug the current store state
  }, []);

  useEffect(() => {
    console.log('📊 [AppNavigator] goalConfiguration changed:', !!goalConfiguration);
    console.log('💧 [AppNavigator] Hydration status changed:', _hasHydrated);
  }, [goalConfiguration, _hasHydrated]);

  // Auto-create missing weekly goal after hydration completes
  useEffect(() => {
    if (!_hasHydrated) return; // Wait for hydration
    
    if (goalConfiguration && isGoalConfigurationComplete(goalConfiguration) && !currentWeekGoal) {
      console.log('🔧 [AppNavigator] Auto-creating missing weekly goal after hydration');
      createMissingWeeklyGoal(goalConfiguration);
    }
  }, [_hasHydrated, goalConfiguration, currentWeekGoal]);

  // Helper function to check if goal configuration is complete
  const isGoalConfigurationComplete = (config: GoalConfiguration | null): boolean => {
    if (!config) return false;
    
    // Must have basic fields
    if (!config.mode || !config.startDate) {
      console.log('🛣️ [AppNavigator] Incomplete goal: missing mode or startDate');
      return false;
    }
    
    // For performance mode users, target goals are stored in athleteConfig.profile
    if (config.performanceMode) {
      if (!config.athleteConfig) {
        console.log('🛣️ [AppNavigator] Incomplete goal: performance mode without athlete config');
        return false;
      }
      
      if (!config.athleteConfig.profile) {
        console.log('🛣️ [AppNavigator] Incomplete goal: athlete config without profile');
        return false;
      }
      
      console.log('🛣️ [AppNavigator] Performance mode goal configuration is complete');
      return true;
    }
    
    // For basic users, target goals must be defined in root targetGoals object
    const hasTargetGoals = config.targetGoals && Object.keys(config.targetGoals).length > 0;
    if (!hasTargetGoals) {
      console.log('🛣️ [AppNavigator] Incomplete goal: basic user missing target goals');
      return false;
    }
    
    console.log('🛣️ [AppNavigator] Basic user goal configuration is complete');
    return true;
  };

  // Determine initial route based on goal configuration
  // This function is only called AFTER hydration is complete
  const getInitialRoute = (): keyof RootStackParamList => {
    console.log('🛣️ [AppNavigator] Determining initial route after hydration...');
    console.log('🛣️ [AppNavigator] Hydration status:', _hasHydrated);
    console.log('🛣️ [AppNavigator] GoalConfiguration exists:', !!goalConfiguration);
    console.log('🛣️ [AppNavigator] GoalConfiguration mode:', goalConfiguration?.mode);
    console.log('🛣️ [AppNavigator] GoalConfiguration performanceMode:', goalConfiguration?.performanceMode);
    console.log('🛣️ [AppNavigator] GoalConfiguration has athleteConfig:', !!goalConfiguration?.athleteConfig);
    console.log('🛣️ [AppNavigator] CurrentWeekGoal exists:', !!currentWeekGoal);
    
    // CRITICAL: Users must have a COMPLETE goal configuration to use the app
    if (!isGoalConfigurationComplete(goalConfiguration)) {
      console.log('🛣️ [AppNavigator] ❌ INCOMPLETE GOAL CONFIGURATION - User must complete setup from beginning');
      return 'GoalSetup';
    }
    
    console.log('🛣️ [AppNavigator] ✅ Complete goal configuration found:', goalConfiguration?.mode);
    
    // If athlete config exists but no nutrition recommendation saved yet, go to nutrition screen
    if (goalConfiguration && goalConfiguration.athleteConfig && goalConfiguration.athleteConfig.nutritionRecommendation && !goalConfiguration.athleteConfig.nutritionRecommendation.approach) {
      console.log('🛣️ [AppNavigator] Athlete config exists but no nutrition approach selected, going to NutritionRecommendation');
      // We need to pass the required params, but we'll handle this in the wrapper
      return 'WeeklyBanking'; // Fallback to banking for now
    }
    
    console.log('🛣️ [AppNavigator] ✅ Going to WeeklyBanking with complete goal');
    return 'WeeklyBanking';
  };

  // Helper function to check if app is fully ready
  const isAppReady = (): boolean => {
    // Use our custom flag that only gets set when rehydration callback actually completes
    if (!isFullyReady) {
      console.log('🔍 [AppNavigator] Waiting for rehydration to fully complete...', {
        isFullyReady,
        _hasHydrated, // For comparison
      });
      return false;
    }
    
    // Get fresh state - we know rehydration callback has completed
    const store = useCalorieStore.getState();
    const { currentWeekGoal, goalConfiguration } = store;
    
    // Handle corrupted data case
    const isGoalConfigCorrupted = typeof goalConfiguration === 'boolean' && (goalConfiguration as any) === false;
    if (isGoalConfigCorrupted) {
      console.log('🔍 [AppNavigator] Corrupted goalConfiguration detected, allowing through to recovery screen');
      return true;
    }
    
    // Check for valid data
    const isGoalConfigValid = goalConfiguration !== null && goalConfiguration !== undefined && typeof goalConfiguration === 'object';
    const hasEssentialData = !!(currentWeekGoal && isGoalConfigValid);
    
    console.log('🔍 [AppNavigator] App readiness check (rehydration fully complete):', {
      isFullyReady,
      _hasHydrated,
      hasCurrentWeekGoal: !!currentWeekGoal,
      hasGoalConfiguration: !!goalConfiguration,
      goalConfigType: typeof goalConfiguration,
      isReady: hasEssentialData
    });
    
    return hasEssentialData;
  };

  // App.tsx now handles the loading screen, so AppNavigator only renders when ready
  console.log('✅ [AppNavigator] Rendering - app is fully ready');

  // TEMPORARY FIX: Handle corrupted goalConfiguration
  if ((goalConfiguration as any) === false) {
    console.log('🚨 [AppNavigator] Detected corrupted goalConfiguration (false), showing recovery options');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.error, marginBottom: 20 }}>⚠️</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 10, textAlign: 'center' }}>
          Goal Configuration Corrupted
        </Text>
        <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 30, textAlign: 'center', lineHeight: 20 }}>
          Your goal configuration appears to be corrupted. This can be fixed by resetting it, which will allow you to go through the setup process again.
        </Text>
        
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 12
          }}
          onPress={() => {
            console.log('🔧 [AppNavigator] User requested goal configuration reset');
            resetGoal();
            console.log('✅ [AppNavigator] Goal configuration reset completed');
          }}
        >
          <Text style={{ color: theme.colors.buttonText, fontSize: 16, fontWeight: '600' }}>
            Fix Goal Configuration
          </Text>
        </TouchableOpacity>
        
        <Text style={{ fontSize: 12, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 10 }}>
          This will reset your goal configuration and allow you to set it up again.
        </Text>
      </View>
    );
  }

  console.log('✅ [AppNavigator] Hydration complete - rendering navigator with correct initial route');

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.buttonText,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen 
          name="GoalSetup" 
          component={GoalSetupScreen}
          options={{ 
            headerShown: false, // Remove header bar completely
          }}
        />
        <Stack.Screen 
          name="AthleteOnboarding" 
          component={AthleteOnboardingWrapper}
          options={{ 
            title: 'Athlete Setup',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.buttonText,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="NutritionRecommendation" 
          component={NutritionRecommendationScreen}
          options={{ 
            title: 'Nutrition Recommendations',
            headerShown: false, // Using custom header in the screen
            presentation: 'card',
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="WeeklyBanking" 
          component={WeeklyBankingScreen}
          options={{ 
            title: 'Weekly Calorie Bank',
            headerLeft: () => null, // Prevent back navigation to nutrition recommendations
          }}
        />
        <Stack.Screen 
          name="DebugStorage" 
          component={DebugStorageScreen}
          options={{ 
            title: 'Debug Storage',
            headerStyle: {
              backgroundColor: theme.colors.error,
            },
            headerTintColor: theme.colors.buttonText,
          }}
        />
        <Stack.Screen 
          name="DailyLogging" 
          component={DailyLoggingScreen}
          options={{ 
            title: 'Daily Logging',
            headerShown: false, // Using custom header in the screen
          }}
        />
        <Stack.Screen 
          name="EnhancedTDEEComparison" 
          component={EnhancedTDEEComparisonScreen}
          options={{ 
            title: 'Enhanced TDEE Comparison',
            headerShown: false, // Using custom header in the screen
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="CalorieBankCompare" component={CalorieBankCompareScreen} options={{ title: 'Calorie Bank Compare' }} />
        <Stack.Screen 
          name="CalorieBankingSetup" 
          component={CalorieBankingSetupScreen} 
          options={{ 
            title: 'Bank Calories',
            headerShown: true,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        {/* Health Integration Screens */}
        <Stack.Screen
          name="AppleHealthKitSetup"
          component={AppleHealthKitSetupWrapper}
          options={{
            title: 'Apple HealthKit Setup',
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.colors.success,
            },
            headerTintColor: theme.colors.buttonText,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="AppleHealthExport"
          component={AppleHealthExportScreen}
          options={{
            title: 'Health Data Export',
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="SamsungHealthSetup"
          component={SamsungHealthSetupWrapper}
          options={{
            title: 'Samsung Health Setup',
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.colors.info,
            },
            headerTintColor: theme.colors.buttonText,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        {/* Unified Health Device Integration */}
        <Stack.Screen
          name="HealthDeviceSetup"
          component={HealthDeviceSetupScreen}
          options={{
            title: 'Connect Health Devices',
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.colors.success,
            },
            headerTintColor: theme.colors.buttonText,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen 
          name="DailyLoggingV2" 
          component={require('../screens/DailyLoggingScreenV2').default}
          options={{ 
            title: 'Daily Logging V2',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="FoodLogging" 
          component={FoodLoggingScreen}
          options={{ 
            title: 'Food Logging',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="WorkoutLogging" 
          component={WorkoutLoggingScreen}
          options={{ 
            title: 'Workout Logging',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="WeightTracking" 
          component={WeightTrackingScreen}
          options={{ 
            title: 'Weight Tracking',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;