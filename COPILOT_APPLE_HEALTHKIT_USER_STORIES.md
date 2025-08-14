# Apple HealthKit Integration - User Stories for Copilot

## Epic: Native Apple HealthKit Integration for iOS Devices

### User Story 1: HealthKit Permission and Setup
**As an iPhone/Apple Watch user, I want to connect my Health app data so that my fitness and nutrition tracking is automatically enhanced.**

**Implementation Requirements:**
- [ ] Create `AppleHealthKitService.ts` with HealthKit framework integration
- [ ] Implement proper permission requests for all health data types
- [ ] Handle user permission grants/denials gracefully
- [ ] Add HealthKit availability checking (iOS only)
- [ ] Create permission management UI

**Technical Details:**
```typescript
import HealthKit from 'react-native-health';

interface HealthKitPermissions {
  read: string[];
  write: string[];
}

const REQUIRED_PERMISSIONS: HealthKitPermissions = {
  read: [
    'Steps',
    'ActiveEnergyBurned',
    'BasalEnergyBurned', 
    'Workout',
    'SleepAnalysis',
    'HeartRate',
    'BodyMass',
    'BodyFatPercentage',
    'LeanBodyMass',
    'RestingHeartRate',
    'HeartRateVariabilitySDNN'
  ],
  write: [
    'Workout',
    'ActiveEnergyBurned',
    'DietaryEnergyConsumed'
  ]
};

class AppleHealthKitService {
  async requestPermissions(): Promise<boolean>
  async isAvailable(): Promise<boolean>
  async getPermissionStatus(type: string): Promise<'authorized' | 'denied' | 'notDetermined'>
}
```

**Installation Requirements:**
```bash
npm install react-native-health
cd ios && pod install
```

---

### User Story 2: Apple Watch Workout Sync
**As an Apple Watch user, I want my workouts to automatically sync from the Health app so that my calorie burn is accurate.**

**Implementation Requirements:**
- [ ] Fetch workout sessions from HealthKit
- [ ] Extract: workout type, duration, calories, heart rate data
- [ ] Transform Apple workout types to app categories
- [ ] Integrate with existing `CalorieStore.logWorkout()` method
- [ ] Handle duplicate prevention using HealthKit UUIDs

**Technical Details:**
```typescript
interface AppleHealthKitWorkout {
  uuid: string;
  activityType: string; // HKWorkoutActivityType
  startDate: Date;
  endDate: Date;
  duration: number; // minutes
  totalEnergyBurned?: number; // kcal
  totalDistance?: number; // meters
  heartRateData?: {
    average: number;
    maximum: number;
    samples: { value: number; date: Date }[];
  };
  metadata?: {
    indoor?: boolean;
    weather?: string;
  };
}

// HealthKit Workout Type Mapping
const APPLE_WORKOUT_MAPPING = {
  'HKWorkoutActivityTypeRunning': 'running',
  'HKWorkoutActivityTypeCycling': 'cycling',
  'HKWorkoutActivityTypeSwimming': 'swimming',
  'HKWorkoutActivityTypeFunctionalStrengthTraining': 'strength',
  'HKWorkoutActivityTypeYoga': 'yoga',
  'HKWorkoutActivityTypeHighIntensityIntervalTraining': 'hiit',
  'HKWorkoutActivityTypeWalking': 'walking',
  'HKWorkoutActivityTypeElliptical': 'cardio',
  // ... 70+ Apple workout types
};
```

**Implementation:**
```typescript
async getWorkouts(startDate: Date, endDate: Date): Promise<AppleHealthKitWorkout[]> {
  return new Promise((resolve, reject) => {
    HealthKit.getWorkouts(
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
      },
      (error, results) => {
        if (error) reject(error);
        else resolve(results.map(this.transformWorkout));
      }
    );
  });
}
```

---

### User Story 3: Daily Health Metrics from iPhone/Apple Watch
**As an Apple ecosystem user, I want my daily metrics (steps, active calories, sleep) to enhance my nutrition recommendations.**

**Implementation Requirements:**
- [ ] Fetch daily step counts and active energy burned
- [ ] Extract sleep analysis data from Health app
- [ ] Get heart rate variability and resting heart rate
- [ ] Integrate with `HistoricalDataAnalyzer` for TDEE improvements
- [ ] Update AI recommendations based on Apple Health patterns

**Technical Details:**
```typescript
interface AppleHealthDailyMetrics {
  date: string; // YYYY-MM-DD
  steps: number;
  activeEnergyBurned: number; // kcal
  basalEnergyBurned: number; // kcal
  distanceWalkingRunning: number; // meters
  sleepAnalysis?: {
    inBedStartTime: Date;
    inBedEndTime: Date;
    sleepStartTime: Date;
    sleepEndTime: Date;
    timeInBed: number; // minutes
    timeAsleep: number; // minutes
    sleepEfficiency: number; // percentage
    sleepStages?: {
      deep: number; // minutes
      core: number; // minutes  
      rem: number; // minutes
      awake: number; // minutes
    };
  };
  heartRateData?: {
    resting: number; // bpm
    average: number; // bpm
    variability: number; // SDNN in ms
  };
  standHours?: number; // Apple Watch stand goals
}

// HealthKit Sample Queries
const DAILY_METRICS_QUERIES = {
  steps: 'HKQuantityTypeIdentifierStepCount',
  activeCalories: 'HKQuantityTypeIdentifierActiveEnergyBurned',
  basalCalories: 'HKQuantityTypeIdentifierBasalEnergyBurned',
  sleep: 'HKCategoryTypeIdentifierSleepAnalysis',
  heartRate: 'HKQuantityTypeIdentifierHeartRate',
  restingHeartRate: 'HKQuantityTypeIdentifierRestingHeartRate',
  hrv: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN'
};
```

---

### User Story 4: Body Composition and Weight Tracking ✅
**As someone tracking body composition, I want my Health app weight and body measurements to sync automatically.**

**Implementation Requirements:**
- [x] Fetch weight entries from HealthKit
- [x] Extract body fat percentage and lean body mass if available
- [x] Sync with existing `CalorieStore.addWeightEntry()` method
- [x] Update weight trend analysis with Apple Health data
- [x] Support smart scale integrations (Withings, QardioBase, etc.)
- [x] Create AppleBodyComposition component for UI
- [x] Integrate into setup flow and dashboard

**Technical Details:**
```typescript
interface AppleHealthBodyComposition {
  uuid: string;
  date: Date;
  bodyMass: number; // kg
  bodyFatPercentage?: number;
  leanBodyMass?: number; // kg
  bodyMassIndex?: number;
  source: string; // Which app/device recorded this
  metadata?: {
    device?: string;
    scale?: string;
  };
}

// HealthKit Body Measurement Types
const BODY_METRICS = {
  weight: 'HKQuantityTypeIdentifierBodyMass',
  bodyFat: 'HKQuantityTypeIdentifierBodyFatPercentage', 
  leanMass: 'HKQuantityTypeIdentifierLeanBodyMass',
  bmi: 'HKQuantityTypeIdentifierBodyMassIndex'
};
```

---

### User Story 5: HealthKit Setup Screen for iOS ✅
**As an iOS user, I want an intuitive setup flow to connect Health app and choose what data to share.**

**Implementation Requirements:**
- [x] Create `AppleHealthKitSetupScreen.tsx` with native permissions
- [x] Add data type selection with clear explanations
- [x] Show Health app integration benefits
- [x] Handle iOS-only availability (hide on Android)
- [x] Provide permission troubleshooting guidance
- [x] Integrate with existing HealthDeviceSetup component

**UI Components:**
```typescript
// AppleHealthKitSetupScreen.tsx
const AppleHealthKitSetupScreen = () => {
  return (
    <SafeAreaView>
      {/* iOS Only Check */}
      <HealthKitAvailabilityCheck />
      
      {/* Permission Sections */}
      <PermissionSection
        title="Workouts & Activity"
        description="Import Apple Watch workouts and daily activity"
        types={['Workout', 'ActiveEnergyBurned', 'Steps']}
        icon="🏃‍♂️"
      />
      
      <PermissionSection
        title="Sleep & Recovery"
        description="Optimize nutrition based on sleep quality"
        types={['SleepAnalysis', 'HeartRateVariability']}
        icon="😴"
      />
      
      <PermissionSection
        title="Body Measurements"
        description="Track weight and body composition changes"
        types={['BodyMass', 'BodyFatPercentage']}
        icon="⚖️"
      />
      
      {/* Setup Actions */}
      <ConnectButton onPress={requestAllPermissions} />
      <TestConnectionButton />
    </SafeAreaView>
  );
};
```

---

### User Story 6: Enhanced AI with Apple Health Context
**As an Apple user, I want AI recommendations that leverage my comprehensive Health app data.**

**Implementation Requirements:**
- [ ] Enhance `PerplexityService` with rich Apple Health context
- [ ] Include workout intensity zones and recovery metrics
- [ ] Factor in sleep stages and HRV for recovery recommendations
- [ ] Adjust nutrition timing based on Apple Watch activity patterns
- [ ] Provide menstrual cycle considerations (if available)

**Enhanced AI Context:**
```typescript
interface AppleHealthEnhancedContext {
  recentWorkouts: AppleHealthKitWorkout[];
  weeklyActivitySummary: {
    activeCalories: number;
    steps: number;
    workoutMinutes: number;
    standHours: number;
  };
  sleepTrends: {
    averageDuration: number;
    efficiency: number;
    deepSleepPercentage: number;
  };
  recoveryMetrics: {
    restingHeartRate: number;
    heartRateVariability: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  todaysActivity: {
    stepsSoFar: number;
    activeCalories: number;
    standHours: number;
    workoutPlanned?: AppleHealthKitWorkout;
  };
}
```

**AI Prompt Enhancement:**
```
APPLE HEALTH DATA INTEGRATION:
- Today's Activity: {stepsSoFar} steps, {activeCalories} active kcal, {standHours}/12 stand hours
- Recovery Status: RHR {restingHeartRate}bpm, HRV {hrv}ms ({hrvTrend})
- Sleep Last Night: {sleepDuration}h ({sleepEfficiency}% efficiency, {deepSleep}% deep)
- Weekly Pattern: {avgWorkouts} workouts/week, {avgActiveCalories} kcal/day

APPLE-SPECIFIC RECOMMENDATIONS:
1. Pre-workout nutrition based on planned Apple Watch activities
2. Recovery nutrition timing based on HRV and sleep data
3. Activity ring completion support (move, exercise, stand goals)
4. Circadian rhythm optimization using sleep/wake patterns
```

---

### User Story 7: Background Health Data Sync
**As a daily user, I want seamless background syncing of Health app data without manual intervention.**

**Implementation Requirements:**
- [ ] Create `AppleHealthKitSyncScheduler.ts` for background operations
- [ ] Implement efficient HealthKit observers for real-time updates
- [ ] Add manual sync with pull-to-refresh
- [ ] Handle app background/foreground state changes
- [ ] Optimize for battery life and performance

**Technical Details:**
```typescript
class AppleHealthKitSyncScheduler {
  private observers: Map<string, any> = new Map();
  
  async setupBackgroundObservers(): Promise<void> {
    // Real-time workout detection
    this.setupWorkoutObserver();
    
    // Daily metrics summary (end of day)
    this.setupDailyMetricsObserver();
    
    // Weight changes
    this.setupBodyMassObserver();
  }
  
  private setupWorkoutObserver(): void {
    HealthKit.initStepCountObserver({}, () => {
      // New workout detected, sync immediately
      this.performIncrementalSync();
    });
  }
}
```

---

### User Story 8: Apple Health Data Export and Sharing
**As a health-conscious user, I want to export my combined Apple Health and nutrition data.**

**Implementation Requirements:**
- [ ] Create unified health + nutrition export functionality
- [ ] Generate Apple Health compatible XML exports
- [ ] Support sharing with healthcare providers
- [ ] Create weekly/monthly health reports
- [ ] Add data portability options

**Export Features:**
```typescript
interface HealthDataExport {
  exportToAppleHealthXML(): Promise<string>
  exportToCSV(): Promise<string>
  generateWeeklyReport(): Promise<HealthReport>
  shareWithHealthProvider(email: string): Promise<void>
}

interface HealthReport {
  period: { start: Date; end: Date };
  workoutSummary: WorkoutSummaryData;
  nutritionSummary: NutritionSummaryData;
  sleepSummary: SleepSummaryData;
  progressTowards: GoalProgressData;
  recommendations: string[];
}
```

---

## Implementation Architecture

### File Structure
```
src/services/
├── AppleHealthKitService.ts       # Main HealthKit interface
├── AppleHealthDataProcessor.ts    # Data transformation
├── AppleHealthSyncScheduler.ts    # Background sync and observers
└── AppleHealthExportService.ts    # Data export functionality

src/screens/
├── AppleHealthKitSetupScreen.tsx  # iOS permission setup
└── AppleHealthDataViewer.tsx      # Health data dashboard

src/components/
├── HealthKitPermissionCard.tsx    # Permission request UI
├── AppleHealthStatus.tsx          # Connection status
└── HealthKitSyncButton.tsx        # Manual sync trigger

src/types/
└── AppleHealthKitTypes.ts         # HealthKit type definitions
```

### Platform-Specific Implementation
```typescript
// Platform check wrapper
const AppleHealthService = Platform.select({
  ios: () => require('./AppleHealthKitService').default,
  android: () => null, // Graceful degradation
})();
```

### Integration Benefits
1. **Rich Workout Data**: Apple Watch provides detailed heart rate zones, GPS tracks
2. **Comprehensive Sleep Analysis**: Sleep stages, efficiency, trends
3. **Real-time Activity**: Live activity rings, stand reminders integration
4. **Ecosystem Integration**: Seamless with other Apple Health apps
5. **Privacy First**: All data processed locally, user controls sharing

### Privacy and Security
- Request minimal necessary permissions
- Explain clearly why each data type is needed
- Process all data locally (never send HealthKit data to servers)
- Respect user permission changes
- Follow Apple's HealthKit guidelines strictly

## Success Metrics
- Permission grant rate > 80% (iOS users)
- Real-time sync reliability > 99%
- User engagement increase with health data
- Improved nutrition recommendation accuracy
- Reduced manual data entry by 90%

## Technical Considerations
- **iOS Only**: HealthKit is iOS-exclusive
- **Permissions**: Users can grant/deny individual data types
- **Background Limits**: iOS restricts background HealthKit access
- **Battery Optimization**: Efficient observers and sync patterns
- **Privacy**: Strict Apple review requirements for HealthKit apps

**Estimated Implementation Time: 3-4 weeks**

This Apple HealthKit integration provides iOS users with the most comprehensive health data integration possible, leveraging the rich ecosystem of Apple Watch and iPhone health tracking capabilities.