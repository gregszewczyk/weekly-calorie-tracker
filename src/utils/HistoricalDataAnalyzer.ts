import { DailyCalorieData, WeeklyProgress } from '../types/CalorieTypes';
import { WeightEntry } from '../types/GoalTypes';
import { AppleHealthDailyMetrics } from '../types/AppleHealthKitTypes';
import { addDays, differenceInDays, format, startOfWeek, endOfWeek } from 'date-fns';

/**
 * Historical Data Analyzer
 * 
 * Analyzes user's historical data to provide personalized AI recommendations
 * for calorie targets, metabolism estimation, and goal optimization.
 */

export interface UserMetabolismProfile {
  // Basic metabolic insights
  estimatedBMR: number; // Basal Metabolic Rate
  estimatedTDEE: number; // Total Daily Energy Expenditure
  averageDailyBurn: number; // Historical average calories burned
  averageDailyConsumption: number; // Historical average calories consumed
  
  // Activity patterns
  activeVsRestDayRatio: number; // Burn difference between active and rest days
  weeklyActivityPattern: number[]; // 7-day pattern (Mon-Sun) of activity levels
  seasonalVariations: { [month: number]: number }; // Monthly activity variations
  
  // Accuracy and reliability
  dataQuality: 'excellent' | 'good' | 'fair' | 'insufficient';
  confidenceScore: number; // 0-100% confidence in the estimates
  totalDataPoints: number; // Number of days with complete data
  analysisDateRange: { start: Date; end: Date };
}

export interface PersonalizedCalorieRecommendation {
  recommendedDailyTarget: number;
  reasoningFactors: string[];
  adjustmentFromStandard: number; // Difference from BMR/TDEE calculators
  confidenceLevel: 'high' | 'medium' | 'low';
  expectedWeeklyChange: number; // Predicted weight change in kg
  recommendations: {
    calorie: string[];
    timing: string[];
    adjustment: string[];
  };
}

export interface WeightTrendAnalysis {
  currentTrend: 'gaining' | 'losing' | 'maintaining';
  weeklyRate: number; // kg per week
  consistency: number; // 0-100% how consistent the trend is
  predictedWeight: number; // Weight in 4 weeks based on current trend
  metabolicAdaptation: boolean; // Whether metabolism appears to be adapting
}

export interface AppleHealthEnhancedContext {
  recentWorkouts: any[]; // Will be AppleHealthKitWorkout[] when available
  weeklyActivitySummary: {
    activeCalories: number;
    steps: number;
    workoutMinutes: number;
    standHours: number;
  };
  sleepTrends: {
    averageDuration: number; // minutes
    efficiency: number; // percentage
    deepSleepPercentage: number;
  };
  recoveryMetrics: {
    restingHeartRate: number;
    heartRateVariability: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  todaysActivity: {
    stepsSoFar: number;
    activeCalories: number;
    standHours: number;
    workoutPlanned?: boolean;
  };
}

export class HistoricalDataAnalyzer {
  private weeklyData: DailyCalorieData[];
  private weightEntries: WeightEntry[];
  private appleHealthMetrics: AppleHealthDailyMetrics[];
  private userAge: number;
  private userGender: 'male' | 'female';
  private userHeight: number; // cm
  private userActivityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

  constructor(
    weeklyData: DailyCalorieData[],
    weightEntries: WeightEntry[],
    userAge: number,
    userGender: 'male' | 'female',
    userHeight: number,
    userActivityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
    appleHealthMetrics: AppleHealthDailyMetrics[] = []
  ) {
    this.weeklyData = weeklyData;
    this.weightEntries = weightEntries;
    this.appleHealthMetrics = appleHealthMetrics;
    this.userAge = userAge;
    this.userGender = userGender;
    this.userHeight = userHeight;
    this.userActivityLevel = userActivityLevel;
  }

  /**
   * Generate enhanced context for AI recommendations using Apple Health data
   */
  generateAppleHealthEnhancedContext(): AppleHealthEnhancedContext {
    const recentMetrics = this.appleHealthMetrics.slice(-7); // Last 7 days
    
    if (recentMetrics.length === 0) {
      return this.getDefaultEnhancedContext();
    }

    // Calculate weekly activity summary
    const weeklyActivitySummary = {
      activeCalories: Math.round(recentMetrics.reduce((sum, m) => sum + m.activeEnergyBurned, 0) / recentMetrics.length),
      steps: Math.round(recentMetrics.reduce((sum, m) => sum + m.steps, 0) / recentMetrics.length),
      workoutMinutes: 0, // Would need workout data integration
      standHours: Math.round(recentMetrics.reduce((sum, m) => sum + (m.standHours || 0), 0) / recentMetrics.length),
    };

    // Calculate sleep trends
    const sleepData = recentMetrics.filter(m => m.sleepAnalysis).map(m => m.sleepAnalysis!);
    const sleepTrends = sleepData.length > 0 ? {
      averageDuration: Math.round(sleepData.reduce((sum, s) => sum + s.timeAsleep, 0) / sleepData.length),
      efficiency: Math.round(sleepData.reduce((sum, s) => sum + s.sleepEfficiency, 0) / sleepData.length),
      deepSleepPercentage: sleepData[0].sleepStages ? 
        Math.round(sleepData.reduce((sum, s) => sum + (s.sleepStages?.deep || 0), 0) / sleepData.reduce((sum, s) => sum + s.timeAsleep, 0) * 100) : 20,
    } : {
      averageDuration: 480, // 8 hours default
      efficiency: 80,
      deepSleepPercentage: 20,
    };

    // Calculate recovery metrics
    const heartRateData = recentMetrics.filter(m => m.heartRateData).map(m => m.heartRateData!);
    const recoveryMetrics = heartRateData.length > 0 ? {
      restingHeartRate: Math.round(heartRateData.reduce((sum, h) => sum + h.resting, 0) / heartRateData.length),
      heartRateVariability: Math.round(heartRateData.reduce((sum, h) => sum + h.variability, 0) / heartRateData.length),
      trend: this.calculateHRVTrend(heartRateData) as 'improving' | 'declining' | 'stable',
    } : {
      restingHeartRate: 65,
      heartRateVariability: 35,
      trend: 'stable' as const,
    };

    // Today's activity (most recent data)
    const todayMetrics = recentMetrics[recentMetrics.length - 1];
    const todaysActivity = {
      stepsSoFar: todayMetrics?.steps || 0,
      activeCalories: todayMetrics?.activeEnergyBurned || 0,
      standHours: todayMetrics?.standHours || 0,
      workoutPlanned: false, // Would need workout schedule integration
    };

    return {
      recentWorkouts: [], // Would be populated with workout data
      weeklyActivitySummary,
      sleepTrends,
      recoveryMetrics,
      todaysActivity,
    };
  }

  /**
   * Enhanced TDEE calculation using Apple Health activity data
   */
  calculateEnhancedTDEEWithAppleHealth(): number {
    if (this.appleHealthMetrics.length === 0) {
      return this.calculateEstimatedTDEE(this.getCompleteDataDays());
    }

    const recentMetrics = this.appleHealthMetrics.slice(-14); // Last 2 weeks
    const avgActiveCalories = recentMetrics.reduce((sum, m) => sum + m.activeEnergyBurned, 0) / recentMetrics.length;
    const avgBasalCalories = recentMetrics.reduce((sum, m) => sum + m.basalEnergyBurned, 0) / recentMetrics.length;
    
    // Use Apple Health's more accurate calorie data if available
    const appleHealthTDEE = avgActiveCalories + avgBasalCalories;
    const traditionalTDEE = this.calculateEstimatedTDEE(this.getCompleteDataDays());
    
    // Weight Apple Health data more heavily if we have sufficient data
    const appleHealthWeight = Math.min(recentMetrics.length / 14, 1); // Max weight at 14 days
    
    return Math.round(appleHealthTDEE * appleHealthWeight + traditionalTDEE * (1 - appleHealthWeight));
  }

  /**
   * Enhanced calorie recommendations with Apple Health context
   */
  generateEnhancedRecommendationWithAppleHealth(
    goalType: 'weight_loss' | 'weight_gain' | 'maintenance',
    targetWeeklyChange: number = 0.5
  ): PersonalizedCalorieRecommendation & { appleHealthContext?: AppleHealthEnhancedContext } {
    const baseRecommendation = this.generatePersonalizedRecommendation(goalType, targetWeeklyChange);
    const appleHealthContext = this.generateAppleHealthEnhancedContext();
    
    if (this.appleHealthMetrics.length === 0) {
      return { ...baseRecommendation, appleHealthContext };
    }

    // Enhance recommendations with Apple Health insights
    const enhancedRecommendations = {
      ...baseRecommendation.recommendations,
      timing: [
        ...baseRecommendation.recommendations.timing,
        ...this.generateTimingRecommendationsFromSleep(appleHealthContext.sleepTrends),
        ...this.generateRecoveryBasedRecommendations(appleHealthContext.recoveryMetrics),
      ],
      adjustment: [
        ...baseRecommendation.recommendations.adjustment,
        ...this.generateActivityBasedAdjustments(appleHealthContext.weeklyActivitySummary),
      ],
    };

    // Use enhanced TDEE calculation
    const enhancedTDEE = this.calculateEnhancedTDEEWithAppleHealth();
    const calorieDeficit = goalType === 'weight_loss' ? targetWeeklyChange * 7700 / 7 : 
                         goalType === 'weight_gain' ? -targetWeeklyChange * 7700 / 7 : 0;
    
    return {
      ...baseRecommendation,
      recommendedDailyTarget: Math.round(enhancedTDEE - calorieDeficit),
      recommendations: enhancedRecommendations,
      appleHealthContext,
    };
  }

  // Helper methods for Apple Health integration

  private getDefaultEnhancedContext(): AppleHealthEnhancedContext {
    return {
      recentWorkouts: [],
      weeklyActivitySummary: {
        activeCalories: 300,
        steps: 7500,
        workoutMinutes: 0,
        standHours: 8,
      },
      sleepTrends: {
        averageDuration: 480, // 8 hours
        efficiency: 80,
        deepSleepPercentage: 20,
      },
      recoveryMetrics: {
        restingHeartRate: 65,
        heartRateVariability: 35,
        trend: 'stable',
      },
      todaysActivity: {
        stepsSoFar: 0,
        activeCalories: 0,
        standHours: 0,
        workoutPlanned: false,
      },
    };
  }

  private calculateHRVTrend(heartRateData: NonNullable<AppleHealthDailyMetrics['heartRateData']>[]): string {
    if (heartRateData.length < 3) return 'stable';
    
    const recent = heartRateData.slice(-3);
    const earlier = heartRateData.slice(-6, -3);
    
    if (earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, h) => sum + h.variability, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, h) => sum + h.variability, 0) / earlier.length;
    
    const change = recentAvg - earlierAvg;
    
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  private generateTimingRecommendationsFromSleep(sleepTrends: AppleHealthEnhancedContext['sleepTrends']): string[] {
    const recommendations: string[] = [];
    
    if (sleepTrends.efficiency < 75) {
      recommendations.push('Consider eating dinner 3+ hours before bedtime to improve sleep quality');
    }
    
    if (sleepTrends.averageDuration < 420) { // Less than 7 hours
      recommendations.push('Prioritize 7-9 hours of sleep for optimal metabolism and recovery');
    }
    
    if (sleepTrends.deepSleepPercentage < 15) {
      recommendations.push('Avoid caffeine 6+ hours before bed and consider magnesium supplementation');
    }
    
    return recommendations;
  }

  private generateRecoveryBasedRecommendations(recoveryMetrics: AppleHealthEnhancedContext['recoveryMetrics']): string[] {
    const recommendations: string[] = [];
    
    if (recoveryMetrics.heartRateVariability < 25) {
      recommendations.push('Low HRV indicates stress - consider reducing calorie deficit or increasing rest days');
    }
    
    if (recoveryMetrics.trend === 'declining') {
      recommendations.push('Declining recovery metrics suggest need for more rest and potentially higher calorie intake');
    }
    
    if (recoveryMetrics.restingHeartRate > 75) {
      recommendations.push('Elevated resting HR may indicate overtraining or insufficient recovery');
    }
    
    return recommendations;
  }

  private generateActivityBasedAdjustments(activitySummary: AppleHealthEnhancedContext['weeklyActivitySummary']): string[] {
    const recommendations: string[] = [];
    
    if (activitySummary.steps < 5000) {
      recommendations.push('Low daily steps - consider increasing NEAT (walking, stairs, fidgeting) for better calorie burn');
    }
    
    if (activitySummary.activeCalories < 200) {
      recommendations.push('Low active calorie burn - add 2-3 structured workout sessions per week');
    }
    
    if (activitySummary.standHours < 8) {
      recommendations.push('Increase movement throughout the day - aim for hourly standing/walking breaks');
    }
    
    return recommendations;
  }

  /**
   * Analyze user's historical data to create a metabolism profile
   */
  analyzeUserMetabolism(): UserMetabolismProfile {
    const completeDataDays = this.getCompleteDataDays();
    const dataQuality = this.assessDataQuality(completeDataDays.length);
    
    if (completeDataDays.length < 7) {
      return this.createInsufficientDataProfile();
    }

    const estimatedBMR = this.calculateEstimatedBMR();
    const averageDailyConsumption = this.calculateAverageDailyConsumption(completeDataDays);
    const averageDailyBurn = this.calculateAverageDailyBurn(completeDataDays);
    const estimatedTDEE = this.calculateEstimatedTDEE(completeDataDays);
    
    const activeVsRestDayRatio = this.calculateActiveVsRestDayRatio(completeDataDays);
    const weeklyActivityPattern = this.calculateWeeklyActivityPattern(completeDataDays);
    const seasonalVariations = this.calculateSeasonalVariations(completeDataDays);
    
    const confidenceScore = this.calculateConfidenceScore(completeDataDays.length, dataQuality);
    
    return {
      estimatedBMR,
      estimatedTDEE,
      averageDailyBurn,
      averageDailyConsumption,
      activeVsRestDayRatio,
      weeklyActivityPattern,
      seasonalVariations,
      dataQuality,
      confidenceScore,
      totalDataPoints: completeDataDays.length,
      analysisDateRange: {
        start: new Date(completeDataDays[0].date),
        end: new Date(completeDataDays[completeDataDays.length - 1].date)
      }
    };
  }

  /**
   * Generate personalized calorie recommendations based on historical data
   */
  generatePersonalizedRecommendation(
    goalType: 'weight_loss' | 'weight_gain' | 'maintenance',
    targetWeeklyChange: number = 0 // kg per week
  ): PersonalizedCalorieRecommendation {
    const profile = this.analyzeUserMetabolism();
    const weightTrend = this.analyzeWeightTrend();
    
    // Base recommendation on actual TDEE rather than calculated
    const baseTDEE = profile.confidenceScore > 70 
      ? profile.estimatedTDEE 
      : this.calculateStandardTDEE();
    
    // Adjust for goal
    const calorieAdjustment = this.calculateGoalAdjustment(targetWeeklyChange, weightTrend);
    const recommendedDailyTarget = Math.round(baseTDEE + calorieAdjustment);
    
    // Compare to standard calculations
    const standardTDEE = this.calculateStandardTDEE();
    const adjustmentFromStandard = recommendedDailyTarget - standardTDEE;
    
    const reasoningFactors = this.generateReasoningFactors(
      profile, 
      weightTrend, 
      adjustmentFromStandard
    );
    
    const confidenceLevel = this.determineConfidenceLevel(profile.confidenceScore);
    const expectedWeeklyChange = this.calculateExpectedWeeklyChange(
      recommendedDailyTarget, 
      profile.estimatedTDEE
    );
    
    const recommendations = this.generateActionableRecommendations(
      profile, 
      weightTrend, 
      goalType
    );

    return {
      recommendedDailyTarget,
      reasoningFactors,
      adjustmentFromStandard,
      confidenceLevel,
      expectedWeeklyChange,
      recommendations
    };
  }

  /**
   * Analyze weight trends and metabolic adaptation
   */
  analyzeWeightTrend(): WeightTrendAnalysis {
    if (this.weightEntries.length < 5) {
      return {
        currentTrend: 'maintaining',
        weeklyRate: 0,
        consistency: 0,
        predictedWeight: this.getCurrentWeight(),
        metabolicAdaptation: false
      };
    }

    const sortedWeights = [...this.weightEntries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const weeklyRate = this.calculateWeeklyWeightChangeRate(sortedWeights);
    const consistency = this.calculateTrendConsistency(sortedWeights);
    const currentTrend = this.determineTrend(weeklyRate);
    const predictedWeight = this.predictFutureWeight(sortedWeights, 4); // 4 weeks
    const metabolicAdaptation = this.detectMetabolicAdaptation(sortedWeights);

    return {
      currentTrend,
      weeklyRate,
      consistency,
      predictedWeight,
      metabolicAdaptation
    };
  }

  /**
   * Get days with complete data (consumed, burned, and weight if recent)
   */
  private getCompleteDataDays(): DailyCalorieData[] {
    return this.weeklyData.filter(day => 
      day.consumed > 0 && 
      day.meals.length > 0 &&
      // Include days with burned calories or assume 0 for rest days
      (day.burned >= 0)
    );
  }

  /**
   * Calculate estimated BMR using Mifflin-St Jeor equation
   */
  private calculateEstimatedBMR(): number {
    const currentWeight = this.getCurrentWeight();
    
    if (this.userGender === 'male') {
      return (10 * currentWeight) + (6.25 * this.userHeight) - (5 * this.userAge) + 5;
    } else {
      return (10 * currentWeight) + (6.25 * this.userHeight) - (5 * this.userAge) - 161;
    }
  }

  /**
   * Calculate TDEE based on actual consumption and weight change patterns
   */
  private calculateEstimatedTDEE(completeDataDays: DailyCalorieData[]): number {
    if (completeDataDays.length < 14 || this.weightEntries.length < 3) {
      return this.calculateStandardTDEE();
    }

    // Use energy balance equation: TDEE = Average Intake + (Weight Change * 7700 kcal/kg / days)
    const avgIntake = completeDataDays.reduce((sum, day) => sum + day.consumed, 0) / completeDataDays.length;
    
    const dateRange = {
      start: new Date(completeDataDays[0].date),
      end: new Date(completeDataDays[completeDataDays.length - 1].date)
    };
    
    const weightChange = this.getWeightChangeInPeriod(dateRange.start, dateRange.end);
    const days = differenceInDays(dateRange.end, dateRange.start);
    
    if (days > 0 && weightChange !== null) {
      // 7700 kcal ≈ 1 kg of body weight
      const calorieAdjustment = (weightChange * 7700) / days;
      return Math.round(avgIntake + calorieAdjustment);
    }
    
    return Math.round(avgIntake);
  }

  /**
   * Calculate standard TDEE using activity multipliers
   */
  private calculateStandardTDEE(): number {
    const bmr = this.calculateEstimatedBMR();
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    return Math.round(bmr * multipliers[this.userActivityLevel]);
  }

  /**
   * Calculate average daily consumption from complete data days
   */
  private calculateAverageDailyConsumption(completeDataDays: DailyCalorieData[]): number {
    if (completeDataDays.length === 0) return 0;
    
    const total = completeDataDays.reduce((sum, day) => sum + day.consumed, 0);
    return Math.round(total / completeDataDays.length);
  }

  /**
   * Calculate average daily burn from complete data days
   */
  private calculateAverageDailyBurn(completeDataDays: DailyCalorieData[]): number {
    if (completeDataDays.length === 0) return 0;
    
    const total = completeDataDays.reduce((sum, day) => sum + day.burned, 0);
    return Math.round(total / completeDataDays.length);
  }

  /**
   * Calculate ratio between active and rest day calorie burn
   */
  private calculateActiveVsRestDayRatio(completeDataDays: DailyCalorieData[]): number {
    const activeDays = completeDataDays.filter(day => day.burned > 200);
    const restDays = completeDataDays.filter(day => day.burned <= 200);
    
    if (activeDays.length === 0 || restDays.length === 0) return 1;
    
    const avgActiveBurn = activeDays.reduce((sum, day) => sum + day.burned, 0) / activeDays.length;
    const avgRestBurn = restDays.reduce((sum, day) => sum + day.burned, 0) / restDays.length;
    
    return avgActiveBurn / Math.max(avgRestBurn, 1);
  }

  /**
   * Calculate weekly activity pattern (Mon-Sun)
   */
  private calculateWeeklyActivityPattern(completeDataDays: DailyCalorieData[]): number[] {
    const weeklyTotals = new Array(7).fill(0);
    const weeklyCounts = new Array(7).fill(0);
    
    completeDataDays.forEach(day => {
      const dayOfWeek = new Date(day.date).getDay(); // 0 = Sunday
      const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0
      
      weeklyTotals[mondayBasedDay] += day.burned;
      weeklyCounts[mondayBasedDay]++;
    });
    
    return weeklyTotals.map((total, index) => 
      weeklyCounts[index] > 0 ? Math.round(total / weeklyCounts[index]) : 0
    );
  }

  /**
   * Calculate seasonal variations in activity
   */
  private calculateSeasonalVariations(completeDataDays: DailyCalorieData[]): { [month: number]: number } {
    const monthlyTotals: { [month: number]: number[] } = {};
    
    completeDataDays.forEach(day => {
      const month = new Date(day.date).getMonth(); // 0-11
      if (!monthlyTotals[month]) monthlyTotals[month] = [];
      monthlyTotals[month].push(day.burned);
    });
    
    const monthlyAverages: { [month: number]: number } = {};
    Object.keys(monthlyTotals).forEach(monthStr => {
      const month = parseInt(monthStr);
      const burns = monthlyTotals[month];
      monthlyAverages[month] = burns.reduce((sum, burn) => sum + burn, 0) / burns.length;
    });
    
    return monthlyAverages;
  }

  /**
   * Assess data quality based on completeness and consistency
   */
  private assessDataQuality(dataPoints: number): 'excellent' | 'good' | 'fair' | 'insufficient' {
    if (dataPoints >= 60) return 'excellent'; // 2+ months
    if (dataPoints >= 30) return 'good'; // 1+ months
    if (dataPoints >= 14) return 'fair'; // 2+ weeks
    return 'insufficient';
  }

  /**
   * Calculate confidence score based on data quality and consistency
   */
  private calculateConfidenceScore(dataPoints: number, quality: string): number {
    let baseScore = 0;
    
    switch (quality) {
      case 'excellent': baseScore = 90; break;
      case 'good': baseScore = 75; break;
      case 'fair': baseScore = 60; break;
      case 'insufficient': baseScore = 30; break;
    }
    
    // Adjust based on weight data availability
    const weightDataBonus = this.weightEntries.length >= 10 ? 10 : 
                           this.weightEntries.length >= 5 ? 5 : 0;
    
    // Adjust based on data consistency
    const consistencyBonus = this.calculateDataConsistency() * 10;
    
    return Math.min(100, Math.max(0, baseScore + weightDataBonus + consistencyBonus));
  }

  /**
   * Calculate how consistent the user's logging is
   */
  private calculateDataConsistency(): number {
    const totalDays = this.weeklyData.length;
    const loggedDays = this.weeklyData.filter(day => day.meals.length > 0).length;
    
    return totalDays > 0 ? loggedDays / totalDays : 0;
  }

  /**
   * Get current weight (most recent entry)
   */
  private getCurrentWeight(): number {
    if (this.weightEntries.length === 0) return 70; // Default weight
    
    const sorted = [...this.weightEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return sorted[0].weight;
  }

  /**
   * Calculate weekly weight change rate
   */
  private calculateWeeklyWeightChangeRate(sortedWeights: WeightEntry[]): number {
    if (sortedWeights.length < 2) return 0;
    
    const recent = sortedWeights.slice(-14); // Last 14 entries
    if (recent.length < 2) return 0;
    
    const firstWeight = recent[0].weight;
    const lastWeight = recent[recent.length - 1].weight;
    const days = differenceInDays(
      new Date(recent[recent.length - 1].date),
      new Date(recent[0].date)
    );
    
    if (days <= 0) return 0;
    
    const totalChange = lastWeight - firstWeight;
    return (totalChange / days) * 7; // Convert to weekly rate
  }

  /**
   * Calculate trend consistency
   */
  private calculateTrendConsistency(sortedWeights: WeightEntry[]): number {
    if (sortedWeights.length < 5) return 0;
    
    let consistentMoves = 0;
    const recent = sortedWeights.slice(-10);
    
    for (let i = 1; i < recent.length - 1; i++) {
      const prev = recent[i - 1].weight;
      const curr = recent[i].weight;
      const next = recent[i + 1].weight;
      
      const direction1 = curr > prev;
      const direction2 = next > curr;
      
      if (direction1 === direction2) consistentMoves++;
    }
    
    return (consistentMoves / Math.max(1, recent.length - 2)) * 100;
  }

  /**
   * Determine weight trend direction
   */
  private determineTrend(weeklyRate: number): 'gaining' | 'losing' | 'maintaining' {
    if (weeklyRate > 0.1) return 'gaining';
    if (weeklyRate < -0.1) return 'losing';
    return 'maintaining';
  }

  /**
   * Predict future weight based on current trend
   */
  private predictFutureWeight(sortedWeights: WeightEntry[], weeksAhead: number): number {
    const weeklyRate = this.calculateWeeklyWeightChangeRate(sortedWeights);
    const currentWeight = this.getCurrentWeight();
    
    return currentWeight + (weeklyRate * weeksAhead);
  }

  /**
   * Detect potential metabolic adaptation
   */
  private detectMetabolicAdaptation(sortedWeights: WeightEntry[]): boolean {
    if (sortedWeights.length < 20) return false;
    
    // Look for plateaus in weight loss/gain despite consistent calorie deficit/surplus
    const recent = sortedWeights.slice(-14);
    const earlier = sortedWeights.slice(-28, -14);
    
    const recentRate = this.calculateWeeklyWeightChangeRate(recent);
    const earlierRate = this.calculateWeeklyWeightChangeRate(earlier);
    
    // If rate has slowed significantly, might indicate adaptation
    return Math.abs(recentRate) < Math.abs(earlierRate) * 0.5 && Math.abs(earlierRate) > 0.2;
  }

  /**
   * Get weight change in a specific period
   */
  private getWeightChangeInPeriod(startDate: Date, endDate: Date): number | null {
    const weightsInPeriod = this.weightEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
    
    if (weightsInPeriod.length < 2) return null;
    
    const sorted = weightsInPeriod.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return sorted[sorted.length - 1].weight - sorted[0].weight;
  }

  /**
   * Calculate calorie adjustment needed for goal
   */
  private calculateGoalAdjustment(
    targetWeeklyChange: number, 
    weightTrend: WeightTrendAnalysis
  ): number {
    // 7700 kcal ≈ 1 kg body weight
    const targetDailyAdjustment = (targetWeeklyChange * 7700) / 7;
    
    // Factor in metabolic adaptation
    if (weightTrend.metabolicAdaptation) {
      return targetDailyAdjustment * 1.15; // Increase by 15% to compensate
    }
    
    return targetDailyAdjustment;
  }

  /**
   * Generate reasoning factors for recommendation
   */
  private generateReasoningFactors(
    profile: UserMetabolismProfile,
    weightTrend: WeightTrendAnalysis,
    adjustmentFromStandard: number
  ): string[] {
    const factors: string[] = [];
    
    factors.push(`Based on ${profile.totalDataPoints} days of your actual data`);
    
    if (Math.abs(adjustmentFromStandard) > 100) {
      const direction = adjustmentFromStandard > 0 ? 'higher' : 'lower';
      factors.push(`Your actual metabolism appears ${direction} than standard calculations by ${Math.abs(adjustmentFromStandard)} kcal/day`);
    }
    
    if (profile.averageDailyBurn > 300) {
      factors.push(`You're quite active, burning an average of ${profile.averageDailyBurn} kcal/day through exercise`);
    }
    
    if (weightTrend.metabolicAdaptation) {
      factors.push('Your metabolism may be adapting - slightly higher calories recommended');
    }
    
    if (profile.confidenceScore > 80) {
      factors.push('High confidence recommendation based on extensive historical data');
    }
    
    return factors;
  }

  /**
   * Determine confidence level from score
   */
  private determineConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  /**
   * Calculate expected weekly weight change
   */
  private calculateExpectedWeeklyChange(dailyTarget: number, estimatedTDEE: number): number {
    const dailyBalance = dailyTarget - estimatedTDEE;
    const weeklyBalance = dailyBalance * 7;
    
    // 7700 kcal ≈ 1 kg body weight
    return weeklyBalance / 7700;
  }

  /**
   * Generate actionable recommendations
   */
  private generateActionableRecommendations(
    profile: UserMetabolismProfile,
    weightTrend: WeightTrendAnalysis,
    goalType: 'weight_loss' | 'weight_gain' | 'maintenance'
  ): { calorie: string[]; timing: string[]; adjustment: string[] } {
    const recommendations = {
      calorie: [] as string[],
      timing: [] as string[],
      adjustment: [] as string[]
    };
    
    // Calorie recommendations
    if (profile.confidenceScore < 60) {
      recommendations.calorie.push('Track consistently for 2+ weeks to improve recommendation accuracy');
    }
    
    if (profile.activeVsRestDayRatio > 2) {
      recommendations.calorie.push('Consider eating more on training days and less on rest days');
    }
    
    // Timing recommendations based on activity patterns
    const mostActiveDay = profile.weeklyActivityPattern.indexOf(Math.max(...profile.weeklyActivityPattern));
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (mostActiveDay >= 0 && profile.weeklyActivityPattern[mostActiveDay] > 200) {
      recommendations.timing.push(`${dayNames[mostActiveDay]} appears to be your most active day - consider higher carb intake`);
    }
    
    // Adjustment recommendations
    if (weightTrend.metabolicAdaptation) {
      recommendations.adjustment.push('Consider a brief diet break or refeed day to reset metabolism');
    }
    
    if (weightTrend.consistency < 50) {
      recommendations.adjustment.push('Weight fluctuations are normal - focus on weekly averages rather than daily changes');
    }
    
    return recommendations;
  }

  /**
   * Create profile for insufficient data
   */
  private createInsufficientDataProfile(): UserMetabolismProfile {
    const estimatedBMR = this.calculateEstimatedBMR();
    const estimatedTDEE = this.calculateStandardTDEE();
    
    return {
      estimatedBMR,
      estimatedTDEE,
      averageDailyBurn: 0,
      averageDailyConsumption: 0,
      activeVsRestDayRatio: 1,
      weeklyActivityPattern: new Array(7).fill(0),
      seasonalVariations: {},
      dataQuality: 'insufficient',
      confidenceScore: 20,
      totalDataPoints: this.weeklyData.length,
      analysisDateRange: {
        start: new Date(),
        end: new Date()
      }
    };
  }
}