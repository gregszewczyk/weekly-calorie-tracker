/**
 * Samsung Health Data Processor
 * 
 * Handles fetching, processing, and transforming Samsung Health data
 * for integration with the app's nutrition tracking system
 */

import { format, parseISO, subDays } from 'date-fns';
import { SamsungHealthService } from './SamsungHealthService';
import { useCalorieStore } from '../stores/calorieStore';
import {
  SamsungHealthActivity,
  SamsungHealthDailyMetrics,
  SamsungHealthBodyComposition,
  SamsungHealthSyncResult,
  SamsungHealthException,
  SamsungHealthErrorType,
  SAMSUNG_EXERCISE_MAPPING,
  SAMSUNG_HEALTH_ENDPOINTS
} from '../types/SamsungHealthTypes';
import { WorkoutSession } from '../types/CalorieTypes';
import { SportType } from '../types/AthleteTypes';

export class SamsungHealthDataProcessor {
  private static instance: SamsungHealthDataProcessor;
  private samsungHealthService: SamsungHealthService;
  private calorieStore: any;
  private processedActivityIds: Set<string> = new Set();
  private isProcessing = false;

  private constructor() {
    this.samsungHealthService = SamsungHealthService.getInstance();
    this.calorieStore = useCalorieStore.getState();
    this.loadProcessedActivityIds();
  }

  public static getInstance(): SamsungHealthDataProcessor {
    if (!SamsungHealthDataProcessor.instance) {
      SamsungHealthDataProcessor.instance = new SamsungHealthDataProcessor();
    }
    return SamsungHealthDataProcessor.instance;
  }

  /**
   * Sync Samsung Health activities for a specific date range
   */
  public async syncActivities(
    startDate: Date = subDays(new Date(), 7),
    endDate: Date = new Date()
  ): Promise<SamsungHealthSyncResult> {
    try {
      console.log('🔄 [Samsung Sync] Starting activity sync...');
      console.log(`   Date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

      if (this.isProcessing) {
        throw new SamsungHealthException(
          SamsungHealthErrorType.API_ERROR,
          'Sync already in progress'
        );
      }

      this.isProcessing = true;

      // Check if Samsung Health service is connected
      const isConnected = await this.samsungHealthService.isConnected();
      if (!isConnected) {
        throw new SamsungHealthException(
          SamsungHealthErrorType.AUTHENTICATION_FAILED,
          'Samsung Health not connected'
        );
      }

      const syncResult: SamsungHealthSyncResult = {
        success: false,
        activitiesCount: 0,
        newWorkouts: [],
        lastSyncTime: new Date()
      };

      // Fetch activities from Samsung Health
      const activities = await this.fetchActivities(startDate, endDate);
      console.log(`📊 [Samsung Sync] Fetched ${activities.length} activities`);

      // Process and filter new activities
      const newActivities = activities.filter(activity => 
        !this.processedActivityIds.has(activity.uuid)
      );

      console.log(`🆕 [Samsung Sync] Found ${newActivities.length} new activities`);

      // Transform and log activities
      const processedWorkouts: Omit<WorkoutSession, 'id' | 'timestamp'>[] = [];
      for (const activity of newActivities) {
        try {
          const workout = await this.transformActivityToWorkout(activity);
          if (workout) {
            await this.logWorkoutToStore(workout);
            processedWorkouts.push(workout);
            this.processedActivityIds.add(activity.uuid);
            console.log(`✅ [Samsung Sync] Processed: ${workout.sport} (${workout.duration}min, ${workout.caloriesBurned}kcal)`);
          }
        } catch (error) {
          console.error(`❌ [Samsung Sync] Failed to process activity ${activity.uuid}:`, error);
        }
      }

      // Save processed activity IDs
      await this.saveProcessedActivityIds();

      syncResult.success = true;
      syncResult.activitiesCount = processedWorkouts.length;
      syncResult.newWorkouts = newActivities;

      console.log(`🎉 [Samsung Sync] Successfully synced ${processedWorkouts.length} activities`);
      return syncResult;

    } catch (error) {
      console.error('❌ [Samsung Sync] Activity sync failed:', error);
      
      const syncResult: SamsungHealthSyncResult = {
        success: false,
        activitiesCount: 0,
        newWorkouts: [],
        error: (error as Error).message,
        lastSyncTime: new Date()
      };

      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Fetch activities from Samsung Health API
   */
  private async fetchActivities(
    startDate: Date,
    endDate: Date
  ): Promise<SamsungHealthActivity[]> {
    try {
      const params = {
        start_time: format(startDate, 'yyyy-MM-dd'),
        end_time: format(endDate, 'yyyy-MM-dd'),
        limit: '100'
      };

      console.log('📡 [Samsung Sync] Fetching activities from API...');
      const activities = await this.samsungHealthService.getApiData<SamsungHealthActivity>(
        SAMSUNG_HEALTH_ENDPOINTS.ACTIVITIES,
        params,
        1000 // Max 1000 activities
      );

      return activities.sort((a, b) => 
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );

    } catch (error) {
      console.error('❌ [Samsung Sync] Failed to fetch activities:', error);
      throw new SamsungHealthException(
        SamsungHealthErrorType.API_ERROR,
        `Failed to fetch activities: ${(error as Error).message}`,
        undefined,
        error
      );
    }
  }

  /**
   * Transform Samsung Health activity to app workout format
   */
  private async transformActivityToWorkout(
    activity: SamsungHealthActivity
  ): Promise<Omit<WorkoutSession, 'id' | 'timestamp'> | null> {
    try {
      console.log(`🔄 [Samsung Transform] Processing activity: ${activity.uuid}`);

      // Map Samsung exercise type to app category
      const workoutSport = this.mapExerciseType(activity.exercise_type);
      if (!workoutSport) {
        console.log(`⚠️ [Samsung Transform] Unknown exercise type: ${activity.exercise_type}`);
        return null;
      }

      // Parse dates
      const startTime = parseISO(activity.start_time);
      const endTime = parseISO(activity.end_time);
      const duration = Math.round(activity.duration / 60000); // Convert ms to minutes

      // Validate data
      if (duration < 1) {
        console.log(`⚠️ [Samsung Transform] Activity too short: ${duration} minutes`);
        return null;
      }

      // Create workout entry (without id and timestamp - store will add these)
      const workout: Omit<WorkoutSession, 'id' | 'timestamp'> = {
        date: format(startTime, 'yyyy-MM-dd'),
        sport: workoutSport,
        name: this.getWorkoutName(activity),
        duration: duration,
        startTime: startTime,
        endTime: endTime,
        intensity: this.mapIntensity(activity),
        caloriesBurned: Math.round(activity.calorie || 0),
        distance: activity.distance ? activity.distance / 1000 : undefined, // Convert m to km
        avgHeartRate: activity.heart_rate?.average ? Math.round(activity.heart_rate.average) : undefined,
        maxHeartRate: activity.heart_rate?.max ? Math.round(activity.heart_rate.max) : undefined,
        notes: this.generateWorkoutNotes(activity),
        equipment: undefined, // Not available from Samsung Health
        location: undefined, // Not available from Samsung Health
        weather: undefined, // Not available from Samsung Health
        mood: undefined // Not available from Samsung Health
      };

      console.log(`✅ [Samsung Transform] Created workout: ${workout.sport} (${workout.duration}min)`);
      return workout;

    } catch (error) {
      console.error('❌ [Samsung Transform] Activity transformation failed:', error);
      return null;
    }
  }

  /**
   * Map Samsung exercise type to app workout category
   */
  private mapExerciseType(exerciseType: number): SportType | null {
    const mappedType = SAMSUNG_EXERCISE_MAPPING[exerciseType];
    if (mappedType) {
      // Map the string values to SportType
      switch (mappedType) {
        case 'running':
        case 'walking':
          return 'running';
        case 'cycling':
          return 'cycling';
        case 'swimming':
          return 'swimming';
        case 'strength':
          return 'strength-training';
        case 'cardio':
          return 'general-fitness';
        case 'sports':
          return 'team-sports';
        case 'martial-arts':
          return 'martial-arts';
        case 'crossfit':
          return 'crossfit';
        default:
          return 'general-fitness';
      }
    }

    // Handle unmapped types
    console.log(`⚠️ [Samsung Mapping] Unknown exercise type: ${exerciseType}`);
    
    // Provide fallback mapping based on type ranges
    if (exerciseType >= 1000 && exerciseType < 2000) {
      return 'running'; // Walking/Running family
    } else if (exerciseType >= 11000 && exerciseType < 12000) {
      return 'general-fitness'; // Gym equipment
    } else if (exerciseType >= 13000 && exerciseType < 14000) {
      return 'strength-training'; // Strength training
    } else if (exerciseType >= 14000 && exerciseType < 15000) {
      return 'swimming'; // Water sports
    } else if (exerciseType >= 15000 && exerciseType < 16000) {
      return 'team-sports'; // Ball sports
    } else {
      return 'general-fitness'; // Unknown category
    }
  }

  /**
   * Generate workout name from activity data
   */
  private getWorkoutName(activity: SamsungHealthActivity): string {
    const exerciseName = this.getExerciseTypeName(activity.exercise_type);
    const duration = Math.round(activity.duration / 60000);
    
    if (activity.distance && activity.distance > 0) {
      const distanceKm = (activity.distance / 1000).toFixed(1);
      return `${exerciseName} - ${distanceKm}km`;
    }
    
    return `${exerciseName} - ${duration}min`;
  }

  /**
   * Map activity intensity from Samsung Health data
   */
  private mapIntensity(activity: SamsungHealthActivity): 'recovery' | 'easy' | 'moderate' | 'hard' | 'max' {
    // Use heart rate if available
    if (activity.heart_rate?.average) {
      const avgHR = activity.heart_rate.average;
      // Basic intensity mapping based on HR zones
      if (avgHR < 120) return 'easy';
      if (avgHR < 140) return 'moderate';
      if (avgHR < 160) return 'hard';
      return 'max';
    }
    
    // Use duration and exercise type as fallback
    const durationMinutes = activity.duration / 60000;
    const exerciseType = activity.exercise_type;
    
    // Strength training is typically moderate to hard
    if (exerciseType >= 13000 && exerciseType < 14000) {
      return durationMinutes > 45 ? 'hard' : 'moderate';
    }
    
    // Cardio activities
    if (exerciseType >= 1000 && exerciseType < 2000 || exerciseType >= 11000 && exerciseType < 12000) {
      if (durationMinutes < 20) return 'moderate';
      if (durationMinutes < 45) return 'moderate';
      return 'hard';
    }
    
    // Default to moderate
    return 'moderate';
  }
  private generateWorkoutNotes(activity: SamsungHealthActivity): string {
    const notes: string[] = [];
    
    // Add distance if available
    if (activity.distance && activity.distance > 0) {
      const distanceKm = (activity.distance / 1000).toFixed(2);
      notes.push(`Distance: ${distanceKm} km`);
    }

    // Add step count if available
    if (activity.step_count && activity.step_count > 0) {
      notes.push(`Steps: ${activity.step_count.toLocaleString()}`);
    }

    // Add heart rate info if available
    if (activity.heart_rate) {
      const hr = activity.heart_rate;
      if (hr.average) {
        notes.push(`Avg HR: ${Math.round(hr.average)} bpm`);
      }
      if (hr.max) {
        notes.push(`Max HR: ${Math.round(hr.max)} bpm`);
      }
    }

    // Add data source
    notes.push('Synced from Samsung Health');

    return notes.join(' • ');
  }

  /**
   * Log workout to calorie store
   */
  private async logWorkoutToStore(workout: Omit<WorkoutSession, 'id' | 'timestamp'>): Promise<void> {
    try {
      console.log(`💾 [Samsung Sync] Logging workout to store: ${workout.sport} (${workout.duration}min)`);
      
      // Use the existing CalorieStore logWorkout method
      await this.calorieStore.logWorkout(workout);
      
      console.log(`✅ [Samsung Sync] Workout logged successfully`);

    } catch (error) {
      console.error('❌ [Samsung Sync] Failed to log workout:', error);
      throw new SamsungHealthException(
        SamsungHealthErrorType.API_ERROR,
        `Failed to log workout: ${(error as Error).message}`,
        undefined,
        error
      );
    }
  }

  /**
   * Get sync statistics
   */
  public async getSyncStatistics(): Promise<{
    totalProcessed: number;
    lastSyncTime: Date | null;
    processedToday: number;
    isProcessing: boolean;
  }> {
    try {
      // Get workouts from store that originated from Samsung Health
      const workouts = this.calorieStore.getWorkouts?.() || [];
      const samsungWorkouts = workouts.filter((w: WorkoutSession) => 
        w.notes?.includes('Synced from Samsung Health')
      );

      const today = format(new Date(), 'yyyy-MM-dd');
      const processedToday = samsungWorkouts.filter((w: WorkoutSession) => 
        w.date === today
      ).length;

      // Get last sync time from most recent Samsung workout
      const lastSyncTime = samsungWorkouts.length > 0 
        ? new Date(Math.max(...samsungWorkouts.map((w: WorkoutSession) => 
            new Date(w.startTime || w.date).getTime()
          )))
        : null;

      return {
        totalProcessed: this.processedActivityIds.size,
        lastSyncTime,
        processedToday,
        isProcessing: this.isProcessing
      };

    } catch (error) {
      console.error('❌ [Samsung Sync] Failed to get statistics:', error);
      return {
        totalProcessed: 0,
        lastSyncTime: null,
        processedToday: 0,
        isProcessing: this.isProcessing
      };
    }
  }

  /**
   * Manual sync trigger
   */
  public async performManualSync(): Promise<SamsungHealthSyncResult> {
    console.log('🔄 [Samsung Sync] Manual sync triggered');
    
    // Sync last 7 days
    const endDate = new Date();
    const startDate = subDays(endDate, 7);
    
    return await this.syncActivities(startDate, endDate);
  }

  /**
   * Check for duplicate activities
   */
  public isActivityProcessed(activityId: string): boolean {
    return this.processedActivityIds.has(activityId);
  }

  /**
   * Remove processed activity (for testing/debugging)
   */
  public async removeProcessedActivity(activityId: string): Promise<void> {
    this.processedActivityIds.delete(activityId);
    await this.saveProcessedActivityIds();
    console.log(`🗑️ [Samsung Sync] Removed processed activity: ${activityId}`);
  }

  /**
   * Clear all processed activities (for testing/debugging)
   */
  public async clearProcessedActivities(): Promise<void> {
    this.processedActivityIds.clear();
    await this.saveProcessedActivityIds();
    console.log('🗑️ [Samsung Sync] Cleared all processed activities');
  }

  /**
   * Load processed activity IDs from storage
   */
  private async loadProcessedActivityIds(): Promise<void> {
    try {
      // In a real implementation, load from AsyncStorage
      // For now, using in-memory storage
      console.log('📥 [Samsung Sync] Loaded processed activity IDs');
    } catch (error) {
      console.error('❌ [Samsung Sync] Failed to load processed IDs:', error);
    }
  }

  /**
   * Save processed activity IDs to storage
   */
  private async saveProcessedActivityIds(): Promise<void> {
    try {
      // In a real implementation, save to AsyncStorage
      // For now, using in-memory storage
      console.log('💾 [Samsung Sync] Saved processed activity IDs');
    } catch (error) {
      console.error('❌ [Samsung Sync] Failed to save processed IDs:', error);
    }
  }

  /**
   * Get supported Samsung exercise types
   */
  public getSupportedExerciseTypes(): { code: number; name: string; category: string }[] {
    return Object.entries(SAMSUNG_EXERCISE_MAPPING).map(([code, category]) => ({
      code: parseInt(code),
      name: this.getExerciseTypeName(parseInt(code)),
      category
    }));
  }

  /**
   * Get human-readable name for exercise type
   */
  private getExerciseTypeName(exerciseType: number): string {
    const exerciseNames: Record<number, string> = {
      1001: 'Running',
      1002: 'Walking',
      1003: 'Hiking',
      11007: 'Cycling',
      11008: 'Indoor Cycling',
      14001: 'Swimming',
      13001: 'Weight Training',
      12001: 'Yoga',
      12002: 'Pilates',
      15001: 'Basketball',
      15002: 'Soccer',
      15003: 'Tennis',
      15004: 'Golf',
      16001: 'Climbing',
      11001: 'Elliptical',
      11002: 'Rowing',
      10001: 'General Fitness',
      90000: 'Other'
    };

    return exerciseNames[exerciseType] || `Exercise ${exerciseType}`;
  }

  /**
   * Validate activity data
   */
  private validateActivity(activity: SamsungHealthActivity): boolean {
    // Check required fields
    if (!activity.uuid || !activity.start_time || !activity.end_time) {
      return false;
    }

    // Check duration is positive
    if (activity.duration <= 0) {
      return false;
    }

    // Check dates are valid
    try {
      const start = parseISO(activity.start_time);
      const end = parseISO(activity.end_time);
      return start < end;
    } catch {
      return false;
    }
  }

  /**
   * Get processing status
   */
  public getProcessingStatus(): {
    isProcessing: boolean;
    processedCount: number;
    supportedTypes: number;
  } {
    return {
      isProcessing: this.isProcessing,
      processedCount: this.processedActivityIds.size,
      supportedTypes: Object.keys(SAMSUNG_EXERCISE_MAPPING).length
    };
  }
}

export default SamsungHealthDataProcessor;
