import { HistoricalDataAnalyzer, UserMetabolismProfile, PersonalizedCalorieRecommendation } from '../utils/HistoricalDataAnalyzer';
import { SamsungHealthDailyMetricsService, SamsungHealthWellnessData, SamsungHealthRecoveryMetrics } from './SamsungHealthDailyMetricsService';
import { SamsungHealthDailyMetrics } from '../types/SamsungHealthTypes';
import { DailyCalorieData } from '../types/CalorieTypes';
import { WeightEntry } from '../types/GoalTypes';
import { format, subDays } from 'date-fns';

/**
 * Enhanced Historical Data Analyzer that integrates Samsung Health wellness metrics
 * for more accurate TDEE calculations and personalized recommendations
 * Based on the proven Garmin Enhanced Historical Analyzer pattern
 */
export class SamsungHealthEnhancedHistoricalAnalyzer extends HistoricalDataAnalyzer {
  private samsungHealthService: SamsungHealthDailyMetricsService | null;
  private samsungHealthData: SamsungHealthDailyMetrics[] = [];

  constructor(
    weeklyData: DailyCalorieData[],
    weightEntries: WeightEntry[],
    userAge: number,
    userGender: 'male' | 'female',
    userHeight: number,
    userActivityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
    samsungHealthService: SamsungHealthDailyMetricsService | null = null
  ) {
    super(weeklyData, weightEntries, userAge, userGender, userHeight, userActivityLevel);
    this.samsungHealthService = samsungHealthService;
  }

  /**
   * Load recent Samsung Health wellness data for enhanced analysis
   */
  async loadSamsungHealthData(days = 30): Promise<void> {
    if (!this.samsungHealthService) {
      console.log('📊 [SamsungHealthEnhancedAnalyzer] No Samsung Health service available - using base analysis only');
      this.samsungHealthData = [];
      return;
    }

    try {
      console.log(`📊 [SamsungHealthEnhancedAnalyzer] Loading ${days} days of wellness data...`);
      
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);
      
      this.samsungHealthData = await this.samsungHealthService.getDailyMetricsRange(startDate, endDate);
      
      console.log(`✅ [SamsungHealthEnhancedAnalyzer] Loaded ${this.samsungHealthData.length} days of Samsung Health data`);
    } catch (error) {
      console.warn('⚠️ [SamsungHealthEnhancedAnalyzer] Failed to load Samsung Health data, falling back to standard analysis:', error);
      this.samsungHealthData = [];
    }
  }

  /**
   * Enhanced metabolism analysis using Samsung Health data
   */
  async analyzeEnhancedUserMetabolism(): Promise<UserMetabolismProfile & {
    samsungHealthEnhanced: boolean;
    activityLevel: string;
    recoveryMetrics?: {
      recoveryScore: number;
      recommendations: string[];
    };
    enhancedInsights: string[];
  }> {
    // Load Samsung Health data if not already loaded
    if (this.samsungHealthData.length === 0) {
      await this.loadSamsungHealthData();
    }

    // Get base metabolism analysis
    const baseProfile = this.analyzeUserMetabolism();

    // If no Samsung Health data or service, return enhanced base profile
    if (!this.samsungHealthService || this.samsungHealthData.length === 0) {
      return {
        ...baseProfile,
        samsungHealthEnhanced: false,
        activityLevel: 'unknown',
        enhancedInsights: ['No Samsung Health data available for enhanced analysis']
      };
    }

    // Calculate enhanced TDEE using Samsung Health data
    const wellnessMetrics = await this.samsungHealthService.calculateWellnessMetrics(
      this.samsungHealthData,
      baseProfile.estimatedBMR
    );

    // Get latest sleep and heart rate data for recovery analysis
    const latestDayWithSleep = this.samsungHealthData.find(day => day.sleep_data);
    const latestDayWithHR = this.samsungHealthData.find(day => day.heart_rate);
    
    const recoveryMetrics = this.samsungHealthService.calculateRecoveryMetrics(
      latestDayWithSleep?.sleep_data,
      latestDayWithHR?.heart_rate,
      latestDayWithSleep?.stress_level
    );

    // Combine insights
    const enhancedInsights = [
      'Enhanced analysis using Samsung Health wellness data',
      `Activity level: ${wellnessMetrics.activityLevel} (${wellnessMetrics.averageSteps} steps/day, ${wellnessMetrics.averageActiveCalories} kcal/day)`,
      `Sleep recovery: ${recoveryMetrics.recoveryRecommendation.replace('_', ' ')} (efficiency: ${recoveryMetrics.sleepEfficiency}%)`,
      `Enhanced TDEE confidence: ${wellnessMetrics.confidenceScore}%`,
      `Data quality: ${wellnessMetrics.dataQuality}% (${wellnessMetrics.daysCovered} days)`
    ];

    console.log(`🧮 [SamsungHealthEnhancedAnalyzer] Enhanced TDEE: ${wellnessMetrics.enhancedTDEE} vs Base: ${baseProfile.estimatedTDEE}`);

    return {
      ...baseProfile,
      estimatedTDEE: wellnessMetrics.enhancedTDEE,
      samsungHealthEnhanced: true,
      activityLevel: wellnessMetrics.activityLevel,
      recoveryMetrics: {
        recoveryScore: recoveryMetrics.sleepScore,
        recommendations: [
          `Recovery status: ${recoveryMetrics.recoveryRecommendation.replace('_', ' ')}`,
          `Sleep quality: ${recoveryMetrics.sleepDuration / 60} hours at ${recoveryMetrics.sleepEfficiency}% efficiency`,
          recoveryMetrics.stressLevel ? `Stress level: ${recoveryMetrics.stressLevel}/100` : 'No stress data available'
        ].filter(Boolean)
      },
      enhancedInsights
    };
  }

  /**
   * Enhanced personalized calorie recommendations with Samsung Health recovery data
   */
  async getEnhancedCalorieRecommendation(
    goalType: 'weight_loss' | 'weight_gain' | 'maintenance',
    targetWeeklyChange?: number
  ): Promise<PersonalizedCalorieRecommendation & {
    samsungHealthAdjustments: {
      calorieAdjustment: number;
      proteinBoost: boolean;
      carbAdjustment: number;
      reasonings: string[];
    };
    confidenceLevel: 'low' | 'medium' | 'high';
  }> {
    // Get enhanced metabolism profile
    const enhancedProfile = await this.analyzeEnhancedUserMetabolism();
    
    // Create base recommendation using enhanced TDEE
    const baseTDEE = enhancedProfile.estimatedTDEE;
    let targetCalories = baseTDEE;
    
    // Adjust for goal type
    if (goalType === 'weight_loss') {
      const weeklyDeficit = (targetWeeklyChange || 0.5) * 3500; // 3500 kcal per pound
      const dailyDeficit = weeklyDeficit / 7;
      targetCalories = baseTDEE - dailyDeficit;
    } else if (goalType === 'weight_gain') {
      const weeklySurplus = (targetWeeklyChange || 0.5) * 3500;
      const dailySurplus = weeklySurplus / 7;
      targetCalories = baseTDEE + dailySurplus;
    }

    // Basic macro breakdown (40% carbs, 30% protein, 30% fat)
    const initialProtein = Math.round((targetCalories * 0.30) / 4);
    const initialCarbs = Math.round((targetCalories * 0.40) / 4);
    const initialFat = Math.round((targetCalories * 0.30) / 9);

    const baseRecommendation: PersonalizedCalorieRecommendation = {
      recommendedDailyTarget: Math.round(targetCalories),
      reasoningFactors: [
        `Based on enhanced TDEE: ${baseTDEE} kcal`,
        `Goal: ${goalType.replace('_', ' ')}`
      ],
      adjustmentFromStandard: 0,
      confidenceLevel: enhancedProfile.samsungHealthEnhanced ? 'high' : 'medium',
      expectedWeeklyChange: targetWeeklyChange || 0,
      recommendations: {
        calorie: [`Target: ${Math.round(targetCalories)} kcal/day`],
        timing: ['Spread intake across 4-5 meals'],
        adjustment: ['Based on Samsung Health wellness data']
      }
    };

    // If no Samsung Health data, return base recommendation
    if (!enhancedProfile.samsungHealthEnhanced || !enhancedProfile.recoveryMetrics || !this.samsungHealthService) {
      return {
        ...baseRecommendation,
        samsungHealthAdjustments: {
          calorieAdjustment: 0,
          proteinBoost: false,
          carbAdjustment: 0,
          reasonings: ['No Samsung Health data available for adjustments']
        },
        confidenceLevel: 'low'
      };
    }

    // Apply Samsung Health-based adjustments using recovery metrics
    const latestDayWithSleep = this.samsungHealthData.find(day => day.sleep_data);
    const latestDayWithHR = this.samsungHealthData.find(day => day.heart_rate);
    
    const recoveryMetrics = this.samsungHealthService.calculateRecoveryMetrics(
      latestDayWithSleep?.sleep_data,
      latestDayWithHR?.heart_rate,
      latestDayWithSleep?.stress_level
    );
    
    // Calculate adjusted calorie targets based on recovery
    const nutritionAdjustmentPercent = recoveryMetrics.nutritionAdjustment;
    const calorieAdjustmentAmount = Math.round(baseRecommendation.recommendedDailyTarget * nutritionAdjustmentPercent);
    const adjustedDailyCalories = baseRecommendation.recommendedDailyTarget + calorieAdjustmentAmount;
    
    // Determine macro adjustments based on recovery status
    let proteinBoost = false;
    let carbAdjustment = 0;
    let reasonings: string[] = [];

    if (recoveryMetrics.recoveryRecommendation === 'rest_day') {
      proteinBoost = true; // Boost protein for recovery
      carbAdjustment = -10; // Reduce carbs slightly on rest days
      reasonings.push('Poor sleep quality detected - increased protein for recovery, reduced carbs');
    } else if (recoveryMetrics.recoveryRecommendation === 'light_activity') {
      carbAdjustment = -5; // Slight carb reduction
      reasonings.push('Moderate sleep quality - slight carb reduction');
    } else if (recoveryMetrics.recoveryRecommendation === 'full_training') {
      carbAdjustment = 5; // Slight carb increase for training
      reasonings.push('Excellent sleep quality - increased carbs for performance');
    }

    // Add stress-based adjustments
    if (latestDayWithSleep?.stress_level && latestDayWithSleep.stress_level > 70) {
      proteinBoost = true;
      reasonings.push('High stress detected - increased protein for recovery support');
    }

    // Calculate final macro targets
    const adjustedProtein = proteinBoost 
      ? initialProtein + Math.round(initialProtein * 0.15) 
      : initialProtein;
    
    const adjustedCarbs = carbAdjustment !== 0 
      ? initialCarbs + Math.round(initialCarbs * (carbAdjustment / 100))
      : initialCarbs;

    // Recalculate fat to balance calories
    const proteinCarbs = (adjustedProtein * 4) + (adjustedCarbs * 4);
    const remainingCaloriesForFat = adjustedDailyCalories - proteinCarbs;
    const adjustedFat = Math.round(remainingCaloriesForFat / 9);

    const reasoningFactors = [
      ...baseRecommendation.reasoningFactors,
      `Samsung Health adjustment: ${calorieAdjustmentAmount >= 0 ? '+' : ''}${calorieAdjustmentAmount} kcal`,
      `Recovery status: ${recoveryMetrics.recoveryRecommendation.replace('_', ' ')}`,
      `Sleep efficiency: ${recoveryMetrics.sleepEfficiency}%`
    ];

    if (nutritionAdjustmentPercent !== 0) {
      reasoningFactors.push(`Calorie adjustment: ${Math.round(nutritionAdjustmentPercent * 100)}% due to recovery status`);
    }

    const enhancedRecommendations = {
      calorie: [
        `Target: ${adjustedDailyCalories} kcal/day`,
        proteinBoost ? 'Higher protein for recovery' : 'Standard protein intake',
        carbAdjustment !== 0 ? `Carb adjustment: ${carbAdjustment > 0 ? '+' : ''}${carbAdjustment}%` : 'Standard carb intake'
      ].filter(rec => rec !== 'Standard protein intake' && rec !== 'Standard carb intake'),
      timing: [
        'Spread intake across 4-5 meals',
        recoveryMetrics.recoveryRecommendation === 'rest_day' 
          ? 'Focus on post-workout nutrition within 30 minutes if exercising'
          : 'Maintain consistent meal timing',
        'Consider magnesium-rich foods if sleep quality is poor'
      ],
      adjustment: [
        `Adjusted based on Samsung Health sleep and activity data`,
        `Recovery-optimized nutrition for ${recoveryMetrics.recoveryRecommendation.replace('_', ' ')} status`
      ]
    };

    return {
      recommendedDailyTarget: adjustedDailyCalories,
      reasoningFactors,
      adjustmentFromStandard: calorieAdjustmentAmount,
      confidenceLevel: enhancedProfile.samsungHealthEnhanced ? 'high' : 'medium',
      expectedWeeklyChange: targetWeeklyChange || 0,
      recommendations: enhancedRecommendations,
      samsungHealthAdjustments: {
        calorieAdjustment: calorieAdjustmentAmount,
        proteinBoost,
        carbAdjustment,
        reasonings
      }
    };
  }

  /**
   * Get Samsung Health-specific insights for nutrition optimization
   */
  getSamsungHealthInsights(): string[] {
    if (this.samsungHealthData.length === 0) {
      return ['Connect Samsung Health for personalized insights based on your daily activity and sleep patterns'];
    }

    const insights: string[] = [];
    
    // Activity insights
    const avgSteps = this.samsungHealthData.reduce((sum, day) => sum + day.step_count, 0) / this.samsungHealthData.length;
    const avgActiveCalories = this.samsungHealthData.reduce((sum, day) => sum + day.active_calorie, 0) / this.samsungHealthData.length;

    if (avgSteps >= 10000) {
      insights.push('🚶‍♂️ Excellent daily activity! Your high step count supports increased calorie intake.');
    } else if (avgSteps >= 7500) {
      insights.push('👍 Good activity level. Consider adding more steps to optimize metabolism.');
    } else {
      insights.push('💪 Increase daily steps for better calorie burn and metabolic health.');
    }

    // Sleep insights
    const sleepData = this.samsungHealthData.filter(day => day.sleep_data);
    if (sleepData.length > 0) {
      const avgSleepHours = sleepData.reduce((sum, day) => sum + (day.sleep_data!.duration / 60), 0) / sleepData.length;
      const avgEfficiency = sleepData.reduce((sum, day) => sum + day.sleep_data!.efficiency, 0) / sleepData.length;

      if (avgSleepHours >= 7 && avgEfficiency >= 80) {
        insights.push('😴 Great sleep quality! Your rest supports optimal recovery and metabolism.');
      } else if (avgSleepHours < 7) {
        insights.push('⏰ Consider more sleep. Poor sleep can affect hunger hormones and calorie needs.');
      } else if (avgEfficiency < 75) {
        insights.push('🛏️ Sleep efficiency could improve. Better sleep quality enhances recovery nutrition effectiveness.');
      }
    }

    // Heart rate insights
    const hrData = this.samsungHealthData.filter(day => day.heart_rate);
    if (hrData.length > 0) {
      const avgRestingHR = hrData.reduce((sum, day) => sum + day.heart_rate!.resting, 0) / hrData.length;
      
      if (avgRestingHR < 60) {
        insights.push('❤️ Excellent cardiovascular fitness! Your low resting HR indicates efficient metabolism.');
      } else if (avgRestingHR > 80) {
        insights.push('🫀 Consider cardiovascular training to improve metabolic efficiency.');
      }
    }

    // Stress insights
    const stressData = this.samsungHealthData.filter(day => day.stress_level !== undefined);
    if (stressData.length > 0) {
      const avgStress = stressData.reduce((sum, day) => sum + day.stress_level!, 0) / stressData.length;
      
      if (avgStress > 70) {
        insights.push('😰 High stress levels detected. Consider stress management for better nutrition absorption.');
      }
    }

    return insights;
  }

  /**
   * Get current Samsung Health data summary for display
   */
  getSamsungHealthSummary(): {
    hasData: boolean;
    daysCovered: number;
    averageSteps: number;
    averageActiveCalories: number;
    averageSleepHours: number;
    averageSleepEfficiency: number;
    averageRestingHR?: number;
    lastSyncDate?: string;
  } {
    if (this.samsungHealthData.length === 0) {
      return {
        hasData: false,
        daysCovered: 0,
        averageSteps: 0,
        averageActiveCalories: 0,
        averageSleepHours: 0,
        averageSleepEfficiency: 0
      };
    }

    const sleepData = this.samsungHealthData.filter(day => day.sleep_data);
    const hrData = this.samsungHealthData.filter(day => day.heart_rate);

    return {
      hasData: true,
      daysCovered: this.samsungHealthData.length,
      averageSteps: Math.round(this.samsungHealthData.reduce((sum, day) => sum + day.step_count, 0) / this.samsungHealthData.length),
      averageActiveCalories: Math.round(this.samsungHealthData.reduce((sum, day) => sum + day.active_calorie, 0) / this.samsungHealthData.length),
      averageSleepHours: sleepData.length > 0 
        ? Math.round((sleepData.reduce((sum, day) => sum + (day.sleep_data!.duration / 60), 0) / sleepData.length) * 10) / 10 
        : 0,
      averageSleepEfficiency: sleepData.length > 0 
        ? Math.round(sleepData.reduce((sum, day) => sum + day.sleep_data!.efficiency, 0) / sleepData.length) 
        : 0,
      averageRestingHR: hrData.length > 0 
        ? Math.round(hrData.reduce((sum, day) => sum + day.heart_rate!.resting, 0) / hrData.length)
        : undefined,
      lastSyncDate: this.samsungHealthData[0]?.date
    };
  }
}

export default SamsungHealthEnhancedHistoricalAnalyzer;
