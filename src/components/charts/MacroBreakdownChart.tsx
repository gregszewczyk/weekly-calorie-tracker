import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface MacroData {
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroTargets {
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroBreakdownChartProps {
  macros: MacroData;
  targets: MacroTargets;
  animated?: boolean;
}

const MacroBreakdownChart: React.FC<MacroBreakdownChartProps> = ({
  macros,
  targets,
  animated = true,
}) => {
  const proteinAnimatedValue = useRef(new Animated.Value(0)).current;
  const carbsAnimatedValue = useRef(new Animated.Value(0)).current;
  const fatAnimatedValue = useRef(new Animated.Value(0)).current;

  const proteinRef = useRef<any>(null);
  const carbsRef = useRef<any>(null);
  const fatRef = useRef<any>(null);

  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Calculate progress percentages
  const proteinProgress = Math.min(macros.protein / targets.protein, 1);
  const carbsProgress = Math.min(macros.carbs / targets.carbs, 1);
  const fatProgress = Math.min(macros.fat / targets.fat, 1);

  // Create semi-circular path
  const createSemiCirclePath = (progress: number, startAngle: number = 0): string => {
    const angle = Math.PI * progress; // Semi-circle is 180 degrees
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(startAngle + angle);
    const y2 = centerY + radius * Math.sin(startAngle + angle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  const updateProgress = (animatedValue: Animated.Value, ref: any, progress: number, startAngle: number) => {
    if (animated) {
      animatedValue.addListener(({ value }) => {
        const path = createSemiCirclePath(value, startAngle);
        ref.current?.setNativeProps({ d: path });
      });
    } else {
      const path = createSemiCirclePath(progress, startAngle);
      ref.current?.setNativeProps({ d: path });
    }
  };

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(proteinAnimatedValue, {
          toValue: proteinProgress,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(carbsAnimatedValue, {
          toValue: carbsProgress,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(fatAnimatedValue, {
          toValue: fatProgress,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      proteinAnimatedValue.setValue(proteinProgress);
      carbsAnimatedValue.setValue(carbsProgress);
      fatAnimatedValue.setValue(fatProgress);
    }
  }, [proteinProgress, carbsProgress, fatProgress, animated]);

  useEffect(() => {
    updateProgress(proteinAnimatedValue, proteinRef, proteinProgress, Math.PI);
    updateProgress(carbsAnimatedValue, carbsRef, carbsProgress, Math.PI);
    updateProgress(fatAnimatedValue, fatRef, fatProgress, Math.PI);

    return () => {
      proteinAnimatedValue.removeAllListeners();
      carbsAnimatedValue.removeAllListeners();
      fatAnimatedValue.removeAllListeners();
    };
  }, [proteinProgress, carbsProgress, fatProgress]);

  const MacroIndicator: React.FC<{
    label: string;
    current: number;
    target: number;
    color: string;
    percentage: number;
  }> = ({ label, current, target, color, percentage }) => (
    <View style={styles.macroIndicator}>
      <View style={[styles.macroColorDot, { backgroundColor: color }]} />
      <View style={styles.macroTextContainer}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValues}>
          {Math.round(current)}g / {Math.round(target)}g
        </Text>
        <Text style={[styles.macroPercentage, { color }]}>
          {Math.round(percentage * 100)}%
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size / 2 + 20} style={styles.svg}>
          <Defs>
            <LinearGradient id="proteinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FF5722" />
              <Stop offset="100%" stopColor="#FF8A65" />
            </LinearGradient>
            <LinearGradient id="carbsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#2196F3" />
              <Stop offset="100%" stopColor="#64B5F6" />
            </LinearGradient>
            <LinearGradient id="fatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#4CAF50" />
              <Stop offset="100%" stopColor="#81C784" />
            </LinearGradient>
          </Defs>

          {/* Background semi-circles */}
          <Path
            d={createSemiCirclePath(1, Math.PI)}
            fill="none"
            stroke="#F5F5F5"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Protein progress */}
          <AnimatedPath
            ref={proteinRef}
            d={createSemiCirclePath(proteinProgress, Math.PI)}
            fill="none"
            stroke="url(#proteinGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Carbs progress (offset) */}
          <AnimatedPath
            ref={carbsRef}
            d={createSemiCirclePath(carbsProgress, Math.PI)}
            fill="none"
            stroke="url(#carbsGradient)"
            strokeWidth={strokeWidth - 4}
            strokeLinecap="round"
            transform={`translate(0, ${strokeWidth + 2})`}
          />
          
          {/* Fat progress (offset) */}
          <AnimatedPath
            ref={fatRef}
            d={createSemiCirclePath(fatProgress, Math.PI)}
            fill="none"
            stroke="url(#fatGradient)"
            strokeWidth={strokeWidth - 8}
            strokeLinecap="round"
            transform={`translate(0, ${(strokeWidth + 2) * 2})`}
          />
        </Svg>
      </View>

      <View style={styles.legendContainer}>
        <MacroIndicator
          label="Protein"
          current={macros.protein}
          target={targets.protein}
          color="#FF5722"
          percentage={proteinProgress}
        />
        <MacroIndicator
          label="Carbs"
          current={macros.carbs}
          target={targets.carbs}
          color="#2196F3"
          percentage={carbsProgress}
        />
        <MacroIndicator
          label="Fat"
          current={macros.fat}
          target={targets.fat}
          color="#4CAF50"
          percentage={fatProgress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  chartContainer: {
    marginBottom: 20,
  },
  svg: {
    overflow: 'visible',
  },
  legendContainer: {
    width: '100%',
  },
  macroIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  macroColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  macroTextContainer: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  macroValues: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  macroPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MacroBreakdownChart;
