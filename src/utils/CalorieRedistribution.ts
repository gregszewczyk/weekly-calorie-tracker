import { 
  WeeklyProgress, 
  CalorieRedistribution, 
  DailyCalorieData,
  WeeklyCalorieGoal 
} from '@types/CalorieTypes';
import { ActivityData } from '@types/ActivityTypes';
import { startOfWeek, addDays, format, isAfter } from 'date-fns';

export class WeeklyCalorieRedistributor {
  private static readonly MIN_DAILY_CALORIES = 1200;
  private static readonly MAX_DAILY_DEFICIT_PERCENTAGE = 0.25; // 25% below baseline

  /**
   * Calculates the redistribution of remaining calories across remaining days of the week
   */
  static calculateRedistribution(
    weeklyProgress: WeeklyProgress,
    plannedActivity?: ActivityData[]
  ): CalorieRedistribution {
    const today = new Date();
    const currentDayIndex = this.getCurrentDayIndex(today, weeklyProgress.goal.weekStartDate);
    const remainingDays = 7 - currentDayIndex;
    
    if (remainingDays <= 0) {
      return this.createEmptyRedistribution();
    }

    const remainingCalories = weeklyProgress.remainingCalories;
    const baseDistribution = this.calculateBaseDistribution(remainingCalories, remainingDays);
    
    // Adjust for planned activity if available
    const adjustedTargets = plannedActivity 
      ? this.adjustForPlannedActivity(baseDistribution, plannedActivity, remainingDays)
      : baseDistribution;

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
    remainingDays: number
  ): number[] {
    const baseDaily = Math.round(remainingCalories / remainingDays);
    return Array(remainingDays).fill(baseDaily);
  }

  /**
   * Adjusts daily targets based on planned training sessions
   */
  private static adjustForPlannedActivity(
    baseTargets: number[],
    plannedActivity: ActivityData[],
    remainingDays: number
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
          const increase = Math.round(activity.totalCaloriesBurned * 0.3); // 30% of burned calories
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
   * Ensures no daily target falls below minimum safe calories
   */
  private static enforceMinimumCalories(targets: number[]): number[] {
    return targets.map(calories => Math.max(calories, this.MIN_DAILY_CALORIES));
  }

  /**
   * Determines the reason for the current redistribution
   */
  private static determineAdjustmentReason(
    weeklyProgress: WeeklyProgress,
    remainingCalories: number,
    remainingDays: number
  ): CalorieRedistribution['adjustmentReason'] {
    const averageRemaining = remainingCalories / remainingDays;
    const baseline = weeklyProgress.goal.dailyBaseline;
    
    if (averageRemaining < baseline * 0.8) {
      return 'over-budget';
    } else if (averageRemaining > baseline * 1.2) {
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
    return Math.max(0, Math.min(6, daysDiff));
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
    const totalConsumed = dailyData.reduce((sum, day) => sum + day.consumed, 0);
    const totalBurned = dailyData.reduce((sum, day) => sum + day.burned, 0);
    const remainingCalories = goal.totalTarget - totalConsumed;
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