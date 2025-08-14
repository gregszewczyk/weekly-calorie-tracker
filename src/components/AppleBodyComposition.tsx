/**
 * Apple Body Composition Component
 * 
 * Displays body composition data from Apple HealthKit including weight,
 * body fat percentage, and lean body mass with trend analysis.
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
import { AppleHealthBodyComposition } from '../types/AppleHealthKitTypes';
import { useCalorieStore } from '../stores/calorieStore';

interface AppleBodyCompositionProps {
  onSyncComplete?: () => void;
  showSyncButton?: boolean;
  autoSync?: boolean;
}

export const AppleBodyComposition: React.FC<AppleBodyCompositionProps> = ({
  onSyncComplete,
  showSyncButton = true,
  autoSync = false,
}) => {
  const [bodyComposition, setBodyComposition] = useState<AppleHealthBodyComposition | null>(null);
  const [recentEntries, setRecentEntries] = useState<AppleHealthBodyComposition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { weightEntries } = useCalorieStore();

  // Check if running on iOS
  const isIOS = Platform.OS === 'ios';

  useEffect(() => {
    if (isIOS) {
      loadBodyComposition();
      if (autoSync) {
        handleSync();
      }
    }
  }, []);

  const loadBodyComposition = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get today's body composition
      const today = new Date();
      const todayComposition = await appleHealthKitService.getBodyComposition(today);
      setBodyComposition(todayComposition);

      // Get last 7 days of data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const recent = await appleHealthKitService.getBodyCompositionRange(startDate, endDate);
      setRecentEntries(recent);

      console.log('📊 [AppleBodyComposition] Loaded body composition data:', {
        today: todayComposition?.bodyMass,
        recent: recent.length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load body composition data';
      setError(errorMessage);
      console.error('❌ [AppleBodyComposition] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!isIOS) {
      Alert.alert('iOS Only', 'Apple HealthKit is only available on iOS devices.');
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const result = await appleHealthKitService.syncWeightWithCalorieStore();
      
      Alert.alert(
        'Sync Complete',
        `Successfully synced ${result.synced} weight entries from Apple Health.${result.errors.length > 0 ? ` ${result.errors.length} errors occurred.` : ''}`,
        [{ text: 'OK', onPress: onSyncComplete }]
      );

      // Reload data after sync
      await loadBodyComposition();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync weight data';
      setError(errorMessage);
      Alert.alert('Sync Error', errorMessage);
      console.error('❌ [AppleBodyComposition] Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatBodyFat = (percentage?: number): string => {
    if (!percentage) return 'N/A';
    return `${percentage.toFixed(1)}%`;
  };

  const formatWeight = (kg: number): string => {
    return `${kg.toFixed(1)} kg`;
  };

  const getBodyFatCategory = (percentage?: number): { color: string; label: string } => {
    if (!percentage) return { color: '#8E8E93', label: 'Unknown' };
    
    // Categories for males (would need to adjust based on gender)
    if (percentage < 6) return { color: '#FF3B30', label: 'Essential' };
    if (percentage < 14) return { color: '#34C759', label: 'Athletic' };
    if (percentage < 18) return { color: '#007AFF', label: 'Fitness' };
    if (percentage < 25) return { color: '#FF9500', label: 'Average' };
    return { color: '#FF3B30', label: 'Above Average' };
  };

  const getBMICategory = (bmi?: number): { color: string; label: string } => {
    if (!bmi) return { color: '#8E8E93', label: 'Unknown' };
    
    if (bmi < 18.5) return { color: '#FF9500', label: 'Underweight' };
    if (bmi < 25) return { color: '#34C759', label: 'Normal' };
    if (bmi < 30) return { color: '#FF9500', label: 'Overweight' };
    return { color: '#FF3B30', label: 'Obese' };
  };

  const calculateTrend = (): { change: number; direction: 'up' | 'down' | 'stable' } => {
    if (recentEntries.length < 2) return { change: 0, direction: 'stable' };
    
    const sortedEntries = recentEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sortedEntries[0];
    const previous = sortedEntries[1];
    
    const change = latest.bodyMass - previous.bodyMass;
    
    if (Math.abs(change) < 0.1) return { change, direction: 'stable' };
    return { change, direction: change > 0 ? 'up' : 'down' };
  };

  if (!isIOS) {
    return (
      <View style={styles.container}>
        <View style={styles.notAvailableCard}>
          <Text style={styles.notAvailableIcon}>📱</Text>
          <Text style={styles.notAvailableTitle}>iOS Only Feature</Text>
          <Text style={styles.notAvailableText}>
            Apple HealthKit body composition tracking is only available on iOS devices with the Health app.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading && !bodyComposition) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading body composition data...</Text>
        </View>
      </View>
    );
  }

  if (error && !bodyComposition) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to Load Body Composition</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBodyComposition}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const bodyFatCategory = getBodyFatCategory(bodyComposition?.bodyFatPercentage);
  const bmiCategory = getBMICategory(bodyComposition?.bodyMassIndex);
  const trend = calculateTrend();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadBodyComposition} />
      }
    >
      {/* Current Measurements */}
      {bodyComposition && (
        <View style={styles.currentCard}>
          <Text style={styles.cardTitle}>Current Body Composition</Text>
          <Text style={styles.dateText}>
            {bodyComposition.date.toLocaleDateString()}
          </Text>
          
          <View style={styles.measurementsRow}>
            <View style={styles.measurement}>
              <Text style={styles.measurementValue}>
                {formatWeight(bodyComposition.bodyMass)}
              </Text>
              <Text style={styles.measurementLabel}>Weight</Text>
              {trend.direction !== 'stable' && (
                <View style={styles.trendIndicator}>
                  <Text style={[
                    styles.trendText,
                    { color: trend.direction === 'up' ? '#FF9500' : '#34C759' }
                  ]}>
                    {trend.direction === 'up' ? '↗' : '↘'} {Math.abs(trend.change).toFixed(1)}kg
                  </Text>
                </View>
              )}
            </View>
            
            {bodyComposition.bodyFatPercentage && (
              <View style={styles.measurement}>
                <Text style={styles.measurementValue}>
                  {formatBodyFat(bodyComposition.bodyFatPercentage)}
                </Text>
                <Text style={styles.measurementLabel}>Body Fat</Text>
                <View style={[styles.categoryBadge, { backgroundColor: bodyFatCategory.color }]}>
                  <Text style={styles.categoryText}>{bodyFatCategory.label}</Text>
                </View>
              </View>
            )}
            
            {bodyComposition.leanBodyMass && (
              <View style={styles.measurement}>
                <Text style={styles.measurementValue}>
                  {formatWeight(bodyComposition.leanBodyMass)}
                </Text>
                <Text style={styles.measurementLabel}>Lean Mass</Text>
              </View>
            )}
          </View>

          {bodyComposition.bodyMassIndex && (
            <View style={styles.bmiRow}>
              <Text style={styles.bmiLabel}>BMI: {bodyComposition.bodyMassIndex.toFixed(1)}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: bmiCategory.color }]}>
                <Text style={styles.categoryText}>{bmiCategory.label}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <View style={styles.recentCard}>
          <Text style={styles.cardTitle}>Recent Measurements</Text>
          {recentEntries.slice(0, 5).map((entry, index) => (
            <View key={entry.uuid} style={styles.recentEntry}>
              <Text style={styles.recentDate}>
                {entry.date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
              <Text style={styles.recentWeight}>
                {formatWeight(entry.bodyMass)}
              </Text>
              {entry.bodyFatPercentage && (
                <Text style={styles.recentBodyFat}>
                  {formatBodyFat(entry.bodyFatPercentage)}
                </Text>
              )}
              <Text style={styles.recentSource}>{entry.source}</Text>
            </View>
          ))}
        </View>
      )}

      {/* CalorieStore Integration Status */}
      <View style={styles.integrationCard}>
        <Text style={styles.cardTitle}>Weight Tracking Integration</Text>
        <Text style={styles.integrationText}>
          📊 {weightEntries.length} weight entries in your tracking history
        </Text>
        {weightEntries.length > 0 && (
          <Text style={styles.integrationSubtext}>
            Latest: {weightEntries[0]?.weight}kg on {weightEntries[0]?.date}
          </Text>
        )}
        
        {showSyncButton && (
          <TouchableOpacity 
            style={styles.syncButton} 
            onPress={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.syncButtonText}>Sync with Apple Health</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Body Composition Tips</Text>
        <Text style={styles.tipText}>
          • Weigh yourself at the same time each day (preferably morning)
        </Text>
        <Text style={styles.tipText}>
          • Body fat percentage is more informative than weight alone
        </Text>
        <Text style={styles.tipText}>
          • Lean body mass includes muscle, bone, and organs
        </Text>
        <Text style={styles.tipText}>
          • Smart scales can sync body composition data automatically
        </Text>
      </View>

      {/* Data Source */}
      <View style={styles.dataSourceCard}>
        <Text style={styles.dataSourceText}>
          📱 Data synchronized from Apple Health
        </Text>
        <Text style={styles.dataSourceSubtext}>
          Supports smart scales from Withings, QardioBase, and more
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

  // Cards
  currentCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  recentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  integrationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tipsCard: {
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dataSourceCard: {
    backgroundColor: '#F2F2F7',
    margin: 20,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },

  // Text Styles
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },

  // Measurements
  measurementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  measurement: {
    alignItems: 'center',
    flex: 1,
  },
  measurementValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  measurementLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },

  // Trend Indicator
  trendIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // BMI Row
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  bmiLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },

  // Category Badge
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Recent Entries
  recentEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  recentDate: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  recentWeight: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  recentBodyFat: {
    fontSize: 14,
    color: '#007AFF',
    flex: 1,
    textAlign: 'center',
  },
  recentSource: {
    fontSize: 12,
    color: '#8E8E93',
    flex: 1,
    textAlign: 'right',
  },

  // Integration
  integrationText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  integrationSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 16,
  },

  // Sync Button
  syncButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Tips
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 6,
  },

  // Data Source
  dataSourceText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  dataSourceSubtext: {
    fontSize: 10,
    color: '#C7C7CC',
  },

  // Loading/Error States
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
});
