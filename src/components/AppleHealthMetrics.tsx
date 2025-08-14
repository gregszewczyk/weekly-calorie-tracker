/**
 * Apple Health Metrics Component
 * 
 * Displays comprehensive daily health metrics from Apple HealthKit
 * including steps, calories, sleep, and heart rate data.
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
import { appleHealthKitService } from '../services/AppleHealthKitService';
import { AppleHealthDailyMetrics } from '../types/AppleHealthKitTypes';

interface AppleHealthMetricsProps {
  date?: Date;
  showDatePicker?: boolean;
  onMetricsLoaded?: (metrics: AppleHealthDailyMetrics) => void;
}

export const AppleHealthMetrics: React.FC<AppleHealthMetricsProps> = ({
  date = new Date(),
  showDatePicker = true,
  onMetricsLoaded,
}) => {
  const [metrics, setMetrics] = useState<AppleHealthDailyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(date);

  // Check if running on iOS
  const isIOS = Platform.OS === 'ios';

  useEffect(() => {
    loadMetrics();
  }, [selectedDate]);

  const loadMetrics = async () => {
    if (!isIOS) {
      setError('Apple HealthKit is only available on iOS devices');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dailyMetrics = await appleHealthKitService.getDailyMetrics(selectedDate);
      setMetrics(dailyMetrics);
      onMetricsLoaded?.(dailyMetrics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load health metrics';
      setError(errorMessage);
      console.error('❌ [AppleHealthMetrics] Error loading metrics:', err);
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

  const getHRVStatus = (hrv: number): { color: string; label: string } => {
    if (hrv >= 40) return { color: '#34C759', label: 'Excellent' };
    if (hrv >= 30) return { color: '#007AFF', label: 'Good' };
    if (hrv >= 20) return { color: '#FF9500', label: 'Fair' };
    return { color: '#FF3B30', label: 'Low' };
  };

  const getActivityLevel = (steps: number): { color: string; label: string } => {
    if (steps >= 10000) return { color: '#34C759', label: 'Very Active' };
    if (steps >= 7500) return { color: '#007AFF', label: 'Active' };
    if (steps >= 5000) return { color: '#FF9500', label: 'Moderate' };
    return { color: '#FF3B30', label: 'Low' };
  };

  if (!isIOS) {
    return (
      <View style={styles.container}>
        <View style={styles.notAvailableCard}>
          <Text style={styles.notAvailableIcon}>📱</Text>
          <Text style={styles.notAvailableTitle}>iOS Only Feature</Text>
          <Text style={styles.notAvailableText}>
            Apple HealthKit integration is only available on iOS devices with the Health app.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading health metrics...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to Load Health Data</Text>
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
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>📊</Text>
          <Text style={styles.errorTitle}>No Health Data</Text>
          <Text style={styles.errorText}>
            No health metrics found for {selectedDate.toDateString()}
          </Text>
        </View>
      </View>
    );
  }

  const activityLevel = getActivityLevel(metrics.steps);
  const sleepQuality = metrics.sleepAnalysis ? getSleepQuality(metrics.sleepAnalysis.sleepEfficiency) : null;
  const hrvStatus = metrics.heartRateData ? getHRVStatus(metrics.heartRateData.variability) : null;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadMetrics} />
      }
    >
      {/* Date Header */}
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        {showDatePicker && (
          <TouchableOpacity 
            style={styles.changeDateButton}
            onPress={() => {
              // In a real app, this would open a date picker
              Alert.alert('Date Picker', 'Date picker not implemented in this demo');
            }}
          >
            <Text style={styles.changeDateText}>Change Date</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Activity Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Daily Activity</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{metrics.steps.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Steps</Text>
            <View style={[styles.statusBadge, { backgroundColor: activityLevel.color }]}>
              <Text style={styles.statusText}>{activityLevel.label}</Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(metrics.activeEnergyBurned)}</Text>
            <Text style={styles.summaryLabel}>Active kcal</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatDistance(metrics.distanceWalkingRunning)}</Text>
            <Text style={styles.summaryLabel}>Distance</Text>
          </View>
        </View>
      </View>

      {/* Energy Balance */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Energy Balance</Text>
        <View style={styles.energyRow}>
          <View style={styles.energyItem}>
            <View style={styles.energyIconContainer}>
              <Text style={styles.energyIcon}>🔥</Text>
            </View>
            <Text style={styles.energyLabel}>Active Calories</Text>
            <Text style={styles.energyValue}>{Math.round(metrics.activeEnergyBurned)} kcal</Text>
          </View>
          <View style={styles.energyItem}>
            <View style={styles.energyIconContainer}>
              <Text style={styles.energyIcon}>⚡</Text>
            </View>
            <Text style={styles.energyLabel}>Basal Calories</Text>
            <Text style={styles.energyValue}>{Math.round(metrics.basalEnergyBurned)} kcal</Text>
          </View>
        </View>
        <View style={styles.totalEnergyRow}>
          <Text style={styles.totalEnergyLabel}>Total Energy Burned</Text>
          <Text style={styles.totalEnergyValue}>
            {Math.round(metrics.activeEnergyBurned + metrics.basalEnergyBurned)} kcal
          </Text>
        </View>
      </View>

      {/* Sleep Analysis */}
      {metrics.sleepAnalysis && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep Analysis</Text>
          <View style={styles.sleepSummary}>
            <View style={styles.sleepMainStats}>
              <View style={styles.sleepStat}>
                <Text style={styles.sleepValue}>{formatTime(metrics.sleepAnalysis.timeAsleep)}</Text>
                <Text style={styles.sleepLabel}>Time Asleep</Text>
              </View>
              <View style={styles.sleepStat}>
                <Text style={styles.sleepValue}>{metrics.sleepAnalysis.sleepEfficiency}%</Text>
                <Text style={styles.sleepLabel}>Sleep Efficiency</Text>
                {sleepQuality && (
                  <View style={[styles.statusBadge, { backgroundColor: sleepQuality.color }]}>
                    <Text style={styles.statusText}>{sleepQuality.label}</Text>
                  </View>
                )}
              </View>
            </View>
            
            {metrics.sleepAnalysis.sleepStages && (
              <View style={styles.sleepStages}>
                <Text style={styles.sleepStagesTitle}>Sleep Stages</Text>
                <View style={styles.sleepStagesRow}>
                  <View style={styles.sleepStage}>
                    <Text style={styles.sleepStageValue}>{formatTime(metrics.sleepAnalysis.sleepStages.deep)}</Text>
                    <Text style={styles.sleepStageLabel}>Deep</Text>
                  </View>
                  <View style={styles.sleepStage}>
                    <Text style={styles.sleepStageValue}>{formatTime(metrics.sleepAnalysis.sleepStages.core)}</Text>
                    <Text style={styles.sleepStageLabel}>Core</Text>
                  </View>
                  <View style={styles.sleepStage}>
                    <Text style={styles.sleepStageValue}>{formatTime(metrics.sleepAnalysis.sleepStages.rem)}</Text>
                    <Text style={styles.sleepStageLabel}>REM</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Heart Rate Data */}
      {metrics.heartRateData && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Heart Rate & Recovery</Text>
          <View style={styles.heartRateRow}>
            <View style={styles.heartRateItem}>
              <Text style={styles.heartRateValue}>{metrics.heartRateData.resting}</Text>
              <Text style={styles.heartRateLabel}>Resting HR</Text>
              <Text style={styles.heartRateUnit}>bpm</Text>
            </View>
            <View style={styles.heartRateItem}>
              <Text style={styles.heartRateValue}>{metrics.heartRateData.average}</Text>
              <Text style={styles.heartRateLabel}>Average HR</Text>
              <Text style={styles.heartRateUnit}>bpm</Text>
            </View>
            <View style={styles.heartRateItem}>
              <Text style={styles.heartRateValue}>{metrics.heartRateData.variability}</Text>
              <Text style={styles.heartRateLabel}>HRV</Text>
              <Text style={styles.heartRateUnit}>ms</Text>
              {hrvStatus && (
                <View style={[styles.statusBadge, { backgroundColor: hrvStatus.color }]}>
                  <Text style={styles.statusText}>{hrvStatus.label}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Stand Hours */}
      {metrics.standHours !== undefined && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stand Hours</Text>
          <View style={styles.standContainer}>
            <Text style={styles.standValue}>{metrics.standHours}/12</Text>
            <Text style={styles.standLabel}>Hours with standing</Text>
            <View style={styles.standProgress}>
              <View 
                style={[
                  styles.standProgressBar, 
                  { width: `${Math.min((metrics.standHours / 12) * 100, 100)}%` }
                ]} 
              />
            </View>
          </View>
        </View>
      )}

      {/* Data Source */}
      <View style={styles.dataSourceCard}>
        <Text style={styles.dataSourceText}>
          📱 Data synchronized from Apple Health
        </Text>
        <Text style={styles.dataSourceSubtext}>
          Pull down to refresh • Last updated: {new Date().toLocaleTimeString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  
  // Date Header
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  changeDateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  changeDateText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },

  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },

  // Energy Balance
  energyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  energyItem: {
    alignItems: 'center',
    flex: 1,
  },
  energyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  energyIcon: {
    fontSize: 20,
  },
  energyLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  energyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  totalEnergyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  totalEnergyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  totalEnergyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  // Sleep Analysis
  sleepSummary: {
    gap: 16,
  },
  sleepMainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sleepStat: {
    alignItems: 'center',
    flex: 1,
  },
  sleepValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  sleepLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  sleepStages: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  sleepStagesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 12,
  },
  sleepStagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sleepStage: {
    alignItems: 'center',
    flex: 1,
  },
  sleepStageValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  sleepStageLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // Heart Rate
  heartRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heartRateItem: {
    alignItems: 'center',
    flex: 1,
  },
  heartRateValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  heartRateLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  heartRateUnit: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 8,
  },

  // Stand Hours
  standContainer: {
    alignItems: 'center',
  },
  standValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  standLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  standProgress: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  standProgressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },

  // Status Badges
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Loading States
  loadingCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },

  // Error States
  errorCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Not Available
  notAvailableCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notAvailableIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  notAvailableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  notAvailableText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Data Source
  dataSourceCard: {
    backgroundColor: '#F2F2F7',
    margin: 20,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  dataSourceText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  dataSourceSubtext: {
    fontSize: 10,
    color: '#C7C7CC',
  },
});
