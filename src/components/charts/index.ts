export { default as CalorieProgressRing } from './CalorieProgressRing';
export { default as MacroBreakdownChart } from './MacroBreakdownChart';
export { default as WaterIntakeTracker } from './WaterIntakeTracker';
export { default as WeeklyTrendChart } from './WeeklyTrendChart';

// Export types for chart components
export interface MacroData {
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroTargets {
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayData {
  date: string; // YYYY-MM-DD
  actual: number;
  target: number;
  dayName: string; // Mon, Tue, etc.
}
