import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Share,
  Animated,
  AccessibilityInfo,
  Vibration,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCalorieStore } from '../stores/calorieStore';
import { DailyCalorieData, MealEntry, WorkoutSession } from '../types/CalorieTypes';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import MealLoggingModal from '../components/MealLoggingModal';
import WorkoutLoggingModal from '../components/WorkoutLoggingModal';
import MealHistoryList from '../components/MealHistoryList';
import EditMealModal from '../components/EditMealModal';
import RecoveryIntegration from '../components/RecoveryIntegration';
import RecoverySessionCleaner from '../components/RecoverySessionCleaner';
import RecoveryDebugger from '../components/RecoveryDebugger';
import { useThemedStyles, useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  CalorieProgressRing,
  MacroBreakdownChart,
  WaterIntakeTracker,
} from '../components/charts';
import MorningWeightCheckin from '../components/MorningWeightCheckin';
import SimplifiedCalorieLogging from '../components/SimplifiedCalorieLogging';

const { width, height } = Dimensions.get('window');

type TabType = 'nutrition' | 'training';

const DailyLoggingScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<TabType>('nutrition');
  const [showMealModal, setShowMealModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showEditMealModal, setShowEditMealModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dailyStreak, setDailyStreak] = useState(0);
  const [isAccessibilityEnabled, setIsAccessibilityEnabled] = useState(false);
  const [useSimplifiedLogging, setUseSimplifiedLogging] = useState(false);

  const { theme } = useTheme();
  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      header: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      dateText: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
      },
      dayText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
      },
      tabContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
      },
      tabActive: {
        borderBottomWidth: 3,
        borderBottomColor: theme.colors.primary,
      },
      tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textSecondary,
      },
      tabTextActive: {
        color: theme.colors.primary,
      },
      tabContent: {
        flex: 1,
        padding: 16,
      },
      card: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        ...Platform.select({
          ios: {
            shadowColor: theme.dark ? '#000' : '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: theme.dark ? 0.3 : 0.1,
            shadowRadius: 8,
          },
          android: {
            elevation: 4,
          },
        }),
      },
      cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 16,
      },
      cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      },
      addButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
      },
      addButtonText: {
        color: theme.colors.buttonText,
        fontSize: 14,
        fontWeight: '600',
      },
      chartContainer: {
        alignItems: 'center',
        marginVertical: 16,
      },
      remainingCalories: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
      },
      workoutItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
      },
      workoutInfo: {
        flex: 1,
      },
      workoutName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
      },
      workoutDetails: {
        fontSize: 14,
        color: theme.colors.textSecondary,
      },
      workoutCalories: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.success,
      },
      emptyState: {
        alignItems: 'center',
        paddingVertical: 20,
      },
      emptyText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginBottom: 4,
      },
      emptySubtext: {
        fontSize: 14,
        color: theme.colors.textTertiary,
      },
      trainingStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
      },
      statItem: {
        alignItems: 'center',
      },
      statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 4,
      },
      statLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'center',
      },
      fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
          ios: {
            shadowColor: theme.dark ? '#000' : '#000',
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: theme.dark ? 0.5 : 0.3,
            shadowRadius: 12,
          },
          android: {
            elevation: 8,
          },
        }),
      },
      fabIcon: {
        fontSize: 24,
        fontWeight: '300',
        color: theme.colors.buttonText,
      },
      suggestionsScroll: {
        marginTop: 8,
      },
      suggestionCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        padding: 12,
        marginRight: 12,
        minWidth: 120,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      suggestionName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 4,
      },
      suggestionCalories: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: '500',
      },
      insightsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
      },
      insightItem: {
        alignItems: 'center',
      },
      insightValue: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 4,
      },
      insightLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'center',
      },
      headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      headerButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
      },
      shareButton: {
        backgroundColor: theme.colors.success,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
      },
      shareButtonText: {
        fontSize: 16,
        color: theme.colors.buttonText,
      },
      recentMealCard: {
        backgroundColor: theme.dark ? '#2D1B0E' : '#FFF3E0',
        borderRadius: 8,
        padding: 12,
        marginRight: 12,
        minWidth: 100,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.dark ? '#5D4037' : '#FFE0B2',
      },
      recentMealName: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.dark ? '#FFAB40' : '#E65100',
        textAlign: 'center',
        marginBottom: 4,
      },
      recentMealCalories: {
        fontSize: 11,
        color: theme.dark ? '#FF9800' : '#F57C00',
        fontWeight: '500',
      },
      modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
      },
      modalCloseButton: {
        padding: 8,
      },
      modalCloseText: {
        fontSize: 18,
        color: theme.colors.textSecondary,
      },
      searchInput: {
        margin: 20,
        padding: 12,
        backgroundColor: theme.colors.inputBackground,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.colors.inputBorder,
        color: theme.colors.text,
      },
      suggestionListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 20,
        marginVertical: 4,
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      suggestionListName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
      },
      suggestionListCategory: {
        fontSize: 14,
        color: theme.colors.textSecondary,
      },
      suggestionListCalories: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.primary,
      },
      quickActionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      quickActionsContainer: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 20,
        margin: 20,
        minWidth: 280,
      },
      quickActionsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 20,
      },
      quickActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: theme.colors.surface,
      },
      quickActionText: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: '500',
      },
      quickActionCancel: {
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
      },
      quickActionCancelText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        fontWeight: '500',
      },
      tabContentContainer: {
        flex: 1,
      },
    })
  );

  const { 
    getDailyProgress, 
    getTodaysData,
    logMeal, 
    logWorkout, 
    updateWaterIntake,
    editMeal,
    deleteMeal,
    weeklyData,
    resetGoal
  } = useCalorieStore();

  const todaysData = getTodaysData();
  const dailyProgress = getDailyProgress();

  // Memoized calculations for performance
  const memoizedCalorieData = useMemo(() => {
    return {
      consumed: dailyProgress?.calories.consumed || 0,
      target: dailyProgress?.calories.target || 2000,
      remaining: dailyProgress?.calories.remaining || 0,
    };
  }, [dailyProgress]);

  const recentMeals = useMemo(() => {
    // Get last 5 unique meals from recent days
    const allMeals = weeklyData.flatMap(day => day.meals);
    const uniqueMeals = Array.from(
      new Map(allMeals.map(meal => [meal.name, meal])).values()
    ).slice(-5);
    return uniqueMeals;
  }, [weeklyData]);

  const smartSuggestions = useMemo(() => {
    const timeOfDay = new Date().getHours();
    const suggestions = [];
    
    if (timeOfDay < 10) {
      suggestions.push(
        { name: "Oatmeal with berries", calories: 350, category: "breakfast" },
        { name: "Greek yogurt parfait", calories: 280, category: "breakfast" },
        { name: "Avocado toast", calories: 320, category: "breakfast" }
      );
    } else if (timeOfDay < 14) {
      suggestions.push(
        { name: "Grilled chicken salad", calories: 420, category: "lunch" },
        { name: "Quinoa bowl", calories: 380, category: "lunch" },
        { name: "Turkey sandwich", calories: 450, category: "lunch" }
      );
    } else {
      suggestions.push(
        { name: "Salmon with vegetables", calories: 520, category: "dinner" },
        { name: "Pasta with chicken", calories: 480, category: "dinner" },
        { name: "Stir-fry with tofu", calories: 390, category: "dinner" }
      );
    }
    
    return suggestions;
  }, []);

  const handleAddMeal = () => {
    setShowMealModal(true);
  };

  const handleAddWorkout = () => {
    setShowTrainingModal(true);
  };

  const handleMealSaved = (meal: Omit<MealEntry, 'id' | 'timestamp'>) => {
    logMeal(meal);
    setShowMealModal(false);
  };

  const handleWorkoutSaved = (workout: Omit<WorkoutSession, 'id' | 'timestamp'>) => {
    logWorkout(workout);
    setShowTrainingModal(false);
  };

  const handleEditMeal = (meal: MealEntry) => {
    setSelectedMeal(meal);
    setShowEditMealModal(true);
  };

  const handleMealUpdated = (mealId: string, updatedMeal: Partial<MealEntry>) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    editMeal(mealId, today, updatedMeal);
  };

  const handleDeleteMeal = (mealId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    deleteMeal(mealId, today);
  };

  const handleWaterTap = (glassIndex: number) => {
    const currentWater = dailyProgress?.water.glasses || 0;
    const newWaterCount = glassIndex < currentWater ? glassIndex : glassIndex + 1;
    updateWaterIntake(newWaterCount);
  };

  // Initialize accessibility and daily streak on mount
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setIsAccessibilityEnabled);
    
    // Calculate daily streak (consecutive days with logged meals)
    const calculateDailyStreak = () => {
      let streak = 0;
      const sortedData = [...weeklyData].sort((a, b) => b.date.localeCompare(a.date));
      
      for (const day of sortedData) {
        if (day.meals.length > 0) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    };
    
    setDailyStreak(calculateDailyStreak());
  }, [weeklyData]);

  // Quick action handlers
  const handleQuickLogMeal = useCallback((suggestion: any) => {
    const meal = {
      name: suggestion.name,
      calories: suggestion.calories,
      category: suggestion.category as any,
    };
    logMeal(meal);
    setShowSmartSuggestions(false);
    
    if (isAccessibilityEnabled) {
      AccessibilityInfo.announceForAccessibility(`Added ${meal.name} with ${meal.calories} calories`);
    }
    Vibration.vibrate(50); // Gentle haptic feedback
  }, [logMeal, isAccessibilityEnabled]);

  // Share daily summary
  const handleShareDailySummary = useCallback(async () => {
    const summary = `Daily Summary - ${format(new Date(), 'MMM do')}\n` +
      `Calories: ${memoizedCalorieData.consumed}/${memoizedCalorieData.target}\n` +
      `Remaining: ${memoizedCalorieData.remaining}\n` +
      `Water: ${dailyProgress?.water.glasses || 0}/8 glasses\n` +
      `Meals logged: ${todaysData?.meals.length || 0}\n` +
      `Daily streak: ${dailyStreak} days`;
    
    try {
      await Share.share({
        message: summary,
        title: 'My Daily Nutrition Summary'
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share summary');
    }
  }, [memoizedCalorieData, dailyProgress, todaysData, dailyStreak]);

  // Handle simplified/detailed logging toggle
  const handleToggleLoggingMode = () => {
    setUseSimplifiedLogging(!useSimplifiedLogging);
  };

  const handleSimplifiedCaloriesLogged = (calories: number) => {
    // Provide feedback when simplified calories are logged
    if (isAccessibilityEnabled) {
      AccessibilityInfo.announceForAccessibility(`Total daily calories updated: ${calories} calories`);
    }
    Vibration.vibrate(50); // Gentle haptic feedback
  };

  // Memoized components for performance
  const CalorieProgressRingMemo = React.memo(CalorieProgressRing);
  const MacroBreakdownChartMemo = React.memo(MacroBreakdownChart);
  const WaterIntakeTrackerMemo = React.memo(WaterIntakeTracker);

  const renderNutritionTab = useCallback(() => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Morning Weight Check-in */}
      <MorningWeightCheckin 
        onWeightLogged={(weight, trend) => {
          // Optional: Provide feedback when weight is logged
          if (trend) {
            const trendText = trend.trend === 'down' ? '↓' : trend.trend === 'up' ? '↑' : '→';
            console.log(`Weight logged: ${weight}kg ${trendText} Trend: ${trend.weeklyChange.toFixed(1)}kg`);
          }
        }}
        showChart={true}
        compact={false}
      />

      {/* Recovery Integration - Shows alerts for overeating events */}
      <RecoveryIntegration />

      {/* TEMPORARY: Recovery Session Cleaner - Remove after clearing stuck state */}
      <RecoverySessionCleaner />

      {/* TEMPORARY: Recovery Debugger - For diagnosing detection issues */}
      <RecoveryDebugger />

      {/* Calorie Progress Ring */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Calories</Text>
        <View style={styles.chartContainer}>
          <CalorieProgressRingMemo
            consumed={memoizedCalorieData.consumed}
            target={memoizedCalorieData.target}
            animated={true}
            size={200}
          />
        </View>
        <Text style={styles.remainingCalories}>
          {Math.round(dailyProgress?.calories.remaining || 0)} calories remaining
        </Text>
      </View>

      {/* Macro Breakdown Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Macronutrients</Text>
        <MacroBreakdownChartMemo
          macros={{
            protein: dailyProgress?.macros.protein.current || 0,
            carbs: dailyProgress?.macros.carbs.current || 0,
            fat: dailyProgress?.macros.fat.current || 0,
          }}
          targets={{
            protein: dailyProgress?.macros.protein.target || 150,
            carbs: dailyProgress?.macros.carbs.target || 250,
            fat: dailyProgress?.macros.fat.target || 80,
          }}
          animated={true}
        />
      </View>

      {/* Smart Suggestions */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Smart Suggestions</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowSmartSuggestions(true)}
            accessibilityLabel="View smart meal suggestions"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="bulb-outline" size={14} color={theme.colors.buttonText} />
              <Text style={styles.addButtonText}>Suggestions</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
          {smartSuggestions.slice(0, 3).map((suggestion, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.suggestionCard}
              onPress={() => handleQuickLogMeal(suggestion)}
              accessibilityLabel={`Quick add ${suggestion.name}, ${suggestion.calories} calories`}
            >
              <Text style={styles.suggestionName}>{suggestion.name}</Text>
              <Text style={styles.suggestionCalories}>{suggestion.calories} cal</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Progress Insights */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Progress Insights</Text>
        <View style={styles.insightsContainer}>
          <View style={styles.insightItem}>
            <Text style={styles.insightValue}>{dailyStreak}</Text>
            <Text style={styles.insightLabel}>Day Streak</Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightValue}>
              {Math.round(weeklyData.reduce((sum, day) => sum + day.consumed, 0) / 7)}
            </Text>
            <Text style={styles.insightLabel}>Weekly Avg</Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightValue}>
              {todaysData?.meals.length || 0}
            </Text>
            <Text style={styles.insightLabel}>Meals Today</Text>
          </View>
        </View>
      </View>

      {/* Calorie Logging Section - Simplified or Detailed Mode */}
      {useSimplifiedLogging ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Quick Add Calories</Text>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: styles.shareButton.backgroundColor }]}
              onPress={handleToggleLoggingMode}
              accessibilityLabel="Switch to detailed logging"
            >
              <Text style={[styles.addButtonText, { fontSize: 12 }]}>Detailed Mode</Text>
            </TouchableOpacity>
          </View>
          <SimplifiedCalorieLogging
            onCaloriesLogged={handleSimplifiedCaloriesLogged}
          />
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Meals</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[styles.addButton, { marginRight: 8, backgroundColor: styles.shareButton.backgroundColor }]}
                onPress={handleToggleLoggingMode}
                accessibilityLabel="Switch to simplified logging"
              >
                <Text style={[styles.addButtonText, { fontSize: 12 }]}>Simple Mode</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.shareButton} 
                onPress={handleShareDailySummary}
                accessibilityLabel="Share daily summary"
              >
                <Ionicons name="share-outline" size={16} color={theme.colors.buttonText} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={handleAddMeal}>
                <Text style={styles.addButtonText}>+ Add Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <MealHistoryList
            meals={todaysData?.meals || []}
            onEditMeal={handleEditMeal}
            onDeleteMeal={handleDeleteMeal}
            showEmptyState={true}
          />
        </View>
      )}

      {/* Recent Meals Quick Add */}
      {recentMeals.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Meals</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentMeals.map((meal, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.recentMealCard}
                onPress={() => handleQuickLogMeal({
                  name: meal.name,
                  calories: meal.calories,
                  category: meal.category
                })}
                accessibilityLabel={`Quick add recent meal: ${meal.name}`}
              >
                <Text style={styles.recentMealName}>{meal.name}</Text>
                <Text style={styles.recentMealCalories}>{meal.calories} cal</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Water Intake Tracker */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Water Intake</Text>
        <WaterIntakeTrackerMemo
          currentIntake={dailyProgress?.water.glasses || 0}
          dailyTarget={dailyProgress?.water.target || 8}
          onUpdate={updateWaterIntake}
        />
      </View>
    </ScrollView>
  ), [dailyProgress, memoizedCalorieData, todaysData, recentMeals, smartSuggestions, dailyStreak, weeklyData, handleQuickLogMeal, handleShareDailySummary, updateWaterIntake]);

  const renderTrainingTab = useCallback(() => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Training Overview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Training</Text>
        <View style={styles.trainingStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(dailyProgress?.calories.burned || 0)}
            </Text>
            <Text style={styles.statLabel}>Calories Burned</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {dailyProgress?.workouts.length || 0}
            </Text>
            <Text style={styles.statLabel}>Completed Workouts</Text>
          </View>
        </View>
      </View>

      {/* Workouts List */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Workouts</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddWorkout}>
            <Text style={styles.addButtonText}>+ Add Workout</Text>
          </TouchableOpacity>
        </View>
        
        {dailyProgress?.workouts && dailyProgress.workouts.length > 0 ? (
          dailyProgress.workouts.map((workout: WorkoutSession) => (
            <View key={workout.id} style={styles.workoutItem}>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                <Text style={styles.workoutDetails}>
                  {workout.duration} min • {workout.sport}
                </Text>
              </View>
              <Text style={styles.workoutCalories}>
                {workout.caloriesBurned} cal
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No workouts logged today</Text>
            <Text style={styles.emptySubtext}>Tap "Add Workout" to get started</Text>
          </View>
        )}
      </View>
    </ScrollView>
  ), [dailyProgress, handleAddWorkout]);

  const handleGoalSettings = () => {
    Alert.alert(
      'Goal Settings',
      'What would you like to do with your goal?',
      [
        {
          text: 'View Current Goal',
          onPress: () => Alert.alert('Current Goal', 'Goal details will be shown here') // TODO: Navigate to goal view
        },
        {
          text: 'Reset Goal',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Reset Goal',
              'This will clear your current goal and allow you to set a new one. Your tracking data will be preserved.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    resetGoal();
                    Alert.alert('Goal Reset', 'Your goal has been reset. Restart the app to set a new goal.');
                  }
                }
              ]
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>
            {format(new Date(), 'EEEE, MMM do', { locale: enGB })}
          </Text>
          <Text style={styles.dayText}>Today</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('DailyLoggingV2')}
            style={styles.headerButton}
            accessibilityLabel="View new daily logging design"
          >
            <Ionicons 
              name="color-palette-outline" 
              size={24} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleGoalSettings}
            style={styles.headerButton}
            accessibilityLabel="Goal settings"
          >
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          <ThemeToggle showLabel={false} size="small" />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'nutrition' && styles.tabActive]}
          onPress={() => setActiveTab('nutrition')}
          accessible={true}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'nutrition' }}
          accessibilityLabel="Nutrition tab"
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'nutrition' && styles.tabTextActive
          ]}>
            Nutrition
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'training' && styles.tabActive]}
          onPress={() => setActiveTab('training')}
          accessible={true}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'training' }}
          accessibilityLabel="Training tab"
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'training' && styles.tabTextActive
          ]}>
            Training
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View 
        style={styles.tabContentContainer}
        accessible={true}
        accessibilityLabel={`${activeTab} tab content`}
      >
        {activeTab === 'nutrition' ? renderNutritionTab() : renderTrainingTab()}
      </View>

      {/* Floating Action Button with Quick Actions */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={activeTab === 'nutrition' ? handleAddMeal : handleAddWorkout}
        onLongPress={() => setShowQuickActions(true)}
        accessibilityLabel={`Add ${activeTab === 'nutrition' ? 'meal' : 'workout'}. Long press for quick actions`}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Smart Suggestions Modal */}
      <Modal
        visible={showSmartSuggestions}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSmartSuggestions(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Smart Meal Suggestions</Text>
            <TouchableOpacity 
              onPress={() => setShowSmartSuggestions(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.searchInput}
            placeholder="Search meals..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search meals"
          />
          
          <FlatList
            data={smartSuggestions.filter(suggestion => 
              suggestion.name.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.suggestionListItem}
                onPress={() => handleQuickLogMeal(item)}
              >
                <View>
                  <Text style={styles.suggestionListName}>{item.name}</Text>
                  <Text style={styles.suggestionListCategory}>{item.category}</Text>
                </View>
                <Text style={styles.suggestionListCalories}>{item.calories} cal</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Quick Actions Modal */}
      <Modal
        visible={showQuickActions}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowQuickActions(false)}
      >
        <View style={styles.quickActionsOverlay}>
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => {
                setShowQuickActions(false);
                handleShareDailySummary();
              }}
            >
              <Ionicons name="share-outline" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
              <Text style={styles.quickActionText}>Share Summary</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => {
                setShowQuickActions(false);
                setShowSmartSuggestions(true);
              }}
            >
              <Ionicons name="bulb-outline" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
              <Text style={styles.quickActionText}>Smart Suggestions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => {
                setShowQuickActions(false);
                // Voice note functionality would go here
                Alert.alert('Voice Note', 'Voice note feature coming soon!');
              }}
            >
              <Ionicons name="mic-outline" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
              <Text style={styles.quickActionText}>Voice Note</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCancel}
              onPress={() => setShowQuickActions(false)}
            >
              <Text style={styles.quickActionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <MealLoggingModal
        visible={showMealModal}
        onClose={() => setShowMealModal(false)}
        onSave={handleMealSaved}
      />

      <EditMealModal
        visible={showEditMealModal}
        meal={selectedMeal}
        onClose={() => {
          setShowEditMealModal(false);
          setSelectedMeal(null);
        }}
        onSave={handleMealUpdated}
      />

      <WorkoutLoggingModal
        visible={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        onSave={handleWorkoutSaved}
      />
    </SafeAreaView>
  );
};

export default DailyLoggingScreen;