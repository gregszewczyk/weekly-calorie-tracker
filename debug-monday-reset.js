/**
 * Debug Monday reset logic
 */

const { startOfWeek, format } = require('date-fns');

const today = new Date();
const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
const todayString = format(today, 'yyyy-MM-dd');
const weekStartString = format(weekStart, 'yyyy-MM-dd');

console.log('🗓️ [Debug] Monday reset conditions:');
console.log(`   Today: ${today.toDateString()} (${todayString})`);
console.log(`   Week start: ${weekStart.toDateString()} (${weekStartString})`);
console.log(`   Is Monday: ${today.getDay() === 1}`);
console.log(`   Is week start: ${todayString === weekStartString}`);

if (today.getDay() === 1 && todayString === weekStartString) {
  console.log('✅ [Debug] All conditions met for Monday reset');
} else if (today.getDay() === 1) {
  console.log('⚠️ [Debug] It is Monday but todayString !== weekStartString');
  console.log(`   This suggests the stored weekStartDate might be from a different week`);
} else {
  console.log('ℹ️ [Debug] Not Monday, reset conditions not applicable');
}