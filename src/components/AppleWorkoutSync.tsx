/**
 * Apple HealthKit Workout Sync Component
 * User Story 2: Apple Watch Workout Sync
 * 
 * Provides UI for syncing workouts from Apple Health/Apple Watch
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { appleHealthKitService } from '../services/AppleHealthKitService';
import { AppleHealthKitWorkout } from '../types/AppleHealthKitTypes';

interface AppleWorkoutSyncProps {
  onSyncComplete?: (result: { synced: number; skipped: number; errors: number }) => void;
  autoSync?: boolean;
  daysToSync?: number;
}

export const AppleWorkoutSync: React.FC<AppleWorkoutSyncProps> = ({
  onSyncComplete,
  autoSync = false,
  daysToSync = 7,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<AppleHealthKitWorkout[]>([]);
  const [syncStats, setSyncStats] = useState<{ synced: number; skipped: number; errors: number } | null>(null);

  // Helper function to safely format timestamps
  const formatTimestamp = (timestamp: Date | string) => {
    try {
      const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
      return format(date, 'MMM d, h:mm a');
    } catch (error) {
      console.warn('Invalid timestamp format:', timestamp);
      return 'Invalid time';
    }
  };

  // iOS only check
  if (Platform.OS !== 'ios') {
    return (
      <View style={styles.unavailableContainer}>
        <Text style={styles.unavailableText}>
          Apple HealthKit is only available on iOS devices
        </Text>
      </View>
    );
  }

  useEffect(() => {
    if (autoSync) {
      performSync();
    }
    loadRecentWorkouts();
  }, [autoSync]);

  const loadRecentWorkouts = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysToSync);

      const workouts = await appleHealthKitService.getWorkouts(startDate, endDate);
      setRecentWorkouts(workouts.slice(0, 5)); // Show last 5 workouts
    } catch (error) {
      console.error('Failed to load recent workouts:', error);
    }
  };

  const performSync = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysToSync);

      const result = await appleHealthKitService.syncWorkoutsWithCalorieStore(startDate, endDate);
      
      setSyncStats(result);
      setLastSyncTime(new Date());
      
      if (onSyncComplete) {
        onSyncComplete(result);
      }

      // Show success message
      Alert.alert(
        'Sync Complete',
        `✅ ${result.synced} workouts synced\\n⏭️ ${result.skipped} already existed\\n❌ ${result.errors} errors`,
        [{ text: 'OK' }]
      );

      // Reload recent workouts
      await loadRecentWorkouts();

    } catch (error) {
      console.error('Workout sync failed:', error);
      Alert.alert(
        'Sync Failed',
        error instanceof Error ? error.message : 'Failed to sync workouts',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatWorkoutDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getWorkoutIcon = (workoutType: string): string => {
    const icons: Record<string, string> = {
      'running': '🏃‍♂️',
      'cycling': '🚴‍♂️',
      'swimming': '🏊‍♂️',
      'strength': '💪',
      'hiit': '🔥',
      'yoga': '🧘‍♀️',
      'walking': '🚶‍♂️',
      'cardio': '❤️',
      'other': '🏋️‍♂️',
    };
    return icons[workoutType] || '🏋️‍♂️';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Apple Watch Workouts</Text>
        <Text style={styles.subtitle}>
          Sync your Apple Watch workouts automatically
        </Text>
      </View>

      {/* Sync Button */}
      <TouchableOpacity
        style={[styles.syncButton, isLoading && styles.syncButtonDisabled]}
        onPress={performSync}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.syncButtonText}>
            🔄 Sync Last {daysToSync} Days
          </Text>
        )}
      </TouchableOpacity>

      {/* Last Sync Info */}
      {lastSyncTime && (
        <View style={styles.lastSyncContainer}>
          <Text style={styles.lastSyncText}>
            Last synced: {formatTimestamp(lastSyncTime)}
          </Text>
          {syncStats && (
            <Text style={styles.syncStatsText}>
              {syncStats.synced} synced • {syncStats.skipped} skipped • {syncStats.errors} errors
            </Text>
          )}
        </View>
      )}

      {/* Recent Workouts Preview */}
      {recentWorkouts.length > 0 && (
        <View style={styles.workoutsContainer}>
          <Text style={styles.workoutsTitle}>Recent Workouts</Text>
          <ScrollView style={styles.workoutsList}>
            {recentWorkouts.map((workout, index) => (
              <View key={workout.uuid || index} style={styles.workoutItem}>
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutIcon}>
                    {getWorkoutIcon(workout.workoutType)}
                  </Text>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName}>{workout.activityName}</Text>
                    <Text style={styles.workoutDate}>
                      {formatTimestamp(workout.startDate)}
                    </Text>
                  </View>
                  <View style={styles.workoutStats}>
                    <Text style={styles.workoutDuration}>
                      {formatWorkoutDuration(workout.duration)}
                    </Text>
                    <Text style={styles.workoutCalories}>
                      {workout.calories} cal
                    </Text>
                  </View>
                </View>
                {workout.totalDistance && workout.totalDistance > 0 && (
                  <Text style={styles.workoutDistance}>
                    📍 {(workout.totalDistance / 1000).toFixed(2)} km
                  </Text>
                )}
                {workout.heartRateData?.average && (
                  <Text style={styles.workoutHeartRate}>
                    ❤️ Avg HR: {workout.heartRateData.average} bpm
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Setup Hint */}
      {recentWorkouts.length === 0 && !isLoading && (
        <View style={styles.setupHintContainer}>
          <Text style={styles.setupHintTitle}>No Workouts Found</Text>
          <Text style={styles.setupHintText}>
            Make sure you have workouts recorded in the Apple Health app and have granted workout permissions.
          </Text>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => appleHealthKitService.openHealthSettings()}
          >
            <Text style={styles.setupButtonText}>
              Open Health Settings
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 10,
  },
  unavailableContainer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 10,
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  syncButtonDisabled: {
    backgroundColor: '#c7d2fe',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lastSyncContainer: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  lastSyncText: {
    fontSize: 14,
    color: '#22543d',
    marginBottom: 5,
  },
  syncStatsText: {
    fontSize: 13,
    color: '#2f855a',
  },
  workoutsContainer: {
    marginTop: 10,
  },
  workoutsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  workoutsList: {
    maxHeight: 300,
  },
  workoutItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  workoutDate: {
    fontSize: 13,
    color: '#6c757d',
  },
  workoutStats: {
    alignItems: 'flex-end',
  },
  workoutDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 2,
  },
  workoutCalories: {
    fontSize: 13,
    color: '#6c757d',
  },
  workoutDistance: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 5,
  },
  workoutHeartRate: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  setupHintContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    marginTop: 20,
  },
  setupHintTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 10,
  },
  setupHintText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  setupButton: {
    backgroundColor: '#ffc107',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  setupButtonText: {
    color: '#212529',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AppleWorkoutSync;
