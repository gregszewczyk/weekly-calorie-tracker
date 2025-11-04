/**
 * Mock Samsung Health Implementation
 * 
 * Mock implementation of Samsung Health for development and testing purposes.
 * Simulates real Samsung Health behavior for non-Android environments.
 */

import { Platform } from 'react-native';

interface MockSamsungHealthConfig {
  simulateDelay: boolean;
  delayMs: number;
  successRate: number;
  mockData: boolean;
  simulateNetworkIssues: boolean;
}

interface MockSamsungHealthAuth {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  scopes: string[];
}

class MockSamsungHealth {
  private config: MockSamsungHealthConfig = {
    simulateDelay: true,
    delayMs: 800, // Slightly slower than HealthKit to simulate network calls
    successRate: 0.85, // 85% success rate for auth
    mockData: true,
    simulateNetworkIssues: false,
  };

  private auth: MockSamsungHealthAuth = {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    userId: null,
    scopes: [],
  };

  private grantedPermissions: Set<string> = new Set();
  private isInitialized = false;

  constructor(config?: Partial<MockSamsungHealthConfig>) {
    this.config = { ...this.config, ...config };
    console.log('🔧 [MockSamsungHealth] Initialized with config:', this.config);
  }

  /**
   * Check if Samsung Health is available (mock always returns true on Android)
   */
  async isAvailable(): Promise<boolean> {
    await this.simulateDelay();
    
    const available = Platform.OS === 'android';
    console.log(`🔍 [MockSamsungHealth] isAvailable: ${available} (platform: ${Platform.OS})`);
    return available;
  }

  /**
   * Initialize Samsung Health SDK (mock implementation)
   */
  async initialize(): Promise<boolean> {
    console.log('🚀 [MockSamsungHealth] Initializing SDK...');
    
    await this.simulateDelay();

    if (this.isInitialized) {
      console.log('✅ [MockSamsungHealth] Already initialized');
      return true;
    }

    // Simulate occasional initialization failures
    if (Math.random() < (1 - this.config.successRate)) {
      console.log('❌ [MockSamsungHealth] Initialization failed (simulated)');
      return false;
    }

    this.isInitialized = true;
    console.log('✅ [MockSamsungHealth] SDK initialization successful');
    return true;
  }

  /**
   * Authenticate with Samsung Account (OAuth simulation)
   */
  async authenticate(scopes: string[]): Promise<boolean> {
    console.log('🔐 [MockSamsungHealth] Starting authentication with scopes:', scopes);
    
    await this.simulateDelay(1200); // Longer delay for auth flow

    if (this.config.simulateNetworkIssues && Math.random() < 0.1) {
      throw new Error('Network timeout during authentication');
    }

    // Simulate auth success/failure based on success rate
    if (Math.random() < this.config.successRate) {
      this.auth = {
        isAuthenticated: true,
        accessToken: `mock_access_token_${Date.now()}`,
        refreshToken: `mock_refresh_token_${Date.now()}`,
        userId: `mock_user_${Math.random().toString(36).substr(2, 9)}`,
        scopes: scopes,
      };

      // Grant permissions based on requested scopes
      scopes.forEach(scope => this.grantedPermissions.add(scope));

      console.log('✅ [MockSamsungHealth] Authentication successful');
      console.log(`   User ID: ${this.auth.userId}`);
      console.log(`   Granted scopes: ${scopes.length}`);
      return true;
    } else {
      console.log('❌ [MockSamsungHealth] Authentication failed (simulated)');
      return false;
    }
  }

  /**
   * Check authentication status
   */
  async isAuthenticated(): Promise<boolean> {
    await this.simulateDelay(100);
    
    // Simulate token expiration
    if (this.auth.isAuthenticated && Math.random() < 0.05) {
      console.log('⏰ [MockSamsungHealth] Token expired (simulated)');
      this.auth.isAuthenticated = false;
      this.auth.accessToken = null;
    }

    return this.auth.isAuthenticated;
  }

  /**
   * Get user profile information
   */
  async getUserProfile(): Promise<any> {
    await this.simulateDelay();

    if (!this.auth.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    return {
      userId: this.auth.userId,
      email: `user${this.auth.userId}@samsung.com`,
      name: `Samsung User ${Math.floor(Math.random() * 1000)}`,
      profileImage: null,
      country: 'US',
      timezone: 'America/New_York',
    };
  }

  /**
   * Get step data
   */
  async getSteps(startDate: Date, endDate: Date): Promise<any[]> {
    await this.simulateDelay();

    if (!this.auth.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    if (!this.config.mockData) {
      throw new Error('Mock data disabled');
    }

    const steps = this.generateMockSteps(startDate, endDate);
    console.log(`📊 [MockSamsungHealth] Returning ${steps.length} step records`);
    return steps;
  }

  /**
   * Get workout/activity data
   */
  async getExercises(startDate: Date, endDate: Date): Promise<any[]> {
    await this.simulateDelay();

    if (!this.auth.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    if (!this.config.mockData) {
      throw new Error('Mock data disabled');
    }

    const exercises = this.generateMockExercises(startDate, endDate);
    console.log(`🏃 [MockSamsungHealth] Returning ${exercises.length} exercise records`);
    return exercises;
  }

  /**
   * Get sleep data
   */
  async getSleep(startDate: Date, endDate: Date): Promise<any[]> {
    await this.simulateDelay();

    if (!this.auth.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    if (!this.config.mockData) {
      throw new Error('Mock data disabled');
    }

    const sleep = this.generateMockSleep(startDate, endDate);
    console.log(`😴 [MockSamsungHealth] Returning ${sleep.length} sleep records`);
    return sleep;
  }

  /**
   * Get heart rate data
   */
  async getHeartRate(startDate: Date, endDate: Date): Promise<any[]> {
    await this.simulateDelay();

    if (!this.auth.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const heartRate = this.generateMockHeartRate(startDate, endDate);
    console.log(`💓 [MockSamsungHealth] Returning ${heartRate.length} heart rate records`);
    return heartRate;
  }

  /**
   * Get nutrition data
   */
  async getNutrition(startDate: Date, endDate: Date): Promise<any[]> {
    await this.simulateDelay();

    if (!this.auth.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const nutrition = this.generateMockNutrition(startDate, endDate);
    console.log(`🥗 [MockSamsungHealth] Returning ${nutrition.length} nutrition records`);
    return nutrition;
  }

  /**
   * Write step data
   */
  async writeSteps(steps: number, date: Date): Promise<boolean> {
    await this.simulateDelay();

    if (!this.auth.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    console.log(`💾 [MockSamsungHealth] Wrote ${steps} steps for ${date.toDateString()}`);
    return true;
  }

  /**
   * Write exercise data
   */
  async writeExercise(exercise: any): Promise<boolean> {
    await this.simulateDelay();

    if (!this.auth.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    console.log('💾 [MockSamsungHealth] Wrote exercise data:', exercise.exerciseType);
    return true;
  }

  // Private helper methods

  private async simulateDelay(customMs?: number): Promise<void> {
    if (!this.config.simulateDelay) return;
    
    const delay = customMs || this.config.delayMs;
    await new Promise<void>(resolve => setTimeout(resolve, delay));
  }

  private generateMockSteps(startDate: Date, endDate: Date): any[] {
    const steps = [];
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Lower steps on weekends
      const baseSteps = isWeekend ? 6000 : 9000;
      const stepCount = Math.floor(Math.random() * 8000) + baseSteps;
      
      steps.push({
        date: new Date(date),
        steps: stepCount,
        distance: stepCount * 0.0008, // km
        calories: Math.floor(stepCount * 0.04),
        duration: Math.floor(stepCount / 100), // minutes active
      });
    }
    
    return steps;
  }

  private generateMockExercises(startDate: Date, endDate: Date): any[] {
    const exercises = [];
    const exerciseTypes = [
      { type: 'RUNNING', name: 'Running' },
      { type: 'CYCLING', name: 'Cycling' },
      { type: 'WALKING', name: 'Walking' },
      { type: 'SWIMMING', name: 'Swimming' },
      { type: 'STRENGTH_TRAINING', name: 'Strength Training' },
      { type: 'YOGA', name: 'Yoga' },
    ];

    const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const exerciseCount = Math.floor(dayCount * 0.4); // ~40% of days have exercises

    for (let i = 0; i < exerciseCount; i++) {
      const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      const exercise = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
      const duration = Math.random() * 60 + 20; // 20-80 minutes
      
      exercises.push({
        exerciseType: exercise.type,
        exerciseName: exercise.name,
        startDate: randomDate,
        endDate: new Date(randomDate.getTime() + duration * 60 * 1000),
        duration: duration * 60, // seconds
        calories: Math.floor(Math.random() * 600) + 200, // 200-800 calories
        distance: exercise.type === 'RUNNING' ? Math.random() * 15 : null, // km
        avgHeartRate: Math.floor(Math.random() * 60) + 120, // 120-180 bpm
      });
    }
    
    return exercises.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  private generateMockSleep(startDate: Date, endDate: Date): any[] {
    const sleep = [];
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const bedTime = new Date(date);
      bedTime.setHours(22 + Math.random() * 3, Math.random() * 60); // 22:00-01:00
      
      const sleepDuration = (6 + Math.random() * 4) * 60; // 6-10 hours in minutes
      const wakeTime = new Date(bedTime.getTime() + sleepDuration * 60 * 1000);
      
      sleep.push({
        bedTime,
        wakeTime,
        duration: sleepDuration * 60, // seconds
        efficiency: Math.random() * 20 + 75, // 75-95%
        deepSleep: Math.floor(sleepDuration * 0.15), // ~15% deep sleep
        lightSleep: Math.floor(sleepDuration * 0.55), // ~55% light sleep
        remSleep: Math.floor(sleepDuration * 0.25), // ~25% REM sleep
        awake: Math.floor(sleepDuration * 0.05), // ~5% awake
      });
    }
    
    return sleep;
  }

  private generateMockHeartRate(startDate: Date, endDate: Date): any[] {
    const heartRate = [];
    const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const sampleCount = dayCount * 24; // Hourly samples
    
    for (let i = 0; i < sampleCount; i++) {
      const timestamp = new Date(startDate.getTime() + (i * 60 * 60 * 1000));
      const hour = timestamp.getHours();
      
      let baseRate = 70;
      
      // Simulate daily rhythm
      if (hour >= 6 && hour <= 22) {
        baseRate = 75; // Daytime
      } else {
        baseRate = 65; // Nighttime
      }
      
      // Add some variation
      const rate = Math.floor(baseRate + Math.random() * 20 - 10);
      
      heartRate.push({
        timestamp,
        heartRate: Math.max(50, Math.min(180, rate)),
      });
    }
    
    return heartRate;
  }

  private generateMockNutrition(startDate: Date, endDate: Date): any[] {
    const nutrition = [];
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // 1-4 meals per day
      const mealCount = Math.floor(Math.random() * 4) + 1;
      
      for (let i = 0; i < mealCount; i++) {
        const mealTime = new Date(date);
        mealTime.setHours(6 + i * 4 + Math.random() * 2); // Spread meals throughout day
        
        nutrition.push({
          timestamp: mealTime,
          calories: Math.floor(Math.random() * 600) + 200, // 200-800 calories
          protein: Math.floor(Math.random() * 40) + 10, // g
          carbs: Math.floor(Math.random() * 80) + 20, // g
          fat: Math.floor(Math.random() * 30) + 5, // g
          fiber: Math.floor(Math.random() * 15) + 2, // g
          sugar: Math.floor(Math.random() * 25) + 5, // g
        });
      }
    }
    
    return nutrition.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Configuration and utility methods

  setConfig(config: Partial<MockSamsungHealthConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ [MockSamsungHealth] Config updated:', this.config);
  }

  resetMock(): void {
    this.isInitialized = false;
    this.grantedPermissions.clear();
    this.auth = {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      userId: null,
      scopes: [],
    };
    console.log('🔄 [MockSamsungHealth] Mock reset');
  }

  simulateAuthSuccess(scopes: string[]): void {
    this.auth = {
      isAuthenticated: true,
      accessToken: `mock_token_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      userId: `mock_user_test`,
      scopes: scopes,
    };
    scopes.forEach(scope => this.grantedPermissions.add(scope));
    console.log('✅ [MockSamsungHealth] Simulated auth success');
  }

  simulateAuthFailure(): void {
    this.auth.isAuthenticated = false;
    this.auth.accessToken = null;
    this.grantedPermissions.clear();
    console.log('❌ [MockSamsungHealth] Simulated auth failure');
  }

  getAuthStatus(): MockSamsungHealthAuth {
    return { ...this.auth };
  }
}

export default new MockSamsungHealth();