import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCalorieStore } from '../stores/calorieStore';
import BingeRecoveryModal from './BingeRecoveryModal';
import {
  OvereatingEvent,
  RecoveryPlan,
} from '../types/RecoveryTypes';

interface RecoveryIntegrationProps {
  style?: any;
}

/**
 * Integration component that displays recovery alerts and handles the recovery flow
 * Can be embedded in any screen to provide recovery support
 */
const RecoveryIntegration: React.FC<RecoveryIntegrationProps> = ({ style }) => {
  const {
    getPendingOvereatingEvent,
    getActiveRecoverySession,
    isRecoveryModeEnabled,
    acknowledgeOvereatingEvent,
    createRecoveryPlan,
    selectRecoveryOption,
    startRecoverySession,
  } = useCalorieStore();

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<OvereatingEvent | null>(null);
  const [currentRecoveryPlan, setCurrentRecoveryPlan] = useState<RecoveryPlan | null>(null);

  const pendingEvent = getPendingOvereatingEvent();
  const activeSession = getActiveRecoverySession();
  const recoveryEnabled = isRecoveryModeEnabled();

  useEffect(() => {
    // Auto-show recovery modal when a new overeating event is detected
    if (pendingEvent && !currentEvent) {
      setCurrentEvent(pendingEvent);
      setShowRecoveryModal(true);
      
      // Generate recovery plan with AI suggestions in background
      createRecoveryPlan(pendingEvent.id).then(recoveryPlan => {
        setCurrentRecoveryPlan(recoveryPlan);
      }).catch(error => {
        console.error('Failed to create recovery plan:', error);
        setCurrentRecoveryPlan(null);
      });
    }
  }, [pendingEvent]);

  const handleSelectOption = (optionId: string) => {
    if (!currentRecoveryPlan) return;
    
    selectRecoveryOption(currentRecoveryPlan.id, optionId);
    startRecoverySession(currentRecoveryPlan.id, optionId);
    
    console.log('🎯 Recovery option selected:', optionId);
  };

  const handleAcknowledge = () => {
    if (currentEvent) {
      acknowledgeOvereatingEvent(currentEvent.id);
    }
  };

  const handleDismissModal = () => {
    setShowRecoveryModal(false);
    setCurrentEvent(null);
    setCurrentRecoveryPlan(null);
  };

  if (!recoveryEnabled) {
    return null;
  }

  // Show active recovery session status
  if (activeSession && !pendingEvent) {
    return (
      <View style={[styles.container, styles.activeSession, style]}>
        <View style={styles.iconContainer}>
          <Ionicons name="trending-up" size={20} color="#28A745" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Recovery Plan Active</Text>
          <Text style={styles.subtitle}>
            Day {activeSession.progress.daysCompleted + 1} of {activeSession.progress.daysRemaining + activeSession.progress.daysCompleted}
            • Target: {activeSession.progress.adjustedTarget} cal
          </Text>
        </View>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>View Progress</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show pending overeating event alert
  if (pendingEvent) {
    const severityColor = getSeverityColor(pendingEvent.triggerType);
    const severityIcon = getSeverityIcon(pendingEvent.triggerType);

    return (
      <View style={[styles.container, style]}>
        <TouchableOpacity 
          style={[styles.alertCard, { borderLeftColor: severityColor }]}
          onPress={() => setShowRecoveryModal(true)}
        >
          <View style={[styles.iconContainer, { backgroundColor: severityColor }]}>
            <Ionicons name={severityIcon} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>Recovery Options Available</Text>
            <Text style={styles.subtitle}>
              {pendingEvent.excessCalories} calories over target • {pendingEvent.triggerType} overage
            </Text>
          </View>
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={20} color="#6C757D" />
          </View>
        </TouchableOpacity>

        <BingeRecoveryModal
          visible={showRecoveryModal}
          onClose={handleDismissModal}
          overeatingEvent={currentEvent}
          recoveryPlan={currentRecoveryPlan}
          onSelectOption={handleSelectOption}
          onAcknowledge={handleAcknowledge}
        />
      </View>
    );
  }

  return null;
};

const getSeverityColor = (triggerType: OvereatingEvent['triggerType']): string => {
  switch (triggerType) {
    case 'mild':
      return '#28A745';
    case 'moderate':
      return '#FFC107';
    case 'severe':
      return '#DC3545';
    default:
      return '#6C757D';
  }
};

const getSeverityIcon = (triggerType: OvereatingEvent['triggerType']): any => {
  switch (triggerType) {
    case 'mild':
      return 'information-circle';
    case 'moderate':
      return 'warning';
    case 'severe':
      return 'alert-circle';
    default:
      return 'help-circle';
  }
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 8,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  activeSession: {
    backgroundColor: '#E7F3FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
  },
  chevronContainer: {
    marginLeft: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#28A745',
  },
  actionText: {
    fontSize: 12,
    color: '#28A745',
    fontWeight: '600',
  },
});

export default RecoveryIntegration;