/**
 * Debug Recovery System
 * 
 * Run this in your app to test the recovery system
 * Make sure to run: node debug-recovery-system.js
 */

console.log('🔍 [Debug] Recovery System Troubleshooting Guide\n');

console.log('1. CHECK CONSOLE LOGS:');
console.log('   After logging 5000kcal meal, you should see:');
console.log('   🚨 [Recovery] Overeating event detected: { date: "2025-08-11", excess: 4500, trigger: "severe" }');
console.log('');

console.log('2. VERIFY RECOVERY INTEGRATION:');
console.log('   Add this to the screen where you logged the meal:');
console.log('   ```tsx');
console.log('   import RecoveryIntegration from "../components/RecoveryIntegration";');
console.log('   ');
console.log('   <RecoveryIntegration />  // Add this anywhere in your screen');
console.log('   ```');
console.log('');

console.log('3. MANUAL TESTING:');
console.log('   Add RecoveryDemoScreen to test:');
console.log('   ```tsx');
console.log('   import RecoveryDemoScreen from "../screens/RecoveryDemoScreen";');
console.log('   ');
console.log('   // Navigate to or render RecoveryDemoScreen');
console.log('   // Use "Trigger Overeating Event" button');
console.log('   ```');
console.log('');

console.log('4. DEBUG WITH STORE DIRECTLY:');
console.log('   ```tsx');
console.log('   import { useCalorieStore } from "../stores/calorieStore";');
console.log('   ');
console.log('   const { ');
console.log('     getPendingOvereatingEvent,');
console.log('     checkForOvereatingEvent,');
console.log('     isRecoveryModeEnabled');
console.log('   } = useCalorieStore();');
console.log('   ');
console.log('   // Check these values:');
console.log('   console.log("Recovery enabled:", isRecoveryModeEnabled());');
console.log('   console.log("Pending event:", getPendingOvereatingEvent());');
console.log('   console.log("Manual check:", checkForOvereatingEvent());');
console.log('   ```');
console.log('');

console.log('5. COMMON ISSUES:');
console.log('   ❌ RecoveryIntegration not added to screen');
console.log('   ❌ Recovery mode disabled in settings');
console.log('   ❌ No current week goal configured');
console.log('   ❌ Today\'s data not found in store');
console.log('   ❌ Meal logged with different meal logging component');
console.log('');

console.log('6. WHAT YOU SHOULD SEE:');
console.log('   📱 Red alert card: "Recovery Options Available"');
console.log('   📊 "5000 calories over target • severe overage"');
console.log('   🔴 Red warning icon');
console.log('   👆 Tappable to open recovery modal');
console.log('');

console.log('7. QUICK TEST:');
console.log('   Use RecoveryDemoScreen → "Trigger Overeating Event" button');
console.log('   This bypasses potential integration issues.');
console.log('');

console.log('Need help? Check these files:');
console.log('- src/components/RecoveryIntegration.tsx');
console.log('- src/screens/RecoveryDemoScreen.tsx');
console.log('- src/stores/calorieStore.ts (search for "checkForOvereatingEvent")');
console.log('- BINGE_RECOVERY_IMPLEMENTATION.md');