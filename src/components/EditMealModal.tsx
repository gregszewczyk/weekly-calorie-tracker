import React, { useState, useEffect } from 'react';
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
import { MealEntry } from '../types/CalorieTypes';
import { format, parseISO } from 'date-fns';
import { useThemedStyles, useTheme } from '../contexts/ThemeContext';

interface EditMealModalProps {
  visible: boolean;
  meal: MealEntry | null;
  onClose: () => void;
  onSave: (mealId: string, updatedMeal: Partial<MealEntry>) => void;
}

const EditMealModal: React.FC<EditMealModalProps> = ({
  visible,
  meal,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [category, setCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout'>('breakfast');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [notes, setNotes] = useState('');

  // Helper function to safely format timestamps
  const formatTimestamp = (timestamp: Date | string) => {
    try {
      const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
      return format(date, 'MMM d, HH:mm');
    } catch (error) {
      console.warn('Invalid timestamp format:', timestamp);
      return 'Invalid time';
    }
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      },
      headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        flex: 1,
        textAlign: 'center',
      },
      headerButton: {
        padding: 8,
        minWidth: 60,
        alignItems: 'center',
      },
      headerButtonText: {
        fontSize: 16,
        fontWeight: '600',
      },
      closeButtonText: {
        color: theme.colors.textSecondary,
      },
      saveButtonText: {
        color: theme.colors.primary,
      },
      content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
      },
      section: {
        marginBottom: 24,
      },
      label: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
      },
      input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
      },
      textArea: {
        height: 80,
        textAlignVertical: 'top',
      },
      categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
      },
      categoryButton: {
        minWidth: '30%',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      },
      categoryButtonSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      categoryIcon: {
        fontSize: 16,
        marginBottom: 4,
      },
      categoryText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '500',
        textAlign: 'center',
      },
      categoryTextSelected: {
        color: theme.colors.buttonText,
      },
      macroContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
      },
      macroInput: {
        flex: 1,
      },
      macroLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 4,
        textAlign: 'center',
      },
      macroField: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        backgroundColor: theme.colors.surface,
        textAlign: 'center',
        color: theme.colors.text,
      },
      mealInfo: {
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      },
      mealInfoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
      },
      mealInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
      },
      mealInfoLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
      },
      mealInfoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text,
      },
      deleteSection: {
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      deleteButton: {
        backgroundColor: theme.colors.error,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
      },
      deleteButtonText: {
        color: theme.colors.buttonText,
        fontSize: 16,
        fontWeight: '600',
      },
    })
  );

  const mealCategories = [
    { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { key: 'lunch', label: 'Lunch', icon: '☀️' },
    { key: 'dinner', label: 'Dinner', icon: '🌙' },
    { key: 'snack', label: 'Snack', icon: '🍎' },
    { key: 'pre-workout', label: 'Pre-Workout', icon: '🏃‍♂️' },
    { key: 'post-workout', label: 'Post-Workout', icon: '💪' },
  ] as const;

  // Populate form when meal changes
  useEffect(() => {
    if (meal) {
      setMealName(meal.name);
      setCalories(meal.calories.toString());
      setCategory(meal.category || 'breakfast');
      setProtein(meal.macros?.protein?.toString() || '');
      setCarbs(meal.macros?.carbohydrates?.toString() || '');
      setFat(meal.macros?.fat?.toString() || '');
      setNotes(meal.notes || '');
    }
  }, [meal]);

  const resetForm = () => {
    setMealName('');
    setCalories('');
    setCategory('breakfast');
    setProtein('');
    setCarbs('');
    setFat('');
    setNotes('');
  };

  const handleSave = () => {
    if (!meal) return;

    if (!mealName.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    const caloriesNum = parseInt(calories);
    if (!calories || isNaN(caloriesNum) || caloriesNum <= 0) {
      Alert.alert('Error', 'Please enter valid calories (number greater than 0)');
      return;
    }

    const updatedMeal: Partial<MealEntry> = {
      name: mealName.trim(),
      calories: caloriesNum,
      category,
      notes: notes.trim() || undefined,
    };

    // Add macros if provided
    if (protein || carbs || fat) {
      updatedMeal.macros = {
        protein: protein ? parseInt(protein) || 0 : 0,
        carbohydrates: carbs ? parseInt(carbs) || 0 : 0,
        fat: fat ? parseInt(fat) || 0 : 0,
      };
    }

    onSave(meal.id, updatedMeal);
    handleClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDelete = () => {
    if (!meal) return;
    
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${meal.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // The parent component should handle deletion through onDeleteMeal prop
            // For now, we'll close the modal and the parent can handle the deletion
            handleClose();
          },
        },
      ]
    );
  };

  if (!meal) return null;

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
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, styles.closeButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Meal</Text>
            <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, styles.saveButtonText]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Meal Info */}
            <View style={styles.mealInfo}>
              <Text style={styles.mealInfoTitle}>Original Meal Details</Text>
              <View style={styles.mealInfoRow}>
                <Text style={styles.mealInfoLabel}>Logged at:</Text>
                <Text style={styles.mealInfoValue}>
                  {formatTimestamp(meal.timestamp)}
                </Text>
              </View>
              <View style={styles.mealInfoRow}>
                <Text style={styles.mealInfoLabel}>Category:</Text>
                <Text style={styles.mealInfoValue}>
                  {meal.category ? meal.category.charAt(0).toUpperCase() + meal.category.slice(1) : 'Other'}
                </Text>
              </View>
              <View style={styles.mealInfoRow}>
                <Text style={styles.mealInfoLabel}>Original calories:</Text>
                <Text style={styles.mealInfoValue}>{meal.calories} cal</Text>
              </View>
            </View>

            {/* Meal Name */}
            <View style={styles.section}>
              <Text style={styles.label}>Meal Name *</Text>
              <TextInput
                style={styles.input}
                value={mealName}
                onChangeText={setMealName}
                placeholder="e.g., Grilled chicken salad"
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="words"
              />
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryContainer}>
                {mealCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryButton,
                      category === cat.key && styles.categoryButtonSelected,
                    ]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat.key && styles.categoryTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Calories */}
            <View style={styles.section}>
              <Text style={styles.label}>Calories *</Text>
              <TextInput
                style={styles.input}
                value={calories}
                onChangeText={setCalories}
                placeholder="e.g., 350"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
              />
            </View>

            {/* Macros */}
            <View style={styles.section}>
              <Text style={styles.label}>Macronutrients (Optional)</Text>
              <View style={styles.macroContainer}>
                <View style={styles.macroInput}>
                  <Text style={styles.macroLabel}>Protein (g)</Text>
                  <TextInput
                    style={styles.macroField}
                    value={protein}
                    onChangeText={setProtein}
                    placeholder="25"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.macroInput}>
                  <Text style={styles.macroLabel}>Carbs (g)</Text>
                  <TextInput
                    style={styles.macroField}
                    value={carbs}
                    onChangeText={setCarbs}
                    placeholder="30"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.macroInput}>
                  <Text style={styles.macroLabel}>Fat (g)</Text>
                  <TextInput
                    style={styles.macroField}
                    value={fat}
                    onChangeText={setFat}
                    placeholder="15"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any additional details about this meal..."
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                autoCapitalize="sentences"
              />
            </View>

            {/* Delete Section */}
            <View style={styles.deleteSection}>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Delete Meal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default EditMealModal;