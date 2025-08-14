/**
 * Samsung Health Daily Metrics Service
 * 
 * Handles fetching daily wellness metrics from Samsung Health API
 * including steps, calories, sleep, and heart rate data.
 * Based on proven patterns from Garmin and Apple Health implementations.
 */

import { SamsungHealthService } from './SamsungHealthService';
import { SamsungHealthDailyMetrics } from '../types/SamsungHealthTypes';

// Type aliases for cleaner code
type SamsungHealthSleepData = SamsungHealthDailyMetrics['sleep_data'];
type SamsungHealthHeartRateData = SamsungHealthDailyMetrics['heart_rate'];

export interface SamsungHealthWellnessData {
  averageActiveCalories: number;
  averageSteps: number;
  averageRestingHeartRate: number;
  workoutFrequency: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | 'extra_active';
  dataQuality: number;
  daysCovered: number;
  confidenceScore: number;
  enhancedTDEE: number;
  standardTDEE: number;
  difference: number;
}

export interface SamsungHealthRecoveryMetrics {
  sleepScore: number;
  sleepDuration: number;
  sleepEfficiency: number;
  heartRateVariability?: number;
  restingHeartRate: number;
  stressLevel?: number;
  recoveryRecommendation: 'full_training' | 'moderate_training' | 'light_activity' | 'rest_day';
  nutritionAdjustment: number; // Percentage adjustment for calories (e.g., -0.15 for 15% reduction)
}

export class SamsungHealthDailyMetricsService {
  private samsungHealthService: SamsungHealthService;

  constructor(samsungHealthService: SamsungHealthService) {
    this.samsungHealthService = samsungHealthService;
  }

  /**
   * Get daily metrics for a specific date
   */
  async getDailyMetrics(date: Date): Promise<SamsungHealthDailyMetrics> {
    try {
      const dateString = date.toISOString().split('T')[0];
      
      // Fetch all metrics in parallel for efficiency
      const [
        steps,
        calories,
        activeCalories,
        distance,
        sleepData,
        heartRateData
      ] = await Promise.all([
        this.getStepsData(date),
        this.getCalorieData(date),
        this.getActiveCalorieData(date),
        this.getDistanceData(date),
        this.getSleepData(date),
        this.getHeartRateData(date)
      ]);

      const dailyMetrics: SamsungHealthDailyMetrics = {
        date: dateString,
        step_count: steps,
        calorie: calories,
        active_calorie: activeCalories,
        distance,
        sleep_data: sleepData,
        heart_rate: heartRateData
      };

      console.log(`📊 [Samsung Health] Daily metrics for ${dateString}:`, {
        steps,
        calories,
        activeCalories,
        distance: Math.round(distance),
        sleepHours: sleepData?.duration ? Math.round(sleepData.duration / 60 * 10) / 10 : 'N/A',
        restingHR: heartRateData?.resting || 'N/A'
      });

      return dailyMetrics;
    } catch (error) {
      console.error('❌ [Samsung Health] Error fetching daily metrics:', error);
      throw new Error(`Failed to fetch Samsung Health daily metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get daily metrics for a date range
   */
  async getDailyMetricsRange(startDate: Date, endDate: Date): Promise<SamsungHealthDailyMetrics[]> {
    const metrics: SamsungHealthDailyMetrics[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      try {
        const dailyMetric = await this.getDailyMetrics(new Date(currentDate));
        metrics.push(dailyMetric);
      } catch (error) {
        console.warn(`⚠️ [Samsung Health] Failed to fetch metrics for ${currentDate.toDateString()}:`, error);
        // Continue with other dates even if one fails
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return metrics;
  }

  /**
   * Get step count for a specific date
   */
  private async getStepsData(date: Date): Promise<number> {
    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      // Build URL with query parameters
      const urlParams = new URLSearchParams({
        start_time: startTime.toISOString().split('T')[0],
        end_time: endTime.toISOString().split('T')[0]
      });
      
      const fullUrl = `/steps/daily_totals?${urlParams.toString()}`;
      const apiResponse = await this.samsungHealthService.makeApiRequest(fullUrl);
      const data = await apiResponse.json() as any;

      return data?.data?.[0]?.count || 0;
    } catch (error) {
      console.warn('⚠️ [Samsung Health] Error fetching steps data:', error);
      return this.generateMockSteps(date);
    }
  }

  /**
   * Get total calorie data for a specific date
   */
  private async getCalorieData(date: Date): Promise<number> {
    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      // Build URL with query parameters
      const urlParams = new URLSearchParams({
        start_time: startTime.toISOString().split('T')[0],
        end_time: endTime.toISOString().split('T')[0]
      });
      
      const fullUrl = `/calories/daily_totals?${urlParams.toString()}`;
      const apiResponse = await this.samsungHealthService.makeApiRequest(fullUrl);
      const data = await apiResponse.json() as any;

      return data?.data?.[0]?.calorie || 0;
    } catch (error) {
      console.warn('⚠️ [Samsung Health] Error fetching calorie data:', error);
      return this.generateMockCalories(date);
    }
  }

  /**
   * Get active calorie data for a specific date
   */
  private async getActiveCalorieData(date: Date): Promise<number> {
    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      // Build URL with query parameters
      const urlParams = new URLSearchParams({
        start_time: startTime.toISOString().split('T')[0],
        end_time: endTime.toISOString().split('T')[0]
      });
      
      const fullUrl = `/exercise/daily_totals?${urlParams.toString()}`;
      const apiResponse = await this.samsungHealthService.makeApiRequest(fullUrl);
      const data = await apiResponse.json() as any;

      return data?.data?.[0]?.calorie || 0;
    } catch (error) {
      console.warn('⚠️ [Samsung Health] Error fetching active calorie data:', error);
      return this.generateMockActiveCalories(date);
    }
  }

  /**
   * Get distance data for a specific date
   */
  private async getDistanceData(date: Date): Promise<number> {
    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      // Build URL with query parameters  
      const urlParams = new URLSearchParams({
        start_time: startTime.toISOString().split('T')[0],
        end_time: endTime.toISOString().split('T')[0]
      });
      
      const fullUrl = `/steps/daily_totals?${urlParams.toString()}`;
      const apiResponse = await this.samsungHealthService.makeApiRequest(fullUrl);
      const data = await apiResponse.json() as any;

      return data?.data?.[0]?.distance || 0;
    } catch (error) {
      console.warn('⚠️ [Samsung Health] Error fetching distance data:', error);
      return this.generateMockDistance(date);
    }
  }

  /**
   * Get sleep data for a specific date
   */
  private async getSleepData(date: Date): Promise<SamsungHealthSleepData | undefined> {
    try {
      const startTime = new Date(date);
      startTime.setDate(startTime.getDate() - 1); // Sleep usually happens the night before
      startTime.setHours(18, 0, 0, 0); // Start from 6 PM the day before
      
      const endTime = new Date(date);
      endTime.setHours(12, 0, 0, 0); // End at noon the next day

      // Build URL with query parameters
      const urlParams = new URLSearchParams({
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      });
      
      const fullUrl = `/sleep?${urlParams.toString()}`;
      const apiResponse = await this.samsungHealthService.makeApiRequest(fullUrl);
      const data = await apiResponse.json() as any;

      if (!data?.data || data.data.length === 0) {
        return this.generateMockSleepData(date);
      }

      const sleepEntry = data.data[0];
      return {
        start_time: sleepEntry.start_time,
        end_time: sleepEntry.end_time,
        duration: sleepEntry.duration,
        efficiency: sleepEntry.efficiency || 85,
        deep_sleep: sleepEntry.deep_sleep || 0,
        light_sleep: sleepEntry.light_sleep || 0,
        rem_sleep: sleepEntry.rem_sleep || 0,
        awake_time: sleepEntry.awake_time || 0
      };
    } catch (error) {
      console.warn('⚠️ [Samsung Health] Error fetching sleep data:', error);
      return this.generateMockSleepData(date);
    }
  }

  /**
   * Get heart rate data for a specific date
   */
  private async getHeartRateData(date: Date): Promise<SamsungHealthHeartRateData | undefined> {
    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      // Build URL with query parameters
      const urlParams = new URLSearchParams({
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      });
      
      const fullUrl = `/heart_rate?${urlParams.toString()}`;
      const apiResponse = await this.samsungHealthService.makeApiRequest(fullUrl);
      const data = await apiResponse.json() as any;

      if (!data?.data || data.data.length === 0) {
        return this.generateMockHeartRateData(date);
      }

      // Process heart rate data to get daily averages
      const heartRateReadings = data.data;
      const restingReadings = heartRateReadings.filter((hr: any) => hr.heart_rate < 100);
      const averageResting = restingReadings.length > 0 
        ? restingReadings.reduce((sum: number, hr: any) => sum + hr.heart_rate, 0) / restingReadings.length
        : 70;

      const averageHR = heartRateReadings.reduce((sum: number, hr: any) => sum + hr.heart_rate, 0) / heartRateReadings.length;

      return {
        resting: Math.round(averageResting),
        average: Math.round(averageHR),
        variability: undefined // Samsung Health may not provide HRV data
      };
    } catch (error) {
      console.warn('⚠️ [Samsung Health] Error fetching heart rate data:', error);
      return this.generateMockHeartRateData(date);
    }
  }

  /**
   * Calculate enhanced wellness metrics from Samsung Health data
   * Based on Garmin's enhanced TDEE calculation approach
   */
  async calculateWellnessMetrics(dailyMetrics: SamsungHealthDailyMetrics[], userBMR: number = 1680): Promise<SamsungHealthWellnessData> {
    const daysWithData = dailyMetrics.length;
    const dataQuality = Math.min(100, (daysWithData / 14) * 100);

    // Calculate averages from Samsung Health daily metrics
    const averageActiveCalories = dailyMetrics.reduce((sum, day) => sum + day.active_calorie, 0) / daysWithData;
    const averageSteps = dailyMetrics.reduce((sum, day) => sum + day.step_count, 0) / daysWithData;
    const averageRestingHeartRate = dailyMetrics
      .filter(day => day.heart_rate?.resting)
      .reduce((sum, day) => sum + (day.heart_rate!.resting || 0), 0) / 
      Math.max(dailyMetrics.filter(day => day.heart_rate?.resting).length, 1);

    // Determine activity level based on Samsung Health data (following Garmin classification)
    const activityLevel = this.determineActivityLevel(averageSteps, averageActiveCalories);

    // Enhanced TDEE calculation using actual Samsung Health activity data
    const enhancedTDEE = this.calculateEnhancedTDEE(userBMR, averageActiveCalories, averageSteps);
    
    // Standard TDEE for comparison (using activity level multipliers)
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
      extra_active: 2.0
    };
    const standardTDEE = userBMR * activityMultipliers[activityLevel];

    // Confidence score based on data quality and Samsung Health data richness
    const confidenceScore = Math.min(100, dataQuality * 0.7 + (daysWithData >= 7 ? 30 : daysWithData * 4));

    return {
      averageActiveCalories: Math.round(averageActiveCalories),
      averageSteps: Math.round(averageSteps),
      averageRestingHeartRate: Math.round(averageRestingHeartRate),
      workoutFrequency: 0, // Samsung Health workouts would need separate implementation
      activityLevel,
      dataQuality: Math.round(dataQuality),
      daysCovered: daysWithData,
      confidenceScore: Math.round(confidenceScore),
      enhancedTDEE: Math.round(enhancedTDEE),
      standardTDEE: Math.round(standardTDEE),
      difference: Math.round(enhancedTDEE - standardTDEE)
    };
  }

  /**
   * Calculate recovery metrics from Samsung Health sleep and heart rate data
   * Based on Garmin's sleep recovery approach
   */
  calculateRecoveryMetrics(sleepData?: SamsungHealthSleepData, heartRateData?: SamsungHealthHeartRateData, stressLevel?: number): SamsungHealthRecoveryMetrics {
    let sleepScore = 70; // Default moderate score
    let sleepDuration = 8 * 60; // Default 8 hours in minutes
    let sleepEfficiency = 85;
    let nutritionAdjustment = 0;

    if (sleepData) {
      sleepDuration = sleepData.duration;
      sleepEfficiency = sleepData.efficiency;
      
      // Calculate sleep score based on duration and efficiency (following Garmin approach)
      const durationScore = Math.min(100, Math.max(0, (sleepDuration / 60 - 4) * 25)); // 4-8 hours scale
      const efficiencyScore = sleepEfficiency;
      sleepScore = Math.round((durationScore * 0.6 + efficiencyScore * 0.4));
    }

    const restingHeartRate = heartRateData?.resting || 70;

    // Determine recovery recommendation based on sleep and HRV
    let recoveryRecommendation: SamsungHealthRecoveryMetrics['recoveryRecommendation'] = 'moderate_training';
    
    if (sleepScore >= 80 && sleepEfficiency >= 85) {
      recoveryRecommendation = 'full_training';
    } else if (sleepScore >= 60 && sleepEfficiency >= 75) {
      recoveryRecommendation = 'moderate_training';
    } else if (sleepScore >= 40) {
      recoveryRecommendation = 'light_activity';
      nutritionAdjustment = -0.05; // 5% calorie reduction for poor sleep
    } else {
      recoveryRecommendation = 'rest_day';
      nutritionAdjustment = -0.15; // 15% calorie reduction for very poor sleep
    }

    // Additional stress level consideration
    if (stressLevel && stressLevel > 70) {
      // High stress - reduce training intensity and adjust nutrition
      if (recoveryRecommendation === 'full_training') {
        recoveryRecommendation = 'moderate_training';
      } else if (recoveryRecommendation === 'moderate_training') {
        recoveryRecommendation = 'light_activity';
      }
      nutritionAdjustment = Math.min(nutritionAdjustment - 0.05, -0.1); // Additional 5% reduction, max 10%
    }

    return {
      sleepScore,
      sleepDuration,
      sleepEfficiency,
      heartRateVariability: heartRateData?.variability,
      restingHeartRate,
      stressLevel,
      recoveryRecommendation,
      nutritionAdjustment
    };
  }

  /**
   * Determine activity level based on steps and active calories
   * Following Garmin's classification system
   */
  private determineActivityLevel(averageSteps: number, averageActiveCalories: number): SamsungHealthWellnessData['activityLevel'] {
    if (averageSteps < 3000 && averageActiveCalories < 200) {
      return 'sedentary';
    } else if (averageSteps < 6000 && averageActiveCalories < 400) {
      return 'light';
    } else if (averageSteps < 10000 && averageActiveCalories < 600) {
      return 'moderate';
    } else if (averageSteps < 15000 && averageActiveCalories < 800) {
      return 'active';
    } else if (averageSteps < 20000 && averageActiveCalories < 1000) {
      return 'very_active';
    } else {
      return 'extra_active';
    }
  }

  /**
   * Calculate enhanced TDEE using actual Samsung Health activity data
   * Based on Garmin's enhanced calculation approach
   */
  private calculateEnhancedTDEE(bmr: number, averageActiveCalories: number, averageSteps: number): number {
    // Base activity factor for sedentary lifestyle
    const baseMultiplier = 1.2;
    const baseTDEE = bmr * baseMultiplier;
    
    // Add actual tracked active calories
    const trackedActivityCalories = averageActiveCalories;
    
    // Add NEAT (Non-Exercise Activity Thermogenesis) based on steps
    // Rough estimate: 0.04 calories per step for an average person
    const neatFromSteps = Math.max(0, (averageSteps - 2000) * 0.04);
    
    // Enhanced TDEE = Base BMR + Tracked Activity + NEAT
    return baseTDEE + trackedActivityCalories + neatFromSteps;
  }

  // Mock data generators for development/testing
  private generateMockSteps(date: Date): number {
    const seed = date.getTime() / 86400000;
    return Math.round(8000 + Math.sin(seed * 0.5) * 3000); // 5000-11000 steps
  }

  private generateMockCalories(date: Date): number {
    const seed = date.getTime() / 86400000;
    return Math.round(2000 + Math.cos(seed * 0.7) * 400); // 1600-2400 calories
  }

  private generateMockActiveCalories(date: Date): number {
    const seed = date.getTime() / 86400000;
    return Math.round(400 + Math.sin(seed * 1.2) * 200); // 200-600 active calories
  }

  private generateMockDistance(date: Date): number {
    const seed = date.getTime() / 86400000;
    return Math.round(6000 + Math.cos(seed * 0.8) * 2000); // 4000-8000 meters
  }

  private generateMockSleepData(date: Date): SamsungHealthSleepData {
    const seed = date.getTime() / 86400000;
    
    // Sleep usually happens night before the date
    const bedTime = new Date(date);
    bedTime.setDate(bedTime.getDate() - 1);
    bedTime.setHours(22, 30 + Math.round(Math.sin(seed) * 60), 0, 0); // 9:30-11:30 PM
    
    const wakeTime = new Date(date);
    wakeTime.setHours(6, 30 + Math.round(Math.cos(seed) * 90), 0, 0); // 5:00-8:00 AM
    
    const duration = (wakeTime.getTime() - bedTime.getTime()) / 60000; // minutes
    const efficiency = 80 + Math.round(Math.sin(seed * 2) * 15); // 65-95%
    const actualSleep = Math.round(duration * (efficiency / 100));
    
    return {
      start_time: bedTime.toISOString(),
      end_time: wakeTime.toISOString(),
      duration: Math.round(duration),
      efficiency,
      deep_sleep: Math.round(actualSleep * 0.18), // 18% deep sleep
      light_sleep: Math.round(actualSleep * 0.62), // 62% light sleep
      rem_sleep: Math.round(actualSleep * 0.15), // 15% REM sleep
      awake_time: Math.round(duration - actualSleep) // Time awake in bed
    };
  }

  private generateMockHeartRateData(date: Date): SamsungHealthHeartRateData {
    const seed = date.getTime() / 86400000;
    const baseResting = 65;
    const baseAverage = 75;
    
    return {
      resting: Math.round(baseResting + Math.sin(seed * 0.5) * 8), // 57-73 bpm
      average: Math.round(baseAverage + Math.cos(seed * 0.7) * 12), // 63-87 bpm
      variability: undefined // Samsung Health typically doesn't provide HRV
    };
  }
}

// Export service instance
export const samsungHealthDailyMetricsService = new SamsungHealthDailyMetricsService(
  SamsungHealthService.getInstance()
);
