# Athlete Setup - Mandatory Weekly Hours Fix

## Changes Made

### Problem
- User could proceed to next step without entering weekly training hours
- Default values (8 hours for primary sport, 2 hours for secondary sports) were automatically filled
- Fields had default placeholders that didn't emphasize requirement

### Solution
1. **Removed Default Values**
   - Primary sport selection no longer sets default 8 hours
   - Secondary sport selection no longer sets default 2 hours
   - Users must manually enter their actual training hours

2. **Enhanced Input Fields**
   - Fields are now blank by default
   - Clear "Weekly hours (required)" placeholder text
   - Visual highlighting with red border/background when empty
   - Values only display when user has entered > 0 hours

3. **Improved Validation**
   - Added specific validation for primary sport hours
   - Added validation for each secondary sport hours
   - Clear error messages indicating which sport needs hours
   - Prevents progression with any empty hour fields

4. **Better User Experience**
   - Added helper text explaining all fields are required
   - Visual feedback with colored borders for empty fields
   - Maintained existing total hours display and validation

### Technical Changes

#### AthleteOnboardingScreen.tsx
- Modified sport selection handlers to set 0 instead of default values
- Updated TextInput components with conditional styling
- Enhanced validation logic for individual sport hour requirements
- Added `hourInputEmpty` style for visual feedback
- Added helper text for better user guidance

#### Validation Logic
```typescript
// Before: Only checked total hours
if (totalWeeklyHours === 0) { ... }

// After: Checks each sport individually
if (!sportHours[primarySport] || sportHours[primarySport] <= 0) { ... }
for (const sport of secondarySports) {
  if (!sportHours[sport] || sportHours[sport] <= 0) { ... }
}
```

#### Visual Feedback
- Empty fields: Red border (#ff6b6b) and light red background (#fff5f5)
- Filled fields: Normal styling
- Helper text clearly indicates all fields are required

### User Impact
- **Before**: User could skip with defaults, leading to inaccurate TDEE calculations
- **After**: User must consciously enter their actual training hours, ensuring accurate data for calorie calculations

This ensures the athlete profile setup captures realistic training data, which is crucial for accurate TDEE calculations and personalized nutrition recommendations.
