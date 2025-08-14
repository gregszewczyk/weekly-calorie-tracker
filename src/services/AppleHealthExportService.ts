import { AppleHealthKitService } from './AppleHealthKitService';
import { useCalorieStore } from '../stores/calorieStore';
import { 
  AppleHealthKitWorkout, 
  AppleHealthDailyMetrics, 
  AppleHealthBodyComposition 
} from '../types/AppleHealthKitTypes';
import { 
  DailyCalorieData, 
  WorkoutSession, 
  WeeklyCalorieGoal 
} from '../types/CalorieTypes';
import { WeightEntry } from '../types/GoalTypes';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';

// Mock file system operations for now - in real implementation use react-native-fs
class MockRNFS {
  static DocumentDirectoryPath = '/tmp/documents';
  static async writeFile(path: string, content: string, encoding: string): Promise<void> {
    console.log(`Would write file to ${path} with ${content.length} characters`);
  }
}

// Mock sharing operations for now - in real implementation use react-native-share
class MockShare {
  static async open(options: any): Promise<void> {
    console.log('Would share:', options);
  }
}

export interface HealthDataExport {
  exportToAppleHealthXML(): Promise<string>;
  exportToCSV(): Promise<string>;
  generateWeeklyReport(): Promise<HealthReport>;
  generateMonthlyReport(): Promise<HealthReport>;
  shareWithHealthProvider(email: string): Promise<void>;
  exportNutritionData(startDate: Date, endDate: Date): Promise<string>;
  exportWorkoutData(startDate: Date, endDate: Date): Promise<string>;
  exportComprehensiveData(startDate: Date, endDate: Date): Promise<string>;
}

export interface HealthReport {
  period: { start: Date; end: Date };
  reportType: 'weekly' | 'monthly';
  workoutSummary: WorkoutSummaryData;
  nutritionSummary: NutritionSummaryData;
  sleepSummary: SleepSummaryData;
  bodyCompositionSummary: BodyCompositionSummaryData;
  progressTowards: GoalProgressData;
  recommendations: string[];
  generatedAt: Date;
}

export interface WorkoutSummaryData {
  totalWorkouts: number;
  totalDuration: number; // minutes
  totalCaloriesBurned: number;
  averageHeartRate?: number;
  workoutsByType: { [type: string]: number };
  weeklyFrequency: number;
  mostActiveDay: string;
}

export interface NutritionSummaryData {
  averageDailyCalories: number;
  averageProtein: number; // grams
  averageCarbs: number; // grams
  averageFat: number; // grams
  goalAdherence: number; // percentage
  calorieDeficit: number; // average daily
  daysOverGoal: number;
  daysUnderGoal: number;
}

export interface SleepSummaryData {
  averageDuration: number; // hours
  averageEfficiency: number; // percentage
  deepSleepPercentage: number;
  remSleepPercentage: number;
  averageBedtime: string; // HH:MM format
  averageWakeTime: string; // HH:MM format
  sleepTrend: 'improving' | 'declining' | 'stable';
}

export interface BodyCompositionSummaryData {
  startWeight?: number;
  endWeight?: number;
  weightChange: number;
  averageBodyFat?: number;
  bodyFatChange?: number;
  averageLeanMass?: number;
  leanMassChange?: number;
  measurements: { date: string; weight: number; bodyFat?: number }[];
}

export interface GoalProgressData {
  weightGoalProgress: number; // percentage
  calorieGoalAdherence: number; // percentage
  workoutGoalProgress: number; // percentage
  overallProgress: number; // percentage
  goalsAchieved: string[];
  goalsNeedingAttention: string[];
}

export class AppleHealthExportService implements HealthDataExport {
  private healthKitService: AppleHealthKitService;
  private calorieStore: any;

  constructor() {
    this.healthKitService = new AppleHealthKitService();
    this.calorieStore = useCalorieStore.getState();
  }

  public async exportToAppleHealthXML(): Promise<string> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 90); // Last 3 months

      const [workouts, dailyMetrics, bodyComposition, nutritionData] = await Promise.all([
        this.healthKitService.getWorkouts(startDate, endDate),
        this.healthKitService.getDailyMetricsRange(startDate, endDate),
        this.healthKitService.getBodyCompositionRange(startDate, endDate),
        this.getNutritionData(startDate, endDate)
      ]);

      const xml = this.generateHealthKitXML({
        workouts,
        dailyMetrics,
        bodyComposition,
        nutritionData,
        period: { start: startDate, end: endDate }
      });

      const filePath = `${MockRNFS.DocumentDirectoryPath}/health_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.xml`;
      await MockRNFS.writeFile(filePath, xml, 'utf8');

      return filePath;
    } catch (error) {
      console.error('Failed to export Apple Health XML:', error);
      throw new Error('Export failed: ' + (error as Error).message);
    }
  }

  public async exportToCSV(): Promise<string> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 30); // Last month

      const csvData = await this.generateCSVData(startDate, endDate);
      
      const filePath = `${MockRNFS.DocumentDirectoryPath}/health_nutrition_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      await MockRNFS.writeFile(filePath, csvData, 'utf8');

      return filePath;
    } catch (error) {
      console.error('Failed to export CSV:', error);
      throw new Error('CSV export failed: ' + (error as Error).message);
    }
  }

  public async generateWeeklyReport(): Promise<HealthReport> {
    const today = new Date();
    const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const endDate = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

    return this.generateHealthReport(startDate, endDate, 'weekly');
  }

  public async generateMonthlyReport(): Promise<HealthReport> {
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);

    return this.generateHealthReport(startDate, endDate, 'monthly');
  }

  public async shareWithHealthProvider(email: string): Promise<void> {
    try {
      const report = await this.generateMonthlyReport();
      const csvPath = await this.exportToCSV();
      const reportPath = await this.generateReportPDF(report);

      const shareOptions = {
        title: 'Health & Nutrition Report',
        message: `Health and nutrition data report for ${format(report.period.start, 'MMM dd')} - ${format(report.period.end, 'MMM dd, yyyy')}`,
        urls: [csvPath, reportPath],
        email: email,
        subject: 'Health Data Report - Weekly Calorie Tracker'
      };

      await MockShare.open(shareOptions);
    } catch (error) {
      console.error('Failed to share with health provider:', error);
      throw new Error('Sharing failed: ' + (error as Error).message);
    }
  }

  public async exportNutritionData(startDate: Date, endDate: Date): Promise<string> {
    try {
      const nutritionData = await this.getNutritionData(startDate, endDate);
      const csv = this.generateNutritionCSV(nutritionData);
      
      const filePath = `${MockRNFS.DocumentDirectoryPath}/nutrition_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      await MockRNFS.writeFile(filePath, csv, 'utf8');

      return filePath;
    } catch (error) {
      console.error('Failed to export nutrition data:', error);
      throw new Error('Nutrition export failed: ' + (error as Error).message);
    }
  }

  public async exportWorkoutData(startDate: Date, endDate: Date): Promise<string> {
    try {
      const workouts = await this.healthKitService.getWorkouts(startDate, endDate);
      const csv = this.generateWorkoutCSV(workouts);
      
      const filePath = `${MockRNFS.DocumentDirectoryPath}/workout_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      await MockRNFS.writeFile(filePath, csv, 'utf8');

      return filePath;
    } catch (error) {
      console.error('Failed to export workout data:', error);
      throw new Error('Workout export failed: ' + (error as Error).message);
    }
  }

  public async exportComprehensiveData(startDate: Date, endDate: Date): Promise<string> {
    try {
      const [workouts, dailyMetrics, bodyComposition, nutritionData] = await Promise.all([
        this.healthKitService.getWorkouts(startDate, endDate),
        this.healthKitService.getDailyMetricsRange(startDate, endDate),
        this.healthKitService.getBodyCompositionRange(startDate, endDate),
        this.getNutritionData(startDate, endDate)
      ]);

      const comprehensiveData = {
        exportDate: new Date().toISOString(),
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        workouts,
        dailyMetrics,
        bodyComposition,
        nutritionData
      };

      const jsonData = JSON.stringify(comprehensiveData, null, 2);
      
      const filePath = `${MockRNFS.DocumentDirectoryPath}/comprehensive_health_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      await MockRNFS.writeFile(filePath, jsonData, 'utf8');

      return filePath;
    } catch (error) {
      console.error('Failed to export comprehensive data:', error);
      throw new Error('Comprehensive export failed: ' + (error as Error).message);
    }
  }

  private async generateHealthReport(startDate: Date, endDate: Date, reportType: 'weekly' | 'monthly'): Promise<HealthReport> {
    try {
      const [workouts, dailyMetrics, bodyComposition, nutritionData] = await Promise.all([
        this.healthKitService.getWorkouts(startDate, endDate),
        this.healthKitService.getDailyMetricsRange(startDate, endDate),
        this.healthKitService.getBodyCompositionRange(startDate, endDate),
        this.getNutritionData(startDate, endDate)
      ]);

      const workoutSummary = this.analyzeWorkoutData(workouts);
      const nutritionSummary = this.analyzeNutritionData(nutritionData);
      const sleepSummary = this.analyzeSleepData(dailyMetrics);
      const bodyCompositionSummary = this.analyzeBodyComposition(bodyComposition);
      const progressTowards = this.analyzeGoalProgress(nutritionData, workouts, bodyComposition);

      const recommendations = this.generateRecommendations({
        workoutSummary,
        nutritionSummary,
        sleepSummary,
        bodyCompositionSummary,
        progressTowards
      });

      return {
        period: { start: startDate, end: endDate },
        reportType,
        workoutSummary,
        nutritionSummary,
        sleepSummary,
        bodyCompositionSummary,
        progressTowards,
        recommendations,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Failed to generate health report:', error);
      throw new Error('Report generation failed: ' + (error as Error).message);
    }
  }

  private async getNutritionData(startDate: Date, endDate: Date): Promise<DailyCalorieData[]> {
    // Get nutrition data from calorie store
    const store = useCalorieStore.getState();
    const weeklyData = store.weeklyData || [];
    
    return weeklyData.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= startDate && dayDate <= endDate;
    });
  }

  private generateHealthKitXML(data: any): string {
    const { workouts, dailyMetrics, bodyComposition, nutritionData, period } = data;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
  <ExportDate value="${new Date().toISOString()}"/>
  <Me HKCharacteristicTypeIdentifierDateOfBirth="" HKCharacteristicTypeIdentifierBiologicalSex=""/>
  
  <!-- Workout Data -->`;

    // Add workout records
    workouts.forEach((workout: AppleHealthKitWorkout) => {
      xml += `
  <Workout workoutActivityType="${workout.activityType}" duration="${workout.duration}" durationUnit="min" totalEnergyBurned="${workout.calories}" totalEnergyBurnedUnit="kcal" sourceName="WeeklyCalorieTracker" sourceVersion="1.0" device="" creationDate="${workout.startDate.toISOString()}" startDate="${workout.startDate.toISOString()}" endDate="${workout.endDate.toISOString()}">
    <MetadataEntry key="HKIndoorWorkout" value="false"/>
  </Workout>`;
    });

    // Add nutrition records
    nutritionData.forEach((day: DailyCalorieData) => {
      xml += `
  <Record type="HKQuantityTypeIdentifierDietaryEnergyConsumed" sourceName="WeeklyCalorieTracker" sourceVersion="1.0" device="" unit="kcal" creationDate="${day.date}T12:00:00+0000" startDate="${day.date}T08:00:00+0000" endDate="${day.date}T20:00:00+0000" value="${day.consumed}"/>`;
    });

    // Add body composition records
    bodyComposition.forEach((measurement: AppleHealthBodyComposition) => {
      xml += `
  <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="WeeklyCalorieTracker" sourceVersion="1.0" device="" unit="kg" creationDate="${measurement.date.toISOString()}" startDate="${measurement.date.toISOString()}" endDate="${measurement.date.toISOString()}" value="${measurement.bodyMass}"/>`;
      
      if (measurement.bodyFatPercentage) {
        xml += `
  <Record type="HKQuantityTypeIdentifierBodyFatPercentage" sourceName="WeeklyCalorieTracker" sourceVersion="1.0" device="" unit="%" creationDate="${measurement.date.toISOString()}" startDate="${measurement.date.toISOString()}" endDate="${measurement.date.toISOString()}" value="${measurement.bodyFatPercentage}"/>`;
      }
    });

    xml += `
</HealthData>`;

    return xml;
  }

  private async generateCSVData(startDate: Date, endDate: Date): Promise<string> {
    const [workouts, dailyMetrics, bodyComposition, nutritionData] = await Promise.all([
      this.healthKitService.getWorkouts(startDate, endDate),
      this.healthKitService.getDailyMetricsRange(startDate, endDate),
      this.healthKitService.getBodyCompositionRange(startDate, endDate),
      this.getNutritionData(startDate, endDate)
    ]);

    let csv = 'Date,Type,Category,Value,Unit,Source,Notes\n';

    // Add nutrition data
    nutritionData.forEach(day => {
      csv += `${day.date},Nutrition,Calories Consumed,${day.consumed},kcal,App,Daily calorie intake\n`;
      csv += `${day.date},Nutrition,Calories Burned,${day.burned},kcal,App,Exercise calories\n`;
      csv += `${day.date},Nutrition,Net Calories,${day.consumed - day.burned},kcal,App,Net daily balance\n`;
    });

    // Add workout data
    workouts.forEach(workout => {
      csv += `${format(workout.startDate, 'yyyy-MM-dd')},Workout,${workout.activityType},${workout.calories},kcal,HealthKit,Duration: ${workout.duration}min\n`;
    });

    // Add body composition data
    bodyComposition.forEach(measurement => {
      csv += `${format(measurement.date, 'yyyy-MM-dd')},Body,Weight,${measurement.bodyMass},kg,HealthKit,\n`;
      if (measurement.bodyFatPercentage) {
        csv += `${format(measurement.date, 'yyyy-MM-dd')},Body,Body Fat,${measurement.bodyFatPercentage},%,HealthKit,\n`;
      }
    });

    // Add daily metrics
    dailyMetrics.forEach(metrics => {
      csv += `${metrics.date},Activity,Steps,${metrics.steps},count,HealthKit,Daily step count\n`;
      csv += `${metrics.date},Activity,Active Calories,${metrics.activeEnergyBurned},kcal,HealthKit,Active energy burned\n`;
    });

    return csv;
  }

  private generateNutritionCSV(nutritionData: DailyCalorieData[]): string {
    let csv = 'Date,Calories Consumed,Calories Burned,Net Calories,Goal,Over/Under Goal,Meals Count,Workouts Count\n';
    
    nutritionData.forEach(day => {
      const netCalories = day.consumed - day.burned;
      const target = day.target || 0;
      const overUnder = netCalories - target;
      
      csv += `${day.date},${day.consumed},${day.burned},${netCalories},${target},${overUnder},${day.meals?.length || 0},${day.workouts?.length || 0}\n`;
    });

    return csv;
  }

  private generateWorkoutCSV(workouts: AppleHealthKitWorkout[]): string {
    let csv = 'Date,Activity Type,Duration (min),Calories Burned,Distance,Avg Heart Rate,Max Heart Rate,Indoor\n';
    
    workouts.forEach(workout => {
      csv += `${format(workout.startDate, 'yyyy-MM-dd HH:mm')},${workout.activityType},${workout.duration},${workout.calories},${workout.totalDistance || ''},${workout.heartRateData?.average || ''},${workout.heartRateData?.maximum || ''},${workout.metadata?.indoor || false}\n`;
    });

    return csv;
  }

  private analyzeWorkoutData(workouts: AppleHealthKitWorkout[]): WorkoutSummaryData {
    if (workouts.length === 0) {
      return {
        totalWorkouts: 0,
        totalDuration: 0,
        totalCaloriesBurned: 0,
        workoutsByType: {},
        weeklyFrequency: 0,
        mostActiveDay: 'No workouts'
      };
    }

    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const totalCaloriesBurned = workouts.reduce((sum, w) => sum + w.calories, 0);
    const heartRates = workouts.map(w => w.heartRateData?.average).filter(Boolean) as number[];
    const averageHeartRate = heartRates.length > 0 ? heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length : undefined;

    const workoutsByType: { [type: string]: number } = {};
    const workoutsByDay: { [day: string]: number } = {};

    workouts.forEach(workout => {
      workoutsByType[workout.activityType] = (workoutsByType[workout.activityType] || 0) + 1;
      
      const dayOfWeek = format(workout.startDate, 'EEEE');
      workoutsByDay[dayOfWeek] = (workoutsByDay[dayOfWeek] || 0) + 1;
    });

    const mostActiveDay = Object.entries(workoutsByDay).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const weeklyFrequency = workouts.length; // Assuming data is for one week

    return {
      totalWorkouts: workouts.length,
      totalDuration,
      totalCaloriesBurned,
      averageHeartRate,
      workoutsByType,
      weeklyFrequency,
      mostActiveDay
    };
  }

  private analyzeNutritionData(nutritionData: DailyCalorieData[]): NutritionSummaryData {
    if (nutritionData.length === 0) {
      return {
        averageDailyCalories: 0,
        averageProtein: 0,
        averageCarbs: 0,
        averageFat: 0,
        goalAdherence: 0,
        calorieDeficit: 0,
        daysOverGoal: 0,
        daysUnderGoal: 0
      };
    }

    const totalCalories = nutritionData.reduce((sum, day) => sum + day.consumed, 0);
    const averageDailyCalories = totalCalories / nutritionData.length;

    const daysWithTargets = nutritionData.filter(day => day.target && day.target > 0);
    const daysOverTarget = daysWithTargets.filter(day => day.consumed > (day.target || 0)).length;
    const daysUnderTarget = daysWithTargets.filter(day => day.consumed < (day.target || 0)).length;

    const totalDeficit = nutritionData.reduce((sum, day) => {
      const target = day.target || averageDailyCalories;
      return sum + (target - day.consumed);
    }, 0);
    const calorieDeficit = totalDeficit / nutritionData.length;

    const goalAdherence = daysWithTargets.length > 0 ? 
      ((daysWithTargets.length - daysOverTarget - daysUnderTarget) / daysWithTargets.length) * 100 : 0;

    return {
      averageDailyCalories,
      averageProtein: 0, // Would need macronutrient tracking
      averageCarbs: 0,
      averageFat: 0,
      goalAdherence,
      calorieDeficit,
      daysOverGoal: daysOverTarget,
      daysUnderGoal: daysUnderTarget
    };
  }

  private analyzeSleepData(dailyMetrics: AppleHealthDailyMetrics[]): SleepSummaryData {
    const sleepData = dailyMetrics.filter(day => day.sleepAnalysis).map(day => day.sleepAnalysis!);
    
    if (sleepData.length === 0) {
      return {
        averageDuration: 0,
        averageEfficiency: 0,
        deepSleepPercentage: 0,
        remSleepPercentage: 0,
        averageBedtime: '00:00',
        averageWakeTime: '00:00',
        sleepTrend: 'stable'
      };
    }

    const averageDuration = sleepData.reduce((sum, sleep) => sum + sleep.timeAsleep, 0) / sleepData.length / 60; // hours
    const averageEfficiency = sleepData.reduce((sum, sleep) => sum + sleep.sleepEfficiency, 0) / sleepData.length;
    
    const deepSleepMinutes = sleepData.reduce((sum, sleep) => sum + (sleep.sleepStages?.deep || 0), 0);
    const remSleepMinutes = sleepData.reduce((sum, sleep) => sum + (sleep.sleepStages?.rem || 0), 0);
    const totalSleepMinutes = sleepData.reduce((sum, sleep) => sum + sleep.timeAsleep, 0);
    
    const deepSleepPercentage = totalSleepMinutes > 0 ? (deepSleepMinutes / totalSleepMinutes) * 100 : 0;
    const remSleepPercentage = totalSleepMinutes > 0 ? (remSleepMinutes / totalSleepMinutes) * 100 : 0;

    // Calculate average bedtime and wake time
    const bedtimes = sleepData.map(sleep => sleep.sleepStartTime.getHours() * 60 + sleep.sleepStartTime.getMinutes());
    const wakeTimes = sleepData.map(sleep => sleep.sleepEndTime.getHours() * 60 + sleep.sleepEndTime.getMinutes());
    
    const avgBedtimeMinutes = bedtimes.reduce((sum, time) => sum + time, 0) / bedtimes.length;
    const avgWakeTimeMinutes = wakeTimes.reduce((sum, time) => sum + time, 0) / wakeTimes.length;
    
    const averageBedtime = `${Math.floor(avgBedtimeMinutes / 60).toString().padStart(2, '0')}:${Math.floor(avgBedtimeMinutes % 60).toString().padStart(2, '0')}`;
    const averageWakeTime = `${Math.floor(avgWakeTimeMinutes / 60).toString().padStart(2, '0')}:${Math.floor(avgWakeTimeMinutes % 60).toString().padStart(2, '0')}`;

    // Simple trend analysis (compare first half vs second half)
    const firstHalf = sleepData.slice(0, Math.floor(sleepData.length / 2));
    const secondHalf = sleepData.slice(Math.floor(sleepData.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, sleep) => sum + sleep.timeAsleep, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, sleep) => sum + sleep.timeAsleep, 0) / secondHalf.length;
    
    let sleepTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg * 1.05) sleepTrend = 'improving';
    else if (secondHalfAvg < firstHalfAvg * 0.95) sleepTrend = 'declining';

    return {
      averageDuration,
      averageEfficiency,
      deepSleepPercentage,
      remSleepPercentage,
      averageBedtime,
      averageWakeTime,
      sleepTrend
    };
  }

  private analyzeBodyComposition(bodyComposition: AppleHealthBodyComposition[]): BodyCompositionSummaryData {
    if (bodyComposition.length === 0) {
      return {
        weightChange: 0,
        measurements: []
      };
    }

    const sortedMeasurements = bodyComposition.sort((a, b) => a.date.getTime() - b.date.getTime());
    const startWeight = sortedMeasurements[0]?.bodyMass;
    const endWeight = sortedMeasurements[sortedMeasurements.length - 1]?.bodyMass;
    const weightChange = endWeight && startWeight ? endWeight - startWeight : 0;

    const bodyFatMeasurements = sortedMeasurements.filter(m => m.bodyFatPercentage !== undefined);
    const averageBodyFat = bodyFatMeasurements.length > 0 ? 
      bodyFatMeasurements.reduce((sum, m) => sum + (m.bodyFatPercentage || 0), 0) / bodyFatMeasurements.length : undefined;

    const leanMassMeasurements = sortedMeasurements.filter(m => m.leanBodyMass !== undefined);
    const averageLeanMass = leanMassMeasurements.length > 0 ? 
      leanMassMeasurements.reduce((sum, m) => sum + (m.leanBodyMass || 0), 0) / leanMassMeasurements.length : undefined;

    const bodyFatChange = bodyFatMeasurements.length >= 2 ? 
      (bodyFatMeasurements[bodyFatMeasurements.length - 1].bodyFatPercentage || 0) - (bodyFatMeasurements[0].bodyFatPercentage || 0) : undefined;

    const leanMassChange = leanMassMeasurements.length >= 2 ? 
      (leanMassMeasurements[leanMassMeasurements.length - 1].leanBodyMass || 0) - (leanMassMeasurements[0].leanBodyMass || 0) : undefined;

    const measurements = sortedMeasurements.map(m => ({
      date: format(m.date, 'yyyy-MM-dd'),
      weight: m.bodyMass,
      bodyFat: m.bodyFatPercentage
    }));

    return {
      startWeight,
      endWeight,
      weightChange,
      averageBodyFat,
      bodyFatChange,
      averageLeanMass,
      leanMassChange,
      measurements
    };
  }

  private analyzeGoalProgress(nutritionData: DailyCalorieData[], workouts: AppleHealthKitWorkout[], bodyComposition: AppleHealthBodyComposition[]): GoalProgressData {
    // Analyze goal progress based on available data
    const daysWithTargets = nutritionData.filter(day => day.target && day.target > 0);
    const calorieGoalAdherence = daysWithTargets.length > 0 ? 
      (daysWithTargets.filter(day => Math.abs(day.consumed - (day.target || 0)) <= (day.target || 0) * 0.1).length / daysWithTargets.length) * 100 : 0;

    const workoutGoalProgress = workouts.length >= 3 ? 100 : (workouts.length / 3) * 100; // Assuming 3 workouts per week goal

    const weightGoalProgress = bodyComposition.length >= 2 ? 
      (bodyComposition.length >= 2 && bodyComposition[bodyComposition.length - 1].bodyMass < bodyComposition[0].bodyMass ? 100 : 50) : 0;

    const overallProgress = (calorieGoalAdherence + workoutGoalProgress + weightGoalProgress) / 3;

    const goalsAchieved: string[] = [];
    const goalsNeedingAttention: string[] = [];

    if (calorieGoalAdherence >= 80) goalsAchieved.push('Calorie Goal Consistency');
    else goalsNeedingAttention.push('Calorie Goal Adherence');

    if (workoutGoalProgress >= 80) goalsAchieved.push('Workout Frequency');
    else goalsNeedingAttention.push('Exercise Consistency');

    if (weightGoalProgress >= 80) goalsAchieved.push('Weight Management');
    else if (bodyComposition.length > 0) goalsNeedingAttention.push('Weight Progress');

    return {
      weightGoalProgress,
      calorieGoalAdherence,
      workoutGoalProgress,
      overallProgress,
      goalsAchieved,
      goalsNeedingAttention
    };
  }

  private generateRecommendations(data: {
    workoutSummary: WorkoutSummaryData;
    nutritionSummary: NutritionSummaryData;
    sleepSummary: SleepSummaryData;
    bodyCompositionSummary: BodyCompositionSummaryData;
    progressTowards: GoalProgressData;
  }): string[] {
    const recommendations: string[] = [];

    // Workout recommendations
    if (data.workoutSummary.totalWorkouts < 3) {
      recommendations.push('Consider increasing workout frequency to at least 3 sessions per week for optimal health benefits.');
    }

    // Nutrition recommendations
    if (data.nutritionSummary.goalAdherence < 70) {
      recommendations.push('Focus on better calorie goal consistency. Try meal planning to improve adherence.');
    }

    if (data.nutritionSummary.daysOverGoal > data.nutritionSummary.daysUnderGoal) {
      recommendations.push('You tend to exceed your calorie goals. Consider smaller portions or more nutrient-dense foods.');
    }

    // Sleep recommendations
    if (data.sleepSummary.averageDuration < 7) {
      recommendations.push('Aim for 7-9 hours of sleep per night to support recovery and metabolism.');
    }

    if (data.sleepSummary.averageEfficiency < 85) {
      recommendations.push('Consider improving sleep hygiene to increase sleep efficiency.');
    }

    // Body composition recommendations
    if (data.bodyCompositionSummary.weightChange > 0.5) {
      recommendations.push('Your weight has increased. Review your calorie balance and exercise routine.');
    } else if (data.bodyCompositionSummary.weightChange < -0.5) {
      recommendations.push('Great progress on weight loss! Maintain your current approach.');
    }

    // Progress recommendations
    if (data.progressTowards.overallProgress < 60) {
      recommendations.push('Consider setting smaller, more achievable goals to build momentum.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job maintaining your health and fitness routine! Keep up the excellent work.');
    }

    return recommendations;
  }

  private async generateReportPDF(report: HealthReport): Promise<string> {
    // For now, generate a text report. In a real implementation, 
    // you would use a PDF generation library like react-native-pdf-lib
    const textReport = this.generateTextReport(report);
    
    const filePath = `${MockRNFS.DocumentDirectoryPath}/health_report_${format(report.generatedAt, 'yyyyMMdd_HHmmss')}.txt`;
    await MockRNFS.writeFile(filePath, textReport, 'utf8');

    return filePath;
  }

  private generateTextReport(report: HealthReport): string {
    const { period, workoutSummary, nutritionSummary, sleepSummary, bodyCompositionSummary, progressTowards, recommendations } = report;
    
    return `HEALTH & NUTRITION REPORT
${report.reportType.toUpperCase()} REPORT: ${format(period.start, 'MMM dd')} - ${format(period.end, 'MMM dd, yyyy')}
Generated: ${format(report.generatedAt, 'MMM dd, yyyy HH:mm')}

WORKOUT SUMMARY
===============
Total Workouts: ${workoutSummary.totalWorkouts}
Total Duration: ${Math.round(workoutSummary.totalDuration)} minutes
Calories Burned: ${Math.round(workoutSummary.totalCaloriesBurned)} kcal
Average Heart Rate: ${workoutSummary.averageHeartRate ? Math.round(workoutSummary.averageHeartRate) + ' bpm' : 'N/A'}
Most Active Day: ${workoutSummary.mostActiveDay}

Workouts by Type:
${Object.entries(workoutSummary.workoutsByType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

NUTRITION SUMMARY
================
Average Daily Calories: ${Math.round(nutritionSummary.averageDailyCalories)} kcal
Goal Adherence: ${Math.round(nutritionSummary.goalAdherence)}%
Average Daily Deficit: ${Math.round(nutritionSummary.calorieDeficit)} kcal
Days Over Goal: ${nutritionSummary.daysOverGoal}
Days Under Goal: ${nutritionSummary.daysUnderGoal}

SLEEP SUMMARY
=============
Average Duration: ${sleepSummary.averageDuration.toFixed(1)} hours
Sleep Efficiency: ${Math.round(sleepSummary.averageEfficiency)}%
Deep Sleep: ${Math.round(sleepSummary.deepSleepPercentage)}%
REM Sleep: ${Math.round(sleepSummary.remSleepPercentage)}%
Average Bedtime: ${sleepSummary.averageBedtime}
Average Wake Time: ${sleepSummary.averageWakeTime}
Sleep Trend: ${sleepSummary.sleepTrend}

BODY COMPOSITION
===============
${bodyCompositionSummary.startWeight ? `Starting Weight: ${bodyCompositionSummary.startWeight.toFixed(1)} kg` : 'No weight data available'}
${bodyCompositionSummary.endWeight ? `Current Weight: ${bodyCompositionSummary.endWeight.toFixed(1)} kg` : ''}
${bodyCompositionSummary.weightChange !== 0 ? `Weight Change: ${bodyCompositionSummary.weightChange > 0 ? '+' : ''}${bodyCompositionSummary.weightChange.toFixed(1)} kg` : ''}
${bodyCompositionSummary.averageBodyFat ? `Average Body Fat: ${bodyCompositionSummary.averageBodyFat.toFixed(1)}%` : ''}

GOAL PROGRESS
=============
Overall Progress: ${Math.round(progressTowards.overallProgress)}%
Calorie Goal Adherence: ${Math.round(progressTowards.calorieGoalAdherence)}%
Workout Goal Progress: ${Math.round(progressTowards.workoutGoalProgress)}%
Weight Goal Progress: ${Math.round(progressTowards.weightGoalProgress)}%

Goals Achieved:
${progressTowards.goalsAchieved.map(goal => `✓ ${goal}`).join('\n')}

Areas for Improvement:
${progressTowards.goalsNeedingAttention.map(goal => `• ${goal}`).join('\n')}

RECOMMENDATIONS
===============
${recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

---
Generated by Weekly Calorie Tracker
Apple Health Integration Active`;
  }
}
