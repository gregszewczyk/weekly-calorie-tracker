import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NutritionRecommendation, RecommendationLevel } from '../types/ApiTypes';

interface RecommendationCardProps {
  level: RecommendationLevel;
  recommendation: NutritionRecommendation;
  isSelected: boolean;
  onSelect: (level: RecommendationLevel) => void;
  showExpandedDetails?: boolean;
  hydrationGuidance?: {
    dailyBaselineFluid: string;
    preWorkoutHydration: string;
    duringWorkoutFluidRate: string;
    postWorkoutRehydration: string;
    electrolyteRecommendations: string;
  };
  aiReasoning?: string;
  sportSpecificGuidance?: string;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  level,
  recommendation,
  isSelected,
  onSelect,
  showExpandedDetails = false,
  hydrationGuidance,
  aiReasoning,
  sportSpecificGuidance,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandAnimation] = useState(new Animated.Value(0));

  const levelConfig = {
    conservative: {
      color: '#28a745',
      backgroundColor: '#d4edda',
      borderColor: '#c3e6cb',
      label: 'Conservative',
      description: 'Safer approach with moderate deficit',
      icon: 'shield-checkmark-outline',
      subtitle: 'Gentle and sustainable'
    },
    standard: {
      color: '#007bff',
      backgroundColor: '#d1ecf1',
      borderColor: '#bee5eb',
      label: 'Standard',
      description: 'Balanced evidence-based approach',
      icon: 'fitness-outline',
      subtitle: 'Optimal balance'
    },
    aggressive: {
      color: '#fd7e14',
      backgroundColor: '#fff3cd',
      borderColor: '#ffeaa7',
      label: 'Aggressive',
      description: 'Faster results with higher deficit',
      icon: 'flash-outline',
      subtitle: 'Accelerated progress'
    },
  };

  const config = levelConfig[level];

  const toggleExpanded = () => {
    if (!showExpandedDetails) return;
    
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.spring(expandAnimation, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const renderMacroBar = () => (
    <View style={styles.macroPercentages}>
      <View style={styles.macroBar}>
        <View 
          style={[
            styles.macroBarSegment, 
            { 
              width: `${recommendation.macronutrients.protein.percentage}%`, 
              backgroundColor: '#e74c3c' 
            }
          ]} 
        />
        <View 
          style={[
            styles.macroBarSegment, 
            { 
              width: `${recommendation.macronutrients.carbohydrates.percentage}%`, 
              backgroundColor: '#3498db' 
            }
          ]} 
        />
        <View 
          style={[
            styles.macroBarSegment, 
            { 
              width: `${recommendation.macronutrients.fats.percentage}%`, 
              backgroundColor: '#f39c12' 
            }
          ]} 
        />
      </View>
      <View style={styles.macroLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
          <Text style={styles.legendText}>P: {recommendation.macronutrients.protein.percentage}%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#3498db' }]} />
          <Text style={styles.legendText}>C: {recommendation.macronutrients.carbohydrates.percentage}%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#f39c12' }]} />
          <Text style={styles.legendText}>F: {recommendation.macronutrients.fats.percentage}%</Text>
        </View>
      </View>
    </View>
  );

  const renderMacroGrid = () => (
    <View style={styles.macroGrid}>
      <View style={styles.macroItem}>
        <Text style={styles.macroLabel}>Calories</Text>
        <Text style={[styles.macroValue, { color: config.color }]}>
          {recommendation.calories.daily.baseline}
        </Text>
        <Text style={styles.macroUnit}>kcal</Text>
      </View>
      
      <View style={styles.macroItem}>
        <Text style={styles.macroLabel}>Protein</Text>
        <Text style={styles.macroValue}>{recommendation.macronutrients.protein.grams}g</Text>
        <Text style={styles.macroUnit}>
          {recommendation.macronutrients.protein.perKgBodyweight.toFixed(1)}g/kg
        </Text>
      </View>
      
      <View style={styles.macroItem}>
        <Text style={styles.macroLabel}>Carbs</Text>
        <Text style={styles.macroValue}>{recommendation.macronutrients.carbohydrates.grams}g</Text>
        <Text style={styles.macroUnit}>
          {recommendation.macronutrients.carbohydrates.perKgBodyweight.toFixed(1)}g/kg
        </Text>
      </View>
      
      <View style={styles.macroItem}>
        <Text style={styles.macroLabel}>Fats</Text>
        <Text style={styles.macroValue}>{recommendation.macronutrients.fats.grams}g</Text>
        <Text style={styles.macroUnit}>
          {recommendation.macronutrients.fats.perKgBodyweight.toFixed(1)}g/kg
        </Text>
      </View>
    </View>
  );

  const renderTrainingAdjustments = () => (
    <View style={styles.adjustmentSection}>
      <Text style={styles.sectionTitle}>Training Day Adjustments</Text>
      <View style={styles.adjustmentGrid}>
        <View style={styles.adjustmentItem}>
          <Text style={styles.adjustmentLabel}>Training Day</Text>
          <Text style={[styles.adjustmentValue, { color: '#28a745' }]}>
            +{recommendation.adjustments.trainingDay.calorieIncrease} kcal
          </Text>
        </View>
        <View style={styles.adjustmentItem}>
          <Text style={styles.adjustmentLabel}>Rest Day</Text>
          <Text style={[styles.adjustmentValue, { color: '#fd7e14' }]}>
            {recommendation.adjustments.restDay.calorieDecrease} kcal
          </Text>
        </View>
      </View>
    </View>
  );

  const renderOutcome = () => {
    if (recommendation.expectedOutcomes.weightChange.weekly === 0) return null;
    
    return (
      <View style={styles.outcomeSection}>
        <View style={styles.outcomeHeader}>
          <Ionicons name="trending-up-outline" size={20} color={config.color} />
          <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>
            Expected Outcome
          </Text>
        </View>
        <Text style={styles.outcomeText}>
          {recommendation.expectedOutcomes.weightChange.weekly > 0 ? '+' : ''}
          {recommendation.expectedOutcomes.weightChange.weekly.toFixed(1)}kg per week
        </Text>
        {recommendation.expectedOutcomes.timeToGoal && (
          <Text style={styles.timeToGoal}>{recommendation.expectedOutcomes.timeToGoal}</Text>
        )}
      </View>
    );
  };

  const renderExpandedDetails = () => {
    if (!showExpandedDetails || !isExpanded) return null;

    return (
      <Animated.View 
        style={[
          styles.expandedContent,
          {
            opacity: expandAnimation,
            maxHeight: expandAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1000],
            }),
          }
        ]}
      >
        {/* Hydration Guidance */}
        {hydrationGuidance && (
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Ionicons name="water-outline" size={18} color="#3498db" />
              <Text style={styles.detailTitle}>Hydration Targets</Text>
            </View>
            <View style={styles.hydrationGrid}>
              <View style={styles.hydrationItem}>
                <Text style={styles.hydrationLabel}>Daily</Text>
                <Text style={styles.hydrationValue}>{hydrationGuidance.dailyBaselineFluid}</Text>
              </View>
              <View style={styles.hydrationItem}>
                <Text style={styles.hydrationLabel}>Pre-Workout</Text>
                <Text style={styles.hydrationValue}>{hydrationGuidance.preWorkoutHydration}</Text>
              </View>
            </View>
            <Text style={styles.electrolyteNote}>{hydrationGuidance.electrolyteRecommendations}</Text>
          </View>
        )}

        {/* Meal Timing */}
        <View style={styles.detailSection}>
          <View style={styles.detailHeader}>
            <Ionicons name="time-outline" size={18} color="#f39c12" />
            <Text style={styles.detailTitle}>Meal Timing</Text>
          </View>
          <View style={styles.timingItem}>
            <Text style={styles.timingLabel}>Pre-Workout:</Text>
            <Text style={styles.timingValue}>{recommendation.timing.preWorkout.timing}</Text>
          </View>
          <View style={styles.timingItem}>
            <Text style={styles.timingLabel}>Post-Workout:</Text>
            <Text style={styles.timingValue}>{recommendation.timing.postWorkout.timing}</Text>
          </View>
          <View style={styles.timingItem}>
            <Text style={styles.timingLabel}>Daily Meals:</Text>
            <Text style={styles.timingValue}>
              {recommendation.timing.mealFrequency} meals, {recommendation.timing.mealSpacing}h spacing
            </Text>
          </View>
        </View>

        {/* AI Reasoning */}
        {aiReasoning && (
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Ionicons name="bulb-outline" size={18} color="#9c27b0" />
              <Text style={styles.detailTitle}>AI Reasoning</Text>
            </View>
            <Text style={styles.reasoningText}>{aiReasoning}</Text>
          </View>
        )}

        {/* Sport-Specific Guidance */}
        {sportSpecificGuidance && (
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Ionicons name="trophy-outline" size={18} color="#ff5722" />
              <Text style={styles.detailTitle}>Sport-Specific Notes</Text>
            </View>
            <Text style={styles.reasoningText}>{sportSpecificGuidance}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { 
          borderColor: isSelected ? config.color : '#e9ecef',
          backgroundColor: isSelected ? config.backgroundColor : '#fff',
          borderWidth: isSelected ? 2 : 1,
        }
      ]}
      onPress={() => onSelect(level)}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
              <Ionicons name={config.icon as any} size={24} color={config.color} />
            </View>
            <View style={styles.titleTextContainer}>
              <Text style={[styles.title, { color: config.color }]}>
                {config.label}
              </Text>
              <Text style={styles.subtitle}>{config.subtitle}</Text>
            </View>
          </View>
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: config.color }]}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          )}
        </View>
        <Text style={styles.description}>{config.description}</Text>
      </View>

      {/* Main Content */}
      <View style={styles.contentSection}>
        {renderMacroGrid()}
        {renderMacroBar()}
        {renderTrainingAdjustments()}
        {renderOutcome()}
      </View>

      {/* Expand Button */}
      {showExpandedDetails && (
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={toggleExpanded}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.expandButtonText, { color: config.color }]}>
            {isExpanded ? 'Less Details' : 'More Details'}
          </Text>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={config.color} 
          />
        </TouchableOpacity>
      )}

      {/* Expanded Details */}
      {renderExpandedDetails()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 20,
  },
  contentSection: {
    marginBottom: 16,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  macroItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  macroValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  macroUnit: {
    fontSize: 12,
    color: '#666',
  },
  macroPercentages: {
    marginBottom: 16,
  },
  macroBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#f1f3f4',
    marginBottom: 10,
  },
  macroBarSegment: {
    height: '100%',
  },
  macroLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  adjustmentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  adjustmentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adjustmentItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  adjustmentLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  adjustmentValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  outcomeSection: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  outcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  outcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  timeToGoal: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  expandedContent: {
    overflow: 'hidden',
  },
  detailSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  hydrationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hydrationItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#e7f3ff',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  hydrationLabel: {
    fontSize: 12,
    color: '#1976d2',
    marginBottom: 2,
    fontWeight: '600',
  },
  hydrationValue: {
    fontSize: 13,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  electrolyteNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  timingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  timingLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    flex: 1,
  },
  timingValue: {
    fontSize: 13,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  reasoningText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default RecommendationCard;
