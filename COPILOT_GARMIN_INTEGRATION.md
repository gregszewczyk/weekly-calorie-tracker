# Garmin Integration User Stories

## Epic: Garmin Connect Integration for Athletic Performance Tracking

### User Story 1: Garmin Account Connection
**As an athlete using a Garmin device, I want to connect my Garmin Connect account to the app so that my training data is automatically synchronized.**

**Acceptance Criteria:**
- [ ] Display "Connect Garmin" button in Settings screen
- [ ] OAuth 2.0 authentication flow with Garmin Connect IQ
- [ ] Store encrypted Garmin access tokens securely
- [ ] Show connection status (Connected/Disconnected)
- [ ] Allow disconnection and re-authentication
- [ ] Handle token refresh automatically
- [ ] Display connected Garmin device model/name

**Technical Requirements:**
- Use Garmin Connect IQ SDK
- Implement secure token storage with AsyncStorage encryption
- Add Garmin logo and branding per brand guidelines
- Handle network errors gracefully

---

### User Story 2: Automatic Workout Import
**As a connected athlete, I want my Garmin workouts to automatically sync to the app so that I don't have to manually log training sessions.**

**Acceptance Criteria:**
- [ ] Automatically fetch new activities from Garmin Connect every 30 minutes
- [ ] Import workout data: sport type, duration, calories burned, heart rate zones
- [ ] Map Garmin activity types to app sport categories
- [ ] Show "Synced from Garmin" badge on imported workouts
- [ ] Allow manual refresh of Garmin data
- [ ] Handle duplicate workout prevention
- [ ] Sync historical workouts (last 30 days) on first connection

**Data Mapping:**
```typescript
GarminActivity -> WorkoutSession {
  activityType -> sport (cycling, running, swimming, etc.)
  duration -> duration (minutes)
  calories -> caloriesBurned
  avgHeartRate -> avgHeartRate
  maxHeartRate -> maxHeartRate
  avgPower -> avgPower (cycling/running)
  distance -> distance
}
```

---

### User Story 3: Advanced Metrics Integration
**As a performance-focused athlete, I want detailed Garmin metrics imported so that I can analyze my training load and recovery.**

**Acceptance Criteria:**
- [ ] Import Training Stress Score (TSS) when available
- [ ] Sync VO2 Max readings
- [ ] Import sleep data (duration, quality score)
- [ ] Fetch body battery/stress levels
- [ ] Sync HRV (Heart Rate Variability) data
- [ ] Import training load and recovery advisor data
- [ ] Display Garmin Connect insights in app

**Advanced Metrics Display:**
- Training Load chart with weekly progression
- Recovery metrics dashboard
- Sleep quality integration with daily logging
- Performance condition trends

---

### User Story 4: Real-time Activity Tracking
**As an athlete during training, I want my current Garmin activity to show live data in the app so that I can monitor performance in real-time.**

**Acceptance Criteria:**
- [ ] Detect when Garmin device starts activity
- [ ] Show "Live Activity" indicator in app
- [ ] Display real-time: heart rate, pace, power, time elapsed
- [ ] Show current calorie burn estimate
- [ ] Update calorie targets dynamically based on activity
- [ ] Notify when activity ends and import final data
- [ ] Handle connection interruptions gracefully

**Real-time Data Points:**
- Current heart rate and zone
- Activity duration
- Calories burned so far
- Distance covered
- Average pace/speed
- Current power output (if applicable)

---

### User Story 5: Intelligent Calorie Adjustment
**As a training athlete, I want the app to automatically adjust my daily calorie targets based on my Garmin workout data so that my nutrition matches my training load.**

**Acceptance Criteria:**
- [ ] Automatically increase daily calorie target after high-intensity workouts
- [ ] Adjust macro recommendations based on workout type (endurance vs strength)
- [ ] Factor in training load when calculating weekly calorie redistribution
- [ ] Show "Training Day Boost" notification when calories are adjusted
- [ ] Provide explanation of why calories were adjusted
- [ ] Allow manual override of auto-adjustments
- [ ] Consider recovery metrics in calorie calculations

**Smart Adjustments:**
- Endurance workouts: +200-600 calories, higher carb ratio
- Strength training: +150-400 calories, higher protein ratio
- Recovery days: Maintain baseline, optimize for recovery
- High training load weeks: Increase overall weekly allowance

---

### User Story 6: Training Plan Integration
**As a structured athlete, I want to see my planned Garmin workouts in the app so that I can plan my nutrition around my training schedule.**

**Acceptance Criteria:**
- [ ] Import planned workouts from Garmin Connect calendar
- [ ] Show upcoming workouts in daily view
- [ ] Display workout type, duration, and intensity
- [ ] Suggest pre/post workout nutrition based on workout type
- [ ] Show training phase (base, build, peak, recovery)
- [ ] Integrate with weekly calorie redistribution algorithm
- [ ] Send reminders for planned workout nutrition

**Training Calendar Integration:**
- Weekly training overview
- Planned vs completed workout comparison
- Training periodization visualization
- Nutrition timing recommendations

---

### User Story 7: Performance Analytics Dashboard
**As a data-driven athlete, I want a comprehensive view of my Garmin metrics alongside nutrition data so that I can optimize both training and fueling.**

**Acceptance Criteria:**
- [ ] Create "Performance Analytics" screen
- [ ] Show correlations between nutrition compliance and performance
- [ ] Display training load vs calorie intake trends
- [ ] Analyze sleep quality impact on training
- [ ] Show VO2 Max progression with nutrition periods
- [ ] Generate weekly performance + nutrition reports
- [ ] Export combined data for external analysis

**Analytics Views:**
- Training load vs nutrition compliance scatter plot
- Sleep quality vs next-day performance correlation
- Macro timing vs workout performance analysis
- Recovery metrics vs calorie balance trends

---

### User Story 8: Race Day Optimization
**As a competitive athlete, I want race day nutrition recommendations based on my Garmin race calendar and historical performance data.**

**Acceptance Criteria:**
- [ ] Detect upcoming races from Garmin Connect calendar
- [ ] Analyze historical race performance and nutrition
- [ ] Suggest carb loading strategy 3-7 days before race
- [ ] Recommend race day fueling plan based on race duration
- [ ] Track race day execution vs plan
- [ ] Post-race recovery nutrition recommendations
- [ ] Export race nutrition plan for sharing with coaches

**Race Day Features:**
- Automated carb loading calculator
- Hour-by-hour race day nutrition timeline
- Real-time race tracking with nutrition reminders
- Post-race analysis and learnings capture

---

### User Story 9: Coach/Team Integration
**As an athlete with a coach, I want to share my combined Garmin and nutrition data so that my coach can provide better guidance.**

**Acceptance Criteria:**
- [ ] Generate shareable performance + nutrition reports
- [ ] Export data in TrainingPeaks compatible format
- [ ] Email weekly summaries to coach
- [ ] Create coach dashboard view (read-only)
- [ ] Share specific workout + nutrition combinations
- [ ] Allow coach feedback integration
- [ ] Privacy controls for shared data

---

### User Story 10: Device Battery and Sync Management
**As a Garmin user, I want efficient sync management that doesn't drain my phone battery and handles offline scenarios gracefully.**

**Acceptance Criteria:**
- [ ] Sync only when on WiFi (user configurable)
- [ ] Batch sync operations to minimize battery impact
- [ ] Queue offline changes for later sync
- [ ] Show sync status and last sync time
- [ ] Handle Garmin Connect API rate limits
- [ ] Provide manual sync option
- [ ] Graceful degradation when Garmin services are down

**Sync Optimization:**
- Background sync with expo-background-fetch
- Incremental sync (only new/changed data)
- Compression for large data transfers
- Smart retry logic with exponential backoff

---

## Technical Architecture Requirements

### API Integration
```typescript
interface GarminConnectAPI {
  authenticate(): Promise<GarminTokens>;
  getActivities(startDate: Date, endDate: Date): Promise<GarminActivity[]>;
  getMetrics(date: Date): Promise<GarminMetrics>;
  getLiveActivity(): Promise<GarminLiveData | null>;
  getPlannedWorkouts(): Promise<GarminPlannedWorkout[]>;
}
```

### Data Models
```typescript
interface GarminActivity {
  activityId: string;
  activityType: GarminSportType;
  startTime: Date;
  duration: number; // seconds
  distance?: number; // meters
  calories: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgPower?: number;
  trainingStressScore?: number;
  deviceName: string;
}

interface GarminMetrics {
  date: string;
  vo2Max?: number;
  bodyBattery?: number;
  stressLevel?: number;
  sleepData?: {
    duration: number; // minutes
    quality: number; // 1-10
    deepSleep: number; // minutes
    remSleep: number; // minutes
  };
  hrv?: number;
}
```

### Security Requirements
- OAuth 2.0 with PKCE for authentication
- Encrypted token storage
- Certificate pinning for API calls
- User consent for each data type
- GDPR compliance for EU users
- Data retention policies

### Testing Requirements
- Mock Garmin API for development
- Unit tests for data transformation
- Integration tests for sync scenarios
- Performance tests for large data sets
- Battery usage optimization testing

---

## Implementation Priority

**Phase 1 (MVP):**
- User Stories 1, 2, 5 (Basic connection, workout import, calorie adjustment)

**Phase 2 (Enhanced):**
- User Stories 3, 4, 6 (Advanced metrics, real-time tracking, training plans)

**Phase 3 (Advanced):**
- User Stories 7, 8, 9, 10 (Analytics, race optimization, coach integration, sync management)

**Estimated Development Time:** 8-12 weeks for full implementation
**Required Garmin Developer Account:** Yes, with Connect IQ partnership agreement