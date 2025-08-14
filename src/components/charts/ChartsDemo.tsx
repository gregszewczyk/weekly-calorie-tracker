import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import {
  CalorieProgressRing,
  MacroBreakdownChart,
  WaterIntakeTracker,
  WeeklyTrendChart,
  MacroData,
  MacroTargets,
  DayData,
} from './index';

const ChartsDemo: React.FC = () => {
  const [waterIntake, setWaterIntake] = useState(5);

  // Sample data for demonstrations
  const sampleMacros: MacroData = {
    protein: 120,
    carbs: 200,
    fat: 65,
  };

  const sampleMacroTargets: MacroTargets = {
    protein: 150,
    carbs: 250,
    fat: 80,
  };

  const sampleWeeklyData: DayData[] = [
    { date: '2025-07-26', actual: 1850, target: 2000, dayName: 'Mon' },
    { date: '2025-07-27', actual: 2100, target: 2000, dayName: 'Tue' },
    { date: '2025-07-28', actual: 1950, target: 2000, dayName: 'Wed' },
    { date: '2025-07-29', actual: 2200, target: 2000, dayName: 'Thu' },
    { date: '2025-07-30', actual: 1800, target: 2000, dayName: 'Fri' },
    { date: '2025-07-31', actual: 2050, target: 2000, dayName: 'Sat' },
    { date: '2025-08-01', actual: 1900, target: 2000, dayName: 'Sun' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Daily Progress Charts</Text>
      
      {/* Calorie Progress Ring */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Calorie Progress Ring</Text>
        <View style={styles.ringContainer}>
          <CalorieProgressRing
            consumed={1650}
            target={2000}
            animated={true}
            size={200}
          />
        </View>
      </View>

      {/* Macro Breakdown Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Macro Breakdown Chart</Text>
        <MacroBreakdownChart
          macros={sampleMacros}
          targets={sampleMacroTargets}
          animated={true}
        />
      </View>

      {/* Water Intake Tracker */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Water Intake Tracker</Text>
        <WaterIntakeTracker
          currentIntake={waterIntake}
          dailyTarget={8}
          onUpdate={setWaterIntake}
        />
      </View>

      {/* Weekly Trend Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Weekly Trend Chart</Text>
        <WeeklyTrendChart
          weeklyData={sampleWeeklyData}
          showTarget={true}
          interactive={true}
        />
      </View>

      {/* Usage Examples */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Usage Examples</Text>
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleText}>
            • CalorieProgressRing: Shows daily calorie progress with color-coded feedback
          </Text>
          <Text style={styles.exampleText}>
            • MacroBreakdownChart: Displays protein, carbs, and fat progress
          </Text>
          <Text style={styles.exampleText}>
            • WaterIntakeTracker: Interactive water glass tracking
          </Text>
          <Text style={styles.exampleText}>
            • WeeklyTrendChart: Scrollable 7-day calorie trend with smooth curves
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    margin: 20,
  },
  chartSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  ringContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  exampleContainer: {
    paddingVertical: 10,
  },
  exampleText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default ChartsDemo;
