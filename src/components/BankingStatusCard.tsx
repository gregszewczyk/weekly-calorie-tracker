import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { useCalorieStore } from '../stores/calorieStore';
import { CalorieBankingPlan } from '../types/CalorieTypes';
import { RootStackParamList } from '../types/NavigationTypes';
import { format, parseISO, isToday, differenceInDays } from 'date-fns';

interface BankingStatusCardProps {
  bankingPlan: CalorieBankingPlan;
  onBankingChanged?: () => void; // Callback when banking is modified/cancelled
}

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const BankingStatusCard: React.FC<BankingStatusCardProps> = ({
  bankingPlan,
  onBankingChanged,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<Navigation>();
  const { cancelBankingPlan } = useCalorieStore();

  const formatDateDisplay = (dateStr: string): string => {
    const date = parseISO(dateStr);
    if (isToday(date)) {
      return 'Today';
    }
    return format(date, 'EEEE, MMM d'); // e.g., "Friday, Dec 15"
  };

  const getDaysUntilTarget = (): number => {
    const today = new Date();
    const targetDate = parseISO(bankingPlan.targetDate);
    return Math.max(0, differenceInDays(targetDate, today));
  };

  const handleEditBanking = () => {
    navigation.navigate('CalorieBankingSetup');
  };

  const handleCancelBanking = () => {
    Alert.alert(
      'Cancel Banking Plan?',
      'This will remove your banking plan and redistribute calories evenly across remaining days.',
      [
        {
          text: 'Keep Banking',
          style: 'cancel',
        },
        {
          text: 'Cancel Banking',
          style: 'destructive',
          onPress: () => {
            cancelBankingPlan();
            onBankingChanged?.();
          },
        },
      ]
    );
  };

  const daysUntil = getDaysUntilTarget();
  const isTargetToday = daysUntil === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="wallet-outline" size={20} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Banking Active
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Saving for {formatDateDisplay(bankingPlan.targetDate)}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleEditBanking}
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleCancelBanking}
          >
            <Ionicons name="close-outline" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Banking Details */}
      <View style={styles.detailsContainer}>
        {/* Target Day Info */}
        <View style={styles.targetInfo}>
          <View style={styles.targetLeft}>
            <Text style={[styles.targetDate, { color: theme.colors.text }]}>
              {formatDateDisplay(bankingPlan.targetDate)}
            </Text>
            {isTargetToday ? (
              <Text style={[styles.targetStatus, { color: theme.colors.success }]}>
                🎉 Enjoy your extra calories today!
              </Text>
            ) : (
              <Text style={[styles.targetStatus, { color: theme.colors.textSecondary }]}>
                {daysUntil} {daysUntil === 1 ? 'day' : 'days'} away
              </Text>
            )}
          </View>
          <View style={styles.targetRight}>
            <Text style={[styles.extraCalories, { color: theme.colors.success }]}>
              +{bankingPlan.totalBanked}
            </Text>
            <Text style={[styles.caloriesLabel, { color: theme.colors.textSecondary }]}>
              extra calories
            </Text>
          </View>
        </View>

        {/* Daily Reduction Info */}
        {!isTargetToday && bankingPlan.remainingDaysCount > 0 && (
          <View style={[styles.reductionInfo, { borderTopColor: theme.colors.border }]}>
            <View style={styles.reductionLeft}>
              <Text style={[styles.reductionText, { color: theme.colors.text }]}>
                Daily reduction for remaining days
              </Text>
              <Text style={[styles.daysAffected, { color: theme.colors.textSecondary }]}>
                {bankingPlan.remainingDaysCount} {bankingPlan.remainingDaysCount === 1 ? 'day' : 'days'} affected
              </Text>
            </View>
            <View style={styles.reductionRight}>
              <Text style={[styles.reductionAmount, { color: theme.colors.warning }]}>
                -{bankingPlan.dailyReduction}
              </Text>
              <Text style={[styles.caloriesLabel, { color: theme.colors.textSecondary }]}>
                per day
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Progress Indicator */}
      {!isTargetToday && (
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
              Banking Progress
            </Text>
            <Text style={[styles.progressDetail, { color: theme.colors.textSecondary }]}>
              {bankingPlan.remainingDaysCount > 0 
                ? `${bankingPlan.totalBanked - (bankingPlan.remainingDaysCount * bankingPlan.dailyReduction)} calories saved so far`
                : `All ${bankingPlan.totalBanked} calories saved!`
              }
            </Text>
          </View>
          
          <View style={[styles.progressBar, { backgroundColor: theme.colors.surface }]}>
            <View
              style={[
                styles.progressFill,
                { 
                  backgroundColor: theme.colors.primary,
                  width: bankingPlan.remainingDaysCount === 0 ? '100%' : '60%' // Simplified progress
                }
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    gap: 16,
  },
  targetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetLeft: {
    flex: 1,
  },
  targetDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  targetStatus: {
    fontSize: 14,
  },
  targetRight: {
    alignItems: 'flex-end',
  },
  extraCalories: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  caloriesLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  reductionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  reductionLeft: {
    flex: 1,
  },
  reductionText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  daysAffected: {
    fontSize: 12,
  },
  reductionRight: {
    alignItems: 'flex-end',
  },
  reductionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  progressInfo: {
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  progressDetail: {
    fontSize: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default BankingStatusCard;