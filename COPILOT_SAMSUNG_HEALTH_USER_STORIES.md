# Samsung Health Integration - User Stories for Copilot

## Epic: Unofficial Samsung Health Integration Using Web API and Mobile Health Connect

### User Story 1: Samsung Health Authentication
**As a Samsung device user, I want to connect my Samsung Health account so that my fitness data can enhance my nutrition tracking.**

**Implementation Requirements:**
- [ ] Create `SamsungHealthService.ts` with Samsung Account authentication
- [ ] Handle Samsung OAuth 2.0 flow for Health data access
- [ ] Implement session management and token refresh
- [ ] Add connection testing and validation
- [ ] Store encrypted credentials securely

**Technical Details:**
```typescript
interface SamsungHealthCredentials {
  accessToken: string;
  refreshToken: string;
  userId: string;
  expiresAt: Date;
}

class SamsungHealthService {
  async authenticate(): Promise<boolean>
  async isConnected(): Promise<boolean>
  async disconnect(): Promise<void>
  async refreshTokens(): Promise<void>
}
```

**Authentication Endpoints:**
- Samsung Account OAuth: `https://account.samsung.com/mobile/account/check.do`
- Health API Base: `https://shealthapi.samsung.com/v1.1/`
- Scope required: `read:health:activity read:health:nutrition read:health:sleep`

---

### User Story 2: Samsung Health Activity Sync
**As a Samsung Galaxy user, I want my Samsung Health workouts and activities to automatically sync with my calorie tracking.**

**Implementation Requirements:**
- [ ] Fetch workout sessions from Samsung Health API
- [ ] Extract: exercise type, duration, calories, heart rate zones
- [ ] Transform Samsung exercise types to app categories
- [ ] Integrate with existing `CalorieStore.logWorkout()` method
- [ ] Handle duplicate activity prevention using Samsung activity IDs

**Technical Details:**
```typescript
interface SamsungHealthActivity {
  uuid: string;
  exercise_type: number; // Samsung's exercise type codes
  start_time: string; // ISO string
  end_time: string;
  duration: number; // milliseconds
  calorie: number;
  distance?: number; // meters
  step_count?: number;
  heart_rate?: {
    average: number;
    max: number;
    min: number;
  };
}

// API Endpoint: /workouts?start_time=YYYY-MM-DD&end_time=YYYY-MM-DD
```

**Samsung Exercise Type Mapping:**
```typescript
const SAMSUNG_EXERCISE_MAPPING = {
  1001: 'running',      // Running
  1002: 'walking',      // Walking  
  11007: 'cycling',     // Cycling
  14001: 'swimming',    // Swimming
  13001: 'strength',    // Weight training
  12001: 'yoga',        // Yoga
  10001: 'other',       // General fitness
  // ... 50+ Samsung exercise types
};
```

---

### User Story 3: Samsung Health Daily Metrics
**As a health-conscious user, I want my Samsung Health daily metrics (steps, calories, sleep) to enhance my AI nutrition recommendations.**

**Implementation Requirements:**
- [ ] Fetch daily step counts and active calories
- [ ] Extract sleep data (duration, quality, deep sleep)
- [ ] Get heart rate variability and stress levels
- [ ] Integrate with `HistoricalDataAnalyzer` for better TDEE calculations
- [ ] Update AI recommendations based on activity levels

**Technical Details:**
```typescript
interface SamsungHealthDailyMetrics {
  date: string; // YYYY-MM-DD
  step_count: number;
  calorie: number;
  active_calorie: number;
  distance: number; // meters
  sleep_data?: {
    start_time: string;
    end_time: string;
    duration: number; // minutes
    efficiency: number; // percentage
    deep_sleep: number; // minutes
    light_sleep: number; // minutes
    rem_sleep: number; // minutes
    awake_time: number; // minutes
  };
  heart_rate?: {
    resting: number;
    average: number;
    variability?: number;
  };
  stress_level?: number; // 0-100
}

// API Endpoints:
// Steps: /steps/daily_totals?start_time=YYYY-MM-DD&end_time=YYYY-MM-DD
// Sleep: /sleep?start_time=YYYY-MM-DD&end_time=YYYY-MM-DD
// Heart Rate: /heart_rate?start_time=YYYY-MM-DD&end_time=YYYY-MM-DD
```

---

### User Story 4: Samsung Health Body Composition ✅
**As someone tracking body composition, I want my Samsung Health scale data and body measurements to sync automatically.**

**Implementation Requirements:**
- [x] Fetch weight entries from Samsung Health
- [x] Extract body fat percentage, muscle mass, BMI if available
- [x] Sync with existing `CalorieStore.addWeightEntry()` method
- [x] Update weight trend analysis with Samsung data

**Technical Details:**
```typescript
interface SamsungHealthBodyComposition {
  uuid: string;
  create_time: string;
  weight: number; // kg
  body_fat_percentage?: number;
  muscle_mass?: number; // kg
  bone_mass?: number; // kg
  body_water?: number; // percentage
  basal_metabolic_rate?: number; // kcal
  visceral_fat_level?: number;
}

// API Endpoint: /body_composition?start_time=YYYY-MM-DD&end_time=YYYY-MM-DD
```

---

### User Story 5: Samsung Health Setup Screen ✅
**As a new user, I want an easy setup flow to connect Samsung Health and choose what data to sync.**

**Implementation Requirements:**
- [x] Create `SamsungHealthEnhancedSetupScreen.tsx` with multi-step wizard
- [x] Add data permission toggles (activities, sleep, weight, heart rate)
- [x] Show connection status and sync preferences
- [x] Provide Samsung Health app installation guidance
- [x] Handle Samsung account login and OAuth flow
- [x] Platform detection (Android only)
- [x] Integration with existing HealthDeviceSetup component
- [x] Navigation setup and routing

**UI Components:**
```typescript
// SamsungHealthEnhancedSetupScreen.tsx
- Multi-step wizard (check → permissions → preferences → complete)
- Samsung Health logo and branding
- "Connect to Samsung Health" OAuth button
- Data type selection checkboxes with descriptions
- Sync frequency preferences (manual, daily, twice-daily)
- Privacy information and data usage explanation
- "Test Connection" with status feedback
- Progress indicator and step navigation
- Platform compatibility checking
```

---

### User Story 6: Enhanced AI with Samsung Health Data
**As a Samsung user, I want AI recommendations that consider my Samsung Health activity patterns and recovery metrics.**

**Implementation Requirements:**
- [ ] Enhance `PerplexityService` prompts with Samsung Health data
- [ ] Include daily activity levels, sleep quality, stress indicators
- [ ] Adjust calorie recommendations based on step count and active calories
- [ ] Provide recovery-based nutrition timing advice

**Enhanced AI Context:**
```typescript
interface SamsungHealthEnhancedContext {
  recentActivities: SamsungHealthActivity[];
  dailyStepsTrend: number[];
  sleepQualityTrend: number[];
  stressLevelTrend: number[];
  heartRateVariability: number[];
  activeCaloriesBurned: number;
}
```

**AI Prompt Enhancement:**
```
SAMSUNG HEALTH DATA INTEGRATION:
- Daily Activity: {stepCount} steps, {activeCalories} active kcal
- Sleep Quality: {sleepEfficiency}% efficiency, {deepSleep}min deep sleep
- Recovery Status: Stress level {stressLevel}/100, HRV {hrv}ms
- Weekly Pattern: Avg {avgSteps} steps/day, {workoutFrequency} workouts/week

RECOMMENDATIONS BASED ON SAMSUNG DATA:
1. Low step count (<8000): Suggest activity snacks and movement breaks
2. Poor sleep (<70% efficiency): Prioritize recovery nutrition and magnesium
3. High stress (>70): Recommend stress-reducing foods and meal timing
4. Irregular activity: Suggest consistent daily movement goals
```

---

### User Story 7: Background Sync Management
**As a daily user, I want automatic Samsung Health data syncing without manual intervention.**

**Implementation Requirements:**
- [ ] Create `SamsungHealthSyncScheduler.ts` for background operations
- [ ] Implement daily automatic sync (configurable)
- [ ] Add manual "Sync Now" functionality  
- [ ] Handle offline scenarios and retry logic
- [ ] Show sync status and last update time

**Technical Details:**
```typescript
interface SamsungHealthSyncResult {
  success: boolean;
  activitiesCount: number;
  newWorkouts: SamsungHealthActivity[];
  dailyMetrics?: SamsungHealthDailyMetrics;
  bodyComposition?: SamsungHealthBodyComposition[];
  error?: string;
  lastSyncTime: Date;
}
```

---

### User Story 8: Samsung Health Data Dashboard
**As a data-driven user, I want to see my Samsung Health metrics integrated with nutrition data in a unified view.**

**Implementation Requirements:**
- [ ] Create `SamsungHealthDataViewer.tsx` component
- [ ] Display recent activities with calorie integration
- [ ] Show sleep and activity trends
- [ ] Correlate step count with daily calorie targets
- [ ] Add export functionality for combined data

**Dashboard Sections:**
```typescript
// Activity Overview
- Last 7 days step count trend
- Weekly workout summary from Samsung Health
- Active vs total calories comparison

// Health Metrics
- Sleep efficiency trend (7-day chart)
- Stress level patterns
- Heart rate zones during activities

// Nutrition Correlations
- Step count vs calorie consumption
- Sleep quality vs next-day appetite/choices
- Activity level vs macro needs
```

---

## Implementation Architecture

### File Structure
```
src/services/
├── SamsungHealthService.ts        # Main API client
├── SamsungHealthAuthManager.ts    # OAuth and session management
├── SamsungHealthDataProcessor.ts  # Data transformation
└── SamsungHealthSyncScheduler.ts  # Background sync

src/screens/
├── SamsungHealthSetupScreen.tsx   # Initial connection
└── SamsungHealthDataViewer.tsx    # Data dashboard

src/components/
├── SamsungHealthStatus.tsx        # Connection indicator
└── SamsungHealthSyncButton.tsx    # Manual sync trigger

src/types/
└── SamsungHealthTypes.ts          # Type definitions
```

### Integration Points
- Enhance `CalorieStore` with Samsung Health methods
- Update `HistoricalDataAnalyzer` with step and sleep patterns
- Modify `PerplexityService` for Samsung Health context
- Add Samsung Health section to Settings screen

### Data Synchronization Strategy
1. **Initial Sync**: Last 30 days of activities and metrics
2. **Daily Sync**: Previous day's data every morning
3. **Real-time**: Current day updates every 4 hours
4. **Incremental**: Only new/changed data to minimize API calls

### Privacy and Security
- OAuth 2.0 with proper scopes
- Encrypted local storage for tokens
- Clear data deletion on disconnect
- Respect Samsung Health's rate limits
- GDPR compliance for EU users

## Success Metrics
- Authentication success rate > 95%
- Data sync reliability > 98%
- User adoption of Samsung integration > 50%
- Improved calorie recommendation accuracy
- Reduced manual activity logging by 75%

## Testing Requirements
- Mock Samsung Health API responses
- Test with various Samsung device models
- Validate data transformation accuracy  
- Test offline/online sync scenarios
- Performance testing with large datasets

**Estimated Implementation Time: 4-6 weeks**

This comprehensive Samsung Health integration will provide Android users (especially Samsung Galaxy users) with seamless fitness data integration, matching the Garmin functionality for a broader user base.