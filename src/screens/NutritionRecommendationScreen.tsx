import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCalorieStore } from '../stores/calorieStore';
import { perplexityService, NutritionCalculationRequest, OptimalNutritionResponse } from '../services/PerplexityService';
import { appleHealthAIContextService } from '../services/AppleHealthAIContextService';
import { AthleteProfile } from '../types/AthleteTypes';
import { GoalConfiguration } from '../types/GoalTypes';
import { RecommendationLevel } from '../types/ApiTypes';
import { RootStackParamList } from '../types/NavigationTypes';
import { useTheme, Theme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

type NutritionRecommendationScreenRouteProp = RouteProp<RootStackParamList, 'NutritionRecommendation'>;
type NutritionRecommendationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NutritionRecommendation'>;

interface RouteParams {
  athleteProfile?: AthleteProfile;
  goalConfiguration?: GoalConfiguration;
  selectedTDEE?: number;
  tdeeMethod?: string;
}

const NutritionRecommendationScreen: React.FC = () => {
  const route = useRoute<NutritionRecommendationScreenRouteProp>();
  const navigation = useNavigation<NutritionRecommendationScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const { 
    setGoalConfiguration, 
    setWeeklyGoal, 
    getUserMetabolismProfile,
    getPersonalizedCalorieRecommendation,
    getAverageCalorieBurn,
    getAverageCalorieIntake,
    getCalorieAccuracy
  } = useCalorieStore();

  // Create styles with theme (must be early for early returns)
  const styles = createStyles(theme);

  // Route params with defensive checks
  const routeParams = route.params || {};
  console.log('[NutritionRecommendation] Raw route.params:', route.params);
  console.log('[NutritionRecommendation] Defensive routeParams:', routeParams);
  
  const { athleteProfile, goalConfiguration, selectedTDEE, tdeeMethod } = routeParams as {
    athleteProfile?: AthleteProfile;
    goalConfiguration?: GoalConfiguration;
    selectedTDEE?: number;
    tdeeMethod?: string;
  };
  
  // Add safety check and logging
  console.log('[NutritionRecommendation] Raw route params:', route.params);
  console.log('[NutritionRecommendation] Destructured params:', {
    hasAthleteProfile: !!athleteProfile,
    hasGoalConfiguration: !!goalConfiguration,
    goalConfigurationValue: goalConfiguration,
    goalMode: goalConfiguration?.mode,
    selectedTDEE,
    tdeeMethod
  });

  // Early return if required params are missing
  if (!goalConfiguration || !athleteProfile) {
    console.error('[NutritionRecommendation] Missing required params:', {
      hasGoalConfiguration: !!goalConfiguration,
      hasAthleteProfile: !!athleteProfile
    });
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            Missing required configuration. Please go back and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nutritionResponse, setNutritionResponse] = useState<OptimalNutritionResponse | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<RecommendationLevel>('standard');
  const [customizing, setCustomizing] = useState(false);

  // Load nutrition recommendations with historical data on mount
  useEffect(() => {
    if (goalConfiguration && athleteProfile) {
      loadNutritionRecommendationsWithHistoricalData();
    }
  }, [goalConfiguration, athleteProfile]);

  const loadNutritionRecommendationsWithHistoricalData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Additional safety check inside the function
      if (!goalConfiguration || !athleteProfile) {
        console.error('[NutritionRecommendation] Missing required data in loadNutritionRecommendationsWithHistoricalData:', {
          hasGoalConfiguration: !!goalConfiguration,
          hasAthleteProfile: !!athleteProfile
        });
        setError('Required configuration is missing. Please go back and try again.');
        setLoading(false);
        return;
      }

      console.log('[NutritionRecommendation] Loading nutrition with goal mode:', goalConfiguration.mode);
      
      // Add detailed athlete profile logging to check body fat percentage
      console.log('[NutritionRecommendation] Athlete profile details:', {
        physicalStats: athleteProfile.physicalStats,
        weight: athleteProfile.physicalStats?.weight,
        height: athleteProfile.physicalStats?.height,
        age: athleteProfile.physicalStats?.age,
        gender: athleteProfile.physicalStats?.gender,
        bodyFatPercentage: athleteProfile.physicalStats?.bodyFatPercentage,
        hasBodyFat: !!athleteProfile.physicalStats?.bodyFatPercentage
      });

      // Get historical data analysis
      const metabolismProfile = getUserMetabolismProfile();
      const personalizedRecommendation = getPersonalizedCalorieRecommendation(
        goalConfiguration.mode === 'cut' ? 'weight_loss' : 
        goalConfiguration.mode === 'bulk' ? 'weight_gain' : 'maintenance',
        Math.abs(goalConfiguration.weeklyDeficitTarget || 0) / 7700 || 0 // Convert kcal to kg per week
      );
      const avgBurn = getAverageCalorieBurn();
      const avgIntake = getAverageCalorieIntake();
      const accuracy = getCalorieAccuracy();

      // Get Apple Health enhanced context for AI recommendations
      console.log('[AI] Loading Apple Health context for enhanced recommendations...');
      const appleHealthContext = await appleHealthAIContextService.generateEnhancedContext();
      
      if (appleHealthContext) {
        console.log('[AI] Apple Health context loaded:', {
          recentWorkouts: appleHealthContext.recentWorkouts.length,
          sleepTrend: appleHealthContext.sleepTrends.recentTrend,
          recovery: appleHealthContext.recoveryMetrics.overallRecoveryStatus,
          todaySteps: appleHealthContext.todaysActivity.stepsSoFar,
          activityRings: appleHealthContext.activityRingCompletion
        });
      } else {
        console.log('[AI] Apple Health context not available (may be Android or not connected)');
      }

      // Enhanced request with historical data and Apple Health context
      const request: NutritionCalculationRequest = {
        athleteProfile,
        currentGoal: goalConfiguration,
        preferenceLevel: 'standard',
        periodizationPhase: 'base-building',
        // Add Apple Health context for iOS users
        appleHealthContext: appleHealthContext || undefined,
        // Add the selected TDEE and method from user's choice
        selectedTDEE,
        tdeeMethod: tdeeMethod as 'standard' | 'enhanced' | 'athlete-profile' | 'estimated',
        // Add historical insights
        historicalData: {
          averageDailyBurn: avgBurn,
          averageDailyIntake: avgIntake,
          trackingAccuracy: accuracy,
          metabolismProfile: metabolismProfile || undefined,
          personalizedCalories: personalizedRecommendation?.recommendedDailyTarget,
          confidenceLevel: personalizedRecommendation?.confidenceLevel,
          adjustmentFromStandard: personalizedRecommendation?.adjustmentFromStandard,
          reasoningFactors: personalizedRecommendation?.reasoningFactors
        }
      };

      console.log('[AI] Enhanced request with historical data:', {
        hasMetabolismProfile: !!metabolismProfile,
        avgBurn,
        avgIntake,
        accuracy,
        personalizedCalories: personalizedRecommendation?.recommendedDailyTarget,
        confidence: personalizedRecommendation?.confidenceLevel,
        athleteBodyFat: athleteProfile.physicalStats?.bodyFatPercentage,
        athleteWeight: athleteProfile.physicalStats?.weight,
        athleteAge: athleteProfile.physicalStats?.age
      });

      const response = await perplexityService.calculateOptimalNutrition(request);
      setNutritionResponse(response);

    } catch (err) {
      console.error('Error loading nutrition recommendations:', err);
      setError('Failed to load nutrition recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback to standard recommendations without historical data
  const loadNutritionRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Safety check
      if (!goalConfiguration || !athleteProfile) {
        console.error('[NutritionRecommendation] Missing required data in loadNutritionRecommendations:', {
          hasGoalConfiguration: !!goalConfiguration,
          hasAthleteProfile: !!athleteProfile
        });
        setError('Required configuration is missing. Please go back and try again.');
        setLoading(false);
        return;
      }

      const request: NutritionCalculationRequest = {
        athleteProfile,
        currentGoal: goalConfiguration,
        preferenceLevel: 'standard',
        periodizationPhase: 'base-building',
        // Add the selected TDEE and method from user's choice
        selectedTDEE,
        tdeeMethod: tdeeMethod as 'standard' | 'enhanced' | 'athlete-profile' | 'estimated',
      };

      const response = await perplexityService.calculateOptimalNutrition(request);
      setNutritionResponse(response);

    } catch (err) {
      console.error('Error loading nutrition recommendations:', err);
      setError('Failed to load nutrition recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecommendation = () => {
    if (!nutritionResponse) return;

    const selectedRecommendation = nutritionResponse.recommendations[selectedLevel];

    Alert.alert(
      'Save Nutrition Plan',
      `Save the ${selectedLevel} nutrition recommendation as your goal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            // Calculate baseline exercise calories from TDEE
            const bmr = perplexityService.calculateBMR(athleteProfile!.physicalStats);
            const baselineExerciseCalories = selectedTDEE ? selectedTDEE - bmr : 0;

            // Update goal configuration with nutrition data and baseline
            const enhancedGoalConfig = {
              ...goalConfiguration,
              nutritionRecommendation: selectedRecommendation,
              selectedLevel,
              lastCalculated: new Date().toISOString(),
              enhancedDataUsed: {
                deviceType: 'garmin' as const, // Will be set properly when device integration is fully implemented
                confidenceScore: tdeeMethod === 'enhanced' ? 85 : 60,
                dataQuality: tdeeMethod === 'enhanced' ? 80 : 50,
                daysCovered: tdeeMethod === 'enhanced' ? 30 : 0,
                enhancedTDEE: selectedTDEE || selectedRecommendation.dailyCalories,
                standardTDEE: selectedTDEE || selectedRecommendation.dailyCalories,
                baselineExerciseCalories: Math.round(baselineExerciseCalories),
                usedAt: new Date().toISOString(),
              },
            };

            // Create weekly goal from recommendation using AI's suggested daily calories
            const dailyCalories = selectedRecommendation.dailyCalories;
            // Calculate correct weekly target for remaining days (don't use AI's full week target)
            const today = new Date();
            const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const mondayBasedDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Convert to Monday = 0 system
            const daysRemaining = 7 - mondayBasedDay; // Days remaining including today
            const weeklyTargetForRemainingDays = dailyCalories * daysRemaining;
            
            // Check if user has existing data this week for intelligent messaging
            const { getCurrentWeekProgress } = useCalorieStore.getState();
            const existingProgress = getCurrentWeekProgress();
            const hasExistingData = existingProgress && (existingProgress.totalConsumed > 0 || existingProgress.totalBurned > 0);
            
            console.log('[NutritionRecommendation] Creating weekly goal with:', {
              selectedTDEE: selectedTDEE,
              aiRecommendedCalories: selectedRecommendation.dailyCalories,
              aiFullWeekTarget: selectedRecommendation.weeklyCalorieTarget,
              calculatedWeeklyTarget: weeklyTargetForRemainingDays,
              dailyCalories,
              daysRemaining,
              selectedLevel,
              approach: `${selectedLevel} approach`,
              hasExistingData,
              existingConsumed: existingProgress?.totalConsumed || 0,
              existingBurned: existingProgress?.totalBurned || 0
            });
            
            const weeklyGoal = {
              weekStartDate: new Date().toISOString().split('T')[0],
              totalTarget: weeklyTargetForRemainingDays, // Use calculated target for remaining days
              dailyBaseline: dailyCalories,
              deficitTarget: goalConfiguration.weeklyDeficitTarget || 0,
              goalConfig: enhancedGoalConfig,
              weeklyAllowance: weeklyTargetForRemainingDays, // Use calculated target
              currentWeekAllowance: weeklyTargetForRemainingDays, // Will be adjusted by intelligent transition if needed
            };

            setGoalConfiguration(enhancedGoalConfig);
            setWeeklyGoal(weeklyGoal);

            console.log('[NutritionRecommendation] Weekly goal saved successfully:', weeklyGoal);

            // Create intelligent success message
            const successTitle = hasExistingData ? 'Goal Updated & Adjusted' : 'Goal Created';
            const successMessage = hasExistingData 
              ? `Your new ${selectedLevel} plan (${dailyCalories} cal/day) has been applied. Your weekly budget has been adjusted based on what you've already eaten and burned this week.`
              : `Your ${selectedLevel} nutrition plan has been saved with ${dailyCalories} calories/day.`;

            Alert.alert(successTitle, successMessage, [
              { text: 'OK', onPress: () => navigation.navigate('WeeklyBanking' as any) }
            ]);
          }
        }
      ]
    );
  };

  const handleCustomize = () => {
    setCustomizing(true);
    // Future: Navigate to customization screen or show inline editing
    Alert.alert(
      'Customize Nutrition',
      'Customization feature coming soon! You can manually adjust values in the weekly banking screen.',
      [{ text: 'OK', onPress: () => setCustomizing(false) }]
    );
  };

  const renderAIHighlights = () => {
    if (!nutritionResponse?.goalFeasibility) return null;

    const { goalFeasibility } = nutritionResponse;
    const achievableColor = goalFeasibility.isAchievable ? theme.colors.success : theme.colors.warning;
    const confidenceColor = {
      high: theme.colors.success,
      medium: theme.colors.info,
      low: theme.colors.warning
    }[goalFeasibility.confidenceLevel];

    return (
      <View style={styles.aiHighlightsCard}>
        {/* Goal Achievability Header */}
        <View style={styles.achievabilityHeader}>
          <View style={styles.achievabilityIconContainer}>
            <Ionicons 
              name={goalFeasibility.isAchievable ? "checkmark-circle" : "warning"} 
              size={28} 
              color={achievableColor} 
            />
          </View>
          <View style={styles.achievabilityContent}>
            <Text style={[styles.achievabilityStatus, { color: achievableColor }]}>
              Goal is {goalFeasibility.isAchievable ? 'Achievable' : 'Challenging'}
            </Text>
            <View style={styles.confidenceBadge}>
              <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                {goalFeasibility.confidenceLevel.toUpperCase()} CONFIDENCE
              </Text>
            </View>
          </View>
        </View>

        {/* AI Analysis */}
        <Text style={styles.aiAnalysisText}>{goalFeasibility.analysis}</Text>

        {/* Key Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.insightsSectionTitle}>Key AI Insights</Text>
          {goalFeasibility.keyInsights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Ionicons name="bulb-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>

        {/* Warnings if any */}
        {goalFeasibility.warningsOrConcerns && goalFeasibility.warningsOrConcerns.length > 0 && (
          <View style={styles.warningsSection}>
            <View style={styles.warningSectionHeader}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.colors.warning} />
              <Text style={styles.warningSectionTitle}>Important Considerations</Text>
            </View>
            {goalFeasibility.warningsOrConcerns.map((warning, index) => (
              <Text key={index} style={styles.aiWarningText}>• {warning}</Text>
            ))}
          </View>
        )}

        {/* AI Powered Badge */}
        <View style={styles.aiPoweredBadge}>
          <Ionicons name="flash-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.aiPoweredText}>AI-Powered Sports Nutrition Analysis</Text>
        </View>
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.text }]}>Calculating personalized nutrition...</Text>
      <Text style={[styles.loadingSubtext, { color: theme.colors.textSecondary }]}>
        Analyzing your profile with AI-powered sports nutrition science
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
      <Ionicons name="warning-outline" size={48} color={theme.colors.error} />
      <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={loadNutritionRecommendations}>
        <Text style={[styles.retryButtonText, { color: theme.colors.buttonText }]}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRecommendationCard = (level: RecommendationLevel) => {
    if (!nutritionResponse) return null;

    const recommendation = nutritionResponse.recommendations[level];
    const isSelected = selectedLevel === level;

    const levelConfig = {
      conservative: { 
        color: '#28a745', 
        label: 'Conservative', 
        description: 'Safer approach with moderate deficit',
        icon: 'shield-checkmark-outline'
      },
      standard: { 
        color: '#007bff', 
        label: 'Standard', 
        description: 'Balanced evidence-based approach',
        icon: 'fitness-outline'
      },
      aggressive: { 
        color: '#fd7e14', 
        label: 'Aggressive', 
        description: 'Faster results with higher deficit',
        icon: 'flash-outline'
      },
    };

    const config = levelConfig[level];

    return (
      <TouchableOpacity
        key={level}
        style={[
          styles.recommendationCard,
          { borderColor: config.color },
          isSelected && { backgroundColor: config.color + '10', borderWidth: 2 }
        ]}
        onPress={() => setSelectedLevel(level)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name={config.icon as any} size={24} color={config.color} />
            <Text style={[styles.cardTitle, { color: config.color }]}>
              {config.label}
            </Text>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={24} color={config.color} />
            )}
          </View>
          <Text style={styles.cardDescription}>{config.description}</Text>
        </View>

        <View style={styles.macroSection}>
          <Text style={styles.sectionTitle}>Daily Targets</Text>
          
          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Calories</Text>
              <Text style={styles.macroValue}>{recommendation.dailyCalories}</Text>
              <Text style={styles.macroUnit}>kcal</Text>
            </View>
            
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{recommendation.macronutrients.protein.grams}</Text>
              <Text style={styles.macroUnit}>g ({recommendation.macronutrients.protein.perKgBodyweight.toFixed(1)}g/kg)</Text>
            </View>
            
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{recommendation.macronutrients.carbohydrates.grams}</Text>
              <Text style={styles.macroUnit}>g ({recommendation.macronutrients.carbohydrates.perKgBodyweight.toFixed(1)}g/kg)</Text>
            </View>
            
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Fats</Text>
              <Text style={styles.macroValue}>{recommendation.macronutrients.fats.grams}</Text>
              <Text style={styles.macroUnit}>g ({recommendation.macronutrients.fats.perKgBodyweight.toFixed(1)}g/kg)</Text>
            </View>
          </View>
        </View>

        <View style={styles.macroPercentages}>
          <View style={styles.macroBar}>
            <View 
              style={[
                styles.macroBarSegment, 
                { width: `${recommendation.macronutrients.protein.percentage}%`, backgroundColor: '#e74c3c' }
              ]} 
            />
            <View 
              style={[
                styles.macroBarSegment, 
                { width: `${recommendation.macronutrients.carbohydrates.percentage}%`, backgroundColor: '#3498db' }
              ]} 
            />
            <View 
              style={[
                styles.macroBarSegment, 
                { width: `${recommendation.macronutrients.fats.percentage}%`, backgroundColor: '#f39c12' }
              ]} 
            />
          </View>
          <View style={styles.macroLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
              <Text style={styles.legendText}>P: {recommendation.macronutrients.protein.percentage}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#3498db' }]} />
              <Text style={styles.legendText}>C: {recommendation.macronutrients.carbohydrates.percentage}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#f39c12' }]} />
              <Text style={styles.legendText}>F: {recommendation.macronutrients.fats.percentage}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.adjustmentSection}>
          <Text style={styles.sectionTitle}>Training Day Adjustments</Text>
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Training Day:</Text>
            <Text style={styles.adjustmentValue}>+{recommendation.trainingDayAdjustments.totalTrainingDay - recommendation.dailyCalories} kcal</Text>
          </View>
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Rest Day:</Text>
            <Text style={styles.adjustmentValue}>{recommendation.restDayCalories - recommendation.dailyCalories} kcal</Text>
          </View>
        </View>

        {recommendation.estimatedWeeklyWeightChange !== 0 && (
          <View style={styles.outcomeSection}>
            <Text style={styles.sectionTitle}>Expected Outcome</Text>
            <Text style={styles.outcomeText}>
              {recommendation.estimatedWeeklyWeightChange > 0 ? '+' : ''}
              {recommendation.estimatedWeeklyWeightChange.toFixed(1)}kg per week
            </Text>
            {recommendation.timeToGoal && (
              <Text style={styles.timeToGoal}>{recommendation.timeToGoal}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMealTiming = () => {
    if (!nutritionResponse) return null;

    return (
      <View style={styles.mealTimingCard}>
        <Text style={styles.cardTitle}>Meal Timing Guidelines</Text>
        
        <View style={styles.timingSection}>
          <Text style={styles.timingSectionTitle}>Pre-Workout</Text>
          <Text style={styles.timingText}>{nutritionResponse.mealTimingRecommendations.preWorkoutMeal.timing}</Text>
          <Text style={styles.timingDescription}>{nutritionResponse.mealTimingRecommendations.preWorkoutMeal.composition}</Text>
          <View style={styles.examplesList}>
            {nutritionResponse.mealTimingRecommendations.preWorkoutMeal.examples.map((example, index) => (
              <Text key={index} style={styles.exampleText}>• {example}</Text>
            ))}
          </View>
        </View>

        <View style={styles.timingSection}>
          <Text style={styles.timingSectionTitle}>Post-Workout</Text>
          <Text style={styles.timingText}>{nutritionResponse.mealTimingRecommendations.postWorkoutMeal.timing}</Text>
          <Text style={styles.timingDescription}>{nutritionResponse.mealTimingRecommendations.postWorkoutMeal.composition}</Text>
          <View style={styles.examplesList}>
            {nutritionResponse.mealTimingRecommendations.postWorkoutMeal.examples.map((example, index) => (
              <Text key={index} style={styles.exampleText}>• {example}</Text>
            ))}
          </View>
        </View>

        <View style={styles.timingSection}>
          <Text style={styles.timingSectionTitle}>Daily Distribution</Text>
          <Text style={styles.timingText}>
            {nutritionResponse.mealTimingRecommendations.dailyMealDistribution.numberOfMeals} meals per day
          </Text>
          <Text style={styles.timingDescription}>
            {nutritionResponse.mealTimingRecommendations.dailyMealDistribution.mealSpacing} spacing
          </Text>
        </View>
      </View>
    );
  };

  const renderHydrationGuidance = () => {
    if (!nutritionResponse) return null;

    return (
      <View style={styles.hydrationCard}>
        <Text style={styles.cardTitle}>Hydration Guidelines</Text>
        
        <View style={styles.hydrationItem}>
          <Ionicons name="water-outline" size={20} color="#3498db" />
          <View style={styles.hydrationContent}>
            <Text style={styles.hydrationLabel}>Daily Target</Text>
            <Text style={styles.hydrationValue}>{nutritionResponse.hydrationGuidance.dailyBaselineFluid}ml</Text>
          </View>
        </View>

        <View style={styles.hydrationItem}>
          <Ionicons name="time-outline" size={20} color="#3498db" />
          <View style={styles.hydrationContent}>
            <Text style={styles.hydrationLabel}>Pre-Workout</Text>
            <Text style={styles.hydrationValue}>{nutritionResponse.hydrationGuidance.preWorkoutHydration}</Text>
          </View>
        </View>

        <View style={styles.hydrationItem}>
          <Ionicons name="fitness-outline" size={20} color="#3498db" />
          <View style={styles.hydrationContent}>
            <Text style={styles.hydrationLabel}>During Workout</Text>
            <Text style={styles.hydrationValue}>{nutritionResponse.hydrationGuidance.duringWorkoutFluidRate}</Text>
          </View>
        </View>

        <View style={styles.hydrationItem}>
          <Ionicons name="refresh-outline" size={20} color="#3498db" />
          <View style={styles.hydrationContent}>
            <Text style={styles.hydrationLabel}>Post-Workout</Text>
            <Text style={styles.hydrationValue}>{nutritionResponse.hydrationGuidance.postWorkoutRehydration}</Text>
          </View>
        </View>

        <View style={styles.electrolyteNote}>
          <Text style={styles.electrolyteText}>{nutritionResponse.hydrationGuidance.electrolyteRecommendations}</Text>
        </View>
      </View>
    );
  };

  const renderRationale = () => {
    if (!nutritionResponse) return null;

    return (
      <View style={styles.rationaleCard}>
        <Text style={styles.cardTitle}>AI Reasoning</Text>
        <Text style={styles.rationaleText}>{nutritionResponse.rationale}</Text>
        
        {nutritionResponse.sportSpecificGuidance && (
          <View style={styles.sportGuidanceSection}>
            <Text style={styles.sportGuidanceTitle}>
              {athleteProfile.trainingProfile.primarySport.charAt(0).toUpperCase() + 
               athleteProfile.trainingProfile.primarySport.slice(1)} Specific Guidance
            </Text>
            <Text style={styles.sportGuidanceText}>{nutritionResponse.sportSpecificGuidance}</Text>
          </View>
        )}

        {nutritionResponse.periodizationAdjustments && (
          <View style={styles.periodizationSection}>
            <Text style={styles.periodizationTitle}>Periodization Notes</Text>
            <Text style={styles.periodizationText}>{nutritionResponse.periodizationAdjustments}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderSupplements = () => {
    if (!nutritionResponse?.supplementRecommendations?.length) return null;

    return (
      <View style={styles.supplementCard}>
        <Text style={styles.cardTitle}>Supplement Recommendations</Text>
        {nutritionResponse.supplementRecommendations.map((supplement, index) => (
          <View key={index} style={styles.supplementItem}>
            <View style={styles.supplementHeader}>
              <Text style={styles.supplementName}>{supplement.name}</Text>
              <View style={[styles.priorityBadge, styles[`priority${supplement.priority}`]]}>
                <Text style={styles.priorityText}>{supplement.priority}</Text>
              </View>
            </View>
            <Text style={styles.supplementPurpose}>{supplement.purpose}</Text>
            <Text style={styles.supplementDosage}>Dosage: {supplement.dosage}</Text>
            <Text style={styles.supplementTiming}>Timing: {supplement.timing}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) return renderLoadingState();
  if (error) return renderErrorState();
  if (!nutritionResponse) return renderErrorState();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition Recommendations</Text>
        <TouchableOpacity 
          onPress={() => 
            Alert.alert(
              'Skip Nutrition Setup',
              'Are you sure you want to skip the AI-powered nutrition recommendations? You can always set this up later in settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Skip', 
                  style: 'destructive',
                  onPress: () => navigation.navigate('WeeklyBanking' as any)
                }
              ]
            )
          } 
          style={styles.skipButton}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Your Personalized Nutrition Plan</Text>
          <Text style={styles.introSubtitle}>
            AI-powered recommendations based on your {athleteProfile.trainingProfile.primarySport} training and {goalConfiguration.mode} goals
          </Text>
          
          {/* Show warning if body fat percentage is missing */}
          {!athleteProfile.physicalStats?.bodyFatPercentage && (
            <View style={styles.warningContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#ff9500" />
              <Text style={styles.warningText}>
                Body fat percentage not provided. Calculations will use standard formulas which may be less accurate for athletes.
              </Text>
            </View>
          )}
        </View>

        {/* AI Highlights Hero Section */}
        {renderAIHighlights()}

        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionHeader}>Choose Your Approach</Text>
          {(['conservative', 'standard', 'aggressive'] as RecommendationLevel[]).map(renderRecommendationCard)}
        </View>

        {renderMealTiming()}
        {renderHydrationGuidance()}
        {renderSupplements()}
        {renderRationale()}

        <View style={styles.monitoringSection}>
          <Text style={styles.cardTitle}>Monitoring Guidelines</Text>
          {nutritionResponse.monitoringMetrics.map((metric, index) => (
            <Text key={index} style={styles.monitoringMetric}>• {metric}</Text>
          ))}
          <Text style={styles.adaptationNote}>
            Adaptation Period: {nutritionResponse.adaptationPeriod}
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.floatingActionButton} 
        onPress={handleSaveRecommendation}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark" size={24} color={theme.colors.buttonText} />
      </TouchableOpacity>

      {/* Customize Button (bottom left) */}
      <TouchableOpacity 
        style={styles.customizeFloatingButton} 
        onPress={handleCustomize}
        disabled={customizing}
        activeOpacity={0.8}
      >
        <Ionicons name="settings-outline" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  helpButton: {
    padding: 8,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.card,
  },
  skipButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: theme.colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  introSection: {
    padding: 20,
    backgroundColor: theme.colors.surface,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  warningText: {
    fontSize: 14,
    color: theme.colors.warning,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  aiHighlightsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievabilityIconContainer: {
    marginRight: 12,
  },
  achievabilityContent: {
    flex: 1,
  },
  achievabilityStatus: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  aiAnalysisText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  insightsSection: {
    marginBottom: 16,
  },
  insightsSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 4,
  },
  insightText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  warningsSection: {
    backgroundColor: theme.colors.warning + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
  },
  warningSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.warning,
    marginLeft: 6,
  },
  aiWarningText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.warning,
    lineHeight: 18,
    marginBottom: 4,
  },
  aiPoweredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  aiPoweredText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
    fontWeight: '400',
  },
  recommendationsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  macroSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  macroUnit: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  macroPercentages: {
    marginBottom: 16,
  },
  macroBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
    marginBottom: 8,
  },
  macroBarSegment: {
    height: '100%',
  },
  macroLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  adjustmentSection: {
    marginBottom: 16,
  },
  adjustmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  adjustmentLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  adjustmentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  outcomeSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  outcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  timeToGoal: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  mealTimingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timingSection: {
    marginBottom: 16,
  },
  timingSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  timingText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  timingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  examplesList: {
    marginLeft: 8,
  },
  exampleText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  hydrationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hydrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hydrationContent: {
    marginLeft: 12,
    flex: 1,
  },
  hydrationLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  hydrationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  electrolyteNote: {
    marginTop: 8,
    padding: 12,
    backgroundColor: theme.colors.info + '20',
    borderRadius: 8,
  },
  electrolyteText: {
    fontSize: 13,
    color: theme.colors.info,
  },
  rationaleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rationaleText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  sportGuidanceSection: {
    marginBottom: 16,
  },
  sportGuidanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  sportGuidanceText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  periodizationSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  periodizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.success,
    marginBottom: 8,
  },
  periodizationText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  supplementCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supplementItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  supplementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  supplementName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityessential: {
    backgroundColor: '#dc3545',
  },
  prioritybeneficial: {
    backgroundColor: '#28a745',
  },
  priorityoptional: {
    backgroundColor: '#6c757d',
  },
  priorityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  supplementPurpose: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  supplementDosage: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  supplementTiming: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  monitoringSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monitoringMetric: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  adaptationNote: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 12,
  },
  customizeButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: theme.colors.buttonText,
    fontWeight: '600',
    marginLeft: 8,
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1000,
  },
  customizeFloatingButton: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 999,
  },
  });
}

export default NutritionRecommendationScreen;
