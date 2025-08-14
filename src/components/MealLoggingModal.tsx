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
import { MealEntry } from '../types/CalorieTypes';
import { useTheme } from '../contexts/ThemeContext';

interface MealLoggingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (meal: Omit<MealEntry, 'id' | 'timestamp'>) => void;
}

const MealLoggingModal: React.FC<MealLoggingModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [category, setCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const mealCategories = [
    { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
    { key: 'lunch', label: 'Lunch', icon: 'partly-sunny-outline' },
    { key: 'dinner', label: 'Dinner', icon: 'moon-outline' },
    { key: 'snack', label: 'Snack', icon: 'nutrition-outline' },
  ] as const;

  const resetForm = () => {
    setMealName('');
    setCalories('');
    setCategory('breakfast');
    setProtein('');
    setCarbs('');
    setFat('');
  };

  const handleSave = () => {
    if (!mealName.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    const caloriesNum = parseInt(calories);
    if (!calories || isNaN(caloriesNum) || caloriesNum <= 0) {
      Alert.alert('Error', 'Please enter valid calories (number greater than 0)');
      return;
    }

    const meal: Omit<MealEntry, 'id' | 'timestamp'> = {
      name: mealName.trim(),
      calories: caloriesNum,
      category,
    };

    // Add macros if provided
    if (protein || carbs || fat) {
      meal.macros = {
        protein: protein ? parseInt(protein) : 0,
        carbohydrates: carbs ? parseInt(carbs) : 0,
        fat: fat ? parseInt(fat) : 0,
      };
    }

    onSave(meal);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
            <Text style={[styles.title, { color: theme.colors.text }]}>Add Meal</Text>
            <TouchableOpacity onPress={handleSave} style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.saveButtonText, { color: theme.colors.buttonText }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Main Info Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Meal Details</Text>
              
              {/* Meal Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Meal Name</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.card, 
                    color: theme.colors.text,
                    borderColor: theme.colors.border 
                  }]}
                  value={mealName}
                  onChangeText={setMealName}
                  placeholder="e.g., Grilled chicken salad"
                  placeholderTextColor={theme.colors.textTertiary}
                  autoCapitalize="words"
                />
              </View>

              {/* Calories */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Calories</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.card, 
                    color: theme.colors.text,
                    borderColor: theme.colors.border 
                  }]}
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="e.g., 450"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Category Selection Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Category</Text>
              <View style={styles.categoryGrid}>
                {mealCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryButton,
                      { 
                        backgroundColor: category === cat.key ? theme.colors.primary : theme.colors.card,
                        borderColor: category === cat.key ? theme.colors.primary : theme.colors.border
                      }
                    ]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Ionicons 
                      name={cat.icon as any} 
                      size={20} 
                      color={category === cat.key ? theme.colors.buttonText : theme.colors.text} 
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        { color: category === cat.key ? theme.colors.buttonText : theme.colors.text }
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Macros Card (Optional) */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Macros (Optional)</Text>
              
              <View style={styles.macrosRow}>
                <View style={styles.macroInput}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Protein (g)</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.card, 
                      color: theme.colors.text,
                      borderColor: theme.colors.border 
                    }]}
                    value={protein}
                    onChangeText={setProtein}
                    placeholder="25"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.macroInput}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Carbs (g)</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.card, 
                      color: theme.colors.text,
                      borderColor: theme.colors.border 
                    }]}
                    value={carbs}
                    onChangeText={setCarbs}
                    placeholder="30"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.macroInput}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Fat (g)</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.card, 
                      color: theme.colors.text,
                      borderColor: theme.colors.border 
                    }]}
                    value={fat}
                    onChangeText={setFat}
                    placeholder="15"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
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

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Macros Row
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroInput: {
    flex: 1,
  },
});

export default MealLoggingModal;