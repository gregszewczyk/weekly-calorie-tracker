import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useCalorieStore } from '../stores/calorieStore';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';

interface SimplifiedCalorieLoggingProps {
  onCaloriesLogged?: (calories: number) => void;
}

const SimplifiedCalorieLogging: React.FC<SimplifiedCalorieLoggingProps> = ({
  onCaloriesLogged,
}) => {
  const { theme } = useTheme();
  const { updateDailyCalories, weeklyData, getTodaysData } = useCalorieStore();
  
  const [calorieInput, setCalorieInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const todaysData = getTodaysData();
  const currentCalories = todaysData?.consumed || 0;
  const targetCalories = todaysData?.target || 2000;
  const remainingCalories = targetCalories - currentCalories;

  // Get previous day's total as suggestion
  const previousDayCalories = useMemo(() => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const yesterdayData = weeklyData.find(day => day.date === yesterday);
    return yesterdayData?.consumed || 0;
  }, [weeklyData]);

  // Quick add suggestions
  const quickAddOptions = useMemo(() => [
    { calories: 150, label: 'Snack' },
    { calories: 300, label: 'Light' },
    { calories: 500, label: 'Medium' },
    { calories: 700, label: 'Large' },
    ...(previousDayCalories > 0 ? [{ calories: previousDayCalories, label: 'Yesterday' }] : []),
  ], [previousDayCalories]);

  const handleQuickAdd = (calories: number) => {
    setCalorieInput(calories.toString());
  };

  const handleLogCalories = async () => {
    const calories = parseInt(calorieInput);
    
    if (!calorieInput || isNaN(calories) || calories <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of calories');
      return;
    }

    if (calories > 5000) {
      Alert.alert('Invalid Input', 'Please enter a realistic number of calories (under 5,000)');
      return;
    }

    setIsLoading(true);

    try {
      updateDailyCalories(calories);
      setCalorieInput('');
      
      if (onCaloriesLogged) {
        onCaloriesLogged(calories);
      }
      
      Alert.alert('Success', `${calories} calories added to today's total`);
    } catch (error) {
      Alert.alert('Error', 'Failed to log calories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Quick Add Buttons */}
      <View style={styles.quickAddSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Quick Add</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickAddScroll}
        >
          {quickAddOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quickAddButton,
                { 
                  backgroundColor: calorieInput === option.calories.toString() 
                    ? theme.colors.primary 
                    : theme.colors.card,
                  borderColor: calorieInput === option.calories.toString() 
                    ? theme.colors.primary 
                    : theme.colors.border
                }
              ]}
              onPress={() => handleQuickAdd(option.calories)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.quickAddCalories, 
                { 
                  color: calorieInput === option.calories.toString() 
                    ? theme.colors.buttonText 
                    : theme.colors.text 
                }
              ]}>
                {option.calories}
              </Text>
              <Text style={[
                styles.quickAddLabel,
                { 
                  color: calorieInput === option.calories.toString() 
                    ? theme.colors.buttonText 
                    : theme.colors.textSecondary 
                }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Manual Input */}
      <View style={styles.inputSection}>
        <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
          <Ionicons name="restaurant" size={20} color={theme.colors.primary} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            value={calorieInput}
            onChangeText={setCalorieInput}
            placeholder="Enter calories..."
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="numeric"
            maxLength={4}
          />
          <Text style={[styles.unit, { color: theme.colors.textSecondary }]}>cal</Text>
        </View>
      </View>

      {/* Log Button */}
      <TouchableOpacity 
        style={[
          styles.logButton, 
          { backgroundColor: calorieInput && !isLoading ? theme.colors.primary : theme.colors.card },
          { borderColor: calorieInput && !isLoading ? theme.colors.primary : theme.colors.border }
        ]} 
        onPress={handleLogCalories}
        disabled={!calorieInput || isLoading}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={isLoading ? "hourglass" : "add-circle"} 
          size={20} 
          color={calorieInput && !isLoading ? theme.colors.buttonText : theme.colors.textSecondary} 
        />
        <Text style={[
          styles.logButtonText,
          { color: calorieInput && !isLoading ? theme.colors.buttonText : theme.colors.textSecondary }
        ]}>
          {isLoading ? 'Adding...' : 'Add Calories'}
        </Text>
      </TouchableOpacity>

      {/* Helper Text */}
      <Text style={[styles.helperText, { color: theme.colors.textTertiary }]}>
        {currentCalories > 0 
          ? 'This will be added to your existing meals'
          : 'Quick way to log approximate calories'
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // Quick Add Section
  quickAddSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickAddScroll: {
    paddingHorizontal: 2,
    gap: 12,
  },
  quickAddButton: {
    minWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  quickAddCalories: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickAddLabel: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Input Section
  inputSection: {
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Log Button
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  logButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Helper Text
  helperText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SimplifiedCalorieLogging;