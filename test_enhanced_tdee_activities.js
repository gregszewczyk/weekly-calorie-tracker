/**
 * Test script for Enhanced TDEE calculation using Activities data
 * This should fix the issue where DAILY_SUMMARY returns 0 calories/0 steps
 */

const { GarminWellnessService } = require('./src/services/GarminWellnessService');
const { GarminConnectService } = require('./src/services/GarminConnectService');

async function testEnhancedTDEEWithActivities() {
  console.log('🔬 Testing Enhanced TDEE with Activities Data');
  console.log('='.repeat(60));

  try {
    // Initialize services
    const garminService = new GarminConnectService();
    const wellnessService = new GarminWellnessService(garminService);

    // Check authentication
    const isAuthenticated = await garminService.isAuthenticated();
    console.log(`🔐 Authentication status: ${isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}`);

    if (!isAuthenticated) {
      console.log('❌ Please authenticate with Garmin Connect first');
      return;
    }

    // Test getting activities data (working endpoint)
    console.log('\n🏃 Testing Activities Data:');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 14);

    const activities = await garminService.getActivities(startDate, endDate, 20);
    console.log(`📊 Found ${activities.length} activities in last 14 days`);

    if (activities.length > 0) {
      console.log('Sample activity:', {
        name: activities[0].activityName,
        date: activities[0].startTime,
        calories: activities[0].calories,
        distance: activities[0].distance,
        duration: activities[0].duration
      });
    }

    // Test new wellness data from activities
    console.log('\n📊 Testing Wellness from Activities:');
    const wellnessFromActivities = await wellnessService.getWellnessFromActivities(startDate, endDate);
    console.log(`Retrieved ${wellnessFromActivities.length} days of wellness data from activities`);

    // Show summary of last few days
    wellnessFromActivities.slice(-5).forEach(day => {
      console.log(`${day.date.toISOString().split('T')[0]}: ${day.activeCalories}kcal active, ${day.calories}kcal total, ${day.steps} steps`);
    });

    // Test Enhanced TDEE calculation with activities data
    console.log('\n🔬 Testing Enhanced TDEE Calculation:');
    const bmr = 2100; // Your estimated BMR
    const result = await wellnessService.calculateEnhancedTDEE(bmr);

    console.log('\n✅ ENHANCED TDEE RESULTS:');
    console.log(`📊 Enhanced TDEE: ${result.enhancedTDEE} kcal/day`);
    console.log(`🏃 Activity Level: ${result.activityLevel}`);
    console.log(`📈 Confidence: ${Math.round(result.confidence * 100)}%`);
    console.log(`🔧 Data Source: ${result.dataSource}`);
    console.log(`💡 Insights:`);
    result.insights.forEach(insight => console.log(`   - ${insight}`));

    // Compare with old daily summary method
    console.log('\n📊 Comparing with Daily Summary Data:');
    try {
      const wellnessFromDaily = await wellnessService.getWellnessRange(startDate, endDate);
      console.log(`Daily summaries retrieved: ${wellnessFromDaily.length} days`);
      
      const avgActiveFromDaily = wellnessFromDaily.reduce((sum, day) => sum + (day.activeCalories || 0), 0) / wellnessFromDaily.length;
      const avgStepsFromDaily = wellnessFromDaily.reduce((sum, day) => sum + (day.steps || 0), 0) / wellnessFromDaily.length;
      
      console.log(`Daily Summary Average: ${Math.round(avgActiveFromDaily)} active kcal, ${Math.round(avgStepsFromDaily)} steps`);
      
      const avgActiveFromActivities = wellnessFromActivities.reduce((sum, day) => sum + (day.activeCalories || 0), 0) / wellnessFromActivities.length;
      const avgStepsFromActivities = wellnessFromActivities.reduce((sum, day) => sum + (day.steps || 0), 0) / wellnessFromActivities.length;
      
      console.log(`Activities Average: ${Math.round(avgActiveFromActivities)} active kcal, ${Math.round(avgStepsFromActivities)} steps`);
      
    } catch (error) {
      console.log('❌ Daily summary comparison failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Run the test
testEnhancedTDEEWithActivities();
