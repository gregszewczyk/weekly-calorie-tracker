import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { 
  AthleteProfile, 
  SportType, 
  Gender, 
  FitnessLevel, 
  TrainingExperience,
  EventType,
  PerformanceLevel 
} from '../types/AthleteTypes';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700; // Detect smaller screens

interface AthleteOnboardingScreenProps {
  onComplete: (athleteProfile: AthleteProfile) => void;
  onSkip: () => void;
}

const AthleteOnboardingScreen: React.FC<AthleteOnboardingScreenProps> = ({
  onComplete,
  onSkip,
}) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<AthleteProfile>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const totalSteps = 5;

  // Step 1: Personal Stats
  const [personalStats, setPersonalStats] = useState({
    age: '',
    weight: '',
    height: '',
    gender: '' as Gender | '',
    bodyFatPercentage: '',
  });

  // Step 2: Multi-Sport Selection
  const [primarySport, setPrimarySport] = useState<SportType | ''>('');
  const [secondarySports, setSecondarySports] = useState<Set<SportType>>(new Set());
  const [sportHours, setSportHours] = useState<Record<SportType, number>>({} as Record<SportType, number>);
  const [totalWeeklyHours, setTotalWeeklyHours] = useState<number>(0);

  // Step 3: Training Details
  const [trainingDetails, setTrainingDetails] = useState({
    sessionsPerWeek: '',
    experience: '' as TrainingExperience | '',
    fitnessLevel: '' as FitnessLevel | '',
  });

  // Step 4: Performance Goals
  const [performanceGoals, setPerformanceGoals] = useState({
    eventDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default to 3 months from now
    eventType: '' as EventType | '',
    targetOutcome: '',
    performanceLevel: '' as PerformanceLevel | '',
  });
  const [showEventDatePicker, setShowEventDatePicker] = useState<boolean>(false);

  // Auto-calculate total weekly hours when sportHours changes
  React.useEffect(() => {
    const total = Object.values(sportHours).reduce((sum, hours) => sum + (hours || 0), 0);
    setTotalWeeklyHours(total);
  }, [sportHours]);

  const sportOptions: { type: SportType; name: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
    { type: 'running', name: 'Running', icon: 'walk', description: 'Road, trail, track running' },
    { type: 'crossfit', name: 'CrossFit', icon: 'barbell', description: 'Functional fitness training' },
    { type: 'hyrox', name: 'Hyrox', icon: 'flame', description: 'Fitness racing competition' },
    { type: 'triathlon', name: 'Triathlon', icon: 'medal', description: 'Swim, bike, run' },
    { type: 'strength-training', name: 'Strength Training', icon: 'fitness', description: 'Powerlifting, bodybuilding' },
    { type: 'team-sports', name: 'Team Sports', icon: 'football', description: 'Football, basketball, soccer' },
    { type: 'cycling', name: 'Cycling', icon: 'bicycle', description: 'Road, mountain, track cycling' },
    { type: 'swimming', name: 'Swimming', icon: 'water', description: 'Pool, open water swimming' },
    { type: 'martial-arts', name: 'Martial Arts', icon: 'shield', description: 'Boxing, MMA, BJJ, karate' },
    { type: 'general-fitness', name: 'General Fitness', icon: 'heart', description: 'Overall health and wellness' },
  ];

  const genderOptions: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const fitnessLevels: { value: FitnessLevel; label: string; description: string }[] = [
    { value: 'beginner', label: 'Beginner', description: 'Learning movement patterns and basics' },
    { value: 'novice', label: 'Novice', description: 'Comfortable with fundamentals' },
    { value: 'intermediate', label: 'Intermediate', description: 'Strong technique and endurance base' },
    { value: 'advanced', label: 'Advanced', description: 'High performance and competitive level' },
    { value: 'elite', label: 'Elite', description: 'Professional/national competition level' },
  ];

  const experienceLevels: { value: TrainingExperience; label: string }[] = [
    { value: 'less-than-6-months', label: 'Less than 6 months' },
    { value: '6-months-to-1-year', label: '6 months to 1 year' },
    { value: '1-to-2-years', label: '1-2 years' },
    { value: '2-to-5-years', label: '2-5 years' },
    { value: '5-to-10-years', label: '5-10 years' },
    { value: 'more-than-10-years', label: 'More than 10 years' },
  ];

  const eventTypes: { value: EventType; label: string }[] = [
    { value: 'race', label: 'Race/Competition' },
    { value: 'personal-challenge', label: 'Personal Challenge' },
    { value: 'fitness-milestone', label: 'Fitness Milestone' },
    { value: 'body-composition', label: 'Body Composition Goal' },
    { value: 'strength-goal', label: 'Strength Goal' },
    { value: 'endurance-goal', label: 'Endurance Goal' },
    { value: 'skill-development', label: 'Skill Development' },
  ];

  // Date picker handlers
  const handleEventDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || performanceGoals.eventDate;
    setShowEventDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    if (selectedDate) {
      setPerformanceGoals(prev => ({ ...prev, eventDate: currentDate }));
    }
  };

  const formatDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy', { locale: enGB });
  };

  const performanceLevels: { value: PerformanceLevel; label: string }[] = [
    { value: 'recreational', label: 'Recreational' },
    { value: 'competitive-local', label: 'Local Competition' },
    { value: 'competitive-regional', label: 'Regional Competition' },
    { value: 'competitive-national', label: 'National Competition' },
    { value: 'competitive-international', label: 'International Competition' },
    { value: 'elite-professional', label: 'Elite/Professional' },
  ];

  const animateToStep = (step: number) => {
    Animated.timing(progressAnimation, {
      toValue: step,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      const newStep = Math.min(currentStep + 1, totalSteps - 1);
      setCurrentStep(newStep);
      animateToStep(newStep);
    }
  };

  const prevStep = () => {
    const newStep = Math.max(currentStep - 1, 0);
    setCurrentStep(newStep);
    animateToStep(newStep);
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Personal Stats
        if (!personalStats.age || !personalStats.weight || !personalStats.height || !personalStats.gender) {
          Alert.alert('Required Fields', 'Please fill in all required personal information.');
          return false;
        }
        if (parseInt(personalStats.age) < 13 || parseInt(personalStats.age) > 100) {
          Alert.alert('Invalid Age', 'Please enter a valid age between 13 and 100.');
          return false;
        }
        return true;

      case 1: // Multi-Sport Selection
        if (!primarySport) {
          Alert.alert('Sport Selection', 'Please select your primary sport.');
          return false;
        }
        
        // Check if primary sport has hours
        if (!sportHours[primarySport] || sportHours[primarySport] <= 0) {
          Alert.alert('Training Hours', 'Please enter weekly training hours for your primary sport.');
          return false;
        }
        
        // Check if secondary sports have hours
        for (const sport of secondarySports) {
          if (!sportHours[sport] || sportHours[sport] <= 0) {
            const sportName = sportOptions.find(s => s.type === sport)?.name || sport;
            Alert.alert('Training Hours', `Please enter weekly training hours for ${sportName}.`);
            return false;
          }
        }
        
        if (totalWeeklyHours === 0) {
          Alert.alert('Training Hours', 'Please allocate at least 1 hour per week for training.');
          return false;
        }
        if (totalWeeklyHours > 40) {
          Alert.alert('Training Hours', 'Total training hours should not exceed 40 hours per week for safety.');
          return false;
        }
        return true;

      case 2: // Training Details
        console.log('🔍 [AthleteOnboarding] Validating training details:', {
          sessionsPerWeek: trainingDetails.sessionsPerWeek,
          experience: trainingDetails.experience,
          fitnessLevel: trainingDetails.fitnessLevel
        });
        
        if (!trainingDetails.sessionsPerWeek) {
          Alert.alert('Training Details', 'Please enter the number of sessions per week.');
          return false;
        }
        if (!trainingDetails.experience) {
          Alert.alert('Training Details', 'Please select your training experience level.');
          return false;
        }
        if (!trainingDetails.fitnessLevel) {
          Alert.alert('Training Details', 'Please select your current fitness level.');
          return false;
        }
        return true;

      case 3: // Performance Goals
        if (!performanceGoals.eventType || !performanceGoals.targetOutcome || !performanceGoals.performanceLevel) {
          Alert.alert('Performance Goals', 'Please fill in your performance goals.');
          return false;
        }
        return true;

      case 4: // Review
        return true;

      default:
        return true;
    }
  };

  const handleComplete = () => {
    console.log('🏃‍♂️ [AthleteOnboarding] Creating athlete profile with data:', {
      personalStats,
      primarySport,
      secondarySports: Array.from(secondarySports),
      sportHours,
      totalWeeklyHours,
      trainingDetails,
      performanceGoals
    });

    const athleteProfile: AthleteProfile = {
      id: Date.now().toString(),
      personalInfo: {
        name: 'Athlete', // Will be set elsewhere
        dateOfBirth: new Date(new Date().getFullYear() - parseInt(personalStats.age), 0, 1),
        profileCreated: new Date(),
        lastUpdated: new Date(),
      },
      physicalStats: {
        age: parseInt(personalStats.age),
        weight: parseFloat(personalStats.weight),
        height: parseFloat(personalStats.height),
        gender: personalStats.gender as Gender,
        bodyFatPercentage: personalStats.bodyFatPercentage ? parseFloat(personalStats.bodyFatPercentage) : undefined,
      },
      trainingProfile: {
        weeklyTrainingHours: totalWeeklyHours,
        sessionsPerWeek: parseInt(trainingDetails.sessionsPerWeek),
        primarySport: primarySport as SportType,
        secondarySports: Array.from(secondarySports) as SportType[],
        sportSpecificTrainingHours: Object.fromEntries(
          Object.entries(sportHours).map(([sport, hours]) => [sport, parseFloat(hours.toString())])
        ) as Record<SportType, number>,
        currentFitnessLevel: trainingDetails.fitnessLevel as FitnessLevel,
        trainingExperience: trainingDetails.experience as TrainingExperience,
        trainingPhaseFocus: 'base-building',
        preferredTrainingDays: [],
        sessionDuration: {
          average: 60,
          minimum: 30,
          maximum: 120,
        },
      },
      performanceGoals: [{
        eventDate: performanceGoals.eventDate, // Already a Date object
        eventType: performanceGoals.eventType as EventType,
        targetOutcome: performanceGoals.targetOutcome,
        currentPerformanceLevel: performanceGoals.performanceLevel as PerformanceLevel,
        priorityLevel: 'high',
      }],
      nutritionPreferences: {
        dietaryRestrictions: [],
        allergies: [],
        preferences: [],
        supplementsCurrently: [],
        mealPrepPreference: 'moderate',
      },
      activityLevel: {
        occupationActivityLevel: 'moderately-active',
        sleepHours: 8,
        stressLevel: 'moderate',
      },
      trackingPreferences: {
        weighInFrequency: 'weekly',
        progressPhotoFrequency: 'monthly',
        measurementFrequency: 'monthly',
        performanceTestFrequency: 'quarterly',
      },
    };

    onComplete(athleteProfile);
  };

  const renderProgressBar = () => {
    const progressWidth = progressAnimation.interpolate({
      inputRange: [0, totalSteps - 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      </View>
    );
  };

  const renderPersonalStats = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about yourself</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Age *</Text>
        <TextInput
          style={styles.textInput}
          value={personalStats.age}
          onChangeText={(text) => setPersonalStats(prev => ({ ...prev, age: text }))}
          keyboardType="numeric"
          placeholder="Enter your age"
          maxLength={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Weight (kg) *</Text>
        <TextInput
          style={styles.textInput}
          value={personalStats.weight}
          onChangeText={(text) => setPersonalStats(prev => ({ ...prev, weight: text }))}
          keyboardType="decimal-pad"
          placeholder="Enter your weight"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Height (cm) *</Text>
        <TextInput
          style={styles.textInput}
          value={personalStats.height}
          onChangeText={(text) => setPersonalStats(prev => ({ ...prev, height: text }))}
          keyboardType="numeric"
          placeholder="Enter your height"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Gender *</Text>
        <View style={styles.optionGrid}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                personalStats.gender === option.value && styles.optionButtonSelected,
              ]}
              onPress={() => setPersonalStats(prev => ({ ...prev, gender: option.value }))}
            >
              <Text style={[
                styles.optionText,
                personalStats.gender === option.value && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Body Fat % (optional)</Text>
        <TextInput
          style={styles.textInput}
          value={personalStats.bodyFatPercentage}
          onChangeText={(text) => setPersonalStats(prev => ({ ...prev, bodyFatPercentage: text }))}
          keyboardType="decimal-pad"
          placeholder="If known, enter body fat percentage"
        />
      </View>
    </View>
  );

  const renderSportSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Primary Sport</Text>
      <Text style={styles.stepSubtitle}>Select your training sports</Text>

      {/* Primary Sport Selection */}
      <Text style={[styles.stepSubtitle, { marginTop: 20, fontWeight: '600' }]}>Primary Sport</Text>
      <View style={styles.sportGrid}>
        {sportOptions.map((sport) => (
          <TouchableOpacity
            key={sport.type}
            style={[
              styles.sportCard,
              primarySport === sport.type && styles.sportCardSelected,
            ]}
            onPress={() => {
              setPrimarySport(sport.type);
              // Don't set default hours - let user input their own
              if (!sportHours[sport.type]) {
                setSportHours(prev => ({ ...prev, [sport.type]: 0 }));
              }
            }}
          >
            <Ionicons name={sport.icon} size={32} color={primarySport === sport.type ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[
              styles.sportName,
              primarySport === sport.type && styles.sportNameSelected,
            ]}>
              {sport.name}
            </Text>
            <Text style={[
              styles.sportDescription,
              primarySport === sport.type && styles.sportDescriptionSelected,
            ]}>
              {sport.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Secondary Sports Selection */}
      <Text style={[styles.stepSubtitle, { marginTop: 20 }]}>Secondary Sports (Optional)</Text>
      <View style={styles.sportGrid}>
        {sportOptions
          .filter(sport => sport.type !== primarySport)
          .map((sport) => (
            <TouchableOpacity
              key={sport.type}
              style={[
                styles.sportCard,
                secondarySports.has(sport.type) && styles.sportCardSelected,
              ]}
              onPress={() => {
                const newSecondarySports = new Set(secondarySports);
                if (secondarySports.has(sport.type)) {
                  newSecondarySports.delete(sport.type);
                  const newSportHours = { ...sportHours };
                  delete newSportHours[sport.type];
                  setSportHours(newSportHours);
                } else {
                  newSecondarySports.add(sport.type);
                  // Don't set default hours - let user input their own
                  setSportHours(prev => ({ ...prev, [sport.type]: 0 }));
                }
                setSecondarySports(newSecondarySports);
              }}
            >
              <Ionicons name={sport.icon} size={32} color={secondarySports.has(sport.type) ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[
                styles.sportName,
                secondarySports.has(sport.type) && styles.sportNameSelected,
              ]}>
                {sport.name}
              </Text>
            </TouchableOpacity>
        ))}
      </View>

      {/* Hour Allocation */}
      {(primarySport || secondarySports.size > 0) && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.stepSubtitle}>Weekly Training Hours</Text>
          <Text style={styles.helperText}>
            Enter your average weekly training hours for each sport (all fields required)
          </Text>
          {primarySport && (
            <View style={styles.hourAllocationRow}>
              <Text style={styles.hourLabel}>
                {sportOptions.find(s => s.type === primarySport)?.name} (Primary)
              </Text>
              <TextInput
                style={[
                  styles.hourInput,
                  (!sportHours[primarySport] || sportHours[primarySport] === 0) && styles.hourInputEmpty
                ]}
                value={sportHours[primarySport] > 0 ? sportHours[primarySport]?.toString() : ''}
                onChangeText={(text) => {
                  const hours = parseInt(text) || 0;
                  setSportHours(prev => ({ ...prev, [primarySport]: hours }));
                }}
                keyboardType="numeric"
                placeholder="Weekly hours (required)"
              />
            </View>
          )}
          {Array.from(secondarySports).map(sport => (
            <View key={sport} style={styles.hourAllocationRow}>
              <Text style={styles.hourLabel}>
                {sportOptions.find(s => s.type === sport)?.name}
              </Text>
              <TextInput
                style={[
                  styles.hourInput,
                  (!sportHours[sport] || sportHours[sport] === 0) && styles.hourInputEmpty
                ]}
                value={sportHours[sport] > 0 ? sportHours[sport]?.toString() : ''}
                onChangeText={(text) => {
                  const hours = parseInt(text) || 0;
                  setSportHours(prev => ({ ...prev, [sport]: hours }));
                }}
                keyboardType="numeric"
                placeholder="Weekly hours (required)"
              />
            </View>
          ))}
          <View style={[
            styles.totalHoursContainer,
            { 
              backgroundColor: totalWeeklyHours > 0 ? '#e7f3ff' : '#fff3cd',
              borderColor: totalWeeklyHours > 0 ? '#b3d9ff' : '#ffeaa7'
            }
          ]}>
            <Text style={[
              styles.totalHoursText,
              { color: totalWeeklyHours > 0 ? '#0056b3' : '#856404' }
            ]}>
              Total: {totalWeeklyHours}h per week
            </Text>
            {totalWeeklyHours === 0 && (
              <Text style={styles.totalHoursSubText}>
                Please allocate training hours to continue
              </Text>
            )}
            {totalWeeklyHours > 0 && totalWeeklyHours <= 40 && (
              <Text style={styles.totalHoursSubText}>
                ✓ Good training volume
              </Text>
            )}
            {totalWeeklyHours > 40 && (
              <Text style={[styles.totalHoursSubText, { color: '#dc3545' }]}>
                ⚠️ Consider reducing total hours for safety
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderTrainingDetails = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Training Details</Text>
      <Text style={styles.stepSubtitle}>Tell us about your training</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Weekly Training Hours (Auto-calculated)</Text>
        <View style={[styles.textInput, styles.readOnlyInput]}>
          <Text style={styles.readOnlyText}>
            {totalWeeklyHours}h per week
          </Text>
        </View>
        <Text style={styles.helperText}>
          Based on your sport allocations from the previous step
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Sessions Per Week *</Text>
        <TextInput
          style={styles.textInput}
          value={trainingDetails.sessionsPerWeek}
          onChangeText={(text) => setTrainingDetails(prev => ({ ...prev, sessionsPerWeek: text }))}
          keyboardType="numeric"
          placeholder="e.g., 4"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Training Experience *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {experienceLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.experienceCard,
                trainingDetails.experience === level.value && styles.experienceCardSelected,
              ]}
              onPress={() => setTrainingDetails(prev => ({ ...prev, experience: level.value }))}
            >
              <Text style={[
                styles.experienceText,
                trainingDetails.experience === level.value && styles.experienceTextSelected,
              ]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Current Fitness Level *</Text>
        <View style={styles.fitnessGrid}>
          {fitnessLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.fitnessCard,
                trainingDetails.fitnessLevel === level.value && styles.fitnessCardSelected,
              ]}
              onPress={() => setTrainingDetails(prev => ({ ...prev, fitnessLevel: level.value }))}
            >
              <Text style={[
                styles.fitnessLabel,
                trainingDetails.fitnessLevel === level.value && styles.fitnessLabelSelected,
              ]}>
                {level.label}
              </Text>
              <Text style={[
                styles.fitnessDescription,
                trainingDetails.fitnessLevel === level.value && styles.fitnessDescriptionSelected,
              ]}>
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderPerformanceGoals = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Performance Goals</Text>
      <Text style={styles.stepSubtitle}>What are you working towards?</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Event/Goal Type *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {eventTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.eventCard,
                performanceGoals.eventType === type.value && styles.eventCardSelected,
              ]}
              onPress={() => setPerformanceGoals(prev => ({ ...prev, eventType: type.value }))}
            >
              <Text style={[
                styles.eventText,
                performanceGoals.eventType === type.value && styles.eventTextSelected,
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Target Outcome *</Text>
        <TextInput
          style={styles.textAreaInput}
          value={performanceGoals.targetOutcome}
          onChangeText={(text) => setPerformanceGoals(prev => ({ ...prev, targetOutcome: text }))}
          placeholder="e.g., Complete first marathon under 4 hours, Deadlift 2x bodyweight"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Event Date (optional)</Text>
        <TouchableOpacity
          style={[styles.datePickerButton, { borderColor: theme.colors.border }]}
          onPress={() => setShowEventDatePicker(true)}
        >
          <Ionicons name="calendar" size={20} color={theme.colors.primary} />
          <Text style={[styles.datePickerButtonText, { color: theme.colors.text }]}>
            {formatDate(performanceGoals.eventDate)}
          </Text>
        </TouchableOpacity>
        
        {showEventDatePicker && (
          <DateTimePicker
            value={performanceGoals.eventDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEventDateChange}
            minimumDate={new Date()} // Can't select past dates
            maximumDate={new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000)} // Max 2 years from now
          />
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Current Performance Level *</Text>
        <View style={styles.levelGrid}>
          {performanceLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.levelCard,
                performanceGoals.performanceLevel === level.value && styles.levelCardSelected,
              ]}
              onPress={() => setPerformanceGoals(prev => ({ ...prev, performanceLevel: level.value }))}
            >
              <Text style={[
                styles.levelText,
                performanceGoals.performanceLevel === level.value && styles.levelTextSelected,
              ]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review Your Information</Text>
      <Text style={styles.stepSubtitle}>Please confirm your details</Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Personal Stats</Text>
        <Text style={styles.reviewText}>Age: {personalStats.age}</Text>
        <Text style={styles.reviewText}>Weight: {personalStats.weight} kg</Text>
        <Text style={styles.reviewText}>Height: {personalStats.height} cm</Text>
        <Text style={styles.reviewText}>Gender: {personalStats.gender}</Text>
        {personalStats.bodyFatPercentage && (
          <Text style={styles.reviewText}>Body Fat: {personalStats.bodyFatPercentage}%</Text>
        )}
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Sports & Training</Text>
        <Text style={styles.reviewText}>
          Primary: {sportOptions.find(s => s.type === primarySport)?.name}
        </Text>
        {secondarySports.size > 0 && (
          <Text style={styles.reviewText}>
            Secondary: {Array.from(secondarySports).map(sport => 
              sportOptions.find(s => s.type === sport)?.name
            ).join(', ')}
          </Text>
        )}
        <Text style={styles.reviewText}>Total Weekly Hours: {totalWeeklyHours}</Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Training Details</Text>
        <Text style={styles.reviewText}>Weekly Hours: {totalWeeklyHours}</Text>
        <Text style={styles.reviewText}>Sessions/Week: {trainingDetails.sessionsPerWeek}</Text>
        <Text style={styles.reviewText}>Experience: {experienceLevels.find(e => e.value === trainingDetails.experience)?.label}</Text>
        <Text style={styles.reviewText}>Fitness Level: {fitnessLevels.find(f => f.value === trainingDetails.fitnessLevel)?.label}</Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Performance Goals</Text>
        <Text style={styles.reviewText}>Goal Type: {eventTypes.find(e => e.value === performanceGoals.eventType)?.label}</Text>
        <Text style={styles.reviewText}>Target: {performanceGoals.targetOutcome}</Text>
        {performanceGoals.eventDate && (
          <Text style={styles.reviewText}>Event Date: {formatDate(performanceGoals.eventDate)}</Text>
        )}
        <Text style={styles.reviewText}>Level: {performanceLevels.find(p => p.value === performanceGoals.performanceLevel)?.label}</Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalStats();
      case 1:
        return renderSportSelection();
      case 2:
        return renderTrainingDetails();
      case 3:
        return renderPerformanceGoals();
      case 4:
        return renderReview();
      default:
        return null;
    }
  };

  const styles = createStyles(theme);

  return (
    <>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {renderProgressBar()}
          
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.stepContainer}>
              {renderCurrentStep()}
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={onSkip}
            >
              <Text style={styles.skipButtonText}>Skip Setup</Text>
            </TouchableOpacity>

            <View style={styles.navigationButtons}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={[styles.button, styles.backButton]}
                  onPress={prevStep}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.nextButton]}
                onPress={currentStep === totalSteps - 1 ? handleComplete : nextStep}
              >
                <Text style={styles.nextButtonText}>
                  {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  
  // Progress Bar Section
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 20 : 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.card,
    borderRadius: 3,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Main Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  stepContainer: {
    padding: 20,
    paddingTop: 24,
  },
  
  // Typography
  stepTitle: {
    fontSize: isSmallScreen ? 26 : 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 32,
  },

  // Input Groups
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Option Selections
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    minWidth: 100,
  },
  optionButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Sport Cards
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  sportCard: {
    width: '48%',
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sportCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sportName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  sportNameSelected: {
    color: theme.colors.primary,
  },
  sportDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  sportDescriptionSelected: {
    color: theme.colors.primary,
  },

  // Horizontal Scrolls
  horizontalScroll: {
    flexGrow: 0,
    paddingVertical: 4,
  },
  experienceCard: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    backgroundColor: theme.colors.card,
  },
  experienceCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  experienceText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  experienceTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Fitness Level Cards
  fitnessGrid: {
    gap: 12,
  },
  fitnessCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
  },
  fitnessCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  fitnessLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  fitnessLabelSelected: {
    color: theme.colors.primary,
  },
  fitnessDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  fitnessDescriptionSelected: {
    color: theme.colors.primary,
  },

  // Event Cards
  eventCard: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    backgroundColor: theme.colors.card,
  },
  eventCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  eventText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  eventTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Performance Level Cards
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  levelCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    minWidth: 140,
  },
  levelCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
  },
  levelTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Review Section
  reviewSection: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  reviewText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },

  // Training Hours
  hourAllocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.card,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  hourLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  hourInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
    width: 80,
  },
  hourInputEmpty: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error + '10',
  },
  totalHoursContainer: {
    backgroundColor: theme.colors.primary + '20',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  totalHoursText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  totalHoursSubText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },

  // Date Picker
  datePickerButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Read-only Input
  readOnlyInput: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textTertiary,
    marginTop: 6,
  },

  // Buttons
  buttonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: 'transparent',
    alignSelf: 'center',
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    flex: 1,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 16,
    color: theme.colors.buttonText,
    fontWeight: '700',
  },
});

export default AthleteOnboardingScreen;
