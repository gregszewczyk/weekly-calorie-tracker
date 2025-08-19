/**
 * Binge Recovery Calculator Service
 * 
 * Mathematical approach to overeating recovery that prevents emotional spirals.
 * Provides concrete, actionable rebalancing strategies with positive reframing.
 */

import { format, addDays, differenceInDays } from 'date-fns';
import {
  OvereatingEvent,
  RecoveryPlan,
  ImpactAnalysis,
  RebalancingOption,
  RecoveryStrategy,
  OVEREATING_THRESHOLDS,
  RECOVERY_MESSAGES,
} from '../types/RecoveryTypes';
import { WeeklyCalorieGoal } from '../types/CalorieTypes';

export class BingeRecoveryCalculator {
  private static readonly MIN_SAFE_CALORIES = 1200;
  private static readonly MAX_DAILY_REDUCTION = 500; // Safety limit
  
  /**
   * Detects if today's intake constitutes an overeating event
   * Legacy method - kept for backwards compatibility
   */
  static detectOvereatingEvent(
    todayConsumed: number,
    todayTarget: number,
    date: string
  ): OvereatingEvent | null {
    const excess = todayConsumed - todayTarget;
    
    if (excess <= OVEREATING_THRESHOLDS.mild) {
      return null; // Not significant enough to warrant intervention
    }
    
    const triggerType = excess >= OVEREATING_THRESHOLDS.severe ? 'severe' :
                       excess >= OVEREATING_THRESHOLDS.moderate ? 'moderate' : 'mild';
    
    return {
      id: `overeating_${date}_${Date.now()}`,
      date,
      excessCalories: excess,
      triggerType,
      detectedAt: new Date(),
      userAcknowledged: false,
    };
  }

  /**
   * Enhanced overeating detection with weekly banking context
   */
  static detectOvereatingEventEnhanced(
    todayConsumed: number,
    todayTarget: number,
    todayBurned: number,
    date: string,
    weeklyGoal: WeeklyCalorieGoal,
    weeklyProgress: { totalConsumed: number; totalBurned: number; daysElapsed: number }
  ): OvereatingEvent | null {
    const excess = todayConsumed - todayTarget;
    
    // Step 1: Check if this is even significant
    if (excess <= OVEREATING_THRESHOLDS.mild) {
      return null; // Not significant enough to warrant intervention
    }
    
    // Step 2: Check weekly bank balance
    const netConsumedToday = todayConsumed - todayBurned;
    const weeklyNetConsumed = weeklyProgress.totalConsumed - weeklyProgress.totalBurned + netConsumedToday;
    const weeklyBankBalance = weeklyGoal.weeklyAllowance - weeklyNetConsumed;
    
    console.log(`🔍 [EnhancedDetection] Weekly bank balance: ${weeklyBankBalance}, excess: ${excess}`);
    
    // Step 3: If still within weekly budget, no recovery needed
    if (weeklyBankBalance >= 0) {
      console.log(`✅ [EnhancedDetection] Still within weekly budget (+${weeklyBankBalance}), no recovery needed`);
      return null;
    }
    
    // Step 3.5: Check for active banking plans that might affect thresholds
    const activeBankingPlan = weeklyGoal.bankingPlan;
    let adjustedMinimumSafe = weeklyGoal.dailyBaseline * 0.7; // Default 70%
    
    if (activeBankingPlan && activeBankingPlan.isActive) {
      // If user has an active banking plan, don't let recovery go below their banking target
      const bankingDailyTarget = weeklyGoal.dailyBaseline - activeBankingPlan.dailyReduction; // Banking reduces calories
      adjustedMinimumSafe = Math.max(adjustedMinimumSafe, bankingDailyTarget * 0.9); // 90% of banking target
      console.log(`🏦 [EnhancedDetection] Active banking plan detected, adjusted minimum safe: ${adjustedMinimumSafe}`);
    }
    
    // Step 4: Check if redistribution would create unsafe daily targets
    const daysRemaining = 7 - weeklyProgress.daysElapsed;
    
    if (daysRemaining > 0) {
      const averageNeededPerDay = Math.abs(weeklyBankBalance) / daysRemaining;
      const newDailyTarget = weeklyGoal.dailyBaseline - averageNeededPerDay;
      
      console.log(`⚠️ [EnhancedDetection] Would need ${averageNeededPerDay} cal/day reduction, new target: ${newDailyTarget}, minimum safe: ${adjustedMinimumSafe}`);
      
      // If redistribution would be unsafe, trigger recovery
      if (newDailyTarget < adjustedMinimumSafe) {
        console.log(`🚨 [EnhancedDetection] Redistribution unsafe (${newDailyTarget} < ${adjustedMinimumSafe}), triggering recovery`);
      }
    }
    
    // Step 5: Create the overeating event
    const triggerType = excess >= OVEREATING_THRESHOLDS.severe ? 'severe' :
                       excess >= OVEREATING_THRESHOLDS.moderate ? 'moderate' : 'mild';
    
    return {
      id: `overeating_${date}_${Date.now()}`,
      date,
      excessCalories: Math.abs(weeklyBankBalance), // Use actual bank deficit, not just daily excess
      triggerType,
      detectedAt: new Date(),
      userAcknowledged: false,
    };
  }
  
  /**
   * Creates a comprehensive recovery plan with multiple rebalancing options
   */
  static createRecoveryPlan(
    overeatingEvent: OvereatingEvent,
    currentGoal: WeeklyCalorieGoal,
    userWeight?: number // For more accurate calculations
  ): RecoveryPlan {
    const impactAnalysis = this.calculateImpactAnalysis(overeatingEvent, currentGoal, userWeight);
    const rebalancingOptions = this.generateRebalancingOptions(
      overeatingEvent.excessCalories,
      currentGoal,
      overeatingEvent.triggerType
    );
    
    const strategy = this.recommendStrategy(overeatingEvent.triggerType, overeatingEvent.excessCalories);
    
    return {
      id: `recovery_${overeatingEvent.id}`,
      overeatingEventId: overeatingEvent.id,
      strategy,
      impactAnalysis,
      rebalancingOptions,
      createdAt: new Date(),
    };
  }
  
  /**
   * Calculates the real mathematical impact and provides perspective
   */
  private static calculateImpactAnalysis(
    event: OvereatingEvent,
    goal: WeeklyCalorieGoal,
    userWeight?: number
  ): ImpactAnalysis {
    const excessCalories = event.excessCalories;
    const weeklyDeficit = Math.abs(goal.deficitTarget); // Make positive for calculations
    
    console.log(`🧮 [BingeRecovery] Calculating impact: excess=${excessCalories}, weeklyAllowance=${goal.weeklyAllowance}, weeklyDeficit=${weeklyDeficit}`);
    
    // NEW: Weekly goal impact calculations (more meaningful than daily deficit)
    const weeklyBudgetImpact = (goal.weeklyAllowance > 0) ? (excessCalories / goal.weeklyAllowance) * 100 : 0;
    const weeklyDeficitImpact = (weeklyDeficit > 0) ? (excessCalories / weeklyDeficit) * 100 : 0;
    
    // NEW: Main goal timeline impact (if available)
    const mainGoalWeeks = goal.goalConfig?.timeline?.estimatedWeeksToGoal || 12; // fallback to 12 weeks
    const totalMainGoalCalories = weeklyDeficit * mainGoalWeeks;
    const mainGoalImpact = (totalMainGoalCalories > 0) ? (excessCalories / totalMainGoalCalories) * 100 : 0;
    
    // Calculate how many weeks this excess would need to be spread over to recover
    const weeksToRecover = (weeklyDeficit > 0) ? Math.ceil(excessCalories / weeklyDeficit) : 1;
    
    // Cap extremely large values
    let timelineDelayDays = Math.min(weeksToRecover * 7, 365); // Convert weeks to days, max 1 year
    let weeklyGoalImpact = Math.min(weeklyBudgetImpact, 1000); // Use weekly budget impact instead
    let monthlyGoalImpact = Math.min(mainGoalImpact, 1000); // Use main goal impact instead
    
    // Perspective calculations
    const avgWorkoutBurn = userWeight ? userWeight * 5 : 350; // Rough estimate
    let equivalentWorkouts = excessCalories / avgWorkoutBurn;
    
    // NEW: More meaningful perspective - weeks to nullify with gentle rebalancing
    let weeksToNullify = weeksToRecover;
    
    // NEW: Use actual main goal percentage instead of arbitrary 12-week assumption
    let percentOfTotalJourney = mainGoalImpact;
    
    // Cap perspective values
    if (!isFinite(equivalentWorkouts) || equivalentWorkouts > 50) equivalentWorkouts = 50; // Max 50 workouts
    if (!isFinite(weeksToNullify) || weeksToNullify > 52) weeksToNullify = 52; // Max 1 year
    if (!isFinite(percentOfTotalJourney) || percentOfTotalJourney > 100) percentOfTotalJourney = 100; // Max 100%
    
    // Generate reframing message
    const messageTemplate = RECOVERY_MESSAGES[event.triggerType];
    const reframe = this.generateReframeMessage(event, timelineDelayDays, weeklyGoalImpact);
    
    return {
      realImpact: {
        timelineDelayDays: Math.round(timelineDelayDays * 10) / 10, // 1 decimal place
        weeklyGoalImpact: Math.round(weeklyGoalImpact),
        monthlyGoalImpact: Math.round(monthlyGoalImpact),
      },
      perspective: {
        equivalentWorkouts: Math.round(equivalentWorkouts * 10) / 10,
        daysToNullify: weeksToNullify * 7, // Convert back to days for UI compatibility
        percentOfTotalJourney: Math.round(percentOfTotalJourney * 10) / 10,
      },
      reframe: {
        message: reframe.message,
        focusPoint: reframe.focus,
        successReminder: reframe.reminder,
      },
    };
  }
  
  /**
   * Generates multiple rebalancing options with different time horizons
   */
  private static generateRebalancingOptions(
    excessCalories: number,
    goal: WeeklyCalorieGoal,
    triggerType: OvereatingEvent['triggerType']
  ): RebalancingOption[] {
    const options: RebalancingOption[] = [];
    const baseTarget = goal.dailyBaseline;
    
    // Option 1: Gentle 7-day rebalance (recommended for most)
    const gentleDays = 7;
    const gentleReduction = Math.round(excessCalories / gentleDays);
    const gentleNewTarget = baseTarget - gentleReduction;
    
    if (gentleNewTarget >= this.MIN_SAFE_CALORIES) {
      options.push({
        id: 'gentle_7day',
        name: 'Gentle 7-Day Rebalance',
        description: `Reduce by ${gentleReduction} calories/day for ${gentleDays} days`,
        durationDays: gentleDays,
        dailyAdjustment: -gentleReduction,
        minSafetyCals: this.MIN_SAFE_CALORIES,
        impact: {
          newDailyTarget: gentleNewTarget,
          effortLevel: gentleReduction <= 100 ? 'minimal' : 'moderate',
          riskLevel: 'safe',
        },
        pros: [
          'Barely noticeable daily reduction',
          'Maintains consistent energy levels',
          'High success rate',
          'No hunger or performance impact'
        ],
        recommendation: 'recommended',
      });
    }
    
    // Option 2: Moderate 5-day rebalance
    const moderateDays = 5;
    const moderateReduction = Math.round(excessCalories / moderateDays);
    const moderateNewTarget = baseTarget - moderateReduction;
    
    if (moderateNewTarget >= this.MIN_SAFE_CALORIES) {
      options.push({
        id: 'moderate_5day',
        name: 'Moderate 5-Day Rebalance',
        description: `Reduce by ${moderateReduction} calories/day for ${moderateDays} days`,
        durationDays: moderateDays,
        dailyAdjustment: -moderateReduction,
        minSafetyCals: this.MIN_SAFE_CALORIES,
        impact: {
          newDailyTarget: moderateNewTarget,
          effortLevel: moderateReduction <= 150 ? 'moderate' : 'challenging',
          riskLevel: moderateReduction <= 200 ? 'safe' : 'moderate',
        },
        pros: [
          'Back on track faster',
          'Still manageable daily reduction',
          'Good for motivated periods'
        ],
        cons: moderateReduction > 150 ? ['Noticeable hunger increase'] : undefined,
      });
    }
    
    // Option 3: Quick 3-day recovery (only for smaller overages)
    if (excessCalories <= 800) {
      const quickDays = 3;
      const quickReduction = Math.round(excessCalories / quickDays);
      const quickNewTarget = baseTarget - quickReduction;
      
      if (quickNewTarget >= this.MIN_SAFE_CALORIES && quickReduction <= this.MAX_DAILY_REDUCTION) {
        options.push({
          id: 'quick_3day',
          name: 'Quick 3-Day Recovery',
          description: `Reduce by ${quickReduction} calories/day for ${quickDays} days`,
          durationDays: quickDays,
          dailyAdjustment: -quickReduction,
          minSafetyCals: this.MIN_SAFE_CALORIES,
          impact: {
            newDailyTarget: quickNewTarget,
            effortLevel: 'challenging',
            riskLevel: quickReduction <= 250 ? 'moderate' : 'aggressive',
          },
          pros: [
            'Fastest recovery',
            'Minimal timeline impact',
            'Good for small overages'
          ],
          cons: [
            'Requires strong discipline',
            'May increase hunger',
            'Could trigger restriction mindset'
          ],
          recommendation: triggerType === 'mild' ? 'advanced' : 'not-recommended',
        });
      }
    }
    
    // Option 4: Maintenance week (for severe cases or high stress)
    options.push({
      id: 'maintenance_week',
      name: 'Take a Maintenance Week',
      description: 'Eat at maintenance calories and extend timeline',
      durationDays: 7,
      dailyAdjustment: 0,
      minSafetyCals: this.MIN_SAFE_CALORIES,
      impact: {
        newDailyTarget: goal.dailyBaseline + Math.abs(goal.deficitTarget / 7), // Add back the deficit
        effortLevel: 'minimal',
        riskLevel: 'safe',
      },
      pros: [
        'Zero additional stress',
        'Prevents binge-restrict cycle',
        'Mental health focused',
        'Still making progress (not gaining)'
      ],
      cons: [
        'Extends timeline by ~1 week',
        'May feel like "giving up"'
      ],
      recommendation: triggerType === 'severe' ? 'recommended' : undefined,
    });
    
    return options;
  }
  
  /**
   * Recommends the best strategy based on overeating severity
   */
  private static recommendStrategy(
    triggerType: OvereatingEvent['triggerType'],
    excessCalories: number
  ): RecoveryStrategy {
    switch (triggerType) {
      case 'mild':
        return 'gentle-rebalancing';
      case 'moderate':
        return excessCalories > 700 ? 'moderate-correction' : 'gentle-rebalancing';
      case 'severe':
        return 'maintenance-week';
      default:
        return 'gentle-rebalancing';
    }
  }
  
  /**
   * Generates positive, mathematical reframing messages
   */
  private static generateReframeMessage(
    event: OvereatingEvent,
    timelineDelay: number,
    weeklyImpact: number
  ): { message: string; focus: string; reminder?: string } {
    const template = RECOVERY_MESSAGES[event.triggerType];
    
    const messages = {
      mild: {
        message: weeklyImpact >= 100 
          ? "This uses more than your weekly budget, but it's completely recoverable with the right plan."
          : `This uses ${weeklyImpact.toFixed(1)}% of your weekly calorie budget - completely manageable.`,
        focus: weeklyImpact >= 1000 
          ? "This is a substantial amount, but you have strategies to handle it."
          : `One high day doesn't derail your progress - you have ${(100 - weeklyImpact).toFixed(1)}% of your week left.`,
        reminder: "You've been consistent before, you can handle this easily."
      },
      moderate: {
        message: weeklyImpact >= 100 
          ? "This exceeds your weekly budget. Let's create a smart rebalancing plan."
          : `This uses ${weeklyImpact.toFixed(1)}% of your weekly calorie budget. Mathematics, not emotions.`,
        focus: "You have proven strategies to rebalance this systematically across the coming weeks.",
        reminder: "Every successful journey has days like this. It's normal."
      },
      severe: {
        message: weeklyImpact >= 100 
          ? "This is a substantial overage, but taking a maintenance approach prevents bigger setbacks."
          : `This uses ${weeklyImpact.toFixed(1)}% of your weekly budget, but a maintenance approach prevents setbacks.`,
        focus: "Preventing a restrict-binge cycle is more important than perfect weekly targets.",
        reminder: "Consistency beats perfection. Protecting your mental health protects your results."
      }
    };
    
    return messages[event.triggerType];
  }
}