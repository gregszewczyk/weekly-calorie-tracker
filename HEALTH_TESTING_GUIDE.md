# Health Integration Testing Guide

This guide explains how to test Apple HealthKit and Samsung Health integrations without physical devices using our comprehensive mock infrastructure.

## Quick Start

### 1. Run Comprehensive Test Suite
```bash
# Run all health integration tests
npm run test:health

# Or run directly
npx ts-node test/healthIntegrationTestSuite.ts
```

### 2. Run Individual Platform Tests
```bash
# Test Apple HealthKit only
npx ts-node test/appleHealthExportTest.ts

# Test Samsung Health only  
npx ts-node test/samsungHealthAuthTest.ts
```

## Testing Modes

### Perfect Mode (Demo/Presentation)
```typescript
import MockHealthKit from '../src/mocks/MockHealthKit';
import MockSamsungHealth from '../src/mocks/MockSamsungHealth';

// Enable perfect conditions
MockHealthKit.enablePerfectMode();
MockSamsungHealth.setConfig({ 
  successRate: 1.0, 
  simulateNetworkIssues: false 
});
```

### Realistic Mode (Development Testing)
```typescript
// Enable realistic conditions with occasional failures
MockHealthKit.enableRealisticMode();
MockSamsungHealth.setConfig({
  simulateDelay: true,
  successRate: 0.85,
  simulateNetworkIssues: false,
});
```

### Stress Testing Mode
```typescript
// Test error handling
MockHealthKit.simulateNetworkError();
MockSamsungHealth.setConfig({ 
  simulateNetworkIssues: true,
  successRate: 0.6 
});
```

## Mock Service Features

### MockHealthKit Features
- ✅ Realistic workout patterns (morning/evening peaks)
- ✅ Weekend vs weekday activity differences  
- ✅ Data gaps simulation (missing days)
- ✅ Permission denial scenarios
- ✅ Heart rate data for 80% of workouts
- ✅ Distance data for cardio activities
- ✅ Multiple device sources (iPhone, Apple Watch)

### MockSamsungHealth Features  
- ✅ OAuth authentication flow simulation
- ✅ Network timeout/error simulation
- ✅ Realistic exercise types (Samsung Health format)
- ✅ Sleep and nutrition data
- ✅ User profile information
- ✅ Token expiration handling

## Test Scenarios Covered

### Apple HealthKit Tests
1. **Basic Connection** - Successful HealthKit setup
2. **Permission Denied** - User denies health permissions
3. **Workout Data Sync** - Syncing workouts from HealthKit
4. **Data Gap Handling** - Missing data days
5. **Realistic Patterns** - Workout timing and intensity

### Samsung Health Tests
1. **Basic Connection** - Samsung account OAuth
2. **Authentication Failure** - Auth server issues
3. **Exercise Data Sync** - Getting Samsung Health activities
4. **Network Issues** - Connection timeouts
5. **Exercise Types** - Valid Samsung Health formats

### Cross-Platform Tests
1. **Multiple Connections** - Both platforms connected
2. **Data Consistency** - Uniform data structures
3. **Connection Status** - Accurate connection tracking

### Error Handling Tests
1. **Network Timeout** - Request timeouts
2. **Invalid Platform** - Unsupported platforms
3. **Data Corruption** - Malformed health data

## Manual Testing Flows

### Test User Journey: First-Time Setup
```typescript
// 1. Reset everything
MockHealthKit.resetMock();
MockSamsungHealth.resetMock();

// 2. Test HealthKit setup
const appleResult = await healthDeviceManager.connect({
  platform: 'apple',
  requestedPermissions: ['steps', 'workouts', 'calories']
});

// 3. Test Samsung setup
const samsungResult = await healthDeviceManager.connect({
  platform: 'samsung',
  requestedPermissions: ['activity', 'sleep', 'steps']
});

// 4. Verify data sync
const activities = await healthDeviceManager.getAllRecentActivities(14);
console.log(`Synced ${activities.length} activities`);
```

### Test User Journey: Permission Denied
```typescript
// Simulate user denying permissions
MockHealthKit.denyAllPermissions();
MockSamsungHealth.simulateAuthFailure();

// Test graceful handling
const result = await healthDeviceManager.connect({
  platform: 'apple',
  requestedPermissions: ['steps']
});

console.log('Should show helpful error message:', result.error);
```

## Real Device Testing Preparation

### iOS Device Testing
1. **Prerequisites**:
   - iOS device or simulator
   - Xcode installed
   - Apple Developer account (for device testing)

2. **Setup**:
   ```bash
   cd ios
   pod install
   cd ..
   npm run ios
   ```

3. **Test Cases**:
   - HealthKit permission prompts
   - Real workout data sync
   - Background app refresh
   - Data accuracy vs mock data

### Android Device Testing  
1. **Prerequisites**:
   - Android device with Samsung Health app
   - Samsung Developer account
   - Samsung Health API credentials

2. **Setup**:
   ```bash
   npm run android
   ```

3. **Test Cases**:
   - Samsung account OAuth flow
   - Real exercise data sync
   - Network connectivity issues
   - Samsung Health app version compatibility

## CI/CD Integration

### GitHub Actions Test
```yaml
- name: Run Health Integration Tests
  run: |
    npm run test:health
    npm run test:apple-health
    npm run test:samsung-health
```

### Test Coverage Goals
- ✅ 90%+ test scenario coverage
- ✅ All error paths tested
- ✅ All user stories validated
- ✅ Performance benchmarks established

## Troubleshooting

### Common Issues
1. **Mock services not loading**:
   - Check `__DEV__` flag is true
   - Verify import paths are correct

2. **Tests timing out**:
   - Increase timeout values in mock config
   - Check for infinite loops in test scenarios

3. **Inconsistent test results**:
   - Use `resetMock()` between tests
   - Set deterministic success rates for reliable tests

### Debug Mode
```typescript
// Enable verbose logging
MockHealthKit.setConfig({ enableLogging: true });
MockSamsungHealth.setConfig({ enableLogging: true });

// Get detailed status
console.log(MockHealthKit.getDetailedStatus());
console.log(MockSamsungHealth.getAuthStatus());
```

## Performance Benchmarks

### Expected Test Times
- Individual test: < 100ms
- Full test suite: < 5 seconds
- Real device connection: 2-10 seconds
- Data sync (7 days): 1-3 seconds

### Memory Usage
- Mock services: ~2MB memory footprint
- Real integrations: ~10-50MB depending on data volume

## Next Steps

1. **Phase 1**: Run all mock tests ✅
2. **Phase 2**: Test on iOS simulator  
3. **Phase 3**: Test on Android emulator
4. **Phase 4**: Test on real devices
5. **Phase 5**: User acceptance testing

Your MVP is ready for comprehensive testing without any physical devices!