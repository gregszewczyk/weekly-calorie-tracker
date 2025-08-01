import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  WeeklyCalorieGoal, 
  DailyCalorieData, 
  MealEntry, 
  WeeklyProgress,
  CalorieRedistribution 
} from '@types/CalorieTypes';
import { WeeklyCalorieRedistributor } from '@utils/CalorieRedistribution';
import { startOfWeek, format, addDays } from 'date-fns';

interface CalorieStore {
  // State
  currentWeekGoal: WeeklyCalorieGoal | null;
  weeklyData: DailyCalorieData[];
  isLoading: boolean;
  error: string | null;

  // Computed values
  getCurrentWeekProgress: () => WeeklyProgress | null;
  getCalorieRedistribution: () => CalorieRedistribution | null;
  getRemainingCaloriesForToday: () => number;
  getTodaysData: () => DailyCalorieData | null;

  // Actions
  setWeeklyGoal: (goal: WeeklyCalorieGoal) => void;
  logMeal: (meal: Omit<MealEntry, 'id' | 'timestamp'>) => void;
  updateBurnedCalories: (date: string, burnedCalories: number) => void;
  deleteMeal: (mealId: string, date: string) => void;
  editMeal: (mealId: string, date: string, updatedMeal: Partial<MealEntry>) => void;
  initializeWeek: (weekStartDate?: Date) => void;
  clearError: () => void;
}

export const useCalorieStore = create<CalorieStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentWeekGoal: null,
      weeklyData: [],
      isLoading: false,
      error: null,

      // Computed values
      getCurrentWeekProgress: () => {
        const { currentWeekGoal, weeklyData } = get();
        if (!currentWeekGoal) return null;
        
        return WeeklyCalorieRedistributor.calculateWeeklyProgress(
          currentWeekGoal,
          weeklyData
        );
      },

      getCalorieRedistribution: () => {
        const progress = get().getCurrentWeekProgress();
        if (!progress) return null;
        
        return WeeklyCalorieRedistributor.calculateRedistribution(progress);
      },

      getRemainingCaloriesForToday: () => {
        const redistribution = get().getCalorieRedistribution();
        const todayData = get().getTodaysData();
        
        if (!redistribution || redistribution.recommendedDailyTargets.length === 0) {
          return todayData?.target || 2000;
        }
        
        const todayTarget = redistribution.recommendedDailyTargets[0];
        const consumed = todayData?.consumed || 0;
        
        return Math.max(0, todayTarget - consumed);
      },

      getTodaysData: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().weeklyData.find(data => data.date === today) || null;
      },

      // Actions
      setWeeklyGoal: (goal: WeeklyCalorieGoal) => {
        set({ currentWeekGoal: goal, error: null });
      },

      logMeal: (meal: Omit<MealEntry, 'id' | 'timestamp'>) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const newMeal: MealEntry = {
          ...meal,
          id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };

        set(state => {
          const weeklyData = [...state.weeklyData];
          const todayIndex = weeklyData.findIndex(data => data.date === today);
          
          if (todayIndex >= 0) {
            // Update existing day
            weeklyData[todayIndex] = {
              ...weeklyData[todayIndex],
              meals: [...weeklyData[todayIndex].meals, newMeal],
              consumed: weeklyData[todayIndex].consumed + meal.calories
            };
          } else {
            // Create new day entry
            const redistribution = get().getCalorieRedistribution();
            const defaultTarget = redistribution?.recommendedDailyTargets[0] || 
                                 state.currentWeekGoal?.dailyBaseline || 2000;
            
            weeklyData.push({
              date: today,
              consumed: meal.calories,
              burned: 0,
              target: defaultTarget,
              meals: [newMeal]
            });
          }
          
          return { weeklyData, error: null };
        });
      },

      updateBurnedCalories: (date: string, burnedCalories: number) => {
        set(state => {
          const weeklyData = [...state.weeklyData];
          const dayIndex = weeklyData.findIndex(data => data.date === date);
          
          if (dayIndex >= 0) {
            weeklyData[dayIndex] = {
              ...weeklyData[dayIndex],
              burned: burnedCalories
            };
          } else {
            // Create new day entry
            const redistribution = get().getCalorieRedistribution();
            const defaultTarget = redistribution?.recommendedDailyTargets[0] || 
                                 state.currentWeekGoal?.dailyBaseline || 2000;
            
            weeklyData.push({
              date,
              consumed: 0,
              burned: burnedCalories,
              target: defaultTarget,
              meals: []
            });
          }
          
          return { weeklyData, error: null };
        });
      },

      deleteMeal: (mealId: string, date: string) => {
        set(state => {
          const weeklyData = [...state.weeklyData];
          const dayIndex = weeklyData.findIndex(data => data.date === date);
          
          if (dayIndex >= 0) {
            const day = weeklyData[dayIndex];
            const mealToDelete = day.meals.find(meal => meal.id === mealId);
            
            if (mealToDelete) {
              weeklyData[dayIndex] = {
                ...day,
                meals: day.meals.filter(meal => meal.id !== mealId),
                consumed: day.consumed - mealToDelete.calories
              };
            }
          }
          
          return { weeklyData, error: null };
        });
      },

      editMeal: (mealId: string, date: string, updatedMeal: Partial<MealEntry>) => {
        set(state => {
          const weeklyData = [...state.weeklyData];
          const dayIndex = weeklyData.findIndex(data => data.date === date);
          
          if (dayIndex >= 0) {
            const day = weeklyData[dayIndex];
            const mealIndex = day.meals.findIndex(meal => meal.id === mealId);
            
            if (mealIndex >= 0) {
              const oldCalories = day.meals[mealIndex].calories;
              const newCalories = updatedMeal.calories || oldCalories;
              
              weeklyData[dayIndex] = {
                ...day,
                meals: day.meals.map(meal => 
                  meal.id === mealId 
                    ? { ...meal, ...updatedMeal }
                    : meal
                ),
                consumed: day.consumed - oldCalories + newCalories
              };
            }
          }
          
          return { weeklyData, error: null };
        });
      },

      initializeWeek: (weekStartDate?: Date) => {
        const startDate = weekStartDate || startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
        const weekStart = format(startDate, 'yyyy-MM-dd');
        
        // Create default goal if none exists
        if (!get().currentWeekGoal) {
          const defaultGoal: WeeklyCalorieGoal = {
            weekStartDate: weekStart,
            totalTarget: 14000, // 2000 calories per day
            dailyBaseline: 2000,
            deficitTarget: -3500 // 1 pound per week deficit
          };
          
          set({ currentWeekGoal: defaultGoal });
        }
        
        // Initialize empty week data if not exists
        const existingDates = get().weeklyData.map(data => data.date);
        const weekDates = Array.from({ length: 7 }, (_, i) => 
          format(addDays(startDate, i), 'yyyy-MM-dd')
        );
        
        const missingDates = weekDates.filter(date => !existingDates.includes(date));
        
        if (missingDates.length > 0) {
          set(state => {
            const newDays: DailyCalorieData[] = missingDates.map(date => ({
              date,
              consumed: 0,
              burned: 0,
              target: state.currentWeekGoal?.dailyBaseline || 2000,
              meals: []
            }));
            
            return {
              weeklyData: [...state.weeklyData, ...newDays].sort((a, b) => 
                a.date.localeCompare(b.date)
              )
            };
          });
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'weekly-calorie-tracker-store',
      partialize: (state) => ({
        currentWeekGoal: state.currentWeekGoal,
        weeklyData: state.weeklyData
      })
    }
  )
);