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
import { MealEntry } from '../types/CalorieTypes';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/NavigationTypes';
import MealLoggingModal from '../components/MealLoggingModal';
import EditMealModal from '../components/EditMealModal';
import SimplifiedCalorieLogging from '../components/SimplifiedCalorieLogging';

type FoodLoggingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FoodLogging'>;

const FoodLoggingScreen: React.FC = () => {
  const navigation = useNavigation<FoodLoggingScreenNavigationProp>();
  const { theme } = useTheme();
  
  const { 
    getTodaysData, 
    getRemainingCaloriesForToday, 
    getCalorieBankStatus,
    logMeal,
    deleteMeal,
    editMeal 
  } = useCalorieStore();

  const [showMealModal, setShowMealModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [useDetailedMode, setUseDetailedMode] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Load user's preferred logging mode on component mount
  useEffect(() => {
    const loadLoggingMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('foodLoggingMode');
        if (savedMode !== null) {
          setUseDetailedMode(savedMode === 'detailed');
        }
      } catch (error) {
        console.warn('Failed to load food logging mode preference:', error);
      }
    };
    loadLoggingMode();
  }, []);

  // Save user's preferred logging mode when it changes
  const handleToggleMode = async (newMode: boolean) => {
    setUseDetailedMode(newMode);
    try {
      await AsyncStorage.setItem('foodLoggingMode', newMode ? 'detailed' : 'simple');
    } catch (error) {
      console.warn('Failed to save food logging mode preference:', error);
    }
  };

  // Helper function to safely format timestamps
  const formatTimestamp = (timestamp: Date | string) => {
    try {
      const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
      return format(date, 'h:mm a');
    } catch (error) {
      console.warn('Invalid timestamp format:', timestamp);
      return 'Invalid time';
    }
  };

  const todaysData = getTodaysData();
  const remainingCalories = getRemainingCaloriesForToday();
  const bankStatus = getCalorieBankStatus();

  const todayConsumed = todaysData?.consumed || 0;
  const todayTarget = bankStatus?.todayTarget || 2450;
  const progressPercentage = Math.min((todayConsumed / todayTarget) * 100, 100);


  const handleEditMeal = (mealId: string) => {
    const meal = todaysData?.meals.find(m => m.id === mealId);
    if (meal) {
      setEditingMeal(meal);
      setShowEditModal(true);
    }
  };

  const handleUpdateMeal = (mealId: string, updatedMeal: Partial<MealEntry>) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    editMeal(mealId, today, updatedMeal);
    setShowEditModal(false);
    setEditingMeal(null);
  };

  const handleDeleteMeal = (mealId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    deleteMeal(mealId, today);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusColor = () => {
    if (progressPercentage > 100) return theme.colors.error;
    if (progressPercentage > 80) return '#FFD43B'; // Warning yellow
    return theme.colors.success;
  };

  const getStatusMessage = () => {
    const remaining = todayTarget - todayConsumed;
    if (remaining > 0) {
      return `${remaining.toLocaleString()} calories remaining`;
    } else {
      return `${Math.abs(remaining).toLocaleString()} calories over target`;
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
          Food Logging
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
          
          {useDetailedMode && (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowMealModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('WorkoutLogging')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="fitness-outline" size={24} color={theme.colors.text} />
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
              Food & Nutrition
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: theme.colors.text }]}>
                {todayConsumed.toLocaleString()}
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.colors.textSecondary }]}>consumed</Text>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: theme.colors.primary }]}>
                {todayTarget.toLocaleString()}
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.colors.textSecondary }]}>target</Text>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { 
                color: remainingCalories >= 0 ? theme.colors.success : theme.colors.error 
              }]}>
                {Math.abs(remainingCalories).toLocaleString()}
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.colors.textSecondary }]}>
                {remainingCalories >= 0 ? 'remaining' : 'over'}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.card }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: getStatusColor(),
                  },
                ]}
              />
            </View>
          </View>

          {/* Status Message */}
          <Text style={[styles.statusMessage, { color: theme.colors.textSecondary }]}>
            {getStatusMessage()}
          </Text>
        </View>

        {/* Quick Add Section - Only show in simple mode */}
        {!useDetailedMode && (
          <View style={[styles.quickAddSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Add</Text>
            <SimplifiedCalorieLogging />
          </View>
        )}

        {/* Today's Meals */}
        <View style={[styles.mealsSection, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Meals</Text>
            <Text style={[styles.mealCount, { color: theme.colors.textSecondary }]}>
              {todaysData?.meals.length || 0} items
            </Text>
          </View>

          {todaysData?.meals && todaysData.meals.length > 0 ? (
            <View style={styles.mealsList}>
              {todaysData.meals.map((meal, index) => (
                <View key={meal.id} style={[styles.mealItem, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.mealInfo}>
                    <Text style={[styles.mealName, { color: theme.colors.text }]}>{meal.name}</Text>
                    <Text style={[styles.mealDetails, { color: theme.colors.textSecondary }]}>
                      {meal.category} • {formatTimestamp(meal.timestamp)}
                    </Text>
                  </View>
                  
                  <View style={styles.mealActions}>
                    <Text style={[styles.mealCalories, { color: theme.colors.primary }]}>
                      {meal.calories.toLocaleString()} cal
                    </Text>
                    
                    <TouchableOpacity 
                      onPress={() => handleEditMeal(meal.id)}
                      style={styles.mealActionButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="pencil" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => handleDeleteMeal(meal.id)}
                      style={styles.mealActionButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
                No meals logged yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>
                Tap the + button to add your first meal
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Multi-action FAB - Only show in simple mode */}
      {!useDetailedMode && (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowActionMenu(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={theme.colors.buttonText} />
        </TouchableOpacity>
      )}

      {/* Action Menu Overlay */}
      {showActionMenu && (
        <TouchableOpacity 
          style={styles.actionMenuOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={[styles.actionMenu, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.actionMenuTitle, { color: theme.colors.text }]}>
              Quick Actions
            </Text>
            
            <TouchableOpacity 
              style={[styles.actionMenuItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                setShowActionMenu(false);
                setShowMealModal(true);
              }}
            >
              <Ionicons name="restaurant" size={24} color={theme.colors.primary} />
              <View style={styles.actionMenuItemText}>
                <Text style={[styles.actionMenuItemTitle, { color: theme.colors.text }]}>
                  Log Meal
                </Text>
                <Text style={[styles.actionMenuItemSubtitle, { color: theme.colors.textSecondary }]}>
                  Add food & calories
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionMenuItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                setShowActionMenu(false);
                navigation.navigate('WorkoutLogging');
              }}
            >
              <Ionicons name="fitness" size={24} color={theme.colors.success} />
              <View style={styles.actionMenuItemText}>
                <Text style={[styles.actionMenuItemTitle, { color: theme.colors.text }]}>
                  Log Workout
                </Text>
                <Text style={[styles.actionMenuItemSubtitle, { color: theme.colors.textSecondary }]}>
                  Track exercise & calories burned
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActionMenu(false);
                navigation.navigate('WeightTracking');
              }}
            >
              <Ionicons name="scale" size={24} color={theme.colors.error} />
              <View style={styles.actionMenuItemText}>
                <Text style={[styles.actionMenuItemTitle, { color: theme.colors.text }]}>
                  Log Weight
                </Text>
                <Text style={[styles.actionMenuItemSubtitle, { color: theme.colors.textSecondary }]}>
                  Record body weight & composition
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Modals */}
      <MealLoggingModal
        visible={showMealModal}
        onClose={() => setShowMealModal(false)}
        onSave={(meal: Omit<MealEntry, 'id' | 'timestamp'>) => {
          logMeal(meal);
          setShowMealModal(false);
        }}
      />

      {showEditModal && editingMeal && (
        <EditMealModal
          visible={showEditModal}
          meal={editingMeal}
          onClose={() => {
            setShowEditModal(false);
            setEditingMeal(null);
          }}
          onSave={handleUpdateMeal}
        />
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
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Sections
  quickAddSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealsSection: {
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
  mealCount: {
    fontSize: 14,
  },

  // Meals List
  mealsList: {
    gap: 0,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  mealDetails: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  mealActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  mealActionButton: {
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

  // Action Menu
  actionMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionMenu: {
    width: '90%',
    maxWidth: 400,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  actionMenuTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  actionMenuItemText: {
    flex: 1,
  },
  actionMenuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionMenuItemSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default FoodLoggingScreen;