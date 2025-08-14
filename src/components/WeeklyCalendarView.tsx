import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useThemedStyles, useTheme } from '../contexts/ThemeContext';
import { DailyCalorieData } from '../types/CalorieTypes';
import { useCalorieStore } from '../stores/calorieStore';

interface WeeklyCalendarViewProps {
  weeklyData: DailyCalorieData[];
  weekStartDate: string;
  onDayPress?: (date: string, dayData: DailyCalorieData | null) => void;
  showLocked?: boolean;
}

interface DayStatus {
  date: string;
  dayName: string;
  dayNumber: number;
  consumed: number;
  target: number;
  burned: number;
  netConsumed: number;
  status: 'on-track' | 'over-budget' | 'under-budget' | 'no-data';
  isToday: boolean;
  isPast: boolean;
}

const { width } = Dimensions.get('window');
const dayWidth = (width - 60) / 7; // Account for padding and gaps

const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({
  weeklyData,
  weekStartDate,
  onDayPress,
  showLocked = true,
}) => {
  const { theme } = useTheme();
  const { getLockedDailyTarget } = useCalorieStore();
  const today = new Date();

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.dark ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
      title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 16,
        textAlign: 'center',
      },
      weekContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
      },
      dayCard: {
        width: dayWidth,
        aspectRatio: 1,
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
      },
      todayCard: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
      },
      onTrackCard: {
        backgroundColor: theme.dark ? '#1B4332' : '#D4F1D4',
      },
      overBudgetCard: {
        backgroundColor: theme.dark ? '#5C1A1A' : '#FFEBEE',
      },
      underBudgetCard: {
        backgroundColor: theme.dark ? '#1A237E' : '#E3F2FD',
      },
      noDataCard: {
        backgroundColor: theme.colors.surface,
      },
      dayName: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: 2,
        textTransform: 'uppercase',
      },
      dayNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
      },
      calorieText: {
        fontSize: 9,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 12,
      },
      onTrackText: {
        color: theme.dark ? '#4ADE80' : '#16A34A',
      },
      overBudgetText: {
        color: theme.dark ? '#F87171' : '#DC2626',
      },
      underBudgetText: {
        color: theme.dark ? '#60A5FA' : '#2563EB',
      },
      noDataText: {
        color: theme.colors.textTertiary,
      },
      statusIndicator: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
      },
      onTrackIndicator: {
        backgroundColor: theme.dark ? '#22C55E' : '#16A34A',
      },
      overBudgetIndicator: {
        backgroundColor: theme.dark ? '#EF4444' : '#DC2626',
      },
      underBudgetIndicator: {
        backgroundColor: theme.dark ? '#3B82F6' : '#2563EB',
      },
      legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
      },
      legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 4,
      },
      legendText: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        fontWeight: '500',
      },
    })
  );

  // Generate 7 days starting from Monday
  const generateWeekDays = (): DayStatus[] => {
    const weekStart = startOfWeek(new Date(weekStartDate), { weekStartsOn: 1 });
    const days: DayStatus[] = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(weekStart, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayData = weeklyData.find(d => d.date === dateStr);
      
      const consumed = dayData?.consumed || 0;
      const burned = dayData?.burned || 0;
      const netConsumed = consumed - burned;
      
      // Use locked daily target if available, otherwise fall back to stored target
      const lockedTarget = getLockedDailyTarget(dateStr);
      const target = lockedTarget || dayData?.target || 0;
      
      // Determine status based on consumed calories vs target (not net)
      let status: DayStatus['status'] = 'no-data';
      if (dayData && target > 0 && consumed > 0) {
        const deviation = consumed - target;
        
        if (deviation > 0) {
          // Any amount over target is over-budget
          status = 'over-budget';
        } else {
          // Under target - use 10% threshold for on-track vs under-budget
          const thresholdPercent = 0.1; // 10% threshold
          const threshold = target * thresholdPercent;
          
          if (Math.abs(deviation) <= threshold) {
            status = 'on-track';
          } else {
            status = 'under-budget';
          }
        }
      }

      days.push({
        date: dateStr,
        dayName: format(currentDate, 'EEE'),
        dayNumber: currentDate.getDate(),
        consumed,
        target,
        burned,
        netConsumed,
        status,
        isToday: isSameDay(currentDate, today),
        isPast: currentDate < today,
      });
    }

    return days;
  };

  const weekDays = generateWeekDays();

  const getCardStyle = (day: DayStatus) => {
    let cardStyle = { ...styles.dayCard };
    
    if (day.isToday) {
      cardStyle = { ...cardStyle, ...styles.todayCard };
    }
    
    switch (day.status) {
      case 'on-track':
        cardStyle = { ...cardStyle, ...styles.onTrackCard };
        break;
      case 'over-budget':
        cardStyle = { ...cardStyle, ...styles.overBudgetCard };
        break;
      case 'under-budget':
        cardStyle = { ...cardStyle, ...styles.underBudgetCard };
        break;
      default:
        cardStyle = { ...cardStyle, ...styles.noDataCard };
        break;
    }
    
    return cardStyle;
  };

  const getTextStyle = (day: DayStatus) => {
    let textStyle = { ...styles.calorieText };
    
    switch (day.status) {
      case 'on-track':
        textStyle = { ...textStyle, ...styles.onTrackText };
        break;
      case 'over-budget':
        textStyle = { ...textStyle, ...styles.overBudgetText };
        break;
      case 'under-budget':
        textStyle = { ...textStyle, ...styles.underBudgetText };
        break;
      default:
        textStyle = { ...textStyle, ...styles.noDataText };
        break;
    }
    
    return textStyle;
  };

  const getIndicatorStyle = (day: DayStatus) => {
    let indicatorStyle = { ...styles.statusIndicator };
    
    switch (day.status) {
      case 'on-track':
        indicatorStyle = { ...indicatorStyle, ...styles.onTrackIndicator };
        break;
      case 'over-budget':
        indicatorStyle = { ...indicatorStyle, ...styles.overBudgetIndicator };
        break;
      case 'under-budget':
        indicatorStyle = { ...indicatorStyle, ...styles.underBudgetIndicator };
        break;
      default:
        return null;
    }
    
    return indicatorStyle;
  };

  const handleDayPress = (day: DayStatus) => {
    if (onDayPress) {
      const dayData = weeklyData.find(d => d.date === day.date) || null;
      onDayPress(day.date, dayData);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Progress</Text>
      
      <View style={styles.weekContainer}>
        {weekDays.map((day) => (
          <TouchableOpacity
            key={day.date}
            style={getCardStyle(day)}
            onPress={() => handleDayPress(day)}
            activeOpacity={0.7}
          >
            {/* Status indicator dot */}
            {day.status !== 'no-data' && (
              <View style={getIndicatorStyle(day)} />
            )}
            
            <Text style={styles.dayName}>{day.dayName}</Text>
            <Text style={styles.dayNumber}>{day.dayNumber}</Text>
            
            {day.status !== 'no-data' ? (
              <Text style={getTextStyle(day)}>
                {Math.round(day.consumed)}/{Math.round(day.target)}
              </Text>
            ) : (
              <Text style={getTextStyle(day)}>—</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.onTrackIndicator]} />
          <Text style={styles.legendText}>On Track</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.underBudgetIndicator]} />
          <Text style={styles.legendText}>Under Budget</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.overBudgetIndicator]} />
          <Text style={styles.legendText}>Over Budget</Text>
        </View>
      </View>
    </View>
  );
};

export default WeeklyCalendarView;