import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCalorieStore } from '../stores/calorieStore';

interface GoalTargetModalProps {
  visible: boolean;
  onClose: () => void;
}

const GoalTargetModal: React.FC<GoalTargetModalProps> = ({
  visible,
  onClose,
}) => {
  const [targetWeight, setTargetWeight] = useState('');
  const [targetBodyFat, setTargetBodyFat] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  
  const { 
    goalConfiguration, 
    updateTargetWeight, 
    weightEntries,
    getGoalProgress,
    calculateTimeToGoal
  } = useCalorieStore();

  const currentWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : 0;
  const goalProgress = getGoalProgress();

  useEffect(() => {
    if (goalConfiguration?.targetGoals?.weight) {
      setTargetWeight(goalConfiguration.targetGoals.weight.target.toString());
    }
    if (goalConfiguration?.targetDate) {
      setTargetDate(goalConfiguration.targetDate);
    }
  }, [goalConfiguration]);

  const handleSave = () => {
    const targetWeightNum = parseFloat(targetWeight);
    
    if (!targetWeight || isNaN(targetWeightNum) || targetWeightNum <= 0) {
      Alert.alert('Error', 'Please enter a valid target weight');
      return;
    }

    if (Math.abs(targetWeightNum - currentWeight) < 0.1) {
      Alert.alert('Info', 'Target weight is very close to current weight. Consider setting a more specific goal.');
      return;
    }

    // Calculate estimated time to goal
    const estimatedWeeks = calculateTimeToGoal(targetWeightNum);
    const weightDifference = targetWeightNum - currentWeight;
    const isWeightLoss = weightDifference < 0;
    
    // Show confirmation with timeline
    const confirmationMessage = `
Target: ${targetWeight}kg (${Math.abs(weightDifference).toFixed(1)}kg ${isWeightLoss ? 'loss' : 'gain'})
${estimatedWeeks ? `Estimated time: ${estimatedWeeks} weeks` : 'Timeline: Based on your progress'}

This will update your calorie recommendations accordingly.`;

    Alert.alert(
      'Confirm Goal',
      confirmationMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save Goal',
          onPress: () => {
            updateTargetWeight(targetWeightNum);
            onClose();
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setTargetWeight('');
    setTargetBodyFat('');
    setTargetDate('');
    setGoalDescription('');
  };

  const handleClose = () => {
    onClose();
  };

  const getWeightChangeDescription = () => {
    if (!targetWeight || isNaN(parseFloat(targetWeight))) return '';
    
    const diff = parseFloat(targetWeight) - currentWeight;
    if (Math.abs(diff) < 0.1) return 'Maintain current weight';
    
    return diff > 0 
      ? `Gain ${diff.toFixed(1)}kg` 
      : `Lose ${Math.abs(diff).toFixed(1)}kg`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Goal Targets</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Current Weight</Text>
                <Text style={styles.statusValue}>{currentWeight.toFixed(1)}kg</Text>
              </View>
              {goalProgress?.weight && (
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Progress</Text>
                  <Text style={[
                    styles.statusValue,
                    { color: goalProgress.weight.onTrack ? '#28A745' : '#FD7E14' }
                  ]}>
                    {goalProgress.weight.percentComplete.toFixed(0)}% complete
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Target Weight */}
          <View style={styles.section}>
            <Text style={styles.label}>Target Weight *</Text>
            <TextInput
              style={styles.input}
              value={targetWeight}
              onChangeText={setTargetWeight}
              placeholder={`e.g., ${(currentWeight - 5).toFixed(0)}`}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
            {targetWeight && (
              <Text style={styles.changeDescription}>
                {getWeightChangeDescription()}
              </Text>
            )}
          </View>

          {/* Target Body Fat (Optional) */}
          <View style={styles.section}>
            <Text style={styles.label}>Target Body Fat % (Optional)</Text>
            <TextInput
              style={styles.input}
              value={targetBodyFat}
              onChangeText={setTargetBodyFat}
              placeholder="e.g., 15"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
            <Text style={styles.helper}>
              This helps optimize your nutrition for body composition
            </Text>
          </View>

          {/* Target Date (Optional) */}
          <View style={styles.section}>
            <Text style={styles.label}>Target Date (Optional)</Text>
            <TextInput
              style={styles.input}
              value={targetDate}
              onChangeText={setTargetDate}
              placeholder="YYYY-MM-DD (e.g., 2024-06-01)"
              placeholderTextColor="#999"
            />
            <Text style={styles.helper}>
              Leave blank for flexible timeline based on healthy progress
            </Text>
          </View>

          {/* Goal Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Why This Goal? (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={goalDescription}
              onChangeText={setGoalDescription}
              placeholder="e.g., Feel more confident, improve athletic performance, health reasons..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Recommendations */}
          {targetWeight && currentWeight && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              <View style={styles.recommendationCard}>
                <Text style={styles.recommendationText}>
                  {parseFloat(targetWeight) < currentWeight 
                    ? '🎯 Focus on a moderate calorie deficit with adequate protein to preserve muscle mass'
                    : parseFloat(targetWeight) > currentWeight
                    ? '🎯 Aim for a controlled calorie surplus with strength training to build lean mass'
                    : '🎯 Focus on body recomposition with balanced nutrition and resistance training'
                  }
                </Text>
                {calculateTimeToGoal(parseFloat(targetWeight)) && (
                  <Text style={styles.timelineText}>
                    📅 Estimated timeline: {calculateTimeToGoal(parseFloat(targetWeight))} weeks
                  </Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  closeButton: {
    padding: 8,
    width: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#339AF0',
    borderRadius: 6,
    width: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  helper: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  changeDescription: {
    fontSize: 14,
    color: '#339AF0',
    fontWeight: '600',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  recommendationCard: {
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#B8DAFF',
  },
  recommendationText: {
    fontSize: 14,
    color: '#004085',
    lineHeight: 20,
    marginBottom: 8,
  },
  timelineText: {
    fontSize: 13,
    color: '#004085',
    fontWeight: '500',
  },
});

export default GoalTargetModal;