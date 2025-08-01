export interface DailyCalorieData {
  date: string; // YYYY-MM-DD format
  consumed: number;
  burned: number;
  target: number;
  meals: MealEntry[];
}

export interface MealEntry {
  id: string;
  name: string;
  calories: number;
  timestamp: Date;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout';
}

export interface WeeklyCalorieGoal {
  weekStartDate: string; // YYYY-MM-DD format (Monday)
  totalTarget: number; // Total calories for the week
  dailyBaseline: number; // Base daily allowance (totalTarget / 7)
  deficitTarget: number; // Weekly deficit goal (negative for deficit)
}

export interface WeeklyProgress {
  goal: WeeklyCalorieGoal;
  dailyData: DailyCalorieData[];
  totalConsumed: number;
  totalBurned: number;
  remainingCalories: number;
  projectedOutcome: number; // Projected weekly surplus/deficit
}

export interface CalorieRedistribution {
  remainingDays: number;
  remainingCalories: number;
  recommendedDailyTargets: number[];
  adjustmentReason: 'on-track' | 'over-budget' | 'under-budget' | 'training-day' | 'rest-day';
}