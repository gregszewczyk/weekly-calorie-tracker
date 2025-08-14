import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { WorkoutSession } from '../types/CalorieTypes';
import { SportType } from '../types/AthleteTypes';
import { TrainingIntensity } from '../types/GoalTypes';

interface WorkoutLoggingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (workout: Omit<WorkoutSession, 'id' | 'timestamp'>) => void;
}

const WorkoutLoggingModal: React.FC<WorkoutLoggingModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [sport, setSport] = useState<SportType>('running');
  const [intensity, setIntensity] = useState<TrainingIntensity>('moderate');
  const [notes, setNotes] = useState('');
  const [skipCalorieCount, setSkipCalorieCount] = useState(false);

  const sportTypes = [
    { key: 'running' as SportType, label: 'Running', icon: '🏃' },
    { key: 'cycling' as SportType, label: 'Cycling', icon: '🚴' },
    { key: 'swimming' as SportType, label: 'Swimming', icon: '🏊' },
    { key: 'strength-training' as SportType, label: 'Strength', icon: '💪' },
    { key: 'general-fitness' as SportType, label: 'Other', icon: '🏃' },
  ] as const;

  const intensityLevels = [
    { key: 'easy' as TrainingIntensity, label: 'Easy', color: '#28A745', description: 'Easy pace' },
    { key: 'moderate' as TrainingIntensity, label: 'Moderate', color: '#FFC107', description: 'Comfortable' },
    { key: 'hard' as TrainingIntensity, label: 'Hard', color: '#FD7E14', description: 'Hard effort' },
    { key: 'max' as TrainingIntensity, label: 'Max', color: '#DC3545', description: 'Max effort' },
  ] as const;

  const resetForm = () => {
    setWorkoutName('');
    setDuration('');
    setCaloriesBurned('');
    setSport('running');
    setIntensity('moderate');
    setNotes('');
    setSkipCalorieCount(false);
  };

  const handleSave = () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    const durationNum = parseInt(duration);
    if (!duration || isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Error', 'Please enter valid duration (minutes)');
      return;
    }

    // Only validate calories if not skipping calorie count
    let caloriesNum = 0;
    if (!skipCalorieCount) {
      caloriesNum = parseInt(caloriesBurned);
      if (!caloriesBurned || isNaN(caloriesNum) || caloriesNum <= 0) {
        Alert.alert('Error', 'Please enter valid calories burned');
        return;
      }
    }

    const workout: Omit<WorkoutSession, 'id' | 'timestamp'> = {
      date: format(new Date(), 'yyyy-MM-dd'),
      name: workoutName.trim(),
      sport,
      duration: durationNum,
      caloriesBurned: caloriesNum, // Will be 0 if skipCalorieCount is true
      intensity,
      notes: notes.trim() || undefined,
    };

    onSave(workout);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Quick workout suggestions
  const workoutSuggestions = [
    { name: '30min Run', sport: 'running', duration: 30, calories: 300 },
    { name: '45min Bike Ride', sport: 'cycling', duration: 45, calories: 400 },
    { name: '60min Strength', sport: 'strength', duration: 60, calories: 250 },
    { name: '30min Swim', sport: 'swimming', duration: 30, calories: 350 },
    { name: '20min HIIT', sport: 'other', duration: 20, calories: 200 },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.title}>Add Workout</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Workout Name */}
            <View style={styles.section}>
              <Text style={styles.label}>Workout Name *</Text>
              <TextInput
                style={styles.input}
                value={workoutName}
                onChangeText={setWorkoutName}
                placeholder="e.g., Morning run"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>

            {/* Sport Type Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Sport Type *</Text>
              <View style={styles.sportContainer}>
                {sportTypes.map((sportType) => (
                  <TouchableOpacity
                    key={sportType.key}
                    style={[
                      styles.sportButton,
                      sport === sportType.key && styles.sportButtonSelected,
                    ]}
                    onPress={() => setSport(sportType.key)}
                  >
                    <Text style={styles.sportIcon}>{sportType.icon}</Text>
                    <Text
                      style={[
                        styles.sportText,
                        sport === sportType.key && styles.sportTextSelected,
                      ]}
                    >
                      {sportType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration and Calories */}
            <View style={styles.rowSection}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Duration (min) *</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="30"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={[styles.label, skipCalorieCount && styles.labelDisabled]}>
                  Calories Burned {!skipCalorieCount && '*'}
                </Text>
                <TextInput
                  style={[styles.input, skipCalorieCount && styles.inputDisabled]}
                  value={caloriesBurned}
                  onChangeText={setCaloriesBurned}
                  placeholder="300"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  editable={!skipCalorieCount}
                />
              </View>
            </View>

            {/* Skip Calorie Counting Option */}
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setSkipCalorieCount(!skipCalorieCount)}
              >
                <View style={[styles.checkbox, skipCalorieCount && styles.checkboxChecked]}>
                  {skipCalorieCount && (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  )}
                </View>
                <View style={styles.checkboxTextContainer}>
                  <Text style={styles.checkboxLabel}>Skip calorie counting</Text>
                  <Text style={styles.checkboxDescription}>
                    This workout was already synced from my device
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Intensity Level */}
            <View style={styles.section}>
              <Text style={styles.label}>Intensity Level</Text>
              <View style={styles.intensityContainer}>
                {intensityLevels.map((level) => (
                  <TouchableOpacity
                    key={level.key}
                    style={[
                      styles.intensityButton,
                      intensity === level.key && styles.intensityButtonSelected,
                      { borderColor: level.color },
                      intensity === level.key && { backgroundColor: level.color },
                    ]}
                    onPress={() => setIntensity(level.key)}
                  >
                    <Text
                      style={[
                        styles.intensityText,
                        intensity === level.key && styles.intensityTextSelected,
                      ]}
                    >
                      {level.label}
                    </Text>
                    <Text
                      style={[
                        styles.intensityDescription,
                        intensity === level.key && styles.intensityDescriptionSelected,
                      ]}
                    >
                      {level.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="How did the workout feel?"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Quick Add Suggestions */}
            <View style={styles.section}>
              <Text style={styles.label}>Quick Add</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {workoutSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionCard}
                    onPress={() => {
                      setWorkoutName(suggestion.name);
                      setSport(suggestion.sport as any);
                      setDuration(suggestion.duration.toString());
                      setCaloriesBurned(suggestion.calories.toString());
                    }}
                  >
                    <Text style={styles.suggestionName}>{suggestion.name}</Text>
                    <Text style={styles.suggestionDetails}>
                      {suggestion.duration}min • {suggestion.calories} cal
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    backgroundColor: '#28A745',
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
  rowSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  halfInput: {
    flex: 0.48,
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
  notesInput: {
    height: 80,
    paddingTop: 12,
  },
  sportContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sportButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    backgroundColor: '#F8F9FA',
  },
  sportButtonSelected: {
    backgroundColor: '#28A745',
    borderColor: '#28A745',
  },
  sportIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  sportText: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  sportTextSelected: {
    color: '#FFFFFF',
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 2,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#F8F9FA',
  },
  intensityButtonSelected: {
    backgroundColor: '#28A745',
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    color: '#212529',
  },
  intensityTextSelected: {
    color: '#FFFFFF',
  },
  intensityDescription: {
    fontSize: 10,
    color: '#6C757D',
  },
  intensityDescriptionSelected: {
    color: '#FFFFFF',
  },
  suggestionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
    textAlign: 'center',
  },
  suggestionDetails: {
    fontSize: 12,
    color: '#28A745',
  },
  // Checkbox styles
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#28A745',
    borderColor: '#28A745',
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 2,
  },
  checkboxDescription: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
  },
  // Disabled input styles
  labelDisabled: {
    color: '#ADB5BD',
  },
  inputDisabled: {
    backgroundColor: '#F8F9FA',
    color: '#ADB5BD',
    borderColor: '#DEE2E6',
  },
});

export default WorkoutLoggingModal;