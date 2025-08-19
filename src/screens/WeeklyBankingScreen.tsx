import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, startOfWeek } from 'date-fns';
import { useCalorieStore } from '../stores/calorieStore';
import { CalorieBankStatus } from '../types/CalorieTypes';
import { RootStackParamList } from '../types/NavigationTypes';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import HealthDeviceStatus from '../components/HealthDeviceStatus';
import BankingStatusCard from '../components/BankingStatusCard';
import WeeklyCalendarView from '../components/WeeklyCalendarView';
import { UniversalActivity } from '../types/HealthDeviceTypes';
import { DailyActivitySync } from '../services/DailyActivitySync';
import { healthDeviceManager } from '../services/HealthDeviceManager';

type WeeklyBankingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WeeklyBanking'>;

const { width } = Dimensions.get('window');

const WeeklyBankingScreen: React.FC = () => {
  const navigation = useNavigation<WeeklyBankingScreenNavigationProp>();
  const { 
    getCalorieBankStatus, 
    getCurrentWeekProgress, 
    getGoalMode, 
    getCurrentWeekNumber,
    resetGoal,
    resetCompletely,
    getTodaysData,
    getBankingPlan,
    isBankingAvailable,
    forceWeeklyReset,
    weeklyData // Subscribe to weeklyData changes to trigger re-render
  } = useCalorieStore();
  const { theme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bankStatus, setBankStatus] = useState<CalorieBankStatus | null>(null);
  const [recentActivities, setRecentActivities] = useState<UniversalActivity[]>([]);
  const [showUsedBreakdown, setShowUsedBreakdown] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const healthDeviceRef = useRef<{ forceRefresh: () => Promise<void> }>(null);

  // Hide the navigation header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    updateBankStatus();
  }, []);


  // Remove automatic updates on weeklyData changes to prevent infinite loops
  // updateBankStatus will be called manually when needed

  // Refresh data when screen comes into focus (e.g., navigating back from another screen)
  useFocusEffect(
    React.useCallback(() => {
      updateBankStatus();
    }, [])
  );

  // Listen for health device connection changes and auto-refresh
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let hasDetectedConnection = false;

    const checkConnectionChanges = () => {
      if (hasDetectedConnection) return; // Only refresh once
      
      // Periodically check if connections have been established after app startup
      const connections = healthDeviceManager.getConnections();
      const hasConnections = connections.some((conn: any) => conn.status === 'connected');
      
      if (hasConnections) {
        console.log('🔄 [WeeklyBanking] Auto-detected connection - refreshing health device status...');
        hasDetectedConnection = true;
        
        healthDeviceRef.current?.forceRefresh().catch((error: any) => {
          console.log('⚠️ [WeeklyBanking] Auto-refresh failed:', error.message);
        });
      } else {
        console.log('🔍 [WeeklyBanking] Checking for connections... none found yet');
      }
    };

    // Multiple check intervals to catch auto-login at different timing
    const checkIntervals = [1000, 3000, 5000, 8000, 12000]; // 1s, 3s, 5s, 8s, 12s
    
    checkIntervals.forEach((delay) => {
      const timer = setTimeout(checkConnectionChanges, delay);
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Refresh health device data when screen comes into focus (e.g., returning from device setup)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [WeeklyBanking] Screen focused, checking for health device updates...');
      // Force refresh health device status when returning to this screen
      // Use a small delay to ensure any navigation state changes are complete
      setTimeout(() => {
        healthDeviceRef.current?.forceRefresh();
      }, 50);
    }, [])
  );

  const updateBankStatus = React.useCallback(() => {
    const status = getCalorieBankStatus();
    setBankStatus(status);
  }, [getCalorieBankStatus]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    updateBankStatus();
    
    // Also refresh health device status and activities
    try {
      await healthDeviceRef.current?.forceRefresh();
      
      // Sync today's active calories for real-time tracking
      console.log('🔄 [WeeklyBanking] Manual sync of today\'s active calories...');
      const todaysSyncSuccess = await DailyActivitySync.refreshTodaysActiveCalories();
      console.log('📊 [WeeklyBanking] Today\'s sync success:', todaysSyncSuccess);
      
      // Update bank status again after activity sync
      updateBankStatus();
    } catch (error) {
      console.error('❌ [WeeklyBanking] Failed to refresh health device data:', error);
    }
    
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleGoalSettings = () => {
    Alert.alert(
      'Update Your Goal',
      'How would you like to proceed?',
      [
        {
          text: 'Recalculate with AI',
          onPress: () => {
            Alert.alert(
              'Recalculate Goal',
              'Get a fresh AI analysis with your current progress and any profile changes. Your existing data this week will be intelligently preserved.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Recalculate',
                  onPress: () => {
                    // Keep existing data, go through goal creation flow
                    navigation.navigate('GoalSetup');
                  }
                }
              ]
            );
          }
        },
        {
          text: 'Reset Completely',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Reset Goal',
              'Start completely fresh. This will clear all your current progress and weekly data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    resetCompletely();
                    navigation.navigate('GoalSetup');
                  }
                }
              ]
            );
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const getProgressPercentage = (): number => {
    if (!bankStatus) return 0;
    // Treat negative totalUsed (net negative calories) the same as 0 for progress bar display
    const positiveUsed = Math.max(0, bankStatus.totalUsed);
    return Math.min((positiveUsed / bankStatus.weeklyAllowance) * 100, 100);
  };

  const getStatusColor = (): string => {
    if (!bankStatus) return '#339AF0';
    
    // If net calories are negative, show neutral color (same as 0 progress)
    if (bankStatus.totalUsed <= 0) {
      return '#DEE2E6'; // Light grey - neutral/empty state
    }
    
    switch (bankStatus.projectedOutcome) {
      case 'on-track': return '#51CF66';
      case 'over-budget': return '#FF6B6B';
      case 'under-budget': return '#FFD43B';
      default: return '#339AF0';
    }
  };

  const getStatusIcon = (): string => {
    if (!bankStatus) return '📊';
    
    switch (bankStatus.projectedOutcome) {
      case 'on-track': return '✅';
      case 'over-budget': return '🚨';
      case 'under-budget': return '⚠️';
      default: return '📊';
    }
  };

  const getStatusText = (): string => {
    if (!bankStatus) return 'No Data';
    
    switch (bankStatus.projectedOutcome) {
      case 'on-track': return 'ON TRACK';
      case 'over-budget': return 'OVER BUDGET';
      case 'under-budget': return 'UNDER BUDGET';
      default: return 'CALCULATING...';
    }
  };

  const formatNumber = (num: number): string => {
    return Math.round(num).toLocaleString();
  };

  const formatPercentage = (num: number): string => {
    return `${Math.round(num)}%`;
  };

  const handleRecentActivities = (activities: UniversalActivity[]) => {
    setRecentActivities(activities);
    console.log('📊 [WeeklyBanking] Received recent activities:', activities.length);
    
    if (activities.length > 0) {
      calculateActivityBasedCalorieAdjustment(activities);
    }
  };

  const calculateActivityBasedCalorieAdjustment = (activities: UniversalActivity[]) => {
    // Calculate total calories burned in last 14 days
    const totalCaloriesBurned = activities.reduce((total, activity) => total + (activity.calories || 0), 0);
    const averageDailyCalories = totalCaloriesBurned / 14;
    
    // Group activities by day to see patterns
    const activitiesByDay = activities.reduce((groups, activity) => {
      const dayKey = activity.startTime.toDateString();
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(activity);
      return groups;
    }, {} as Record<string, UniversalActivity[]>);
    
    const activeDays = Object.keys(activitiesByDay).length;
    const restDays = 14 - activeDays;
    
    console.log('🔥 [CalorieAdjustment] Analysis of last 14 days:');
    console.log(`   Total calories burned: ${totalCaloriesBurned.toLocaleString()}`);
    console.log(`   Average daily burn: ${Math.round(averageDailyCalories)} calories`);
    console.log(`   Active days: ${activeDays}/14`);
    console.log(`   Rest days: ${restDays}/14`);
    console.log(`   Activity frequency: ${Math.round((activeDays/14) * 100)}%`);
    
    // Extract activity types and intensities for AI context
    const activityTypes = activities.map(a => a.activityType).filter(Boolean);
    const highIntensityActivities = activities.filter(a => (a.calories || 0) > 400);
    const mediumIntensityActivities = activities.filter(a => (a.calories || 0) > 200 && (a.calories || 0) <= 400);
    const lowIntensityActivities = activities.filter(a => (a.calories || 0) > 0 && (a.calories || 0) <= 200);
    
    console.log('🏃 [ActivityIntensity] Breakdown:');
    console.log(`   High intensity (>400 cal): ${highIntensityActivities.length} activities`);
    console.log(`   Medium intensity (200-400 cal): ${mediumIntensityActivities.length} activities`);
    console.log(`   Low intensity (<200 cal): ${lowIntensityActivities.length} activities`);
    console.log(`   Activity types: ${[...new Set(activityTypes)].join(', ')}`);
    
    // This data will be used by AI for personalized calorie recommendations
    const activityContext = {
      period: '14 days',
      totalCaloriesBurned,
      averageDailyCalories: Math.round(averageDailyCalories),
      activeDays,
      restDays,
      activityFrequency: Math.round((activeDays/14) * 100),
      intensityBreakdown: {
        high: highIntensityActivities.length,
        medium: mediumIntensityActivities.length,
        low: lowIntensityActivities.length
      },
      activityTypes: [...new Set(activityTypes)],
      mostActiveDay: Object.entries(activitiesByDay)
        .sort(([,a], [,b]) => b.length - a.length)[0]?.[0],
      recentActivities: activities.slice(0, 5) // Last 5 activities for context
    };
    
    console.log('🤖 [AI Context] Activity context prepared for AI calorie calculations');
    
    // TODO: Send this context to AI service for personalized calorie recommendations
    // This will integrate with PerplexityService for enhanced recommendations
  };

  const goalMode = getGoalMode();
  const progressPercentage = getProgressPercentage();
  const statusColor = getStatusColor();
  const todaysData = getTodaysData();
  const todayConsumed = todaysData?.consumed || 0;

  if (!bankStatus) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={64} color={theme.colors.textSecondary} style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>No Banking Data</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Set up your goal to start tracking</Text>
          
          <TouchableOpacity
            style={[styles.setupButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              console.log('🔄 [WeeklyBanking] User requested to restart goal setup');
              // Clear any existing goal configuration to restart fresh
              resetGoal();
              // Navigate to goal setup screen
              navigation.navigate('GoalSetup');
            }}
          >
            <Ionicons name="settings-outline" size={20} color={theme.colors.buttonText} />
            <Text style={[styles.setupButtonText, { color: theme.colors.buttonText }]}>
              Set Up Goal
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Title and Actions */}
        <View style={styles.headerWithTitle}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Weekly Calorie Bank</Text>
          <View style={styles.headerActions}>
            <ThemeToggle size="small" showLabel={false} />
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleGoalSettings}
              accessibilityLabel="Goal Settings"
            >
              <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>


        {/* Weekly Calendar View */}
        <WeeklyCalendarView
          weeklyData={weeklyData}
          weekStartDate={format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')}
          onDayPress={(date, dayData) => {
            // Optional: Navigate to daily detail or show day summary
            console.log('Day pressed:', date, dayData);
          }}
          showLocked={true}
        />

        {/* Hero Progress Section */}
        <View style={[styles.heroSection, { backgroundColor: theme.colors.surface }]}>
          {/* Phase Header */}
          <View style={styles.phaseHeader}>
            <Text style={[styles.phaseTitle, { color: theme.colors.text }]}>
              Week {getCurrentWeekNumber()} • {goalMode === 'cut' ? 'Cutting' : goalMode === 'bulk' ? 'Bulking' : 'Maintenance'} Phase
            </Text>
            <Text style={[styles.phaseSubtitle, { color: theme.colors.textSecondary }]}>
              {getStatusText()}
            </Text>
          </View>

          {/* Progress Bar with Gradient */}
          <View style={styles.heroProgressContainer}>
            <View style={[styles.heroProgressBar, { backgroundColor: theme.colors.card }]}>
              <View
                style={[
                  styles.heroProgressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: statusColor,
                  },
                ]}
              />
            </View>
            <View style={styles.heroProgressLabels}>
              <Text style={[styles.heroProgressText, { color: theme.colors.text }]}>
                {formatNumber(bankStatus.totalUsed)} / {formatNumber(bankStatus.weeklyAllowance)} used
              </Text>
              <View style={styles.heroIconsContainer}>
                <TouchableOpacity 
                  style={styles.infoIconHero}
                  onPress={() => setShowUsedBreakdown(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.infoIconHero, { marginLeft: 8 }]}
                  onPress={() => {
                    Alert.alert(
                      'Reset Weekly Allowance',
                      'This will reset your weekly allowance and apply any carryover from last week. Continue?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Reset', 
                          style: 'destructive',
                          onPress: () => forceWeeklyReset()
                        }
                      ]
                    );
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="refresh-circle-outline" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Status Message */}
          <Text style={[styles.statusMessage, { color: theme.colors.textSecondary }]}>
            {bankStatus.remaining >= 0 
              ? `Strong pacing - ${formatNumber(bankStatus.remaining)} calories remaining`
              : `Over budget by ${formatNumber(Math.abs(bankStatus.remaining))} calories`
            }
          </Text>
        </View>

        {/* Today vs Future Section */}
        <View style={[styles.comparisonSection, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.comparisonGrid}>
            {/* Today */}
            <View style={[styles.comparisonCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.comparisonLabel, { color: theme.colors.textSecondary }]}>TODAY</Text>
              <Text style={[styles.comparisonValue, { color: theme.colors.primary }]}>
                {formatNumber(bankStatus.todayTarget)}
              </Text>
              <Text style={[styles.comparisonSubtext, { color: theme.colors.textSecondary }]}>
                Locked target
              </Text>
              <View style={styles.comparisonDetails}>
                <Text style={[styles.comparisonDetail, { color: theme.colors.text }]}>
                  {formatNumber(todayConsumed)} consumed
                </Text>
                <Text style={[styles.comparisonDetail, { 
                  color: (bankStatus.todayTarget - todayConsumed) >= 0 ? theme.colors.success : theme.colors.error 
                }]}>
                  {formatNumber(bankStatus.todayTarget - todayConsumed)} remaining
                </Text>
              </View>
            </View>

            {/* Future Days */}
            {bankStatus.daysLeftExcludingToday > 0 ? (
              <View style={[styles.comparisonCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.comparisonLabel, { color: theme.colors.textSecondary }]}>
                  NEXT {bankStatus.daysLeftExcludingToday} DAYS
                </Text>
                <Text style={[styles.comparisonValue, { color: theme.colors.primary }]}>
                  {formatNumber(bankStatus.dailyAverage)}
                </Text>
                <Text style={[styles.comparisonSubtext, { color: theme.colors.textSecondary }]}>
                  Average per day
                </Text>
                <View style={styles.comparisonDetails}>
                  <Text style={[styles.comparisonDetail, { color: theme.colors.text }]}>
                    {formatNumber(bankStatus.remainingForFutureDays)} to distribute
                  </Text>
                  <Text style={[styles.comparisonDetail, { color: theme.colors.success }]}>
                    Flexible planning
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.comparisonCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.comparisonLabel, { color: theme.colors.textSecondary }]}>WEEK END</Text>
                <Text style={[styles.comparisonValue, { color: theme.colors.primary }]}>
                  Final day
                </Text>
                <Text style={[styles.comparisonSubtext, { color: theme.colors.textSecondary }]}>
                  Focus on today's target
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Banking Status or Create Banking Button */}
        {(() => {
          const bankingPlan = getBankingPlan();
          
          if (bankingPlan?.isActive) {
            // Show banking status card
            return (
              <BankingStatusCard 
                bankingPlan={bankingPlan} 
                onBankingChanged={() => updateBankStatus()} 
              />
            );
          } else if (isBankingAvailable()) {
            // Show create banking button
            return (
              <TouchableOpacity 
                style={[styles.bankingCreateButton, { 
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                }]}
                onPress={() => navigation.navigate('CalorieBankingSetup')}
              >
                <View style={styles.bankingCreateContent}>
                  <View style={[styles.bankingCreateIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Ionicons name="wallet-outline" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.bankingCreateText}>
                    <Text style={[styles.bankingCreateTitle, { color: theme.colors.text }]}>
                      Bank Calories for Special Days
                    </Text>
                    <Text style={[styles.bankingCreateSubtitle, { color: theme.colors.textSecondary }]}>
                      Save calories from multiple days to enjoy extra on social occasions
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          }
          return null;
        })()}

        {/* Today's Progress Card */}
        <View style={[styles.todayCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.todayHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Today's Progress</Text>
            <Text style={[styles.todayDate, { color: theme.colors.textSecondary }]}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>

          <View style={styles.todayStats}>
            <View style={styles.todayStatItem}>
              <Text style={[styles.todayStatLabel, { color: theme.colors.textSecondary }]}>Consumed</Text>
              <Text style={[styles.todayStatValue, { color: theme.colors.text }]}>
                {formatNumber(todayConsumed)}
              </Text>
              <Text style={[styles.todayStatUnit, { color: theme.colors.textSecondary }]}>calories</Text>
            </View>
            
            <View style={styles.todayStatItem}>
              <Text style={[styles.todayStatLabel, { color: theme.colors.textSecondary }]}>Daily Target</Text>
              <Text style={[styles.todayStatValue, { color: theme.colors.primary }]}>
                {formatNumber(bankStatus.safeToEatToday)}
              </Text>
              <Text style={[styles.todayStatUnit, { color: theme.colors.textSecondary }]}>goal calories</Text>
            </View>
            
            <View style={styles.todayStatItem}>
              <Text style={[styles.todayStatLabel, { color: theme.colors.textSecondary }]}>Remaining</Text>
              <Text style={[styles.todayStatValue, { color: (bankStatus.safeToEatToday - todayConsumed) >= 0 ? theme.colors.success : theme.colors.error }]}>
                {formatNumber(bankStatus.safeToEatToday - todayConsumed)}
              </Text>
              <Text style={[styles.todayStatUnit, { color: theme.colors.textSecondary }]}>left today</Text>
            </View>
          </View>

          {/* Today's Progress Bar */}
          <View style={styles.todayProgressContainer}>
            <View style={styles.todayProgressBar}>
              <View
                style={[
                  styles.todayProgressFill,
                  {
                    width: `${Math.min((todayConsumed / bankStatus.safeToEatToday) * 100, 100)}%`,
                    backgroundColor: (todayConsumed / bankStatus.safeToEatToday) > 1 ? theme.colors.error : theme.colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.todayProgressText, { color: theme.colors.text }]}>
              {Math.round((todayConsumed / bankStatus.safeToEatToday) * 100)}%
            </Text>
          </View>

          {/* Quick tip based on status */}
          <View style={[styles.todayTipSection, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.todayTip, { color: theme.colors.textSecondary }]}>
              {(todayConsumed / bankStatus.safeToEatToday) > 0.8 
                ? "🎯 You're close to your daily target!" 
                : (todayConsumed / bankStatus.safeToEatToday) > 0.5
                ? "👍 Good progress for today"
                : "🌅 Plenty of room for today's meals"}
            </Text>
          </View>
        </View>


        {/* Health Device Integration */}
        <HealthDeviceStatus ref={healthDeviceRef} onRecentActivities={handleRecentActivities} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowActionMenu(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={theme.colors.buttonText} />
      </TouchableOpacity>

      {/* Action Menu Modal */}
      {showActionMenu && (
        <View style={styles.actionMenuOverlay}>
          <TouchableOpacity 
            style={styles.actionMenuBackdrop}
            onPress={() => setShowActionMenu(false)}
            activeOpacity={1}
          />
          
          <View style={[styles.actionMenu, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.actionMenuHeader}>
              <Text style={[styles.actionMenuTitle, { color: theme.colors.text }]}>Quick Add</Text>
              <TouchableOpacity 
                style={styles.actionMenuClose}
                onPress={() => setShowActionMenu(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionMenuItems}>
              <TouchableOpacity
                style={[styles.actionMenuItem, { backgroundColor: theme.colors.card }]}
                onPress={() => {
                  setShowActionMenu(false);
                  navigation.navigate('FoodLogging');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.actionMenuIcon, { backgroundColor: '#4ECDC4' }]}>
                  <Ionicons name="restaurant" size={24} color="white" />
                </View>
                <View style={styles.actionMenuText}>
                  <Text style={[styles.actionMenuLabel, { color: theme.colors.text }]}>Log Meal</Text>
                  <Text style={[styles.actionMenuDescription, { color: theme.colors.textSecondary }]}>
                    Track food and calories
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionMenuItem, { backgroundColor: theme.colors.card }]}
                onPress={() => {
                  setShowActionMenu(false);
                  navigation.navigate('WorkoutLogging');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.actionMenuIcon, { backgroundColor: '#FF6B6B' }]}>
                  <Ionicons name="fitness" size={24} color="white" />
                </View>
                <View style={styles.actionMenuText}>
                  <Text style={[styles.actionMenuLabel, { color: theme.colors.text }]}>Log Workout</Text>
                  <Text style={[styles.actionMenuDescription, { color: theme.colors.textSecondary }]}>
                    Record training session
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionMenuItem, { backgroundColor: theme.colors.card }]}
                onPress={() => {
                  setShowActionMenu(false);
                  navigation.navigate('WeightTracking');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.actionMenuIcon, { backgroundColor: '#A8E6CF' }]}>
                  <Ionicons name="scale" size={24} color="white" />
                </View>
                <View style={styles.actionMenuText}>
                  <Text style={[styles.actionMenuLabel, { color: theme.colors.text }]}>Log Weight</Text>
                  <Text style={[styles.actionMenuDescription, { color: theme.colors.textSecondary }]}>
                    Record body weight
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Used Breakdown Modal */}
      <Modal
        visible={showUsedBreakdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUsedBreakdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Used Calories Breakdown</Text>
              <TouchableOpacity 
                onPress={() => setShowUsedBreakdown(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.breakdownContainer}>
              <View style={styles.breakdownItem}>
                <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>Total Consumed</Text>
                <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                  {formatNumber(bankStatus?.totalConsumed || 0)}
                </Text>
              </View>
              
              <View style={styles.breakdownItem}>
                <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>Total Burned</Text>
                <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                  -{formatNumber(bankStatus?.totalBurned || 0)}
                </Text>
              </View>
              
              <View style={[styles.breakdownItem, styles.breakdownSeparator]}>
                <Text style={[styles.breakdownLabel, { color: theme.colors.text, fontWeight: 'bold' }]}>Net Used</Text>
                <Text style={[styles.breakdownValue, { color: theme.colors.text, fontWeight: 'bold' }]}>
                  {formatNumber(bankStatus?.totalUsed || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 8, // Reduced top padding since we removed the header
  },
  headerWithTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  budgetItem: {
    flex: 1,
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  budgetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
  },
  remainingSection: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  remainingLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  remainingValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  dailyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dailyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  dailyItem: {
    alignItems: 'center',
    flex: 1,
  },
  dailyLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  dailyValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#339AF0',
    marginBottom: 4,
  },
  dailySubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  safeSection: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
  // New styles for restructured Daily Breakdown
  todayTargetSection: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  todayTargetValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  restOfWeekSection: {
    marginTop: 8,
  },
  restOfWeekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  restOfWeekItem: {
    alignItems: 'center',
    flex: 1,
  },
  restOfWeekValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  restOfWeekLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  endOfWeekSection: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  endOfWeekText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  safeLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  safeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#51CF66',
    marginBottom: 4,
  },
  safeSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9C88FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  titleSection: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
    borderRadius: 6,
  },
  // Today's Progress Card Styles
  todayCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  todayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  todayStatItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  todayStatLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 14,
  },
  todayStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  todayStatUnit: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
  },
  todayProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayProgressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    marginRight: 12,
    overflow: 'hidden',
  },
  todayProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  todayProgressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
  },
  todayTipSection: {
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
  },
  todayTip: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  setupButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Garmin styles removed - will be replaced with proxy-based solution
  
  // Used breakdown modal styles
  budgetLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoIcon: {
    marginLeft: 4,
    padding: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    borderRadius: 16,
    padding: 20,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  breakdownContainer: {
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownSeparator: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
    marginTop: 8,
  },
  breakdownLabel: {
    fontSize: 16,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Banking components styles
  bankingCreateButton: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bankingCreateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  bankingCreateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bankingCreateText: {
    flex: 1,
    paddingRight: 16,
  },
  bankingCreateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bankingCreateSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Modern fitness app redesign styles
  heroSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  phaseHeader: {
    marginBottom: 16,
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  phaseSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  heroProgressContainer: {
    marginBottom: 12,
  },
  heroProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  heroProgressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#51CF66',
  },
  heroProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroProgressText: {
    fontSize: 14,
    flex: 1,
  },
  infoIconHero: {
    marginLeft: 8,
  },
  heroIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  comparisonSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  comparisonCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  comparisonLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  comparisonValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  comparisonSubtext: {
    fontSize: 12,
    marginBottom: 12,
  },
  comparisonDetails: {
    gap: 4,
  },
  comparisonDetail: {
    fontSize: 12,
    fontWeight: '500',
  },

  // FAB (Floating Action Button) styles
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Action Menu Styles
  actionMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  actionMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionMenu: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  actionMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  actionMenuTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  actionMenuClose: {
    padding: 4,
  },
  actionMenuItems: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionMenuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenuText: {
    flex: 1,
    gap: 4,
  },
  actionMenuLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionMenuDescription: {
    fontSize: 14,
  },
});

export default WeeklyBankingScreen;
