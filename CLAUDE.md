# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Start Metro bundler
- `npm run ios` - Run on iOS simulator  
- `npm run android` - Run on Android emulator
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run Jest tests

For iOS development: `cd ios && pod install && cd ..` (run after dependency changes)

## Architecture Overview

This is a React Native app using TypeScript that implements a weekly calorie tracking system with intelligent redistribution of daily allowances.

### Core Architecture Pattern
- **State Management**: Zustand store with persistence (`src/stores/calorieStore.ts`)
- **Business Logic**: Centralized in `WeeklyCalorieRedistributor` class (`src/utils/CalorieRedistribution.ts`)
- **Type Safety**: Comprehensive TypeScript definitions in `src/types/`

### Key Business Logic: Weekly Calorie Redistribution
The core algorithm (`WeeklyCalorieRedistributor.calculateRedistribution`) redistributes remaining weekly calories across remaining days, accounting for:
- Planned training sessions (increases calories on high-intensity days)
- Minimum safe calorie thresholds (1200 calories/day)
- Weekly deficit/surplus goals
- Real-time adjustments after each meal

### State Management Architecture
The Zustand store (`useCalorieStore`) provides:
- **Computed values**: `getCurrentWeekProgress()`, `getCalorieRedistribution()`, `getRemainingCaloriesForToday()`
- **Core actions**: `logMeal()`, `updateBurnedCalories()`, `setWeeklyGoal()`
- **Persistence**: Automatically saves `currentWeekGoal` and `weeklyData`

### Key Data Flow
1. User logs meal → Updates daily consumed calories
2. Store recalculates weekly progress automatically
3. Redistribution algorithm adjusts remaining daily targets
4. UI reflects updated recommendations in real-time

### Import Path Configuration
Uses TypeScript path mapping with `@types/`, `@utils/`, etc. prefixes (configured in tsconfig.json)

### Health Integration Stack
- `react-native-health` for iOS HealthKit
- `react-native-health-connect` for Android Health Connect
- `react-native-chart-kit` for data visualization
- `react-native-push-notification` for meal reminders

### Current Development Status
MVP setup is complete with core algorithm implemented. Empty directories for `components/`, `screens/`, and `services/` are ready for UI development.