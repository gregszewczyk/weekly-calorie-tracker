import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackupService } from '../services/BackupService';
import { 
  WeeklyCalorieGoal, 
  DailyCalorieData, 
  MealEntry, 
  WorkoutSession,
  DailyProgress,
  WeeklyProgress,
  CalorieRedistribution,
  CalorieBankStatus,
  CalorieBankingPlan,
  BankingPlanValidation
} from '../types/CalorieTypes';
import {
  OvereatingEvent,
  RecoveryPlan,
  RecoveryState,
  RecoverySession,
  RecoveryStrategy
} from '../types/RecoveryTypes';
import { GoalConfiguration, GoalMode, WeightEntry, WeightTrend, GoalProgress, GoalPrediction } from '../types/GoalTypes';
import { WeeklyCalorieRedistributor } from '../utils/CalorieRedistribution';
import { HistoricalDataAnalyzer, UserMetabolismProfile, PersonalizedCalorieRecommendation } from '../utils/HistoricalDataAnalyzer';
import { CalorieBankingService } from '../utils/CalorieBankingService';
import { BingeRecoveryCalculator } from '../services/BingeRecoveryCalculator';
import { garminProxyService } from '../services/GarminProxyService';
// Garmin services removed - will be replaced with proxy-based solution
// import { GarminEnhancedHistoricalAnalyzer } from '../services/GarminEnhancedHistoricalAnalyzer';
// import { GarminWellnessService } from '../services/GarminWellnessService';
// import { SleepEnhancedHistoricalAnalyzer } from '../services/SleepEnhancedHistoricalAnalyzer';
import { startOfWeek, format, addDays } from 'date-fns';

interface CalorieStore {
  // State
  currentWeekGoal: WeeklyCalorieGoal | null;
  weeklyData: DailyCalorieData[];
  isLoading: boolean;
  error: string | null;
  goalConfiguration: GoalConfiguration | null; // NEW
  weightEntries: WeightEntry[]; // NEW
  _hasHydrated: boolean; // Track hydration status
  isFullyReady: boolean; // NEW: Track when rehydration callback completes
  recoveryState: RecoveryState; // NEW: Recovery state management

  // Computed values
  getCurrentWeekProgress: () => WeeklyProgress | null;
  getCalorieRedistribution: () => CalorieRedistribution | null;
  getRemainingCaloriesForToday: () => number;
  getTodaysData: () => DailyCalorieData | null;
  getGoalMode: () => GoalMode | null; // NEW
  getCurrentWeekNumber: () => number; // NEW
  getCalorieBankStatus: () => CalorieBankStatus | null; // NEW
  getWeightTrend: () => WeightTrend | null; // NEW
  getDailyProgress: () => DailyProgress | null; // NEW
  getGoalProgress: () => GoalProgress | null; // NEW
  getGoalPrediction: () => GoalPrediction | null; // NEW
  
  // Recovery computed values
  getActiveRecoverySession: () => RecoverySession | null;
  getPendingOvereatingEvent: () => OvereatingEvent | null;
  getRecoveryHistory: () => RecoveryPlan[];
  isRecoveryModeEnabled: () => boolean;
  
  // Historical Data Analysis methods
  getUserMetabolismProfile: () => UserMetabolismProfile | null;
  getPersonalizedCalorieRecommendation: (goalType: 'weight_loss' | 'weight_gain' | 'maintenance', targetWeeklyChange?: number) => PersonalizedCalorieRecommendation | null;
  getHistoricalDataAnalyzer: () => HistoricalDataAnalyzer | null;
  
  // Enhanced Garmin-based analysis
  // getGarminEnhancedAnalyzer: () => GarminEnhancedHistoricalAnalyzer | null; // Removed for proxy solution
  isGarminDataAvailable: () => boolean;
  
  // Sleep-enhanced analysis (User Story 4)
  // getSleepEnhancedAnalyzer: () => SleepEnhancedHistoricalAnalyzer | null; // Removed for proxy solution
  isSleepDataAvailable: () => boolean;

  // Actions
  setWeeklyGoal: (goal: WeeklyCalorieGoal) => void;
  setGoalConfiguration: (config: GoalConfiguration) => void; // NEW
  addWeightEntry: (weight: number) => void; // NEW
  logMeal: (meal: Omit<MealEntry, 'id' | 'timestamp'>) => void;
  updateDailyCalories: (totalCalories: number) => void; // NEW: For simplified logging
  logWorkout: (workout: Omit<WorkoutSession, 'id' | 'timestamp'>) => void; // NEW
  updateWaterIntake: (glasses: number) => void; // NEW
  updateBurnedCalories: (date: string, burnedCalories: number) => void;
  syncGarminActiveCalories: (date: string) => Promise<void>; // NEW: Sync total active calories from Garmin
  syncCurrentWeekGarminData: () => Promise<void>; // NEW: Sync entire current week's Garmin data
  deleteMeal: (mealId: string, date: string) => void;
  editMeal: (mealId: string, date: string, updatedMeal: Partial<MealEntry>) => void;
  initializeWeek: (weekStartDate?: Date) => void;
  forceWeeklyReset: () => void;
  clearError: () => void;
  
  // NEW: Weekly balance carryover
  calculatePreviousWeekBalance: (previousWeekData: DailyCalorieData[], previousWeekGoal: WeeklyCalorieGoal) => number;
  
  // Historical data methods
  getAverageCalorieBurn: (days?: number) => number;
  getAverageCalorieIntake: (days?: number) => number;
  getCalorieAccuracy: () => number; // How well user tracks vs estimates
  calculateTimeToGoal: (targetWeight: number) => number | null; // weeks to reach target
  updateTargetWeight: (target: number) => void; // Update goal target weight
  resetGoal: () => void; // Reset goal configuration to allow re-setup
  resetCompletely: () => void; // Reset everything including weekly data
  fixTDEEValues: (correctTDEE: number) => void; // TEMPORARY: Fix incorrect stored TDEE values
  
  // Calorie Banking methods
  createBankingPlan: (targetDate: string, dailyReduction: number) => Promise<boolean>;
  updateBankingPlan: (targetDate: string, dailyReduction: number) => Promise<boolean>;
  cancelBankingPlan: () => void;
  getBankingPlan: () => CalorieBankingPlan | null;
  validateBankingPlan: (targetDate: string, dailyReduction: number) => BankingPlanValidation | null;
  isBankingAvailable: () => boolean;
  
  // Recovery management methods
  checkForOvereatingEvent: (date?: string) => OvereatingEvent | null;
  acknowledgeOvereatingEvent: (eventId: string) => void;
  createRecoveryPlan: (eventId: string) => Promise<RecoveryPlan | null>;
  selectRecoveryOption: (recoveryPlanId: string, optionId: string) => void;
  startRecoverySession: (recoveryPlanId: string, optionId: string) => void;
  updateRecoverySettings: (settings: Partial<RecoveryState['settings']>) => void;
  abandonRecoverySession: () => void;
  cleanupStaleRecoveryEvents: (date: string) => void;
  
  // Debug methods for testing persistence
  clearAllData: () => void;
  debugStore: () => void;
  clearOldWeeklyData: () => void;
  
  // Backup methods
  createBackup: () => Promise<boolean>;
  restoreFromBackup: () => Promise<boolean>;
  
  // Helper methods for reasonable fallbacks
  getReasonableCalorieFallback: () => number;
  calculateWaterTarget: () => number;
  
  // Daily target locking methods
  lockDailyTarget: (date?: string) => number; // Lock target for the day, return locked value
  getLockedDailyTarget: (date?: string) => number | null; // Get locked target if it exists
  
  // Hydration control methods
  setHasHydrated: (hydrated: boolean) => void;
  setIsFullyReady: (ready: boolean) => void;
}

export const useCalorieStore = create<CalorieStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentWeekGoal: null,
      weeklyData: [],
      isLoading: false,
      error: null,
      goalConfiguration: null, // NEW
      weightEntries: [], // NEW
      _hasHydrated: false, // Initially not hydrated
      isFullyReady: false, // Initially not fully ready
      recoveryState: { // NEW: Recovery state initialization
        activeRecoverySession: undefined,
        recentOvereatingEvents: [],
        recoveryHistory: [],
        settings: {
          autoTriggerThreshold: 200, // 200 calories over target
          enableRecoveryMode: true,
          preferredStrategy: 'gentle-rebalancing',
          maxDailyReduction: 500,
        },
      },

      // Manual cleanup function for debugging
      clearOldWeeklyData: () => {
        const today = new Date();
        const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekDates = Array.from({ length: 7 }, (_, i) => 
          format(addDays(currentWeekStart, i), 'yyyy-MM-dd')
        );
        
        console.log('🗑️ [CalorieStore] Manual cleanup - current week dates:', weekDates);
        
        set(state => {
          const currentWeekData = state.weeklyData.filter(day => weekDates.includes(day.date));
          const oldData = state.weeklyData.filter(day => !weekDates.includes(day.date));
          
          console.log('🗑️ [CalorieStore] Removing old data:', oldData.map(d => `${d.date}(${d.consumed}cal)`));
          console.log('📊 [CalorieStore] Keeping current week data:', currentWeekData.map(d => `${d.date}(${d.consumed}cal)`));
          
          return { weeklyData: currentWeekData };
        });
      },

      // Computed values
      getCurrentWeekProgress: () => {
        const { currentWeekGoal, weeklyData, goalConfiguration } = get();
        if (!currentWeekGoal || !goalConfiguration) return null;
        
        return WeeklyCalorieRedistributor.calculateWeeklyProgress(
          currentWeekGoal,
          weeklyData
        );
      },

      getCalorieRedistribution: () => {
        // RE-IMPLEMENTING REDISTRIBUTION WITHOUT CIRCULAR DEPENDENCIES
        const { currentWeekGoal, weeklyData, goalConfiguration } = get();
        if (!currentWeekGoal || !goalConfiguration) return null;

        // Calculate weekly progress directly (like getCurrentWeekProgress but without calling it)
        const totalConsumed = weeklyData.reduce((sum, day) => sum + day.consumed, 0);
        const totalBurned = weeklyData.reduce((sum, day) => sum + day.burned, 0);
        const remainingCalories = currentWeekGoal.totalTarget - totalConsumed + totalBurned;
        
        // Calculate current day and remaining days
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const daysDiff = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
        const currentDayIndex = Math.max(0, Math.min(6, daysDiff));
        const remainingDays = 7 - currentDayIndex;
        
        if (remainingDays <= 0) {
          return {
            remainingDays: 0,
            remainingCalories: 0,
            recommendedDailyTargets: [],
            adjustmentReason: 'on-track' as const
          };
        }

        // Simple redistribution - divide remaining calories across remaining days
        const baseDaily = Math.round(remainingCalories / remainingDays);
        const redistributedTargets = Array(remainingDays).fill(Math.max(baseDaily, 1200)); // Minimum 1200 cal/day

        // Simple adjustment reason based on pace
        const daysElapsed = currentDayIndex;
        const expectedConsumedByNow = (currentWeekGoal.weeklyAllowance / 7) * daysElapsed;
        const actualNetConsumed = totalConsumed - totalBurned;
        const deviation = actualNetConsumed - expectedConsumedByNow;
        
        let adjustmentReason: 'on-track' | 'over-budget' | 'under-budget';
        const threshold = currentWeekGoal.dailyBaseline * 0.2; // 20% threshold
        
        if (deviation > threshold) {
          adjustmentReason = 'over-budget';
        } else if (deviation < -threshold) {
          adjustmentReason = 'under-budget';
        } else {
          adjustmentReason = 'on-track';
        }
        
        console.log('🔄 [Redistribution] Basic redistribution re-enabled without circular dependencies');
        
        return {
          remainingDays,
          remainingCalories,
          recommendedDailyTargets: redistributedTargets,
          adjustmentReason
        };
      },

      getRemainingCaloriesForToday: () => {
        // RE-IMPLEMENTING SAFE TO EAT CALCULATIONS WITHOUT CIRCULAR DEPENDENCIES
        const todayData = get().getTodaysData();
        if (!todayData) return 0;

        // Get locked daily target (should be available after getTodaysData auto-locks it)
        const lockedTarget = get().getLockedDailyTarget();
        
        // If no locked target, calculate one using redistribution
        let todayTarget = lockedTarget;
        if (!todayTarget) {
          const redistribution = get().getCalorieRedistribution();
          const currentWeekGoal = get().currentWeekGoal;
          todayTarget = redistribution?.recommendedDailyTargets[0] || 
                       currentWeekGoal?.dailyBaseline || 
                       get().getReasonableCalorieFallback();
        }
        
        const consumed = todayData.consumed;
        const safeToEat = Math.max(0, todayTarget - consumed);
        
        console.log('🍽️ [SafeToEat] Safe to eat calculation:');
        console.log(`   Today target: ${todayTarget} (locked: ${lockedTarget ? 'YES' : 'NO'})`);
        console.log(`   Already consumed: ${consumed}`);
        console.log(`   Safe to eat: ${todayTarget} - ${consumed} = ${safeToEat}`);
        
        return safeToEat;
      },

      getTodaysData: () => {
        // Don't return data if no goal configuration exists
        if (!get().goalConfiguration) return null;
        
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayData = get().weeklyData.find(data => data.date === today) || null;
        
        // Re-enable auto-locking (should be safe now with fixed lockDailyTarget)
        if (todayData && get().getLockedDailyTarget(today) === null) {
          get().lockDailyTarget(today);
        }
        
        return todayData;
      },

      // NEW computed methods
      getGoalMode: () => {
        const { goalConfiguration } = get();
        return goalConfiguration?.mode || null;
      },

      getCurrentWeekNumber: () => {
        const state = get();
        if (!state.goalConfiguration?.startDate) return 1;
        
        const startDate = new Date(state.goalConfiguration.startDate);
        const today = new Date();
        
        // Find the Monday of the week when the goal started
        const goalStartMonday = startOfWeek(startDate, { weekStartsOn: 1 });
        
        // Find the Monday of the current week  
        const currentMonday = startOfWeek(today, { weekStartsOn: 1 });
        
        // Calculate the number of weeks (Mondays) between them
        const weeksDiff = Math.floor((currentMonday.getTime() - goalStartMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
        
        return weeksDiff + 1; // Week 1 for first week, Week 2 for second Monday, etc.
      },

      getCalorieBankStatus: () => {
        // RE-IMPLEMENTING BANKING SYSTEM WITHOUT CIRCULAR DEPENDENCIES
        const { currentWeekGoal, weeklyData, goalConfiguration } = get();
        if (!currentWeekGoal || !goalConfiguration) return null;

        // Calculate basic progress WITHOUT calling other computed methods
        const totalConsumed = weeklyData.reduce((sum, day) => sum + day.consumed, 0);
        const totalBurned = weeklyData.reduce((sum, day) => sum + day.burned, 0);
        const totalUsed = totalConsumed - totalBurned;
        
        // Calculate days left in week
        const today = new Date();
        const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const mondayBasedDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Convert to Monday = 0 system
        const daysLeftIncludingToday = 7 - mondayBasedDay; // Days remaining including today
        const daysLeftExcludingToday = Math.max(0, daysLeftIncludingToday - 1); // Future days only
        
        // Use stored weekly allowance
        const weeklyAllowance = currentWeekGoal.currentWeekAllowance ?? currentWeekGoal.weeklyAllowance;
        const totalRemaining = weeklyAllowance - totalUsed;
        
        // Calculate daily average for remaining days (excluding today's locked target)
        const lockedTarget = get().getLockedDailyTarget();
        const todayTarget = lockedTarget || 
                           currentWeekGoal?.dailyBaseline || 
                           get().getReasonableCalorieFallback();
        
        // For future days calculation, subtract today's target from total remaining
        const remainingForFutureDays = totalRemaining - todayTarget;
        const dailyAverageForFuture = daysLeftExcludingToday > 0 ? remainingForFutureDays / daysLeftExcludingToday : 0;
        
        // Simple projected outcome without complex redistribution logic
        const projectedOutcome: 'on-track' | 'over-budget' | 'under-budget' = 
          totalUsed > weeklyAllowance ? 'over-budget' : 
          totalRemaining < (weeklyAllowance * 0.1) ? 'under-budget' : 'on-track';
        
        // Calculate averages
        const nonZeroDays = Math.max(7 - daysLeftIncludingToday + 1, 1);
        const avgDailyConsumption = Math.round(totalConsumed / nonZeroDays);
        const avgDailyBurned = Math.round(totalBurned / nonZeroDays);
        
        // Simple safe to eat calculation using locked target or fallback
        const safeToEatToday = lockedTarget || 
                              currentWeekGoal?.dailyBaseline || 
                              get().getReasonableCalorieFallback();
        
        console.log('💰 [CalorieBankStatus] Banking system re-enabled - basic calculations only');
        
        return {
          weeklyAllowance,
          totalUsed,
          totalConsumed,
          totalBurned,
          remaining: totalRemaining, // Total remaining including today
          remainingForFutureDays, // NEW: Remaining excluding today's locked target
          daysLeft: daysLeftIncludingToday,
          daysLeftExcludingToday,
          dailyAverage: dailyAverageForFuture,
          todayTarget,
          avgDailyConsumption,
          avgDailyBurned,
          projectedOutcome,
          safeToEatToday,
          activeBankingPlan: currentWeekGoal.bankingPlan,
          isBankingAdjusted: currentWeekGoal.bankingPlan?.isActive || false
        };
      },

      // DEAD CODE TEMPORARILY COMMENTED OUT TO FIX INFINITE LOOP
      /*
      _temporarilyDisabled: () => {
        const mondayBasedDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Convert to Monday = 0 system
        const daysLeft = 7 - mondayBasedDay; // Days remaining including today
        
        // Use the stored currentWeekAllowance - never recalculate mid-week
        // Fallback to weeklyAllowance if currentWeekAllowance doesn't exist (migration case)
        const weeklyAllowance = progress.goal.currentWeekAllowance ?? progress.goal.weeklyAllowance;
        
        const totalUsed = progress.totalConsumed - progress.totalBurned;
        const remaining = weeklyAllowance - totalUsed;
        
        console.log(`📅 [CalorieBankStatus] Today is ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayOfWeek]}, days left: ${daysLeft}`);
        const fullWeeklyAllowance = progress.goal.weeklyAllowance;
        const dailyAllowance = fullWeeklyAllowance / 7;
        console.log(`💰 [CalorieBankStatus] Full weekly allowance: ${fullWeeklyAllowance}, Current week allowance: ${Math.round(weeklyAllowance)} (fixed mid-week)`);
        const dailyAverage = daysLeft > 0 ? remaining / daysLeft : 0;
        
        // Use the actual daily baseline from the goal, not the redistributed amount
        // This should show your target daily calories (like 3.1k), not what's left divided by days
        const actualDailyTarget = progress.goal.dailyBaseline;
        
        // Calculate today's target including burned calories from redistribution
        const redistribution = get().getCalorieRedistribution();
        const todayTargetWithBurnedCalories = redistribution?.recommendedDailyTargets[0] || actualDailyTarget;
        
        console.log(`🎯 [CalorieBankStatus] Daily target: ${actualDailyTarget}, Redistributed target with burned calories: ${Math.round(todayTargetWithBurnedCalories)}, Redistributed average: ${Math.round(dailyAverage)}`);
        
        // Use smart pace-based projected outcome (matches redistribution logic)
        let projectedOutcome: 'on-track' | 'over-budget' | 'under-budget';
        if (redistribution) {
          // Use the smart adjustment reason from redistribution
          switch (redistribution.adjustmentReason) {
            case 'over-budget':
              projectedOutcome = 'over-budget';
              break;
            case 'under-budget':
              projectedOutcome = 'under-budget';
              break;
            default:
              projectedOutcome = 'on-track';
              break;
          }
        } else {
          // Fallback to simple logic if no redistribution available
          if (Math.abs(remaining) <= 500) {
            projectedOutcome = 'on-track';
          } else if (remaining < 0) {
            projectedOutcome = 'over-budget';
          } else {
            projectedOutcome = 'under-budget';
          }
        }
        
        // Calculate elapsed days and averages for display
        const daysElapsed = 7 - daysLeft;
        const avgDailyConsumption = daysElapsed > 0 ? progress.totalConsumed / daysElapsed : 0;
        const avgDailyBurned = daysElapsed > 0 ? progress.totalBurned / daysElapsed : 0;

        // Check for active banking plan
        const activeBankingPlan = progress.goal.bankingPlan;
        const isBankingAdjusted = activeBankingPlan?.isActive || false;

        return {
          weeklyAllowance,
          totalUsed,
          totalConsumed: progress.totalConsumed,
          totalBurned: progress.totalBurned,
          remaining,
          daysLeft,
          dailyAverage, // This is for showing redistributed calories in the "Daily Average" section
          avgDailyConsumption: Math.round(avgDailyConsumption),
          avgDailyBurned: Math.round(avgDailyBurned),
          projectedOutcome,
          safeToEatToday: Math.max(0, get().getLockedDailyTarget() || get().lockDailyTarget()), // Use locked daily target (stable all day)
          activeBankingPlan,
          isBankingAdjusted
        };
        // END OF TEMPORARILY DISABLED CODE
      },
      */

      getWeightTrend: () => {
        const { weightEntries } = get();
        
        if (weightEntries.length === 0) return null;

        // Sort entries by date (most recent first)
        const sortedEntries = [...weightEntries].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const current = sortedEntries[0]?.weight || 0;

        // Calculate 7-day average
        const last7Days = sortedEntries.slice(0, 7);
        const sevenDayAverage = last7Days.length > 0 
          ? last7Days.reduce((sum, entry) => sum + entry.weight, 0) / last7Days.length
          : current;

        // Calculate weekly change (comparing current to 7 days ago)
        let weeklyChange = 0;
        if (sortedEntries.length >= 7) {
          const weekAgoWeight = sortedEntries[6].weight;
          weeklyChange = current - weekAgoWeight;
        } else if (sortedEntries.length >= 2) {
          // If less than 7 days, compare to oldest available
          const oldestWeight = sortedEntries[sortedEntries.length - 1].weight;
          weeklyChange = current - oldestWeight;
        }

        // Determine trend direction
        let trend: 'up' | 'down' | 'stable';
        if (weeklyChange > 0.5) {
          trend = 'up';
        } else if (weeklyChange < -0.5) {
          trend = 'down';
        } else {
          trend = 'stable';
        }

        return {
          current,
          sevenDayAverage,
          trend,
          weeklyChange,
        };
      },

      // Recovery computed values
      getActiveRecoverySession: () => {
        return get().recoveryState.activeRecoverySession || null;
      },

      getPendingOvereatingEvent: () => {
        const { recoveryState } = get();
        return recoveryState.recentOvereatingEvents.find(
          event => !event.userAcknowledged
        ) || null;
      },

      getRecoveryHistory: () => {
        return get().recoveryState.recoveryHistory || [];
      },

      isRecoveryModeEnabled: () => {
        return get().recoveryState.settings.enableRecoveryMode;
      },

      // Actions
      setWeeklyGoal: (goal: WeeklyCalorieGoal) => {
        const { weeklyData } = get();
        
        // Calculate existing consumption and burn for intelligent transition
        const totalConsumed = weeklyData.reduce((sum, day) => sum + day.consumed, 0);
        const totalBurned = weeklyData.reduce((sum, day) => sum + day.burned, 0);
        
        // Calculate remaining days in the week
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const daysDiff = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
        const currentDayIndex = Math.max(0, Math.min(6, daysDiff));
        const remainingDays = 7 - currentDayIndex;
        
        // Create intelligent weekly goal that accounts for existing consumption
        let adjustedGoal = goal;
        
        if (totalConsumed > 0 || totalBurned > 0) {
          // User has existing data this week - adjust the goal intelligently
          const netConsumed = totalConsumed - totalBurned;
          const remainingBudget = goal.totalTarget - netConsumed;
          
          console.log('🧠 [CalorieStore] Intelligent goal transition:', {
            existingConsumed: totalConsumed,
            existingBurned: totalBurned,
            netConsumed,
            newGoalTotal: goal.totalTarget,
            remainingBudget,
            remainingDays,
            avgDailyRemaining: remainingDays > 0 ? Math.round(remainingBudget / remainingDays) : 0
          });
          
          // Adjust the weekly allowance based on what's already happened
          adjustedGoal = {
            ...goal,
            currentWeekAllowance: Math.max(0, remainingBudget), // Don't allow negative budgets
            weeklyAllowance: goal.totalTarget, // Keep original total for reference
          };
        }
        
        set({ currentWeekGoal: adjustedGoal, error: null });
        
        // Clear any locked daily targets and update base targets since we have a new goal
        // This prevents old locked targets from interfering with new AI recommendations
        set(state => ({
          weeklyData: state.weeklyData.map(dayData => ({
            ...dayData,
            target: adjustedGoal.dailyBaseline, // Update base target to new daily baseline
            lockedDailyTarget: undefined,
            targetLockedAt: undefined
          }))
        }));
        
        console.log('🔓 [setWeeklyGoal] Cleared locked targets and updated base targets to:', adjustedGoal.dailyBaseline);
        
        // Auto-backup after setting weekly goal (critical operation)
        setTimeout(() => {
          get().createBackup().catch(error => {
            console.log('Background backup failed (non-critical):', error.message);
          });
        }, 1000);
      },

      logMeal: (meal: Omit<MealEntry, 'id' | 'timestamp'>) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const newMeal: MealEntry = {
          ...meal,
          id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };

        set(state => {
          const weeklyData = [...state.weeklyData];
          const todayIndex = weeklyData.findIndex(data => data.date === today);
          
          if (todayIndex >= 0) {
            // Update existing day
            weeklyData[todayIndex] = {
              ...weeklyData[todayIndex],
              meals: [...weeklyData[todayIndex].meals, newMeal],
              consumed: weeklyData[todayIndex].consumed + meal.calories
            };
          } else {
            // Create new day entry
            const redistribution = get().getCalorieRedistribution();
            const defaultTarget = redistribution?.recommendedDailyTargets[0] || 
                                 state.currentWeekGoal?.dailyBaseline || get().getReasonableCalorieFallback();
            
            weeklyData.push({
              date: today,
              consumed: meal.calories,
              burned: 0,
              target: defaultTarget,
              meals: [newMeal]
            });
          }
          
          return { weeklyData, error: null };
        });
        
        // Check for potential overeating event after meal logging
        setTimeout(() => {
          get().checkForOvereatingEvent(today);
        }, 100); // Small delay to ensure state is updated
        
        // Background sync of today's Garmin active calories
        setTimeout(() => {
          get().syncGarminActiveCalories(today).catch(error => {
            // Silent fail - just log the error
            console.log('Background Garmin sync failed (non-critical):', error.message);
          });
        }, 1000); // Delay to avoid blocking UI
      },

      // NEW - Update daily calorie total (simplified logging)
      updateDailyCalories: (totalCalories: number) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        set(state => {
          const weeklyData = [...state.weeklyData];
          const todayIndex = weeklyData.findIndex(data => data.date === today);
          
          if (todayIndex >= 0) {
            // FIXED: Add to existing meals instead of replacing them
            const existingMeals = weeklyData[todayIndex].meals || [];
            const simplifiedMeal: MealEntry = {
              id: `simplified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: `Quick Add - ${totalCalories} cal`,
              calories: totalCalories,
              category: 'snack', // Use 'snack' as default for quick adds
              macros: {
                protein: Math.round(totalCalories * 0.15 / 4), // 15% protein estimate
                carbohydrates: Math.round(totalCalories * 0.50 / 4), // 50% carbs estimate  
                fat: Math.round(totalCalories * 0.35 / 9),     // 35% fat estimate
              },
              timestamp: new Date()
            };

            const updatedMeals = [...existingMeals, simplifiedMeal]; // Add to existing meals
            const newTotalConsumed = updatedMeals.reduce((sum, meal) => sum + meal.calories, 0);

            weeklyData[todayIndex] = {
              ...weeklyData[todayIndex],
              meals: updatedMeals, // Keep existing meals + add new one
              consumed: newTotalConsumed // Update total based on all meals
            };
          } else {
            // Create new day entry
            const redistribution = get().getCalorieRedistribution();
            const defaultTarget = redistribution?.recommendedDailyTargets[0] || 
                                 state.currentWeekGoal?.dailyBaseline || get().getReasonableCalorieFallback();
            
            const simplifiedMeal: MealEntry = {
              id: `simplified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: `Daily Total - ${format(new Date(), 'MMM d')}`,
              calories: totalCalories,
              category: 'lunch',
              macros: {
                protein: Math.round(totalCalories * 0.15 / 4),
                carbohydrates: Math.round(totalCalories * 0.50 / 4),
                fat: Math.round(totalCalories * 0.35 / 9),
              },
              timestamp: new Date()
            };
            
            weeklyData.push({
              date: today,
              consumed: totalCalories,
              burned: 0,
              target: defaultTarget,
              meals: [simplifiedMeal]
            });
          }
          
          return { weeklyData, error: null };
        });

        // Clean up stale recovery events after calorie update
        setTimeout(() => {
          get().cleanupStaleRecoveryEvents(today);
        }, 100);

        // Background sync of today's Garmin active calories
        setTimeout(() => {
          get().syncGarminActiveCalories(today).catch(error => {
            console.log('Background Garmin sync failed (non-critical):', error.message);
          });
        }, 1000);
      },

      updateBurnedCalories: (date: string, burnedCalories: number) => {
        set(state => {
          const weeklyData = [...state.weeklyData];
          const dayIndex = weeklyData.findIndex(data => data.date === date);
          
          if (dayIndex >= 0) {
            weeklyData[dayIndex] = {
              ...weeklyData[dayIndex],
              burned: burnedCalories
            };
          } else {
            // Create new day entry
            const redistribution = get().getCalorieRedistribution();
            const defaultTarget = redistribution?.recommendedDailyTargets[0] || 
                                 state.currentWeekGoal?.dailyBaseline || get().getReasonableCalorieFallback();
            
            weeklyData.push({
              date,
              consumed: 0,
              burned: burnedCalories,
              target: defaultTarget,
              meals: []
            });
          }
          
          return { weeklyData, error: null };
        });
      },

      syncGarminActiveCalories: async (date: string) => {
        try {
          console.log(`🔄 [CalorieStore] Starting Garmin sync for date: ${date}`);
          
          // Check authentication status first
          const isAuthenticated = garminProxyService.isAuthenticated();
          console.log(`🔐 [CalorieStore] Garmin authentication status: ${isAuthenticated}`);
          
          if (!isAuthenticated) {
            console.log('⚠️ [CalorieStore] Garmin not authenticated, cannot sync active calories');
            return;
          }

          // Use the shared singleton instance that maintains session state
          console.log('🌐 [CalorieStore] Calling garminProxyService.getDailySummary...');
          const dailySummary = await garminProxyService.getDailySummary(date);
          console.log('📊 [CalorieStore] Received daily summary:', dailySummary);
          
          // Check if we have any active calories (even if 0 - could be valid)
          if (dailySummary) {
            console.log(`✅ [CalorieStore] Got data from Garmin: ${dailySummary.activeCalories} active calories`);
            
            // Always update the burned calories - even if 0 (to clear old data)
            get().updateBurnedCalories(date, dailySummary.activeCalories || 0);
            console.log(`📱 [CalorieStore] Updated burned calories for ${date}: ${dailySummary.activeCalories || 0} kcal`);
            
            // Verify the update worked by checking the store
            const todayData = get().getTodaysData();
            console.log(`🔍 [CalorieStore] Store verification after update:`);
            console.log(`   - Date: ${todayData?.date}`);
            console.log(`   - Burned calories: ${todayData?.burned || 0}`);
            console.log(`   - Consumed calories: ${todayData?.consumed || 0}`);
            console.log(`   - Target calories: ${todayData?.target || 0}`);
            
            // Double check by getting all weekly data
            const weeklyData = get().weeklyData;
            const todayEntry = weeklyData.find(day => day.date === date);
            console.log(`🔍 [CalorieStore] Weekly data verification for ${date}:`, todayEntry ? {
              date: todayEntry.date,
              burned: todayEntry.burned,
              consumed: todayEntry.consumed,
              target: todayEntry.target
            } : 'NOT FOUND');
            
          } else {
            console.log(`❌ [CalorieStore] No daily summary received from Garmin for ${date}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ [CalorieStore] Failed to sync Garmin calories for ${date}:`, errorMessage);
          console.error(`❌ [CalorieStore] Full error:`, error);
          
          // Provide more specific error context
          if (errorMessage.includes('Not authenticated')) {
            console.log('💡 [CalorieStore] Authentication issue - session may have expired. Try reconnecting Garmin in settings.');
          } else if (errorMessage.includes('proxy server')) {
            console.log('💡 [CalorieStore] Proxy server connection issue - check if garmin-proxy-server is running.');
          }
          
          // Don't throw error - just log it, as this is background sync
        }
      },

      syncCurrentWeekGarminData: async () => {
        const state = get();
        const currentWeekGoal = state.currentWeekGoal;
        
        if (!currentWeekGoal) {
          console.log('⚠️ [CalorieStore] No current week goal set, skipping Garmin sync');
          return;
        }
        
        try {
          // Generate all dates for current week
          const weekStart = new Date(currentWeekGoal.weekStartDate);
          const dates = [];
          for (let i = 0; i < 7; i++) {
            const date = addDays(weekStart, i);
            const dateString = format(date, 'yyyy-MM-dd');
            dates.push(dateString);
          }
          
          // Sync Garmin data for each day of the week
          console.log(`🔄 [CalorieStore] Syncing Garmin data for current week: ${dates[0]} to ${dates[6]}`);
          
          // Use Promise.allSettled to prevent one failure from stopping others
          const results = await Promise.allSettled(
            dates.map(date => get().syncGarminActiveCalories(date))
          );
          
          const successful = results.filter(result => result.status === 'fulfilled').length;
          const failed = results.filter(result => result.status === 'rejected').length;
          
          console.log(`✅ [CalorieStore] Garmin sync completed: ${successful} successful, ${failed} failed`);
          
        } catch (error) {
          console.error('❌ [CalorieStore] Failed to sync current week Garmin data:', error);
        }
      },

      deleteMeal: (mealId: string, date: string) => {
        set(state => {
          const weeklyData = [...state.weeklyData];
          const dayIndex = weeklyData.findIndex(data => data.date === date);
          
          if (dayIndex >= 0) {
            const day = weeklyData[dayIndex];
            const mealToDelete = day.meals.find(meal => meal.id === mealId);
            
            if (mealToDelete) {
              weeklyData[dayIndex] = {
                ...day,
                meals: day.meals.filter(meal => meal.id !== mealId),
                consumed: day.consumed - mealToDelete.calories
              };
            }
          }
          
          return { weeklyData, error: null };
        });
        
        // Clean up stale recovery events after meal deletion
        setTimeout(() => {
          get().cleanupStaleRecoveryEvents(date);
        }, 100);
      },

      editMeal: (mealId: string, date: string, updatedMeal: Partial<MealEntry>) => {
        set(state => {
          const weeklyData = [...state.weeklyData];
          const dayIndex = weeklyData.findIndex(data => data.date === date);
          
          if (dayIndex >= 0) {
            const day = weeklyData[dayIndex];
            const mealIndex = day.meals.findIndex(meal => meal.id === mealId);
            
            if (mealIndex >= 0) {
              const oldCalories = day.meals[mealIndex].calories;
              const newCalories = updatedMeal.calories || oldCalories;
              
              weeklyData[dayIndex] = {
                ...day,
                meals: day.meals.map(meal => 
                  meal.id === mealId 
                    ? { ...meal, ...updatedMeal }
                    : meal
                ),
                consumed: day.consumed - oldCalories + newCalories
              };
            }
          }
          
          return { weeklyData, error: null };
        });
        
        // Clean up stale recovery events after meal edit
        setTimeout(() => {
          get().cleanupStaleRecoveryEvents(date);
        }, 100);
      },

      initializeWeek: (weekStartDate?: Date) => {
        const startDate = weekStartDate || startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
        const weekStart = format(startDate, 'yyyy-MM-dd');
        
        // Only handle migration case - DO NOT create default goals
        if (get().currentWeekGoal && !get().goalConfiguration) {
          // Handle case where currentWeekGoal exists but goalConfiguration doesn't
          // This might happen after app updates or data migration
          const existingGoalConfig = get().currentWeekGoal?.goalConfig;
          if (existingGoalConfig) {
            console.log('🔄 [CalorieStore] Found goalConfig in currentWeekGoal, migrating to root goalConfiguration');
            set({ goalConfiguration: existingGoalConfig });
          }
        }
        
        // Only initialize week data if we have a valid goal configuration
        if (!get().goalConfiguration) {
          console.log('⚠️ [CalorieStore] No goal configuration found, skipping week initialization');
          return;
        }
        
        // Initialize empty week data if not exists
        const existingDates = get().weeklyData.map(data => data.date);
        const weekDates = Array.from({ length: 7 }, (_, i) => 
          format(addDays(startDate, i), 'yyyy-MM-dd')
        );
        
        const missingDates = weekDates.filter(date => !existingDates.includes(date));
        
        if (missingDates.length > 0) {
          set(state => {
            const newDays: DailyCalorieData[] = missingDates.map(date => ({
              date,
              consumed: 0,
              burned: 0,
              target: state.currentWeekGoal?.dailyBaseline || get().getReasonableCalorieFallback(),
              meals: []
            }));
            
            return {
              weeklyData: [...state.weeklyData, ...newDays].sort((a, b) => 
                a.date.localeCompare(b.date)
              )
            };
          });
        }
        
        // Handle migration and Monday reset logic
        const currentWeekGoal = get().currentWeekGoal;
        if (currentWeekGoal) {
          const today = new Date();
          const isMonday = today.getDay() === 1; // Monday = 1
          const todayString = format(today, 'yyyy-MM-dd');
          const isWeekStart = todayString === weekStart;
          
          // DEBUG: Monday reset troubleshooting
          console.log('🔍 [CalorieStore] Monday reset debug:');
          console.log(`   Today: ${todayString} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][today.getDay()]})`);
          console.log(`   Week start (calculated): ${weekStart}`);
          console.log(`   Week start (stored goal): ${currentWeekGoal.weekStartDate}`);
          console.log(`   Is Monday: ${isMonday}`);
          console.log(`   Is week start: ${isWeekStart}`);
          console.log(`   Current allowance: ${currentWeekGoal.currentWeekAllowance}`);
          console.log(`   Weekly allowance: ${currentWeekGoal.weeklyAllowance}`);
          console.log(`   Allowances different: ${currentWeekGoal.currentWeekAllowance !== currentWeekGoal.weeklyAllowance}`);
          
          // Check if we have old data that needs cleanup regardless of allowance status
          const currentWeekDates = weekDates;
          const oldData = get().weeklyData.filter(day => !currentWeekDates.includes(day.date));
          if (isMonday && oldData.length > 0) {
            console.log('🗑️ [CalorieStore] Found old weekly data that needs cleanup on Monday:', oldData.map(d => `${d.date}(${d.consumed}cal)`));
          }
          
          // Migration: If currentWeekAllowance is missing, set it based on current logic
          if (currentWeekGoal.currentWeekAllowance === undefined) {
            console.log('🔄 [CalorieStore] Migration: Adding missing currentWeekAllowance field');
            const currentDayOfWeek = today.getDay();
            const mondayBasedDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
            const daysRemaining = 7 - mondayBasedDay;
            const proportionalAllowance = currentWeekGoal.dailyBaseline * daysRemaining;
            
            // Debug logging to help troubleshoot
            console.log(`🐛 [DEBUG] Today: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayOfWeek]} (${currentDayOfWeek})`);
            console.log(`🐛 [DEBUG] mondayBasedDay: ${mondayBasedDay}`);
            console.log(`🐛 [DEBUG] daysRemaining: ${daysRemaining}`);
            console.log(`🐛 [DEBUG] dailyBaseline from goal: ${currentWeekGoal.dailyBaseline}`);
            console.log(`🐛 [DEBUG] weeklyAllowance from goal: ${currentWeekGoal.weeklyAllowance}`);
            console.log(`🐛 [DEBUG] Calculated proportionalAllowance: ${currentWeekGoal.dailyBaseline} × ${daysRemaining} = ${proportionalAllowance}`);
            
            const updatedGoal = {
              ...currentWeekGoal,
              currentWeekAllowance: proportionalAllowance // Set proportional allowance for current partial week
            };
            
            set({ currentWeekGoal: updatedGoal });
            console.log(`   Set currentWeekAllowance to ${proportionalAllowance} for ${daysRemaining} remaining days`);
          }
          // Monday reset: Check if we've moved to a new week (week start date has changed)
          else if (isMonday && currentWeekGoal.weekStartDate !== weekStart) {
            console.log('📅 [CalorieStore] Monday reset: updating currentWeekAllowance to full weekly allowance');
            console.log(`   Previous: ${currentWeekGoal.currentWeekAllowance} → New: ${currentWeekGoal.weeklyAllowance}`);
            
            // Clear old weekly data from previous week
            const currentWeekDates = weekDates; // These are the current week's dates
            const oldDataToRemove = get().weeklyData.filter(day => !currentWeekDates.includes(day.date));
            console.log('🗑️ [CalorieStore] Clearing old weekly data:', oldDataToRemove.map(d => `${d.date}(${d.consumed}cal)`));
            
            // Calculate previous week balance for carryover
            let carryoverBalance = 0;
            if (oldDataToRemove.length > 0) {
              carryoverBalance = get().calculatePreviousWeekBalance(oldDataToRemove, currentWeekGoal);
              console.log(`💰 [CalorieStore] Previous week balance: ${carryoverBalance} (will be applied to new week)`);
            }
            
            const updatedGoal = {
              ...currentWeekGoal,
              currentWeekAllowance: currentWeekGoal.weeklyAllowance + carryoverBalance, // Apply carryover to new week allowance
              weekStartDate: weekStart // Update to current week start date
            };
            
            console.log(`📊 [CalorieStore] New week allowance: ${currentWeekGoal.weeklyAllowance} + ${carryoverBalance} = ${updatedGoal.currentWeekAllowance}`);
            
            // Update goal and clear old data
            set(state => ({
              currentWeekGoal: updatedGoal,
              weeklyData: state.weeklyData.filter(day => currentWeekDates.includes(day.date))
            }));
          }
          // Alternative: Check if we need to reset for new week even if stored weekStartDate is old
          else if (isMonday && currentWeekGoal.weekStartDate !== weekStart) {
            console.log('📅 [CalorieStore] New week detected: updating for new week start');
            console.log(`   Old week start: ${currentWeekGoal.weekStartDate} → New: ${weekStart}`);
            console.log(`   Previous allowance: ${currentWeekGoal.currentWeekAllowance} → New: ${currentWeekGoal.weeklyAllowance}`);
            
            // Clear old weekly data from previous week
            const currentWeekDates = weekDates; // These are the current week's dates
            const oldDataToRemove = get().weeklyData.filter(day => !currentWeekDates.includes(day.date));
            console.log('🗑️ [CalorieStore] Clearing old weekly data:', oldDataToRemove.map(d => `${d.date}(${d.consumed}cal)`));
            
            // Calculate previous week balance for carryover
            let carryoverBalance = 0;
            if (oldDataToRemove.length > 0) {
              carryoverBalance = get().calculatePreviousWeekBalance(oldDataToRemove, currentWeekGoal);
              console.log(`💰 [CalorieStore] Previous week balance: ${carryoverBalance} (will be applied to new week)`);
            }
            
            const updatedGoal = {
              ...currentWeekGoal,
              currentWeekAllowance: currentWeekGoal.weeklyAllowance + carryoverBalance, // Apply carryover to new week allowance
              weekStartDate: weekStart // Update to current week start date
            };
            
            console.log(`📊 [CalorieStore] New week allowance: ${currentWeekGoal.weeklyAllowance} + ${carryoverBalance} = ${updatedGoal.currentWeekAllowance}`);
            
            // Update goal and clear old data
            set(state => ({
              currentWeekGoal: updatedGoal,
              weeklyData: state.weeklyData.filter(day => currentWeekDates.includes(day.date))
            }));
          }
          // Additional cleanup: Remove old data on Monday even if allowances are already correct
          else if (isMonday && oldData.length > 0) {
            console.log('🗑️ [CalorieStore] Monday cleanup: removing old weekly data even though allowances are correct');
            console.log(`   Removing ${oldData.length} old entries:`, oldData.map(d => `${d.date}(${d.consumed}cal)`));
            
            set(state => ({
              weeklyData: state.weeklyData.filter(day => currentWeekDates.includes(day.date))
            }));
          }
        }
      },

      forceWeeklyReset: () => {
        console.log('🔄 [CalorieStore] Force weekly reset triggered by admin');
        
        const currentWeekGoal = get().currentWeekGoal;
        if (!currentWeekGoal) {
          console.log('❌ [CalorieStore] No current week goal found');
          return;
        }

        const today = new Date();
        const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const weekDates = Array.from({ length: 7 }, (_, i) => 
          format(addDays(startOfWeek(today, { weekStartsOn: 1 }), i), 'yyyy-MM-dd')
        );

        console.log(`📅 [CalorieStore] Forcing reset from ${currentWeekGoal.weekStartDate} to ${weekStart}`);

        // Clear old weekly data from previous week
        const currentWeekDates = weekDates;
        const oldDataToRemove = get().weeklyData.filter(day => !currentWeekDates.includes(day.date));
        console.log('🗑️ [CalorieStore] Force clearing old weekly data:', oldDataToRemove.map(d => `${d.date}(${d.consumed}cal)`));

        // Calculate previous week balance for carryover
        let carryoverBalance = 0;
        if (oldDataToRemove.length > 0) {
          carryoverBalance = get().calculatePreviousWeekBalance(oldDataToRemove, currentWeekGoal);
          console.log(`💰 [CalorieStore] Previous week balance: ${carryoverBalance} (will be applied to new week)`);
        }

        const updatedGoal = {
          ...currentWeekGoal,
          currentWeekAllowance: currentWeekGoal.weeklyAllowance + carryoverBalance, // Apply carryover to new week allowance
          weekStartDate: weekStart // Update to current week start date
        };

        console.log(`📊 [CalorieStore] Force reset: New week allowance: ${currentWeekGoal.weeklyAllowance} + ${carryoverBalance} = ${updatedGoal.currentWeekAllowance}`);

        // Update goal and clear old data
        set(state => ({
          currentWeekGoal: updatedGoal,
          weeklyData: state.weeklyData.filter(day => currentWeekDates.includes(day.date))
        }));

        console.log('✅ [CalorieStore] Force weekly reset completed');
      },

      // NEW - Log workout session
      logWorkout: (workout: Omit<WorkoutSession, 'id' | 'timestamp'>) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const newWorkout: WorkoutSession = {
          ...workout,
          id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };

        set(state => {
          const weeklyData = [...state.weeklyData];
          const todayIndex = weeklyData.findIndex(data => data.date === today);
          
          if (todayIndex >= 0) {
            // Update existing day
            const currentDay = weeklyData[todayIndex];
            weeklyData[todayIndex] = {
              ...currentDay,
              workouts: [...(currentDay.workouts || []), newWorkout],
              burned: currentDay.burned + workout.caloriesBurned
            };
          } else {
            // Create new day entry
            const redistribution = get().getCalorieRedistribution();
            const defaultTarget = redistribution?.recommendedDailyTargets[0] || 
                                 state.currentWeekGoal?.dailyBaseline || get().getReasonableCalorieFallback();
            
            weeklyData.push({
              date: today,
              consumed: 0,
              burned: workout.caloriesBurned,
              target: defaultTarget,
              meals: [],
              workouts: [newWorkout]
            });
          }
          
          return { weeklyData, error: null };
        });
      },

      // NEW - Update water intake
      updateWaterIntake: (glasses: number) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        set(state => {
          const weeklyData = [...state.weeklyData];
          const todayIndex = weeklyData.findIndex(data => data.date === today);
          
          if (todayIndex >= 0) {
            // Update existing day
            weeklyData[todayIndex] = {
              ...weeklyData[todayIndex],
              waterGlasses: Math.max(0, glasses)
            };
          } else {
            // Create new day entry
            const redistribution = get().getCalorieRedistribution();
            const defaultTarget = redistribution?.recommendedDailyTargets[0] || 
                                 state.currentWeekGoal?.dailyBaseline || get().getReasonableCalorieFallback();
            
            weeklyData.push({
              date: today,
              consumed: 0,
              burned: 0,
              target: defaultTarget,
              meals: [],
              waterGlasses: Math.max(0, glasses)
            });
          }
          
          return { weeklyData, error: null };
        });
      },

      // NEW - Get daily progress for the daily logging screen
      getDailyProgress: (): DailyProgress | null => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayData = get().getTodaysData();
        
        if (!todayData) return null;

        // Calculate macro totals from meals
        const macroTotals = todayData.meals.reduce(
          (totals, meal) => {
            if (meal.macros) {
              totals.protein += meal.macros.protein;
              totals.carbs += meal.macros.carbohydrates;
              totals.fat += meal.macros.fat;
            }
            return totals;
          },
          { protein: 0, carbs: 0, fat: 0 }
        );

        // Use locked daily target (set once per day) instead of dynamic banking target
        const lockedTarget = get().getLockedDailyTarget(today);
        const correctDailyTarget = lockedTarget !== null ? lockedTarget : get().lockDailyTarget(today);
        
        console.log(`🎯 [getDailyProgress] Using locked daily target: ${correctDailyTarget} (locked: ${lockedTarget !== null ? 'YES' : 'JUST_LOCKED'}, static: ${todayData.target})`);

        const goalConfig = get().goalConfiguration;
        const userWeight = goalConfig?.targetGoals.weight?.current || 70; // 70kg fallback
        
        const macroTargets = {
          protein: Math.round(userWeight * 2.2), // 2.2g per kg bodyweight
          carbs: Math.round(correctDailyTarget * 0.45 / 4), // 45% of calories from carbs
          fat: Math.round(correctDailyTarget * 0.25 / 9), // 25% of calories from fat
        };

        return {
          date: today,
          calories: {
            consumed: todayData.consumed,
            burned: todayData.burned,
            target: correctDailyTarget,
            remaining: correctDailyTarget - todayData.consumed + todayData.burned
          },
          macros: {
            protein: { current: macroTotals.protein, target: macroTargets.protein },
            carbs: { current: macroTotals.carbs, target: macroTargets.carbs },
            fat: { current: macroTotals.fat, target: macroTargets.fat }
          },
          water: {
            glasses: todayData.waterGlasses || 0,
            target: get().calculateWaterTarget() // Calculate based on body weight and activity
          },
          meals: todayData.meals,
          workouts: todayData.workouts || []
        };
      },

      // NEW action method
      setGoalConfiguration: (config: GoalConfiguration) => {
        console.log('🏪 [CalorieStore] Setting goal configuration:', {
          mode: config.mode,
          performanceMode: config.performanceMode,
          hasAthleteConfig: !!config.athleteConfig,
          hasTargetGoals: !!config.targetGoals
        });
        set({ goalConfiguration: config, error: null });
        console.log('✅ [CalorieStore] Goal configuration set, triggering persistence...');
        
        // Auto-backup after setting goal configuration (critical operation)
        setTimeout(() => {
          get().createBackup().catch(error => {
            console.log('Background backup failed (non-critical):', error.message);
          });
        }, 1000);
      },

      // NEW weight tracking action method
      addWeightEntry: (weight: number) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        const newWeightEntry: WeightEntry = {
          date: today,
          weight,
          timestamp: new Date(),
        };

        set(state => {
          // Remove any existing entry for today and add the new one
          const filteredEntries = state.weightEntries.filter(entry => entry.date !== today);
          return {
            weightEntries: [...filteredEntries, newWeightEntry].sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
            error: null
          };
        });
      },

      // Historical Data Analysis methods
      getUserMetabolismProfile: () => {
        const state = get();
        const analyzer = get().getHistoricalDataAnalyzer();
        return analyzer ? analyzer.analyzeUserMetabolism() : null;
      },

      getPersonalizedCalorieRecommendation: (
        goalType: 'weight_loss' | 'weight_gain' | 'maintenance',
        targetWeeklyChange: number = 0
      ) => {
        const state = get();
        const analyzer = get().getHistoricalDataAnalyzer();
        return analyzer ? analyzer.generatePersonalizedRecommendation(goalType, targetWeeklyChange) : null;
      },

      getHistoricalDataAnalyzer: () => {
        const state = get();
        
        if (!state.goalConfiguration?.athleteConfig) {
          return null;
        }
        
        const { athleteConfig } = state.goalConfiguration;
        
        return new HistoricalDataAnalyzer(
          state.weeklyData,
          state.weightEntries,
          athleteConfig.profile.physicalStats.age,
          athleteConfig.profile.physicalStats.gender === 'other' ? 'female' : athleteConfig.profile.physicalStats.gender,
          athleteConfig.profile.physicalStats.height,
          athleteConfig.profile.trainingProfile.currentFitnessLevel === 'beginner' ? 'light' :
          athleteConfig.profile.trainingProfile.currentFitnessLevel === 'intermediate' ? 'moderate' :
          athleteConfig.profile.trainingProfile.currentFitnessLevel === 'advanced' ? 'active' : 'very_active'
        );
      },

      getGarminEnhancedAnalyzer: () => {
        const state = get();
        
        if (!state.goalConfiguration?.athleteConfig) {
          return null;
        }
        
        const { athleteConfig } = state.goalConfiguration;
        
        // For now, create a basic analyzer without Garmin service
        // This will be enhanced when GarminConnectService is available in the store
        // return new GarminEnhancedHistoricalAnalyzer( // Removed for proxy solution
        //   state.weeklyData,
        //   state.weightEntries,
        //   athleteConfig.profile.physicalStats.age,
        //   athleteConfig.profile.physicalStats.gender === 'other' ? 'female' : athleteConfig.profile.physicalStats.gender,
        //   athleteConfig.profile.physicalStats.height,
        //   athleteConfig.profile.trainingProfile.currentFitnessLevel === 'beginner' ? 'light' :
        //   athleteConfig.profile.trainingProfile.currentFitnessLevel === 'intermediate' ? 'moderate' :
        //   athleteConfig.profile.trainingProfile.currentFitnessLevel === 'advanced' ? 'active' : 'very_active',
        //   null // GarminWellnessService will be passed when available
        return null; // Enhanced analyzer removed for proxy-based solution
      },

      isGarminDataAvailable: () => {
        // For now, return false - this will be updated when Garmin integration is fully connected
        return false;
      },

      getSleepEnhancedAnalyzer: () => {
        const state = get();
        
        if (!state.goalConfiguration?.athleteConfig) {
          return null;
        }
        
        const { athleteConfig } = state.goalConfiguration;
        
        // Create sleep-enhanced analyzer without services for now
        // This will be enhanced when GarminConnectService and GarminSleepService are available
        // return new SleepEnhancedHistoricalAnalyzer( // Removed for proxy solution
        //   state.weeklyData,
        //   state.weightEntries,
        //   athleteConfig.profile.physicalStats.age,  
        //   athleteConfig.profile.physicalStats.gender === 'other' ? 'female' : athleteConfig.profile.physicalStats.gender,
        //   athleteConfig.profile.physicalStats.height,
        //   athleteConfig.profile.trainingProfile.currentFitnessLevel === 'beginner' ? 'light' :
        //   athleteConfig.profile.trainingProfile.currentFitnessLevel === 'intermediate' ? 'moderate' :
        //   athleteConfig.profile.trainingProfile.currentFitnessLevel === 'advanced' ? 'active' : 'very_active',
        //   null, // GarminWellnessService
        //   null  // GarminSleepService
        return null; // Sleep analyzer removed for proxy-based solution
      },

      isSleepDataAvailable: () => {
        // For now, return false - this will be updated when sleep integration is fully connected
        return false;
      },

      // NEW: Weekly balance carryover calculation
      calculatePreviousWeekBalance: (previousWeekData: DailyCalorieData[], previousWeekGoal: WeeklyCalorieGoal) => {
        console.log('🔄 [CalorieStore] Calculating previous week balance for carryover');
        console.log(`   Previous week goal: ${previousWeekGoal.weeklyAllowance} allowance`);
        console.log(`   Previous week data points: ${previousWeekData.length}`);
        
        // Calculate total net calories used in previous week
        const totalConsumed = previousWeekData.reduce((sum, day) => sum + day.consumed, 0);
        const totalBurned = previousWeekData.reduce((sum, day) => sum + day.burned, 0);
        const netCaloriesUsed = totalConsumed - totalBurned;
        
        // Calculate the balance (positive = surplus/debt, negative = unused calories)
        const balance = netCaloriesUsed - previousWeekGoal.currentWeekAllowance;
        
        console.log(`   Total consumed: ${totalConsumed}, total burned: ${totalBurned}`);
        console.log(`   Net calories used: ${netCaloriesUsed}`);
        console.log(`   Week allowance: ${previousWeekGoal.currentWeekAllowance}`);
        console.log(`   Balance to carry over: ${balance} (positive = debt, negative = surplus)`);
        
        return balance;
      },

      getAverageCalorieBurn: (days: number = 30) => {
        const state = get();
        const recentData = state.weeklyData
          .filter(day => day.burned > 0)
          .slice(-days);
        
        if (recentData.length === 0) return 0;
        
        const totalBurn = recentData.reduce((sum, day) => sum + day.burned, 0);
        return Math.round(totalBurn / recentData.length);
      },

      getAverageCalorieIntake: (days: number = 30) => {
        const state = get();
        const recentData = state.weeklyData
          .filter(day => day.consumed > 0)
          .slice(-days);
        
        if (recentData.length === 0) return 0;
        
        const totalIntake = recentData.reduce((sum, day) => sum + day.consumed, 0);
        return Math.round(totalIntake / recentData.length);
      },

      getCalorieAccuracy: () => {
        const state = get();
        const daysWithMeals = state.weeklyData.filter(day => day.meals.length > 0);
        
        if (daysWithMeals.length === 0) return 0;
        
        // Calculate how consistent user is with logging
        const totalPossibleDays = state.weeklyData.length;
        return (daysWithMeals.length / Math.max(totalPossibleDays, 1)) * 100;
      },

      getGoalProgress: () => {
        const state = get();
        if (!state.goalConfiguration?.targetGoals) return null;
        
        const { targetGoals } = state.goalConfiguration;
        const currentWeight = state.weightEntries.length > 0 
          ? state.weightEntries[state.weightEntries.length - 1].weight 
          : targetGoals.weight?.current || 0;
        
        const progress: GoalProgress = {};
        
        // Weight progress
        if (targetGoals.weight) {
          const { target, current: startWeight } = targetGoals.weight;
          const totalChange = Math.abs(target - startWeight);
          const currentChange = Math.abs(currentWeight - startWeight);
          const remaining = Math.abs(target - currentWeight);
          const percentComplete = totalChange > 0 ? (currentChange / totalChange) * 100 : 100;
          
          // Calculate if on track based on timeline
          const startDate = new Date(state.goalConfiguration.startDate);
          const daysElapsed = Math.floor((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000));
          const weeksElapsed = Math.floor(daysElapsed / 7) + 1; // Week 1 = days 0-6, Week 2 = days 7-13, etc.
          const expectedChange = (totalChange / (state.goalConfiguration.timeline?.estimatedWeeksToGoal || 12)) * weeksElapsed;
          const onTrack = currentChange >= expectedChange * 0.8; // 20% tolerance
          
          progress.weight = {
            current: currentWeight,
            target,
            remaining,
            percentComplete: Math.min(100, percentComplete),
            onTrack,
            estimatedCompletionDate: get().calculateTimeToGoal(target) 
              ? format(addDays(new Date(), (get().calculateTimeToGoal(target) || 0) * 7), 'yyyy-MM-dd')
              : undefined
          };
        }
        
        // Timeline progress
        if (state.goalConfiguration.timeline?.estimatedWeeksToGoal) {
          const startDate = new Date(state.goalConfiguration.startDate);
          const daysElapsed = Math.floor((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000));
          const weeksElapsed = Math.floor(daysElapsed / 7) + 1; // Week 1 = days 0-6, Week 2 = days 7-13, etc.
          const totalWeeks = state.goalConfiguration.timeline.estimatedWeeksToGoal;
          
          progress.timeline = {
            weeksElapsed,
            totalWeeksPlanned: totalWeeks,
            percentTimeElapsed: (weeksElapsed / totalWeeks) * 100,
            onSchedule: progress.weight?.onTrack ?? true
          };
        }
        
        return progress;
      },

      getGoalPrediction: () => {
        const state = get();
        const goalProgress = get().getGoalProgress();
        const weightTrend = get().getWeightTrend();
        
        if (!goalProgress?.weight || !weightTrend) return null;
        
        const prediction: GoalPrediction = {};
        
        // Weight loss prediction
        if (goalProgress.weight.remaining > 0) {
          const currentRate = Math.abs(weightTrend.weeklyChange);
          const weeksRemaining = currentRate > 0 ? goalProgress.weight.remaining / currentRate : Infinity;
          const requiredRate = goalProgress.weight.remaining / Math.max(1, 
            state.goalConfiguration?.timeline?.estimatedWeeksToGoal || 12);
          
          prediction.weightLoss = {
            predictedDate: weeksRemaining < 104 // Less than 2 years
              ? format(addDays(new Date(), weeksRemaining * 7), 'yyyy-MM-dd')
              : format(addDays(new Date(), 730), 'yyyy-MM-dd'), // Cap at 2 years
            confidence: currentRate >= requiredRate * 0.8 ? 'high' : 
                       currentRate >= requiredRate * 0.5 ? 'medium' : 'low',
            currentWeeklyRate: currentRate,
            requiredWeeklyRate: requiredRate,
            recommendation: currentRate < requiredRate * 0.8 
              ? `Consider increasing weekly deficit by ${Math.round((requiredRate - currentRate) * 7700)} calories`
              : 'You\'re on track to meet your goal!'
          };
        }
        
        return prediction;
      },

      calculateTimeToGoal: (targetWeight: number) => {
        const state = get();
        const weightTrend = get().getWeightTrend();
        
        if (!weightTrend || !state.weightEntries.length) return null;
        
        const currentWeight = state.weightEntries[state.weightEntries.length - 1].weight;
        const weightDifference = Math.abs(targetWeight - currentWeight);
        const weeklyRate = Math.abs(weightTrend.weeklyChange);
        
        if (weeklyRate <= 0.01) return null; // No progress
        
        return Math.ceil(weightDifference / weeklyRate);
      },

      updateTargetWeight: (target: number) => {
        set(state => {
          if (!state.goalConfiguration) return state;
          
          const currentWeight = state.weightEntries.length > 0 
            ? state.weightEntries[state.weightEntries.length - 1].weight 
            : 70; // Default
          
          return {
            ...state,
            goalConfiguration: {
              ...state.goalConfiguration,
              targetGoals: {
                ...state.goalConfiguration.targetGoals,
                weight: {
                  target,
                  current: currentWeight,
                  priority: 'primary'
                }
              }
            }
          };
        });
      },

      resetGoal: () => {
        console.log('🔄 [CalorieStore] Resetting goal configuration');
        set(state => ({
          ...state,
          goalConfiguration: null,
          currentWeekGoal: null,
          error: null
        }));
      },

      resetCompletely: () => {
        console.log('🔄 [CalorieStore] Resetting everything - goal and weekly data');
        set(state => ({
          ...state,
          goalConfiguration: null,
          currentWeekGoal: null,
          weeklyData: [],
          weightEntries: [],
          error: null
        }));
      },

      // TEMPORARY METHOD TO FIX INCORRECT TDEE VALUES
      fixTDEEValues: (correctTDEE: number) => {
        console.log(`🔧 [CalorieStore] Fixing stored TDEE values to ${correctTDEE}`);
        const { goalConfiguration } = get();
        if (goalConfiguration) {
          const fixedConfig = {
            ...goalConfiguration,
            enhancedTDEE: correctTDEE,
            standardTDEE: correctTDEE
          };
          console.log('🔧 [CalorieStore] Updated goal configuration with correct TDEE');
          set(state => ({ ...state, goalConfiguration: fixedConfig }));
          
          // Also fix the current week goal if it exists
          const { currentWeekGoal } = get();
          if (currentWeekGoal) {
            const today = new Date();
            const currentDayOfWeek = today.getDay();
            const mondayBasedDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
            const daysRemaining = 7 - mondayBasedDay;
            const correctedAllowance = correctTDEE * daysRemaining;
            
            const fixedGoal = {
              ...currentWeekGoal,
              dailyBaseline: correctTDEE,
              weeklyAllowance: correctTDEE * 7,
              currentWeekAllowance: correctedAllowance
            };
            console.log(`🔧 [CalorieStore] Fixed current week goal - dailyBaseline: ${correctTDEE}, currentWeekAllowance: ${correctedAllowance}`);
            set(state => ({ ...state, currentWeekGoal: fixedGoal }));
          }
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Debug methods for testing persistence
      clearAllData: () => {
        console.log('🧹 [CalorieStore] Clearing all data');
        set({
          currentWeekGoal: null,
          weeklyData: [],
          goalConfiguration: null,
          weightEntries: [],
          error: null
        });
      },

      debugStore: () => {
        const state = get();
        console.log('🔍 [CalorieStore] Current store state:', {
          hasGoalConfiguration: !!state.goalConfiguration,
          goalMode: state.goalConfiguration?.mode,
          hasAthleteConfig: !!state.goalConfiguration?.athleteConfig,
          hasCurrentWeekGoal: !!state.currentWeekGoal,
          weeklyDataCount: state.weeklyData.length,
          weightEntriesCount: state.weightEntries.length
        });
        return state;
      },

      // Auto-backup helper method
      createBackup: async () => {
        try {
          const state = get();
          const success = await BackupService.createBackup({
            currentWeekGoal: state.currentWeekGoal,
            weeklyData: state.weeklyData,
            goalConfiguration: state.goalConfiguration,
            weightEntries: state.weightEntries,
            recoveryState: state.recoveryState,
          });
          
          if (success) {
            console.log('✅ [CalorieStore] Auto-backup created successfully');
          }
          
          return success;
        } catch (error) {
          console.error('❌ [CalorieStore] Auto-backup failed:', error);
          return false;
        }
      },

      // Restore from file system backup
      restoreFromBackup: async () => {
        try {
          console.log('🔄 [CalorieStore] Attempting to restore from backup...');
          
          const backupData = await BackupService.restoreFromBackup();
          if (backupData) {
            set({
              currentWeekGoal: backupData.currentWeekGoal,
              weeklyData: backupData.weeklyData || [],
              goalConfiguration: backupData.goalConfiguration,
              weightEntries: backupData.weightEntries || [],
              recoveryState: backupData.recoveryState || {
                settings: {
                  enableRecoveryMode: false,
                  autoTriggerThreshold: 500,
                  notificationEnabled: true,
                  showRecoveryPlans: true,
                },
                recentOvereatingEvents: [],
                activeRecoverySession: null,
              },
              error: null,
            });
            
            console.log(`✅ [CalorieStore] Data restored from backup created at ${backupData.timestamp}`);
            return true;
          } else {
            console.log('⚠️ [CalorieStore] No backup data found to restore');
            return false;
          }
        } catch (error) {
          console.error('❌ [CalorieStore] Restore from backup failed:', error);
          return false;
        }
      },

      // Helper methods for reasonable fallbacks
      getReasonableCalorieFallback: () => {
        const goalConfig = get().goalConfiguration;
        if (goalConfig && goalConfig.targetGoals.weight) {
          // Estimate TDEE based on basic stats (simplified)
          const weight = goalConfig.targetGoals.weight.current;
          return Math.round(weight * 24); // Rough estimate: 24 kcal/kg bodyweight
        }
        return 2000; // Last resort fallback
      },

      calculateWaterTarget: () => {
        const goalConfig = get().goalConfiguration;
        if (goalConfig && goalConfig.targetGoals.weight) {
          const weight = goalConfig.targetGoals.weight.current;
          // Water intake: 35ml per kg bodyweight (recommended baseline)
          const waterInMl = weight * 35;
          // Convert to 250ml glasses (standard glass size)
          return Math.round(waterInMl / 250);
        }
        return 8; // Default 8 glasses fallback
      },

      // Daily target locking methods
      lockDailyTarget: (date?: string): number => {
        const targetDate = date || format(new Date(), 'yyyy-MM-dd');
        
        // Check if already locked for today
        const existingTarget = get().getLockedDailyTarget(targetDate);
        if (existingTarget !== null) {
          console.log(`🔒 [lockDailyTarget] Target already locked for ${targetDate}: ${existingTarget}`);
          return existingTarget;
        }
        
        // Get the current target for this day (don't recalculate, just lock what's already set)
        const dayData = get().weeklyData.find(data => data.date === targetDate);
        const currentTarget = dayData?.target || 
                              get().currentWeekGoal?.dailyBaseline || 
                              get().getReasonableCalorieFallback();
        
        // Lock the EXISTING target for the day (don't change it)
        set(state => ({
          weeklyData: state.weeklyData.map(dayData => {
            if (dayData.date === targetDate) {
              return {
                ...dayData,
                lockedDailyTarget: currentTarget,
                targetLockedAt: new Date().toISOString()
              };
            }
            return dayData;
          })
        }));
        
        console.log(`🔒 [lockDailyTarget] Locked EXISTING target for ${targetDate}: ${currentTarget} calories (was: ${dayData?.target})`);
        return currentTarget;
      },

      getLockedDailyTarget: (date?: string): number | null => {
        const targetDate = date || format(new Date(), 'yyyy-MM-dd');
        const dayData = get().weeklyData.find(data => data.date === targetDate);
        
        if (dayData?.lockedDailyTarget && dayData.targetLockedAt) {
          const lockDate = new Date(dayData.targetLockedAt).toDateString();
          const currentDate = new Date().toDateString();
          const targetDateObj = new Date(targetDate).toDateString();
          
          // Only check for stale locks if we're asking for TODAY's target
          // Past days should keep their locked targets permanently
          if (targetDateObj === currentDate) {
            // For today, check if lock is fresh (from today)
            if (lockDate === currentDate) {
              return dayData.lockedDailyTarget;
            } else {
              console.log(`🔓 [getLockedDailyTarget] Stale lock detected for today ${targetDate}, ignoring`);
              return null;
            }
          } else {
            // For past days, always return the locked target
            return dayData.lockedDailyTarget;
          }
        }
        
        return null;
      },
      
      // Hydration control methods
      setHasHydrated: (hydrated: boolean): void => {
        console.log('💧 [CalorieStore] setHasHydrated called with:', hydrated);
        set({ _hasHydrated: hydrated });
        console.log('💧 [CalorieStore] _hasHydrated updated to:', hydrated);
      },
      
      setIsFullyReady: (ready: boolean): void => {
        console.log('🚀 [CalorieStore] setIsFullyReady called with:', ready);
        set({ isFullyReady: ready });
        console.log('🚀 [CalorieStore] isFullyReady updated to:', ready);
      },

      // Calorie Banking methods
      createBankingPlan: async (targetDate: string, dailyReduction: number): Promise<boolean> => {
        try {
          const { currentWeekGoal } = get();
          if (!currentWeekGoal) {
            console.log('❌ [CalorieStore] Cannot create banking plan: no active weekly goal');
            return false;
          }

          // Validate the banking plan
          const validation = CalorieBankingService.validateBankingPlan(
            targetDate,
            dailyReduction,
            currentWeekGoal
          );

          if (!validation.isValid) {
            console.log('❌ [CalorieStore] Banking plan validation failed:', validation.errors);
            return false;
          }

          // Create the banking plan
          const bankingPlan = CalorieBankingService.createBankingPlan(
            targetDate,
            dailyReduction,
            currentWeekGoal
          );

          // Update the weekly goal with the banking plan
          const updatedGoal = {
            ...currentWeekGoal,
            bankingPlan
          };

          // Apply banking adjustments to weekly data
          const updatedWeeklyData = CalorieBankingService.applyBankingToWeeklyData(
            get().weeklyData,
            bankingPlan
          );

          set(state => ({
            ...state,
            currentWeekGoal: updatedGoal,
            weeklyData: updatedWeeklyData
          }));

          console.log('✅ [CalorieStore] Banking plan created successfully:', bankingPlan);
          return true;
        } catch (error) {
          console.log('❌ [CalorieStore] Error creating banking plan:', error);
          return false;
        }
      },

      updateBankingPlan: async (targetDate: string, dailyReduction: number): Promise<boolean> => {
        try {
          const { currentWeekGoal } = get();
          if (!currentWeekGoal || !currentWeekGoal.bankingPlan) {
            console.log('❌ [CalorieStore] Cannot update banking plan: no active plan');
            return false;
          }

          // First cancel the existing plan
          get().cancelBankingPlan();

          // Then create the new plan
          return await get().createBankingPlan(targetDate, dailyReduction);
        } catch (error) {
          console.log('❌ [CalorieStore] Error updating banking plan:', error);
          return false;
        }
      },

      cancelBankingPlan: () => {
        const { currentWeekGoal } = get();
        if (!currentWeekGoal || !currentWeekGoal.bankingPlan) {
          console.log('⚠️ [CalorieStore] No active banking plan to cancel');
          return;
        }

        // Remove banking plan from goal
        const updatedGoal = {
          ...currentWeekGoal,
          bankingPlan: undefined
        };

        // Remove banking adjustments from weekly data
        const updatedWeeklyData = CalorieBankingService.cancelBanking(get().weeklyData);

        set(state => ({
          ...state,
          currentWeekGoal: updatedGoal,
          weeklyData: updatedWeeklyData
        }));

        console.log('✅ [CalorieStore] Banking plan cancelled successfully');
      },

      getBankingPlan: (): CalorieBankingPlan | null => {
        const { currentWeekGoal } = get();
        return currentWeekGoal?.bankingPlan || null;
      },

      validateBankingPlan: (targetDate: string, dailyReduction: number): BankingPlanValidation | null => {
        const { currentWeekGoal } = get();
        if (!currentWeekGoal) {
          return null;
        }

        return CalorieBankingService.validateBankingPlan(
          targetDate,
          dailyReduction,
          currentWeekGoal
        );
      },

      isBankingAvailable: (): boolean => {
        const { currentWeekGoal } = get();
        if (!currentWeekGoal) {
          return false;
        }

        return CalorieBankingService.isBankingAvailable(currentWeekGoal.weekStartDate);
      },

      // Recovery management methods
      checkForOvereatingEvent: (date?: string): OvereatingEvent | null => {
        const checkDate = date || format(new Date(), 'yyyy-MM-dd');
        const { recoveryState, currentWeekGoal } = get();
        
        if (!recoveryState.settings.enableRecoveryMode || !currentWeekGoal) {
          return null;
        }
        
        const todayData = get().weeklyData.find(data => data.date === checkDate);
        if (!todayData) {
          return null;
        }
        
        // Use locked daily target for consistent overeating detection
        const lockedTarget = get().getLockedDailyTarget(checkDate);
        const correctDailyTarget = lockedTarget !== null ? lockedTarget : get().lockDailyTarget(checkDate);

        console.log(`🚨 [checkForOvereatingEvent] Using locked target for detection: ${correctDailyTarget} (locked: ${lockedTarget !== null ? 'YES' : 'JUST_LOCKED'}, static: ${todayData.target})`);

        // Get weekly progress for enhanced detection
        const weeklyProgress = get().getCurrentWeekProgress();
        
        // Calculate days elapsed from weekly data
        const today = new Date();
        const weekStart = new Date(currentWeekGoal.weekStartDate);
        const daysElapsed = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
        
        const overeatingEvent = weeklyProgress 
          ? BingeRecoveryCalculator.detectOvereatingEventEnhanced(
              todayData.consumed,
              correctDailyTarget,
              todayData.burned,
              checkDate,
              currentWeekGoal,
              {
                totalConsumed: weeklyProgress.totalConsumed,
                totalBurned: weeklyProgress.totalBurned,
                daysElapsed: Math.max(0, Math.min(6, daysElapsed))
              }
            )
          : BingeRecoveryCalculator.detectOvereatingEvent(
              todayData.consumed,
              correctDailyTarget,
              checkDate
            );
        
        if (overeatingEvent) {
          // Add to recovery state
          set(state => ({
            recoveryState: {
              ...state.recoveryState,
              recentOvereatingEvents: [
                ...state.recoveryState.recentOvereatingEvents.filter(
                  event => event.date !== checkDate // Remove any existing event for this date
                ),
                overeatingEvent
              ]
            }
          }));
          
          console.log('🚨 [Recovery] Overeating event detected:', {
            date: checkDate,
            excess: overeatingEvent.excessCalories,
            trigger: overeatingEvent.triggerType
          });
        }
        
        return overeatingEvent;
      },

      acknowledgeOvereatingEvent: (eventId: string): void => {
        set(state => ({
          recoveryState: {
            ...state.recoveryState,
            recentOvereatingEvents: state.recoveryState.recentOvereatingEvents.map(
              event => event.id === eventId 
                ? { ...event, userAcknowledged: true }
                : event
            )
          }
        }));
      },

      createRecoveryPlan: async (eventId: string): Promise<RecoveryPlan | null> => {
        const { recoveryState, currentWeekGoal, weeklyData, goalConfiguration } = get();
        const event = recoveryState.recentOvereatingEvents.find(e => e.id === eventId);
        
        if (!event || !currentWeekGoal) {
          return null;
        }
        
        const recoveryPlan = BingeRecoveryCalculator.createRecoveryPlan(
          event,
          currentWeekGoal
        );
        
        // Generate AI activity suggestions in the background
        const aiService = new (await import('../services/RecoveryActivityAIService')).RecoveryActivityAIService();
        
        try {
          // Extract recent workout sessions from weekly data for AI analysis
          const recentSessions = weeklyData
            .flatMap(day => day.workouts || [])
            .slice(-7) // Last 7 sessions
            .map(workout => ({
              id: workout.id,
              sport: workout.sport, // Use the sport field from WorkoutSession
              duration: workout.duration || 30, // Default 30min if not specified
              intensity: 'moderate' as const, // Default intensity
              sessionType: workout.name,
              completed: true
            }));
          
          const userWeight = goalConfiguration?.athleteConfig?.profile.physicalStats.weight || 70; // Default fallback weight
          
          const aiSuggestions = await aiService.generateActivitySuggestions({
            overeatingEvent: event,
            weeklyGoal: currentWeekGoal,
            athleteProfile: goalConfiguration?.athleteConfig?.profile,
            recentTrainingSessions: recentSessions,
            excessCalories: event.excessCalories,
            userWeight
          });
          
          if (aiSuggestions.length > 0) {
            recoveryPlan.aiActivitySuggestions = aiSuggestions;
            console.log('🤖 [Recovery] AI generated', aiSuggestions.length, 'activity suggestions');
          }
        } catch (error) {
          console.log('⚠️ [Recovery] AI suggestions failed, continuing without them:', error);
          // Continue without AI suggestions - no fallback needed per requirements
        }
        
        // Store the recovery plan (with or without AI suggestions)
        set(state => ({
          recoveryState: {
            ...state.recoveryState,
            recoveryHistory: [...state.recoveryState.recoveryHistory, recoveryPlan]
          }
        }));
        
        console.log('📋 [Recovery] Recovery plan created:', {
          planId: recoveryPlan.id,
          strategy: recoveryPlan.strategy,
          optionsCount: recoveryPlan.rebalancingOptions.length,
          aiSuggestionsCount: recoveryPlan.aiActivitySuggestions?.length || 0
        });
        
        return recoveryPlan;
      },

      selectRecoveryOption: (recoveryPlanId: string, optionId: string): void => {
        set(state => ({
          recoveryState: {
            ...state.recoveryState,
            recoveryHistory: state.recoveryState.recoveryHistory.map(
              plan => plan.id === recoveryPlanId
                ? { ...plan, selectedOption: optionId }
                : plan
            )
          }
        }));
      },

      startRecoverySession: (recoveryPlanId: string, optionId: string): void => {
        const { recoveryState } = get();
        const recoveryPlan = recoveryState.recoveryHistory.find(p => p.id === recoveryPlanId);
        const selectedOption = recoveryPlan?.rebalancingOptions.find(o => o.id === optionId);
        
        if (!recoveryPlan || !selectedOption) {
          console.error('Recovery plan or option not found');
          return;
        }
        
        const today = new Date();
        const endDate = addDays(today, selectedOption.durationDays);
        
        const recoverySession: RecoverySession = {
          id: `session_${recoveryPlanId}_${Date.now()}`,
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          originalPlan: recoveryPlan,
          progress: {
            daysCompleted: 0,
            daysRemaining: selectedOption.durationDays,
            adherenceRate: 100, // Start at 100%
            adjustedTarget: selectedOption.impact.newDailyTarget,
          },
          status: 'active',
        };
        
        set(state => ({
          recoveryState: {
            ...state.recoveryState,
            activeRecoverySession: recoverySession
          }
        }));
        
        console.log('🎯 [Recovery] Recovery session started:', {
          sessionId: recoverySession.id,
          duration: selectedOption.durationDays,
          newTarget: selectedOption.impact.newDailyTarget
        });
      },

      updateRecoverySettings: (settings: Partial<RecoveryState['settings']>): void => {
        set(state => ({
          recoveryState: {
            ...state.recoveryState,
            settings: {
              ...state.recoveryState.settings,
              ...settings
            }
          }
        }));
      },

      abandonRecoverySession: (): void => {
        set(state => ({
          recoveryState: {
            ...state.recoveryState,
            activeRecoverySession: undefined
          }
        }));
        
        console.log('❌ [Recovery] Recovery session abandoned');
      },

      cleanupStaleRecoveryEvents: (date: string): void => {
        const { currentWeekGoal } = get();
        if (!currentWeekGoal) return;
        
        const todayData = get().weeklyData.find(data => data.date === date);
        if (!todayData) return;
        
        // Use correct daily target from banking system instead of static todayData.target
        const lockedTarget = get().getLockedDailyTarget(date);
        const correctDailyTarget = lockedTarget !== null ? lockedTarget : get().lockDailyTarget(date);

        const excess = todayData.consumed - correctDailyTarget;
        const isStillOvereating = excess > 200; // OVEREATING_THRESHOLDS.mild
        
        console.log(`🧹 [cleanupStaleRecoveryEvents] Using locked target for cleanup: ${correctDailyTarget} (locked: ${lockedTarget !== null ? 'YES' : 'JUST_LOCKED'}), excess: ${excess}`);
        
        // If no longer overeating, remove events for this date
        if (!isStillOvereating) {
          set(state => ({
            recoveryState: {
              ...state.recoveryState,
              recentOvereatingEvents: state.recoveryState.recentOvereatingEvents.filter(
                event => event.date !== date
              )
            }
          }));
          
          console.log('🧹 [Recovery] Cleaned up stale overeating events for', date);
        } else {
          // Still overeating, but may need to update the event with new excess amount
          const existingEvent = get().recoveryState.recentOvereatingEvents.find(
            event => event.date === date && !event.userAcknowledged
          );
          
          if (existingEvent && Math.abs(existingEvent.excessCalories - excess) > 50) {
            // Significant change in excess - update the event
            const weeklyProgress = get().getCurrentWeekProgress();
            
            // Calculate days elapsed from weekly data
            const today = new Date();
            const weekStart = new Date(currentWeekGoal.weekStartDate);
            const daysElapsed = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
            
            const updatedEvent = weeklyProgress 
              ? BingeRecoveryCalculator.detectOvereatingEventEnhanced(
                  todayData.consumed,
                  correctDailyTarget,
                  todayData.burned,
                  date,
                  currentWeekGoal,
                  {
                    totalConsumed: weeklyProgress.totalConsumed,
                    totalBurned: weeklyProgress.totalBurned,
                    daysElapsed: Math.max(0, Math.min(6, daysElapsed))
                  }
                )
              : BingeRecoveryCalculator.detectOvereatingEvent(
                  todayData.consumed,
                  correctDailyTarget,
                  date
                );
            
            if (updatedEvent) {
              set(state => ({
                recoveryState: {
                  ...state.recoveryState,
                  recentOvereatingEvents: state.recoveryState.recentOvereatingEvents.map(
                    event => event.id === existingEvent.id ? updatedEvent : event
                  )
                }
              }));
              
              console.log('🔄 [Recovery] Updated overeating event for', date, 'new excess:', excess);
            }
          }
        }
      }
    }),
    {
      name: 'weekly-calorie-tracker-store',
      storage: {
        getItem: async (name: string) => {
          console.log('📤 [Storage] Getting item:', name);
          const value = await AsyncStorage.getItem(name);
          console.log('📤 [Storage] Got value:', value ? 'EXISTS' : 'NULL');
          if (value) {
            const parsed = JSON.parse(value);
            console.log('📤 [Storage] Parsed goalConfiguration exists:', !!parsed?.state?.goalConfiguration);
            console.log('📤 [Storage] Parsed goalConfiguration mode:', parsed?.state?.goalConfiguration?.mode);
            console.log('📤 [Storage] Full parsed structure keys:', Object.keys(parsed));
            console.log('📤 [Storage] State keys:', Object.keys(parsed?.state || {}));
          }
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name: string, value: any) => {
          console.log('📦 [Storage] Setting item:', name, 'with value:', typeof value);
          await AsyncStorage.setItem(name, JSON.stringify(value));
          console.log('✅ [Storage] Item saved successfully');
        },
        removeItem: async (name: string) => {
          console.log('🗑️ [Storage] Removing item:', name);
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: (state) => {
        const persistedState = {
          currentWeekGoal: state.currentWeekGoal,
          weeklyData: state.weeklyData,
          goalConfiguration: state.goalConfiguration,
          weightEntries: state.weightEntries,
          recoveryState: state.recoveryState,
          _hasHydrated: state._hasHydrated,
        };
        console.log('🔄 [CalorieStore] Persisting state:', persistedState);
        return persistedState;
      },
      onRehydrateStorage: () => {
        console.log('💧 [CalorieStore] onRehydrateStorage callback created');
        
        return (state, error) => {
          console.log('💧 [CalorieStore] ✅ REHYDRATION CALLBACK EXECUTING!');
          console.log('💧 [CalorieStore] State exists:', !!state);
          console.log('💧 [CalorieStore] Error exists:', !!error);
          
          if (error) {
            console.error('❌ [CalorieStore] Rehydration error:', error);
            
            // Attempt to restore from file system backup if AsyncStorage is corrupted
            setTimeout(async () => {
              try {
                console.log('🔄 [CalorieStore] Attempting backup recovery due to rehydration error...');
                const store = useCalorieStore.getState();
                const success = await store.restoreFromBackup();
                if (success) {
                  console.log('✅ [CalorieStore] Successfully recovered from backup after rehydration error');
                } else {
                  console.log('⚠️ [CalorieStore] No backup available for recovery');
                }
              } catch (backupError) {
                console.error('❌ [CalorieStore] Backup recovery failed:', backupError);
              }
            }, 1000);
            return;
          }
          
          if (state) {
            console.log('💧 [CalorieStore] Rehydration state received');
            
            // SAFETY CHECK: Fix corrupted goalConfiguration
            if ((state.goalConfiguration as any) === false) {
              console.log('🚨 [CalorieStore] DETECTED CORRUPTED goalConfiguration (false) - resetting to null');
              state.goalConfiguration = null;
            }
            
            console.log('💧 [CalorieStore] GoalConfig after rehydration:', !!state.goalConfiguration);
            console.log('💧 [CalorieStore] GoalConfig mode:', state.goalConfiguration?.mode);
            
            // Set custom rehydration complete flag - this is our reliable indicator
            // We need to use a setTimeout to ensure this runs after rehydration is complete
            setTimeout(() => {
              try {
                const store = useCalorieStore.getState();
                store.setHasHydrated(true); // Keep for backwards compatibility
                store.setIsFullyReady(true); // NEW: Our reliable flag
                console.log('🚀 [CalorieStore] Rehydration fully complete - app ready to render');
              } catch (error) {
                console.error('❌ [CalorieStore] Error setting rehydration flags:', error);
              }
            }, 0);
          }
          
          console.log('💧 [CalorieStore] Rehydration callback complete');
        };
      }, 
    }
  )
);