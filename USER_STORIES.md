# Weekly Calorie Tracker - User Stories

## User Personas

### Primary: Greg (Performance Cutter)
- 8 months into cut, close to goal but needs precision for half-marathon PB
- Struggles with binge-restrict cycle when cutting gets tough
- Needs carb cycling and periodization for race preparation
- Values mathematical proof over emotional eating decisions

### Secondary: Sarah (Flexible Dieter)
- Wants to lose weight but enjoys social eating
- Needs weekly flexibility for weekend events
- Prone to "all-or-nothing" thinking after overeating

### Tertiary: Mike (Precision Bulker)
- Wants 300cal surplus, not 1000cal "dirty bulk"
- Trains consistently, needs lean mass gains
- Values weekly banking for social flexibility

## Epic 0: Goal Setup & Baseline Establishment

### Story 0.1: Goal Type Selection ✅ COMPLETED
**As a user, I want to select my primary goal so the app adapts to my needs**

**Acceptance Criteria:**
- [x] Choose between Cut/Bulk/Maintenance/Performance modes
- [x] Set target timeline (race date, event, open-ended)
- [x] Configure weekly deficit/surplus targets
- [x] Enable/disable advanced features based on goal type

**Implementation Notes:**
- Extend `WeeklyCalorieGoal` type with goal mode
- Create goal setup wizard
- Different UI priorities per mode

### Story 0.2: Garmin Integration Setup
**As a performance-focused user, I want to import my historical data to establish accurate baselines**

**Acceptance Criteria:**
- [x] Connect to Garmin Connect API
- [x] Import 4-8 weeks of calories out data
- [x] AI analysis to suggest baseline TDEE (accounting for device inaccuracy)
- [ ] Manual override option for calculated values
- [x] Set up automatic daily sync

**Implementation Notes:**
- Create `GarminService` in `src/services/`
- Add `HistoricalData` type
- Implement AI baseline calculation algorithm

### Story 0.3: Training Periodization Setup
**As an athlete, I want to set up training phases that automatically adjust my calorie targets**

**Acceptance Criteria:**
- [ ] Define training phases (base/build/peak/taper/recovery)
- [ ] Set weekly mileage progression
- [ ] Configure deficit reduction timeline before race
- [ ] Automatic calorie increases with training load
- [ ] Carb cycling based on training days

**Implementation Notes:**
- Add `TrainingPhase` and `PeriodizationPlan` types
- Extend redistribution algorithm
- Create phase transition logic

## Epic 1: Daily Check-ins & Data Entry

### Story 1.1: Morning Weight Check-in ✅ COMPLETED
**As a user, I want to log my daily weight and get trend analysis**

**Acceptance Criteria:**
- [x] Quick weight entry with date/time
- [x] 7-day moving average display
- [x] Trend arrows (up/down/stable)
- [x] Weight spike detection and alerts
- [x] Integration with weekly calorie adjustments

**Implementation Notes:**
- Add `WeightEntry` type
- Create weight trend analysis service
- Extend store with weight management

### Story 1.2: Active Calories Sync ⚠️ PARTIALLY COMPLETE
**As a user, I want my workout calories automatically pulled from my watch for live banking**

**Acceptance Criteria:**
- [x] Real-time sync of today's active calories (Garmin implemented)
- [ ] Real-time sync of today's active calories (Apple HealthKit) **MVP CRITICAL**
- [ ] Real-time sync of today's active calories (Samsung Health) **MVP CRITICAL**
- [ ] Manual input option as fallback
- [ ] Workout type detection (rest/1 activity/2+ activities)
- [ ] Live calorie adjustment in banking system based on actual vs planned activity

**Implementation Notes:**
- ✅ Garmin live sync implemented via `GarminProxyService`
- ❌ Apple HealthKit integration needed for MVP
- ❌ Samsung Health integration needed for MVP
- Add workout categorization logic
- Integrate with live banking system for real-time adjustments

### Story 1.3: Simplified Calorie Logging ✅ COMPLETED
**As a user, I want to quickly input my daily calories consumed**

**Acceptance Criteria:**
- [x] Single input field for total daily calories
- [x] Quick-add common meal values
- [x] Previous day's total as starting suggestion
- [x] Integration with weekly banking calculations
- [x] Optional meal breakdown for detailed users

**Implementation Notes:**
- Simplified version of existing meal logging
- Keep detailed `MealEntry` option for power users
- Quick-entry UI component

## Epic 2: Psychological Support & Recovery

### Story 2.1: Binge Recovery Calculator ✅ COMPLETED
**As a user who overate, I want to see exactly how to get back on track without panic**

**Acceptance Criteria:**
- [x] "Overeating Recovery" mode triggered by high calorie day
- [x] Calculate exact impact on weekly/monthly goals
- [x] Generate specific recovery plan (3-7 days)
- [x] Show "damage is X% of monthly goal" perspective
- [x] Gentle, mathematical messaging vs emotional language

**Implementation Notes:**
- Add `RecoveryPlan` type
- Create psychological messaging service
- Recovery plan calculation algorithms

### Story 2.2: Damage Control Dashboard ✅ COMPLETED
**As a user, I want to see real impact vs perceived impact of overeating**

**Acceptance Criteria:**
- [x] "Real vs Perceived Impact" comparison
- [x] Weekly/monthly goal progress visualization
- [x] Positive reframing messages
- [x] Success stories/testimonials for motivation
- [x] "Days to get back to original timeline" counter

**Implementation Notes:**
- Create impact visualization components
- Add motivational messaging system
- Progress reframing algorithms

### Story 2.3: Sustainable Deficit Warnings
**As a user, I want warnings before I enter dangerous restriction territory**

**Acceptance Criteria:**
- [ ] Alert when deficit exceeds safe levels
- [ ] Suggest minimum calorie floors
- [ ] Track restriction vs binge patterns
- [ ] Recommend diet breaks/refeeds
- [ ] Educational content about sustainable cutting

**Implementation Notes:**
- Add deficit safety checks
- Pattern recognition for restriction cycles
- Educational content management

## Epic 3: AI Coaching & Smart Recommendations

### Story 3.1: Intelligent Course Corrections
**As a user, I want specific, actionable advice when I'm off track**

**Acceptance Criteria:**
- [ ] Detect trends requiring intervention
- [ ] Suggest micro-adjustments ("500 steps for 3 days")
- [ ] Prioritize least disruptive changes
- [ ] Track success of past recommendations
- [ ] Escalate to bigger changes if needed

**Implementation Notes:**
- Create `AICoach` service
- Recommendation engine algorithms
- Success tracking for ML improvement

### Story 3.2: Training Load vs Nutrition Balance
**As an athlete, I want nutrition recommendations based on my actual training load**

**Acceptance Criteria:**
- [ ] Analyze training stress vs calorie intake
- [ ] Suggest carb timing around workouts
- [ ] Detect underfueling for performance
- [ ] Recovery nutrition recommendations
- [ ] Race week nutrition protocol

**Implementation Notes:**
- Training load analysis algorithms
- Performance nutrition protocols
- Integration with Garmin training metrics

### Story 3.3: Plateau Breaking Strategies
**As a long-term cutter, I want science-based strategies when progress stalls**

**Acceptance Criteria:**
- [ ] Detect weight loss plateaus
- [ ] Suggest diet breaks, refeeds, or deficit adjustments
- [ ] Metabolic adaptation indicators
- [ ] Customized plateau-breaking protocols
- [ ] Progress tracking during interventions

## Epic 4: Advanced Calorie Banking UI

### Story 4.1: Weekly Banking Dashboard ✅ COMPLETED
**As a user, I want a clear view of my weekly calorie bank status**

**Acceptance Criteria:**
- [x] Weekly allowance prominently displayed
- [x] Daily usage with running total
- [x] Remaining balance with days left
- [x] Visual progress bar with color coding
- [x] Projected weekly outcome

**Implementation Notes:**
- Enhanced version of existing weekly dashboard
- Banking-focused UI design
- Real-time balance updates

### Story 4.2: Smart Spending Recommendations
**As a user, I want suggestions on how to "spend" my remaining calories**

**Acceptance Criteria:**
- [ ] Suggest calorie distribution across remaining days
- [ ] Account for planned social events
- [ ] Training day calorie priorities
- [ ] "Safe to eat X more today" calculations
- [ ] Weekend banking strategies

**Implementation Notes:**
- Extend existing redistribution logic
- Event planning integration
- Smart spending algorithms

## Epic 5: Performance Tracking & Analytics

### Story 5.1: Cut Performance Analytics
**As a long-term cutter, I want detailed analysis of my progress patterns**

**Acceptance Criteria:**
- [ ] Weekly/monthly progress charts
- [ ] Adherence vs results correlation
- [ ] Training performance impact analysis
- [ ] Body composition trend estimates
- [ ] Metabolic adaptation indicators

### Story 5.2: Race Preparation Timeline
**As an athlete, I want a clear timeline for race preparation nutrition**

**Acceptance Criteria:**
- [ ] Countdown to race with nutrition phases
- [ ] Weekly mileage vs calorie progression
- [ ] Carb loading protocol timeline
- [ ] Performance readiness indicators
- [ ] Last-minute adjustment recommendations

## Epic 1: Core Meal Logging (MVP) ✅ COMPLETED

### Story 1.1: Log a Meal ✅ COMPLETED
**As a user, I want to quickly log meals so I can track my daily intake**

**Acceptance Criteria:**
- [x] Display meal entry form with name, calories, category fields
- [x] Categories: breakfast, lunch, dinner, snack, pre-workout, post-workout
- [x] Save meal using `logMeal()` from calorieStore
- [x] Show updated daily calories consumed
- [x] Display remaining calories for today using `getRemainingCaloriesForToday()`

**Implementation Notes:**
- Create `MealLoggingScreen` in `src/screens/`
- Use `MealEntry` type from `src/types/CalorieTypes.ts`
- Integrate with existing Zustand store methods

### Story 1.2: View Today's Meals ✅ COMPLETED
**As a user, I want to see all meals I've logged today**

**Acceptance Criteria:**
- [x] List all today's meals with name, calories, time
- [x] Show total calories consumed vs target
- [x] Allow editing/deleting meals using store methods
- [x] Display remaining calories with color coding (green/yellow/red)

**Implementation Notes:**
- Create `TodayScreen` component
- Use `getTodaysData()` from store
- Implement edit/delete with `editMeal()` and `deleteMeal()`

### Story 1.3: Weekly Dashboard ✅ COMPLETED
**As a user, I want to see my weekly progress and daily targets**

**Acceptance Criteria:**
- [x] Show 7-day calendar view with daily consumed/target
- [x] Display weekly totals and remaining calories
- [x] Show redistributed daily targets using `getCalorieRedistribution()`
- [x] Visual indicators for on-track/over-budget/under-budget status

**Implementation Notes:**
- Create `WeeklyDashboard` component
- Use `getCurrentWeekProgress()` for data
- Implement calendar UI with `react-native-chart-kit`

## Epic 2: Goal Management

### Story 2.1: Set Weekly Goals ✅ COMPLETED
**As a user, I want to set my weekly calorie and deficit goals**

**Acceptance Criteria:**
- [x] Input form for total weekly calories and deficit target
- [x] Calculate and show daily baseline (totalTarget / 7)
- [x] Save using `setWeeklyGoal()` from store
- [x] Validate minimum safe calories (1200/day baseline)

### Story 2.2: Adjust Goals Mid-Week ✅ COMPLETED
**As a user, I want to modify my goals if my plans change**

**Acceptance Criteria:**
- [x] Edit current week's goal
- [x] Recalculate redistribution automatically
- [x] Show impact on remaining daily targets
- [x] Warn if changes create unsafe calorie levels

## Epic 3: Smart Redistribution Features

### Story 3.1: Training Day Integration
**As a user, I want higher calories on training days**

**Acceptance Criteria:**
- [ ] Mark days as training/rest days
- [ ] Input planned workout intensity
- [ ] Automatically increase calories for high-intensity days
- [ ] Redistribute from rest days to maintain weekly total

**Implementation Notes:**
- Extend `ActivityData` type usage
- Use existing `adjustForPlannedActivity()` logic
- Create training calendar interface

### Story 3.2: Real-time Redistribution ✅ COMPLETED
**As a user, I want my daily targets to update after each meal**

**Acceptance Criteria:**
- [x] Recalculate remaining daily targets after logging meals
- [x] Show "adjustment reason" (on-track/over-budget/under-budget)
- [x] Update all future days' targets automatically
- [x] Maintain weekly goal consistency

**Implementation Notes:**
- Already implemented in store logic
- UI should reflect store's computed values
- Use `CalorieRedistribution` type for display

## Epic 4: Data Visualization

### Story 4.1: Weekly Progress Chart
**As a user, I want to see my progress visually**

**Acceptance Criteria:**
- [ ] Bar chart showing daily consumed vs target
- [ ] Line chart for weekly trend
- [ ] Color coding for over/under target days
- [ ] Export/share functionality

**Implementation Notes:**
- Use `react-native-chart-kit`
- Data from `getCurrentWeekProgress()`

### Story 4.2: Calorie Banking Visualization
**As a user, I want to see my "calorie bank" balance**

**Acceptance Criteria:**
- [ ] Visual representation of weekly deficit/surplus
- [ ] Daily contribution to weekly goal
- [ ] Projected weekly outcome
- [ ] Historical week comparison

## Epic 5: Health App Integration

### Story 5.1: Sync Burned Calories
**As a user, I want my workouts to automatically update my targets**

**Acceptance Criteria:**
- [ ] Connect to Apple Health/Google Fit
- [ ] Sync daily burned calories
- [ ] Update targets based on actual activity
- [ ] Handle sync errors gracefully

**Implementation Notes:**
- Create services in `src/services/`
- Use `react-native-health` and `react-native-health-connect`
- Call `updateBurnedCalories()` from store

## Epic 6: Notifications & Reminders

### Story 6.1: Meal Reminders
**As a user, I want reminders to log meals**

**Acceptance Criteria:**
- [ ] Customizable meal time notifications
- [ ] Smart reminders based on usual eating patterns
- [ ] Quick-log from notification
- [ ] Snooze/dismiss options

**Implementation Notes:**
- Use `react-native-push-notification`
- Create notification service

## Development Priority

### Phase 1 (Essential MVP - 3-4 weeks) ✅ **COMPLETED Aug 11, 2025**
**Core Banking + Basic Logging**
- Story 4.1 (Weekly Banking Dashboard) - ✅ *Primary value prop*
- Story 1.3 (Simplified Calorie Logging) - ✅ *Quick daily entry*
- Story 1.1 (Morning Weight Check-in) - ✅ *Essential for cutting*
- Story 0.1 (Goal Type Selection) - ✅ *Cut/Bulk/Maintenance modes*

### Phase 2 (Psychological Support - 2-3 weeks) ✅ **COMPLETED Aug 11, 2025**
**Mental Health Features** 
- Story 2.1 (Binge Recovery Calculator) - ✅ *Massive differentiator*
- Story 2.2 (Damage Control Dashboard) - ✅ *Prevent restrict-binge cycle*
- Story 2.3 (Sustainable Deficit Warnings) - *Safety net*

### Phase 3 (Performance Features - 3-4 weeks)
**Athletic Integration**
- Story 0.2 (Garmin Integration Setup) - *Your specific use case*
- Story 1.2 (Active Calories Sync) - *Training load awareness*
- Story 0.3 (Training Periodization Setup) - *Race preparation*

### Phase 4 (AI Coaching - 4-5 weeks)
**Smart Recommendations**
- Story 3.1 (Intelligent Course Corrections) - *"500 steps for 3 days"*
- Story 3.2 (Training Load vs Nutrition Balance) - *Performance optimization*
- Story 3.3 (Plateau Breaking Strategies) - *Advanced cutting support*

### Phase 5 (Advanced Analytics - 2-3 weeks)
**Deep Insights**
- Story 5.1 (Cut Performance Analytics) - *Long-term tracking*
- Story 5.2 (Race Preparation Timeline) - *Athletic periodization*

## Copilot Development Tips

Each story is structured with:
- Clear UI requirements
- Existing store integration points
- Specific type references
- Implementation file locations

Start with Phase 1 stories - they leverage your existing business logic and require primarily UI development.