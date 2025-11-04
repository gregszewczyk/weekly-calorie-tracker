/**
 * Mock HealthKit Implementation
 * 
 * Mock implementation of HealthKit for development and testing purposes.
 * Simulates real HealthKit behavior for non-iOS environments.
 */

import { Platform } from 'react-native';

interface MockHealthKitConfig {
  simulateDelay: boolean;
  delayMs: number;
  successRate: number;
  mockData: boolean;
  simulatePermissionDenials: boolean;
  simulateDataGaps: boolean;
  simulateRealisticPatterns: boolean;
}

class MockHealthKit {
  private config: MockHealthKitConfig = {
    simulateDelay: true,
    delayMs: 500,
    successRate: 0.8, // 80% success rate for permissions
    mockData: true,
    simulatePermissionDenials: true,
    simulateDataGaps: true,
    simulateRealisticPatterns: true,
  };

  private isInitialized = false;
  private grantedPermissions: Set<string> = new Set();

  constructor(config?: Partial<MockHealthKitConfig>) {
    this.config = { ...this.config, ...config };
    console.log('🔧 [MockHealthKit] Initialized with config:', this.config);
  }

  /**
   * Check if HealthKit is available (mock always returns true on iOS)
   */
  async isAvailable(): Promise<boolean> {
    await this.simulateDelay();
    
    const available = Platform.OS === 'ios';
    console.log(`🔍 [MockHealthKit] isAvailable: ${available} (platform: ${Platform.OS})`);
    return available;
  }

  /**
   * Initialize HealthKit with permissions (mock implementation)
   */
  async initHealthKit(permissions: { read: string[]; write: string[] }): Promise<boolean> {
    console.log('🚀 [MockHealthKit] Initializing with permissions:', permissions);
    
    await this.simulateDelay();

    if (this.isInitialized) {
      console.log('✅ [MockHealthKit] Already initialized');
      return true;
    }

    // Simulate permission grants based on success rate
    const allPermissions = [...permissions.read, ...permissions.write];
    let grantedCount = 0;

    for (const permission of allPermissions) {
      if (Math.random() < this.config.successRate) {
        this.grantedPermissions.add(permission);
        grantedCount++;
      }
    }

    this.isInitialized = true;
    
    const success = grantedCount > 0;
    console.log(`✅ [MockHealthKit] Initialization ${success ? 'successful' : 'failed'}: ${grantedCount}/${allPermissions.length} permissions granted`);
    
    return success;
  }

  /**
   * Get authorization status for a specific data type
   */
  async getAuthorizationStatusForType(dataType: string): Promise<number> {
    await this.simulateDelay(100); // Shorter delay for individual queries
    
    let status: number;
    
    if (this.config.simulatePermissionDenials) {
      // Simulate realistic permission patterns
      if (this.grantedPermissions.has(dataType)) {
        status = 1; // authorized
      } else {
        // Different denial patterns for different data types
        if (dataType.includes('Heart')) {
          // Heart rate data often denied
          status = Math.random() < 0.4 ? 2 : 0; // 40% denied, 60% not determined
        } else if (dataType.includes('Workout')) {
          // Workout data usually allowed
          status = Math.random() < 0.9 ? 1 : 0; // 90% authorized, 10% not determined
        } else if (dataType.includes('Step')) {
          // Step data usually allowed
          status = Math.random() < 0.85 ? 1 : 0; // 85% authorized, 15% not determined
        } else {
          // Other data types
          status = Math.random() < 0.7 ? 1 : (Math.random() < 0.5 ? 2 : 0);
        }
      }
    } else {
      // Original logic
      if (this.grantedPermissions.has(dataType)) {
        status = 1; // authorized
      } else if (Math.random() < 0.1) {
        status = 3; // restricted
      } else if (Math.random() < 0.3) {
        status = 2; // denied
      } else {
        status = 0; // not determined
      }
    }

    console.log(`🔍 [MockHealthKit] Authorization status for ${dataType}: ${this.getStatusName(status)}`);
    return status;
  }

  /**
   * Mock data query methods (for future use)
   */
  async getSteps(options: any): Promise<any[]> {
    await this.simulateDelay();
    
    if (!this.config.mockData) {
      throw new Error('Mock data disabled');
    }

    const mockSteps = this.generateMockSteps(options);
    console.log(`📊 [MockHealthKit] Returning ${mockSteps.length} step records`);
    return mockSteps;
  }

  async getWorkouts(options: any): Promise<any[]> {
    await this.simulateDelay();
    
    if (!this.config.mockData) {
      throw new Error('Mock data disabled');
    }

    const mockWorkouts = this.generateMockWorkouts(options);
    console.log(`🏃 [MockHealthKit] Returning ${mockWorkouts.length} workout records`);
    return mockWorkouts;
  }

  async getSamples(dataType: string, options: any): Promise<any[]> {
    await this.simulateDelay();
    
    if (!this.config.mockData) {
      throw new Error('Mock data disabled');
    }

    const mockSamples = this.generateMockSamples(dataType, options);
    console.log(`📈 [MockHealthKit] Returning ${mockSamples.length} samples for ${dataType}`);
    return mockSamples;
  }

  /**
   * Mock write methods
   */
  async saveFood(options: any): Promise<boolean> {
    await this.simulateDelay();
    console.log('💾 [MockHealthKit] Saved food data:', options);
    return true;
  }

  async saveWorkout(options: any): Promise<boolean> {
    await this.simulateDelay();
    console.log('💾 [MockHealthKit] Saved workout data:', options);
    return true;
  }

  // Private helper methods

  private async simulateDelay(customMs?: number): Promise<void> {
    if (!this.config.simulateDelay) return;
    
    const delay = customMs || this.config.delayMs;
    await new Promise<void>(resolve => setTimeout(resolve, delay));
  }

  private getStatusName(status: number): string {
    switch (status) {
      case 0: return 'not determined';
      case 1: return 'authorized';
      case 2: return 'denied';
      case 3: return 'restricted';
      default: return 'unknown';
    }
  }

  private generateMockSteps(options: any): any[] {
    const steps = [];
    const startDate = new Date(options.startDate || Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(options.endDate || Date.now());
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Simulate data gaps (some days missing)
      if (this.config.simulateDataGaps && Math.random() < 0.1) {
        continue; // Skip this day
      }

      let stepCount: number;
      
      if (this.config.simulateRealisticPatterns) {
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isFriday = dayOfWeek === 5;
        
        // Realistic step patterns
        if (isWeekend) {
          stepCount = Math.floor(Math.random() * 8000) + 4000; // 4k-12k weekend
        } else if (isFriday) {
          stepCount = Math.floor(Math.random() * 10000) + 6000; // 6k-16k Friday
        } else {
          stepCount = Math.floor(Math.random() * 12000) + 7000; // 7k-19k weekday
        }
        
        // Add some personal variation (simulate individual patterns)
        const personalFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2 multiplier
        stepCount = Math.floor(stepCount * personalFactor);
      } else {
        stepCount = Math.floor(Math.random() * 15000) + 3000; // Original logic
      }

      steps.push({
        value: stepCount,
        startDate: new Date(date),
        endDate: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        source: 'iPhone', // Add source information
        device: 'iPhone 14 Pro',
      });
    }
    
    return steps;
  }

  private generateMockWorkouts(options: any): any[] {
    const workouts = [];
    const startDate = new Date(options.startDate || Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(options.endDate || Date.now());
    
    const activities = [
      { type: 'Running', avgDuration: 35, avgCalories: 400, hasDistance: true },
      { type: 'Cycling', avgDuration: 50, avgCalories: 350, hasDistance: true },
      { type: 'Swimming', avgDuration: 30, avgCalories: 450, hasDistance: false },
      { type: 'Yoga', avgDuration: 60, avgCalories: 200, hasDistance: false },
      { type: 'Strength Training', avgDuration: 45, avgCalories: 300, hasDistance: false },
      { type: 'Walking', avgDuration: 25, avgCalories: 150, hasDistance: true },
      { type: 'HIIT Workout', avgDuration: 20, avgCalories: 350, hasDistance: false },
    ];
    
    const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (this.config.simulateRealisticPatterns) {
      // Realistic workout frequency (3-4 times per week)
      const workoutDays = Math.floor(dayCount * 0.45);
      
      for (let i = 0; i < workoutDays; i++) {
        // Skip some workouts to simulate real behavior
        if (this.config.simulateDataGaps && Math.random() < 0.15) {
          continue;
        }

        const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
        const activity = activities[Math.floor(Math.random() * activities.length)];
        
        // More realistic duration variations
        const durationVariation = 0.7 + Math.random() * 0.6; // 0.7-1.3 multiplier
        const duration = Math.floor(activity.avgDuration * durationVariation);
        
        // Calories correlate with duration and activity type
        const calorieVariation = 0.8 + Math.random() * 0.4; // 0.8-1.2 multiplier
        const calories = Math.floor(activity.avgCalories * calorieVariation * (duration / activity.avgDuration));
        
        // Set realistic workout times (morning or evening peaks)
        const hour = Math.random() < 0.6 ? 
          (6 + Math.random() * 3) : // Morning: 6-9 AM
          (17 + Math.random() * 4); // Evening: 5-9 PM
        randomDate.setHours(Math.floor(hour), Math.random() * 60);
        
        const workout: any = {
          activityType: activity.type,
          workoutActivityType: activity.type,
          startDate: randomDate,
          endDate: new Date(randomDate.getTime() + duration * 60 * 1000),
          duration: duration * 60, // seconds
          totalEnergyBurned: calories,
          source: 'Health',
          device: 'Apple Watch Series 8',
        };

        // Add distance for activities that have it
        if (activity.hasDistance) {
          const speed = activity.type === 'Running' ? 10 : 15; // km/h average
          workout.totalDistance = (duration / 60) * speed * 1000; // meters
        }

        // Add heart rate data
        if (Math.random() < 0.8) { // 80% of workouts have HR data
          const baseHR = activity.type === 'Yoga' ? 100 : 150;
          workout.averageHeartRate = baseHR + Math.random() * 30;
          workout.maximumHeartRate = workout.averageHeartRate + 20 + Math.random() * 25;
        }

        workouts.push(workout);
      }
    } else {
      // Original simpler logic
      for (let i = 0; i < 5; i++) {
        const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
        const activity = activities[Math.floor(Math.random() * activities.length)];
        const duration = Math.random() * 60 + 20; // 20-80 minutes
        
        workouts.push({
          activityType: activity.type,
          startDate: randomDate,
          endDate: new Date(randomDate.getTime() + duration * 60 * 1000),
          duration: duration * 60, // seconds
          totalEnergyBurned: Math.floor(Math.random() * 500) + 200, // 200-700 calories
          totalDistance: Math.random() * 10000, // meters
        });
      }
    }
    
    return workouts.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  private generateMockSamples(dataType: string, options: any): any[] {
    const samples = [];
    const count = Math.floor(Math.random() * 10) + 5; // 5-15 samples
    
    for (let i = 0; i < count; i++) {
      let value: number;
      
      // Generate realistic values based on data type
      switch (dataType) {
        case 'HKQuantityTypeIdentifierHeartRate':
          value = Math.floor(Math.random() * 60) + 60; // 60-120 bpm
          break;
        case 'HKQuantityTypeIdentifierActiveEnergyBurned':
          value = Math.floor(Math.random() * 100) + 50; // 50-150 calories
          break;
        case 'HKQuantityTypeIdentifierBodyMass':
          value = Math.random() * 50 + 50; // 50-100 kg
          break;
        default:
          value = Math.random() * 100;
      }
      
      samples.push({
        value,
        startDate: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      });
    }
    
    return samples;
  }

  // Configuration methods
  setConfig(config: Partial<MockHealthKitConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ [MockHealthKit] Config updated:', this.config);
  }

  resetMock(): void {
    this.isInitialized = false;
    this.grantedPermissions.clear();
    console.log('🔄 [MockHealthKit] Mock reset');
  }

  grantAllPermissions(permissions: string[]): void {
    permissions.forEach(permission => this.grantedPermissions.add(permission));
    console.log(`✅ [MockHealthKit] Granted all ${permissions.length} permissions`);
  }

  denyAllPermissions(): void {
    this.grantedPermissions.clear();
    console.log('❌ [MockHealthKit] Denied all permissions');
  }

  // Enhanced testing methods
  simulatePermissionDenial(dataType: string): void {
    this.grantedPermissions.delete(dataType);
    console.log(`❌ [MockHealthKit] Simulated permission denial for ${dataType}`);
  }

  simulateDataUnavailable(): void {
    this.setConfig({ mockData: false });
    console.log('📵 [MockHealthKit] Simulated data unavailable');
  }

  simulateNetworkError(): void {
    this.setConfig({ successRate: 0, simulateDelay: true, delayMs: 5000 });
    console.log('🌐 [MockHealthKit] Simulating network error conditions');
  }

  enableRealisticMode(): void {
    this.setConfig({
      simulatePermissionDenials: true,
      simulateDataGaps: true,
      simulateRealisticPatterns: true,
      successRate: 0.85,
      delayMs: 600,
    });
    console.log('🎯 [MockHealthKit] Enabled realistic simulation mode');
  }

  enablePerfectMode(): void {
    this.setConfig({
      simulatePermissionDenials: false,
      simulateDataGaps: false,
      simulateRealisticPatterns: false,
      successRate: 1.0,
      delayMs: 100,
    });
    console.log('✨ [MockHealthKit] Enabled perfect simulation mode (for demos)');
  }

  getDetailedStatus(): any {
    return {
      isInitialized: this.isInitialized,
      grantedPermissions: Array.from(this.grantedPermissions),
      config: this.config,
      platform: Platform.OS,
      mockVersion: '2.0.0',
    };
  }
}

export default new MockHealthKit();
