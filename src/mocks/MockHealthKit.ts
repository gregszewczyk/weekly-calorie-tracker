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
}

class MockHealthKit {
  private config: MockHealthKitConfig = {
    simulateDelay: true,
    delayMs: 500,
    successRate: 0.8, // 80% success rate for permissions
    mockData: true,
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
    if (this.grantedPermissions.has(dataType)) {
      status = 1; // authorized
    } else if (Math.random() < 0.1) {
      status = 3; // restricted
    } else if (Math.random() < 0.3) {
      status = 2; // denied
    } else {
      status = 0; // not determined
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
      steps.push({
        value: Math.floor(Math.random() * 15000) + 3000, // 3,000-18,000 steps
        startDate: new Date(date),
        endDate: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      });
    }
    
    return steps;
  }

  private generateMockWorkouts(options: any): any[] {
    const workouts = [];
    const activities = ['Running', 'Cycling', 'Swimming', 'Yoga', 'Strength Training'];
    
    for (let i = 0; i < 5; i++) {
      const startDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const duration = Math.random() * 60 + 20; // 20-80 minutes
      
      workouts.push({
        activityType: activities[Math.floor(Math.random() * activities.length)],
        startDate,
        endDate: new Date(startDate.getTime() + duration * 60 * 1000),
        duration: duration * 60, // seconds
        totalEnergyBurned: Math.floor(Math.random() * 500) + 200, // 200-700 calories
        totalDistance: Math.random() * 10000, // meters
      });
    }
    
    return workouts;
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
}

export default new MockHealthKit();
