import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCalorieStore } from '../stores/calorieStore';

interface QuickCalorieEntryProps {
  onCaloriesAdded?: (calories: number) => void;
  showRemainingCalories?: boolean;
}

const QuickCalorieEntry: React.FC<QuickCalorieEntryProps> = ({
  onCaloriesAdded,
  showRemainingCalories = true,
}) => {
  const [currentCalories, setCurrentCalories] = useState<string>('');
  const [remainingCalories, setRemainingCalories] = useState<number>(0);
  
  const { 
    logMeal, 
    getTodaysData, 
    getCalorieBankStatus, 
    weeklyData 
  } = useCalorieStore();

  // Update remaining calories when data changes
  useEffect(() => {
    updateRemainingCalories();
  }, [weeklyData]);

  const updateRemainingCalories = () => {
    const bankStatus = getCalorieBankStatus();
    if (bankStatus) {
      setRemainingCalories(bankStatus.remaining);
    }
  };

  const getYesterdaysTotal = (): number => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    const yesterdayData = weeklyData.find(data => data.date === yesterdayString);
    return yesterdayData?.consumed || 0;
  };

  const handleAddCalories = (calories: number) => {
    if (calories <= 0) {
      Alert.alert('Error', 'Please enter a valid calorie amount');
      return;
    }

    if (calories > 10000) {
      Alert.alert('Error', 'Calorie amount seems too high. Please check your entry.');
      return;
    }

    // Create a simplified meal entry
    const mealEntry = {
      name: `Daily Total (${calories} cal)`,
      calories: calories,
      category: 'snack' as const, // Using snack as default category
    };

    try {
      logMeal(mealEntry);
      updateRemainingCalories();
      
      if (onCaloriesAdded) {
        onCaloriesAdded(calories);
      }

      Alert.alert('Success', `${calories} calories logged!`);
      setCurrentCalories('');
    } catch (error) {
      Alert.alert('Error', 'Failed to log calories. Please try again.');
    }
  };

  const handleManualEntry = () => {
    const calories = parseInt(currentCalories);
    handleAddCalories(calories);
  };

  const handleQuickAdd = (amount: number) => {
    const currentAmount = parseInt(currentCalories) || 0;
    const newTotal = currentAmount + amount;
    setCurrentCalories(newTotal.toString());
  };

  const handleUseYesterday = () => {
    const yesterdaysTotal = getYesterdaysTotal();
    if (yesterdaysTotal > 0) {
      setCurrentCalories(yesterdaysTotal.toString());
    } else {
      Alert.alert('Info', 'No calories logged yesterday');
    }
  };

  const formatNumber = (num: number): string => {
    return Math.round(num).toLocaleString();
  };

  const todaysData = getTodaysData();
  const todaysConsumed = todaysData?.consumed || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Calorie Entry</Text>

      {/* Current Day Status */}
      {todaysConsumed > 0 && (
        <View style={styles.statusSection}>
          <Text style={styles.statusLabel}>Today's Total</Text>
          <Text style={styles.statusValue}>{formatNumber(todaysConsumed)} calories</Text>
        </View>
      )}

      {/* Manual Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Total Calories</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.calorieInput}
            value={currentCalories}
            onChangeText={setCurrentCalories}
            placeholder="Enter calories"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <TouchableOpacity 
            style={[styles.logButton, !currentCalories && styles.logButtonDisabled]} 
            onPress={handleManualEntry}
            disabled={!currentCalories}
          >
            <Text style={styles.logButtonText}>Log</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.quickAddSection}>
        <Text style={styles.quickAddLabel}>Quick Add</Text>
        <View style={styles.quickAddRow}>
          <TouchableOpacity 
            style={styles.quickAddButton} 
            onPress={() => handleQuickAdd(200)}
          >
            <Text style={styles.quickAddText}>+200</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAddButton} 
            onPress={() => handleQuickAdd(500)}
          >
            <Text style={styles.quickAddText}>+500</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAddButton} 
            onPress={() => handleQuickAdd(1000)}
          >
            <Text style={styles.quickAddText}>+1000</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Yesterday's Total Button */}
      <TouchableOpacity style={styles.yesterdayButton} onPress={handleUseYesterday}>
        <Text style={styles.yesterdayText}>
          Use Yesterday's Total ({formatNumber(getYesterdaysTotal())} cal)
        </Text>
      </TouchableOpacity>

      {/* Remaining Calories Display */}
      {showRemainingCalories && (
        <View style={styles.remainingSection}>
          <Text style={styles.remainingLabel}>Remaining This Week</Text>
          <Text style={[
            styles.remainingValue,
            { color: remainingCalories >= 0 ? '#51CF66' : '#FF6B6B' }
          ]}>
            {remainingCalories >= 0 ? '+' : ''}{formatNumber(remainingCalories)} calories
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  statusSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#339AF0',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    backgroundColor: '#f9f9f9',
    marginRight: 10,
  },
  logButton: {
    backgroundColor: '#339AF0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  logButtonDisabled: {
    backgroundColor: '#ccc',
  },
  logButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quickAddSection: {
    marginBottom: 20,
  },
  quickAddLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#333',
  },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: '#51CF66',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickAddText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  yesterdayButton: {
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  yesterdayText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  remainingSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  remainingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  remainingValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default QuickCalorieEntry;
