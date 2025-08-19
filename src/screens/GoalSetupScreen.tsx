import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCalorieStore } from '../stores/calorieStore';
import { GoalConfiguration, GoalMode } from '../types/GoalTypes';
import { AthleteProfile, FitnessLevel, TrainingExperience } from '../types/AthleteTypes';
import { RootStackParamList } from '../navigation/AppNavigator';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
// Health device components removed - will be replaced with proxy-based solution
// import { HealthDeviceSetup } from '../components/HealthDeviceSetup';
// import { HealthDeviceData } from '../services/HealthDeviceIntegrationService';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { healthDeviceManager } from '../services/HealthDeviceManager';
import ThemeToggle from '../components/ThemeToggle';

type GoalSetupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GoalSetup'>;

const GoalSetupScreen: React.FC = () => {
  const navigation = useNavigation<GoalSetupScreenNavigationProp>();
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const [selectedMode, setSelectedMode] = useState<GoalMode | null>(null);
  const [performanceMode, setPerformanceMode] = useState<boolean>(false);
  const [targetDate, setTargetDate] = useState<Date>(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)); // Default to 3 months from now
  const [isOpenEnded, setIsOpenEnded] = useState<boolean>(true);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [hasHealthDevice, setHasHealthDevice] = useState<boolean>(false);
  
  // User stats for TDEE calculation
  const [userStats, setUserStats] = useState({
    age: '',
    gender: '' as 'male' | 'female' | '',
    weight: '',
    height: '',
    activityLevel: '' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | ''
  });
  const [showUserStatsForm, setShowUserStatsForm] = useState(false);
  
  // Target goals state
  const [targetGoals, setTargetGoals] = useState({
    currentWeight: '',
    targetWeight: '',
    currentBodyFat: '',
    targetBodyFat: '',
    primaryGoal: '' as 'weight' | 'bodyFat' | 'performance' | '',
    activityLevel: '' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | '',
    specificGoals: [] as string[], // e.g., "Run sub-1:30 half marathon", "Fit into size 32 jeans"
  });
  const [showTargetGoalsForm, setShowTargetGoalsForm] = useState(false);
  
  // Health device integration state - removed for proxy-based solution
  // const [showHealthDeviceSetup, setShowHealthDeviceSetup] = useState<boolean>(false);
  // const [enhancedData, setEnhancedData] = useState<HealthDeviceData | null>(null);
  // const [useEnhancedCalculation, setUseEnhancedCalculation] = useState<boolean>(false);

  const { setWeeklyGoal, setGoalConfiguration, debugStore, clearAllData, goalConfiguration } = useCalorieStore();

  // Helper to check if user stats are complete for basic users
  const areUserStatsComplete = () => {
    if (performanceMode) {
      return true; // Athletes fill this in AthleteOnboarding
    }
    return userStats.age && userStats.gender && userStats.height;
  };

  // Helper to get parsed user stats for TDEE calculation
  const getParsedUserStats = () => {
    return {
      age: parseInt(userStats.age),
      gender: userStats.gender as 'male' | 'female',
      weight: parseFloat(userStats.weight),
      height: parseFloat(userStats.height),
      activityLevel: userStats.activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
    };
  };

  // Helper to check if target goals are complete
  const areTargetGoalsComplete = () => {
    if (performanceMode) {
      // Athletes need detailed goals
      return targetGoals.currentWeight && 
             ((targetGoals.primaryGoal === 'weight' && targetGoals.targetWeight) ||
              (targetGoals.primaryGoal === 'bodyFat' && targetGoals.targetBodyFat) ||
              (targetGoals.primaryGoal === 'performance')) &&
             targetGoals.primaryGoal;
    } else {
      // Basic users need current weight, goal already selected (selectedMode), and activity level
      // For cut/bulk, also need target weight
      const hasTargetWeight = selectedMode === 'maintenance' || targetGoals.targetWeight;
      return targetGoals.currentWeight && selectedMode && targetGoals.activityLevel && hasTargetWeight;
    }
  };

  // Calculate basic TDEE for non-performance users
  const calculateBasicTDEE = (): number => {
    // Simple estimation based on weight and activity level
    const weight = parseFloat(targetGoals.currentWeight) || 70; // Default weight
    
    // Basic BMR estimation (simplified)
    const estimatedBMR = weight * 22; // Rough approximation
    
    // Activity multipliers for basic users
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375, 
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    // Use the user's selected activity level
    const selectedLevel = targetGoals.activityLevel || 'moderate';
    const multiplier = activityMultipliers[selectedLevel];
    return Math.round(estimatedBMR * multiplier);
  };

  // Check for health device connections whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const checkHealthDevices = () => {
        const isConnected = healthDeviceManager.hasAnyConnection();
        setHasHealthDevice(isConnected);
        console.log('[GoalSetup] Health device connected (on focus):', isConnected);
        
        if (isConnected) {
          const connections = healthDeviceManager.getConnections();
          console.log('[GoalSetup] Connected devices:', connections.map(c => `${c.platform}:${c.status}`));
        }
      };

      checkHealthDevices();
    }, [])
  );

  const modeConfig = {
    cut: { color: theme.colors.error, label: 'Cut', description: 'Lose weight' },
    bulk: { color: theme.colors.success, label: 'Bulk', description: 'Gain weight' },
    maintenance: { color: theme.colors.primary, label: 'Maintenance', description: 'Maintain weight' },
  };

  const validateInput = (): boolean => {
    if (!selectedMode) {
      Alert.alert('Error', 'Please select a goal mode');
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateInput() || !selectedMode) return;

    const goalConfig: GoalConfiguration = {
      mode: selectedMode,
      performanceMode,
      startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
      targetDate: isOpenEnded ? undefined : targetDate.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
      weeklyDeficitTarget: 0, // AI will calculate optimal target
      isOpenEnded,
      targetGoals: performanceMode 
        ? {} // Will be filled by AthleteOnboarding
        : {
            // For basic users, convert targetGoals state to proper format
            weight: targetGoals.currentWeight ? {
              target: Number(targetGoals.targetWeight) || Number(targetGoals.currentWeight),
              current: Number(targetGoals.currentWeight),
              priority: 'primary' as const
            } : undefined,
            general: {
              description: `${selectedMode} goal with ${targetGoals.activityLevel} activity level`,
              priority: 'primary' as const
            }
          },
    };

    // If performance mode is enabled, go directly to athlete onboarding
    if (performanceMode) {
      // For cut + performance mode, set performance cutting defaults
      if (selectedMode === 'cut') {
        goalConfig.deficitLevel = 'moderate'; // Default, will be refined by AI
        goalConfig.cuttingStrategy = 'training-priority'; // Default strategy
      }
      
      setGoalConfiguration(goalConfig);
      
      // Go directly to athlete onboarding - it will collect all the body composition goals
      console.log('[GoalSetup] Performance mode enabled, going to AthleteOnboarding (it will collect all goals)');
      navigation.navigate('AthleteOnboarding');
      return;
    }

    // For basic users (non-performance mode), collect user stats first, then goals
    if (!areUserStatsComplete()) {
      setShowUserStatsForm(true);
      return;
    }
    
    if (!areTargetGoalsComplete()) {
      setShowTargetGoalsForm(true);
      return;
    }

    setGoalConfiguration(goalConfig);
    
    // Basic users also go through TDEE calculation and AI nutrition
    console.log('[GoalSetup] Basic user completed setup, navigating to TDEE calculation');
    
    // Create basic user stats from goal setup data  
    const basicUserStats = {
      age: Number(userStats.age) || 30, // Use provided age or default
      gender: userStats.gender || 'male' as const,
      weight: Number(targetGoals.currentWeight) || 70,
      height: Number(userStats.height) || 175, // Use provided height or default
      activityLevel: targetGoals.activityLevel || 'moderate' as const,
    };

    // Helper functions to map activity level to realistic training values
    const getTrainingHoursFromActivityLevel = (activityLevel: string): number => {
      switch (activityLevel) {
        case 'sedentary': return 0;
        case 'light': return 2;
        case 'moderate': return 4;
        case 'active': return 6;
        case 'very_active': return 8;
        default: return 3;
      }
    };

    const getSessionsFromActivityLevel = (activityLevel: string): number => {
      switch (activityLevel) {
        case 'sedentary': return 0;
        case 'light': return 2;
        case 'moderate': return 3;
        case 'active': return 5;
        case 'very_active': return 6;
        default: return 3;
      }
    };

    const getFitnessLevelFromActivityLevel = (activityLevel: string): FitnessLevel => {
      switch (activityLevel) {
        case 'sedentary': return 'beginner';
        case 'light': return 'beginner';
        case 'moderate': return 'novice';
        case 'active': return 'intermediate';
        case 'very_active': return 'advanced';
        default: return 'beginner';
      }
    };

    const getExperienceFromActivityLevel = (activityLevel: string): TrainingExperience => {
      switch (activityLevel) {
        case 'sedentary': return 'less-than-6-months';
        case 'light': return 'less-than-6-months';
        case 'moderate': return '6-months-to-1-year';
        case 'active': return '1-to-2-years';
        case 'very_active': return '2-to-5-years';
        default: return 'less-than-6-months';
      }
    };

    // Create minimal athlete profile for basic users
    const createMinimalAthleteProfile = (selectedTDEE: number): AthleteProfile => {
      const now = new Date();
      return {
        id: Date.now().toString(),
        personalInfo: {
          name: 'Basic User',
          profileCreated: now,
          lastUpdated: now,
          dateOfBirth: new Date(now.getFullYear() - Number(basicUserStats.age), 0, 1),
        },
        physicalStats: {
          age: Number(basicUserStats.age),
          gender: basicUserStats.gender,
          weight: Number(basicUserStats.weight),
          height: Number(basicUserStats.height),
          bodyFatPercentage: undefined, // Not collected for basic users
        },
        trainingProfile: {
          primarySport: 'general-fitness', // Valid SportType for basic users
          secondarySports: [],
          // Map activity level to realistic training values
          weeklyTrainingHours: getTrainingHoursFromActivityLevel(basicUserStats.activityLevel),
          sessionsPerWeek: getSessionsFromActivityLevel(basicUserStats.activityLevel),
          currentFitnessLevel: getFitnessLevelFromActivityLevel(basicUserStats.activityLevel),
          trainingExperience: getExperienceFromActivityLevel(basicUserStats.activityLevel),
          trainingPhaseFocus: 'base-building',
          preferredTrainingDays: ['monday', 'wednesday', 'friday'],
          sessionDuration: {
            average: 60,
            minimum: 30,
            maximum: 90,
          },
        },
        performanceGoals: [
          {
            eventType: 'body-composition',
            targetOutcome: selectedMode === 'cut' ? 'Weight Loss' : selectedMode === 'bulk' ? 'Weight Gain' : 'Weight Maintenance',
            currentPerformanceLevel: 'recreational',
            specificMetrics: {
              weight: Number(targetGoals.targetWeight) || Number(basicUserStats.weight),
            },
            priorityLevel: 'high',
          }
        ],
        nutritionPreferences: {
          dietaryRestrictions: [],
          allergies: [],
          preferences: [],
          supplementsCurrently: [],
          mealPrepPreference: 'minimal',
        },
        activityLevel: {
          occupationActivityLevel: 'sedentary',
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
    };

    // Navigate to TDEE comparison with basic user data
    navigation.navigate('EnhancedTDEEComparison', {
      athleteProfile: createMinimalAthleteProfile(2000), // Temporary TDEE for profile creation
      userStats: basicUserStats,
      goalConfig,
      onAcceptEnhanced: (selectedTDEE: number) => {
        console.log('✅ [GoalSetup] Basic user selected enhanced TDEE:', selectedTDEE);
        const finalGoalConfig = { ...goalConfig, enhancedTDEE: selectedTDEE };
        setGoalConfiguration(finalGoalConfig);
        
        // Create minimal athlete profile for nutrition screen
        const minimalAthleteProfile = createMinimalAthleteProfile(selectedTDEE);
        
        // Navigate to AI nutrition recommendations
        navigation.navigate('NutritionRecommendation', {
          athleteProfile: minimalAthleteProfile,
          goalConfiguration: finalGoalConfig,
          selectedTDEE,
          tdeeMethod: 'enhanced'
        });
      },
      onUseStandard: (standardTDEE: number) => {
        console.log('📊 [GoalSetup] Basic user chose standard TDEE:', standardTDEE);
        const standardGoalConfig = { ...goalConfig, standardTDEE };
        setGoalConfiguration(standardGoalConfig);
        
        // Create minimal athlete profile for nutrition screen
        const minimalAthleteProfile = createMinimalAthleteProfile(standardTDEE);
        
        // Navigate to AI nutrition recommendations  
        navigation.navigate('NutritionRecommendation', {
          athleteProfile: minimalAthleteProfile,
          goalConfiguration: standardGoalConfig,
          selectedTDEE: standardTDEE,
          tdeeMethod: 'standard'
        });
      },
    });
  };

  const createWeeklyGoalWithTDEE = (dailyBaseline: number, goalConfig: GoalConfiguration, isEnhanced: boolean) => {
    const weeklyAllowance = dailyBaseline * 7;
    
    // Calculate remaining days in current week for initial setup
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayBasedDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Convert to Monday = 0 system
    const daysRemaining = 7 - mondayBasedDay; // Days remaining including today
    const currentWeekAllowance = dailyBaseline * daysRemaining; // Proportional for initial setup

    const weeklyGoal = {
      weekStartDate: new Date().toISOString().split('T')[0],
      totalTarget: weeklyAllowance,
      dailyBaseline,
      deficitTarget: 0, // AI will set optimal deficit/surplus
      goalConfig,
      weeklyAllowance,
      currentWeekAllowance, // Set proportional allowance for current partial week
    };

    setWeeklyGoal(weeklyGoal);
    
    // Show success message
    const successMessage = isEnhanced 
      ? `Goal created with enhanced TDEE calculation (${dailyBaseline.toLocaleString()} calories/day)!`
      : 'Goal configuration saved! You can connect health devices later for enhanced accuracy.';
    
    Alert.alert('Success', successMessage, [
      {
        text: 'Continue',
        onPress: () => navigation.navigate('WeeklyBanking')
      }
    ]);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || targetDate;
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    if (selectedDate) {
      setTargetDate(currentDate);
    }
  };

  const formatDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy', { locale: enGB });
  };

  // Health device integration handlers - removed for proxy-based solution  
  // const handleDeviceConnected = (data: HealthDeviceData) => {
  //   setEnhancedData(data);
  //   setUseEnhancedCalculation(true);
  //   setShowHealthDeviceSetup(false);
  // };

  // const handleSkipDeviceSetup = () => {
  //   setUseEnhancedCalculation(false);
  //   setShowHealthDeviceSetup(false);
  // };

  // Enhanced data preview removed for proxy-based solution
  // const renderEnhancedDataPreview = () => {
  //   return null; // Will be replaced with proxy-based health device integration
  // };

  const getAIExplanation = (mode: GoalMode, performanceMode: boolean) => {
    const baseExplanations = {
      cut: {
        title: performanceMode ? 'AI-Powered Athletic Fat Loss' : 'AI-Powered Optimal Deficit',
        description: performanceMode 
          ? 'Our AI will calculate the optimal deficit for fat loss while maintaining training performance and athletic goals.'
          : 'Our AI will calculate your optimal deficit based on your body composition, activity level, and weight loss goals.',
        features: performanceMode ? [
          'Training load consideration',
          'Body composition focus',
          'Athletic goal optimization',
          'Training performance support',
          'Muscle preservation priority',
          'Performance-based adjustments'
        ] : [
          'Personalized deficit calculation',
          'Sustainable weight loss rate',
          'Muscle preservation focus',
          'Energy level optimization',
          'Progress-based adjustments'
        ],
        note: performanceMode 
          ? 'AI determines the perfect deficit to maximize fat loss while maintaining your athletic performance.'
          : 'AI determines the perfect deficit to maximize fat loss while maintaining energy and performance.'
      },
      bulk: {
        title: performanceMode ? 'AI-Powered Athletic Muscle Gain' : 'AI-Powered Lean Surplus',
        description: performanceMode
          ? 'Our AI will calculate your optimal surplus for lean muscle gain while supporting athletic performance and training adaptation.'
          : 'Our AI will calculate your optimal surplus for lean muscle gain while minimizing fat accumulation.',
        features: performanceMode ? [
          'Performance-focused muscle gain',
          'Training adaptation support',
          'Sport-specific nutrition',
          'Recovery optimization',
          'Strength progression focus',
          'Performance tracking'
        ] : [
          'Lean muscle gain focus',
          'Minimal fat gain strategy',
          'Progressive overload support',
          'Recovery optimization',
          'Body composition tracking'
        ],
        note: performanceMode
          ? 'AI determines the perfect surplus to maximize muscle growth while optimizing athletic performance.'
          : 'AI determines the perfect surplus to maximize muscle growth while keeping fat gain minimal.'
      },
      maintenance: {
        title: performanceMode ? 'AI-Powered Athletic Maintenance' : 'AI-Powered Maintenance Balance',
        description: performanceMode
          ? 'Our AI will calculate your precise maintenance calories optimized for athletic performance, body recomposition, and training support.'
          : 'Our AI will calculate your precise maintenance calories for body recomposition and performance.',
        features: performanceMode ? [
          'Performance-focused balance',
          'Athletic body recomposition',
          'Training fueling strategy',
          'Performance maintenance',
          'Sport-specific optimization',
          'Competition readiness'
        ] : [
          'Perfect caloric balance',
          'Body recomposition support',
          'Performance maintenance',
          'Metabolic rate optimization',
          'Long-term sustainability'
        ],
        note: performanceMode
          ? 'AI creates a comprehensive nutrition strategy tailored to your athletic performance and body composition goals.'
          : 'AI determines your exact maintenance needs for optimal body composition and energy levels.'
      }
    };

    return baseExplanations[mode];
  };

  const renderModeButton = (mode: GoalMode) => {
    const config = modeConfig[mode];
    const isSelected = selectedMode === mode;

    const modeIcons = {
      cut: 'trending-down',
      bulk: 'trending-up', 
      maintenance: 'remove'
    } as const;

    return (
      <TouchableOpacity
        key={mode}
        style={[
          styles.goalModeButton,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          isSelected && { 
            backgroundColor: config.color + '15', 
            borderColor: config.color,
            borderWidth: 1
          },
        ]}
        onPress={() => setSelectedMode(mode)}
      >
        <View style={styles.goalModeContent}>
          <View style={[
            styles.goalModeIcon,
            { backgroundColor: isSelected ? config.color : theme.colors.textSecondary }
          ]}>
            <Ionicons 
              name={modeIcons[mode]} 
              size={20} 
              color={theme.colors.buttonText}
            />
          </View>
          <View style={styles.goalModeText}>
            <Text style={[
              styles.goalModeLabel, 
              { 
                color: isSelected ? config.color : theme.colors.text,
                fontWeight: isSelected ? '700' : '600'
              }
            ]}>
              {config.label}
            </Text>
            <Text style={[
              styles.goalModeDescription, 
              { color: theme.colors.textSecondary }
            ]}>
              {config.description}
            </Text>
          </View>
        </View>
        {isSelected && (
          <View style={[styles.goalModeSelectedBadge, { backgroundColor: config.color, borderColor: theme.colors.surface }]}>
            <Ionicons name="checkmark" size={14} color={theme.colors.buttonText} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.heroTopBar}>
            <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
              AI Nutrition Coach
            </Text>
            <TouchableOpacity
              style={[styles.themeToggleButton, { backgroundColor: theme.colors.card }]}
              onPress={() => {
                if (themeMode === 'system') {
                  setThemeMode(isDark ? 'light' : 'dark');
                } else {
                  setThemeMode(themeMode === 'light' ? 'dark' : 'light');
                }
              }}
            >
              <Ionicons 
                name={isDark ? "moon" : "sunny"} 
                size={20} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
            Personalized calorie targets with intelligent weekly redistribution
          </Text>
          
          <View style={styles.heroFeatures}>
            <View style={styles.heroFeature}>
              <View style={[styles.heroFeatureIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="trending-up" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.heroFeatureText, { color: theme.colors.text }]}>Smart TDEE Calculation</Text>
            </View>
            <View style={styles.heroFeature}>
              <View style={[styles.heroFeatureIcon, { backgroundColor: theme.colors.success + '15' }]}>
                <Ionicons name="analytics" size={20} color={theme.colors.success} />
              </View>
              <Text style={[styles.heroFeatureText, { color: theme.colors.text }]}>Weekly Calorie Banking</Text>
            </View>
            <View style={styles.heroFeature}>
              <View style={[styles.heroFeatureIcon, { backgroundColor: theme.colors.warning + '15' }]}>
                <Ionicons name="fitness" size={20} color={theme.colors.warning} />
              </View>
              <Text style={[styles.heroFeatureText, { color: theme.colors.text }]}>Performance Integration</Text>
            </View>
          </View>
        </View>

        {/* Goal Selection Card */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderContent}>
              <Ionicons name="flag" size={24} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Choose Your Goal</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Select your primary nutrition objective
            </Text>
          </View>
          
          <View style={styles.goalModeGrid}>
            {(Object.keys(modeConfig) as GoalMode[]).map(renderModeButton)}
          </View>
        </View>

        {/* Performance Mode Toggle */}
        {selectedMode && (
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderContent}>
                <Ionicons name="trophy" size={24} color={theme.colors.warning} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Performance Mode</Text>
              </View>
              <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                Enable athletic optimization for your {modeConfig[selectedMode].label.toLowerCase()} goal
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.performanceToggleCard, 
                { backgroundColor: theme.colors.card },
                performanceMode && { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary }
              ]}
              onPress={() => setPerformanceMode(!performanceMode)}
            >
              <View style={styles.performanceToggleContent}>
                <View style={[
                  styles.performanceToggleIcon,
                  { backgroundColor: performanceMode ? theme.colors.primary : theme.colors.card }
                ]}>
                  <Ionicons 
                    name={performanceMode ? "checkmark" : "add"} 
                    size={20} 
                    color={performanceMode ? theme.colors.buttonText : theme.colors.textSecondary} 
                  />
                </View>
                <View style={styles.performanceToggleText}>
                  <Text style={[
                    styles.performanceToggleTitle, 
                    { color: performanceMode ? theme.colors.primary : theme.colors.text }
                  ]}>
                    {performanceMode ? 'Performance Mode Active' : 'Enable Performance Mode'}
                  </Text>
                  <Text style={[styles.performanceToggleSubtext, { color: theme.colors.textSecondary }]}>
                    {performanceMode 
                      ? 'Sport-specific nutrition with training integration' 
                      : 'Athlete-focused nutrition and recovery optimization'
                    }
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* AI Strategy Card */}
        {selectedMode && (
          <View style={[styles.aiStrategyCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.aiStrategyHeader}>
              <View style={[styles.aiStrategyIcon, { backgroundColor: modeConfig[selectedMode].color + '15' }]}>
                <Ionicons name="sparkles" size={24} color={modeConfig[selectedMode].color} />
              </View>
              <View style={styles.aiStrategyHeaderText}>
                <Text style={[styles.aiStrategyTitle, { color: theme.colors.text }]}>
                  {getAIExplanation(selectedMode, performanceMode).title}
                </Text>
                <Text style={[styles.aiStrategySubtitle, { color: theme.colors.textSecondary }]}>
                  Powered by advanced algorithms
                </Text>
              </View>
            </View>
            
            <Text style={[styles.aiStrategyDescription, { color: theme.colors.text }]}>
              {getAIExplanation(selectedMode, performanceMode).description}
            </Text>
            
            <View style={styles.aiFeatureGrid}>
              {getAIExplanation(selectedMode, performanceMode).features.slice(0, 4).map((feature, index) => (
                <View key={index} style={[styles.aiFeatureItem, { backgroundColor: theme.colors.card }]}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                  <Text style={[styles.aiFeatureText, { color: theme.colors.text }]}>{feature}</Text>
                </View>
              ))}
            </View>
            
            <View style={[styles.aiHighlight, { backgroundColor: modeConfig[selectedMode].color + '10' }]}>
              <Ionicons name="bulb" size={16} color={modeConfig[selectedMode].color} />
              <Text style={[styles.aiHighlightText, { color: modeConfig[selectedMode].color }]}>
                {getAIExplanation(selectedMode, performanceMode).note}
              </Text>
            </View>
          </View>
        )}

        {/* Timeline Section */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderContent}>
              <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Timeline</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Choose your goal timeframe
            </Text>
          </View>
          
          <View style={styles.timelineOptions}>
            <TouchableOpacity
              style={[
                styles.timelineOption,
                { backgroundColor: theme.colors.card },
                isOpenEnded && { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary }
              ]}
              onPress={() => setIsOpenEnded(true)}
            >
              <View style={[
                styles.timelineOptionIcon,
                { backgroundColor: isOpenEnded ? theme.colors.primary : theme.colors.textSecondary }
              ]}>
                <Ionicons name="infinite" size={20} color={theme.colors.buttonText} />
              </View>
              <View style={styles.timelineOptionText}>
                <Text style={[
                  styles.timelineOptionTitle, 
                  { color: isOpenEnded ? theme.colors.primary : theme.colors.text }
                ]}>
                  Open-ended Goal
                </Text>
                <Text style={[styles.timelineOptionDesc, { color: theme.colors.textSecondary }]}>
                  Flexible timeline, adjust as you progress
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timelineOption,
                { backgroundColor: theme.colors.card },
                !isOpenEnded && { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary }
              ]}
              onPress={() => setIsOpenEnded(false)}
            >
              <View style={[
                styles.timelineOptionIcon,
                { backgroundColor: !isOpenEnded ? theme.colors.primary : theme.colors.textSecondary }
              ]}>
                <Ionicons name="flag" size={20} color={theme.colors.buttonText} />
              </View>
              <View style={styles.timelineOptionText}>
                <Text style={[
                  styles.timelineOptionTitle, 
                  { color: !isOpenEnded ? theme.colors.primary : theme.colors.text }
                ]}>
                  Target Date
                </Text>
                <Text style={[styles.timelineOptionDesc, { color: theme.colors.textSecondary }]}>
                  Set a specific completion date
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {!isOpenEnded && (
            <TouchableOpacity
              style={[styles.dateSelector, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
              <Text style={[styles.dateSelectorText, { color: theme.colors.text }]}>
                Target: {formatDate(targetDate)}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
          
          {showDatePicker && (
            <DateTimePicker
              value={targetDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
              maximumDate={new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)}
            />
          )}
        </View>

        {/* Health Device Integration Section */}
        {selectedMode && (
          <View style={[styles.deviceIntegrationCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.deviceIntegrationHeader}>
              <View style={[
                styles.deviceIntegrationIcon, 
                { backgroundColor: hasHealthDevice ? theme.colors.success + '15' : theme.colors.info + '15' }
              ]}>
                <Ionicons 
                  name={hasHealthDevice ? "checkmark-circle" : "fitness-outline"} 
                  size={28} 
                  color={hasHealthDevice ? theme.colors.success : theme.colors.info} 
                />
              </View>
              <View style={styles.deviceIntegrationHeaderText}>
                <Text style={[styles.deviceIntegrationTitle, { color: theme.colors.text }]}>
                  {hasHealthDevice ? "Enhanced TDEE Ready" : "Precision TDEE"}
                </Text>
                <Text style={[styles.deviceIntegrationSubtitle, { color: theme.colors.textSecondary }]}>
                  {hasHealthDevice ? "Real activity data connected" : "Connect for accurate targets"}
                </Text>
              </View>
            </View>
            
            {hasHealthDevice ? (
              <View style={styles.deviceConnectedContent}>
                <View style={[styles.deviceStatusBadge, { backgroundColor: theme.colors.success + '15' }]}>
                  <Ionicons name="pulse" size={16} color={theme.colors.success} />
                  <Text style={[styles.deviceStatusText, { color: theme.colors.success }]}>
                    Health device connected - Enhanced calculations available
                  </Text>
                </View>
                
                <View style={styles.deviceFeatureGrid}>
                  {[
                    { icon: "analytics", text: "Real activity analysis" },
                    { icon: "trending-up", text: "Enhanced vs standard TDEE" },
                    { icon: "target", text: "Personalized targets" }
                  ].map((feature, index) => (
                    <View key={index} style={[styles.deviceFeature, { backgroundColor: theme.colors.card }]}>
                      <Ionicons name={feature.icon as any} size={16} color={theme.colors.success} />
                      <Text style={[styles.deviceFeatureText, { color: theme.colors.text }]}>{feature.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.deviceDisconnectedContent}>
                <Text style={[styles.deviceDescription, { color: theme.colors.textSecondary }]}>
                  Get 200-500+ calories/day accuracy boost with real activity data
                </Text>
                
                <TouchableOpacity 
                  style={[styles.connectDeviceButton, { backgroundColor: theme.colors.info }]}
                  onPress={() => navigation.navigate('HealthDeviceSetup')}
                >
                  <Ionicons name="add-circle" size={20} color={theme.colors.buttonText} />
                  <Text style={[styles.connectDeviceText, { color: theme.colors.buttonText }]}>
                    Connect Health Device
                  </Text>
                </TouchableOpacity>
                
                <Text style={[styles.deviceOptionalText, { color: theme.colors.textTertiary }]}>
                  Optional - You can connect devices later in settings
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Continue Button */}
        <View style={styles.continueSection}>
          <TouchableOpacity 
            style={[
              styles.continueButton, 
              { backgroundColor: selectedMode ? theme.colors.primary : theme.colors.textSecondary },
              !selectedMode && { opacity: 0.6 }
            ]} 
            onPress={handleSave}
            disabled={!selectedMode}
          >
            <View style={styles.continueButtonContent}>
              <View style={[styles.continueButtonIcon, { backgroundColor: theme.colors.buttonText + '20' }]}>
                <Ionicons 
                  name={performanceMode ? "trophy" : "sparkles"} 
                  size={24} 
                  color={theme.colors.buttonText} 
                />
              </View>
              <View style={styles.continueButtonText}>
                <Text style={[styles.continueButtonTitle, { color: theme.colors.buttonText }]}>
                  {performanceMode ? 'Setup Athletic Profile' : 'Start AI Optimization'}
                </Text>
                <Text style={[styles.continueButtonSubtitle, { color: theme.colors.buttonText + 'CC' }]}>
                  {performanceMode 
                    ? 'Configure training and nutrition goals' 
                    : 'Get personalized calorie targets'
                  }
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color={theme.colors.buttonText} />
            </View>
          </TouchableOpacity>
          
          {!selectedMode && (
            <Text style={[styles.continueHint, { color: theme.colors.textSecondary }]}>
              Select a goal mode to continue
            </Text>
          )}
        </View>

        {/* Debug buttons for testing persistence */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Goal Config: {goalConfiguration ? 'EXISTS' : 'NULL'}
            {goalConfiguration ? ` (${goalConfiguration.mode})` : ''}
          </Text>
          <TouchableOpacity style={styles.debugButton} onPress={debugStore}>
            <Text style={styles.debugButtonText}>Debug Store</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => navigation.navigate('DebugStorage' as any)}
          >
            <Text style={styles.debugButtonText}>Storage Debug</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.debugButton, styles.clearButton]} onPress={clearAllData}>
            <Text style={styles.debugButtonText}>Clear Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* User Stats Modal - for basic users */}
      {showUserStatsForm && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Personal Information
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                We need this information to calculate your accurate daily calorie needs.
              </Text>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {/* Age */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Age (years)</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.card, 
                    color: theme.colors.text,
                    borderColor: theme.colors.border 
                  }]}
                  value={userStats.age}
                  onChangeText={(text) => setUserStats(prev => ({ ...prev, age: text }))}
                  placeholder="e.g., 28"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              {/* Gender */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Gender</Text>
                <View style={styles.genderOptions}>
                  {[
                    { key: 'male', label: 'Male' },
                    { key: 'female', label: 'Female' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.genderOption,
                        {
                          backgroundColor: userStats.gender === option.key 
                            ? theme.colors.primary 
                            : theme.colors.card,
                          borderColor: userStats.gender === option.key 
                            ? theme.colors.primary 
                            : theme.colors.border
                        }
                      ]}
                      onPress={() => setUserStats(prev => ({ ...prev, gender: option.key as 'male' | 'female' }))}
                    >
                      <Text style={[
                        styles.genderOptionText,
                        { color: userStats.gender === option.key ? theme.colors.buttonText : theme.colors.text }
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Height */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Height (cm)</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.card, 
                    color: theme.colors.text,
                    borderColor: theme.colors.border 
                  }]}
                  value={userStats.height}
                  onChangeText={(text) => setUserStats(prev => ({ ...prev, height: text }))}
                  placeholder="e.g., 175"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={() => setShowUserStatsForm(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalContinueButton, 
                  { 
                    backgroundColor: areUserStatsComplete() ? theme.colors.primary : theme.colors.textSecondary,
                    opacity: areUserStatsComplete() ? 1 : 0.6 
                  }
                ]}
                onPress={() => {
                  if (areUserStatsComplete()) {
                    setShowUserStatsForm(false);
                    setShowTargetGoalsForm(true);
                  }
                }}
                disabled={!areUserStatsComplete()}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.buttonText }]}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Goals Modal - different for basic vs performance users */}
      {showTargetGoalsForm && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {performanceMode ? 'Body Composition Goals' : 'Set Your Goals'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                {performanceMode 
                  ? 'Set your weight/body fat targets. You\'ll set performance goals (race times, etc.) in the next step.'
                  : 'Tell us your current weight and what you want to achieve.'
                }
              </Text>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {/* Current Weight */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Current Weight (kg)</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.card, 
                    color: theme.colors.text,
                    borderColor: theme.colors.border 
                  }]}
                  value={targetGoals.currentWeight}
                  onChangeText={(text) => setTargetGoals(prev => ({ ...prev, currentWeight: text }))}
                  placeholder="e.g., 75"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              {/* Activity Level - for basic users */}
              {!performanceMode && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Activity Level</Text>
                  <Text style={[styles.inputHelper, { color: theme.colors.textSecondary }]}>
                    How active are you in your daily life and exercise?
                  </Text>
                  <View style={styles.activityOptions}>
                    {[
                      { key: 'sedentary', label: 'Sedentary', desc: 'Desk job, no exercise' },
                      { key: 'light', label: 'Light', desc: 'Light exercise 1-3 days/week' },
                      { key: 'moderate', label: 'Moderate', desc: 'Exercise 3-5 days/week' },
                      { key: 'active', label: 'Active', desc: 'Heavy exercise 6-7 days/week' },
                      { key: 'very_active', label: 'Very Active', desc: 'Physical job + exercise' }
                    ].map(option => (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.activityOption,
                          { 
                            backgroundColor: targetGoals.activityLevel === option.key 
                              ? theme.colors.primary + '20' 
                              : theme.colors.card,
                            borderColor: targetGoals.activityLevel === option.key 
                              ? theme.colors.primary 
                              : theme.colors.border
                          }
                        ]}
                        onPress={() => setTargetGoals(prev => ({ ...prev, activityLevel: option.key as any }))}
                      >
                        <Text style={[
                          styles.activityOptionTitle,
                          { color: targetGoals.activityLevel === option.key ? theme.colors.primary : theme.colors.text }
                        ]}>
                          {option.label}
                        </Text>
                        <Text style={[
                          styles.activityOptionDesc,
                          { color: theme.colors.textSecondary }
                        ]}>
                          {option.desc}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Goal already selected on main screen - no need to ask again */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Selected Goal
                </Text>
                <View style={[styles.selectedGoalDisplay, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}>
                  <Ionicons 
                    name={selectedMode === 'cut' ? 'arrow-down-outline' : selectedMode === 'bulk' ? 'arrow-up-outline' : 'remove-outline'} 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                  <Text style={[styles.selectedGoalText, { color: theme.colors.primary }]}>
                    {selectedMode === 'cut' ? 'Lose Weight' : selectedMode === 'bulk' ? 'Gain Weight' : 'Maintain Weight'}
                  </Text>
                </View>
              </View>

              {/* Target Weight - show for cut/bulk, not maintenance */}
              {!performanceMode && (selectedMode === 'cut' || selectedMode === 'bulk') && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Target Weight (kg)</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.card, 
                      color: theme.colors.text,
                      borderColor: theme.colors.border 
                    }]}
                    value={targetGoals.targetWeight}
                    onChangeText={(text) => setTargetGoals(prev => ({ ...prev, targetWeight: text }))}
                    placeholder="e.g., 70"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              )}

              {/* Body Fat Goals - only for performance mode */}
              {performanceMode && targetGoals.primaryGoal === 'bodyFat' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Current Body Fat % (optional)</Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: theme.colors.card, 
                        color: theme.colors.text,
                        borderColor: theme.colors.border 
                      }]}
                      value={targetGoals.currentBodyFat}
                      onChangeText={(text) => setTargetGoals(prev => ({ ...prev, currentBodyFat: text }))}
                      placeholder="e.g., 18"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Target Body Fat %</Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: theme.colors.card, 
                        color: theme.colors.text,
                        borderColor: theme.colors.border 
                      }]}
                      value={targetGoals.targetBodyFat}
                      onChangeText={(text) => setTargetGoals(prev => ({ ...prev, targetBodyFat: text }))}
                      placeholder="e.g., 12"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}

              {/* Performance Only Message - only for performance mode */}
              {performanceMode && targetGoals.primaryGoal === 'performance' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputHelper, { color: theme.colors.textSecondary }]}>
                    Focus on performance goals only. You can set race times and training targets in the athlete setup.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.colors.card }]}
                onPress={() => setShowTargetGoalsForm(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalContinueButton, 
                  { backgroundColor: areTargetGoalsComplete() ? theme.colors.primary : theme.colors.textSecondary }
                ]}
                onPress={() => {
                  if (areTargetGoalsComplete()) {
                    setShowTargetGoalsForm(false);
                    setTimeout(() => handleSave(), 100);
                  }
                }}
                disabled={!areTargetGoalsComplete()}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.buttonText }]}>
                  {performanceMode ? 'Continue to Athlete Setup' : 'Create My Plan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  // Hero Section Styles
  heroSection: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    flex: 1,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  themeToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  heroFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroFeature: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  heroFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFeatureText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Section Card Styles
  sectionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Goal Mode Grid and Buttons
  goalModeGrid: {
    gap: 12,
  },
  goalModeButton: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 80,
  },
  goalModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  goalModeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalModeText: {
    flex: 1,
  },
  goalModeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalModeDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  goalModeSelectedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  // Performance Toggle Card Styles
  performanceToggleCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  performanceToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  performanceToggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  performanceToggleText: {
    flex: 1,
  },
  performanceToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  performanceToggleSubtext: {
    fontSize: 14,
    lineHeight: 18,
  },
  // AI Strategy Card Styles
  aiStrategyCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  aiStrategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  aiStrategyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiStrategyHeaderText: {
    flex: 1,
  },
  aiStrategyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  aiStrategySubtitle: {
    fontSize: 14,
  },
  aiStrategyDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  aiFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  aiFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    minWidth: '48%',
    flex: 1,
  },
  aiFeatureText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  aiHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  aiHighlightText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: theme.colors.text,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modeButton: {
    width: '48%',
    borderWidth: 2,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  // Removed duplicate inputLabel and input - they're defined below in the modal styles
  toggleButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: theme.colors.buttonText,
    fontWeight: '600',
  },
  // Timeline Options Styles
  timelineOptions: {
    gap: 12,
  },
  timelineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 16,
  },
  timelineOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineOptionText: {
    flex: 1,
  },
  timelineOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineOptionDesc: {
    fontSize: 14,
    lineHeight: 18,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    gap: 12,
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  // AI Explanation styles for all goal modes
  aiExplanationCard: {
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiExplanationText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  aiFeaturesList: {
    marginBottom: 16,
  },
  aiFeature: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  aiNote: {
    fontSize: 14,
    color: '#FF8C42',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  // Continue Button Styles
  continueSection: {
    marginVertical: 8,
  },
  continueButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
    transform: [{ scale: 1 }],
  },
  continueButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  continueButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    flex: 1,
    alignItems: 'center',
  },
  continueButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  continueButtonSubtitle: {
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  continueHint: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Device Integration Card Styles
  deviceIntegrationCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  deviceIntegrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  deviceIntegrationIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIntegrationHeaderText: {
    flex: 1,
  },
  deviceIntegrationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  deviceIntegrationSubtitle: {
    fontSize: 14,
  },
  deviceConnectedContent: {
    gap: 16,
  },
  deviceStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  deviceStatusText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  deviceFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deviceFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    minWidth: '48%',
    flex: 1,
  },
  deviceFeatureText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  deviceDisconnectedContent: {
    gap: 16,
    alignItems: 'center',
  },
  deviceDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  connectDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectDeviceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deviceOptionalText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Debug styles (temporary for testing persistence)
  debugContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  debugButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  debugText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  // Date picker styles
  dateButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputHelper: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  goalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalOption: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  goalOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedGoalDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  selectedGoalText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalContinueButton: {
    // backgroundColor set dynamically
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Activity Level Selection Styles
  activityOptions: {
    gap: 12,
  },
  activityOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: theme.colors.card,
  },
  activityOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityOptionDesc: {
    fontSize: 14,
    lineHeight: 18,
  },
  
  // Gender option styles
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  genderOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoalSetupScreen;
