import React, { useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCalorieStore } from './src/stores/calorieStore';

function App(): JSX.Element {
  const { initializeWeek, getCurrentWeekProgress, getCalorieRedistribution } = useCalorieStore();

  useEffect(() => {
    // Initialize the current week when app starts
    initializeWeek();
  }, [initializeWeek]);

  const weekProgress = getCurrentWeekProgress();
  const redistribution = getCalorieRedistribution();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.content}>
        <Text style={styles.title}>Weekly Calorie Tracker</Text>
        <Text style={styles.subtitle}>MVP Setup Complete</Text>
        
        {weekProgress && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Week's Progress</Text>
            <Text>Target: {weekProgress.goal.totalTarget} calories</Text>
            <Text>Consumed: {weekProgress.totalConsumed} calories</Text>
            <Text>Remaining: {weekProgress.remainingCalories} calories</Text>
          </View>
        )}

        {redistribution && redistribution.remainingDays > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily Recommendations</Text>
            <Text>Days remaining: {redistribution.remainingDays}</Text>
            <Text>Status: {redistribution.adjustmentReason}</Text>
            {redistribution.recommendedDailyTargets.map((target, index) => (
              <Text key={index}>
                Day {index + 1}: {Math.round(target)} calories
              </Text>
            ))}
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ready for GitHub Copilot development!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  card: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  footer: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  footerText: {
    textAlign: 'center',
    color: '#2d5a2d',
    fontWeight: '500',
  },
});

export default App;