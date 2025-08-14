import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import { AppleHealthExportService, HealthReport } from '../services/AppleHealthExportService';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface HealthDataVisualizationProps {
  report: HealthReport | null;
  onExportRequest: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const HealthDataVisualization: React.FC<HealthDataVisualizationProps> = ({ 
  report, 
  onExportRequest 
}) => {
  if (!report) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No health data available</Text>
        <Text style={styles.emptySubtext}>
          Connect Apple Health to see your data visualization
        </Text>
      </View>
    );
  }

  const { workoutSummary, nutritionSummary, sleepSummary, bodyCompositionSummary, progressTowards } = report;

  const renderProgressBar = (label: string, value: number, maxValue: number = 100, color: string = '#007AFF') => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{Math.round(value)}{maxValue === 100 ? '%' : ''}</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${Math.min((value / maxValue) * 100, 100)}%`,
              backgroundColor: color 
            }
          ]} 
        />
      </View>
    </View>
  );

  const renderMetricCard = (title: string, value: string, subtitle?: string, icon?: string) => (
    <View style={styles.metricCard}>
      {icon && <Text style={styles.metricIcon}>{icon}</Text>}
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const getProgressColor = (value: number) => {
    if (value >= 80) return '#28a745';
    if (value >= 60) return '#ffc107';
    return '#dc3545';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Health Data Overview</Text>
        <Text style={styles.period}>
          {format(report.period.start, 'MMM dd')} - {format(report.period.end, 'MMM dd, yyyy')}
        </Text>
        <TouchableOpacity style={styles.exportButton} onPress={onExportRequest}>
          <Text style={styles.exportButtonText}>📤 Export Data</Text>
        </TouchableOpacity>
      </View>

      {/* Overall Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Overall Progress</Text>
        {renderProgressBar(
          'Health Goals', 
          progressTowards.overallProgress, 
          100, 
          getProgressColor(progressTowards.overallProgress)
        )}
        {renderProgressBar(
          'Calorie Goal Adherence', 
          progressTowards.calorieGoalAdherence, 
          100, 
          getProgressColor(progressTowards.calorieGoalAdherence)
        )}
        {renderProgressBar(
          'Workout Consistency', 
          progressTowards.workoutGoalProgress, 
          100, 
          getProgressColor(progressTowards.workoutGoalProgress)
        )}
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Key Metrics</Text>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Workouts',
            workoutSummary.totalWorkouts.toString(),
            `${Math.round(workoutSummary.totalDuration)} minutes total`,
            '💪'
          )}
          {renderMetricCard(
            'Avg Calories',
            Math.round(nutritionSummary.averageDailyCalories).toString(),
            'per day',
            '🥗'
          )}
          {renderMetricCard(
            'Sleep',
            `${sleepSummary.averageDuration.toFixed(1)}h`,
            `${Math.round(sleepSummary.averageEfficiency)}% efficiency`,
            '😴'
          )}
          {bodyCompositionSummary.weightChange !== 0 && renderMetricCard(
            'Weight Change',
            `${bodyCompositionSummary.weightChange > 0 ? '+' : ''}${bodyCompositionSummary.weightChange.toFixed(1)}kg`,
            'this period',
            '⚖️'
          )}
        </View>
      </View>

      {/* Workout Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💪 Workout Analysis</Text>
        <View style={styles.dataCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Sessions:</Text>
            <Text style={styles.statValue}>{workoutSummary.totalWorkouts}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Duration:</Text>
            <Text style={styles.statValue}>{Math.round(workoutSummary.totalDuration)} minutes</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Calories Burned:</Text>
            <Text style={styles.statValue}>{Math.round(workoutSummary.totalCaloriesBurned)} kcal</Text>
          </View>
          {workoutSummary.averageHeartRate && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Avg Heart Rate:</Text>
              <Text style={styles.statValue}>{Math.round(workoutSummary.averageHeartRate)} bpm</Text>
            </View>
          )}
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Most Active Day:</Text>
            <Text style={styles.statValue}>{workoutSummary.mostActiveDay}</Text>
          </View>
        </View>

        {/* Workout Types Breakdown */}
        {Object.keys(workoutSummary.workoutsByType).length > 0 && (
          <View style={styles.dataCard}>
            <Text style={styles.cardTitle}>Workout Types</Text>
            {Object.entries(workoutSummary.workoutsByType).map(([type, count]) => (
              <View key={type} style={styles.statRow}>
                <Text style={styles.statLabel}>{type}:</Text>
                <Text style={styles.statValue}>{count} sessions</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Nutrition Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🥗 Nutrition Analysis</Text>
        <View style={styles.dataCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Daily Average:</Text>
            <Text style={styles.statValue}>{Math.round(nutritionSummary.averageDailyCalories)} kcal</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Goal Adherence:</Text>
            <Text style={[
              styles.statValue, 
              { color: getProgressColor(nutritionSummary.goalAdherence) }
            ]}>
              {Math.round(nutritionSummary.goalAdherence)}%
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Avg Daily Deficit:</Text>
            <Text style={styles.statValue}>
              {Math.round(nutritionSummary.calorieDeficit)} kcal
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Days Over Goal:</Text>
            <Text style={styles.statValue}>{nutritionSummary.daysOverGoal}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Days Under Goal:</Text>
            <Text style={styles.statValue}>{nutritionSummary.daysUnderGoal}</Text>
          </View>
        </View>
      </View>

      {/* Sleep Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>😴 Sleep Analysis</Text>
        <View style={styles.dataCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Average Duration:</Text>
            <Text style={styles.statValue}>{sleepSummary.averageDuration.toFixed(1)} hours</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Sleep Efficiency:</Text>
            <Text style={[
              styles.statValue,
              { color: sleepSummary.averageEfficiency >= 85 ? '#28a745' : '#ffc107' }
            ]}>
              {Math.round(sleepSummary.averageEfficiency)}%
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Deep Sleep:</Text>
            <Text style={styles.statValue}>{Math.round(sleepSummary.deepSleepPercentage)}%</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>REM Sleep:</Text>
            <Text style={styles.statValue}>{Math.round(sleepSummary.remSleepPercentage)}%</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Avg Bedtime:</Text>
            <Text style={styles.statValue}>{sleepSummary.averageBedtime}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Avg Wake Time:</Text>
            <Text style={styles.statValue}>{sleepSummary.averageWakeTime}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Trend:</Text>
            <Text style={[
              styles.statValue,
              { 
                color: sleepSummary.sleepTrend === 'improving' ? '#28a745' : 
                       sleepSummary.sleepTrend === 'declining' ? '#dc3545' : '#6c757d'
              }
            ]}>
              {sleepSummary.sleepTrend}
            </Text>
          </View>
        </View>
      </View>

      {/* Body Composition */}
      {(bodyCompositionSummary.startWeight || bodyCompositionSummary.measurements.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚖️ Body Composition</Text>
          <View style={styles.dataCard}>
            {bodyCompositionSummary.startWeight && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Starting Weight:</Text>
                <Text style={styles.statValue}>{bodyCompositionSummary.startWeight.toFixed(1)} kg</Text>
              </View>
            )}
            {bodyCompositionSummary.endWeight && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Current Weight:</Text>
                <Text style={styles.statValue}>{bodyCompositionSummary.endWeight.toFixed(1)} kg</Text>
              </View>
            )}
            {bodyCompositionSummary.weightChange !== 0 && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Weight Change:</Text>
                <Text style={[
                  styles.statValue,
                  { color: bodyCompositionSummary.weightChange < 0 ? '#28a745' : '#dc3545' }
                ]}>
                  {bodyCompositionSummary.weightChange > 0 ? '+' : ''}
                  {bodyCompositionSummary.weightChange.toFixed(1)} kg
                </Text>
              </View>
            )}
            {bodyCompositionSummary.averageBodyFat && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Avg Body Fat:</Text>
                <Text style={styles.statValue}>{bodyCompositionSummary.averageBodyFat.toFixed(1)}%</Text>
              </View>
            )}
            {bodyCompositionSummary.averageLeanMass && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Avg Lean Mass:</Text>
                <Text style={styles.statValue}>{bodyCompositionSummary.averageLeanMass.toFixed(1)} kg</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Goals Achieved */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Goals & Achievements</Text>
        
        {progressTowards.goalsAchieved.length > 0 && (
          <View style={[styles.dataCard, styles.successCard]}>
            <Text style={styles.achievementTitle}>✅ Goals Achieved</Text>
            {progressTowards.goalsAchieved.map((goal, index) => (
              <Text key={index} style={styles.achievementText}>• {goal}</Text>
            ))}
          </View>
        )}

        {progressTowards.goalsNeedingAttention.length > 0 && (
          <View style={[styles.dataCard, styles.attentionCard]}>
            <Text style={styles.attentionTitle}>⚠️ Areas for Improvement</Text>
            {progressTowards.goalsNeedingAttention.map((goal, index) => (
              <Text key={index} style={styles.attentionText}>• {goal}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Recommendations</Text>
          <View style={styles.dataCard}>
            {report.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationNumber}>{index + 1}</Text>
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  period: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },
  exportButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#fff',
    width: (screenWidth - 60) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#6c757d',
    textAlign: 'center',
  },
  dataCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  successCard: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  attentionCard: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 8,
  },
  achievementText: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 4,
  },
  attentionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  attentionText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  recommendationNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
});

export default HealthDataVisualization;
