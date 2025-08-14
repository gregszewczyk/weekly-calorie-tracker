import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useCalorieStore } from '../stores/calorieStore';
import RecoveryIntegration from '../components/RecoveryIntegration';

/**
 * Demo screen to showcase the Binge Recovery Calculator functionality
 * This demonstrates how recovery features integrate with the existing app
 */
const RecoveryDemoScreen: React.FC = () => {
  const {
    logMeal,
    getTodaysData,
    getRemainingCaloriesForToday,
    checkForOvereatingEvent,
    getActiveRecoverySession,
    getRecoveryHistory,
    isRecoveryModeEnabled,
  } = useCalorieStore();

  const [mealCalories, setMealCalories] = useState('');
  const [mealName, setMealName] = useState('');

  const todayData = getTodaysData();
  const remainingCalories = getRemainingCaloriesForToday();
  const activeSession = getActiveRecoverySession();
  const recoveryHistory = getRecoveryHistory();
  const recoveryEnabled = isRecoveryModeEnabled();

  const handleLogMeal = () => {
    if (!mealName.trim() || !mealCalories.trim()) {
      Alert.alert('Error', 'Please enter both meal name and calories');
      return;
    }

    const calories = parseInt(mealCalories);
    if (isNaN(calories) || calories <= 0) {
      Alert.alert('Error', 'Please enter valid calories');
      return;
    }

    logMeal({
      name: mealName.trim(),
      calories,
      category: 'snack', // Default category for demo
    });

    setMealName('');
    setMealCalories('');
    
    Alert.alert('Success', 'Meal logged successfully!');
  };

  const handleTriggerOvereating = () => {
    // Log a high-calorie meal to trigger recovery
    logMeal({
      name: 'Large overage (demo)',
      calories: 800, // This should trigger moderate overeating
      category: 'snack',
    });
    
    Alert.alert('Demo', 'High-calorie meal logged. Recovery system should detect this overage.');
  };

  const handleCheckRecovery = () => {
    const event = checkForOvereatingEvent();
    if (event) {
      Alert.alert('Overeating Detected', 
        `Event detected: ${event.excessCalories} calories over target (${event.triggerType})`);
    } else {
      Alert.alert('No Overeating', 'No overeating event detected for today.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Recovery System Demo</Text>
          <Text style={styles.subtitle}>
            Test the Binge Recovery Calculator functionality
          </Text>
        </View>

        {/* Recovery Integration */}
        <RecoveryIntegration />

        {/* Current Day Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Consumed:</Text>
              <Text style={styles.statusValue}>{todayData?.consumed || 0} cal</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Target:</Text>
              <Text style={styles.statusValue}>{todayData?.target || 0} cal</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Remaining:</Text>
              <Text style={[
                styles.statusValue,
                remainingCalories < 0 && styles.overBudget
              ]}>
                {remainingCalories} cal
              </Text>
            </View>
          </View>
        </View>

        {/* Manual Meal Logging */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Meal</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              placeholder="Meal name (e.g., Lunch)"
              value={mealName}
              onChangeText={setMealName}
            />
            <TextInput
              style={styles.input}
              placeholder="Calories"
              value={mealCalories}
              onChangeText={setMealCalories}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.logButton} onPress={handleLogMeal}>
              <Text style={styles.buttonText}>Log Meal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo Actions</Text>
          <View style={styles.demoCard}>
            <TouchableOpacity style={styles.demoButton} onPress={handleTriggerOvereating}>
              <Ionicons name="warning" size={20} color="#FFC107" />
              <Text style={styles.demoButtonText}>Trigger Overeating Event</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.demoButton} onPress={handleCheckRecovery}>
              <Ionicons name="search" size={20} color="#339AF0" />
              <Text style={styles.demoButtonText}>Check Recovery Status</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Recovery Session */}
        {activeSession && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Recovery Session</Text>
            <View style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>
                {activeSession.originalPlan.strategy.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={styles.sessionDetails}>
                Day {activeSession.progress.daysCompleted + 1} of {activeSession.progress.daysRemaining + activeSession.progress.daysCompleted}
              </Text>
              <Text style={styles.sessionDetails}>
                Target: {activeSession.progress.adjustedTarget} calories/day
              </Text>
              <Text style={styles.sessionDetails}>
                Adherence: {activeSession.progress.adherenceRate}%
              </Text>
            </View>
          </View>
        )}

        {/* Recovery History */}
        {recoveryHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recovery History</Text>
            <View style={styles.historyCard}>
              {recoveryHistory.slice(-3).map((plan, index) => (
                <View key={plan.id} style={styles.historyItem}>
                  <Text style={styles.historyStrategy}>
                    {plan.strategy.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text style={styles.historyDate}>
                    {format(plan.createdAt, 'MMM dd, yyyy')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recovery Settings Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recovery Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Recovery Mode:</Text>
              <Text style={[
                styles.settingsValue,
                { color: recoveryEnabled ? '#28A745' : '#DC3545' }
              ]}>
                {recoveryEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#339AF0" />
          <Text style={styles.infoText}>
            The recovery system automatically detects overeating events when you log meals.
            Try logging a high-calorie meal to see the recovery options.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  overBudget: {
    color: '#DC3545',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  logButton: {
    backgroundColor: '#28A745',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  demoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  demoButtonText: {
    fontSize: 16,
    color: '#212529',
    marginLeft: 12,
  },
  sessionCard: {
    backgroundColor: '#E7F3FF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  sessionDetails: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  historyStrategy: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
  historyDate: {
    fontSize: 14,
    color: '#6C757D',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  settingsLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  settingsValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E7F3FF',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default RecoveryDemoScreen;