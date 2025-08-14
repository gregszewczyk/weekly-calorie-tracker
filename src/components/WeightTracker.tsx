import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { WeightEntry, WeightTrend } from '../types/GoalTypes';

interface WeightTrackerProps {
  weightEntries: WeightEntry[];
  onAddWeight: (weight: number) => void;
  onWeightTrendUpdate?: (trend: WeightTrend) => void;
}

const WeightTracker: React.FC<WeightTrackerProps> = ({
  weightEntries,
  onAddWeight,
  onWeightTrendUpdate,
}) => {
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [weightTrend, setWeightTrend] = useState<WeightTrend | null>(null);

  // Calculate weight trend whenever entries change
  useEffect(() => {
    const trend = calculateWeightTrend(weightEntries);
    setWeightTrend(trend);
    if (trend && onWeightTrendUpdate) {
      onWeightTrendUpdate(trend);
    }
  }, [weightEntries, onWeightTrendUpdate]);

  const calculateWeightTrend = (entries: WeightEntry[]): WeightTrend | null => {
    if (entries.length === 0) return null;

    // Sort entries by date (most recent first)
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const current = sortedEntries[0]?.weight || 0;

    // Calculate 7-day average
    const last7Days = sortedEntries.slice(0, 7);
    const sevenDayAverage = last7Days.length > 0 
      ? last7Days.reduce((sum, entry) => sum + entry.weight, 0) / last7Days.length
      : current;

    // Calculate weekly change (comparing current to 7 days ago)
    let weeklyChange = 0;
    if (sortedEntries.length >= 7) {
      const weekAgoWeight = sortedEntries[6].weight;
      weeklyChange = current - weekAgoWeight;
    } else if (sortedEntries.length >= 2) {
      // If less than 7 days, compare to oldest available
      const oldestWeight = sortedEntries[sortedEntries.length - 1].weight;
      weeklyChange = current - oldestWeight;
    }

    // Determine trend direction
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

  const handleAddWeight = () => {
    const weight = parseFloat(currentWeight);
    
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    if (weight < 50 || weight > 500) {
      Alert.alert('Error', 'Please enter a realistic weight (50-500 lbs)');
      return;
    }

    onAddWeight(weight);
    setCurrentWeight('');
    Alert.alert('Success', 'Weight recorded!');
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'stable': return '→';
      default: return '→';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '#FF6B6B';
      case 'down': return '#51CF66';
      case 'stable': return '#339AF0';
      default: return '#666';
    }
  };

  const formatWeight = (weight: number): string => {
    return weight.toFixed(1);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get last 7 entries for history display
  const recentEntries = [...weightEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight Tracker</Text>

      {/* Current Weight Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Today's Weight (lbs)</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.weightInput}
            value={currentWeight}
            onChangeText={setCurrentWeight}
            placeholder="Enter weight"
            keyboardType="decimal-pad"
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddWeight}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weight Trend Display */}
      {weightTrend && (
        <View style={styles.trendSection}>
          <View style={styles.trendRow}>
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Current</Text>
              <Text style={styles.trendValue}>{formatWeight(weightTrend.current)} lbs</Text>
            </View>
            
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>7-Day Avg</Text>
              <Text style={styles.trendValue}>{formatWeight(weightTrend.sevenDayAverage)} lbs</Text>
            </View>
            
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Trend</Text>
              <View style={styles.trendDisplay}>
                <Text 
                  style={[
                    styles.trendIcon, 
                    { color: getTrendColor(weightTrend.trend) }
                  ]}
                >
                  {getTrendIcon(weightTrend.trend)}
                </Text>
                <Text 
                  style={[
                    styles.trendChange,
                    { color: getTrendColor(weightTrend.trend) }
                  ]}
                >
                  {weightTrend.weeklyChange >= 0 ? '+' : ''}{formatWeight(weightTrend.weeklyChange)} lbs
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Weight History */}
      {recentEntries.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recent Entries</Text>
          <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
            {recentEntries.map((entry, index) => (
              <View style={styles.historyItem} key={`${entry.date}-${index}`}>
                <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
                <Text style={styles.historyWeight}>{formatWeight(entry.weight)} lbs</Text>
                {index === 0 && <Text style={styles.todayLabel}>Today</Text>}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {recentEntries.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No weight entries yet</Text>
          <Text style={styles.emptySubtext}>Add your first weight to start tracking</Text>
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
  weightInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    backgroundColor: '#f9f9f9',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#339AF0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  trendSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trendItem: {
    alignItems: 'center',
    flex: 1,
  },
  trendLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  trendValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  trendDisplay: {
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  trendChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  historySection: {
    marginTop: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  historyList: {
    maxHeight: 150,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 6,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  historyWeight: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  todayLabel: {
    fontSize: 12,
    color: '#339AF0',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});

export default WeightTracker;
