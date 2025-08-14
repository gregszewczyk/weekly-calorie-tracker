/**
 * Samsung Health Dashboard Screen
 * 
 * Comprehensive dashboard displaying daily health metrics from Samsung Health.
 * Shows activity trends, sleep analysis, heart rate data, and stress levels.
 * Based on the proven Apple Health Dashboard pattern.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SamsungHealthMetrics } from '../components/SamsungHealthMetrics';
import { samsungHealthDailyMetricsService } from '../services/SamsungHealthDailyMetricsService';
import { SamsungHealthEnhancedHistoricalAnalyzer } from '../services/SamsungHealthEnhancedHistoricalAnalyzer';
import { SamsungHealthDailyMetrics } from '../types/SamsungHealthTypes';

interface SamsungHealthDashboardProps {
  onBack?: () => void;
}

export const SamsungHealthDashboard: React.FC<SamsungHealthDashboardProps> = ({
  onBack,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weeklyMetrics, setWeeklyMetrics] = useState<SamsungHealthDailyMetrics[]>([]);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [wellnessData, setWellnessData] = useState<any>(null);

  useEffect(() => {
    loadWeeklyData();
  }, [selectedDate]);

  const loadWeeklyData = async () => {
    if (Platform.OS !== 'android') return;

    setIsLoadingWeekly(true);
    try {
      // Get last 7 days of data
      const endDate = new Date(selectedDate);
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 6);

      const metrics = await samsungHealthDailyMetricsService.getDailyMetricsRange(startDate, endDate);
      setWeeklyMetrics(metrics);
      generateInsights(metrics);
      
      // Calculate wellness metrics
      if (metrics.length > 0) {
        const wellness = await samsungHealthDailyMetricsService.calculateWellnessMetrics(metrics);
        setWellnessData(wellness);
      }
    } catch (error) {
      console.error('❌ [SamsungHealthDashboard] Error loading weekly data:', error);
    } finally {
      setIsLoadingWeekly(false);
    }
  };

  const generateInsights = (metrics: SamsungHealthDailyMetrics[]) => {
    const insights: string[] = [];

    if (metrics.length === 0) return;

    // Activity insights
    const avgSteps = metrics.reduce((sum, m) => sum + m.step_count, 0) / metrics.length;
    const avgActiveCalories = metrics.reduce((sum, m) => sum + m.active_calorie, 0) / metrics.length;

    if (avgSteps >= 10000) {
      insights.push('🚶‍♂️ Excellent activity level! You\'re consistently hitting your step goals.');
    } else if (avgSteps >= 7500) {
      insights.push('👍 Good activity level. Consider adding a few more daily steps to reach 10,000.');
    } else {
      insights.push('💪 Your activity could use a boost. Try taking short walks throughout the day.');
    }

    // Sleep insights
    const sleepData = metrics.filter(m => m.sleep_data).map(m => m.sleep_data!);
    if (sleepData.length > 0) {
      const avgSleepHours = sleepData.reduce((sum, s) => sum + s.duration, 0) / sleepData.length / 60;
      const avgEfficiency = sleepData.reduce((sum, s) => sum + s.efficiency, 0) / sleepData.length;

      if (avgSleepHours >= 7 && avgEfficiency >= 80) {
        insights.push('😴 Great sleep quality! Your rest is supporting your fitness goals.');
      } else if (avgSleepHours < 7) {
        insights.push('⏰ Consider getting more sleep. Aim for 7-9 hours for optimal recovery.');
      } else if (avgEfficiency < 75) {
        insights.push('🛏️ Your sleep efficiency could improve. Try a consistent bedtime routine.');
      }
    }

    // Heart rate insights
    const hrData = metrics.filter(m => m.heart_rate).map(m => m.heart_rate!);
    if (hrData.length > 0) {
      const avgRestingHR = hrData.reduce((sum, h) => sum + h.resting, 0) / hrData.length;

      if (avgRestingHR < 60) {
        insights.push('❤️ Excellent cardiovascular fitness! Your resting heart rate indicates great conditioning.');
      } else if (avgRestingHR > 80) {
        insights.push('🫀 Consider cardiovascular training to improve your resting heart rate.');
      }
    }

    // Stress insights
    const stressData = metrics.filter(m => m.stress_level !== undefined);
    if (stressData.length > 0) {
      const avgStress = stressData.reduce((sum, m) => sum + m.stress_level!, 0) / stressData.length;
      
      if (avgStress > 70) {
        insights.push('😰 High stress levels detected. Consider stress management techniques and recovery nutrition.');
      } else if (avgStress < 30) {
        insights.push('🧘‍♀️ Great stress management! Your low stress levels support optimal recovery.');
      }
    }

    setInsights(insights);
  };

  const changeDateRange = (direction: 'previous' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  const getDateRangeText = () => {
    const endDate = new Date(selectedDate);
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - 6);
    
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const getWeeklyAverage = (field: keyof SamsungHealthDailyMetrics) => {
    if (weeklyMetrics.length === 0) return 0;
    
    if (field === 'step_count' || field === 'calorie' || field === 'active_calorie' || field === 'distance') {
      return Math.round(weeklyMetrics.reduce((sum, m) => sum + (m[field] as number), 0) / weeklyMetrics.length);
    }
    
    return 0;
  };

  const getSleepAverage = () => {
    const sleepData = weeklyMetrics.filter(m => m.sleep_data);
    if (sleepData.length === 0) return { hours: 0, efficiency: 0 };
    
    const avgHours = sleepData.reduce((sum, m) => sum + m.sleep_data!.duration, 0) / sleepData.length / 60;
    const avgEfficiency = sleepData.reduce((sum, m) => sum + m.sleep_data!.efficiency, 0) / sleepData.length;
    
    return {
      hours: Math.round(avgHours * 10) / 10,
      efficiency: Math.round(avgEfficiency)
    };
  };

  const getHeartRateAverage = () => {
    const hrData = weeklyMetrics.filter(m => m.heart_rate);
    if (hrData.length === 0) return 0;
    
    return Math.round(hrData.reduce((sum, m) => sum + m.heart_rate!.resting, 0) / hrData.length);
  };

  if (Platform.OS !== 'android') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Samsung Health Dashboard</Text>
        </View>
        
        <View style={styles.notSupportedContainer}>
          <Ionicons name="phone-portrait-outline" size={64} color="#666" />
          <Text style={styles.notSupportedTitle}>Android Required</Text>
          <Text style={styles.notSupportedText}>
            Samsung Health integration is only available on Android devices.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Samsung Health Dashboard</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Range Selector */}
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity
            style={styles.dateRangeButton}
            onPress={() => changeDateRange('previous')}
          >
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.dateRangeText}>{getDateRangeText()}</Text>
          
          <TouchableOpacity
            style={styles.dateRangeButton}
            onPress={() => changeDateRange('next')}
          >
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Weekly Summary Cards */}
        {isLoadingWeekly ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading Samsung Health data...</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{getWeeklyAverage('step_count').toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>Avg Daily Steps</Text>
                <Ionicons name="walk" size={24} color="#007AFF" />
              </View>
              
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{getWeeklyAverage('active_calorie')}</Text>
                <Text style={styles.summaryLabel}>Avg Active Calories</Text>
                <Ionicons name="flame" size={24} color="#FF9500" />
              </View>
            </View>

            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{getSleepAverage().hours}h</Text>
                <Text style={styles.summaryLabel}>Avg Sleep ({getSleepAverage().efficiency}% eff.)</Text>
                <Ionicons name="bed" size={24} color="#34C759" />
              </View>
              
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{getHeartRateAverage()}</Text>
                <Text style={styles.summaryLabel}>Avg Resting HR</Text>
                <Ionicons name="heart" size={24} color="#FF3B30" />
              </View>
            </View>

            {/* Wellness Metrics */}
            {wellnessData && (
              <View style={styles.wellnessContainer}>
                <Text style={styles.wellnessTitle}>📊 Wellness Analysis</Text>
                <View style={styles.wellnessRow}>
                  <View style={styles.wellnessItem}>
                    <Text style={styles.wellnessValue}>{wellnessData.enhancedTDEE}</Text>
                    <Text style={styles.wellnessLabel}>Enhanced TDEE</Text>
                  </View>
                  <View style={styles.wellnessItem}>
                    <Text style={styles.wellnessValue}>{wellnessData.activityLevel}</Text>
                    <Text style={styles.wellnessLabel}>Activity Level</Text>
                  </View>
                  <View style={styles.wellnessItem}>
                    <Text style={styles.wellnessValue}>{wellnessData.confidenceScore}%</Text>
                    <Text style={styles.wellnessLabel}>Data Confidence</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* Daily Metrics */}
        <SamsungHealthMetrics 
          date={selectedDate}
          showDatePicker={false}
          onMetricsLoaded={(metrics) => {
            // Handle individual day metrics if needed
          }}
        />

        {/* Insights Section */}
        {insights.length > 0 && (
          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>💡 Health Insights</Text>
            {insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Samsung Health Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              🏃‍♂️ Sync your Galaxy Watch for more accurate heart rate and sleep data
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              📱 Enable stress tracking for comprehensive wellness insights
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              😴 Consistent sleep schedules improve the accuracy of recovery recommendations
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  dateRangeButton: {
    padding: 8,
  },
  dateRangeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  wellnessContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wellnessTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  wellnessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wellnessItem: {
    flex: 1,
    alignItems: 'center',
  },
  wellnessValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  wellnessLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  insightsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  insightItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  tipItem: {
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  notSupportedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default SamsungHealthDashboard;
