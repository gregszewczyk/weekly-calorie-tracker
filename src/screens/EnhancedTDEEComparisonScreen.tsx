/**
 * Enhanced TDEE Comparison Screen
 * 
 * Shows comparison between standard TDEE calculation (based on basic stats)
 * and enhanced TDEE calculation (based on actual activity data from health devices)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types/NavigationTypes';
import { healthDeviceManager } from '../services/HealthDeviceManager';
import { UniversalActivity } from '../types/HealthDeviceTypes';
import { AthleteProfile } from '../types/AthleteTypes';
import { AthleteProfileTDEEService, EnhancedTDEEResult } from '../services/AthleteProfileTDEEService';
import { garminProxyService } from '../services/GarminProxyService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface TDEECalculation {
  dailyCalories: number;
  method: string;
  confidence: 'high' | 'medium' | 'low';
  breakdown: {
    bmr: number;
    activityMultiplier: number;
    exerciseCalories: number;
  };
}

interface Props {
  route: {
    params: {
      athleteProfile?: AthleteProfile;
      userStats: {
        age: number;
        gender: 'male' | 'female';
        weight: number; // kg
        height: number; // cm
        activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
      };
      goalConfig: any;
      onAcceptEnhanced: (enhancedTDEE: number) => void;
      onUseStandard: (standardTDEE: number) => void;
    };
  };
}

const EnhancedTDEEComparisonScreen: React.FC<NativeStackScreenProps<RootStackParamList, 'EnhancedTDEEComparison'>> = ({ route }) => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { athleteProfile, userStats, goalConfig, onAcceptEnhanced, onUseStandard } = route.params;

  const [loading, setLoading] = useState(true);
  const [standardTDEE, setStandardTDEE] = useState<TDEECalculation | null>(null);
  const [athleteProfileTDEE, setAthleteProfileTDEE] = useState<EnhancedTDEEResult | null>(null);
  const [enhancedTDEE, setEnhancedTDEE] = useState<TDEECalculation | null>(null);
  const [recentActivities, setRecentActivities] = useState<UniversalActivity[]>([]);
  const [manualTDEE, setManualTDEE] = useState<string>('');
  const [isManualTDEEValid, setIsManualTDEEValid] = useState<boolean>(false);

  useEffect(() => {
    calculateBothTDEE();
  }, []);

  const calculateStandardTDEE = (): TDEECalculation => {
    console.log('[EnhancedTDEE] Calculating Standard TDEE');
    console.log('🔢 [EnhancedTDEE] athleteProfile available:', !!athleteProfile);
    console.log('🔢 [EnhancedTDEE] userStats available:', !!userStats);
    
    // Use athlete profile data if available, otherwise fall back to userStats
    let stats;
    if (athleteProfile && athleteProfile.physicalStats) {
      console.log('🏃‍♂️ [EnhancedTDEE] Using athlete profile for standard TDEE');
      stats = {
        age: athleteProfile.physicalStats.age,
        gender: athleteProfile.physicalStats.gender,
        weight: athleteProfile.physicalStats.weight,
        height: athleteProfile.physicalStats.height,
        // FIXED: Use actual user activity level instead of hardcoded 'moderate'
        activityLevel: userStats?.activityLevel || 'moderate' as const // Use userStats activity level if available
      };
    } else if (userStats) {
      console.log('👤 [EnhancedTDEE] Using userStats for standard TDEE');
      stats = userStats;
    } else {
      console.error('❌ [EnhancedTDEE] No stats available for TDEE calculation');
      throw new Error('No user stats or athlete profile available for TDEE calculation');
    }

    console.log('📊 [EnhancedTDEE] Using stats:', stats);
    
    // Mifflin-St Jeor Equation for BMR
    let bmr: number;
    if (stats.gender === 'male') {
      bmr = 10 * stats.weight + 6.25 * stats.height - 5 * stats.age + 5;
    } else {
      bmr = 10 * stats.weight + 6.25 * stats.height - 5 * stats.age - 161;
    }
    
    console.log('🔢 [EnhancedTDEE] BMR calculation:');
    console.log(`  Gender: ${stats.gender}`);
    console.log(`  Weight: ${stats.weight}kg`);
    console.log(`  Height: ${stats.height}cm`);  
    console.log(`  Age: ${stats.age}y`);
    console.log(`  BMR: ${bmr} calories`);

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const multiplier = activityMultipliers[stats.activityLevel];
    const dailyCalories = Math.round(bmr * multiplier);
    
    console.log('🔢 [EnhancedTDEE] Activity calculation:');
    console.log(`  Activity Level: ${stats.activityLevel}`);
    console.log(`  Multiplier: ${multiplier}`);
    console.log(`  TDEE: ${bmr} × ${multiplier} = ${dailyCalories} calories`);

    return {
      dailyCalories,
      method: athleteProfile ? 'Basic TDEE (From Athlete Profile)' : 'Basic Mifflin-St Jeor + Activity Level',
      confidence: 'medium',
      breakdown: {
        bmr: Math.round(bmr),
        activityMultiplier: multiplier,
        exerciseCalories: Math.round(dailyCalories - bmr),
      },
    };
  };

  const calculateEnhancedTDEE = async (activities: UniversalActivity[]): Promise<TDEECalculation> => {
    console.log('🔢 [Enhanced TDEE] Starting enhanced TDEE calculation');
    console.log('🔢 [Enhanced TDEE] athleteProfile available:', !!athleteProfile);
    console.log('🔢 [Enhanced TDEE] userStats available:', !!userStats);
    console.log('🔢 [Enhanced TDEE] activities count:', activities.length);
    
    // Use athlete profile data if available, otherwise fall back to userStats
    let stats;
    if (athleteProfile && athleteProfile.physicalStats) {
      console.log('🏃‍♂️ [EnhancedTDEE] Using athlete profile for enhanced TDEE');
      stats = {
        age: athleteProfile.physicalStats.age,
        gender: athleteProfile.physicalStats.gender,
        weight: athleteProfile.physicalStats.weight,
        height: athleteProfile.physicalStats.height,
        // FIXED: Use actual user activity level instead of hardcoded 'moderate'
        activityLevel: userStats?.activityLevel || 'moderate' as const // Use userStats activity level if available
      };
    } else if (userStats) {
      console.log('👤 [EnhancedTDEE] Using userStats for enhanced TDEE');
      stats = userStats;
    } else {
      console.error('❌ [EnhancedTDEE] No stats available for enhanced TDEE calculation');
      throw new Error('No user stats or athlete profile available for enhanced TDEE calculation');
    }

    // Calculate BMR using available stats
    let bmr: number;
    if (stats.gender === 'male') {
      bmr = 10 * stats.weight + 6.25 * stats.height - 5 * stats.age + 5;
    } else {
      bmr = 10 * stats.weight + 6.25 * stats.height - 5 * stats.age - 161;
    }

    console.log('🔢 [Enhanced TDEE] BMR calculation:');
    console.log(`  Gender: ${stats.gender}`);
    console.log(`  Weight: ${stats.weight}kg`);
    console.log(`  Height: ${stats.height}cm`);  
    console.log(`  Age: ${stats.age}y`);
    console.log(`  BMR: ${bmr} calories`);

    // Get TOTAL ACTIVE CALORIES from last 14 days (not just structured activities)
    let averageDailyExercise = 0;
    let dataSource = 'activities_fallback';
    
    try {
      // Check if we have Garmin connection for daily summary data
      const connections = healthDeviceManager.getConnections();
      const garminConnection = connections.find(c => c.platform === 'garmin' && c.status === 'connected');
      
      if (garminConnection) {
        console.log('🔍 [Enhanced TDEE] Getting TOTAL ACTIVE CALORIES from Garmin daily summaries...');
        
        // Get daily summaries for the last 14 days
        const dailySummaries = [];
        for (let i = 0; i < 14; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          
          try {
            const summary = await garminProxyService.getDailySummary(dateString);
            if (summary && summary.activeCalories > 0) {
              dailySummaries.push({
                date: dateString,
                activeCalories: summary.activeCalories
              });
            }
          } catch (error) {
            console.log(`⚠️ [Enhanced TDEE] Failed to get daily summary for ${dateString}:`, error instanceof Error ? error.message : 'Unknown error');
          }
        }
        
        if (dailySummaries.length > 0) {
          const totalActiveCalories = dailySummaries.reduce((sum, day) => sum + day.activeCalories, 0);
          const rawAverage = totalActiveCalories / dailySummaries.length;
          // Apply 10% conservative adjustment for device accuracy
          averageDailyExercise = rawAverage * 0.9;
          dataSource = 'total_active_calories';
          
          console.log('✅ [Enhanced TDEE] Using TOTAL ACTIVE CALORIES (14-day average with 10% adjustment):', {
            daysOfData: dailySummaries.length,
            totalActiveCalories,
            rawAverage: Math.round(rawAverage),
            adjustedAverage: Math.round(averageDailyExercise),
            adjustmentFactor: '0.9 (10% reduction)',
            dailyBreakdown: dailySummaries.map(d => `${d.date}: ${d.activeCalories} cal`).slice(0, 7) // Show first 7 days
          });
        }
      }
    } catch (error) {
      console.log('⚠️ [Enhanced TDEE] Failed to get daily summary data:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Fallback to activity-based calculation if daily summary not available
    if (averageDailyExercise === 0) {
      const totalExerciseCalories = activities.reduce((total, activity) => total + (activity.calories || 0), 0);
      const rawAverage = activities.length > 0 ? totalExerciseCalories / 14 : 0;
      averageDailyExercise = rawAverage * 0.9;
      dataSource = 'activities_fallback';
      
      console.log('📊 [Enhanced TDEE] FALLBACK - Using structured activities only (missing walking/daily movement):', {
        activitiesCount: activities.length,
        totalExerciseCalories,
        rawAverage: Math.round(rawAverage),
        adjustedAverage: Math.round(averageDailyExercise),
        note: 'This misses ~400 calories of daily movement - need daily summary data'
      });
    }

    // Base metabolic activity (BMR * 1.2 for sedentary daily activities)
    const baseActivity = bmr * 0.2;
    
    // Enhanced TDEE = BMR + base daily activities + actual exercise calories
    const dailyCalories = Math.round(bmr + baseActivity + averageDailyExercise);

    // Calculate confidence based on data quality
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (dataSource === 'daily_summary') {
      confidence = 'high'; // Daily summary data is more comprehensive
    } else {
      const activeDays = new Set(activities.map(a => a.startTime.toDateString())).size;
      if (activeDays >= 10 && activities.length >= 20) confidence = 'high';
      else if (activeDays >= 7 && activities.length >= 14) confidence = 'medium';
    }

    return {
      dailyCalories,
      method: dataSource === 'daily_summary' 
        ? 'BMR + Total Active Calories (14 days)' 
        : 'BMR + Actual Activity Data (14 days)',
      confidence,
      breakdown: {
        bmr: Math.round(bmr),
        activityMultiplier: Math.round((dailyCalories / bmr) * 100) / 100,
        exerciseCalories: Math.round(averageDailyExercise),
      },
    };
  };

  const calculateBothTDEE = async () => {
    setLoading(true);
    
    try {
      // Calculate standard TDEE
      const standard = calculateStandardTDEE();
      setStandardTDEE(standard);

      // Calculate athlete profile TDEE if available and performance mode is enabled
      if (goalConfig?.performanceMode && athleteProfile) {
        console.log('🏃‍♂️ [EnhancedTDEE] Calculating athlete profile TDEE...');
        console.log('🔍 [EnhancedTDEE] Athlete profile received:', {
          hasProfile: !!athleteProfile,
          hasPhysicalStats: !!athleteProfile.physicalStats,
          hasTrainingProfile: !!athleteProfile.trainingProfile,
          physicalStatsKeys: athleteProfile.physicalStats ? Object.keys(athleteProfile.physicalStats) : 'none',
          trainingProfileKeys: athleteProfile.trainingProfile ? Object.keys(athleteProfile.trainingProfile) : 'none'
        });
        
        try {
          const athleteTDEE = AthleteProfileTDEEService.calculateEnhancedTDEE(athleteProfile);
          setAthleteProfileTDEE(athleteTDEE);
          console.log('🎯 [EnhancedTDEE] Athlete profile TDEE calculated:', athleteTDEE.dailyCalories);
        } catch (error) {
          console.error('❌ [EnhancedTDEE] Error calculating athlete profile TDEE:', error);
        }
      }

      // Get activity data if available
      console.log('🔍 [EnhancedTDEE] Checking health device connections...');
      const hasConnections = healthDeviceManager.hasAnyConnection();
      console.log('🔍 [EnhancedTDEE] Has connections:', hasConnections);
      
      if (hasConnections) {
        const connections = healthDeviceManager.getConnections();
        console.log('🔍 [EnhancedTDEE] Available connections:', connections.map(c => `${c.platform}:${c.status}`));
        
        console.log('🔍 [EnhancedTDEE] Fetching recent activities (14 days)...');
        const activities = await healthDeviceManager.getRecentActivities(14);
        console.log('🔍 [EnhancedTDEE] Activities returned:', activities.length);
        
        if (activities.length > 0) {
          console.log('🔍 [EnhancedTDEE] Sample activities:', activities.slice(0, 2).map(a => ({
            id: a.id,
            platform: a.platform, 
            name: a.displayName,
            calories: a.calories,
            date: a.startTime.toISOString().split('T')[0]
          })));
        } else {
          console.log('⚠️ [EnhancedTDEE] No activities returned - this will show "No enhanced data available"');
        }
        
        setRecentActivities(activities);
        
        if (activities.length > 0) {
          const enhanced = await calculateEnhancedTDEE(activities);
          console.log('✅ [EnhancedTDEE] Enhanced TDEE calculated:', enhanced.dailyCalories);
          setEnhancedTDEE(enhanced);
        }
      } else {
        console.log('⚠️ [EnhancedTDEE] No health device connections available');
      }
    } catch (error) {
      console.error('❌ [EnhancedTDEE] Error calculating TDEE:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualTDEEChange = (text: string) => {
    setManualTDEE(text);
    
    // Validate manual TDEE input
    const numericValue = parseInt(text, 10);
    const isValid = !isNaN(numericValue) && numericValue >= 1000 && numericValue <= 6000;
    setIsManualTDEEValid(isValid);
    
    console.log('🔢 [ManualTDEE] Input changed:', { text, numericValue, isValid });
  };

  const handleUseManualTDEE = () => {
    console.log('🔘 [EnhancedTDEE] User pressed Manual TDEE button');
    console.log('🔘 [EnhancedTDEE] manualTDEE value:', manualTDEE);
    console.log('🔘 [EnhancedTDEE] isManualTDEEValid:', isManualTDEEValid);
    
    if (!isManualTDEEValid) {
      Alert.alert(
        'Invalid TDEE',
        'Please enter a valid TDEE value between 1,000 and 6,000 calories per day.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    const numericValue = parseInt(manualTDEE, 10);
    console.log('🔘 [EnhancedTDEE] Using manual TDEE:', numericValue);
    onAcceptEnhanced(numericValue);
  };

  const handleUseStandard = () => {
    console.log('🔘 [EnhancedTDEE] User pressed Standard TDEE button');
    console.log('🔘 [EnhancedTDEE] standardTDEE exists:', !!standardTDEE);
    console.log('🔘 [EnhancedTDEE] standardTDEE value:', standardTDEE?.dailyCalories);
    console.log('🔘 [EnhancedTDEE] onUseStandard callback exists:', !!onUseStandard);
    
    if (standardTDEE) {
      onUseStandard(standardTDEE.dailyCalories);
      // Don't navigate back - let the callback handle navigation
    } else {
      console.log('❌ [EnhancedTDEE] Cannot use standard TDEE - no data available');
    }
  };

  const handleUseEnhanced = () => {
    console.log('🔘 [EnhancedTDEE] User pressed Enhanced TDEE button');
    
    // For performance mode users: prioritize athlete profile TDEE, then device-based enhanced TDEE
    // For basic users: only use device-based enhanced TDEE
    if (goalConfig?.performanceMode && athleteProfileTDEE) {
      console.log('🏃‍♂️ [EnhancedTDEE] Using athlete profile TDEE:', athleteProfileTDEE.dailyCalories);
      onAcceptEnhanced(athleteProfileTDEE.dailyCalories);
      // Don't navigate back - let the callback handle navigation
    } else if (enhancedTDEE) {
      console.log('📱 [EnhancedTDEE] Using device-based enhanced TDEE:', enhancedTDEE.dailyCalories);
      onAcceptEnhanced(enhancedTDEE.dailyCalories);
      // Don't navigate back - let the callback handle navigation
    } else {
      console.log('❌ [EnhancedTDEE] Cannot use enhanced TDEE - no data available');
    }
  };

  const getDifference = (): { amount: number; percentage: number } => {
    if (!standardTDEE || !enhancedTDEE) return { amount: 0, percentage: 0 };
    const amount = enhancedTDEE.dailyCalories - standardTDEE.dailyCalories;
    const percentage = Math.round((amount / standardTDEE.dailyCalories) * 100);
    return { amount, percentage };
  };

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return theme.colors.success;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.error;
    }
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Calculating Enhanced TDEE...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const difference = getDifference();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            TDEE Comparison
          </Text>
        </View>

        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Compare standard calculation vs your actual activity data
        </Text>

        {/* User Profile Info */}
        <View style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
          <View style={styles.profileText}>
            <Text style={[styles.profileTitle, { color: theme.colors.text }]}>Your Profile</Text>
            <Text style={[styles.profileDescription, { color: theme.colors.textSecondary }]}>
              {(() => {
                if (athleteProfile && athleteProfile.physicalStats) {
                  const stats = athleteProfile.physicalStats;
                  const sport = athleteProfile.trainingProfile?.primarySport || 'athlete';
                  return `Calculations based on: ${stats.age}y ${stats.gender}, ${stats.weight}kg, ${stats.height}cm${stats.bodyFatPercentage ? `, ${stats.bodyFatPercentage}% BF` : ''}, ${sport}`;
                } else if (userStats) {
                  return `Calculations based on: ${userStats.age}y ${userStats.gender}, ${userStats.weight}kg, ${userStats.height}cm, ${userStats.activityLevel} activity level`;
                } else {
                  return 'No user stats available for calculation.';
                }
              })()}
            </Text>
          </View>
        </View>

        {/* Standard TDEE Card */}
        {standardTDEE && (
          <View style={[styles.tdeeCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="bar-chart-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  Standard TDEE
                </Text>
              </View>
              <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(standardTDEE.confidence) }]}>
                <Text style={styles.confidenceText}>{standardTDEE.confidence.toUpperCase()}</Text>
              </View>
            </View>
            
            <Text style={[styles.calorieAmount, { color: theme.colors.primary }]}>
              {standardTDEE.dailyCalories.toLocaleString()} calories/day
            </Text>
            
            <Text style={[styles.method, { color: theme.colors.textSecondary }]}>
              {standardTDEE.method}
            </Text>
            
            <View style={styles.breakdown}>
              <Text style={[styles.breakdownText, { color: theme.colors.textSecondary }]}>
                BMR: {standardTDEE.breakdown.bmr} cal
              </Text>
              <Text style={[styles.breakdownText, { color: theme.colors.textSecondary }]}>
                Activity: ×{standardTDEE.breakdown.activityMultiplier}
              </Text>
            </View>
          </View>
        )}

        {/* Athlete Profile TDEE Card - Only for Performance Mode Users */}
        {goalConfig?.performanceMode && athleteProfileTDEE && (
          <View style={[styles.tdeeCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="trophy-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  Athlete Profile TDEE
                </Text>
              </View>
              <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(athleteProfileTDEE.confidence) }]}>
                <Text style={styles.confidenceText}>{athleteProfileTDEE.confidence.toUpperCase()}</Text>
              </View>
            </View>
            
            <Text style={[styles.calorieAmount, { color: theme.colors.primary }]}>
              {athleteProfileTDEE.dailyCalories.toLocaleString()} calories/day
            </Text>
            
            <Text style={[styles.method, { color: theme.colors.textSecondary }]}>
              {athleteProfileTDEE.method}
            </Text>
            
            <View style={styles.breakdown}>
              <Text style={[styles.breakdownText, { color: theme.colors.textSecondary }]}>
                BMR: {athleteProfileTDEE.breakdown.bmr} cal
              </Text>
              <Text style={[styles.breakdownText, { color: theme.colors.textSecondary }]}>
                Exercise: {athleteProfileTDEE.breakdown.exerciseCalories} cal/day
              </Text>
            </View>
            
            <View style={styles.breakdown}>
              <Text style={[styles.breakdownText, { color: theme.colors.textSecondary }]}>
                Training: {athleteProfileTDEE.factors.totalWeeklyHours}h/week
              </Text>
              <Text style={[styles.breakdownText, { color: theme.colors.textSecondary }]}>
                Sport Adj: +{athleteProfileTDEE.breakdown.sportSpecificAdjustment} cal
              </Text>
            </View>
            
            <Text style={[styles.dataSource, { color: theme.colors.textSecondary }]}>
              Based on comprehensive athlete profile data
            </Text>
          </View>
        )}

        {/* Enhanced TDEE Card */}
        {enhancedTDEE ? (
          <View style={[styles.tdeeCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="analytics-outline" size={20} color={theme.colors.success} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  Enhanced TDEE
                </Text>
              </View>
              <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(enhancedTDEE.confidence) }]}>
                <Text style={styles.confidenceText}>{enhancedTDEE.confidence.toUpperCase()}</Text>
              </View>
            </View>
            
            <Text style={[styles.calorieAmount, { color: theme.colors.success }]}>
              {enhancedTDEE.dailyCalories.toLocaleString()} calories/day
            </Text>
            
            <Text style={[styles.method, { color: theme.colors.textSecondary }]}>
              {enhancedTDEE.method}
            </Text>
            
            <View style={styles.breakdown}>
              <Text style={[styles.breakdownText, { color: theme.colors.textSecondary }]}>
                BMR: {enhancedTDEE.breakdown.bmr} cal
              </Text>
              <Text style={[styles.breakdownText, { color: theme.colors.textSecondary }]}>
                Avg Exercise: {enhancedTDEE.breakdown.exerciseCalories} cal/day
              </Text>
            </View>
            
            <Text style={[styles.dataSource, { color: theme.colors.textSecondary }]}>
              Based on {recentActivities.length} activities from last 14 days
            </Text>
          </View>
        ) : (
          <View style={[styles.noEnhancedCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="analytics-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.noEnhancedTitle, { color: theme.colors.text }]}>
              Enhanced TDEE Unavailable
            </Text>
            <Text style={[styles.noEnhancedText, { color: theme.colors.textSecondary }]}>
              Enhanced TDEE requires 14 days of activity data from a connected health device. You can still use Standard TDEE{goalConfig?.performanceMode ? ', Athlete Profile TDEE, or enter a Custom TDEE' : ''} below.
            </Text>
          </View>
        )}

        {/* Manual TDEE Card - Only for Performance Mode Users */}
        {goalConfig?.performanceMode && (
          <View style={[styles.tdeeCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="create-outline" size={20} color={theme.colors.warning} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  Custom TDEE
                </Text>
              </View>
              <View style={[styles.confidenceBadge, { backgroundColor: theme.colors.warning }]}>
                <Text style={styles.confidenceText}>MANUAL</Text>
              </View>
            </View>
            
            <View style={styles.manualInputContainer}>
              <TextInput
                style={[
                  styles.manualTDEEInput,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: isManualTDEEValid ? theme.colors.success : theme.colors.border,
                    color: theme.colors.text
                  }
                ]}
                value={manualTDEE}
                onChangeText={handleManualTDEEChange}
                placeholder="Enter your TDEE (e.g., 2500)"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                maxLength={4}
              />
              <Text style={[styles.caloriesLabel, { color: theme.colors.textSecondary }]}>
                calories/day
              </Text>
            </View>
            
            <Text style={[styles.method, { color: theme.colors.textSecondary }]}>
              Professional Assessment or Personal Experience
            </Text>
            
            {isManualTDEEValid && (
              <View style={styles.breakdown}>
                <Text style={[styles.breakdownText, { color: theme.colors.textSecondary }]}>
                  Entered Value: {parseInt(manualTDEE, 10).toLocaleString()} cal
                </Text>
                <Text style={[styles.breakdownText, { color: theme.colors.success }]}>
                  ✓ Valid Range
                </Text>
              </View>
            )}
            
            <Text style={[styles.dataSource, { color: theme.colors.textSecondary }]}>
              For performance mode users with professional guidance or extensive experience
            </Text>
          </View>
        )}

        {/* Athlete Profile vs Standard Comparison - Only for Performance Mode Users */}
        {goalConfig?.performanceMode && athleteProfileTDEE && standardTDEE && (
          <View style={[styles.differenceCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="trophy-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Athlete Profile vs Standard
              </Text>
            </View>
            
            <View style={styles.differenceRow}>
              <Text style={[styles.differenceLabel, { color: theme.colors.textSecondary }]}>
                Difference:
              </Text>
              <Text style={[
                styles.differenceAmount, 
                { color: (athleteProfileTDEE.dailyCalories - standardTDEE.dailyCalories) > 0 ? theme.colors.success : theme.colors.error }
              ]}>
                {(athleteProfileTDEE.dailyCalories - standardTDEE.dailyCalories) > 0 ? '+' : ''}{athleteProfileTDEE.dailyCalories - standardTDEE.dailyCalories} calories ({Math.round(((athleteProfileTDEE.dailyCalories - standardTDEE.dailyCalories) / standardTDEE.dailyCalories) * 100)}%)
              </Text>
            </View>
            
            <Text style={[styles.impactText, { color: theme.colors.textSecondary }]}>
              {Math.abs(athleteProfileTDEE.dailyCalories - standardTDEE.dailyCalories) > 300 
                ? 'Significant difference! Your athlete profile shows much higher energy needs than basic calculations.'
                : 'Moderate difference. Your training load and sport specificity add meaningful calorie requirements.'
              }
            </Text>
          </View>
        )}

        {/* Device Data vs Standard Comparison */}
        {enhancedTDEE && standardTDEE && (
          <View style={[styles.differenceCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="trending-up-outline" size={20} color={theme.colors.success} />
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Impact Analysis
              </Text>
            </View>
            
            <View style={styles.differenceRow}>
              <Text style={[styles.differenceLabel, { color: theme.colors.textSecondary }]}>
                Difference:
              </Text>
              <Text style={[
                styles.differenceAmount, 
                { color: difference.amount > 0 ? theme.colors.success : theme.colors.error }
              ]}>
                {difference.amount > 0 ? '+' : ''}{difference.amount} calories ({difference.percentage > 0 ? '+' : ''}{difference.percentage}%)
              </Text>
            </View>
            
            <Text style={[styles.impactText, { color: theme.colors.textSecondary }]}>
              {Math.abs(difference.amount) > 200 
                ? 'Significant difference! Your actual activity data shows meaningful variance from standard calculations.'
                : 'Minor difference. Both methods give similar results for your activity level.'
              }
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.standardButton, { backgroundColor: theme.colors.card }]}
            onPress={handleUseStandard}
          >
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
              Use Standard TDEE
            </Text>
            <Text style={[styles.buttonSubtext, { color: theme.colors.textSecondary }]}>
              {standardTDEE?.dailyCalories.toLocaleString()} calories/day
            </Text>
          </TouchableOpacity>
          
          {enhancedTDEE && (
            <TouchableOpacity
              style={[styles.button, styles.enhancedButton, { backgroundColor: theme.colors.success }]}
              onPress={() => onAcceptEnhanced(enhancedTDEE.dailyCalories)}
            >
              <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
                Use Enhanced TDEE
              </Text>
              <Text style={[styles.buttonSubtext, { color: theme.colors.buttonText, opacity: 0.8 }]}>
                {enhancedTDEE.dailyCalories.toLocaleString()} calories/day
              </Text>
            </TouchableOpacity>
          )}
          
          {goalConfig?.performanceMode && athleteProfileTDEE && (
            <TouchableOpacity
              style={[styles.button, styles.enhancedButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => onAcceptEnhanced(athleteProfileTDEE.dailyCalories)}
            >
              <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
                Use Athlete Profile TDEE
              </Text>
              <Text style={[styles.buttonSubtext, { color: theme.colors.buttonText, opacity: 0.8 }]}>
                {athleteProfileTDEE.dailyCalories.toLocaleString()} calories/day
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Manual TDEE Button - Only for Performance Mode Users */}
          {goalConfig?.performanceMode && isManualTDEEValid && (
            <TouchableOpacity
              style={[styles.button, styles.enhancedButton, { backgroundColor: theme.colors.warning }]}
              onPress={handleUseManualTDEE}
            >
              <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
                Use Custom TDEE
              </Text>
              <Text style={[styles.buttonSubtext, { color: theme.colors.buttonText, opacity: 0.8 }]}>
                {parseInt(manualTDEE, 10).toLocaleString()} calories/day
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  tdeeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  calorieAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  method: {
    fontSize: 14,
    marginBottom: 12,
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownText: {
    fontSize: 12,
  },
  dataSource: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  noEnhancedCard: {
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    textAlign: 'center',
  },
  noEnhancedTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  noEnhancedText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  differenceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  differenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  differenceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  differenceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  impactText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  standardButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  enhancedButton: {
    // Primary background color applied via style prop
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
  },
  profileCard: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  profileText: {
    flex: 1,
    marginLeft: 8,
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  manualInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  manualTDEEInput: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  caloriesLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EnhancedTDEEComparisonScreen;