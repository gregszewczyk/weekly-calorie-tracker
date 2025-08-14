import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { WorkoutSession } from '../types/CalorieTypes';
import { SportType } from '../types/AthleteTypes';
import { TrainingIntensity } from '../types/GoalTypes';
import { format } from 'date-fns';

interface WorkoutFormData {
  sport: SportType;
  name: string;
  duration: string; // minutes
  intensity: TrainingIntensity;
  caloriesBurned: string;
  distance: string;
  notes: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave?: (workout: WorkoutSession) => void;
}

const TrainingSessionModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const { theme } = useTheme();

  const [formData, setFormData] = useState<WorkoutFormData>({
    sport: 'running',
    name: '',
    duration: '60',
    intensity: 'moderate',
    caloriesBurned: '',
    distance: '',
    notes: '',
  });

  const sportOptions: { value: SportType; label: string; icon: string }[] = [
    { value: 'running', label: 'Running', icon: 'walk-outline' },
    { value: 'cycling', label: 'Cycling', icon: 'bicycle-outline' },
    { value: 'swimming', label: 'Swimming', icon: 'water-outline' },
    { value: 'strength-training', label: 'Strength', icon: 'barbell-outline' },
    { value: 'crossfit', label: 'CrossFit', icon: 'fitness-outline' },
    { value: 'hyrox', label: 'HYROX', icon: 'flame-outline' },
    { value: 'triathlon', label: 'Triathlon', icon: 'medal-outline' },
    { value: 'martial-arts', label: 'Martial Arts', icon: 'hand-left-outline' },
    { value: 'team-sports', label: 'Team Sports', icon: 'football-outline' },
    { value: 'general-fitness', label: 'Fitness', icon: 'heart-outline' },
  ];

  const intensityOptions: { value: TrainingIntensity; label: string; color: string; description: string }[] = [
    { value: 'recovery', label: 'Recovery', color: theme.colors.success, description: 'Light, easy pace' },
    { value: 'easy', label: 'Easy', color: theme.colors.success, description: 'Comfortable effort' },
    { value: 'moderate', label: 'Moderate', color: '#FFD43B', description: 'Steady, sustainable pace' },
    { value: 'hard', label: 'Hard', color: theme.colors.error, description: 'Challenging effort' },
    { value: 'max', label: 'Max', color: theme.colors.error, description: 'All-out maximum effort' },
  ];

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setFormData({
        sport: 'running',
        name: '',
        duration: '60',
        intensity: 'moderate',
        caloriesBurned: '',
        distance: '',
        notes: '',
      });
    }
  }, [visible]);

  const resetForm = () => {
    setFormData({
      sport: 'running',
      name: '',
      duration: '60',
      intensity: 'moderate',
      caloriesBurned: '',
      distance: '',
      notes: '',
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    const caloriesNum = parseInt(formData.caloriesBurned);
    if (!formData.caloriesBurned || isNaN(caloriesNum) || caloriesNum <= 0) {
      Alert.alert('Error', 'Please enter valid calories burned (number greater than 0)');
      return;
    }

    const durationNum = parseInt(formData.duration);
    if (!formData.duration || isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Error', 'Please enter valid duration in minutes');
      return;
    }

    const now = new Date();
    const workout: WorkoutSession = {
      id: Date.now().toString(),
      date: format(now, 'yyyy-MM-dd'),
      timestamp: now,
      sport: formData.sport,
      name: formData.name.trim(),
      duration: durationNum,
      startTime: now,
      endTime: new Date(now.getTime() + durationNum * 60 * 1000),
      intensity: formData.intensity,
      caloriesBurned: caloriesNum,
      distance: formData.distance ? parseFloat(formData.distance) : undefined,
      notes: formData.notes.trim() || undefined,
    };

    onSave?.(workout);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateFormData = (field: keyof WorkoutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedSport = sportOptions.find(sport => sport.value === formData.sport);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>Add Workout</Text>
            <TouchableOpacity onPress={handleSave} style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.saveButtonText, { color: theme.colors.buttonText }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Workout Details Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Workout Details</Text>
              
              {/* Workout Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Workout Name</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.card, 
                    color: theme.colors.text,
                    borderColor: theme.colors.border 
                  }]}
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  placeholder="e.g., Morning Run, Leg Day"
                  placeholderTextColor={theme.colors.textTertiary}
                  autoCapitalize="words"
                />
              </View>

              {/* Duration & Calories Row */}
              <View style={styles.inputRow}>
                <View style={styles.inputRowItem}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Duration (min)</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.card, 
                      color: theme.colors.text,
                      borderColor: theme.colors.border 
                    }]}
                    value={formData.duration}
                    onChangeText={(value) => updateFormData('duration', value)}
                    placeholder="60"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputRowItem}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Calories Burned</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.card, 
                      color: theme.colors.text,
                      borderColor: theme.colors.border 
                    }]}
                    value={formData.caloriesBurned}
                    onChangeText={(value) => updateFormData('caloriesBurned', value)}
                    placeholder="500"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Distance (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Distance (km) - Optional</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.card, 
                    color: theme.colors.text,
                    borderColor: theme.colors.border 
                  }]}
                  value={formData.distance}
                  onChangeText={(value) => updateFormData('distance', value)}
                  placeholder="5.0"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Sport Selection Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Sport Type</Text>
              <View style={styles.sportGrid}>
                {sportOptions.map((sport) => (
                  <TouchableOpacity
                    key={sport.value}
                    style={[
                      styles.sportButton,
                      { 
                        backgroundColor: formData.sport === sport.value ? theme.colors.primary : theme.colors.card,
                        borderColor: formData.sport === sport.value ? theme.colors.primary : theme.colors.border
                      }
                    ]}
                    onPress={() => updateFormData('sport', sport.value)}
                  >
                    <Ionicons 
                      name={sport.icon as any} 
                      size={20} 
                      color={formData.sport === sport.value ? theme.colors.buttonText : theme.colors.text} 
                    />
                    <Text
                      style={[
                        styles.sportText,
                        { color: formData.sport === sport.value ? theme.colors.buttonText : theme.colors.text }
                      ]}
                    >
                      {sport.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Intensity Selection Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Intensity Level</Text>
              <View style={styles.intensityList}>
                {intensityOptions.map((intensity) => (
                  <TouchableOpacity
                    key={intensity.value}
                    style={[
                      styles.intensityButton,
                      { 
                        backgroundColor: formData.intensity === intensity.value ? theme.colors.primary : theme.colors.card,
                        borderColor: formData.intensity === intensity.value ? theme.colors.primary : theme.colors.border
                      }
                    ]}
                    onPress={() => updateFormData('intensity', intensity.value)}
                  >
                    <View style={styles.intensityContent}>
                      <View style={styles.intensityHeader}>
                        <View 
                          style={[
                            styles.intensityDot, 
                            { backgroundColor: intensity.color }
                          ]} 
                        />
                        <Text
                          style={[
                            styles.intensityLabel,
                            { color: formData.intensity === intensity.value ? theme.colors.buttonText : theme.colors.text }
                          ]}
                        >
                          {intensity.label}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.intensityDescription,
                          { color: formData.intensity === intensity.value ? theme.colors.buttonText : theme.colors.textSecondary }
                        ]}
                      >
                        {intensity.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: theme.colors.card, 
                  color: theme.colors.text,
                  borderColor: theme.colors.border 
                }]}
                value={formData.notes}
                onChangeText={(value) => updateFormData('notes', value)}
                placeholder="How did the workout feel? Any observations..."
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },

  // Card Layout
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },

  // Input Styling
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputRowItem: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },

  // Sport Grid
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sportButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  sportText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Intensity List
  intensityList: {
    gap: 8,
  },
  intensityButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  intensityContent: {
    gap: 4,
  },
  intensityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  intensityLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  intensityDescription: {
    fontSize: 12,
    marginLeft: 16,
  },
});

export default TrainingSessionModal;