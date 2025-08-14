import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';

interface DayData {
  date: string; // YYYY-MM-DD
  actual: number;
  target: number;
  dayName: string; // Mon, Tue, etc.
}

interface WeeklyTrendChartProps {
  weeklyData: DayData[];
  showTarget?: boolean;
  interactive?: boolean;
}

const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({
  weeklyData,
  showTarget = true,
  interactive = true,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { width: screenWidth } = Dimensions.get('window');
  const chartWidth = Math.max(screenWidth - 32, 300);
  const chartHeight = 200;
  const padding = 40;
  const plotWidth = chartWidth - (padding * 2);
  const plotHeight = chartHeight - (padding * 2);

  // Calculate data bounds
  const allValues = weeklyData.flatMap(d => [d.actual, d.target]);
  const minValue = Math.min(...allValues) * 0.9;
  const maxValue = Math.max(...allValues) * 1.1;
  const valueRange = maxValue - minValue;

  // Helper functions
  const getX = (index: number): number => {
    return padding + (index * plotWidth) / Math.max(weeklyData.length - 1, 1);
  };

  const getY = (value: number): number => {
    const normalizedValue = (value - minValue) / valueRange;
    return padding + plotHeight - (normalizedValue * plotHeight);
  };

  // Create smooth curve path
  const createSmoothPath = (data: DayData[], useActual: boolean = true): string => {
    if (data.length === 0) return '';
    
    const points = data.map((d, index) => ({
      x: getX(index),
      y: getY(useActual ? d.actual : d.target),
    }));

    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      const nextPoint = points[i + 1];

      // Calculate control points for smooth curve
      const tension = 0.3;
      let cp1x = prevPoint.x;
      let cp1y = prevPoint.y;
      let cp2x = currentPoint.x;
      let cp2y = currentPoint.y;

      if (i > 1) {
        cp1x = prevPoint.x + (currentPoint.x - points[i - 2].x) * tension;
        cp1y = prevPoint.y + (currentPoint.y - points[i - 2].y) * tension;
      }

      if (nextPoint) {
        cp2x = currentPoint.x - (nextPoint.x - prevPoint.x) * tension;
        cp2y = currentPoint.y - (nextPoint.y - prevPoint.y) * tension;
      }

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${currentPoint.x} ${currentPoint.y}`;
    }

    return path;
  };

  // Create gradient fill path
  const createGradientPath = (data: DayData[]): string => {
    const actualPath = createSmoothPath(data, true);
    if (!actualPath) return '';

    const lastIndex = data.length - 1;
    const lastX = getX(lastIndex);
    const bottomY = getY(minValue);
    const firstX = getX(0);

    return `${actualPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [weeklyData]);

  const handleDayPress = (dayData: DayData, index: number) => {
    if (!interactive) return;
    
    // Animate to center the selected day
    const dayX = getX(index);
    const scrollX = Math.max(0, dayX - chartWidth / 2);
    
    scrollViewRef.current?.scrollTo({
      x: scrollX,
      animated: true,
    });
  };

  const actualPath = createSmoothPath(weeklyData, true);
  const targetPath = showTarget ? createSmoothPath(weeklyData, false) : '';
  const gradientPath = createGradientPath(weeklyData);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Calorie Trend</Text>
        <Text style={styles.subtitle}>Last 7 days</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        style={styles.scrollContainer}
      >
        <View style={[styles.chartContainer, { width: chartWidth }]}>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="actualGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#339AF0" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#339AF0" stopOpacity="0.05" />
              </LinearGradient>
              <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#1976D2" />
                <Stop offset="100%" stopColor="#339AF0" />
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
                  stroke="#F0F0F0"
                  strokeWidth={1}
                />
              );
            })}

            {/* Gradient fill under actual line */}
            {gradientPath && (
              <Path
                d={gradientPath}
                fill="url(#actualGradient)"
              />
            )}

            {/* Target line */}
            {showTarget && targetPath && (
              <Path
                d={targetPath}
                fill="none"
                stroke="#FFA726"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
            )}

            {/* Actual line */}
            {actualPath && (
              <Path
                d={actualPath}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {weeklyData.map((dayData, index) => {
              const x = getX(index);
              const actualY = getY(dayData.actual);
              const targetY = getY(dayData.target);

              return (
                <React.Fragment key={dayData.date}>
                  {/* Target point */}
                  {showTarget && (
                    <Circle
                      cx={x}
                      cy={targetY}
                      r={4}
                      fill="#FFA726"
                      stroke="white"
                      strokeWidth={2}
                    />
                  )}
                  
                  {/* Actual point */}
                  <Circle
                    cx={x}
                    cy={actualY}
                    r={6}
                    fill="#339AF0"
                    stroke="white"
                    strokeWidth={3}
                  />
                </React.Fragment>
              );
            })}
          </Svg>

          {/* Day labels and interactive areas */}
          <View style={styles.labelsContainer}>
            {weeklyData.map((dayData, index) => {
              const x = getX(index);
              const isToday = dayData.date === new Date().toISOString().split('T')[0];
              
              return (
                <TouchableOpacity
                  key={dayData.date}
                  style={[
                    styles.dayLabel,
                    { left: x - 20 },
                    isToday && styles.todayLabel,
                  ]}
                  onPress={() => handleDayPress(dayData, index)}
                  disabled={!interactive}
                >
                  <Text style={[
                    styles.dayText,
                    isToday && styles.todayText,
                  ]}>
                    {dayData.dayName}
                  </Text>
                  <Text style={[
                    styles.valueText,
                    isToday && styles.todayValueText,
                  ]}>
                    {Math.round(dayData.actual)}
                  </Text>
                  {showTarget && (
                    <Text style={styles.targetText}>
                      /{Math.round(dayData.target)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#339AF0' }]} />
          <Text style={styles.legendText}>Actual</Text>
        </View>
        {showTarget && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFA726' }]} />
            <Text style={styles.legendText}>Target</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  scrollContainer: {
    marginBottom: 16,
  },
  chartContainer: {
    position: 'relative',
  },
  labelsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dayLabel: {
    position: 'absolute',
    bottom: 0,
    width: 40,
    alignItems: 'center',
    paddingVertical: 8,
  },
  todayLabel: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  todayText: {
    color: '#1976D2',
  },
  valueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  todayValueText: {
    color: '#1976D2',
  },
  targetText: {
    fontSize: 11,
    color: '#999',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
});

export default WeeklyTrendChart;
