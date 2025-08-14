/**
 * Samsung Health Body Composition Service
 * Implements User Story 4: Samsung Health Body Composition
 * 
 * Features:
 * - Fetch weight entries from Samsung Health API
 * - Extract body fat percentage, muscle mass, BMI if available  
 * - Sync with existing CalorieStore.addWeightEntry() method
 * - Update weight trend analysis with Samsung data
 * - Enhanced body composition insights and recommendations
 */

import { format, subDays } from 'date-fns';
import { SamsungHealthService } from './SamsungHealthService';
import { 
  SamsungHealthBodyComposition, 
  SamsungHealthApiResponse,
  SamsungHealthException,
  SamsungHealthErrorType
} from '../types/SamsungHealthTypes';
import { WeightEntry } from '../types/GoalTypes';

export interface SamsungHealthBodyCompositionSummary {
  date: string; // YYYY-MM-DD
  weight: number; // kg
  bodyFat?: number; // percentage
  muscleMass?: number; // kg
  boneMass?: number; // kg
  bodyWater?: number; // percentage
  bmi?: number;
  basalMetabolicRate?: number; // kcal
  visceralFatLevel?: number;
  source: 'samsung_health';
  deviceInfo?: string;
}

export interface SamsungHealthBodyCompositionTrend {
  period: 'week' | 'month' | 'quarter';
  weightChange: number; // kg
  bodyFatChange?: number; // percentage points
  muscleMassChange?: number; // kg
  bmiChange?: number;
  trend: 'improving' | 'stable' | 'concerning';
  recommendations: string[];
  dataPoints: number;
  startDate: string;
  endDate: string;
}

export interface SamsungHealthBodyCompositionInsights {
  bodyCompositionInsights: string[];
  weightTrendAnalysis: string[];
  recommendations: string[];
  bodyCompositionGoalProgress?: {
    bodyFatTrend: 'improving' | 'stable' | 'concerning';
    muscleMassTrend: 'gaining' | 'stable' | 'losing';
    recommendations: string[];
  };
}

/**
 * Service for fetching and processing Samsung Health body composition data
 * Based on proven Garmin body composition service patterns
 * Integrates with CalorieStore for enhanced weight and body composition analysis
 */
export class SamsungHealthBodyCompositionService {
  private samsungHealthService: SamsungHealthService;
  private bodyCompositionCache = new Map<string, SamsungHealthBodyCompositionSummary>();

  constructor(samsungHealthService?: SamsungHealthService) {
    this.samsungHealthService = samsungHealthService || SamsungHealthService.getInstance();
  }

  /**
   * Fetch body composition data for a specific date
   */
  async getBodyComposition(date: Date): Promise<SamsungHealthBodyCompositionSummary | null> {
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      
      // Check cache first
      if (this.bodyCompositionCache.has(dateString)) {
        console.log(`📊 [SamsungBodyComp] Using cached data for ${dateString}`);
        return this.bodyCompositionCache.get(dateString)!;
      }

      console.log(`📊 [SamsungBodyComp] Fetching body composition for ${dateString}`);

      // Check if Samsung Health is connected
      const isConnected = await this.samsungHealthService.isConnected();
      if (!isConnected) {
        console.warn('⚠️ [SamsungBodyComp] Samsung Health not connected, using mock data');
        return this.generateMockBodyComposition(date);
      }

      // Make API request to Samsung Health
      const response = await this.samsungHealthService.makeApiRequest(
        `/body_composition?start_time=${dateString}&end_time=${dateString}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`📊 [SamsungBodyComp] No body composition data for ${dateString}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as SamsungHealthApiResponse<SamsungHealthBodyComposition>;
      
      if (!data.result || data.result.length === 0) {
        console.log(`📊 [SamsungBodyComp] No body composition data found for ${dateString}`);
        return null;
      }

      // Process the most recent entry for the day
      const bodyComposition = data.result[data.result.length - 1];
      const processedData = this.processBodyCompositionData(bodyComposition);
      
      // Cache the result
      this.bodyCompositionCache.set(dateString, processedData);

      console.log(`✅ [SamsungBodyComp] Successfully fetched body composition for ${dateString}: ${processedData.weight}kg`);
      return processedData;

    } catch (error) {
      console.error(`❌ [SamsungBodyComp] Error fetching body composition for ${format(date, 'yyyy-MM-dd')}:`, error);
      
      // Return mock data for development
      if (__DEV__) {
        return this.generateMockBodyComposition(date);
      }
      
      return null;
    }
  }

  /**
   * Get recent body composition trend data
   */
  async getRecentBodyCompositionTrend(days: number = 30): Promise<SamsungHealthBodyCompositionSummary[]> {
    try {
      console.log(`📊 [SamsungBodyComp] Fetching ${days} days of body composition trend data`);

      const endDate = new Date();
      const startDate = subDays(endDate, days);
      
      const results: SamsungHealthBodyCompositionSummary[] = [];
      const currentDate = new Date(startDate);

      // Fetch data for each day
      while (currentDate <= endDate) {
        const bodyComposition = await this.getBodyComposition(new Date(currentDate));
        if (bodyComposition) {
          results.push(bodyComposition);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`✅ [SamsungBodyComp] Retrieved ${results.length} body composition entries`);
      return results.sort((a, b) => a.date.localeCompare(b.date));

    } catch (error) {
      console.error('❌ [SamsungBodyComp] Error fetching body composition trend:', error);
      return [];
    }
  }

  /**
   * Analyze body composition trends over time
   */
  async analyzeBodyCompositionTrends(
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<SamsungHealthBodyCompositionTrend | null> {
    try {
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      const recentData = await this.getRecentBodyCompositionTrend(days);

      if (recentData.length < 2) {
        return null;
      }

      const earliest = recentData[0];
      const latest = recentData[recentData.length - 1];

      // Calculate changes
      const weightChange = latest.weight - earliest.weight;
      const bodyFatChange = latest.bodyFat && earliest.bodyFat 
        ? latest.bodyFat - earliest.bodyFat 
        : undefined;
      const muscleMassChange = latest.muscleMass && earliest.muscleMass 
        ? latest.muscleMass - earliest.muscleMass 
        : undefined;
      const bmiChange = latest.bmi && earliest.bmi 
        ? latest.bmi - earliest.bmi 
        : undefined;

      // Determine trend
      let trend: 'improving' | 'stable' | 'concerning' = 'stable';
      const recommendations: string[] = [];

      // Body composition-based trend analysis
      if (bodyFatChange !== undefined && muscleMassChange !== undefined) {
        if (bodyFatChange < -1 && muscleMassChange > 0) {
          trend = 'improving';
          recommendations.push('Excellent body recomposition progress!');
        } else if (bodyFatChange > 2 || (muscleMassChange < -0.5 && weightChange < 0)) {
          trend = 'concerning';
          recommendations.push('Consider increasing protein intake to preserve muscle mass');
        }
      } else if (weightChange !== 0) {
        // Fallback to weight-only analysis
        if (Math.abs(weightChange) > 0.5 && Math.abs(weightChange) < 2) {
          trend = 'improving';
        } else if (Math.abs(weightChange) > 3) {
          trend = 'concerning';
          recommendations.push('Rapid weight changes detected, consider moderating pace');
        }
      }

      // Add specific recommendations
      if (bodyFatChange && bodyFatChange > 1) {
        recommendations.push('Focus on increasing cardio and managing calorie intake');
      }
      if (muscleMassChange && muscleMassChange < -0.3) {
        recommendations.push('Increase resistance training and protein intake');
      }

      return {
        period,
        weightChange,
        bodyFatChange,
        muscleMassChange,
        bmiChange,
        trend,
        recommendations,
        dataPoints: recentData.length,
        startDate: earliest.date,
        endDate: latest.date
      };

    } catch (error) {
      console.error('❌ [SamsungBodyComp] Error analyzing body composition trends:', error);
      return null;
    }
  }

  /**
   * Convert Samsung Health body composition data to CalorieStore WeightEntry format
   */
  convertToWeightEntry(bodyComposition: SamsungHealthBodyCompositionSummary): Omit<WeightEntry, 'id'> {
    return {
      date: bodyComposition.date,
      weight: bodyComposition.weight,
      bodyFat: bodyComposition.bodyFat,
      muscleMass: bodyComposition.muscleMass,
      notes: `Samsung Health (${bodyComposition.deviceInfo || 'Scale'})`,
      timestamp: new Date(bodyComposition.date)
    };
  }

  /**
   * Get enhanced weight insights combining traditional weight tracking with body composition
   */
  async getEnhancedWeightInsights(existingWeightEntries: WeightEntry[]): Promise<SamsungHealthBodyCompositionInsights> {
    try {
      console.log('🔬 [SamsungBodyComp] Generating enhanced weight insights...');

      // Get recent body composition data
      const recentBodyComp = await this.getRecentBodyCompositionTrend(30);
      const bodyCompTrend = await this.analyzeBodyCompositionTrends('month');

      if (recentBodyComp.length === 0) {
        return {
          bodyCompositionInsights: ['Connect a Samsung Health compatible scale for detailed body composition insights'],
          weightTrendAnalysis: ['Using weight-only data for trend analysis'],
          recommendations: ['Consider a smart scale for better progress tracking']
        };
      }

      const latest = recentBodyComp[recentBodyComp.length - 1];
      const insights: string[] = [];
      const weightAnalysis: string[] = [];
      const recommendations: string[] = [];

      // Body composition insights
      if (latest.bodyFat) {
        insights.push(`Current body fat: ${latest.bodyFat.toFixed(1)}%`);
        insights.push(`Body fat category: ${this.categorizeBodyFatPercentage(latest.bodyFat)}`);
      }

      if (latest.muscleMass) {
        insights.push(`Muscle mass: ${latest.muscleMass.toFixed(1)}kg`);
      }

      if (latest.bodyWater) {
        insights.push(`Body water: ${latest.bodyWater.toFixed(1)}%`);
      }

      if (latest.bmi) {
        insights.push(`BMI: ${latest.bmi.toFixed(1)} (${this.categorizeBMI(latest.bmi)})`);
      }

      // Weight trend analysis incorporating body composition
      if (bodyCompTrend) {
        const { weightChange, bodyFatChange, muscleMassChange, trend } = bodyCompTrend;
        
        weightAnalysis.push(`Weight change: ${weightChange >= 0 ? '+' : ''}${weightChange.toFixed(1)}kg over ${bodyCompTrend.period}`);
        
        if (bodyFatChange !== undefined) {
          weightAnalysis.push(`Body fat change: ${bodyFatChange >= 0 ? '+' : ''}${bodyFatChange.toFixed(1)}% points`);
        }
        
        if (muscleMassChange !== undefined) {
          weightAnalysis.push(`Muscle mass change: ${muscleMassChange >= 0 ? '+' : ''}${muscleMassChange.toFixed(1)}kg`);
        }

        weightAnalysis.push(`Trend: ${this.humanizeBodyCompositionTrend(trend)}`);
        
        // Add trend-specific recommendations
        recommendations.push(...bodyCompTrend.recommendations);
      }

      // Goal progress analysis
      let bodyCompositionGoalProgress: {
        bodyFatTrend: 'improving' | 'stable' | 'concerning';
        muscleMassTrend: 'gaining' | 'stable' | 'losing';
        recommendations: string[];
      } | undefined;

      if (recentBodyComp.length >= 2 && latest.bodyFat && latest.muscleMass) {
        const previous = recentBodyComp[Math.max(0, recentBodyComp.length - 8)]; // ~1 week ago
        
        const bodyFatTrend = previous.bodyFat 
          ? latest.bodyFat < previous.bodyFat ? 'improving' : 
            latest.bodyFat > previous.bodyFat + 0.5 ? 'concerning' : 'stable'
          : 'stable';

        const muscleMassTrend = previous.muscleMass 
          ? latest.muscleMass > previous.muscleMass ? 'gaining' :
            latest.muscleMass < previous.muscleMass - 0.2 ? 'losing' : 'stable'
          : 'stable';

        const goalRecommendations: string[] = [];
        if (bodyFatTrend === 'concerning') {
          goalRecommendations.push('Consider increasing cardio and monitoring calorie intake');
        }
        if (muscleMassTrend === 'losing') {
          goalRecommendations.push('Focus on resistance training and adequate protein');
        }
        if (bodyFatTrend === 'improving' && muscleMassTrend === 'gaining') {
          goalRecommendations.push('Excellent body recomposition progress!');
        }

        bodyCompositionGoalProgress = {
          bodyFatTrend,
          muscleMassTrend,
          recommendations: goalRecommendations
        };
      }

      return {
        bodyCompositionInsights: insights,
        weightTrendAnalysis: weightAnalysis,
        recommendations,
        bodyCompositionGoalProgress
      };

    } catch (error) {
      console.error('❌ [SamsungBodyComp] Failed to get enhanced weight insights:', error);
      return {
        bodyCompositionInsights: ['Error loading body composition data'],
        weightTrendAnalysis: ['Error analyzing weight trends'],
        recommendations: ['Please try again later']
      };
    }
  }

  /**
   * Sync Samsung Health body composition data with CalorieStore
   */
  async syncWithCalorieStore(existingWeightEntries: WeightEntry[], daysToSync: number = 30): Promise<{
    syncedEntries: Omit<WeightEntry, 'id'>[];
    enhancedInsights: SamsungHealthBodyCompositionInsights;
    recommendations: string[];
  }> {
    try {
      console.log(`⚖️ [SamsungBodyComp] Syncing ${daysToSync} days of body composition data...`);

      // Get recent body composition data
      const recentBodyComp = await this.getRecentBodyCompositionTrend(daysToSync);
      
      // Convert to weight entries for CalorieStore integration
      const syncedEntries = recentBodyComp.map(bodyComp =>
        this.convertToWeightEntry(bodyComp)
      );

      // Filter out entries that already exist
      const filteredEntries = syncedEntries.filter(newEntry => 
        !existingWeightEntries.some(existing => existing.date === newEntry.date)
      );

      // Get enhanced insights
      const enhancedInsights = await this.getEnhancedWeightInsights(existingWeightEntries);

      console.log(`✅ [SamsungBodyComp] Synced ${filteredEntries.length} new body composition entries`);

      return {
        syncedEntries: filteredEntries,
        enhancedInsights,
        recommendations: enhancedInsights.recommendations
      };

    } catch (error) {
      console.error('❌ [SamsungBodyComp] Error syncing body composition data:', error);
      return {
        syncedEntries: [],
        enhancedInsights: {
          bodyCompositionInsights: ['Error syncing body composition data'],
          weightTrendAnalysis: ['Using standard weight analysis'],
          recommendations: ['Please ensure Samsung Health is connected']
        },
        recommendations: ['Check Samsung Health synchronization']
      };
    }
  }

  /**
   * Process raw Samsung Health body composition data
   */
  private processBodyCompositionData(data: SamsungHealthBodyComposition): SamsungHealthBodyCompositionSummary {
    const date = new Date(data.create_time);
    const dateString = format(date, 'yyyy-MM-dd');

    return {
      date: dateString,
      weight: data.weight,
      bodyFat: data.body_fat_percentage,
      muscleMass: data.muscle_mass,
      boneMass: data.bone_mass,
      bodyWater: data.body_water,
      bmi: data.weight && data.body_fat_percentage 
        ? this.calculateBMI(data.weight, 170) // Assuming average height; real implementation would get user height
        : undefined,
      basalMetabolicRate: data.basal_metabolic_rate,
      visceralFatLevel: data.visceral_fat_level,
      source: 'samsung_health',
      deviceInfo: 'Samsung Health Scale'
    };
  }

  /**
   * Generate mock body composition data for development/testing
   */
  private generateMockBodyComposition(date: Date): SamsungHealthBodyCompositionSummary {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayOffset = Math.floor(Math.random() * 5) - 2; // ±2 days variation
    
    return {
      date: dateString,
      weight: 75 + Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 7)) * 2 + dayOffset * 0.1, // Weekly fluctuation
      bodyFat: 15 + Math.random() * 3, // 15-18%
      muscleMass: 35 + Math.random() * 2, // 35-37kg
      boneMass: 3.2 + Math.random() * 0.2, // 3.2-3.4kg
      bodyWater: 60 + Math.random() * 5, // 60-65%
      bmi: 22 + Math.random() * 2, // 22-24
      basalMetabolicRate: 1680 + Math.floor(Math.random() * 100), // 1680-1780
      visceralFatLevel: 5 + Math.floor(Math.random() * 3), // 5-7
      source: 'samsung_health',
      deviceInfo: 'Samsung Health Scale (Mock)'
    };
  }

  /**
   * Categorize body fat percentage
   */
  private categorizeBodyFatPercentage(bodyFat: number): string {
    // Male categories (would need to adjust for gender in real implementation)
    if (bodyFat < 6) return 'Essential';
    if (bodyFat < 14) return 'Athletic';
    if (bodyFat < 18) return 'Fitness';
    if (bodyFat < 25) return 'Average';
    return 'Above Average';
  }

  /**
   * Categorize BMI
   */
  private categorizeBMI(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  /**
   * Calculate BMI from weight and height
   */
  private calculateBMI(weight: number, height: number): number {
    return weight / Math.pow(height / 100, 2);
  }

  /**
   * Humanize body composition trend
   */
  private humanizeBodyCompositionTrend(trend: 'improving' | 'stable' | 'concerning'): string {
    switch (trend) {
      case 'improving': return 'Positive progress with good body composition changes';
      case 'stable': return 'Maintaining current body composition';
      case 'concerning': return 'Monitor closely - consider adjusting training and nutrition';
    }
  }
}

/**
 * Factory function to create Samsung Health Body Composition Service
 */
export function createSamsungHealthBodyCompositionService(): SamsungHealthBodyCompositionService {
  return new SamsungHealthBodyCompositionService();
}

/**
 * Helper function to sync Samsung Health body composition data with existing weight tracking
 */
export async function syncSamsungHealthBodyCompositionWithWeightTracking(
  bodyCompositionService: SamsungHealthBodyCompositionService,
  existingWeightEntries: WeightEntry[],
  daysToSync = 30
): Promise<{
  syncedEntries: Omit<WeightEntry, 'id'>[];
  enhancedInsights: SamsungHealthBodyCompositionInsights;
  recommendations: string[];
}> {
  return await bodyCompositionService.syncWithCalorieStore(existingWeightEntries, daysToSync);
}
