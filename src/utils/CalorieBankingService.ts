import { 
  CalorieBankingPlan, 
  WeeklyCalorieGoal,
  BankingPlanValidation,
  BankingImpactPreview,
  DailyCalorieData
} from '../types/CalorieTypes';
import { format, addDays, parseISO, isAfter, isSameDay, startOfWeek } from 'date-fns';

export class CalorieBankingService {
  private static readonly MIN_DAILY_CALORIES = 1200;
  private static readonly MAX_DAILY_REDUCTION = 500;

  /**
   * Creates a new calorie banking plan
   */
  static createBankingPlan(
    targetDate: string,
    dailyReduction: number,
    weeklyGoal: WeeklyCalorieGoal
  ): CalorieBankingPlan {
    const today = new Date();
    const weekStart = parseISO(weeklyGoal.weekStartDate);
    
    // Calculate remaining days (from tomorrow until target date)
    const remainingDays = this.calculateRemainingDays(today, targetDate, weekStart);
    const totalBanked = dailyReduction * remainingDays;

    return {
      id: `banking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      weekStartDate: weeklyGoal.weekStartDate,
      targetDate,
      dailyReduction,
      totalBanked,
      remainingDaysCount: remainingDays,
      createdAt: new Date(),
      isActive: true
    };
  }

  /**
   * Validates a banking plan and provides impact preview
   */
  static validateBankingPlan(
    targetDate: string,
    dailyReduction: number,
    weeklyGoal: WeeklyCalorieGoal
  ): BankingPlanValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const today = new Date();
    const weekStart = parseISO(weeklyGoal.weekStartDate);
    const targetDateObj = parseISO(targetDate);

    // Validate target date is in the future
    if (!isAfter(targetDateObj, today)) {
      errors.push('Target date must be in the future');
    }

    // Validate target date is within reasonable banking range (next 7 days)
    const maxBankingDate = addDays(today, 7);
    if (targetDateObj > maxBankingDate) {
      errors.push('Target date must be within the next 7 days');
    }

    // Validate daily reduction limits
    if (dailyReduction <= 0) {
      errors.push('Daily reduction must be greater than 0');
    }
    if (dailyReduction > this.MAX_DAILY_REDUCTION) {
      errors.push(`Daily reduction cannot exceed ${this.MAX_DAILY_REDUCTION} calories`);
    }

    // Calculate impact preview
    const impactPreview = this.calculateImpactPreview(
      targetDate, 
      dailyReduction, 
      weeklyGoal, 
      today
    );

    // Validate minimum daily calories
    if (impactPreview.minDailyCalories < this.MIN_DAILY_CALORIES) {
      errors.push(`Banking would create unsafe daily minimums (${impactPreview.minDailyCalories} < ${this.MIN_DAILY_CALORIES})`);
    }

    // Add warnings
    if (impactPreview.minDailyCalories < this.MIN_DAILY_CALORIES + 200) {
      warnings.push('Banking creates very low daily targets - consider reducing the amount');
    }

    if (dailyReduction > 300) {
      warnings.push('Large daily reductions may be difficult to maintain');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      impactPreview
    };
  }

  /**
   * Calculates the impact preview for a banking plan
   */
  private static calculateImpactPreview(
    targetDate: string,
    dailyReduction: number,
    weeklyGoal: WeeklyCalorieGoal,
    today: Date
  ): BankingImpactPreview {
    const weekStart = parseISO(weeklyGoal.weekStartDate);
    const targetDateObj = parseISO(targetDate);
    
    // Find all days from tomorrow until target date
    const affectedDays: { date: string; reduction: number; newTarget: number }[] = [];
    let currentDate = addDays(today, 1);
    let minDailyCalories = Infinity;

    while (currentDate <= targetDateObj) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      if (!isSameDay(currentDate, targetDateObj)) {
        // This day gets reduced
        const baseTarget = weeklyGoal.dailyBaseline;
        const newTarget = baseTarget - dailyReduction;
        
        affectedDays.push({
          date: dateStr,
          reduction: dailyReduction,
          newTarget
        });

        minDailyCalories = Math.min(minDailyCalories, newTarget);
      }

      currentDate = addDays(currentDate, 1);
    }

    const totalBanked = dailyReduction * affectedDays.length;
    const targetDateBoost = totalBanked;

    return {
      targetDate,
      targetDateBoost,
      dailyReductions: affectedDays,
      minDailyCalories: minDailyCalories === Infinity ? weeklyGoal.dailyBaseline : minDailyCalories,
      totalBanked,
      daysAffected: affectedDays.length
    };
  }

  /**
   * Applies banking adjustments to daily calorie data
   */
  static applyBankingToWeeklyData(
    weeklyData: DailyCalorieData[],
    bankingPlan: CalorieBankingPlan
  ): DailyCalorieData[] {
    if (!bankingPlan.isActive) {
      return weeklyData;
    }

    const targetDate = bankingPlan.targetDate;
    
    return weeklyData.map(dayData => {
      const isTargetDate = dayData.date === targetDate;
      const today = new Date();
      const dayDate = parseISO(dayData.date);
      const isAfterToday = isAfter(dayDate, today) || isSameDay(dayDate, today);

      // Only apply banking to future days
      if (!isAfterToday) {
        return dayData;
      }

      let bankingAdjustment = 0;
      
      if (isTargetDate) {
        // Target date gets all the banked calories
        bankingAdjustment = bankingPlan.totalBanked;
      } else {
        // Other remaining days get reduced
        const isPastTargetDate = isAfter(dayDate, parseISO(targetDate));
        if (!isPastTargetDate) {
          bankingAdjustment = -bankingPlan.dailyReduction;
        }
      }

      return {
        ...dayData,
        bankingAdjustment,
        adjustedTarget: dayData.target + bankingAdjustment
      };
    });
  }

  /**
   * Cancels banking and removes adjustments
   */
  static cancelBanking(weeklyData: DailyCalorieData[]): DailyCalorieData[] {
    return weeklyData.map(dayData => ({
      ...dayData,
      bankingAdjustment: undefined,
      adjustedTarget: undefined
    }));
  }

  /**
   * Calculates remaining days for banking (tomorrow until target date, exclusive of target)
   */
  private static calculateRemainingDays(
    today: Date,
    targetDate: string,
    weekStart: Date
  ): number {
    const targetDateObj = parseISO(targetDate);
    const tomorrow = addDays(today, 1);
    
    let count = 0;
    let currentDate = tomorrow;

    while (currentDate < targetDateObj) {
      count++;
      currentDate = addDays(currentDate, 1);
    }

    return count;
  }

  /**
   * Gets available target dates (next 7 days for banking, extending across weeks if needed)
   */
  static getAvailableTargetDates(weekStartDate: string): string[] {
    const today = new Date();
    const availableDates: string[] = [];
    const tomorrow = addDays(today, 1);
    
    // Show next 7 days for banking (extends across week boundaries)
    for (let i = 0; i < 7; i++) {
      const targetDate = addDays(tomorrow, i);
      availableDates.push(format(targetDate, 'yyyy-MM-dd'));
    }

    return availableDates;
  }

  /**
   * Checks if banking is possible (need at least 2 days: 1 to reduce from, 1 to bank for)
   */
  static isBankingAvailable(weekStartDate: string): boolean {
    const availableDates = this.getAvailableTargetDates(weekStartDate);
    return availableDates.length >= 2; // Need at least 2 days (1 to reduce, 1 target)
  }
}