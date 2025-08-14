import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { format } from 'date-fns';
import { useCalorieStore } from '../stores/calorieStore';

/**
 * Debug component to test recovery system
 * Add this temporarily to any screen to debug recovery issues
 */
const RecoveryDebugger: React.FC = () => {
  const {
    getTodaysData,
    getPendingOvereatingEvent,
    getActiveRecoverySession,
    getRecoveryHistory,
    isRecoveryModeEnabled,
    checkForOvereatingEvent,
    createRecoveryPlan,
    getLockedDailyTarget,
    getCalorieBankStatus,
  } = useCalorieStore();

  const todayData = getTodaysData();
  const pendingEvent = getPendingOvereatingEvent();
  const activeSession = getActiveRecoverySession();
  const recoveryHistory = getRecoveryHistory();
  const recoveryEnabled = isRecoveryModeEnabled();
  
  // DEBUG: Daily target locking information
  const lockedTarget = getLockedDailyTarget();
  const bankingStatus = getCalorieBankStatus();

  const handleManualCheck = () => {
    const event = checkForOvereatingEvent();
    if (event) {
      Alert.alert('Event Detected!', 
        `Found overeating event:\n` +
        `Date: ${event.date}\n` +
        `Excess: ${event.excessCalories} cal\n` +
        `Severity: ${event.triggerType}`
      );
    } else {
      Alert.alert('No Event', 
        `No overeating event detected.\n` +
        `Today consumed: ${todayData?.consumed || 0}\n` +
        `Today target: ${todayData?.target || 0}\n` +
        `Excess: ${(todayData?.consumed || 0) - (todayData?.target || 0)}`
      );
    }
  };

  const handleCreatePlan = () => {
    if (!pendingEvent) {
      Alert.alert('No Event', 'No pending overeating event to create plan for');
      return;
    }
    
    const plan = createRecoveryPlan(pendingEvent.id);
    if (plan) {
      Alert.alert('Plan Created!', 
        `Recovery plan created with ${plan.rebalancingOptions.length} options`
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Recovery Debug Panel</Text>
      
      <ScrollView style={styles.content}>
        {/* Current State */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current State</Text>
          <Text style={styles.debugText}>Recovery Mode: {recoveryEnabled ? '✅ Enabled' : '❌ Disabled'}</Text>
          <Text style={styles.debugText}>Date: {format(new Date(), 'yyyy-MM-dd')}</Text>
          <Text style={styles.debugText}>Today Consumed: {todayData?.consumed || 'No data'}</Text>
          <Text style={styles.debugText}>Today Target (static): {todayData?.target || 'No data'}</Text>
          <Text style={styles.debugText}>🔒 Locked Target: {lockedTarget !== null ? lockedTarget : 'NOT LOCKED'}</Text>
          <Text style={styles.debugText}>🏦 Banking Target: {bankingStatus?.safeToEatToday || 'No banking data'}</Text>
          <Text style={styles.debugText}>
            Excess (vs locked): {todayData && lockedTarget ? (todayData.consumed - lockedTarget) : 'No data'}
          </Text>
        </View>

        {/* Pending Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Events</Text>
          {pendingEvent ? (
            <>
              <Text style={styles.debugText}>📅 Date: {pendingEvent.date}</Text>
              <Text style={styles.debugText}>⚠️ Excess: {pendingEvent.excessCalories} cal</Text>
              <Text style={styles.debugText}>🔴 Severity: {pendingEvent.triggerType}</Text>
              <Text style={styles.debugText}>👁️ Acknowledged: {pendingEvent.userAcknowledged ? 'Yes' : 'No'}</Text>
            </>
          ) : (
            <Text style={styles.debugText}>No pending events</Text>
          )}
        </View>

        {/* Active Session */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Session</Text>
          {activeSession ? (
            <>
              <Text style={styles.debugText}>📊 Strategy: {activeSession.originalPlan.strategy}</Text>
              <Text style={styles.debugText}>📅 Duration: {activeSession.progress.daysRemaining + activeSession.progress.daysCompleted} days</Text>
              <Text style={styles.debugText}>🎯 Target: {activeSession.progress.adjustedTarget} cal</Text>
            </>
          ) : (
            <Text style={styles.debugText}>No active session</Text>
          )}
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          <Text style={styles.debugText}>Total Plans: {recoveryHistory.length}</Text>
        </View>

        {/* Debug Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Actions</Text>
          
          <TouchableOpacity style={styles.button} onPress={handleManualCheck}>
            <Text style={styles.buttonText}>🔍 Manual Detection Check</Text>
          </TouchableOpacity>
          
          {pendingEvent && (
            <TouchableOpacity style={styles.button} onPress={handleCreatePlan}>
              <Text style={styles.buttonText}>📋 Create Recovery Plan</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Expected Behavior */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected for 5000kcal</Text>
          <Text style={styles.expectedText}>• Should detect as "severe" ({'>'}1000 over target)</Text>
          <Text style={styles.expectedText}>• Should create overeating event automatically</Text>
          <Text style={styles.expectedText}>• Should show red alert in RecoveryIntegration</Text>
          <Text style={styles.expectedText}>• Should offer 4 recovery options</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3CD',
    margin: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFC107',
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    backgroundColor: '#FFC107',
    padding: 12,
    textAlign: 'center',
  },
  content: {
    maxHeight: 400,
  },
  section: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFC107',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  expectedText: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#FFC107',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
});

export default RecoveryDebugger;