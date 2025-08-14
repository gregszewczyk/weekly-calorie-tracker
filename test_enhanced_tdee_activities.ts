import { GarminWellnessService } from './src/services/GarminWellnessService';
import { GarminConnectService } from './src/services/GarminConnectService';

async function testEnhancedTDEEWithActivities() {
  console.log('🔬 Testing Enhanced TDEE with Activities Data');
  console.log('='.repeat(60));

  try {
    // Initialize services
    const garminService = new GarminConnectService();
    const wellnessService = new GarminWellnessService(garminService);

    // Test Enhanced TDEE calculation with activities data
    console.log('� Running Enhanced TDEE debug with activities data...');
    const bmr = 2100; // Your estimated BMR
    await wellnessService.debugEnhancedTDEE(bmr);

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }
}

// Run the test
testEnhancedTDEEWithActivities();
