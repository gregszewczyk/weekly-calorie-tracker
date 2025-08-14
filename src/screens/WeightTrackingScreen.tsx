import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCalorieStore } from '../stores/calorieStore';
import { WeightEntry } from '../types/GoalTypes';
import { format, parseISO, subDays, startOfWeek } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/NavigationTypes';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';

type WeightTrackingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WeightTracking'>;

const WeightTrackingScreen: React.FC = () => {
  const navigation = useNavigation<WeightTrackingScreenNavigationProp>();
  const { theme } = useTheme();
  
  const { 
    addWeightEntry,
    getWeightTrend,
    getGoalProgress,
    goalConfiguration,
    weightEntries
  } = useCalorieStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [bodyFatInput, setBodyFatInput] = useState('');

  const weightTrend = getWeightTrend();
  const goalProgress = getGoalProgress();
  const { width: screenWidth } = Dimensions.get('window');

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

  // Get recent weight entries (last 30 days)
  const recentEntries = weightEntries
    .filter(entry => {
      const entryDate = parseISO(entry.date);
      const thirtyDaysAgo = subDays(new Date(), 30);
      return entryDate >= thirtyDaysAgo;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate BMI if we have current weight and height from goal config
  const calculateBMI = (): number | null => {
    if (!weightTrend?.current) return null;
    // Try to get height from athlete profile or goal config
    const height = goalConfiguration?.athleteConfig?.profile?.physicalStats?.height;
    if (!height) return null;
    
    const heightInM = height / 100; // Convert cm to meters
    return weightTrend.current / (heightInM * heightInM);
  };

  const bmi = calculateBMI();

  const handleAddWeight = () => {
    const weight = parseFloat(weightInput);
    if (!weightInput || isNaN(weight) || weight <= 0 || weight > 300) {
      Alert.alert('Error', 'Please enter a valid weight between 0-300 kg');
      return;
    }

    addWeightEntry(weight);
    setWeightInput('');
    setBodyFatInput('');
    setShowWeightInput(false);
    Alert.alert('Success', 'Weight recorded successfully');
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getTrendColor = () => {
    if (!weightTrend) return theme.colors.textSecondary;
    switch (weightTrend.trend) {
      case 'up': return theme.colors.error;
      case 'down': return theme.colors.success;
      case 'stable': return theme.colors.primary;
      default: return theme.colors.textSecondary;
    }
  };

  const getTrendIcon = () => {
    if (!weightTrend) return 'trending-flat';
    switch (weightTrend.trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'trending-flat';
      default: return 'trending-flat';
    }
  };

  const getBMICategory = (bmi: number): { category: string; color: string } => {
    if (bmi < 18.5) return { category: 'Underweight', color: theme.colors.primary };
    if (bmi < 25) return { category: 'Normal', color: theme.colors.success };
    if (bmi < 30) return { category: 'Overweight', color: '#FFD43B' };
    return { category: 'Obese', color: theme.colors.error };
  };

  // Simple weight chart component
  const WeightChart: React.FC = () => {
    if (recentEntries.length < 2) {
      return (
        <View style={[styles.chartPlaceholder, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="analytics-outline" size={48} color={theme.colors.textTertiary} />
          <Text style={[styles.chartPlaceholderText, { color: theme.colors.textSecondary }]}>
            Log more weights to see your trend
          </Text>
        </View>
      );
    }

    const chartWidth = screenWidth - 64; // Account for padding
    const chartHeight = 200;
    const padding = 40;
    const plotWidth = chartWidth - (padding * 2);
    const plotHeight = chartHeight - (padding * 2);

    // Use last 7 entries for the chart
    const chartData = recentEntries.slice(0, 7).reverse();
    const weights = chartData.map(entry => entry.weight);
    const minWeight = Math.min(...weights) * 0.98;
    const maxWeight = Math.max(...weights) * 1.02;
    const weightRange = maxWeight - minWeight;

    const getX = (index: number): number => {
      return padding + (index * plotWidth) / Math.max(chartData.length - 1, 1);
    };

    const getY = (weight: number): number => {
      const normalizedValue = (weight - minWeight) / weightRange;
      return padding + plotHeight - (normalizedValue * plotHeight);
    };

    // Create path for weight line
    let pathData = '';
    chartData.forEach((entry, index) => {
      const x = getX(index);
      const y = getY(entry.weight);
      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });

    return (
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0.1" />
            </LinearGradient>
          </Defs>
          
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio, index) => (
            <Line
              key={index}
              x1={padding}
              y1={padding + plotHeight * ratio}
              x2={padding + plotWidth}
              y2={padding + plotHeight * ratio}
              stroke={theme.colors.border}
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          ))}

          {/* Weight line */}
          <Path
            d={pathData}
            stroke={theme.colors.primary}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {chartData.map((entry, index) => (
            <Circle
              key={entry.date}
              cx={getX(index)}
              cy={getY(entry.weight)}
              r="4"
              fill={theme.colors.primary}
              stroke={theme.colors.surface}
              strokeWidth="2"
            />
          ))}
        </Svg>
      </View>
    );
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
          Weight Tracking
        </Text>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowWeightInput(!showWeightInput)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add" size={24} color={theme.colors.text} />
        </TouchableOpacity>
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
              Current Status • {format(new Date(), 'EEE, MMM d')}
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
              Body Weight & Composition
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: theme.colors.text }]}>
                {weightTrend?.current?.toFixed(1) || '--'} kg
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.colors.textSecondary }]}>current</Text>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: getTrendColor() }]}>
                {weightTrend?.weeklyChange 
                  ? `${weightTrend.weeklyChange > 0 ? '+' : ''}${weightTrend.weeklyChange.toFixed(1)} kg`
                  : '--'
                }
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.colors.textSecondary }]}>weekly</Text>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: theme.colors.primary }]}>
                {bmi ? bmi.toFixed(1) : '--'}
              </Text>
              <Text style={[styles.heroStatLabel, { color: theme.colors.textSecondary }]}>BMI</Text>
            </View>
          </View>

          {/* Trend Indicator */}
          <View style={styles.trendIndicator}>
            <Ionicons 
              name={getTrendIcon() as any} 
              size={16} 
              color={getTrendColor()} 
            />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {weightTrend?.trend === 'stable' ? 'Weight stable' :
               weightTrend?.trend === 'up' ? 'Weight increasing' :
               weightTrend?.trend === 'down' ? 'Weight decreasing' : 'No trend data'}
            </Text>
          </View>
        </View>

        {/* Quick Weight Input */}
        {showWeightInput && (
          <View style={[styles.inputSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Log Today's Weight</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Weight (kg)</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.card, 
                    color: theme.colors.text,
                    borderColor: theme.colors.border 
                  }]}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  placeholder="70.5"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="decimal-pad"
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddWeight}
              >
                <Text style={[styles.saveButtonText, { color: theme.colors.buttonText }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* BMI Card */}
        {bmi && (
          <View style={[styles.bmiSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Body Mass Index</Text>
            
            <View style={styles.bmiContent}>
              <View style={styles.bmiValue}>
                <Text style={[styles.bmiNumber, { color: theme.colors.text }]}>{bmi.toFixed(1)}</Text>
                <Text style={[styles.bmiCategory, { color: getBMICategory(bmi).color }]}>
                  {getBMICategory(bmi).category}
                </Text>
              </View>
              
              <View style={styles.bmiScale}>
                <View style={[styles.bmiBar, { backgroundColor: theme.colors.card }]}>
                  <View 
                    style={[
                      styles.bmiIndicator, 
                      { 
                        backgroundColor: getBMICategory(bmi).color,
                        left: `${Math.min(Math.max((bmi - 15) / 25 * 100, 0), 100)}%`
                      }
                    ]} 
                  />
                </View>
                <View style={styles.bmiLabels}>
                  <Text style={[styles.bmiScaleText, { color: theme.colors.textTertiary }]}>15</Text>
                  <Text style={[styles.bmiScaleText, { color: theme.colors.textTertiary }]}>25</Text>
                  <Text style={[styles.bmiScaleText, { color: theme.colors.textTertiary }]}>40</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Weight Chart */}
        <View style={[styles.chartSection, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Weight Trend</Text>
          <WeightChart />
        </View>

        {/* Goal Progress */}
        {goalProgress?.weight && (
          <View style={[styles.goalSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Goal Progress</Text>
            
            <View style={styles.goalContent}>
              <View style={styles.goalStats}>
                <View style={styles.goalStatItem}>
                  <Text style={[styles.goalStatValue, { color: theme.colors.text }]}>
                    {goalProgress.weight.current.toFixed(1)} kg
                  </Text>
                  <Text style={[styles.goalStatLabel, { color: theme.colors.textSecondary }]}>Current</Text>
                </View>
                
                <View style={styles.goalStatItem}>
                  <Text style={[styles.goalStatValue, { color: theme.colors.primary }]}>
                    {goalProgress.weight.target.toFixed(1)} kg
                  </Text>
                  <Text style={[styles.goalStatLabel, { color: theme.colors.textSecondary }]}>Target</Text>
                </View>
                
                <View style={styles.goalStatItem}>
                  <Text style={[styles.goalStatValue, { color: theme.colors.error }]}>
                    {goalProgress.weight.remaining.toFixed(1)} kg
                  </Text>
                  <Text style={[styles.goalStatLabel, { color: theme.colors.textSecondary }]}>Remaining</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: theme.colors.card }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${goalProgress.weight.percentComplete}%`,
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                  {goalProgress.weight.percentComplete.toFixed(1)}% complete
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Entries */}
        <View style={[styles.historySection, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Entries</Text>
            <Text style={[styles.entryCount, { color: theme.colors.textSecondary }]}>
              {recentEntries.length} entries
            </Text>
          </View>

          {recentEntries.length > 0 ? (
            <View style={styles.entriesList}>
              {recentEntries.slice(0, 10).map((entry, index) => (
                <View key={entry.date} style={[styles.entryItem, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.entryInfo}>
                    <Text style={[styles.entryDate, { color: theme.colors.text }]}>
                      {format(parseISO(entry.date), 'MMM d, yyyy')}
                    </Text>
                    <Text style={[styles.entryTime, { color: theme.colors.textSecondary }]}>
                      {formatTimestamp(entry.timestamp)}
                    </Text>
                  </View>
                  
                  <Text style={[styles.entryWeight, { color: theme.colors.primary }]}>
                    {entry.weight.toFixed(1)} kg
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="scale-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
                No weight entries yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>
                Tap the + button to log your first weight
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
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
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Input Section
  inputSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
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
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // BMI Section
  bmiSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bmiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  bmiValue: {
    alignItems: 'center',
  },
  bmiNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  bmiCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  bmiScale: {
    flex: 1,
  },
  bmiBar: {
    height: 8,
    borderRadius: 4,
    position: 'relative',
    marginBottom: 8,
  },
  bmiIndicator: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 12,
    borderRadius: 2,
  },
  bmiLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bmiScaleText: {
    fontSize: 10,
  },

  // Chart Section
  chartSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  chartPlaceholder: {
    height: 200,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  chartPlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Goal Section
  goalSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalContent: {
    gap: 16,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  goalStatItem: {
    alignItems: 'center',
  },
  goalStatValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  goalStatLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },

  // History Section
  historySection: {
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
  entryCount: {
    fontSize: 14,
  },
  entriesList: {
    gap: 0,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  entryInfo: {
    flex: 1,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
  },
  entryWeight: {
    fontSize: 18,
    fontWeight: '700',
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
});

export default WeightTrackingScreen;