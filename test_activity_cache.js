/**
 * Test Activity Caching System
 * 
 * This script demonstrates the offline activity caching capabilities
 * of the DailyActivitySync service.
 */

const { DailyActivitySync } = require('./src/services/DailyActivitySync');

async function testActivityCaching() {
  console.log('🧪 Testing Activity Caching System\n');

  try {
    // 1. Check initial cache state
    console.log('📊 Initial Cache Stats:');
    const initialStats = await DailyActivitySync.getCacheStats();
    console.log(JSON.stringify(initialStats, null, 2));

    // 2. Test preloading cache (if device connected)
    console.log('\n🔄 Testing Cache Preload:');
    await DailyActivitySync.preloadActivityCache();

    // 3. Check cache stats after preload
    console.log('\n📊 Cache Stats After Preload:');
    const afterPreloadStats = await DailyActivitySync.getCacheStats();
    console.log(JSON.stringify(afterPreloadStats, null, 2));

    // 4. Test getting activities for yesterday (should use cache if no connection)
    console.log('\n📅 Testing Yesterday\'s Activities:');
    const syncResult = await DailyActivitySync.syncYesterdaysActivities();
    console.log('Sync Result:', {
      success: syncResult.syncSuccess,
      activities: syncResult.activitiesSynced,
      calories: syncResult.totalCaloriesBurned,
      error: syncResult.error
    });

    // 5. Test cache statistics
    console.log('\n📈 Final Cache Stats:');
    const finalStats = await DailyActivitySync.getCacheStats();
    console.log(JSON.stringify(finalStats, null, 2));

    // 6. Test sync status
    console.log('\n🔍 Current Sync Status:');
    const syncStatus = await DailyActivitySync.getCurrentSyncStatus();
    console.log(JSON.stringify(syncStatus, null, 2));

    console.log('\n✅ Activity caching test completed successfully!');

  } catch (error) {
    console.error('❌ Activity caching test failed:', error);
    console.error(error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testActivityCaching();
}

module.exports = { testActivityCaching };
