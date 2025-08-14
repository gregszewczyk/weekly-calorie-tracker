# GitHub Copilot Prompts: Daily Data Input & Visualization Screen

## Prompt 1: Create Daily Logging Screen Component

```
Create a React Native screen component called DailyLoggingScreen.tsx in src/screens/ for logging daily nutrition and training data. Requirements:

1. **Screen Structure:**
   - Header with current date and day name (e.g., "Monday, Jan 1st")
   - Tab navigation between "Nutrition" and "Training" views
   - Floating action button for quick meal/workout entry

2. **Nutrition Tab:**
   - Today's calorie target vs consumed (progress bar)
   - Macro breakdown (protein/carbs/fat) with circular progress indicators
   - List of logged meals with time, name, and calories
   - "Add Meal" button that opens meal logging modal
   - Water intake tracker with glass icons

3. **Training Tab:**
   - Today's planned vs completed workouts
   - Calories burned tracker
   - Heart rate zones if available
   - RPE (Rate of Perceived Exertion) input slider
   - Notes section for training feedback

4. **Styling:**
   - Match existing app theme (blue #339AF0)
   - Card-based layout with shadows
   - Responsive design for different screen sizes
   - Smooth animations for progress indicators

Use the existing useCalorieStore for state management and follow the established component patterns in the codebase.
```

## Prompt 2: Create Meal Logging Modal Component

```
Create a MealLoggingModal.tsx component in src/components/ for adding meals. Requirements:

1. **Modal Structure:**
   - Slide-up modal with backdrop
   - Header with "Log Meal" title and close button
   - Form fields in a scrollable container

2. **Form Fields:**
   - Meal type selector (Breakfast, Lunch, Dinner, Snack)
   - Food name input with autocomplete suggestions
   - Calorie input (numeric keypad)
   - Macro inputs (protein, carbs, fat in grams)
   - Time picker (defaults to current time)
   - Photo upload option (optional)
   - Notes field

3. **Features:**
   - Real-time macro calculation from calories
   - Quick add buttons for common foods
   - Barcode scanner integration placeholder
   - Form validation with error messages
   - Save and "Save & Add Another" buttons

4. **State Management:**
   - Use local state for form data
   - Integrate with useCalorieStore.logMeal() method
   - Handle loading states and success feedback

Follow React Native best practices for modals and form handling.
```

## Prompt 3: Create Training Session Modal Component

```
Create a TrainingSessionModal.tsx component in src/components/ for logging workouts. Requirements:

1. **Modal Structure:**
   - Full-screen modal with custom header
   - Header with sport icon, "Log Workout" title, and close/save buttons
   - Tabbed interface for different input types

2. **Basic Info Tab:**
   - Sport type selector (running, cycling, strength, etc.)
   - Session name/title input
   - Duration input (hours and minutes)
   - Start/end time pickers
   - Intensity selector (Easy, Moderate, Hard, Max)

3. **Performance Tab:**
   - Calories burned input
   - Distance (if applicable)
   - Average heart rate
   - Peak heart rate
   - Power data (for cycling/running)
   - RPE scale (1-10 slider with descriptions)

4. **Notes Tab:**
   - Workout notes text area
   - Equipment used
   - Location
   - Weather conditions (if outdoor)
   - How did you feel? (mood selector)

5. **Integration:**
   - Save to useCalorieStore
   - Update daily burned calories
   - Support for athlete-specific metrics based on sport

Use sport-specific icons and colors, with smooth transitions between tabs.
```

## Prompt 4: Create Daily Progress Visualization Components

```
Create reusable visualization components in src/components/charts/ for displaying daily progress:

1. **CalorieProgressRing.tsx:**
   - Circular progress ring showing calories consumed vs target
   - Animated fill with smooth transitions
   - Center text showing remaining calories
   - Color coding: green (under target), yellow (at target), red (over)
   - Props: consumed, target, animated, size

2. **MacroBreakdownChart.tsx:**
   - Three connected semi-circular progress indicators
   - Each shows protein/carbs/fat vs targets
   - Percentage and gram labels
   - Color scheme: protein (red), carbs (blue), fat (green)
   - Props: macros (current), targets, animated

3. **WaterIntakeTracker.tsx:**
   - Row of glass icons (8-10 glasses)
   - Fill glasses based on intake progress
   - Tap to add/remove glasses
   - Daily target customizable
   - Props: currentIntake, dailyTarget, onUpdate

4. **WeeklyTrendChart.tsx:**
   - Line chart showing 7-day calorie trend
   - Dots for each day with actual vs target
   - Smooth curve with gradient fill
   - Scrollable for historical data
   - Props: weeklyData, showTarget, interactive

Use react-native-svg for custom graphics and ensure smooth 60fps animations.
```

## Prompt 5: Add Navigation and Integration

```
Integrate the DailyLoggingScreen into the app navigation and connect all components:

1. **Navigation Updates:**
   - Add DailyLogging to RootStackParamList in NavigationTypes.ts
   - Add screen to AppNavigator.tsx with appropriate header styling
   - Add navigation button to WeeklyBankingScreen (maybe "Today's Log" button)

2. **Store Integration:**
   - Extend useCalorieStore with daily logging methods:
     - logMeal(meal: MealEntry): void
     - logWorkout(workout: WorkoutSession): void  
     - updateWaterIntake(glasses: number): void
     - getDailyProgress(): DailyProgress
   - Update existing types in CalorieTypes.ts for new data structures

3. **Screen Connections:**
   - DailyLoggingScreen uses MealLoggingModal and TrainingSessionModal
   - Pass proper navigation props and callback functions
   - Handle modal states and data flow
   - Show success/error toasts after saving

4. **Data Flow:**
   - Modal saves → Store updates → Screen refreshes
   - Real-time updates when switching between tabs
   - Optimistic updates for better UX
   - Error handling with user feedback

5. **Testing:**
   - Add sample data for development
   - Test all modal interactions
   - Verify store persistence
   - Check navigation flow

Make sure the integration follows existing app patterns and maintains type safety throughout.
```

## Prompt 6: Enhance with Advanced Features

```
Add advanced features to make the daily logging experience more intuitive:

1. **Smart Suggestions:**
   - Recent meals quick-add buttons
   - AI-powered meal suggestions based on remaining macros
   - Common foods database with nutritional info
   - Previous workout templates for quick logging

2. **Quick Actions:**
   - Swipe gestures on meal/workout cards for edit/delete
   - Long press for context menu
   - Voice notes for workout feedback
   - Photo capture with automatic meal detection placeholder

3. **Progress Insights:**
   - Daily streak counter (consecutive logging days)
   - Weekly average comparisons
   - Macro timing optimization suggestions
   - Training load recommendations

4. **Accessibility:**
   - Screen reader support for all components
   - High contrast mode compatibility
   - Large text support
   - Voice input for meal logging

5. **Performance Optimizations:**
   - Lazy loading for historical data
   - Image compression for meal photos
   - Efficient re-renders with React.memo
   - Background sync when app returns to foreground

6. **Export Features:**
   - Daily summary sharing (text/image)
   - CSV export for weekly data
   - Integration with fitness apps (placeholder)
   - Backup/restore functionality

Focus on user experience with smooth animations, intuitive gestures, and helpful feedback throughout the logging process.
```

---

## Implementation Order:
1. Run Prompt 1 to create the main screen
2. Run Prompts 2 & 3 to create the modals
3. Run Prompt 4 to create visualization components  
4. Run Prompt 5 to integrate everything
5. Run Prompt 6 for advanced features (optional)

Each prompt is designed to be self-contained while building upon the existing codebase architecture.