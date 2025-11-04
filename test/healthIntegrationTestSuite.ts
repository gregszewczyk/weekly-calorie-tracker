/**
 * Comprehensive Health Integration Test Suite
 * 
 * Tests Apple HealthKit and Samsung Health integrations using mock services.
 * This allows testing without actual devices and covers all major user stories.
 */

import MockHealthKit from '../src/mocks/MockHealthKit';
import MockSamsungHealth from '../src/mocks/MockSamsungHealth';
import { healthDeviceManager } from '../src/services/HealthDeviceManager';

interface TestScenario {
  name: string;
  description: string;
  setup?: () => Promise<void>;
  test: () => Promise<boolean>;
  cleanup?: () => Promise<void>;
}

class HealthIntegrationTestSuite {
  private testResults: { [key: string]: { passed: boolean; error?: string; duration: number } } = {};

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Comprehensive Health Integration Tests...\n');
    
    const scenarios: TestScenario[] = [
      // Apple HealthKit Tests
      ...this.getAppleHealthKitScenarios(),
      
      // Samsung Health Tests
      ...this.getSamsungHealthScenarios(),
      
      // Cross-platform Tests
      ...this.getCrossPlatformScenarios(),
      
      // Error Handling Tests
      ...this.getErrorHandlingScenarios(),
    ];

    for (const scenario of scenarios) {
      await this.runTestScenario(scenario);
    }

    this.printTestSummary();
  }

  private async runTestScenario(scenario: TestScenario): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Running: ${scenario.name}`);
      console.log(`   Description: ${scenario.description}`);
      
      // Setup
      if (scenario.setup) {
        await scenario.setup();
      }

      // Run test
      const passed = await scenario.test();
      
      // Cleanup
      if (scenario.cleanup) {
        await scenario.cleanup();
      }

      const duration = Date.now() - startTime;
      this.testResults[scenario.name] = { passed, duration };
      
      console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'} (${duration}ms)\n`);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.testResults[scenario.name] = { 
        passed: false, 
        error: error.message,
        duration 
      };
      console.log(`   ❌ FAILED: ${error.message} (${duration}ms)\n`);
    }
  }

  private getAppleHealthKitScenarios(): TestScenario[] {
    return [
      {
        name: 'Apple HealthKit - Basic Connection',
        description: 'User can connect to Apple HealthKit successfully',
        setup: async () => {
          MockHealthKit.enablePerfectMode();
          MockHealthKit.resetMock();
        },
        test: async () => {
          const result = await healthDeviceManager.connect({
            platform: 'apple',
            requestedPermissions: ['steps', 'workouts', 'calories']
          });
          return result.success;
        }
      },
      {
        name: 'Apple HealthKit - Permission Denied',
        description: 'App handles HealthKit permission denial gracefully',
        setup: async () => {
          MockHealthKit.resetMock();
          MockHealthKit.denyAllPermissions();
        },
        test: async () => {
          const result = await healthDeviceManager.connect({
            platform: 'apple',
            requestedPermissions: ['steps', 'workouts', 'calories']
          });
          return !result.success && result.error?.includes('permissions');
        }
      },
      {
        name: 'Apple HealthKit - Workout Data Sync',
        description: 'User can sync workout data from HealthKit',
        setup: async () => {
          MockHealthKit.enableRealisticMode();
          MockHealthKit.resetMock();
          await healthDeviceManager.connect({
            platform: 'apple',
            requestedPermissions: ['workouts']
          });
        },
        test: async () => {
          const activities = await healthDeviceManager.getRecentActivities('apple', 7);
          return activities.length > 0 && activities[0].platform === 'apple';
        }
      },
      {
        name: 'Apple HealthKit - Data Gap Handling',
        description: 'App handles missing HealthKit data gracefully',
        setup: async () => {
          MockHealthKit.setConfig({
            simulateDataGaps: true,
            simulateRealisticPatterns: true,
            mockData: true
          });
        },
        test: async () => {
          const activities = await healthDeviceManager.getRecentActivities('apple', 14);
          // Should handle gaps without crashing
          return Array.isArray(activities);
        }
      },
      {
        name: 'Apple HealthKit - Realistic Workout Patterns',
        description: 'HealthKit data shows realistic workout patterns',
        setup: async () => {
          MockHealthKit.enableRealisticMode();
        },
        test: async () => {
          const activities = await healthDeviceManager.getRecentActivities('apple', 14);
          
          if (activities.length === 0) return true; // No activities is valid
          
          // Check for realistic patterns
          const hasValidDurations = activities.every(a => a.duration >= 10 && a.duration <= 120);
          const hasValidCalories = activities.every(a => a.calories >= 50 && a.calories <= 1000);
          const hasRealisticTiming = activities.some(a => {
            const hour = a.startTime.getHours();
            return (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 21); // Morning or evening
          });
          
          return hasValidDurations && hasValidCalories && (activities.length < 3 || hasRealisticTiming);
        }
      }
    ];
  }

  private getSamsungHealthScenarios(): TestScenario[] {
    return [
      {
        name: 'Samsung Health - Basic Connection',
        description: 'User can connect to Samsung Health successfully',
        setup: async () => {
          MockSamsungHealth.resetMock();
          MockSamsungHealth.setConfig({ 
            successRate: 1.0, 
            mockData: true,
            simulateNetworkIssues: false 
          });
        },
        test: async () => {
          const result = await healthDeviceManager.connect({
            platform: 'samsung',
            requestedPermissions: ['activity', 'sleep', 'steps']
          });
          return result.success;
        }
      },
      {
        name: 'Samsung Health - Authentication Failure',
        description: 'App handles Samsung Health auth failure gracefully',
        setup: async () => {
          MockSamsungHealth.resetMock();
          MockSamsungHealth.simulateAuthFailure();
        },
        test: async () => {
          const result = await healthDeviceManager.connect({
            platform: 'samsung',
            requestedPermissions: ['activity']
          });
          return !result.success && result.error?.includes('authentication');
        }
      },
      {
        name: 'Samsung Health - Exercise Data Sync',
        description: 'User can sync exercise data from Samsung Health',
        setup: async () => {
          MockSamsungHealth.resetMock();
          MockSamsungHealth.simulateAuthSuccess(['read:health:activity']);
        },
        test: async () => {
          const activities = await healthDeviceManager.getRecentActivities('samsung', 7);
          return activities.length > 0 && activities[0].platform === 'samsung';
        }
      },
      {
        name: 'Samsung Health - Network Issues',
        description: 'App handles Samsung Health network issues gracefully',
        setup: async () => {
          MockSamsungHealth.setConfig({ simulateNetworkIssues: true });
        },
        test: async () => {
          try {
            await healthDeviceManager.connect({
              platform: 'samsung',
              requestedPermissions: ['activity']
            });
            return false; // Should have thrown an error
          } catch (error) {
            return true; // Expected network error
          }
        }
      },
      {
        name: 'Samsung Health - Realistic Exercise Types',
        description: 'Samsung Health provides realistic exercise types',
        setup: async () => {
          MockSamsungHealth.resetMock();
          MockSamsungHealth.simulateAuthSuccess(['read:health:activity']);
        },
        test: async () => {
          const activities = await healthDeviceManager.getRecentActivities('samsung', 14);
          
          if (activities.length === 0) return true;
          
          // Check for valid Samsung Health exercise types
          const validTypes = ['RUNNING', 'CYCLING', 'WALKING', 'SWIMMING', 'STRENGTH_TRAINING', 'YOGA'];
          const hasValidTypes = activities.every(a => 
            validTypes.some(type => a.activityType.includes(type) || type.includes(a.activityType.toUpperCase()))
          );
          
          return hasValidTypes;
        }
      }
    ];
  }

  private getCrossPlatformScenarios(): TestScenario[] {
    return [
      {
        name: 'Cross-Platform - Multiple Connections',
        description: 'User can connect to multiple health platforms simultaneously',
        test: async () => {
          // Reset both services
          MockHealthKit.enablePerfectMode();
          MockHealthKit.resetMock();
          MockSamsungHealth.resetMock();
          MockSamsungHealth.setConfig({ successRate: 1.0, mockData: true });
          
          // Try connecting to both
          const appleResult = await healthDeviceManager.connect({
            platform: 'apple',
            requestedPermissions: ['steps', 'workouts']
          });
          
          const samsungResult = await healthDeviceManager.connect({
            platform: 'samsung', 
            requestedPermissions: ['activity', 'steps']
          });
          
          return appleResult.success && samsungResult.success;
        }
      },
      {
        name: 'Cross-Platform - Data Consistency',
        description: 'Activity data is consistent across platforms',
        setup: async () => {
          // Set both to realistic modes
          MockHealthKit.enableRealisticMode();
          MockSamsungHealth.setConfig({
            simulateRealisticPatterns: true,
            mockData: true
          });
        },
        test: async () => {
          const appleActivities = await healthDeviceManager.getRecentActivities('apple', 7);
          const samsungActivities = await healthDeviceManager.getRecentActivities('samsung', 7);
          
          // Both should return valid activity structures
          const appleValid = appleActivities.every(a => 
            a.id && a.platform === 'apple' && a.startTime && typeof a.calories === 'number'
          );
          
          const samsungValid = samsungActivities.every(a => 
            a.id && a.platform === 'samsung' && a.startTime && typeof a.calories === 'number'
          );
          
          return appleValid && samsungValid;
        }
      },
      {
        name: 'Cross-Platform - Connection Status',
        description: 'App correctly tracks connection status across platforms',
        test: async () => {
          const connections = healthDeviceManager.getConnections();
          
          // Should have connections for platforms we set up
          const hasApple = connections.some(c => c.platform === 'apple');
          const hasSamsung = connections.some(c => c.platform === 'samsung');
          
          return hasApple && hasSamsung;
        }
      }
    ];
  }

  private getErrorHandlingScenarios(): TestScenario[] {
    return [
      {
        name: 'Error Handling - Network Timeout',
        description: 'App handles network timeouts gracefully',
        setup: async () => {
          MockHealthKit.simulateNetworkError();
          MockSamsungHealth.setConfig({ 
            simulateDelay: true, 
            delayMs: 6000,  // Longer than typical timeout
            simulateNetworkIssues: true 
          });
        },
        test: async () => {
          try {
            await Promise.race([
              healthDeviceManager.connect({
                platform: 'apple',
                requestedPermissions: ['steps']
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
            ]);
            return false; // Should have timed out
          } catch (error) {
            return true; // Expected timeout
          }
        }
      },
      {
        name: 'Error Handling - Invalid Platform',
        description: 'App handles unsupported platform gracefully',
        test: async () => {
          try {
            // This should fail validation
            const result = await healthDeviceManager.connect({
              platform: 'fitbit' as any, // Invalid platform
              requestedPermissions: ['steps']
            });
            return !result.success;
          } catch (error) {
            return true; // Expected error
          }
        }
      },
      {
        name: 'Error Handling - Data Corruption',
        description: 'App handles corrupted health data gracefully',
        setup: async () => {
          MockHealthKit.simulateDataUnavailable();
        },
        test: async () => {
          try {
            const activities = await healthDeviceManager.getRecentActivities('apple', 7);
            return Array.isArray(activities); // Should return empty array, not crash
          } catch (error) {
            return false; // Should not throw
          }
        }
      }
    ];
  }

  private printTestSummary(): void {
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = Object.values(this.testResults).reduce((sum, r) => sum + r.duration, 0);

    console.log('📊 Test Summary');
    console.log('===============');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      Object.entries(this.testResults)
        .filter(([_, result]) => !result.passed)
        .forEach(([name, result]) => {
          console.log(`   • ${name}: ${result.error || 'Unknown error'}`);
        });
    }

    console.log('\n🎯 Integration Test Categories Covered:');
    console.log('• ✅ Apple HealthKit connection and data sync');
    console.log('• ✅ Samsung Health authentication and exercise data');
    console.log('• ✅ Cross-platform compatibility');
    console.log('• ✅ Error handling and edge cases');
    console.log('• ✅ Realistic data patterns and user behaviors');
    console.log('• ✅ Permission handling and denial scenarios');
    
    console.log('\n📝 Next Steps for Real Device Testing:');
    console.log('1. Deploy to iOS device/simulator for HealthKit testing');
    console.log('2. Deploy to Android device for Samsung Health testing');
    console.log('3. Test with real health data and user interactions');
    console.log('4. Verify UI flows and error message display');
    console.log('5. Test background sync and data persistence');

    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! MVP health integration is ready for real device testing.');
    } else {
      console.log('\n⚠️ Some tests failed. Review and fix issues before real device testing.');
    }
  }
}

// Export for use in other test files
export { HealthIntegrationTestSuite };

// Run tests if called directly
if (require.main === module) {
  const testSuite = new HealthIntegrationTestSuite();
  testSuite.runAllTests().catch(console.error);
}