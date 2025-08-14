import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCalorieStore } from '../stores/calorieStore';

/**
 * Emergency component to clear active recovery sessions
 * Add this temporarily to clear stuck recovery state
 */
const RecoverySessionCleaner: React.FC = () => {
  const {
    getActiveRecoverySession,
    getPendingOvereatingEvent,
    getRecoveryHistory,
    abandonRecoverySession,
    acknowledgeOvereatingEvent,
    getTodaysData,
    cleanupStaleRecoveryEvents,
  } = useCalorieStore();

  const activeSession = getActiveRecoverySession();
  const pendingEvent = getPendingOvereatingEvent();
  const history = getRecoveryHistory();
  const todayData = getTodaysData();

  const handleClearSession = () => {
    if (activeSession) {
      Alert.alert(
        'Clear Recovery Session?',
        `This will abandon your current recovery session: "${activeSession.originalPlan.strategy}"`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear Session',
            style: 'destructive',
            onPress: () => {
              abandonRecoverySession();
              Alert.alert('Cleared!', 'Recovery session has been cleared.');
            },
          },
        ]
      );
    }
  };

  const handleClearEvent = () => {
    if (pendingEvent) {
      Alert.alert(
        'Acknowledge Event?',
        `This will acknowledge the overeating event (${pendingEvent.excessCalories} cal excess)`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Acknowledge',
            onPress: () => {
              acknowledgeOvereatingEvent(pendingEvent.id);
              Alert.alert('Acknowledged!', 'Overeating event has been acknowledged.');
            },
          },
        ]
      );
    }
  };

  const handleForceCleanup = () => {
    const todayData = getTodaysData();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    Alert.alert(
      'Force Cleanup Recovery Events?',
      `Current calories: ${todayData?.consumed || 0}\n` +
      `Target: ${todayData?.target || 0}\n` +
      `This will force cleanup of any stale events.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Force Cleanup',
          onPress: () => {
            cleanupStaleRecoveryEvents(today);
            Alert.alert('Cleanup Done!', 'Forced cleanup of recovery events completed.');
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Recovery State?',
      'This will clear both active sessions and pending events',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            if (activeSession) abandonRecoverySession();
            if (pendingEvent) acknowledgeOvereatingEvent(pendingEvent.id);
            Alert.alert('Cleared!', 'All recovery state has been cleared.');
          },
        },
      ]
    );
  };

  if (!activeSession && !pendingEvent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>✅ Recovery State Clean</Text>
        <Text style={styles.subtitle}>No active sessions or pending events</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Recovery State Cleaner</Text>
      
      <View style={styles.status}>
        <Text style={styles.statusText}>Active Session: {activeSession ? '✅ YES' : '❌ No'}</Text>
        <Text style={styles.statusText}>Pending Event: {pendingEvent ? '✅ YES' : '❌ No'}</Text>
        <Text style={styles.statusText}>History Count: {history.length}</Text>
        <Text style={styles.statusText}>Today Consumed: {todayData?.consumed || 0} cal</Text>
        <Text style={styles.statusText}>Today Target: {todayData?.target || 0} cal</Text>
        <Text style={styles.statusText}>Excess: {(todayData?.consumed || 0) - (todayData?.target || 0)} cal</Text>
      </View>

      <View style={styles.actions}>
        {activeSession && (
          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleClearSession}>
            <Text style={styles.buttonText}>🗑️ Clear Active Session</Text>
          </TouchableOpacity>
        )}

        {pendingEvent && (
          <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={handleClearEvent}>
            <Text style={styles.buttonText}>✅ Acknowledge Event</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={handleForceCleanup}>
          <Text style={styles.buttonText}>🧹 Force Cleanup Events</Text>
        </TouchableOpacity>

        {(activeSession || pendingEvent) && (
          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleClearAll}>
            <Text style={styles.buttonText}>🗑️ Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.help}>
        💡 Use this to clear stuck recovery state that's preventing normal app usage
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3CD',
    margin: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFC107',
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 12,
  },
  status: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  actions: {
    gap: 8,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#DC3545',
  },
  warningButton: {
    backgroundColor: '#FFC107',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  help: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default RecoverySessionCleaner;