/**
 * Apple Health Dashboard Screen
 * 
 * Comprehensive dashboard displaying daily health metrics from Apple HealthKit.
 * Shows activity trends, sleep analysis, heart rate data, and more.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppleHealthMetrics } from '../components/AppleHealthMetrics';
import { AppleBodyComposition } from '../components/AppleBodyComposition';
import { appleHealthKitService } from '../services/AppleHealthKitService';
import { AppleHealthDailyMetrics } from '../types/AppleHealthKitTypes';

interface AppleHealthDashboardProps {
  onBack?: () => void;
}

export const AppleHealthDashboard: React.FC<AppleHealthDashboardProps> = ({
  onBack,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weeklyMetrics, setWeeklyMetrics] = useState<AppleHealthDailyMetrics[]>([]);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    loadWeeklyData();
  }, [selectedDate]);

  const loadWeeklyData = async () => {
    if (Platform.OS !== 'ios') return;

    setIsLoadingWeekly(true);
    try {
      // Get last 7 days of data
      const endDate = new Date(selectedDate);
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 6);

      const metrics = await appleHealthKitService.getDailyMetricsRange(startDate, endDate);
      setWeeklyMetrics(metrics);
      generateInsights(metrics);
    } catch (error) {
      console.error('❌ [AppleHealthDashboard] Error loading weekly data:', error);
    } finally {
      setIsLoadingWeekly(false);
    }
  };

  const generateInsights = (metrics: AppleHealthDailyMetrics[]) => {
    const insights: string[] = [];

    if (metrics.length === 0) return;

    // Activity insights
    const avgSteps = metrics.reduce((sum, m) => sum + m.steps, 0) / metrics.length;
    const avgActiveCalories = metrics.reduce((sum, m) => sum + m.activeEnergyBurned, 0) / metrics.length;

    if (avgSteps >= 10000) {
      insights.push('🚶‍♂️ Excellent activity level! You\'re consistently hitting your step goals.');
    } else if (avgSteps >= 7500) {
      insights.push('👍 Good activity level. Consider adding a few more daily steps to reach 10,000.');
    } else {
      insights.push('💪 Your activity could use a boost. Try taking short walks throughout the day.');
    }

    // Sleep insights
    const sleepData = metrics.filter(m => m.sleepAnalysis).map(m => m.sleepAnalysis!);
    if (sleepData.length > 0) {
      const avgSleepHours = sleepData.reduce((sum, s) => sum + s.timeAsleep, 0) / sleepData.length / 60;
      const avgEfficiency = sleepData.reduce((sum, s) => sum + s.sleepEfficiency, 0) / sleepData.length;

      if (avgSleepHours >= 7 && avgEfficiency >= 80) {
        insights.push('😴 Great sleep quality! Your rest is supporting your fitness goals.');
      } else if (avgSleepHours < 7) {
        insights.push('⏰ Consider getting more sleep. Aim for 7-9 hours for optimal recovery.');
      } else if (avgEfficiency < 75) {
        insights.push('🛏️ Your sleep efficiency could improve. Try a consistent bedtime routine.');
      }
    }

    // Heart rate insights
    const hrData = metrics.filter(m => m.heartRateData).map(m => m.heartRateData!);
    if (hrData.length > 0) {
      const avgRestingHR = hrData.reduce((sum, h) => sum + h.resting, 0) / hrData.length;
      const avgHRV = hrData.reduce((sum, h) => sum + h.variability, 0) / hrData.length;

      if (avgHRV >= 40) {
        insights.push('❤️ Excellent heart rate variability indicates good recovery and fitness.');
      } else if (avgHRV < 25) {
        insights.push('💗 Low HRV may indicate you need more recovery time between workouts.');
      }
    }

    // Calorie balance insights
    const avgBasalCalories = metrics.reduce((sum, m) => sum + m.basalEnergyBurned, 0) / metrics.length;
    const totalDailyExpenditure = avgActiveCalories + avgBasalCalories;

    insights.push(`🔥 Daily calorie burn: ~${Math.round(totalDailyExpenditure)} kcal (${Math.round(avgActiveCalories)} active + ${Math.round(avgBasalCalories)} basal)`);

    setInsights(insights);
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Apple Health Dashboard</Text>
        
        <TouchableOpacity 
          style={styles.todayButton}
          onPress={goToToday}
          disabled={isToday}
        >
          <Text style={[styles.todayButtonText, isToday && styles.todayButtonDisabled]}>
            Today
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity 
          style={styles.dateNavButton}
          onPress={() => handleDateChange('prev')}
        >
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
        </TouchableOpacity>
        
        <Text style={styles.currentDate}>
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: selectedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
          })}
        </Text>
        
        <TouchableOpacity 
          style={styles.dateNavButton}
          onPress={() => handleDateChange('next')}
          disabled={isToday}
        >
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isToday ? "#C7C7CC" : "#007AFF"} 
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Metrics */}
        <AppleHealthMetrics
          date={selectedDate}
          showDatePicker={false}
          onMetricsLoaded={(metrics) => {
            console.log('📊 [Dashboard] Metrics loaded for', selectedDate.toDateString());
          }}
        />

        {/* Body Composition */}
        <AppleBodyComposition
          onSyncComplete={() => {
            console.log('⚖️ [Dashboard] Body composition sync completed');
          }}
          showSyncButton={false}
          autoSync={false}
        />

        {/* Weekly Insights */}
        {insights.length > 0 && (
          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>📈 Weekly Insights</Text>
            {insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
            {isLoadingWeekly && (
              <View style={styles.loadingInsights}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingInsightsText}>Analyzing weekly trends...</Text>
              </View>
            )}
          </View>
        )}

        {/* Weekly Summary */}
        {weeklyMetrics.length > 0 && (
          <View style={styles.weeklyCard}>
            <Text style={styles.weeklyTitle}>📅 7-Day Summary</Text>
            <View style={styles.weeklyStats}>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatValue}>
                  {Math.round(weeklyMetrics.reduce((sum, m) => sum + m.steps, 0) / weeklyMetrics.length).toLocaleString()}
                </Text>
                <Text style={styles.weeklyStatLabel}>Avg Steps/Day</Text>
              </View>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatValue}>
                  {Math.round(weeklyMetrics.reduce((sum, m) => sum + m.activeEnergyBurned, 0) / weeklyMetrics.length)}
                </Text>
                <Text style={styles.weeklyStatLabel}>Avg Active kcal</Text>
              </View>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatValue}>
                  {weeklyMetrics.filter(m => m.sleepAnalysis).length > 0 
                    ? Math.round(
                        weeklyMetrics
                          .filter(m => m.sleepAnalysis)
                          .reduce((sum, m) => sum + m.sleepAnalysis!.timeAsleep, 0) / 
                        weeklyMetrics.filter(m => m.sleepAnalysis).length / 60 * 10
                      ) / 10
                    : 'N/A'
                  }
                </Text>
                <Text style={styles.weeklyStatLabel}>Avg Sleep Hours</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Health Tips</Text>
          <Text style={styles.tipText}>
            • Aim for 10,000+ steps daily for cardiovascular health
          </Text>
          <Text style={styles.tipText}>
            • Get 7-9 hours of quality sleep for optimal recovery
          </Text>
          <Text style={styles.tipText}>
            • Monitor your resting heart rate trends over time
          </Text>
          <Text style={styles.tipText}>
            • Higher HRV generally indicates better recovery status
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  todayButtonDisabled: {
    color: '#8E8E93',
  },

  // Date Navigation
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dateNavButton: {
    padding: 8,
  },
  currentDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },

  // Content
  content: {
    flex: 1,
  },

  // Insights Card
  insightsCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  insightItem: {
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  loadingInsights: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingInsightsText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
  },

  // Weekly Card
  weeklyCard: {
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
  weeklyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyStat: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  weeklyStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Tips Card
  tipsCard: {
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
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
});
