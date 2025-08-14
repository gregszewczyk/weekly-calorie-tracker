/**
 * Apple Health AI Context Service
 * 
 * Transforms Apple Health data into enhanced context for AI nutrition recommendations.
 * Provides comprehensive analysis of activity patterns, recovery metrics, and health trends.
 */

import { appleHealthKitService } from './AppleHealthKitService';
import { AppleHealthEnhancedContext } from './PerplexityService';
import { AppleHealthDailyMetrics, AppleHealthKitWorkout, AppleHealthBodyComposition } from '../types/AppleHealthKitTypes';
import { Platform } from 'react-native';

export class AppleHealthAIContextService {
  
  /**
   * Generate comprehensive Apple Health context for AI recommendations
   */
  async generateEnhancedContext(): Promise<AppleHealthEnhancedContext | null> {
    try {
      if (Platform.OS !== 'ios') {
        console.log('📱 Apple Health context not available on non-iOS platform');
        return null;
      }

      const availability = await appleHealthKitService.isAvailable();
      if (!availability.isAvailable) {
        console.log('📱 Apple Health not available:', availability.message);
        return null;
      }

      const connectionStatus = await appleHealthKitService.getConnectionStatus();
      if (!connectionStatus.isConnected) {
        console.log('📱 Apple Health not connected');
        return null;
      }

      console.log('🍎 [AppleHealthAI] Generating enhanced context for AI recommendations...');

      // Get date ranges for analysis
      const endDate = new Date();
      const startDate14Days = new Date();
      startDate14Days.setDate(endDate.getDate() - 14);
      const startDate7Days = new Date();
      startDate7Days.setDate(endDate.getDate() - 7);
      const today = new Date();

      // Gather all Apple Health data
      const [
        recentWorkouts,
        weeklyMetrics,
        todayMetrics,
        bodyComposition
      ] = await Promise.all([
        this.getRecentWorkouts(startDate14Days, endDate),
        this.getWeeklyActivitySummary(startDate7Days, endDate),
        this.getTodaysActivity(today),
        this.getBodyComposition().catch(() => null) // Optional, may not be available
      ]);

      // Generate enhanced context
      const enhancedContext: AppleHealthEnhancedContext = {
        recentWorkouts,
        weeklyActivitySummary: weeklyMetrics,
        sleepTrends: await this.analyzeSleepTrends(startDate7Days, endDate),
        recoveryMetrics: await this.analyzeRecoveryMetrics(startDate7Days, endDate),
        todaysActivity: todayMetrics,
        activityRingCompletion: this.calculateActivityRingCompletion(weeklyMetrics),
        bodyComposition: bodyComposition || undefined
      };

      console.log('🍎 [AppleHealthAI] Enhanced context generated successfully:', {
        workouts: recentWorkouts.length,
        sleepTrend: enhancedContext.sleepTrends.recentTrend,
        recovery: enhancedContext.recoveryMetrics.overallRecoveryStatus,
        todaySteps: todayMetrics.stepsSoFar
      });

      return enhancedContext;

    } catch (error) {
      console.error('❌ [AppleHealthAI] Error generating enhanced context:', error);
      return null;
    }
  }

  /**
   * Get recent workouts from Apple Health
   */
  private async getRecentWorkouts(startDate: Date, endDate: Date): Promise<AppleHealthKitWorkout[]> {
    try {
      return await appleHealthKitService.getWorkouts(startDate, endDate);
    } catch (error) {
      console.error('❌ [AppleHealthAI] Error getting recent workouts:', error);
      return [];
    }
  }

  /**
   * Calculate weekly activity summary
   */
  private async getWeeklyActivitySummary(startDate: Date, endDate: Date): Promise<AppleHealthEnhancedContext['weeklyActivitySummary']> {
    try {
      const dailyMetrics: AppleHealthDailyMetrics[] = [];
      
      // Get daily metrics for the past 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        try {
          const metrics = await appleHealthKitService.getDailyMetrics(date);
          if (metrics) {
            dailyMetrics.push(metrics);
          }
        } catch (error) {
          console.warn(`Failed to get metrics for ${date.toISOString().split('T')[0]}:`, error);
        }
      }

      // Calculate averages
      const totalActiveCalories = dailyMetrics.reduce((sum, day) => sum + day.activeEnergyBurned, 0);
      const totalSteps = dailyMetrics.reduce((sum, day) => sum + day.steps, 0);
      const totalWorkoutMinutes = dailyMetrics.reduce((sum, day) => {
        // Estimate workout minutes from active calories (rough approximation)
        return sum + Math.min(120, Math.max(0, day.activeEnergyBurned / 8)); // ~8 cal/min
      }, 0);
      const totalStandHours = dailyMetrics.reduce((sum, day) => sum + (day.standHours || 0), 0);

      return {
        activeCalories: Math.round(totalActiveCalories),
        steps: Math.round(totalSteps),
        workoutMinutes: Math.round(totalWorkoutMinutes),
        standHours: Math.round(totalStandHours)
      };

    } catch (error) {
      console.error('❌ [AppleHealthAI] Error calculating weekly summary:', error);
      return {
        activeCalories: 0,
        steps: 0,
        workoutMinutes: 0,
        standHours: 0
      };
    }
  }

  /**
   * Get today's real-time activity
   */
  private async getTodaysActivity(today: Date): Promise<AppleHealthEnhancedContext['todaysActivity']> {
    try {
      const todayMetrics = await appleHealthKitService.getDailyMetrics(today);
      
      if (!todayMetrics) {
        return {
          stepsSoFar: 0,
          activeCalories: 0,
          standHours: 0
        };
      }

      return {
        stepsSoFar: todayMetrics.steps,
        activeCalories: todayMetrics.activeEnergyBurned,
        standHours: todayMetrics.standHours || 0,
        // Note: workoutPlanned would need integration with calendar/workout planning
      };

    } catch (error) {
      console.error('❌ [AppleHealthAI] Error getting today\'s activity:', error);
      return {
        stepsSoFar: 0,
        activeCalories: 0,
        standHours: 0
      };
    }
  }

  /**
   * Analyze sleep trends
   */
  private async analyzeSleepTrends(startDate: Date, endDate: Date): Promise<AppleHealthEnhancedContext['sleepTrends']> {
    try {
      const dailyMetrics: AppleHealthDailyMetrics[] = [];
      
      // Get sleep data for the past 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        try {
          const metrics = await appleHealthKitService.getDailyMetrics(date);
          if (metrics?.sleepAnalysis) {
            dailyMetrics.push(metrics);
          }
        } catch (error) {
          console.warn(`Failed to get sleep data for ${date.toISOString().split('T')[0]}:`, error);
        }
      }

      if (dailyMetrics.length === 0) {
        return {
          averageDuration: 8.0,
          efficiency: 85,
          deepSleepPercentage: 20,
          recentTrend: 'stable'
        };
      }

      // Calculate sleep metrics
      const avgDuration = dailyMetrics.reduce((sum, day) => 
        sum + (day.sleepAnalysis!.timeAsleep / 60), 0) / dailyMetrics.length;
      
      const avgEfficiency = dailyMetrics.reduce((sum, day) => 
        sum + day.sleepAnalysis!.sleepEfficiency, 0) / dailyMetrics.length;

      // Estimate deep sleep percentage (Apple doesn't always provide sleep stages)
      const avgDeepSleep = dailyMetrics.reduce((sum, day) => {
        const stages = day.sleepAnalysis!.sleepStages;
        return sum + (stages?.deep ? (stages.deep / day.sleepAnalysis!.timeAsleep) * 100 : 20);
      }, 0) / dailyMetrics.length;

      // Determine trend based on recent vs older data
      const recentTrend = this.calculateSleepTrend(dailyMetrics);

      return {
        averageDuration: Math.round(avgDuration * 10) / 10,
        efficiency: Math.round(avgEfficiency),
        deepSleepPercentage: Math.round(avgDeepSleep),
        recentTrend
      };

    } catch (error) {
      console.error('❌ [AppleHealthAI] Error analyzing sleep trends:', error);
      return {
        averageDuration: 8.0,
        efficiency: 85,
        deepSleepPercentage: 20,
        recentTrend: 'stable'
      };
    }
  }

  /**
   * Analyze recovery metrics
   */
  private async analyzeRecoveryMetrics(startDate: Date, endDate: Date): Promise<AppleHealthEnhancedContext['recoveryMetrics']> {
    try {
      const dailyMetrics: AppleHealthDailyMetrics[] = [];
      
      // Get heart rate data for the past 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        try {
          const metrics = await appleHealthKitService.getDailyMetrics(date);
          if (metrics?.heartRateData) {
            dailyMetrics.push(metrics);
          }
        } catch (error) {
          console.warn(`Failed to get heart rate data for ${date.toISOString().split('T')[0]}:`, error);
        }
      }

      if (dailyMetrics.length === 0) {
        return {
          restingHeartRate: 60,
          heartRateVariability: 35,
          trend: 'stable',
          overallRecoveryStatus: 'good'
        };
      }

      // Calculate heart rate metrics
      const avgRestingHR = dailyMetrics.reduce((sum, day) => 
        sum + (day.heartRateData!.resting || 60), 0) / dailyMetrics.length;
      
      const avgHRV = dailyMetrics.reduce((sum, day) => 
        sum + (day.heartRateData!.variability || 35), 0) / dailyMetrics.length;

      // Determine trends
      const hrTrend = this.calculateHeartRateTrend(dailyMetrics);
      const overallStatus = this.assessOverallRecovery(avgRestingHR, avgHRV, hrTrend);

      return {
        restingHeartRate: Math.round(avgRestingHR),
        heartRateVariability: Math.round(avgHRV),
        trend: hrTrend,
        overallRecoveryStatus: overallStatus
      };

    } catch (error) {
      console.error('❌ [AppleHealthAI] Error analyzing recovery metrics:', error);
      return {
        restingHeartRate: 60,
        heartRateVariability: 35,
        trend: 'stable',
        overallRecoveryStatus: 'good'
      };
    }
  }

  /**
   * Get body composition data
   */
  private async getBodyComposition(): Promise<AppleHealthEnhancedContext['bodyComposition']> {
    try {
      const today = new Date();
      const composition = await appleHealthKitService.getBodyComposition(today);
      
      if (!composition) {
        return undefined;
      }

      // Get recent weight trend (simplified - could be enhanced)
      const weightTrend = this.determineWeightTrend(composition.bodyMass);

      return {
        currentWeight: composition.bodyMass,
        recentWeightTrend: weightTrend,
        bodyFatPercentage: composition.bodyFatPercentage,
        leanBodyMass: composition.leanBodyMass
      };

    } catch (error) {
      console.error('❌ [AppleHealthAI] Error getting body composition:', error);
      return undefined;
    }
  }

  /**
   * Calculate activity ring completion percentages
   */
  private calculateActivityRingCompletion(weeklyActivity: AppleHealthEnhancedContext['weeklyActivitySummary']): AppleHealthEnhancedContext['activityRingCompletion'] {
    // Apple Watch default goals (these could be personalized)
    const MOVE_GOAL = 400; // kcal per day
    const EXERCISE_GOAL = 30; // minutes per day
    const STAND_GOAL = 12; // hours per day

    const dailyMoveAvg = weeklyActivity.activeCalories / 7;
    const dailyExerciseAvg = weeklyActivity.workoutMinutes / 7;
    const dailyStandAvg = weeklyActivity.standHours / 7;

    return {
      move: Math.min(100, Math.round((dailyMoveAvg / MOVE_GOAL) * 100)),
      exercise: Math.min(100, Math.round((dailyExerciseAvg / EXERCISE_GOAL) * 100)),
      stand: Math.min(100, Math.round((dailyStandAvg / STAND_GOAL) * 100))
    };
  }

  /**
   * Calculate sleep trend direction
   */
  private calculateSleepTrend(dailyMetrics: AppleHealthDailyMetrics[]): 'improving' | 'declining' | 'stable' {
    if (dailyMetrics.length < 4) return 'stable';

    const recentSleep = dailyMetrics.slice(-3).map(d => d.sleepAnalysis!.timeAsleep / 60);
    const olderSleep = dailyMetrics.slice(0, -3).map(d => d.sleepAnalysis!.timeAsleep / 60);

    const recentAvg = recentSleep.reduce((a, b) => a + b, 0) / recentSleep.length;
    const olderAvg = olderSleep.reduce((a, b) => a + b, 0) / olderSleep.length;

    const difference = recentAvg - olderAvg;

    if (Math.abs(difference) < 0.3) return 'stable';
    return difference > 0 ? 'improving' : 'declining';
  }

  /**
   * Calculate heart rate trend direction
   */
  private calculateHeartRateTrend(dailyMetrics: AppleHealthDailyMetrics[]): 'improving' | 'declining' | 'stable' {
    if (dailyMetrics.length < 4) return 'stable';

    const recentHR = dailyMetrics.slice(-3).map(d => d.heartRateData!.resting || 60);
    const olderHR = dailyMetrics.slice(0, -3).map(d => d.heartRateData!.resting || 60);

    const recentAvg = recentHR.reduce((a, b) => a + b, 0) / recentHR.length;
    const olderAvg = olderHR.reduce((a, b) => a + b, 0) / olderHR.length;

    const difference = recentAvg - olderAvg;

    if (Math.abs(difference) < 2) return 'stable';
    // Lower resting HR is better, so negative difference is improving
    return difference < 0 ? 'improving' : 'declining';
  }

  /**
   * Assess overall recovery status
   */
  private assessOverallRecovery(
    restingHR: number, 
    hrv: number, 
    trend: 'improving' | 'declining' | 'stable'
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    // These thresholds are general guidelines and should be personalized
    let score = 0;

    // Resting heart rate assessment
    if (restingHR < 50) score += 3;
    else if (restingHR < 60) score += 2;
    else if (restingHR < 70) score += 1;

    // HRV assessment  
    if (hrv > 50) score += 3;
    else if (hrv > 35) score += 2;
    else if (hrv > 20) score += 1;

    // Trend assessment
    if (trend === 'improving') score += 2;
    else if (trend === 'stable') score += 1;

    if (score >= 7) return 'excellent';
    if (score >= 5) return 'good';
    if (score >= 3) return 'fair';
    return 'poor';
  }

  /**
   * Determine weight trend (simplified)
   */
  private determineWeightTrend(currentWeight: number): 'gaining' | 'losing' | 'stable' {
    // This is a simplified implementation
    // In a real app, you'd compare with historical weight data
    return 'stable';
  }
}

// Export singleton instance
export const appleHealthAIContextService = new AppleHealthAIContextService();
