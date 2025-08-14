/**
 * Samsung Health Body Composition Component
 * 
 * React component for displaying comprehensive Samsung Health body composition data
 * with trend analysis, insights, and CalorieStore integration
 * Based on Apple Health Body Composition component patterns
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { format } from 'date-fns';
import { useCalorieStore } from '../stores/calorieStore';
import { 
  SamsungHealthBodyCompositionService,
  SamsungHealthBodyCompositionSummary,
  SamsungHealthBodyCompositionTrend,
  SamsungHealthBodyCompositionInsights
} from '../services/SamsungHealthBodyCompositionService';

interface SamsungHealthBodyCompositionProps {
  onSyncComplete?: (syncedCount: number) => void;
  showSyncButton?: boolean;
  autoSync?: boolean;
}

const SamsungHealthBodyComposition: React.FC<SamsungHealthBodyCompositionProps> = ({
  onSyncComplete,
  showSyncButton = true,
  autoSync = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [bodyComposition, setBodyComposition] = useState<SamsungHealthBodyCompositionSummary | null>(null);
  const [recentEntries, setRecentEntries] = useState<SamsungHealthBodyCompositionSummary[]>([]);
  const [trend, setTrend] = useState<SamsungHealthBodyCompositionTrend | null>(null);
  const [insights, setInsights] = useState<SamsungHealthBodyCompositionInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { weightEntries } = useCalorieStore();
  const bodyCompositionService = new SamsungHealthBodyCompositionService();

  // Check if running on Android (Samsung Health is Android-only)
  const isAndroid = Platform.OS === 'android';

  useEffect(() => {
    if (isAndroid) {
      loadBodyComposition();
      if (autoSync) {
        handleSync();
      }
    }
  }, [isAndroid]);

  const loadBodyComposition = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get today's body composition
      const today = new Date();
      const todayComposition = await bodyCompositionService.getBodyComposition(today);
      setBodyComposition(todayComposition);

      // Get last 7 days of data
      const recent = await bodyCompositionService.getRecentBodyCompositionTrend(7);
      setRecentEntries(recent);

      // Get 30-day trend analysis
      const trendAnalysis = await bodyCompositionService.analyzeBodyCompositionTrends('month');
      setTrend(trendAnalysis);

      // Get enhanced insights
      const enhancedInsights = await bodyCompositionService.getEnhancedWeightInsights(weightEntries);
      setInsights(enhancedInsights);

    } catch (error) {
      console.error('Error loading Samsung Health body composition:', error);
      setError('Failed to load body composition data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const syncResult = await bodyCompositionService.syncWithCalorieStore(weightEntries, 30);
      
      if (syncResult.syncedEntries.length > 0) {
        // Add synced entries to CalorieStore
        const { addWeightEntry } = useCalorieStore.getState();
        
        for (const entry of syncResult.syncedEntries) {
          addWeightEntry(entry.weight);
          
          // Update with additional body composition data
          const { weightEntries: updatedEntries } = useCalorieStore.getState();
          const latestEntry = updatedEntries.find(we => we.date === entry.date);
          
          if (latestEntry) {
            // Note: In a real implementation, you'd want to enhance the store to support body composition updates
            console.log(`Enhanced entry for ${entry.date} with body composition data`);
          }
        }

        Alert.alert(
          'Sync Complete',
          `Synced ${syncResult.syncedEntries.length} body composition entries from Samsung Health`
        );

        if (onSyncComplete) {
          onSyncComplete(syncResult.syncedEntries.length);
        }

        // Reload data to show updates
        await loadBodyComposition();
      } else {
        Alert.alert('Sync Complete', 'No new body composition data to sync');
      }

    } catch (error) {
      console.error('Error syncing Samsung Health body composition:', error);
      setError('Failed to sync body composition data');
      Alert.alert('Sync Error', 'Failed to sync body composition data from Samsung Health');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatWeight = (weight: number): string => {
    return `${weight.toFixed(1)}kg`;
  };

  const formatBodyFat = (bodyFat: number): string => {
    return `${bodyFat.toFixed(1)}%`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { color: '#FF9500', label: 'Underweight' };
    if (bmi < 25) return { color: '#34C759', label: 'Normal' };
    if (bmi < 30) return { color: '#FF9500', label: 'Overweight' };
    return { color: '#FF3B30', label: 'Obese' };
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'concerning'): string => {
    switch (trend) {
      case 'improving': return '📈';
      case 'stable': return '➡️';
      case 'concerning': return '⚠️';
    }
  };

  const getTrendColor = (trend: 'improving' | 'stable' | 'concerning'): string => {
    switch (trend) {
      case 'improving': return '#34C759';
      case 'stable': return '#007AFF';
      case 'concerning': return '#FF3B30';
    }
  };

  if (!isAndroid) {
    return (
      <View style={styles.container}>
        <View style={styles.notAvailableCard}>
          <Text style={styles.notAvailableTitle}>Samsung Health Body Composition</Text>
          <Text style={styles.notAvailableText}>
            Samsung Health body composition tracking is only available on Android devices with Samsung Health installed.
          </Text>
          <Text style={styles.notAvailableSubtext}>
            For comprehensive body composition tracking on this platform, consider using a compatible smart scale.
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
          <Text style={styles.loadingText}>Loading Samsung Health body composition data...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Samsung Health Body Composition</Text>
        <Text style={styles.headerSubtitle}>
          Track weight, body fat, muscle mass, and more
        </Text>
        
        {showSyncButton && (
          <TouchableOpacity 
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]} 
            onPress={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.syncButtonText}>Sync with Samsung Health</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBodyComposition}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Current Body Composition */}
      {bodyComposition && (
        <View style={styles.currentCard}>
          <Text style={styles.cardTitle}>Today's Body Composition</Text>
          <Text style={styles.dateText}>{format(new Date(), 'EEEE, MMMM d')}</Text>
          
          <View style={styles.measurementsGrid}>
            <View style={styles.measurementItem}>
              <Text style={styles.measurementValue}>
                {formatWeight(bodyComposition.weight)}
              </Text>
              <Text style={styles.measurementLabel}>Weight</Text>
            </View>

            {bodyComposition.bodyFat && (
              <View style={styles.measurementItem}>
                <Text style={styles.measurementValue}>
                  {formatBodyFat(bodyComposition.bodyFat)}
                </Text>
                <Text style={styles.measurementLabel}>Body Fat</Text>
              </View>
            )}

            {bodyComposition.muscleMass && (
              <View style={styles.measurementItem}>
                <Text style={styles.measurementValue}>
                  {formatWeight(bodyComposition.muscleMass)}
                </Text>
                <Text style={styles.measurementLabel}>Muscle Mass</Text>
              </View>
            )}

            {bodyComposition.bodyWater && (
              <View style={styles.measurementItem}>
                <Text style={styles.measurementValue}>
                  {bodyComposition.bodyWater.toFixed(1)}%
                </Text>
                <Text style={styles.measurementLabel}>Body Water</Text>
              </View>
            )}
          </View>

          {bodyComposition.bmi && (
            <View style={styles.bmiRow}>
              <Text style={styles.bmiLabel}>BMI: {bodyComposition.bmi.toFixed(1)}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: getBMICategory(bodyComposition.bmi).color }]}>
                <Text style={styles.categoryText}>{getBMICategory(bodyComposition.bmi).label}</Text>
              </View>
            </View>
          )}

          {bodyComposition.basalMetabolicRate && (
            <View style={styles.bmrRow}>
              <Text style={styles.bmrText}>
                Basal Metabolic Rate: {bodyComposition.basalMetabolicRate} kcal/day
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Trend Analysis */}
      {trend && (
        <View style={styles.trendCard}>
          <Text style={styles.cardTitle}>30-Day Trend Analysis</Text>
          
          <View style={styles.trendHeader}>
            <Text style={styles.trendIcon}>{getTrendIcon(trend.trend)}</Text>
            <Text style={[styles.trendStatus, { color: getTrendColor(trend.trend) }]}>
              {trend.trend.charAt(0).toUpperCase() + trend.trend.slice(1)} Progress
            </Text>
          </View>

          <View style={styles.trendDetails}>
            <Text style={styles.trendDetail}>Weight: {trend.weightChange >= 0 ? '+' : ''}{trend.weightChange.toFixed(1)}kg</Text>
            {trend.bodyFatChange !== undefined && (
              <Text style={styles.trendDetail}>
                Body Fat: {trend.bodyFatChange >= 0 ? '+' : ''}{trend.bodyFatChange.toFixed(1)}%
              </Text>
            )}
            {trend.muscleMassChange !== undefined && (
              <Text style={styles.trendDetail}>
                Muscle: {trend.muscleMassChange >= 0 ? '+' : ''}{trend.muscleMassChange.toFixed(1)}kg
              </Text>
            )}
          </View>

          {trend.recommendations.length > 0 && (
            <View style={styles.recommendationsSection}>
              <Text style={styles.recommendationsTitle}>Recommendations:</Text>
              {trend.recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendationText}>• {rec}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Body Composition Insights */}
      {insights && (
        <View style={styles.insightsCard}>
          <Text style={styles.cardTitle}>Body Composition Insights</Text>
          
          {insights.bodyCompositionInsights.map((insight, index) => (
            <Text key={index} style={styles.insightText}>• {insight}</Text>
          ))}

          {insights.bodyCompositionGoalProgress && (
            <View style={styles.goalProgressSection}>
              <Text style={styles.goalProgressTitle}>Goal Progress</Text>
              <Text style={styles.goalProgressText}>
                Body Fat Trend: {insights.bodyCompositionGoalProgress.bodyFatTrend}
              </Text>
              <Text style={styles.goalProgressText}>
                Muscle Trend: {insights.bodyCompositionGoalProgress.muscleMassTrend}
              </Text>
              
              {insights.bodyCompositionGoalProgress.recommendations.map((rec, index) => (
                <Text key={index} style={styles.goalRecommendationText}>• {rec}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <View style={styles.recentCard}>
          <Text style={styles.cardTitle}>Recent Measurements</Text>
          {recentEntries.slice(0, 5).map((entry, index) => (
            <View key={entry.date} style={styles.recentEntry}>
              <Text style={styles.recentDate}>
                {formatDate(entry.date)}
              </Text>
              <Text style={styles.recentWeight}>
                {formatWeight(entry.weight)}
              </Text>
              {entry.bodyFat && (
                <Text style={styles.recentBodyFat}>
                  {formatBodyFat(entry.bodyFat)}
                </Text>
              )}
              <Text style={styles.recentSource}>Samsung Health</Text>
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
            Latest: {weightEntries[0]?.weight.toFixed(1)}kg on {weightEntries[0]?.date}
          </Text>
        )}
        
        <Text style={styles.integrationNote}>
          Samsung Health body composition data enhances your weight tracking with detailed insights about body fat, muscle mass, and overall health trends.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  notAvailableCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    alignItems: 'center',
  },
  notAvailableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  notAvailableText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  notAvailableSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    margin: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  syncButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#ccc',
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#FFF2F2',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  currentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  measurementItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16,
  },
  measurementValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  measurementLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  bmiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bmiLabel: {
    fontSize: 14,
    color: '#333',
  },
  categoryBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bmrRow: {
    marginTop: 8,
  },
  bmrText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  trendCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 8,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  trendStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendDetails: {
    marginBottom: 16,
  },
  trendDetail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  recommendationsSection: {
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 4,
  },
  insightsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 6,
  },
  goalProgressSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  goalProgressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  goalProgressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  goalRecommendationText: {
    fontSize: 12,
    color: '#007AFF',
    lineHeight: 16,
    marginBottom: 4,
  },
  recentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 8,
  },
  recentEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentDate: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  recentWeight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 12,
  },
  recentBodyFat: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  recentSource: {
    fontSize: 10,
    color: '#999',
  },
  integrationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  integrationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  integrationSubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  integrationNote: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});

export default SamsungHealthBodyComposition;
