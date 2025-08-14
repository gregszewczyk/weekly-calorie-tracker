# Copilot Implementation Guide - Phase 1

## Implementation Order & Dependencies

### Step 1: Extend Types (No Dependencies)
### Step 2: Goal Selection Screen (Uses new types)
### Step 3: Weight Tracking (Uses goal types)
### Step 4: Weekly Banking Dashboard (Uses all previous)
### Step 5: Simplified Logging (Uses dashboard)

---

## Step 1: Extend Core Types

### File: `src/types/GoalTypes.ts` (NEW)
**Copilot Prompt:** "Create TypeScript types for goal management with Cut/Bulk/Maintenance modes, timeline tracking, and weight entries"

```typescript
// Expected structure:
export type GoalMode = 'cut' | 'bulk' | 'maintenance' | 'performance';

export interface GoalConfiguration {
  mode: GoalMode;
  startDate: string; // YYYY-MM-DD
  targetDate?: string; // For races, events
  weeklyDeficitTarget: number; // Negative for cut, positive for bulk
  isOpenEnded: boolean;
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
  timestamp: Date;
}

export interface WeightTrend {
  current: number;
  sevenDayAverage: number;
  trend: 'up' | 'down' | 'stable';
  weeklyChange: number;
}
```

### File: `src/types/CalorieTypes.ts` (EXTEND EXISTING)
**Copilot Prompt:** "Extend existing WeeklyCalorieGoal interface to include GoalConfiguration and add banking-focused display properties"

```typescript
// Add to existing WeeklyCalorieGoal:
export interface WeeklyCalorieGoal {
  // ... existing properties
  goalConfig: GoalConfiguration; // NEW
  weeklyAllowance: number; // NEW - total calories for week
}

// NEW interface for banking display
export interface CalorieBankStatus {
  weeklyAllowance: number;
  totalUsed: number;
  remaining: number;
  daysLeft: number;
  dailyAverage: number; // remaining / daysLeft
  projectedOutcome: 'on-track' | 'over-budget' | 'under-budget';
  safeToEatToday: number;
}
```

---

## Step 2: Goal Selection Screen

### File: `src/screens/GoalSetupScreen.tsx` (NEW)
**Copilot Prompt:** "Create React Native goal setup screen with mode selection (Cut/Bulk/Maintenance), weekly deficit/surplus input, timeline picker, and integration with useCalorieStore"

**Required Components:**
- Mode selector (4 buttons: Cut/Bulk/Maintenance/Performance)
- Weekly deficit/surplus number input
- Date picker for target date (optional)
- Save button that calls store method
- Basic validation

**Integration Points:**
- Import `useCalorieStore` and call new `setGoalConfiguration()` method
- Use existing `setWeeklyGoal()` for calorie goals
- Navigate to main dashboard on save

**UI Guidelines:**
- Clean, simple form layout
- Color coding: Red for cut, Green for bulk, Blue for maintenance
- Show calculated daily baseline
- Validate safe deficit limits

### File: `src/stores/calorieStore.ts` (EXTEND EXISTING)
**Copilot Prompt:** "Add goal configuration management to existing Zustand store with setGoalConfiguration, getGoalMode, and banking status calculations"

```typescript
// Add to CalorieStore interface:
interface CalorieStore {
  // ... existing properties
  goalConfiguration: GoalConfiguration | null; // NEW
  
  // ... existing methods
  setGoalConfiguration: (config: GoalConfiguration) => void; // NEW
  getGoalMode: () => GoalMode | null; // NEW
  getCalorieBankStatus: () => CalorieBankStatus | null; // NEW
}

// Implementation should:
// - Store goal configuration
// - Update existing goal calculations based on mode
// - Calculate banking status from existing weekly progress
```

---

## Step 3: Weight Tracking

### File: `src/components/WeightTracker.tsx` (NEW)
**Copilot Prompt:** "Create React Native weight input component with trend display, 7-day average calculation, and quick daily entry"

**Required Features:**
- Number input for today's weight
- Display current 7-day average
- Show trend arrow (↑↓→)
- Quick entry button
- Weight history (last 7 entries)

**Calculations Needed:**
- 7-day moving average
- Weekly change percentage
- Trend detection (>0.5lb = up, <-0.5lb = down, else stable)

### File: `src/stores/calorieStore.ts` (EXTEND AGAIN)
**Copilot Prompt:** "Add weight tracking to existing store with weight entries array, addWeightEntry method, and getWeightTrend calculation"

```typescript
// Add to CalorieStore:
interface CalorieStore {
  // ... existing
  weightEntries: WeightEntry[]; // NEW
  
  addWeightEntry: (weight: number) => void; // NEW
  getWeightTrend: () => WeightTrend | null; // NEW
}

// Should calculate:
// - 7-day moving average
// - Trend direction
// - Weekly change rate
```

---

## Step 4: Weekly Banking Dashboard (CORE)

### File: `src/screens/WeeklyBankingScreen.tsx` (NEW)
**Copilot Prompt:** "Create main weekly calorie banking dashboard showing allowance, used, remaining, days left, with prominent visual progress indicators and color coding"

**Required Layout:**
```
┌─────────────────────────────┐
│    WEEKLY CALORIE BANK      │
├─────────────────────────────┤
│ Allowance: 14,000           │
│ Used: 8,500 (60%)           │
│ Remaining: 5,500            │
├─────────────────────────────┤
│ ████████░░░░ 60%            │ <- Progress bar
├─────────────────────────────┤
│ Days Left: 3                │
│ Daily Average: 1,833        │
│ Safe Today: 2,100           │
├─────────────────────────────┤
│ Status: ON TRACK ✅         │
└─────────────────────────────┘
```

**Integration Points:**
- Use `getCalorieBankStatus()` from store
- Show color coding (Green/Yellow/Red based on status)
- Real-time updates when calories are logged

**Visual Requirements:**
- Large, prominent numbers
- Progress bar with color coding
- Clear "Safe to eat today" calculation
- Status indicators with icons

### File: `src/components/CalorieBankCard.tsx` (NEW)
**Copilot Prompt:** "Create reusable banking status card component with progress bar, color coding, and prominent display of key metrics"

**Props:**
```typescript
interface CalorieBankCardProps {
  bankStatus: CalorieBankStatus;
  showDetailed?: boolean;
}
```

---

## Step 5: Simplified Calorie Logging

### File: `src/components/QuickCalorieEntry.tsx` (NEW)
**Copilot Prompt:** "Create simple daily calorie input component with single number field, quick-add buttons, and immediate banking status update"

**Required Features:**
- Single number input for total daily calories
- Quick-add buttons (+200, +500, +1000)
- "Use yesterday's total" button
- Immediate update to banking dashboard
- Simple, fast entry focused on total calories only

**Integration:**
- Call existing `logMeal()` with simplified meal entry
- Update banking status in real-time
- Show remaining calories after entry

### File: `src/screens/DailyEntryScreen.tsx` (NEW)
**Copilot Prompt:** "Create daily check-in screen combining weight entry and calorie logging with banking status display"

**Layout:**
```
┌─────────────────────────────┐
│     TODAY'S CHECK-IN        │
├─────────────────────────────┤
│ Weight: [____] lbs          │
│ Trend: ↓ -0.3lbs this week  │
├─────────────────────────────┤
│ Calories: [____]            │
│ Quick: +200 +500 +1000      │
├─────────────────────────────┤
│ BANKING STATUS              │
│ Safe to eat: 1,847 more     │
│ Week progress: 65%          │
└─────────────────────────────┘
```

---

## Step 6: Navigation Setup

### File: `App.tsx` (MODIFY EXISTING)
**Copilot Prompt:** "Replace existing MVP display with React Navigation setup including goal setup flow and main banking dashboard"

**Navigation Flow:**
1. Check if `goalConfiguration` exists
2. If no → Show `GoalSetupScreen`
3. If yes → Show main `WeeklyBankingScreen`
4. Bottom tabs: Banking | Daily Entry | (Future: Analytics)

### File: `src/navigation/AppNavigator.tsx` (NEW)
**Copilot Prompt:** "Create React Navigation setup with conditional initial route based on goal configuration status"

---

## Implementation Tips for Copilot

### 1. Start Each Component With Clear Intent
```javascript
// Example prompt:
"Create a React Native component for weekly calorie banking dashboard that shows allowance, used calories, remaining balance, and days left with prominent progress visualization"
```

### 2. Reference Existing Architecture
```javascript
// Always mention:
"Use existing useCalorieStore hook and integrate with getCurrentWeekProgress() method"
```

### 3. Specify Exact Props/Interfaces
```javascript
// Be explicit:
"Component should accept CalorieBankStatus prop and display weeklyAllowance, totalUsed, remaining, and daysLeft properties"
```

### 4. Request Specific Styling
```javascript
// UI guidance:
"Style with card layout, color coding (green for on-track, yellow for caution, red for over-budget), and prominent number displays"
```

### 5. Integration Points
```javascript
// Always specify:
"Import useCalorieStore, call getCalorieBankStatus(), and update when store state changes"
```

## Testing Each Component

After Copilot generates each component:

1. **Types**: Check TypeScript compilation
2. **Store Integration**: Verify store methods work
3. **UI Display**: Test with mock data
4. **Real Data**: Test with actual store data
5. **Navigation**: Ensure screen transitions work

## Phase 1 Success Criteria

✅ Goal setup saves configuration  
✅ Weight tracking shows 7-day average  
✅ Banking dashboard displays real-time status  
✅ Calorie entry updates banking immediately  
✅ Navigation flows between screens  
✅ All TypeScript types compile  
✅ Store integration works end-to-end  

Once Phase 1 is complete, you'll have a fully functional calorie banking app ready for your cutting needs!