import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useCalorieStore } from '../stores/calorieStore';
import { WeightEntry, WeightTrend } from '../types/GoalTypes';
import { useThemedStyles, useTheme } from '../contexts/ThemeContext';
import { format, subDays, parseISO } from 'date-fns';

const { width } = Dimensions.get('window');

interface MorningWeightCheckinProps {
  onWeightLogged?: (weight: number, trend: WeightTrend | null) => void;
  showChart?: boolean;
  compact?: boolean;
}

const MorningWeightCheckin: React.FC<MorningWeightCheckinProps> = ({
  onWeightLogged,
  showChart = true,
  compact = false,
}) => {
  const { theme } = useTheme();
  const { addWeightEntry, weightEntries } = useCalorieStore();
  
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [weightTrend, setWeightTrend] = useState<WeightTrend | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: compact ? 16 : 24,
        marginBottom: 16,
        ...Platform.select({
          ios: {
            shadowColor: theme.dark ? '#000' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: theme.dark ? 0.3 : 0.1,
            shadowRadius: 12,
          },
          android: {
            elevation: 6,
          },
        }),
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: compact ? 16 : 20,
      },
      headerIcon: {
        fontSize: 28,
        marginRight: 12,
      },
      title: {
        fontSize: compact ? 18 : 22,
        fontWeight: '700',
        color: theme.colors.text,
        flex: 1,
      },
      subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: compact ? 12 : 16,
      },
      inputSection: {
        marginBottom: compact ? 16 : 20,
      },
      inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.inputBackground,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: theme.colors.inputBorder,
      },
      weightInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: '600',
        color: theme.colors.text,
        paddingVertical: 12,
        textAlign: 'center',
      },
      unitText: {
        fontSize: 18,
        color: theme.colors.textSecondary,
        fontWeight: '500',
        marginLeft: 8,
      },
      logButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginTop: 12,
      },
      logButtonDisabled: {
        backgroundColor: theme.colors.textTertiary,
      },
      logButtonText: {
        color: theme.colors.buttonText,
        fontSize: 16,
        fontWeight: '600',
      },
      trendSection: {
        marginBottom: compact ? 12 : 16,
        padding: 16,
        backgroundColor: theme.dark ? '#1A1A2E' : '#F8F9FA',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
      },
      trendRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      trendItem: {
        alignItems: 'center',
        flex: 1,
      },
      trendLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: 0.5,
      },
      trendValue: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 2,
      },
      trendChange: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
      },
      trendIcon: {
        fontSize: 24,
        marginBottom: 4,
      },
      chartContainer: {
        marginTop: compact ? 12 : 16,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: theme.dark ? '#16213E' : '#FFFFFF',
        padding: 8,
      },
      chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 12,
      },
      emptyChart: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
      },
      emptyChartText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginBottom: 4,
      },
      emptyChartSubtext: {
        fontSize: 14,
        color: theme.colors.textTertiary,
      },
      quickStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      quickStatItem: {
        alignItems: 'center',
      },
      quickStatValue: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 2,
      },
      quickStatLabel: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        textAlign: 'center',
      },
    })
  );

  // Calculate weight trend whenever entries change
  useEffect(() => {
    const trend = calculateWeightTrend(weightEntries);
    setWeightTrend(trend);
  }, [weightEntries]);

  const calculateWeightTrend = (entries: WeightEntry[]): WeightTrend | null => {
    if (entries.length === 0) return null;

    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const current = sortedEntries[0]?.weight || 0;
    const last7Days = sortedEntries.slice(0, 7);
    const sevenDayAverage = last7Days.length > 0 
      ? last7Days.reduce((sum, entry) => sum + entry.weight, 0) / last7Days.length
      : current;

    let weeklyChange = 0;
    if (sortedEntries.length >= 7) {
      const weekAgoWeight = sortedEntries[6].weight;
      weeklyChange = current - weekAgoWeight;
    } else if (sortedEntries.length >= 2) {
      const oldestWeight = sortedEntries[sortedEntries.length - 1].weight;
      weeklyChange = current - oldestWeight;
    }

    let trend: 'up' | 'down' | 'stable';
    if (weeklyChange > 0.5) {
      trend = 'up';
    } else if (weeklyChange < -0.5) {
      trend = 'down';
    } else {
      trend = 'stable';
    }

    return {
      current,
      sevenDayAverage,
      trend,
      weeklyChange,
    };
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '📊';
      default: return '📊';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '#FF6B6B';
      case 'down': return '#51CF66';
      case 'stable': return '#339AF0';
      default: return theme.colors.textSecondary;
    }
  };

  const handleLogWeight = async () => {
    const weight = parseFloat(currentWeight);
    
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight');
      return;
    }

    if (weight < 30 || weight > 300) {
      Alert.alert('Invalid Weight', 'Please enter a realistic weight (30-300 kg)');
      return;
    }

    setIsLoading(true);
    
    try {
      addWeightEntry(weight);
      const newTrend = calculateWeightTrend([...weightEntries, {
        date: format(new Date(), 'yyyy-MM-dd'),
        weight,
        timestamp: new Date(),
      }]);
      
      setCurrentWeight('');
      
      if (onWeightLogged) {
        onWeightLogged(weight, newTrend);
      }
      
      Alert.alert('Weight Logged! 🎉', `Your weight (${weight.toFixed(1)} kg) has been recorded for today.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to log weight. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (weightEntries.length < 2) return null;

    // Get last 14 entries for chart
    const recentEntries = [...weightEntries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14);

    const weights = recentEntries.map(entry => entry.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightRange = maxWeight - minWeight || 1;
    
    return {
      entries: recentEntries,
      weights,
      minWeight: minWeight - (weightRange * 0.1),
      maxWeight: maxWeight + (weightRange * 0.1),
      weightRange: weightRange * 1.2
    };
  }, [weightEntries]);

  const todayEntry = weightEntries.find(entry => entry.date === format(new Date(), 'yyyy-MM-dd'));
  const hasLoggedToday = !!todayEntry;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>⚖️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Morning Weight Check-in</Text>
          <Text style={styles.subtitle}>
            {hasLoggedToday 
              ? `Today's weight: ${todayEntry.weight.toFixed(1)} kg` 
              : 'Track your daily progress'
            }
          </Text>
        </View>
      </View>

      {/* Weight Input (only show if not logged today) */}
      {!hasLoggedToday && (
        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.weightInput}
              value={currentWeight}
              onChangeText={setCurrentWeight}
              placeholder="Enter weight"
              keyboardType="decimal-pad"
              placeholderTextColor={theme.colors.textTertiary}
              maxLength={5}
            />
            <Text style={styles.unitText}>kg</Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.logButton, 
              (!currentWeight || isLoading) && styles.logButtonDisabled
            ]} 
            onPress={handleLogWeight}
            disabled={!currentWeight || isLoading}
          >
            <Text style={styles.logButtonText}>
              {isLoading ? 'Logging...' : 'Log Weight'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Weight Trend Display */}
      {weightTrend && (
        <View style={styles.trendSection}>
          <View style={styles.trendRow}>
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Current</Text>
              <Text style={styles.trendValue}>{weightTrend.current.toFixed(1)} kg</Text>
            </View>
            
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>7-Day Avg</Text>
              <Text style={styles.trendValue}>{weightTrend.sevenDayAverage.toFixed(1)} kg</Text>
            </View>
            
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Weekly Trend</Text>
              <Text style={styles.trendIcon}>{getTrendIcon(weightTrend.trend)}</Text>
              <Text 
                style={[
                  styles.trendChange,
                  { color: getTrendColor(weightTrend.trend) }
                ]}
              >
                {weightTrend.weeklyChange >= 0 ? '+' : ''}{weightTrend.weeklyChange.toFixed(1)} kg
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Chart Visualization */}
      {showChart && !compact && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Weight Trend (Last 2 Weeks)</Text>
          
          {chartData ? (
            <WeightTrendChart 
              data={chartData} 
              width={width - 80} 
              height={200} 
              theme={theme}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>Not enough data for chart</Text>
              <Text style={styles.emptyChartSubtext}>Log weight for 2+ days to see trend</Text>
            </View>
          )}
        </View>
      )}

      {/* Quick Stats */}
      {weightEntries.length > 0 && (
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{weightEntries.length}</Text>
            <Text style={styles.quickStatLabel}>Total Entries</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>
              {weightEntries.filter(entry => 
                new Date(entry.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
              ).length}
            </Text>
            <Text style={styles.quickStatLabel}>This Week</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>
              {weightEntries.length > 1 
                ? (Math.max(...weightEntries.map(e => e.weight)) - Math.min(...weightEntries.map(e => e.weight))).toFixed(1)
                : '0.0'
              }
            </Text>
            <Text style={styles.quickStatLabel}>Range (kg)</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Simple SVG-based Weight Trend Chart component
interface WeightTrendChartProps {
  data: {
    entries: WeightEntry[];
    weights: number[];
    minWeight: number;
    maxWeight: number;
    weightRange: number;
  };
  width: number;
  height: number;
  theme: any;
}

const WeightTrendChart: React.FC<WeightTrendChartProps> = ({ data, width, height, theme }) => {
  const padding = 40;
  const plotWidth = width - (padding * 2);
  const plotHeight = height - (padding * 2);
  
  const getX = (index: number): number => {
    return padding + (index * plotWidth) / Math.max(data.entries.length - 1, 1);
  };
  
  const getY = (weight: number): number => {
    const normalizedWeight = (weight - data.minWeight) / data.weightRange;
    return padding + plotHeight - (normalizedWeight * plotHeight);
  };
  
  // Create smooth path for weight trend
  const createPath = (): string => {
    if (data.weights.length === 0) return '';
    
    const points = data.weights.map((weight, index) => ({
      x: getX(index),
      y: getY(weight),
    }));
    
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const currentPoint = points[i];
      const prevPoint = points[i - 1];
      
      // Simple smooth curve using quadratic bezier
      const cpx = (prevPoint.x + currentPoint.x) / 2;
      const cpy = (prevPoint.y + currentPoint.y) / 2;
      
      if (i === 1) {
        path += ` Q ${cpx} ${cpy}, ${currentPoint.x} ${currentPoint.y}`;
      } else {
        path += ` T ${currentPoint.x} ${currentPoint.y}`;
      }
    }
    
    return path;
  };
  
  const pathData = createPath();
  
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0.05" />
        </LinearGradient>
      </Defs>
      
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((ratio) => {
        const y = padding + plotHeight * ratio;
        return (
          <Line
            key={ratio}
            x1={padding}
            y1={y}
            x2={padding + plotWidth}
            y2={y}
            stroke={theme.colors.borderLight}
            strokeWidth={1}
          />
        );
      })}
      
      {/* Weight trend line */}
      {pathData && (
        <Path
          d={pathData}
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      
      {/* Data points */}
      {data.weights.map((weight, index) => {
        const x = getX(index);
        const y = getY(weight);
        
        return (
          <Circle
            key={index}
            cx={x}
            cy={y}
            r={4}
            fill={theme.colors.primary}
            stroke={theme.colors.card}
            strokeWidth={2}
          />
        );
      })}
    </Svg>
  );
};

export default MorningWeightCheckin;