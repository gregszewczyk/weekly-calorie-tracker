import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCalorieStore } from '../stores/calorieStore';
import { WorkoutSession } from '../types/CalorieTypes';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/NavigationTypes';
import TrainingSessionModal from '../components/TrainingSessionModal';

type WorkoutLoggingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WorkoutLogging'>;

const WorkoutLoggingScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutLoggingScreenNavigationProp>();
  const { theme } = useTheme();
  
  const { 
    getTodaysData, 
    getCalorieBankStatus,
    updateBurnedCalories
  } = useCalorieStore();

  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<WorkoutSession | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [useDetailedMode, setUseDetailedMode] = useState(false);

  // Load user's preferred logging mode on component mount
  useEffect(() => {
    const loadLoggingMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('workoutLoggingMode');
        if (savedMode !== null) {
          setUseDetailedMode(savedMode === 'detailed');
        }
      } catch (error) {
        console.warn('Failed to load workout logging mode preference:', error);
      }
    };
    loadLoggingMode();
  }, []);

  // Save user's preferred logging mode when it changes
  const handleToggleMode = async (newMode: boolean) => {
    setUseDetailedMode(newMode);
    try {
      await AsyncStorage.setItem('workoutLoggingMode', newMode ? 'detailed' : 'simple');
    } catch (error) {
      console.warn('Failed to save workout logging mode preference:', error);
    }
  };

  const todaysData = getTodaysData();
  const bankStatus = getCalorieBankStatus();

  const todayBurned = todaysData?.burned || 0;
  const todayTarget = bankStatus?.todayTarget || 2450;
  const totalActivities = todayBurned > 0 ? 1 : 0;

  // Calculate net impact (calories earned from exercise)
  const netCalorieImpact = todayBurned;
  const adjustedTarget = todayTarget + netCalorieImpact;

  const handleAddActivity = (calories: number) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentBurned = todaysData?.burned || 0;
    updateBurnedCalories(today, currentBurned + calories);
    setShowTrainingModal(false);
  };

  const handleDetailedWorkoutSave = (workout: WorkoutSession) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentBurned = todaysData?.burned || 0;
    updateBurnedCalories(today, currentBurned + workout.caloriesBurned);
    setShowTrainingModal(false);
  };

  const handleEditActivity = (workoutId: string) => {
    // For simplified version, just show modal to add more calories
    setShowTrainingModal(true);
  };

  const handleUpdateActivity = (updatedActivity: WorkoutSession) => {
    // For now, just update the burned calories total
    const today = format(new Date(), 'yyyy-MM-dd');
    updateBurnedCalories(today, todaysData?.burned || 0);
    setShowTrainingModal(false);
    setEditingActivity(null);
  };

  const handleDeleteActivity = (workoutId: string) => {
    // For now, just reset burned calories
    const today = format(new Date(), 'yyyy-MM-dd');
    updateBurnedCalories(today, 0);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'high': return theme.colors.error;
      case 'medium': return '#FFD43B';
      case 'low': return theme.colors.success;
      default: return theme.colors.primary;
    }
  };

  const getIntensityIcon = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'high': return 'flame';
      case 'medium': return 'flash';
      case 'low': return 'leaf';
      default: return 'fitness';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Workout Logging
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity 
            style={[styles.modeToggle, { backgroundColor: useDetailedMode ? theme.colors.primary : theme.colors.card }]}
            onPress={() => handleToggleMode(!useDetailedMode)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.modeToggleText, { color: useDetailedMode ? theme.colors.buttonText : theme.colors.text }]}>
              {useDetailedMode ? 'Detailed' : 'Simple'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('WeightTracking')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="scale-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('FoodLogging')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="restaurant-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Progress Section */}
        <View style={[styles.heroSection, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.heroHeader}>
            <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
              Today • {format(new Date(), 'EEE, MMM d')}
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
              Training & Activity
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: theme.colors.error }]}>
                {todayBurned.toLocaleString()}
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.colors.textSecondary }]}>burned</Text>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: theme.colors.success }]}>
                +{netCalorieImpact.toLocaleString()}
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.colors.textSecondary }]}>earned</Text>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: theme.colors.primary }]}>
                {totalActivities}
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.colors.textSecondary }]}>sessions</Text>
            </View>
          </View>

          {/* Impact Message */}
          <Text style={[styles.statusMessage, { color: theme.colors.textSecondary }]}>
            {netCalorieImpact > 0 
              ? `Your workouts earned ${netCalorieImpact.toLocaleString()} extra calories today`
              : 'Log your workouts to earn extra calories'
            }
          </Text>
        </View>

        {/* Today's Activities */}
        <View style={[styles.activitiesSection, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Workouts</Text>
            <Text style={[styles.activityCount, { color: theme.colors.textSecondary }]}>
              {totalActivities} sessions
            </Text>
          </View>

          {todayBurned > 0 ? (
            <View style={styles.activitiesList}>
              <View style={[styles.activityItem, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.activityIcon}>
                  <Ionicons 
                    name="barbell" 
                    size={24} 
                    color={theme.colors.success} 
                  />
                </View>
                
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityName, { color: theme.colors.text }]}>
                    Today's Workouts
                  </Text>
                  <Text style={[styles.activityDetails, { color: theme.colors.textSecondary }]}>
                    Total calories burned from exercise
                  </Text>
                </View>
                
                <View style={styles.activityActions}>
                  <Text style={[styles.activityCalories, { color: theme.colors.error }]}>
                    +{todayBurned.toLocaleString()} cal
                  </Text>
                  
                  <TouchableOpacity 
                    onPress={() => handleDeleteActivity('today')}
                    style={styles.activityActionButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
                No workouts logged yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>
                Tap the + button to log your first workout
              </Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={[styles.quickStatsSection, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Impact</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Base Target</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {todayTarget.toLocaleString()} cal
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Exercise Bonus</Text>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>
                +{netCalorieImpact.toLocaleString()} cal
              </Text>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Adjusted Target</Text>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {adjustedTarget.toLocaleString()} cal
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Sessions</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {totalActivities}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowTrainingModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={theme.colors.buttonText} />
      </TouchableOpacity>

      {/* Workout Logging Modals */}
      {useDetailedMode ? (
        <TrainingSessionModal
          visible={showTrainingModal}
          onClose={() => {
            setShowTrainingModal(false);
            setEditingActivity(null);
          }}
          onSave={handleDetailedWorkoutSave}
        />
      ) : (
        /* Simple Calorie Input Modal */
        showTrainingModal && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: theme.colors.surface, padding: 20, margin: 20, borderRadius: 16 }}>
              <Text style={[{ fontSize: 18, fontWeight: '600', marginBottom: 16 }, { color: theme.colors.text }]}>Add Workout Calories</Text>
              <TouchableOpacity 
                style={{ backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8, marginBottom: 8 }}
                onPress={() => handleAddActivity(300)}
              >
                <Text style={{ color: theme.colors.buttonText, textAlign: 'center' }}>Light Workout (+300 cal)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8, marginBottom: 8 }}
                onPress={() => handleAddActivity(500)}
              >
                <Text style={{ color: theme.colors.buttonText, textAlign: 'center' }}>Moderate Workout (+500 cal)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8, marginBottom: 16 }}
                onPress={() => handleAddActivity(800)}
              >
                <Text style={{ color: theme.colors.buttonText, textAlign: 'center' }}>Intense Workout (+800 cal)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ backgroundColor: theme.colors.error, padding: 12, borderRadius: 8 }}
                onPress={() => {
                  setShowTrainingModal(false);
                  setEditingActivity(null);
                }}
              >
                <Text style={{ color: theme.colors.buttonText, textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      )}
    </SafeAreaView>
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
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerButton: {
    padding: 8,
  },
  modeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Space for FAB
  },

  // Hero Section
  heroSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroHeader: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 16,
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Sections
  activitiesSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatsSection: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityCount: {
    fontSize: 14,
  },

  // Activities List
  activitiesList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  activityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityCalories: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  activityActionButton: {
    padding: 4,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Quick Stats
  statRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },

  // FAB
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
});

export default WorkoutLoggingScreen;