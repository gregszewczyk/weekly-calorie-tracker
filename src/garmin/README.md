# Garmin Connect Integration

This module provides comprehensive integration with Garmin Connect using reverse-engineered APIs to automatically sync workout data and daily activity metrics.

## Features

- **Secure Authentication**: Username/password authentication with CSRF token handling
- **Session Management**: Automatic session persistence and renewal
- **Activity Sync**: Download workout activities with full details
- **Daily Metrics**: Sync steps, calories, heart rate, and sleep data
- **React Integration**: Ready-to-use hooks and components
- **Error Handling**: Comprehensive error types and recovery mechanisms

## Quick Start

### 1. Import the necessary components

```typescript
import { 
  useGarmin, 
  GarminConnectionScreen, 
  GarminStatusBadge 
} from '../garmin';
```

### 2. Use the Garmin hook in your component

```typescript
function MyComponent() {
  const {
    isConnected,
    connect,
    syncTodaysData,
    activities,
    error
  } = useGarmin();

  const handleConnect = async () => {
    const success = await connect('username', 'password');
    if (success) {
      await syncTodaysData();
    }
  };

  return (
    <View>
      <GarminStatusBadge 
        onPress={() => navigation.navigate('GarminConnection')}
      />
      {isConnected && (
        <Text>Found {activities.length} activities today</Text>
      )}
    </View>
  );
}
```

### 3. Add the connection screen to your navigation

```typescript
// In your navigator
<Stack.Screen 
  name="GarminConnection" 
  component={GarminConnectionScreen} 
  options={{ title: 'Connect Garmin' }}
/>
```

## API Reference

### Hooks

#### `useGarmin()`

Main hook providing full Garmin Connect functionality.

**Returns:**
- `isConnected`: boolean - Current connection status
- `activities`: GarminActivity[] - Synced activities
- `todaysSummary`: GarminDailySummary - Today's metrics
- `connect(username, password)`: Promise<boolean> - Connect to Garmin
- `syncTodaysData()`: Promise<void> - Sync today's data
- `disconnect()`: Promise<void> - Disconnect from Garmin

#### `useGarminConnection()`

Lightweight hook for checking connection status only.

**Returns:**
- `isConnected`: boolean - Current connection status
- `isLoading`: boolean - Whether status is being checked

### Components

#### `<GarminConnectionScreen />`

Full-screen component for managing Garmin connection with form inputs, status display, and sync controls.

#### `<GarminStatusBadge />`

Compact status indicator showing current connection state.

**Props:**
- `onPress?`: () => void - Callback when badge is tapped
- `showLabel?`: boolean - Whether to show text label (default: true)
- `size?`: 'small' | 'medium' | 'large' - Badge size (default: 'medium')

### Services

#### `garminService`

Singleton service instance for direct API access.

**Methods:**
- `connect(username, password)`: Authenticate with Garmin
- `isConnected()`: Check connection status
- `syncTodaysData()`: Get today's activities and summary
- `getUserProfile()`: Get user profile information
- `disconnect()`: Clear session and disconnect

## Data Types

### `GarminActivity`

```typescript
interface GarminActivity {
  activityId: string;
  activityName: string;
  activityType: string;
  startTime: Date;
  duration: number; // seconds
  distance?: number; // meters
  calories: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  elevationGain?: number; // meters
  averageSpeed?: number; // m/s
  maxSpeed?: number; // m/s
}
```

### `GarminDailySummary`

```typescript
interface GarminDailySummary {
  date: Date;
  steps?: number;
  calories?: number;
  activeCalories?: number;
  distance?: number;
  floorsClimbed?: number;
  activeMinutes?: number;
  sleepDuration?: number;
  restingHeartRate?: number;
  maxHeartRate?: number;
  averageStress?: number;
}
```

## Error Handling

The integration includes comprehensive error handling with specific error types:

```typescript
enum GarminErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED'
}
```

Handle errors in your components:

```typescript
const { error, clearError } = useGarmin();

if (error) {
  return (
    <View>
      <Text>Error: {error}</Text>
      <Button title="Dismiss" onPress={clearError} />
    </View>
  );
}
```

## Security Notes

- **No Password Storage**: Passwords are never stored permanently
- **Session Tokens**: Only authentication cookies and CSRF tokens are persisted
- **Automatic Cleanup**: Sessions are automatically cleared on expiration
- **Secure Communication**: All API calls use HTTPS with proper headers

## Implementation Details

This integration uses reverse-engineered Garmin Connect APIs and mimics a web browser authentication flow:

1. **Initial Request**: Load login page to get CSRF token and session cookies
2. **Authentication**: Submit credentials with CSRF token via POST request
3. **Session Validation**: Verify successful authentication by checking response
4. **API Access**: Use session cookies for subsequent API requests
5. **Token Refresh**: Automatically update session cookies as needed

## Troubleshooting

### Common Issues

**"Invalid Credentials" Error**
- Verify username and password are correct
- Try logging in through Garmin Connect website first
- Check if account requires 2FA (not currently supported)

**"Network Error"**
- Check internet connection
- Garmin servers may be temporarily unavailable
- Try again after a few minutes

**"Session Expired"**
- Sessions automatically expire after 24 hours
- Simply reconnect with credentials
- Data will be preserved and re-synced

**"Rate Limited"**
- Garmin has rate limits on API requests
- Wait before making additional requests
- The service includes automatic retry logic

### Debug Mode

Enable debug logging by checking console output:

```typescript
// The service automatically logs detailed information
// Look for [GarminConnect], [GarminAuth], and [GarminService] prefixes
```

## Legal Disclaimer

This integration uses reverse-engineered APIs and is not officially endorsed by Garmin. Use at your own discretion and ensure compliance with Garmin's Terms of Service. The integration is designed to be respectful of Garmin's services with appropriate rate limiting and error handling.
