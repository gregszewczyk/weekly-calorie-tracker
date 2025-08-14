import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieProgressRingProps {
  consumed: number;
  target: number;
  animated?: boolean;
  size?: number;
}

const CalorieProgressRing: React.FC<CalorieProgressRingProps> = ({
  consumed,
  target,
  animated = true,
  size = 200,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const circleRef = useRef<any>(null);
  
  const radius = (size - 20) / 2;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / target, 1.2); // Allow 120% for over-consumption
  
  // Calculate color based on progress
  const getProgressColor = (): string => {
    if (progress < 0.9) return '#4CAF50'; // Green - under target
    if (progress <= 1.0) return '#FF9800'; // Orange - near target
    return '#F44336'; // Red - over target
  };

  const getProgressGradient = (): { start: string; end: string } => {
    if (progress < 0.9) return { start: '#66BB6A', end: '#4CAF50' };
    if (progress <= 1.0) return { start: '#FFB74D', end: '#FF9800' };
    return { start: '#EF5350', end: '#F44336' };
  };

  const remaining = target - consumed;
  const remainingText = remaining > 0 ? `${Math.round(remaining)} left` : `${Math.round(Math.abs(remaining))} over`;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(progress);
    }
  }, [progress, animated]);

  useEffect(() => {
    if (circleRef.current) {
      const strokeDashoffset = circumference * (1 - progress);
      
      if (animated) {
        animatedValue.addListener(({ value }) => {
          const offset = circumference * (1 - value);
          circleRef.current?.setNativeProps({
            strokeDashoffset: offset,
          });
        });
      } else {
        circleRef.current.setNativeProps({
          strokeDashoffset: strokeDashoffset,
        });
      }
    }

    return () => {
      animatedValue.removeAllListeners();
    };
  }, [circumference, animated]);

  const gradientColors = getProgressGradient();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors.start} />
            <Stop offset="100%" stopColor={gradientColors.end} />
          </LinearGradient>
        </Defs>
        
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E0E0E0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <AnimatedCircle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      <View style={styles.centerContent}>
        <Text style={styles.consumedText}>{Math.round(consumed)}</Text>
        <Text style={styles.targetText}>of {Math.round(target)}</Text>
        <Text style={styles.caloriesLabel}>calories</Text>
        <Text style={[styles.remainingText, { color: getProgressColor() }]}>
          {remainingText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consumedText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  targetText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CalorieProgressRing;
