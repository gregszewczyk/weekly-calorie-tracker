import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface WaterIntakeTrackerProps {
  currentIntake: number; // glasses consumed
  dailyTarget?: number; // target glasses per day
  onUpdate: (glasses: number) => void;
}

const WaterIntakeTracker: React.FC<WaterIntakeTrackerProps> = ({
  currentIntake,
  dailyTarget = 8,
  onUpdate,
}) => {
  const animatedValues = useRef(
    Array.from({ length: dailyTarget }, () => new Animated.Value(0))
  ).current;

  const glassSize = 32;
  const glassSpacing = 8;

  // Create SVG path for glass shape
  const createGlassPath = (filled: boolean = false): string => {
    const width = glassSize * 0.7;
    const height = glassSize * 0.9;
    const topWidth = width * 0.8;
    const bottomWidth = width * 0.6;
    
    // Glass outline
    const path = `
      M ${(glassSize - topWidth) / 2} ${glassSize * 0.1}
      L ${(glassSize + topWidth) / 2} ${glassSize * 0.1}
      L ${(glassSize + bottomWidth) / 2} ${glassSize * 0.9}
      L ${(glassSize - bottomWidth) / 2} ${glassSize * 0.9}
      Z
    `;
    
    return path;
  };

  const createWaterPath = (fillLevel: number): string => {
    const width = glassSize * 0.7;
    const topWidth = width * 0.8;
    const bottomWidth = width * 0.6;
    
    // Calculate water level (0 to 1)
    const waterHeight = (glassSize * 0.8) * fillLevel;
    const waterTop = glassSize * 0.9 - waterHeight;
    
    // Calculate water width at current level (linear interpolation)
    const progress = fillLevel;
    const waterWidthAtLevel = bottomWidth + (topWidth - bottomWidth) * (1 - progress);
    
    const path = `
      M ${(glassSize - bottomWidth) / 2} ${glassSize * 0.9}
      L ${(glassSize + bottomWidth) / 2} ${glassSize * 0.9}
      L ${(glassSize + waterWidthAtLevel) / 2} ${waterTop}
      L ${(glassSize - waterWidthAtLevel) / 2} ${waterTop}
      Z
    `;
    
    return path;
  };

  useEffect(() => {
    animatedValues.forEach((animatedValue, index) => {
      const shouldFill = index < currentIntake;
      Animated.timing(animatedValue, {
        toValue: shouldFill ? 1 : 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: false,
      }).start();
    });
  }, [currentIntake]);

  const handleGlassPress = (index: number) => {
    const newIntake = index < currentIntake ? index : index + 1;
    onUpdate(Math.max(0, Math.min(newIntake, dailyTarget)));
  };

  const AnimatedGlass: React.FC<{ index: number; filled: boolean }> = ({ index, filled }) => {
    const animatedValue = animatedValues[index];
    
    return (
      <TouchableOpacity
        style={styles.glassContainer}
        onPress={() => handleGlassPress(index)}
        activeOpacity={0.7}
      >
        <Animated.View style={{ 
          transform: [{ scale: animatedValue }],
          opacity: filled ? 1 : 0.3 
        }}>
          <Svg width={glassSize} height={glassSize}>
            <Defs>
              <LinearGradient id={`waterGradient${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#64B5F6" />
                <Stop offset="50%" stopColor="#2196F3" />
                <Stop offset="100%" stopColor="#1976D2" />
              </LinearGradient>
            </Defs>
            
            {/* Water fill */}
            {filled && (
              <Path
                d={createWaterPath(1)}
                fill={`url(#waterGradient${index})`}
              />
            )}
          </Svg>
        </Animated.View>
        
        {/* Glass outline - always visible */}
        <Svg 
          width={glassSize} 
          height={glassSize} 
          style={StyleSheet.absoluteFill}
        >
          <Path
            d={createGlassPath()}
            fill="none"
            stroke={filled ? "#2196F3" : "#E0E0E0"}
            strokeWidth={2}
          />
        </Svg>
        
        {/* Glass number */}
        <Text style={[
          styles.glassNumber,
          { color: filled ? "#2196F3" : "#999" }
        ]}>
          {index + 1}
        </Text>
      </TouchableOpacity>
    );
  };

  const progressPercentage = Math.round((currentIntake / dailyTarget) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Water Intake</Text>
        <Text style={styles.progress}>
          {currentIntake} / {dailyTarget} glasses ({progressPercentage}%)
        </Text>
      </View>
      
      <View style={styles.glassesContainer}>
        {Array.from({ length: dailyTarget }, (_, index) => (
          <AnimatedGlass
            key={index}
            index={index}
            filled={index < currentIntake}
          />
        ))}
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, currentIntake === 0 && styles.controlButtonDisabled]}
          onPress={() => onUpdate(Math.max(0, currentIntake - 1))}
          disabled={currentIntake === 0}
        >
          <Text style={[styles.controlButtonText, currentIntake === 0 && styles.controlButtonTextDisabled]}>
            - Remove
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, currentIntake >= dailyTarget && styles.controlButtonDisabled]}
          onPress={() => onUpdate(Math.min(dailyTarget, currentIntake + 1))}
          disabled={currentIntake >= dailyTarget}
        >
          <Text style={[styles.controlButtonText, currentIntake >= dailyTarget && styles.controlButtonTextDisabled]}>
            + Add Glass
          </Text>
        </TouchableOpacity>
      </View>
      
      {currentIntake >= dailyTarget && (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>🎉 Daily goal achieved!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    margin: 8,
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
  progress: {
    fontSize: 14,
    color: '#666',
  },
  glassesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  glassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    position: 'relative',
  },
  glassNumber: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
    bottom: -16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  controlButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  controlButtonTextDisabled: {
    color: '#999',
  },
  completedContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    alignItems: 'center',
  },
  completedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default WaterIntakeTracker;
