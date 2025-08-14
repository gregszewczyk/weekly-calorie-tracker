import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SportType } from '../types/AthleteTypes';

const { width } = Dimensions.get('window');

interface SportOption {
  type: SportType;
  name: string;
  icon: string;
  description: string;
  color: string;
  difficulty?: string;
}

interface SportSelectorProps {
  selectedSport?: SportType;
  onSportSelect: (sport: SportType) => void;
  title?: string;
  subtitle?: string;
  allowMultiple?: boolean;
  selectedSports?: SportType[];
  onMultipleSportsSelect?: (sports: SportType[]) => void;
  cardSize?: 'small' | 'medium' | 'large';
  columns?: number;
}

const SportSelector: React.FC<SportSelectorProps> = ({
  selectedSport,
  onSportSelect,
  title = 'Select Your Sport',
  subtitle = 'Choose your primary focus',
  allowMultiple = false,
  selectedSports = [],
  onMultipleSportsSelect,
  cardSize = 'medium',
  columns = 2,
}) => {
  const sportOptions: SportOption[] = [
    {
      type: 'running',
      name: 'Running',
      icon: '🏃‍♂️',
      description: 'Road, trail, track running',
      color: '#28a745',
      difficulty: 'Beginner Friendly',
    },
    {
      type: 'cycling',
      name: 'Cycling',
      icon: '🚴‍♂️',
      description: 'Road, mountain, track cycling',
      color: '#17a2b8',
      difficulty: 'All Levels',
    },
    {
      type: 'swimming',
      name: 'Swimming',
      icon: '🏊‍♀️',
      description: 'Pool, open water swimming',
      color: '#007bff',
      difficulty: 'Technical',
    },
    {
      type: 'crossfit',
      name: 'CrossFit',
      icon: '🏋️‍♀️',
      description: 'Functional fitness training',
      color: '#fd7e14',
      difficulty: 'High Intensity',
    },
    {
      type: 'hyrox',
      name: 'Hyrox',
      icon: '🔥',
      description: 'Fitness racing competition',
      color: '#dc3545',
      difficulty: 'Elite Level',
    },
    {
      type: 'triathlon',
      name: 'Triathlon',
      icon: '🏆',
      description: 'Swim, bike, run endurance',
      color: '#6f42c1',
      difficulty: 'Advanced',
    },
    {
      type: 'strength-training',
      name: 'Strength Training',
      icon: '💪',
      description: 'Powerlifting, bodybuilding',
      color: '#343a40',
      difficulty: 'Progressive',
    },
    {
      type: 'martial-arts',
      name: 'Martial Arts',
      icon: '🥋',
      description: 'Boxing, MMA, BJJ, karate',
      color: '#e83e8c',
      difficulty: 'Technical',
    },
    {
      type: 'team-sports',
      name: 'Team Sports',
      icon: '⚽',
      description: 'Football, basketball, soccer',
      color: '#20c997',
      difficulty: 'Social',
    },
    {
      type: 'general-fitness',
      name: 'General Fitness',
      icon: '🎯',
      description: 'Overall health and wellness',
      color: '#6c757d',
      difficulty: 'All Levels',
    },
  ];

  const cardSizes = {
    small: {
      width: (width - 60) / 3,
      padding: 12,
      iconSize: 24,
      nameSize: 14,
      descSize: 10,
    },
    medium: {
      width: (width - 52) / 2,
      padding: 16,
      iconSize: 32,
      nameSize: 16,
      descSize: 12,
    },
    large: {
      width: width - 40,
      padding: 20,
      iconSize: 40,
      nameSize: 18,
      descSize: 14,
    },
  };

  const cardStyle = cardSizes[cardSize];

  const handleSportPress = (sport: SportType) => {
    if (allowMultiple && onMultipleSportsSelect) {
      const isSelected = selectedSports.includes(sport);
      if (isSelected) {
        onMultipleSportsSelect(selectedSports.filter(s => s !== sport));
      } else {
        onMultipleSportsSelect([...selectedSports, sport]);
      }
    } else {
      onSportSelect(sport);
    }
  };

  const isSelected = (sport: SportType): boolean => {
    if (allowMultiple) {
      return selectedSports.includes(sport);
    }
    return selectedSport === sport;
  };

  const SportCard: React.FC<{ sport: SportOption }> = ({ sport }) => {
    const selected = isSelected(sport.type);
    const scaleValue = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    };

    return (
      <TouchableOpacity
        onPress={() => handleSportPress(sport.type)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.sportCard,
            {
              width: cardStyle.width,
              padding: cardStyle.padding,
              transform: [{ scale: scaleValue }],
            },
            selected && [
              styles.sportCardSelected,
              { borderColor: sport.color, backgroundColor: sport.color + '15' },
            ],
          ]}
        >
          {/* Selection Indicator */}
          {selected && (
            <View style={[styles.selectionIndicator, { backgroundColor: sport.color }]}>
              <Text style={styles.selectionCheck}>✓</Text>
            </View>
          )}

          {/* Sport Icon */}
          <Text style={[styles.sportIcon, { fontSize: cardStyle.iconSize }]}>
            {sport.icon}
          </Text>

          {/* Sport Name */}
          <Text
            style={[
              styles.sportName,
              { fontSize: cardStyle.nameSize },
              selected && [styles.sportNameSelected, { color: sport.color }],
            ]}
          >
            {sport.name}
          </Text>

          {/* Sport Description */}
          <Text
            style={[
              styles.sportDescription,
              { fontSize: cardStyle.descSize },
              selected && [styles.sportDescriptionSelected, { color: sport.color }],
            ]}
          >
            {sport.description}
          </Text>

          {/* Difficulty Badge */}
          {sport.difficulty && (
            <View
              style={[
                styles.difficultyBadge,
                selected && { backgroundColor: sport.color },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  selected && styles.difficultyTextSelected,
                ]}
              >
                {sport.difficulty}
              </Text>
            </View>
          )}

          {/* Sport Color Bar */}
          <View
            style={[
              styles.colorBar,
              { backgroundColor: selected ? sport.color : '#e9ecef' },
            ]}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < sportOptions.length; i += columns) {
      const rowSports = sportOptions.slice(i, i + columns);
      rows.push(
        <View key={i} style={styles.sportRow}>
          {rowSports.map((sport) => (
            <SportCard key={sport.type} sport={sport} />
          ))}
          {/* Add empty placeholders if needed */}
          {Array.from({ length: columns - rowSports.length }).map((_, index) => (
            <View
              key={`placeholder-${i}-${index}`}
              style={[styles.placeholder, { width: cardStyle.width }]}
            />
          ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        
        {/* Selection Counter for Multiple Selection */}
        {allowMultiple && (
          <Text style={styles.selectionCounter}>
            {selectedSports.length} sport{selectedSports.length !== 1 ? 's' : ''} selected
          </Text>
        )}
      </View>

      {/* Sports Grid */}
      <View style={styles.sportsGrid}>
        {renderGrid()}
      </View>

      {/* Popular Sports Indicator */}
      <View style={styles.popularSection}>
        <Text style={styles.popularTitle}>🔥 Most Popular</Text>
        <View style={styles.popularSports}>
          {['running', 'crossfit', 'strength-training'].map((sportType) => {
            const sport = sportOptions.find(s => s.type === sportType);
            return sport ? (
              <TouchableOpacity
                key={sportType}
                style={[
                  styles.popularSportChip,
                  isSelected(sport.type) && [
                    styles.popularSportChipSelected,
                    { backgroundColor: sport.color },
                  ],
                ]}
                onPress={() => handleSportPress(sport.type)}
              >
                <Text style={styles.popularSportIcon}>{sport.icon}</Text>
                <Text
                  style={[
                    styles.popularSportName,
                    isSelected(sport.type) && styles.popularSportNameSelected,
                  ]}
                >
                  {sport.name}
                </Text>
              </TouchableOpacity>
            ) : null;
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectionCounter: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
    marginTop: 8,
  },
  sportsGrid: {
    flex: 1,
  },
  sportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sportCard: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sportCardSelected: {
    borderWidth: 2,
    shadowColor: '#007bff',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  selectionIndicator: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  selectionCheck: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sportIcon: {
    marginBottom: 8,
    marginTop: 4,
  },
  sportName: {
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
    textAlign: 'center',
  },
  sportNameSelected: {
    fontWeight: 'bold',
  },
  sportDescription: {
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  sportDescriptionSelected: {
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  difficultyText: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '500',
  },
  difficultyTextSelected: {
    color: '#ffffff',
  },
  colorBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  placeholder: {
    // Empty placeholder for grid alignment
  },
  popularSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  popularTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
    textAlign: 'center',
  },
  popularSports: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularSportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  popularSportChipSelected: {
    borderColor: 'transparent',
  },
  popularSportIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  popularSportName: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  popularSportNameSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default SportSelector;
