import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MealEntry } from '../types/CalorieTypes';
import { format } from 'date-fns';
import { useThemedStyles, useTheme } from '../contexts/ThemeContext';

interface MealHistoryListProps {
  meals: MealEntry[];
  onEditMeal?: (meal: MealEntry) => void;
  onDeleteMeal?: (mealId: string) => void;
  showEmptyState?: boolean;
}

interface GroupedMeals {
  [category: string]: MealEntry[];
}

const MealHistoryList: React.FC<MealHistoryListProps> = ({
  meals,
  onEditMeal,
  onDeleteMeal,
  showEmptyState = true,
}) => {
  const { theme } = useTheme();
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  
  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
      },
      categorySection: {
        marginBottom: 20,
      },
      categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
      },
      categoryIcon: {
        fontSize: 18,
        marginRight: 8,
      },
      categoryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        flex: 1,
      },
      categoryStats: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '500',
      },
      mealCard: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
        ...Platform.select({
          ios: {
            shadowColor: theme.dark ? '#000' : '#000',
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: theme.dark ? 0.3 : 0.1,
            shadowRadius: 4,
          },
          android: {
            elevation: 2,
          },
        }),
      },
      mealCardExpanded: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
      },
      mealHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
      },
      mealInfo: {
        flex: 1,
      },
      mealName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
      },
      mealTime: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 4,
      },
      mealQuickStats: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      mealCalories: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.primary,
        marginRight: 12,
      },
      macroChip: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
      },
      macroChipText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '500',
      },
      mealActions: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      actionButton: {
        padding: 8,
        marginLeft: 4,
      },
      expandButton: {
        padding: 8,
        marginLeft: 8,
      },
      expandedContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      macroSection: {
        marginBottom: 12,
      },
      macroSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
      },
      macroRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
      },
      macroLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        flex: 1,
      },
      macroValue: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'right',
        width: 80,
      },
      macroBar: {
        height: 4,
        backgroundColor: theme.colors.surface,
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 4,
      },
      macroBarFill: {
        height: '100%',
        borderRadius: 2,
      },
      notesSection: {
        marginTop: 8,
      },
      notesText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        lineHeight: 20,
      },
      emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
      },
      emptyIcon: {
        fontSize: 48,
        color: theme.colors.textTertiary,
        marginBottom: 12,
      },
      emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
        textAlign: 'center',
      },
      emptySubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
      },
    })
  );

  // Group meals by category and sort by time
  const groupMealsByCategory = (meals: MealEntry[]): GroupedMeals => {
    const sortedMeals = [...meals].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return sortedMeals.reduce((groups: GroupedMeals, meal) => {
      const category = meal.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(meal);
      return groups;
    }, {});
  };

  const getCategoryInfo = (category: string) => {
    const categoryMap: { [key: string]: { icon: string; title: string } } = {
      breakfast: { icon: '🌅', title: 'Breakfast' },
      lunch: { icon: '☀️', title: 'Lunch' },
      dinner: { icon: '🌙', title: 'Dinner' },
      snack: { icon: '🍎', title: 'Snacks' },
      'pre-workout': { icon: '🏃‍♂️', title: 'Pre-Workout' },
      'post-workout': { icon: '💪', title: 'Post-Workout' },
      other: { icon: '🍽️', title: 'Other Meals' },
    };
    return categoryMap[category] || categoryMap.other;
  };

  const calculateCategoryStats = (categoryMeals: MealEntry[]) => {
    const totalCalories = categoryMeals.reduce((sum, meal) => sum + meal.calories, 0);
    return `${categoryMeals.length} meal${categoryMeals.length !== 1 ? 's' : ''} • ${totalCalories} cal`;
  };

  const handleMealPress = (mealId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMeal(expandedMeal === mealId ? null : mealId);
  };

  const handleEditMeal = (meal: MealEntry) => {
    if (onEditMeal) {
      onEditMeal(meal);
    }
  };

  const handleDeleteMeal = (meal: MealEntry) => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${meal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDeleteMeal) {
              onDeleteMeal(meal.id);
            }
          },
        },
      ]
    );
  };

  const getMacroBarColor = (macroType: 'protein' | 'carbs' | 'fat') => {
    const colors = {
      protein: '#FF6B6B',
      carbs: '#4ECDC4',
      fat: '#45B7D1',
    };
    return colors[macroType];
  };

  const renderMacroBar = (current: number, target: number, macroType: 'protein' | 'carbs' | 'fat') => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    return (
      <View style={styles.macroBar}>
        <Animated.View
          style={[
            styles.macroBarFill,
            {
              width: `${percentage}%`,
              backgroundColor: getMacroBarColor(macroType),
            },
          ]}
        />
      </View>
    );
  };

  const renderMeal = (meal: MealEntry) => {
    const isExpanded = expandedMeal === meal.id;
    const hasDetailedMacros = meal.macros && (meal.macros.protein > 0 || meal.macros.carbohydrates > 0 || meal.macros.fat > 0);

    return (
      <TouchableOpacity
        key={meal.id}
        style={[styles.mealCard, isExpanded && styles.mealCardExpanded]}
        onPress={() => handleMealPress(meal.id)}
        activeOpacity={0.7}
      >
        <View style={styles.mealHeader}>
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{meal.name}</Text>
            <Text style={styles.mealTime}>
              {format(new Date(meal.timestamp), 'HH:mm')}
            </Text>
            <View style={styles.mealQuickStats}>
              <Text style={styles.mealCalories}>{meal.calories} cal</Text>
              {meal.macros && (
                <>
                  <View style={styles.macroChip}>
                    <Text style={styles.macroChipText}>P: {meal.macros.protein}g</Text>
                  </View>
                  <View style={styles.macroChip}>
                    <Text style={styles.macroChipText}>C: {meal.macros.carbohydrates}g</Text>
                  </View>
                  <View style={styles.macroChip}>
                    <Text style={styles.macroChipText}>F: {meal.macros.fat}g</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={styles.mealActions}>
            {onEditMeal && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditMeal(meal)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="pencil" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
            
            {onDeleteMeal && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteMeal(meal)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => handleMealPress(meal.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {hasDetailedMacros && (
              <View style={styles.macroSection}>
                <Text style={styles.macroSectionTitle}>Macronutrients</Text>
                
                <View style={styles.macroRow}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroValue}>{meal.macros!.protein}g</Text>
                </View>
                {renderMacroBar(meal.macros!.protein, 30, 'protein')}

                <View style={styles.macroRow}>
                  <Text style={styles.macroLabel}>Carbohydrates</Text>
                  <Text style={styles.macroValue}>{meal.macros!.carbohydrates}g</Text>
                </View>
                {renderMacroBar(meal.macros!.carbohydrates, 50, 'carbs')}

                <View style={styles.macroRow}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={styles.macroValue}>{meal.macros!.fat}g</Text>
                </View>
                {renderMacroBar(meal.macros!.fat, 20, 'fat')}
              </View>
            )}

            {meal.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.macroSectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{meal.notes}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (meals.length === 0 && showEmptyState) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🍽️</Text>
        <Text style={styles.emptyTitle}>No meals logged yet</Text>
        <Text style={styles.emptySubtitle}>
          Start tracking your nutrition by adding your first meal of the day
        </Text>
      </View>
    );
  }

  const groupedMeals = groupMealsByCategory(meals);
  const categoryOrder = ['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout', 'other'];

  return (
    <View style={styles.container}>
      {categoryOrder.map(category => {
        const categoryMeals = groupedMeals[category];
        if (!categoryMeals || categoryMeals.length === 0) return null;

        const categoryInfo = getCategoryInfo(category);
        const categoryStats = calculateCategoryStats(categoryMeals);

        return (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
              <Text style={styles.categoryTitle}>{categoryInfo.title}</Text>
              <Text style={styles.categoryStats}>{categoryStats}</Text>
            </View>
            
            {categoryMeals.map(meal => renderMeal(meal))}
          </View>
        );
      })}
    </View>
  );
};

export default MealHistoryList;