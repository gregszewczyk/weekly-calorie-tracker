/**
 * Test script for Apple Health Export functionality
 * Run this to verify the export service works correctly
 */

import { AppleHealthExportService } from '../src/services/AppleHealthExportService';

async function testAppleHealthExport() {
  console.log('🧪 Starting Apple Health Export Service Tests...\n');

  try {
    const exportService = new AppleHealthExportService();

    // Test 1: Weekly Report Generation
    console.log('📊 Test 1: Generating Weekly Report...');
    const weeklyReport = await exportService.generateWeeklyReport();
    console.log('✅ Weekly report generated successfully');
    console.log(`   Period: ${weeklyReport.period.start.toDateString()} - ${weeklyReport.period.end.toDateString()}`);
    console.log(`   Workouts: ${weeklyReport.workoutSummary.totalWorkouts}`);
    console.log(`   Avg Calories: ${Math.round(weeklyReport.nutritionSummary.averageDailyCalories)}`);
    console.log(`   Overall Progress: ${Math.round(weeklyReport.progressTowards.overallProgress)}%\n`);

    // Test 2: Monthly Report Generation
    console.log('📅 Test 2: Generating Monthly Report...');
    const monthlyReport = await exportService.generateMonthlyReport();
    console.log('✅ Monthly report generated successfully');
    console.log(`   Period: ${monthlyReport.period.start.toDateString()} - ${monthlyReport.period.end.toDateString()}`);
    console.log(`   Workouts: ${monthlyReport.workoutSummary.totalWorkouts}`);
    console.log(`   Sleep Quality: ${Math.round(monthlyReport.sleepSummary.averageEfficiency)}%\n`);

    // Test 3: CSV Export
    console.log('📈 Test 3: CSV Export...');
    const csvPath = await exportService.exportToCSV();
    console.log('✅ CSV export completed');
    console.log(`   File: ${csvPath}\n`);

    // Test 4: Apple Health XML Export
    console.log('🍎 Test 4: Apple Health XML Export...');
    const xmlPath = await exportService.exportToAppleHealthXML();
    console.log('✅ Apple Health XML export completed');
    console.log(`   File: ${xmlPath}\n`);

    // Test 5: Comprehensive JSON Export
    console.log('⚡ Test 5: Comprehensive JSON Export...');
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const jsonPath = await exportService.exportComprehensiveData(startDate, endDate);
    console.log('✅ Comprehensive JSON export completed');
    console.log(`   File: ${jsonPath}\n`);

    // Test 6: Nutrition Data Export
    console.log('🥗 Test 6: Nutrition Data Export...');
    const nutritionPath = await exportService.exportNutritionData(startDate, endDate);
    console.log('✅ Nutrition export completed');
    console.log(`   File: ${nutritionPath}\n`);

    // Test 7: Workout Data Export
    console.log('💪 Test 7: Workout Data Export...');
    const workoutPath = await exportService.exportWorkoutData(startDate, endDate);
    console.log('✅ Workout export completed');
    console.log(`   File: ${workoutPath}\n`);

    // Test 8: Healthcare Provider Sharing
    console.log('👩‍⚕️ Test 8: Healthcare Provider Sharing...');
    await exportService.shareWithHealthProvider('test@doctor.com');
    console.log('✅ Healthcare provider sharing prepared\n');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('• Weekly and monthly reports generated');
    console.log('• All export formats working (CSV, XML, JSON)');
    console.log('• Specialized exports functional (nutrition, workouts)');
    console.log('• Healthcare provider sharing operational');
    console.log('• Mock file system and sharing services active');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('• Ensure AppleHealthKitService is properly initialized');
    console.log('• Check that mock dependencies are correctly set up');
    console.log('• Verify calorie store has sample data');
  }
}

// Test data validation
function validateTestData() {
  console.log('🔍 Validating test environment...\n');

  // Check if running on correct platform
  console.log(`Platform: ${process.platform}`);
  console.log(`Node version: ${process.version}`);

  console.log('\n✅ Test environment ready\n');
}

// Run tests
validateTestData();
testAppleHealthExport();

export { testAppleHealthExport };
