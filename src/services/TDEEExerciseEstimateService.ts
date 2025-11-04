/**
 * TDEE Exercise Estimate Service
 * 
 * Extracts daily exercise calorie estimates from different TDEE calculation methods
 * to enable accurate net exercise calorie banking (avoiding double-counting).
 */

import { AthleteProfileTDEEService } from './AthleteProfileTDEEService';
import { AthleteProfile } from '../types/AthleteTypes';
import { WeeklyCalorieGoal } from '../types/CalorieTypes';

export interface TDEEBreakdown {
  bmr: number;
  baseActivity: number; // Non-exercise activity (NEAT)
  exerciseEstimate: number; // Daily exercise calories estimate
  total: number;
  method: 'standard' | 'athlete' | 'enhanced' | 'manual';
  confidence: 'high' | 'medium' | 'low';
}

export class TDEEExerciseEstimateService {
  
  /**
   * Extract daily exercise estimate from any TDEE calculation method
   */
  public static extractDailyExerciseEstimate(
    tdeeValue: number,
    method: 'standard' | 'athlete' | 'enhanced' | 'manual',
    context?: {
      bmr?: number;
      activityMultiplier?: number;
      athleteProfile?: AthleteProfile;
      deviceAverageCalories?: number;
      weeklyGoal?: WeeklyCalorieGoal;
    }
  ): TDEEBreakdown {
    
    console.log(`🔍 [TDEEExerciseEstimate] Extracting exercise estimate for ${method} TDEE: ${tdeeValue}`);
    
    switch (method) {
      case 'standard':
        return this.extractFromStandardTDEE(tdeeValue, context);
      
      case 'athlete':
        return this.extractFromAthleteTDEE(tdeeValue, context);
      
      case 'enhanced':
        return this.extractFromEnhancedTDEE(tdeeValue, context);
      
      case 'manual':
        return this.extractFromManualTDEE(tdeeValue, context);
        
      default:
        console.warn(`⚠️ [TDEEExerciseEstimate] Unknown TDEE method: ${method}, using fallback`);
        return this.createFallbackBreakdown(tdeeValue);
    }
  }

  /**
   * Extract exercise estimate from Standard TDEE (activity multipliers)
   */
  private static extractFromStandardTDEE(
    tdeeValue: number, 
    context?: { bmr?: number; activityMultiplier?: number }
  ): TDEEBreakdown {
    
    // If we have BMR and multiplier, use them directly
    if (context?.bmr && context?.activityMultiplier) {
      const bmr = context.bmr;
      const multiplier = context.activityMultiplier;
      const totalActivity = tdeeValue - bmr; // All activity calories above BMR
      const exerciseEstimate = this.getExerciseEstimateFromMultiplier(multiplier, totalActivity);
      
      return {
        bmr,
        baseActivity: totalActivity - exerciseEstimate,
        exerciseEstimate,
        total: tdeeValue,
        method: 'standard',
        confidence: 'medium'
      };
    }
    
    // Otherwise, reverse-engineer from TDEE value
    // Estimate BMR if not provided (average adult: ~1800 for men, ~1500 for women)
    const estimatedBMR = context?.bmr || 1650; // Conservative middle estimate
    const activityCalories = tdeeValue - estimatedBMR;
    
    // Map activity calories to likely multiplier and exercise estimate
    let multiplier: number;
    let exerciseEstimate: number;
    
    if (activityCalories <= 320) { // ~1.2x multiplier
      multiplier = 1.2;
      exerciseEstimate = 0; // Sedentary
    } else if (activityCalories <= 620) { // ~1.375x multiplier  
      multiplier = 1.375;
      exerciseEstimate = Math.max(0, activityCalories - 200); // Light activity has ~200 NEAT
    } else if (activityCalories <= 910) { // ~1.55x multiplier
      multiplier = 1.55;
      exerciseEstimate = Math.max(0, activityCalories - 250); // Moderate activity
    } else if (activityCalories <= 1200) { // ~1.725x multiplier
      multiplier = 1.725;
      exerciseEstimate = Math.max(0, activityCalories - 300); // Active lifestyle
    } else { // ~1.9x+ multiplier
      multiplier = 1.9;
      exerciseEstimate = Math.max(0, activityCalories - 350); // Very active
    }
    
    console.log(`📊 [StandardTDEE] TDEE: ${tdeeValue}, Est. BMR: ${estimatedBMR}, Activity: ${activityCalories}, Exercise Est: ${exerciseEstimate}`);
    
    return {
      bmr: estimatedBMR,
      baseActivity: activityCalories - exerciseEstimate,
      exerciseEstimate,
      total: tdeeValue,
      method: 'standard',
      confidence: context?.bmr ? 'medium' : 'low' // Lower confidence if BMR is estimated
    };
  }

  /**
   * Extract exercise estimate from Athlete TDEE calculation
   */
  private static extractFromAthleteTDEE(
    tdeeValue: number,
    context?: { athleteProfile?: AthleteProfile }
  ): TDEEBreakdown {
    
    if (context?.athleteProfile) {
      try {
        // Use the existing AthleteProfileTDEEService to get breakdown
        const athleteTDEE = AthleteProfileTDEEService.calculateEnhancedTDEE(context.athleteProfile);
        
        console.log(`🏃‍♂️ [AthleteTDEE] Using athlete profile breakdown:`, athleteTDEE.breakdown);
        
        return {
          bmr: athleteTDEE.breakdown.bmr,
          baseActivity: Math.max(0, (athleteTDEE.breakdown.bmr * athleteTDEE.breakdown.activityMultiplier) - athleteTDEE.breakdown.bmr - athleteTDEE.breakdown.exerciseCalories),
          exerciseEstimate: athleteTDEE.breakdown.exerciseCalories,
          total: tdeeValue,
          method: 'athlete',
          confidence: athleteTDEE.confidence === 'high' ? 'high' : 'medium'
        };
        
      } catch (error) {
        console.error('❌ [AthleteTDEE] Failed to calculate athlete TDEE breakdown:', error);
      }
    }
    
    // Fallback if no athlete profile or calculation failed
    console.warn('⚠️ [AthleteTDEE] No athlete profile provided, using standard estimation');
    const bmrContext = context && 'bmr' in context && typeof context.bmr === 'number' ? { bmr: context.bmr } : undefined;
    return this.extractFromStandardTDEE(tdeeValue, bmrContext);
  }

  /**
   * Extract exercise estimate from Enhanced TDEE (device-based)
   */
  private static extractFromEnhancedTDEE(
    tdeeValue: number,
    context?: { bmr?: number; deviceAverageCalories?: number }
  ): TDEEBreakdown {
    
    // Enhanced TDEE should include the device's average daily active calories
    const deviceAverageCalories = context?.deviceAverageCalories || 0;
    const estimatedBMR = context?.bmr || 1650;
    
    if (deviceAverageCalories > 0) {
      // Use device data as the exercise estimate
      const baseActivity = Math.max(200, (tdeeValue - estimatedBMR) - deviceAverageCalories); // NEAT
      
      console.log(`📱 [EnhancedTDEE] Using device average: ${deviceAverageCalories} cal/day exercise`);
      
      return {
        bmr: estimatedBMR,
        baseActivity,
        exerciseEstimate: deviceAverageCalories,
        total: tdeeValue,
        method: 'enhanced',
        confidence: 'high' // Device data is most accurate
      };
    }
    
    // Fallback if no device data
    console.warn('⚠️ [EnhancedTDEE] No device average provided, using standard estimation');
    return this.extractFromStandardTDEE(tdeeValue, context);
  }

  /**
   * Extract exercise estimate from Manual TDEE
   */
  private static extractFromManualTDEE(
    tdeeValue: number,
    context?: { bmr?: number }
  ): TDEEBreakdown {
    
    // Manual TDEE is tricky - we don't know the user's exercise assumptions
    // Best we can do is estimate based on the TDEE/BMR ratio
    const estimatedBMR = context?.bmr || 1650;
    const activityCalories = tdeeValue - estimatedBMR;
    
    // Conservative approach: assume 30-50% of activity calories are exercise
    const exerciseRatio = Math.min(0.5, Math.max(0.3, (activityCalories - 300) / activityCalories));
    const exerciseEstimate = Math.max(0, Math.round(activityCalories * exerciseRatio));
    
    console.log(`✍️ [ManualTDEE] TDEE: ${tdeeValue}, Activity: ${activityCalories}, Exercise Est: ${exerciseEstimate} (${Math.round(exerciseRatio * 100)}% ratio)`);
    
    return {
      bmr: estimatedBMR,
      baseActivity: activityCalories - exerciseEstimate,
      exerciseEstimate,
      total: tdeeValue,
      method: 'manual',
      confidence: 'low' // Least reliable since we're guessing user's assumptions
    };
  }

  /**
   * Get exercise estimate based on activity multiplier
   */
  private static getExerciseEstimateFromMultiplier(multiplier: number, totalActivityCalories: number): number {
    // Standard multiplier to exercise calorie mapping
    const multiplierExerciseRatios = {
      1.2: 0.0,   // Sedentary - no planned exercise
      1.375: 0.3, // Light - ~30% of activity is exercise
      1.55: 0.5,  // Moderate - ~50% of activity is exercise  
      1.725: 0.65, // Active - ~65% of activity is exercise
      1.9: 0.75   // Very active - ~75% of activity is exercise
    };
    
    // Find closest multiplier
    const multipliers = Object.keys(multiplierExerciseRatios).map(Number).sort((a, b) => a - b);
    const closestMultiplier = multipliers.reduce((prev, curr) => 
      Math.abs(curr - multiplier) < Math.abs(prev - multiplier) ? curr : prev
    );
    
    const exerciseRatio = multiplierExerciseRatios[closestMultiplier as keyof typeof multiplierExerciseRatios];
    return Math.round(totalActivityCalories * exerciseRatio);
  }

  /**
   * Create fallback breakdown when method is unknown
   */
  private static createFallbackBreakdown(tdeeValue: number): TDEEBreakdown {
    const estimatedBMR = 1650;
    const activityCalories = Math.max(0, tdeeValue - estimatedBMR);
    const exerciseEstimate = Math.round(activityCalories * 0.4); // Conservative 40%
    
    return {
      bmr: estimatedBMR,
      baseActivity: activityCalories - exerciseEstimate,
      exerciseEstimate,
      total: tdeeValue,
      method: 'manual',
      confidence: 'low'
    };
  }

  /**
   * Calculate net exercise adjustment for banking
   */
  public static calculateNetExerciseAdjustment(
    actualBurnedCalories: number,
    tdeeBreakdown: TDEEBreakdown
  ): {
    netAdjustment: number;
    explanation: string;
    details: {
      actualBurned: number;
      expectedFromTDEE: number;
      difference: number;
      adjustmentType: 'bonus' | 'penalty' | 'none';
    };
  } {
    
    const expectedExercise = tdeeBreakdown.exerciseEstimate;
    const netAdjustment = actualBurnedCalories - expectedExercise;
    
    let adjustmentType: 'bonus' | 'penalty' | 'none';
    let explanation: string;
    
    if (netAdjustment > 10) {
      adjustmentType = 'bonus';
      explanation = `+${Math.round(netAdjustment)} bonus calories for exercising above your TDEE estimate`;
    } else if (netAdjustment < -10) {
      adjustmentType = 'penalty';  
      explanation = `${Math.round(netAdjustment)} calories for exercising below your TDEE estimate`;
    } else {
      adjustmentType = 'none';
      explanation = 'Exercise matches your TDEE estimate - no adjustment needed';
    }
    
    console.log(`⚖️ [NetExercise] Actual: ${actualBurnedCalories}, Expected: ${expectedExercise}, Net: ${netAdjustment}`);
    
    return {
      netAdjustment,
      explanation,
      details: {
        actualBurned: actualBurnedCalories,
        expectedFromTDEE: expectedExercise,
        difference: netAdjustment,
        adjustmentType
      }
    };
  }
}