/**
 * Enhanced TDEE Calculation Service using Athlete Profile Data
 * 
 * This service calculates TDEE using the comprehensive athlete profile data
 * collected during onboarding, providing more accurate results than basic
 * age/gender/weight calculations.
 */

import { AthleteProfile, SportType, FitnessLevel, TrainingExperience } from '../types/AthleteTypes';

export interface EnhancedTDEEResult {
  dailyCalories: number;
  method: string;
  confidence: 'high' | 'medium' | 'low';
  breakdown: {
    bmr: number;
    activityMultiplier: number;
    exerciseCalories: number;
    sportSpecificAdjustment: number;
  };
  factors: {
    fitnessLevelMultiplier: number;
    experienceMultiplier: number;
    sportIntensityMultiplier: number;
    totalWeeklyHours: number;
  };
}

export class AthleteProfileTDEEService {
  
  /**
   * Calculate BMR using Mifflin-St Jeor equation with athlete-specific adjustments
   */
  private static calculateBMR(profile: AthleteProfile): number {
    console.log('🔍 [AthleteProfileTDEE] calculateBMR - Profile keys:', Object.keys(profile));
    console.log('🔍 [AthleteProfileTDEE] calculateBMR - physicalStats exists:', !!profile.physicalStats);
    
    if (profile.physicalStats) {
      console.log('🔍 [AthleteProfileTDEE] calculateBMR - physicalStats:', profile.physicalStats);
    } else {
      console.error('❌ [AthleteProfileTDEE] physicalStats is undefined!');
      console.log('🔍 [AthleteProfileTDEE] Available profile properties:', Object.keys(profile));
      throw new Error('physicalStats is required for BMR calculation');
    }
    
    const { physicalStats } = profile;
    
    let bmr: number;
    if (physicalStats.gender === 'male') {
      bmr = 10 * physicalStats.weight + 6.25 * physicalStats.height - 5 * physicalStats.age + 5;
    } else {
      bmr = 10 * physicalStats.weight + 6.25 * physicalStats.height - 5 * physicalStats.age - 161;
    }
    
    // Athlete-specific BMR adjustments based on body composition
    if (physicalStats.bodyFatPercentage) {
      console.log('🔍 [AthleteProfileTDEE] Applying body fat adjustment:', physicalStats.bodyFatPercentage);
      // Athletes with lower body fat typically have higher metabolic rates
      const bodyFatAdjustment = this.getBodyFatMultiplier(physicalStats.bodyFatPercentage, physicalStats.gender);
      bmr *= bodyFatAdjustment;
    } else {
      console.log('🔍 [AthleteProfileTDEE] No body fat percentage provided, skipping adjustment');
    }
    
    return Math.round(bmr);
  }
  
  /**
   * Get body fat percentage multiplier for BMR adjustment
   */
  private static getBodyFatMultiplier(bodyFat: number, gender: string): number {
    // Athletes typically have higher metabolic rates due to muscle mass
    const lowBodyFatThreshold = gender === 'male' ? 12 : 18;
    const veryLowBodyFatThreshold = gender === 'male' ? 8 : 14;
    
    if (bodyFat <= veryLowBodyFatThreshold) {
      return 1.15; // 15% increase for very lean athletes
    } else if (bodyFat <= lowBodyFatThreshold) {
      return 1.10; // 10% increase for lean athletes
    } else if (bodyFat <= (gender === 'male' ? 18 : 25)) {
      return 1.05; // 5% increase for athletic body composition
    }
    
    return 1.0; // No adjustment for higher body fat
  }
  
  /**
   * Get fitness level multiplier based on training adaptations
   */
  private static getFitnessLevelMultiplier(fitnessLevel: FitnessLevel): number {
    const multipliers = {
      'beginner': 1.0,
      'novice': 1.02,
      'intermediate': 1.05,
      'advanced': 1.08,
      'elite': 1.12
    };
    return multipliers[fitnessLevel] || 1.0;
  }
  
  /**
   * Get experience multiplier based on training efficiency
   */
  private static getExperienceMultiplier(experience: TrainingExperience): number {
    const multipliers = {
      'less-than-6-months': 1.0,
      '6-months-to-1-year': 1.01,
      '1-to-2-years': 1.03,
      '2-to-5-years': 1.05,
      '5-to-10-years': 1.07,
      'more-than-10-years': 1.10
    };
    return multipliers[experience] || 1.0;
  }
  
  /**
   * Get sport-specific intensity multiplier
   */
  private static getSportIntensityMultiplier(primarySport: SportType, secondarySports: SportType[]): number {
    const sportIntensities = {
      'crossfit': 1.25,
      'hyrox': 1.20,
      'triathlon': 1.18,
      'martial-arts': 1.15,
      'running': 1.12,
      'cycling': 1.10,
      'swimming': 1.15,
      'strength-training': 1.08,
      'team-sports': 1.12,
      'general-fitness': 1.05
    };
    
    const primaryIntensity = sportIntensities[primarySport] || 1.0;
    
    // Add bonus for multi-sport athletes (cross-training effect)
    const multiSportBonus = secondarySports.length > 0 ? 1.03 : 1.0;
    
    return primaryIntensity * multiSportBonus;
  }
  
  /**
   * Calculate training volume multiplier based on weekly hours
   * Made more conservative to avoid double-counting exercise calories
   */
  private static getTrainingVolumeMultiplier(totalWeeklyHours: number): number {
    if (totalWeeklyHours <= 3) return 1.2;
    if (totalWeeklyHours <= 6) return 1.3;
    if (totalWeeklyHours <= 10) return 1.4;
    if (totalWeeklyHours <= 15) return 1.5; // Reduced from 1.725
    if (totalWeeklyHours <= 20) return 1.6; // Reduced from 1.9
    return 1.7; // Reduced from 2.1 - more realistic for elite volume
  }
  
  /**
   * Calculate sport-specific calorie adjustment based on training distribution
   */
  private static calculateSportSpecificAdjustment(
    profile: AthleteProfile, 
    bmr: number, 
    totalWeeklyHours: number
  ): number {
    const { primarySport, secondarySports, sportSpecificTrainingHours } = profile.trainingProfile;
    
    let totalAdjustment = 0;
    
    // Primary sport adjustment
    const primaryHours = sportSpecificTrainingHours?.[primarySport] || 0;
    const primaryCaloriesPerHour = this.getCaloriesPerHour(primarySport, profile.physicalStats.weight);
    totalAdjustment += (primaryHours * primaryCaloriesPerHour) / 7; // Daily average
    
    // Secondary sports adjustments
    secondarySports.forEach(sport => {
      const hours = sportSpecificTrainingHours?.[sport] || 0;
      const caloriesPerHour = this.getCaloriesPerHour(sport, profile.physicalStats.weight);
      totalAdjustment += (hours * caloriesPerHour) / 7; // Daily average
    });
    
    return Math.round(totalAdjustment);
  }
  
  /**
   * Get estimated calories per hour for different sports
   */
  private static getCaloriesPerHour(sport: SportType, weight: number): number {
    // Base calories per hour per kg of body weight
    const caloriesPerKgPerHour = {
      'crossfit': 8.5,
      'hyrox': 9.0,
      'triathlon': 7.5,
      'martial-arts': 7.0,
      'running': 8.0,
      'cycling': 6.5,
      'swimming': 7.5,
      'strength-training': 5.5,
      'team-sports': 7.0,
      'general-fitness': 5.0
    };
    
    const baseRate = caloriesPerKgPerHour[sport] || 6.0;
    return Math.round(weight * baseRate);
  }
  
  /**
   * Main method to calculate enhanced TDEE from athlete profile
   */
  public static calculateEnhancedTDEE(profile: AthleteProfile): EnhancedTDEEResult {
    console.log('🏃‍♂️ [AthleteProfileTDEE] Calculating enhanced TDEE from athlete profile');
    console.log('🔍 [AthleteProfileTDEE] Profile structure:', {
      hasPhysicalStats: !!profile.physicalStats,
      hasTrainingProfile: !!profile.trainingProfile,
      physicalStatsKeys: profile.physicalStats ? Object.keys(profile.physicalStats) : 'none',
      trainingProfileKeys: profile.trainingProfile ? Object.keys(profile.trainingProfile) : 'none'
    });
    
    // Safety check - if no physicalStats, return a fallback
    if (!profile.physicalStats || !profile.trainingProfile) {
      console.error('❌ [AthleteProfileTDEE] Missing required profile data, returning fallback TDEE');
      return {
        dailyCalories: 2500, // Fallback for athletes
        method: 'Fallback Estimate (Missing Profile Data)',
        confidence: 'low',
        breakdown: {
          bmr: 1800,
          activityMultiplier: 1.4,
          exerciseCalories: 700,
          sportSpecificAdjustment: 0
        },
        factors: {
          fitnessLevelMultiplier: 1.0,
          experienceMultiplier: 1.0,
          sportIntensityMultiplier: 1.0,
          totalWeeklyHours: 0
        }
      };
    }
    
    // Calculate base BMR
    const bmr = this.calculateBMR(profile);
    
    // Get all multipliers with safety checks
    console.log('🔍 [AthleteProfileTDEE] Training profile data:', {
      currentFitnessLevel: profile.trainingProfile?.currentFitnessLevel,
      trainingExperience: profile.trainingProfile?.trainingExperience,
      primarySport: profile.trainingProfile?.primarySport,
      secondarySports: profile.trainingProfile?.secondarySports,
      sportSpecificTrainingHours: profile.trainingProfile?.sportSpecificTrainingHours
    });

    const fitnessLevelMultiplier = this.getFitnessLevelMultiplier(profile.trainingProfile.currentFitnessLevel);
    const experienceMultiplier = this.getExperienceMultiplier(profile.trainingProfile.trainingExperience);
    const sportIntensityMultiplier = this.getSportIntensityMultiplier(
      profile.trainingProfile.primarySport, 
      profile.trainingProfile.secondarySports
    );
    
    // Calculate total weekly training hours
    const trainingHours = profile.trainingProfile.sportSpecificTrainingHours || {};
    const totalWeeklyHours = Object.values(trainingHours).filter((hours): hours is number => typeof hours === 'number').reduce((sum, hours) => sum + hours, 0);
    const trainingVolumeMultiplier = this.getTrainingVolumeMultiplier(totalWeeklyHours);
    
    // Calculate sport-specific exercise calories
    const sportSpecificAdjustment = this.calculateSportSpecificAdjustment(profile, bmr, totalWeeklyHours);
    
    // Combine all factors for final TDEE
    // Use either training volume multiplier OR sport-specific adjustment, not both (to avoid double counting)
    const baseActivityTDEE = bmr * trainingVolumeMultiplier;
    const enhancedTDEE = baseActivityTDEE * fitnessLevelMultiplier * experienceMultiplier * sportIntensityMultiplier;
    // Removed "+ sportSpecificAdjustment" to avoid double-counting exercise calories
    
    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (profile.physicalStats.bodyFatPercentage && totalWeeklyHours >= 5) {
      confidence = 'high';
    } else if (totalWeeklyHours < 2) {
      confidence = 'low';
    }
    
    const result: EnhancedTDEEResult = {
      dailyCalories: Math.round(enhancedTDEE),
      method: `Athlete Profile Analysis (${profile.trainingProfile.primarySport} focused)`,
      confidence,
      breakdown: {
        bmr,
        activityMultiplier: trainingVolumeMultiplier,
        exerciseCalories: Math.round(enhancedTDEE - bmr),
        sportSpecificAdjustment
      },
      factors: {
        fitnessLevelMultiplier,
        experienceMultiplier,
        sportIntensityMultiplier,
        totalWeeklyHours
      }
    };
    
    console.log('📊 [AthleteProfileTDEE] Enhanced TDEE calculated:', {
      dailyCalories: result.dailyCalories,
      confidence: result.confidence,
      totalWeeklyHours,
      primarySport: profile.trainingProfile.primarySport
    });
    
    return result;
  }
  
  /**
   * Compare athlete profile TDEE with basic calculation
   */
  public static compareWithBasicTDEE(profile: AthleteProfile): {
    athleteProfileTDEE: EnhancedTDEEResult;
    basicTDEE: number;
    difference: {
      amount: number;
      percentage: number;
    };
  } {
    const athleteProfileTDEE = this.calculateEnhancedTDEE(profile);
    
    // Basic TDEE calculation (what was used before)
    const { physicalStats } = profile;
    let basicBMR: number;
    if (physicalStats.gender === 'male') {
      basicBMR = 10 * physicalStats.weight + 6.25 * physicalStats.height - 5 * physicalStats.age + 5;
    } else {
      basicBMR = 10 * physicalStats.weight + 6.25 * physicalStats.height - 5 * physicalStats.age - 161;
    }
    
    // Use simple activity level multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    // Estimate activity level from training hours
    const trainingHours = profile.trainingProfile.sportSpecificTrainingHours || {};
    const totalWeeklyHours = Object.values(trainingHours).filter((hours): hours is number => typeof hours === 'number').reduce((sum, hours) => sum + hours, 0);
    let estimatedActivityLevel: keyof typeof activityMultipliers = 'moderate';
    if (totalWeeklyHours >= 15) estimatedActivityLevel = 'very_active';
    else if (totalWeeklyHours >= 8) estimatedActivityLevel = 'active';
    else if (totalWeeklyHours >= 4) estimatedActivityLevel = 'moderate';
    else if (totalWeeklyHours >= 2) estimatedActivityLevel = 'light';
    else estimatedActivityLevel = 'sedentary';
    
    const basicTDEE = Math.round(basicBMR * activityMultipliers[estimatedActivityLevel]);
    
    const difference = {
      amount: athleteProfileTDEE.dailyCalories - basicTDEE,
      percentage: Math.round(((athleteProfileTDEE.dailyCalories - basicTDEE) / basicTDEE) * 100)
    };
    
    return {
      athleteProfileTDEE,
      basicTDEE,
      difference
    };
  }
}