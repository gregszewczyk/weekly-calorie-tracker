# Unofficial Garmin Integration - User Stories for Copilot

## Epic: Unofficial Garmin Connect Integration Using Reverse-Engineered APIs

### User Story 1: Garmin Authentication Setup
**As a user, I want to connect my Garmin account using my existing credentials so that I can access my workout data without waiting for developer approval.**

**Implementation Requirements:**
- [ ] Create `GarminConnectService.ts` with username/password authentication
- [ ] Handle Garmin's CSRF tokens and session cookies
- [ ] Implement secure credential storage (never store passwords, only session tokens)
- [ ] Add connection testing and validation
- [ ] Create error handling for invalid credentials

**Technical Details:**
```typescript
interface GarminCredentials {
  username: string;
  password: string;
}

class GarminConnectService {
  async authenticate(credentials: GarminCredentials): Promise<boolean>
  async isConnected(): Promise<boolean>
  async disconnect(): Promise<void>
}
```

**Endpoints to Implement:**
- `https://sso.garmin.com/sso/signin` - Login page and authentication
- `https://connect.garmin.com/userprofile-service/userprofile` - User profile verification

---

### User Story 2: Activity Data Sync
**As an athlete, I want my Garmin workouts to automatically sync so that my calorie burn data is accurate and I don't need to manually log exercises.**

**Implementation Requirements:**
- [x] Fetch activities from last 30 days on initial sync
- [x] Get activity details: type, duration, calories, heart rate, power
- [x] Transform Garmin activity types to app workout categories
- [x] Integrate with existing `CalorieStore.logWorkout()` method
- [x] Handle duplicate activity prevention

**Technical Details:**
```typescript
interface GarminActivity {
  activityId: string;
  activityName: string;
  startTime: Date;
  activityType: string;
  duration: number; // seconds
  calories: number;
  averageHeartRate?: number;
  averageSpeed?: number;
  distance?: number; // meters
}

// Endpoint: /activitylist-service/activities/search/activities?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Activity Type Mapping:**
- `running` → `running` ✅
- `cycling` → `cycling` ✅
- `swimming` → `swimming` ✅
- `strength_training` → `strength-training` ✅
- `multi_sport` → `triathlon` ✅

**✅ IMPLEMENTATION COMPLETE**

**Files Created:**
- `GarminWorkoutSyncService.ts` - Core workout sync logic with duplicate prevention
- `useGarminCalorieIntegration.ts` - React hook for CalorieStore integration
- `GarminWorkoutSyncScreen.tsx` - Example UI for workout sync management

**Key Features:**
- ✅ Automatic activity type mapping from 20+ Garmin activities to app categories
- ✅ Intelligent duplicate prevention using activity IDs
- ✅ Integration with existing CalorieStore.logWorkout() method
- ✅ Heart rate-based training intensity detection
- ✅ Initial sync (30 days) and recent sync (7 days) options
- ✅ Comprehensive error handling and user feedback
- ✅ Persistent sync history to prevent re-processing

---

### User Story 3: Daily Health Metrics Integration
**As a health-conscious user, I want my daily Garmin metrics (steps, calories, sleep) to enhance my nutrition recommendations.**

**Implementation Requirements:**
- [x] Fetch daily wellness summaries
- [x] Extract: steps, active calories, BMR calories, body battery
- [x] Integrate with `HistoricalDataAnalyzer` for better TDEE calculations
- [x] Update AI recommendations based on activity levels and recovery

**✅ IMPLEMENTATION COMPLETE**

**Files Created:**
- `useGarminWellness.ts` - React hook for wellness data integration and real-time updates
- `GarminWellnessDashboard.tsx` - Complete UI dashboard for wellness metrics and insights

**Key Features:**
- ✅ Daily wellness data fetching with intelligent caching (1-hour cache duration)
- ✅ Enhanced TDEE calculations using actual Garmin metrics (vs. static activity level estimates)
- ✅ Activity level classification (sedentary → extra_active) based on steps, calories, and active minutes
- ✅ Recovery metrics analysis using heart rate variability, sleep, and stress data
- ✅ Real-time calorie goal adjustments (±15% based on activity and recovery)
- ✅ Personalized nutrition recommendations (protein boost, carb adjustments, hydration focus)
- ✅ 7-day trend analysis with data consistency scoring
- ✅ Auto-refresh capability with configurable intervals
- ✅ Comprehensive error handling and graceful degradation

**Enhanced TDEE Logic:**
- High activity (15k+ steps, 800+ active calories): 1.9x multiplier
- Very active (12k+ steps, 600+ active calories): 1.725x multiplier  
- Moderate activity (8k+ steps, 400+ active calories): 1.55x multiplier
- Light activity (5k+ steps, 200+ active calories): 1.375x multiplier
- Sedentary (<5k steps, <200 active calories): 1.2x multiplier

**Recovery-Based Adjustments:**
- Poor recovery (elevated HR, insufficient sleep): +5-10% calories, protein boost, increased carbs
- High stress levels: +5% calories, reduced refined carbs
- Good recovery: Normal recommendations or slight deficit tolerance
- Confidence scoring (30-100%) based on data consistency and completeness

**Technical Details:**
```typescript
interface GarminDailySummary {
  calendarDate: string;
  steps?: number;
  activeKilocalories?: number;
  bmrKilocalories?: number;
  bodyBatteryHighestValue?: number;
  bodyBatteryLowestValue?: number;
  restingHeartRate?: number;
}

// Endpoint: /wellness-service/wellness/dailySummary/{userId}?calendarDate=YYYY-MM-DD
```

---

### User Story 4: Sleep and Recovery Integration
**As an athlete focused on recovery, I want my Garmin sleep data to influence my daily calorie and macro recommendations.**

**Implementation Requirements:**
- [x] Fetch sleep data including duration, quality scores, and sleep stages
- [x] Correlate sleep quality with next-day calorie recommendations
- [x] Adjust macro ratios based on recovery metrics
- [x] Display sleep insights in daily logging screen

**✅ IMPLEMENTATION COMPLETE**

**Files Created:**
- `GarminSleepService.ts` - Comprehensive sleep data fetching and recovery analysis
- `SleepEnhancedHistoricalAnalyzer.ts` - Sleep-enhanced nutrition recommendations
- `SleepInsightsComponent.tsx` - UI component for daily logging screen integration
- `useSleepInsights.ts` - React hooks for sleep data and recommendations

**Key Features:**
- ✅ Daily sleep summaries with quality scoring and recovery metrics
- ✅ Sleep-based calorie and macro adjustments (deficit reduction up to 15%, protein boost +15%, carb increase up to 15%)
- ✅ Recovery status determination (poor/fair/good/excellent) based on comprehensive metrics
- ✅ Next-day recommendations for better sleep and training adjustments
- ✅ Sleep consistency analysis and trend tracking
- ✅ Hydration focus alerts based on sleep quality
- ✅ Integration with existing CalorieStore and HistoricalDataAnalyzer

**Recovery Logic Implemented:**
- Poor sleep (< 6 hours): Reduce calorie deficit by 10%, increase carbs by 15%
- Very poor sleep (< 5 hours): Reduce deficit by 15%, increase healthy fats by 5%
- Poor sleep quality (score < 60): Protein boost +15%, hydration focus
- Low deep sleep (< 15%): Protein boost for recovery support
- Poor sleep efficiency (< 75%): Increase complex carbs for stable energy

**Technical Details:**
```typescript
interface GarminSleepData {
  dailySleepDTO: {
    calendarDate: string;
    sleepTimeSeconds?: number;
    deepSleepSeconds?: number;
    lightSleepSeconds?: number;
    remSleepSeconds?: number;
    sleepScores?: {
      overall?: { value: number };
      duration?: { value: number };
    };
  };
}

// Endpoint: /wellness-service/wellness/dailySleepData/{userId}?date=YYYY-MM-DD
```

**Recovery Logic:**
- Poor sleep (score < 60): Reduce calorie deficit by 10%, increase carbs
- Good sleep (score > 80): Normal recommendations
- Deep sleep < 15%: Recommend higher protein for recovery

---

### User Story 5: Body Composition Tracking
**As someone tracking body composition, I want my Garmin scale data to automatically sync with my weight tracking for better progress analysis.**

**Implementation Requirements:**
- [ ] Fetch weight entries from Garmin Connect
- [ ] Sync body fat percentage, muscle mass if available
- [ ] Integrate with existing `CalorieStore.addWeightEntry()` method
- [ ] Update weight trend analysis in `HistoricalDataAnalyzer`

**Technical Details:**
```typescript
interface GarminBodyComposition {
  timestampGMT: number;
  calendarDate: string;
  weight: number; // kg
  bmi?: number;
  bodyFat?: number; // percentage
  muscleMass?: number; // kg
}

// Endpoint: /weight-service/weight/dateRange?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

---

### User Story 6: Garmin Setup Screen
**As a new user, I want an intuitive setup flow to connect my Garmin account and choose what data to sync.**

**Implementation Requirements:**
- [ ] Create `GarminSetupScreen.tsx` with credential input
- [ ] Add data permission toggles (activities, sleep, weight, etc.)
- [ ] Show connection test and success/error states
- [ ] Provide clear privacy information about data usage
- [ ] Add sync frequency preferences

**UI Components:**
```typescript
// GarminSetupScreen.tsx
- Username/password input fields
- "Test Connection" button with loading states
- Data type checkboxes (Activities, Sleep, Weight, Health Metrics)
- Privacy policy and data usage explanation
- "Complete Setup" button

// GarminConnectionStatus component
- Connected/Disconnected status indicator
- Last sync time display
- "Sync Now" and "Disconnect" buttons
```

---

### User Story 7: Background Sync Management
**As a daily user, I want automatic background syncing of my Garmin data without manual intervention.**

**Implementation Requirements:**
- [x] Create `GarminSyncScheduler.ts` for background sync management
- [x] Implement daily automatic sync (configurable time)
- [x] Add manual "Sync Now" functionality
- [x] Handle offline scenarios and retry logic
- [x] Show sync status notifications

**✅ IMPLEMENTATION COMPLETE**

**Files Created:**
- `GarminSyncScheduler.ts` - Comprehensive background sync management with scheduling, retry logic, and offline handling
- `useGarminBackgroundSync.ts` - React hook for sync management and status monitoring
- `GarminSyncManager.tsx` - Full UI component for sync configuration and monitoring
- `GarminSyncStatusIndicator.tsx` - Compact status indicator for headers and quick access

**Key Features:**
- ✅ **Configurable Background Sync**: Daily auto-sync with customizable time (default 6:00 AM) or manual-only mode
- ✅ **Manual Sync Controls**: On-demand sync with selectable data types (activities, wellness, sleep, body composition)
- ✅ **Intelligent Retry Logic**: Exponential backoff with configurable max attempts (default 3)
- ✅ **Offline Handling**: Queue syncs when offline, auto-process when network returns
- ✅ **Real-time Notifications**: Success, error, warning, and info notifications with auto-clear for success
- ✅ **Sync History**: Track last 50 sync attempts with detailed metadata (duration, data types, retry count)
- ✅ **Health Monitoring**: Sync health status (healthy/warning/error) based on failure count and staleness
- ✅ **Persistent Storage**: Configuration and status persist across app restarts
- ✅ **Network State Management**: Handle online/offline transitions with queued sync processing
- ✅ **Comprehensive UI**: Full sync manager with status cards, configuration toggles, and history

**Sync Configuration Options:**
- Frequency: Daily automatic or manual-only
- Sync time: Configurable hour/minute (HH:MM format)
- Data types: Activities, wellness, sleep, body composition (selectable)
- Retry attempts: Configurable max retries with exponential backoff
- Notifications: Enable/disable sync status notifications
- Background processing: Enable/disable for battery optimization

**Enhanced Sync Logic:**
- Multi-service coordination: Activities, wellness, sleep, and body composition data
- Partial success handling: Continues if some data types fail, reports detailed errors
- Duplicate prevention: Integrates with existing service-level duplicate checking
- Cache-aware: Respects service-level caching to avoid unnecessary API calls
- Graceful degradation: Functions in offline mode with automatic catch-up

**Technical Details:**
```typescript
class GarminSyncScheduler {
  async scheduleBackgroundSync(frequency: 'daily' | 'manual'): Promise<void>
  async performSync(): Promise<GarminEnhancedSyncResult>
  async getLastSyncTime(): Promise<Date | null>
  async syncNow(): Promise<GarminEnhancedSyncResult>
  setNetworkState(isOnline: boolean): void
}

interface GarminEnhancedSyncResult extends GarminSyncResult {
  wellnessData?: GarminDailySummary;
  sleepDataCount?: number;
  bodyCompositionEntries?: number;
  syncDuration: number; // ms
  dataTypes: ('activities' | 'wellness' | 'sleep' | 'bodyComposition')[];
  retryAttempt: number;
  offlineMode: boolean;
}

interface GarminSyncStatus {
  isRunning: boolean;
  lastSyncTime: Date | null;
  lastSuccessfulSync: Date | null;
  nextScheduledSync: Date | null;
  failureCount: number;
  queuedSyncs: QueuedSync[];
  syncHistory: GarminEnhancedSyncResult[];
}
```

---

### User Story 8: Enhanced AI Recommendations with Garmin Data
**As an athlete, I want AI recommendations that consider my actual Garmin training load and recovery metrics.**

**Implementation Requirements:**
- [ ] Enhance `PerplexityService` prompts with Garmin metrics
- [ ] Include training stress score, VO2 max, recovery time in AI context
- [ ] Adjust calorie recommendations based on body battery levels
- [ ] Provide training-specific nutrition timing advice

**Enhanced AI Context:**
```typescript
interface GarminEnhancedContext {
  recentActivities: GarminActivity[];
  bodyBatteryTrend: number[];
  sleepQualityTrend: number[];
  trainingLoad: {
    acute: number;
    chronic: number;
    ratio: number;
  };
  vo2Max?: number;
  restingHeartRateTrend: number[];
}
```

**AI Prompt Enhancement:**
```
GARMIN DATA INTEGRATION:
- Recent Training: {activities.length} workouts, avg {avgCalories} kcal/session
- Recovery Status: Body Battery {bodyBattery}/100, Sleep Score {sleepScore}/100
- Training Load: Acute {acuteLoad}, Chronic {chronicLoad}, Ratio {ratio}
- VO2 Max: {vo2Max} (Fitness Level: {fitnessLevel})

IMPORTANT: Adjust recommendations based on:
1. Low body battery (<30): Reduce deficit, increase carbs
2. High training load (ratio >1.3): Increase calories by 200-400
3. Poor sleep (<60): Prioritize recovery nutrition
4. Deload weeks: Reduce calories to maintenance
```

---

### User Story 9: Garmin Data Viewer Dashboard
**As a data-driven athlete, I want to see my Garmin metrics integrated with my nutrition data in a unified dashboard.**

**Implementation Requirements:**
- [ ] Create `GarminDataViewer.tsx` component
- [ ] Display recent activities with calorie integration
- [ ] Show sleep and recovery trends
- [ ] Correlate training intensity with nutrition compliance
- [ ] Add export functionality for combined data

**Dashboard Sections:**
```typescript
// Activity Summary
- Last 7 days activities list
- Total calories burned vs consumed
- Training intensity distribution

// Recovery Metrics
- Sleep quality trend (7-day chart)
- Body battery levels
- Resting heart rate trend

// Performance Correlations
- Nutrition compliance vs training performance
- Sleep quality vs next-day calories burned
- Recovery metrics vs weekly progress
```

---

### User Story 10: Garmin Settings and Privacy Controls
**As a privacy-conscious user, I want full control over what Garmin data is accessed and stored.**

**Implementation Requirements:**
- [x] Add Garmin section to Settings screen
- [x] Data type toggles (can disable specific data types)
- [x] Data retention controls (auto-delete after X days)
- [x] Clear disconnect and data deletion options
- [x] Sync frequency preferences

**✅ IMPLEMENTATION COMPLETE**

**Files Created:**
- `GarminPrivacyTypes.ts` - Comprehensive privacy settings and data management type definitions
- `useGarminPrivacy.ts` - React hook for complete privacy control and data management
- `GarminSettingsScreen.tsx` - Full-featured privacy settings screen with comprehensive controls
- `GarminSettingsSection.tsx` - Compact settings component for main Settings screen integration

**Key Features:**
- ✅ **Granular Data Controls**: Individual toggles for activities, sleep, weight, and health metrics with confirmation dialogs
- ✅ **Advanced Data Retention**: Configurable periods (30/60/90/365 days, unlimited) with automatic cleanup and compliance monitoring
- ✅ **Comprehensive Disconnect Options**: Clean account disconnection with user choice on data preservation or deletion
- ✅ **Flexible Sync Management**: Daily automatic or manual-only sync with background sync controls
- ✅ **Privacy Transparency**: Complete privacy audit system with detailed data usage visibility
- ✅ **GDPR-Compliant Export**: Data portability with anonymization options for privacy protection
- ✅ **Real-time Storage Monitoring**: Live tracking of storage usage, item counts, and automatic cleanup status
- ✅ **User-Friendly Interface**: Progressive disclosure with collapsible sections and modal-based detailed settings

**Privacy Controls:**
```typescript
interface GarminPrivacySettings {
  enableActivities: boolean;
  enableSleep: boolean;
  enableWeight: boolean;
  enableHealthMetrics: boolean;
  dataRetentionDays: number; // 30, 60, 90, 365, or -1 for unlimited
  autoSyncEnabled: boolean;
  syncFrequency: 'daily' | 'manual';
  backgroundSyncEnabled: boolean;
  shareDataWithAI: boolean;
  exportDataEnabled: boolean;
  anonymizeExports: boolean;
}
```

**Enhanced Features Beyond Requirements:**
- ✅ **Privacy Audit System**: Comprehensive data transparency with usage tracking and storage analytics
- ✅ **Data Management Dashboard**: Real-time storage monitoring with detailed breakdown by data type
- ✅ **Export Functionality**: Complete data export with anonymization options for GDPR compliance
- ✅ **Retention Compliance**: Automatic monitoring and enforcement of data retention policies
- ✅ **Progressive UI Design**: Intuitive interface with collapsible sections and modal-based detailed settings
- ✅ **Security-First Approach**: Local storage only, device-level encryption support, no cloud dependencies

**Integration Options:**
- **Full Settings Screen**: Complete standalone privacy control interface
- **Settings Section Component**: Compact collapsible section for integration into main app settings
- **React Hook**: Comprehensive privacy management hook for custom implementations

---

## Implementation Priority

**Phase 1 (Core Functionality):**
1. User Stories 1, 2, 6 (Authentication, Activities, Setup Screen)

**Phase 2 (Enhanced Data):**
2. User Stories 3, 4, 5 (Daily metrics, Sleep, Body composition)

**Phase 3 (Advanced Features):**
3. User Stories 7, 8, 9, 10 (Background sync, AI enhancement, Dashboard, Privacy)

## Technical Architecture

### File Structure
```
src/services/
├── GarminConnectService.ts      # Main API client
├── GarminAuthManager.ts         # Authentication handling
├── GarminDataProcessor.ts       # Data transformation
└── GarminSyncScheduler.ts       # Background sync

src/screens/
├── GarminSetupScreen.tsx        # Initial setup
└── GarminDataViewer.tsx         # Data dashboard

src/components/
├── GarminConnectionStatus.tsx   # Status indicator
└── GarminSyncButton.tsx         # Manual sync trigger

src/types/
└── GarminTypes.ts              # Type definitions
```

### Integration Points
- Enhance `CalorieStore` with Garmin data methods
- Update `HistoricalDataAnalyzer` with activity patterns
- Modify `PerplexityService` for enhanced AI prompts
- Add Garmin section to existing Settings screen

### Error Handling
- Invalid credentials → Clear guidance message
- API rate limits → Automatic retry with backoff
- Network errors → Offline queue and retry
- Session expiry → Automatic re-authentication prompt

### Security Measures
- Never store passwords, only session tokens
- Encrypt stored authentication data
- Clear session data on disconnect
- Respect Garmin's rate limits (max 60 requests/hour)

## Success Metrics
- Authentication success rate > 95%
- Data sync reliability > 98%
- User adoption of Garmin integration > 60%
- Improved calorie recommendation accuracy with Garmin data
- Reduced manual workout logging by 80%

## Disclaimer and Legal
- This uses reverse-engineered APIs that may break
- Users authenticate with their own credentials
- No data stored on external servers
- Respect Garmin's terms of service
- Provide clear data usage transparency

## Testing Strategy
- Mock Garmin API responses for development
- Test with various activity types and data scenarios
- Validate data transformation accuracy
- Test offline/online sync scenarios
- Performance testing with large data sets

**Estimated Implementation Time: 6-8 weeks**

---

This comprehensive implementation will give users seamless access to their Garmin data while respecting privacy and providing enhanced AI-powered nutrition recommendations based on actual training and recovery metrics.