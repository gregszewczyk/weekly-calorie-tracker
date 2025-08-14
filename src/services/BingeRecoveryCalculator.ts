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
    
    // Real impact calculations
    const timelineDelayDays = excessCalories / (weeklyDeficit / 7); // Daily deficit
    const weeklyGoalImpact = (excessCalories / weeklyDeficit) * 100;
    const monthlyGoalImpact = (excessCalories / (weeklyDeficit * 4.33)) * 100;
    
    // Perspective calculations
    const avgWorkoutBurn = userWeight ? userWeight * 5 : 350; // Rough estimate
    const equivalentWorkouts = excessCalories / avgWorkoutBurn;
    const daysToNullify = Math.ceil(excessCalories / (weeklyDeficit / 7));
    
    // Total journey perspective (assuming 12-week cut)
    const totalJourneyCalories = weeklyDeficit * 12;
    const percentOfTotalJourney = (excessCalories / totalJourneyCalories) * 100;
    
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
        daysToNullify,
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
        message: `This adds ${timelineDelay.toFixed(1)} days to your timeline - completely manageable.`,
        focus: "One high day is just ${weeklyImpact}% of your weekly progress.",
        reminder: "You've been consistent before, you can handle this easily."
      },
      moderate: {
        message: `This represents ${weeklyImpact}% of your weekly deficit. Mathematics, not emotions.`,
        focus: "You have proven strategies to rebalance this systematically.",
        reminder: "Every successful cut has days like this. It's normal."
      },
      severe: {
        message: `This is ${timelineDelay.toFixed(1)} days impact, but taking a maintenance week prevents bigger setbacks.`,
        focus: "Preventing a binge-restrict spiral is more important than timeline perfection.",
        reminder: "Consistency beats perfection. Protecting your mental health protects your results."
      }
    };
    
    return messages[event.triggerType];
  }
}