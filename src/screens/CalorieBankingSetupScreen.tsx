import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCalorieStore } from '../stores/calorieStore';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types/NavigationTypes';
import { BankingPlanValidation } from '../types/CalorieTypes';
import { CalorieBankingService } from '../utils/CalorieBankingService';
import { format, parseISO } from 'date-fns';

type CalorieBankingSetupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CalorieBankingSetup'
>;

const CalorieBankingSetupScreen: React.FC = () => {
  const navigation = useNavigation<CalorieBankingSetupScreenNavigationProp>();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { 
    getCurrentWeekProgress, 
    createBankingPlan, 
    validateBankingPlan,
    getBankingPlan,
    isBankingAvailable 
  } = useCalorieStore();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dailyReduction, setDailyReduction] = useState<string>('200');
  const [validation, setValidation] = useState<BankingPlanValidation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    // Set up screen header
    navigation.setOptions({
      title: 'Bank Calories',
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.buttonText,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });

    // Load available dates
    const weekProgress = getCurrentWeekProgress();
    if (weekProgress) {
      const dates = CalorieBankingService.getAvailableTargetDates(
        weekProgress.goal.weekStartDate
      );
      setAvailableDates(dates);
      if (dates.length > 0) {
        setSelectedDate(dates[0]); // Select first available date by default
      }
    }
  }, [navigation, theme, getCurrentWeekProgress]);

  // Validate whenever inputs change
  useEffect(() => {
    if (selectedDate && dailyReduction) {
      const reductionNum = parseInt(dailyReduction, 10);
      if (!isNaN(reductionNum) && reductionNum > 0) {
        const result = validateBankingPlan(selectedDate, reductionNum);
        setValidation(result);
      } else {
        setValidation(null);
      }
    }
  }, [selectedDate, dailyReduction, validateBankingPlan]);

  const formatDateDisplay = (dateStr: string): string => {
    const date = parseISO(dateStr);
    return format(date, 'EEEE, MMM d'); // e.g., "Friday, Dec 15"
  };

  const handleCreateBanking = async () => {
    if (!validation?.isValid || !selectedDate) {
      return;
    }

    const reductionNum = parseInt(dailyReduction, 10);
    setIsCreating(true);

    try {
      const success = await createBankingPlan(selectedDate, reductionNum);
      
      if (success) {
        Alert.alert(
          'Banking Plan Created!',
          `You'll save ${reductionNum} calories per day to bank ${validation.impactPreview.totalBanked} extra calories for ${formatDateDisplay(selectedDate)}.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to create banking plan. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Check if banking is available
  if (!isBankingAvailable()) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.unavailableContainer}>
          <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.unavailableTitle, { color: theme.colors.text }]}>
            Banking Not Available
          </Text>
          <Text style={[styles.unavailableText, { color: theme.colors.textSecondary }]}>
            You need at least 2 remaining days in the week to set up calorie banking.
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.buttonText }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const existingPlan = getBankingPlan();
  const isUpdate = !!existingPlan;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {isUpdate ? 'Update Banking Plan' : 'Bank Calories for Special Day'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Save calories from multiple days to enjoy extra on one special day
          </Text>
        </View>

        {/* Target Date Selection */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Target Date
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Which day do you want extra calories for?
          </Text>
          
          <View style={styles.dateGrid}>
            {availableDates.map((date) => (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateOption,
                  { 
                    backgroundColor: selectedDate === date 
                      ? theme.colors.primary 
                      : theme.colors.surface,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dateText,
                  { 
                    color: selectedDate === date 
                      ? theme.colors.buttonText 
                      : theme.colors.text 
                  }
                ]}>
                  {formatDateDisplay(date)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Daily Reduction Input */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Daily Reduction
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            How many calories to save per day?
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.calorieInput,
                { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                }
              ]}
              value={dailyReduction}
              onChangeText={setDailyReduction}
              keyboardType="numeric"
              placeholder="200"
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={3}
            />
            <Text style={[styles.calorieUnit, { color: theme.colors.textSecondary }]}>
              calories per day
            </Text>
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {[100, 200, 300, 400].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.quickButton,
                  { 
                    backgroundColor: dailyReduction === amount.toString()
                      ? theme.colors.primaryLight
                      : theme.colors.surface,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => setDailyReduction(amount.toString())}
              >
                <Text style={[
                  styles.quickButtonText,
                  { 
                    color: dailyReduction === amount.toString()
                      ? theme.colors.primary
                      : theme.colors.textSecondary 
                  }
                ]}>
                  {amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Impact Preview */}
        {validation && (
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Impact Preview
            </Text>
            
            {/* Target Day Boost */}
            <View style={styles.impactItem}>
              <View style={styles.impactIconContainer}>
                <Ionicons name="trending-up" size={24} color={theme.colors.success} />
              </View>
              <View style={styles.impactContent}>
                <Text style={[styles.impactTitle, { color: theme.colors.text }]}>
                  {formatDateDisplay(selectedDate)}
                </Text>
                <Text style={[styles.impactValue, { color: theme.colors.success }]}>
                  +{validation.impactPreview.targetDateBoost} extra calories
                </Text>
              </View>
            </View>

            {/* Daily Reductions */}
            <View style={styles.impactItem}>
              <View style={styles.impactIconContainer}>
                <Ionicons name="trending-down" size={24} color={theme.colors.warning} />
              </View>
              <View style={styles.impactContent}>
                <Text style={[styles.impactTitle, { color: theme.colors.text }]}>
                  Other days ({validation.impactPreview.daysAffected} days)
                </Text>
                <Text style={[styles.impactValue, { color: theme.colors.warning }]}>
                  -{parseInt(dailyReduction)} calories each
                </Text>
                <Text style={[styles.impactDetail, { color: theme.colors.textSecondary }]}>
                  Minimum daily: {validation.impactPreview.minDailyCalories} calories
                </Text>
              </View>
            </View>

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <View style={[styles.warningsContainer, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="warning-outline" size={20} color={theme.colors.warning} />
                <View style={styles.warningsContent}>
                  {validation.warnings.map((warning, index) => (
                    <Text key={index} style={[styles.warningText, { color: theme.colors.warning }]}>
                      {warning}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Errors */}
            {validation.errors.length > 0 && (
              <View style={[styles.errorsContainer, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="close-circle-outline" size={20} color={theme.colors.error} />
                <View style={styles.errorsContent}>
                  {validation.errors.map((error, index) => (
                    <Text key={index} style={[styles.errorText, { color: theme.colors.error }]}>
                      {error}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: theme.colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.createButton,
            { 
              backgroundColor: validation?.isValid 
                ? theme.colors.primary 
                : theme.colors.textTertiary 
            }
          ]}
          onPress={handleCreateBanking}
          disabled={!validation?.isValid || isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={theme.colors.buttonText} />
          ) : (
            <Text style={[styles.createButtonText, { color: theme.colors.buttonText }]}>
              {isUpdate ? 'Update Banking' : 'Create Banking Plan'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  dateGrid: {
    gap: 12,
  },
  dateOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    width: 100,
    marginRight: 12,
  },
  calorieUnit: {
    fontSize: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  impactIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 2,
  },
  impactContent: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  impactValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  impactDetail: {
    fontSize: 14,
  },
  warningsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningsContent: {
    flex: 1,
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
  },
  errorsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorsContent: {
    flex: 1,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  unavailableTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  unavailableText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CalorieBankingSetupScreen;