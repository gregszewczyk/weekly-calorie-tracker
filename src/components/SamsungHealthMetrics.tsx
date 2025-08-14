/**
 * Samsung Health Metrics Component
 * 
 * Displays comprehensive daily health metrics from Samsung Health
 * including steps, calories, sleep, and heart rate data.
 * Based on the proven Apple Health Metrics component pattern.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { samsungHealthDailyMetricsService } from '../services/SamsungHealthDailyMetricsService';
import { SamsungHealthDailyMetrics } from '../types/SamsungHealthTypes';

interface SamsungHealthMetricsProps {
  date?: Date;
  showDatePicker?: boolean;
  onMetricsLoaded?: (metrics: SamsungHealthDailyMetrics) => void;
}

export const SamsungHealthMetrics: React.FC<SamsungHealthMetricsProps> = ({
  date = new Date(),
  showDatePicker = true,
  onMetricsLoaded,
}) => {
  const [metrics, setMetrics] = useState<SamsungHealthDailyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(date);

  // Check if running on Android
  const isAndroid = Platform.OS === 'android';

  useEffect(() => {
    loadMetrics();
  }, [selectedDate]);

  const loadMetrics = async () => {
    if (!isAndroid) {
      setError('Samsung Health is only available on Android devices');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dailyMetrics = await samsungHealthDailyMetricsService.getDailyMetrics(selectedDate);
      setMetrics(dailyMetrics);
      onMetricsLoaded?.(dailyMetrics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Samsung Health metrics';
      setError(errorMessage);
      console.error('❌ [SamsungHealthMetrics] Error loading metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  };

  const getSleepQuality = (efficiency: number): { color: string; label: string } => {
    if (efficiency >= 85) return { color: '#34C759', label: 'Excellent' };
    if (efficiency >= 75) return { color: '#007AFF', label: 'Good' };
    if (efficiency >= 65) return { color: '#FF9500', label: 'Fair' };
    return { color: '#FF3B30', label: 'Poor' };
  };

  const getStressLevel = (stress: number): { color: string; label: string } => {
    if (stress <= 30) return { color: '#34C759', label: 'Low' };
    if (stress <= 50) return { color: '#007AFF', label: 'Normal' };
    if (stress <= 70) return { color: '#FF9500', label: 'Elevated' };
    return { color: '#FF3B30', label: 'High' };
  };

  const getActivityLevel = (steps: number): { color: string; label: string } => {
    if (steps >= 10000) return { color: '#34C759', label: 'Very Active' };
    if (steps >= 7500) return { color: '#007AFF', label: 'Active' };
    if (steps >= 5000) return { color: '#FF9500', label: 'Moderate' };
    return { color: '#FF3B30', label: 'Low' };
  };

  const getHeartRateStatus = (resting: number): { color: string; label: string } => {
    if (resting < 60) return { color: '#34C759', label: 'Excellent' };
    if (resting < 70) return { color: '#007AFF', label: 'Good' };
    if (resting < 80) return { color: '#FF9500', label: 'Normal' };
    return { color: '#FF3B30', label: 'Elevated' };
  };

  if (!isAndroid) {
    return (
      <View style={styles.container}>
        <View style={styles.notSupportedContainer}>
          <Text style={styles.notSupportedTitle}>Samsung Health Not Available</Text>
          <Text style={styles.notSupportedText}>
            Samsung Health integration is only available on Android devices.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading Samsung Health data...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Error Loading Data</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMetrics}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataTitle}>No Data Available</Text>
          <Text style={styles.noDataText}>
            Samsung Health data not found for this date.
          </Text>
        </View>
      </View>
    );
  }

  const activityLevel = getActivityLevel(metrics.step_count);
  const sleepQuality = metrics.sleep_data ? getSleepQuality(metrics.sleep_data.efficiency) : null;
  const stressLevel = metrics.stress_level ? getStressLevel(metrics.stress_level) : null;
  const heartRateStatus = metrics.heart_rate ? getHeartRateStatus(metrics.heart_rate.resting) : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={loadMetrics}
          tintColor="#007AFF"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Samsung Health Metrics</Text>
        <Text style={styles.headerDate}>
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Activity Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Daily Activity</Text>
        
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.step_count.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Steps</Text>
            <View style={[styles.statusBadge, { backgroundColor: activityLevel.color }]}>
              <Text style={styles.statusText}>{activityLevel.label}</Text>
            </View>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.active_calorie}</Text>
            <Text style={styles.metricLabel}>Active Calories</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.calorie}</Text>
            <Text style={styles.metricLabel}>Total Calories</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{formatDistance(metrics.distance)}</Text>
            <Text style={styles.metricLabel}>Distance</Text>
          </View>
        </View>
      </View>

      {/* Sleep Section */}
      {metrics.sleep_data && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>😴 Sleep Analysis</Text>
          
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatTime(metrics.sleep_data.duration)}</Text>
              <Text style={styles.metricLabel}>Sleep Duration</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{metrics.sleep_data.efficiency}%</Text>
              <Text style={styles.metricLabel}>Sleep Efficiency</Text>
              {sleepQuality && (
                <View style={[styles.statusBadge, { backgroundColor: sleepQuality.color }]}>
                  <Text style={styles.statusText}>{sleepQuality.label}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.sleepStagesContainer}>
            <Text style={styles.sleepStagesTitle}>Sleep Stages</Text>
            <View style={styles.sleepStagesRow}>
              <View style={styles.sleepStage}>
                <Text style={styles.sleepStageValue}>{formatTime(metrics.sleep_data.deep_sleep)}</Text>
                <Text style={styles.sleepStageLabel}>Deep Sleep</Text>
              </View>
              <View style={styles.sleepStage}>
                <Text style={styles.sleepStageValue}>{formatTime(metrics.sleep_data.light_sleep)}</Text>
                <Text style={styles.sleepStageLabel}>Light Sleep</Text>
              </View>
              <View style={styles.sleepStage}>
                <Text style={styles.sleepStageValue}>{formatTime(metrics.sleep_data.rem_sleep)}</Text>
                <Text style={styles.sleepStageLabel}>REM Sleep</Text>
              </View>
              <View style={styles.sleepStage}>
                <Text style={styles.sleepStageValue}>{formatTime(metrics.sleep_data.awake_time)}</Text>
                <Text style={styles.sleepStageLabel}>Awake</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Heart Rate Section */}
      {metrics.heart_rate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❤️ Heart Rate</Text>
          
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{metrics.heart_rate.resting}</Text>
              <Text style={styles.metricLabel}>Resting HR (bpm)</Text>
              {heartRateStatus && (
                <View style={[styles.statusBadge, { backgroundColor: heartRateStatus.color }]}>
                  <Text style={styles.statusText}>{heartRateStatus.label}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{metrics.heart_rate.average}</Text>
              <Text style={styles.metricLabel}>Average HR (bpm)</Text>
            </View>
          </View>

          {metrics.heart_rate.variability && (
            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics.heart_rate.variability}</Text>
                <Text style={styles.metricLabel}>HRV (ms)</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Stress Section */}
      {metrics.stress_level !== undefined && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧘‍♀️ Stress Level</Text>
          
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{metrics.stress_level}/100</Text>
              <Text style={styles.metricLabel}>Stress Score</Text>
              {stressLevel && (
                <View style={[styles.statusBadge, { backgroundColor: stressLevel.color }]}>
                  <Text style={styles.statusText}>{stressLevel.label}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Data synced from Samsung Health • Last updated: {new Date().toLocaleTimeString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    marginBottom: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  sleepStagesContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sleepStagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  sleepStagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sleepStage: {
    flex: 1,
    alignItems: 'center',
  },
  sleepStageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  sleepStageLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  notSupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notSupportedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  notSupportedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default SamsungHealthMetrics;
