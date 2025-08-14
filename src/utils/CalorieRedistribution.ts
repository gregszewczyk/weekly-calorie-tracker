import { 
  WeeklyProgress, 
  CalorieRedistribution, 
  DailyCalorieData,
  WeeklyCalorieGoal 
} from '../types/CalorieTypes';
import { ActivityData } from '../types/ActivityTypes';
import { UserMetabolismProfile } from './HistoricalDataAnalyzer';
import { startOfWeek, addDays, format, isAfter } from 'date-fns';

export class WeeklyCalorieRedistributor {
  private static readonly MIN_DAILY_CALORIES = 1200;
  private static readonly MAX_DAILY_DEFICIT_PERCENTAGE = 0.25; // 25% below baseline

  /**
   * Calculates the redistribution of remaining calories across remaining days of the week
   * Enhanced with historical data analysis for more accurate personalization
   */
  static calculateRedistribution(
    weeklyProgress: WeeklyProgress,
    plannedActivity?: ActivityData[],
    metabolismProfile?: UserMetabolismProfile
  ): CalorieRedistribution {
    const today = new Date();
    
    // TEMPORARY FIX: Use current week start instead of potentially outdated stored weekStartDate
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const currentWeekStartString = format(currentWeekStart, 'yyyy-MM-dd');
    
    console.log('🔄 [Redistribution] Week start comparison:');
    console.log(`   Stored week start: ${weeklyProgress.goal.weekStartDate}`);
    console.log(`   Current week start: ${currentWeekStartString}`);
    
    // Use current week start for day index calculation to ensure accuracy
    const currentDayIndex = this.getCurrentDayIndex(today, currentWeekStartString);
    const remainingDays = 7 - currentDayIndex;
    
    if (remainingDays <= 0) {
      return this.createEmptyRedistribution();
    }

    const remainingCalories = weeklyProgress.remainingCalories;
    
    // DEBUG: Redistribution calculation
    console.log('🔄 [Redistribution] Debugging calorie redistribution:');
    console.log(`   Current day index: ${currentDayIndex}`);
    console.log(`   Remaining days: ${remainingDays}`);
    console.log(`   Remaining calories: ${remainingCalories}`);
    console.log(`   Weekly goal: ${weeklyProgress.goal.totalTarget}`);
    console.log(`   Total consumed: ${weeklyProgress.totalConsumed}`);
    console.log(`   Total burned: ${weeklyProgress.totalBurned}`);
    
    const baseDistribution = this.calculateBaseDistribution(
      remainingCalories, 
      remainingDays, 
      metabolismProfile
    );
    
    console.log('🔄 [Redistribution] Base distribution:', baseDistribution);
    
    // Adjust for planned activity if available, using historical activity patterns
    const adjustedTargets = plannedActivity 
      ? this.adjustForPlannedActivity(baseDistribution, plannedActivity, remainingDays, metabolismProfile)
      : this.adjustForHistoricalPatterns(baseDistribution, metabolismProfile);

    // Ensure minimum calorie thresholds
    const safeTargets = this.enforceMinimumCalories(adjustedTargets);
    
    const adjustmentReason = this.determineAdjustmentReason(
      weeklyProgress, 
      remainingCalories, 
      remainingDays
    );

    return {
      remainingDays,
      remainingCalories,
      recommendedDailyTargets: safeTargets,
      adjustmentReason
    };
  }

  /**
   * Calculates base daily targets without activity adjustments
   */
  private static calculateBaseDistribution(
    remainingCalories: number, 
    remainingDays: number,
    metabolismProfile?: UserMetabolismProfile
  ): number[] {
    let baseDaily = Math.round(remainingCalories / remainingDays);
    
    // Use historical data to improve distribution if available
    if (metabolismProfile && metabolismProfile.confidenceScore > 60) {
      // Adjust based on user's actual patterns vs standard calculations
      const actualVsExpected = metabolismProfile.estimatedTDEE / 
        (metabolismProfile.estimatedBMR * 1.55); // Compare to moderate activity
      
      if (actualVsExpected > 1.1) {
        // User burns more than expected - slightly increase targets
        baseDaily = Math.round(baseDaily * 1.05);
      } else if (actualVsExpected < 0.9) {
        // User burns less than expected - slightly decrease targets
        baseDaily = Math.round(baseDaily * 0.95);
      }
    }
    
    return Array(remainingDays).fill(baseDaily);
  }

  /**
   * Adjusts daily targets based on planned training sessions and historical patterns
   */
  private static adjustForPlannedActivity(
    baseTargets: number[],
    plannedActivity: ActivityData[],
    remainingDays: number,
    metabolismProfile?: UserMetabolismProfile
  ): number[] {
    const adjusted = [...baseTargets];
    const totalBase = baseTargets.reduce((sum, val) => sum + val, 0);
    
    let totalAdjustment = 0;
    
    // Increase calories for high-activity days
    plannedActivity.forEach((activity, index) => {
      if (index < remainingDays) {
        const hasHighIntensityWorkout = activity.workouts.some(
          workout => workout.intensity === 'high' || workout.intensity === 'very-high'
        );
        
        if (hasHighIntensityWorkout) {
          // Use historical data to personalize calorie increase
          let multiplier = 0.3; // Default 30% of burned calories
          
          if (metabolismProfile && metabolismProfile.confidenceScore > 70) {
            // Adjust based on user's actual active vs rest day ratio
            const activeRatio = metabolismProfile.activeVsRestDayRatio;
            if (activeRatio > 2) {
              multiplier = 0.4; // User needs more calories on active days
            } else if (activeRatio < 1.5) {
              multiplier = 0.25; // User needs fewer extra calories
            }
          }
          
          const increase = Math.round(activity.totalCaloriesBurned * multiplier);
          adjusted[index] += increase;
          totalAdjustment += increase;
        }
      }
    });
    
    // Redistribute the extra calories from non-training days
    if (totalAdjustment > 0) {
      const nonTrainingDays = adjusted.filter((_, index) => {
        const activity = plannedActivity[index];
        return !activity?.workouts.some(w => w.intensity === 'high' || w.intensity === 'very-high');
      });
      
      if (nonTrainingDays.length > 0) {
        const reductionPerDay = Math.round(totalAdjustment / nonTrainingDays.length);
        
        adjusted.forEach((calories, index) => {
          const activity = plannedActivity[index];
          const isTrainingDay = activity?.workouts.some(
            w => w.intensity === 'high' || w.intensity === 'very-high'
          );
          
          if (!isTrainingDay) {
            adjusted[index] = Math.max(calories - reductionPerDay, this.MIN_DAILY_CALORIES);
          }
        });
      }
    }
    
    return adjusted;
  }

  /**
   * Adjusts distribution based on historical weekly patterns when no planned activity
   */
  private static adjustForHistoricalPatterns(
    baseTargets: number[],
    metabolismProfile?: UserMetabolismProfile
  ): number[] {
    if (!metabolismProfile || metabolismProfile.confidenceScore < 50) {
      return baseTargets;
    }

    const adjusted = [...baseTargets];
    const weeklyPattern = metabolismProfile.weeklyActivityPattern;
    
    // If we have a reliable weekly pattern, adjust daily targets accordingly
    if (weeklyPattern.length === 7) {
      const maxBurn = Math.max(...weeklyPattern);
      const minBurn = Math.min(...weeklyPattern.filter(burn => burn > 0));
      
      if (maxBurn > minBurn * 1.5) { // Significant variation in weekly pattern
        const today = new Date().getDay();
        const mondayBasedToday = today === 0 ? 6 : today - 1;
        
        weeklyPattern.slice(mondayBasedToday).forEach((expectedBurn, index) => {
          if (index < adjusted.length) {
            const isHighActivityDay = expectedBurn > (maxBurn * 0.7);
            const isLowActivityDay = expectedBurn < (minBurn * 1.3);
            
            if (isHighActivityDay) {
              // Increase calories on historically active days
              adjusted[index] = Math.round(adjusted[index] * 1.1);
            } else if (isLowActivityDay) {
              // Decrease calories on historically rest days
              adjusted[index] = Math.round(adjusted[index] * 0.95);
            }
          }
        });
      }
    }
    
    return adjusted;
  }

  /**
   * Ensures no daily target falls below minimum safe calories
   */
  private static enforceMinimumCalories(targets: number[]): number[] {
    return targets.map(calories => Math.max(calories, this.MIN_DAILY_CALORIES));
  }

  /**
   * Determines the reason for the current redistribution using smart pace-based logic
   */
  private static determineAdjustmentReason(
    weeklyProgress: WeeklyProgress,
    remainingCalories: number,
    remainingDays: number
  ): CalorieRedistribution['adjustmentReason'] {
    const goal = weeklyProgress.goal;
    const totalConsumed = weeklyProgress.totalConsumed;
    const totalBurned = weeklyProgress.totalBurned;
    const netConsumed = totalConsumed - totalBurned;
    
    // Calculate expected progress (what we should have consumed by now)
    const daysElapsed = 7 - remainingDays;
    const expectedConsumedByNow = (goal.weeklyAllowance / 7) * daysElapsed;
    
    // Calculate deviation from expected pace
    const paceDeviation = netConsumed - expectedConsumedByNow;
    
    // Banking plan awareness
    const hasBankingPlan = !!goal.bankingPlan;
    let bankingAdjustment = 0;
    
    if (hasBankingPlan && goal.bankingPlan) {
      // If banking, we expect to be under pace by the banking amount
      const bankingTarget = goal.bankingPlan.totalBanked;
      const daysInPlan = goal.bankingPlan.remainingDaysCount;
      bankingAdjustment = -(bankingTarget / daysInPlan) * daysElapsed;
      console.log('📅 [SmartAlerts] Banking adjustment:', bankingAdjustment);
    }
    
    const adjustedDeviation = paceDeviation - bankingAdjustment;
    
    // Time-sensitive thresholds (more lenient early in week, stricter later)
    const weekProgress = daysElapsed / 7;
    const baseThreshold = goal.dailyBaseline * 0.3; // ~735 calories base threshold
    const timeAdjustedThreshold = baseThreshold * (0.5 + weekProgress); // 50% -> 100% threshold
    
    console.log('🎯 [SmartAlerts] Pace-based calculation:', {
      daysElapsed,
      expectedConsumedByNow: Math.round(expectedConsumedByNow),
      actualNetConsumed: Math.round(netConsumed),
      paceDeviation: Math.round(paceDeviation),
      bankingAdjustment: Math.round(bankingAdjustment),
      adjustedDeviation: Math.round(adjustedDeviation),
      threshold: Math.round(timeAdjustedThreshold),
      weekProgress: Math.round(weekProgress * 100) + '%'
    });
    
    // Safety check: if usage is very low (< 15% of weekly allowance), can't be over-budget
    const weeklyUsagePercent = (netConsumed / goal.weeklyAllowance) * 100;
    if (weeklyUsagePercent < 15) {
      console.log(`🛡️ [SmartAlerts] Safety override: ${weeklyUsagePercent.toFixed(1)}% usage is too low to be over-budget`);
      return weeklyUsagePercent < 5 ? 'under-budget' : 'on-track';
    }
    
    if (adjustedDeviation > timeAdjustedThreshold) {
      return 'over-budget';
    } else if (adjustedDeviation < -timeAdjustedThreshold) {
      return 'under-budget';
    } else {
      return 'on-track';
    }
  }

  /**
   * Gets the current day index within the week (0 = first day of week)
   */
  private static getCurrentDayIndex(today: Date, weekStartDate: string): number {
    const weekStart = new Date(weekStartDate);
    const daysDiff = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    const clampedIndex = Math.max(0, Math.min(6, daysDiff));
    
    // DEBUG: Day index calculation
    console.log('📅 [DayIndex] Day index calculation:');
    console.log(`   Today: ${today.toDateString()}`);
    console.log(`   Week start: ${weekStart.toDateString()}`);
    console.log(`   Days difference: ${daysDiff}`);
    console.log(`   Clamped index: ${clampedIndex}`);
    
    return clampedIndex;
  }

  /**
   * Creates an empty redistribution for completed weeks
   */
  private static createEmptyRedistribution(): CalorieRedistribution {
    return {
      remainingDays: 0,
      remainingCalories: 0,
      recommendedDailyTargets: [],
      adjustmentReason: 'on-track'
    };
  }

  /**
   * Calculates weekly progress from daily data
   */
  static calculateWeeklyProgress(
    goal: WeeklyCalorieGoal,
    dailyData: DailyCalorieData[]
  ): WeeklyProgress {
    // DEBUG: Check what data we're processing
    console.log('🔍 [WeeklyProgress] Processing daily data:');
    dailyData.forEach(day => {
      console.log(`   ${day.date}: consumed=${day.consumed}, burned=${day.burned}, meals=${day.meals.length}`);
    });
    
    const totalConsumed = dailyData.reduce((sum, day) => sum + day.consumed, 0);
    const totalBurned = dailyData.reduce((sum, day) => sum + day.burned, 0);
    
    console.log(`🔍 [WeeklyProgress] Totals: consumed=${totalConsumed}, burned=${totalBurned}`);
    console.log(`🔍 [WeeklyProgress] Goal details:`, {
      totalTarget: goal.totalTarget,
      currentWeekAllowance: goal.currentWeekAllowance, 
      weeklyAllowance: goal.weeklyAllowance,
      dailyBaseline: goal.dailyBaseline
    });
    
    // Fix: Burned calories should INCREASE your remaining allowance
    const remainingCalories = goal.totalTarget - totalConsumed + totalBurned;
    console.log(`🔍 [WeeklyProgress] Remaining calc: ${goal.totalTarget} - ${totalConsumed} + ${totalBurned} = ${remainingCalories}`);
    const projectedOutcome = totalConsumed - totalBurned;

    return {
      goal,
      dailyData,
      totalConsumed,
      totalBurned,
      remainingCalories,
      projectedOutcome
    };
  }
}