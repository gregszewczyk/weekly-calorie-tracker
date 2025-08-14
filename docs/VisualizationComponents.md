# Daily Progress Visualization Components

A collection of reusable React Native chart components for displaying daily nutrition and fitness progress with smooth 60fps animations using react-native-svg.

## Components Overview

### 1. CalorieProgressRing 🔥
A circular progress ring showing calories consumed vs target with animated fill and color coding.

### 2. MacroBreakdownChart 📊
Three connected semi-circular progress indicators for protein, carbs, and fat tracking.

### 3. WaterIntakeTracker 💧
Interactive row of glass icons for daily water intake tracking.

### 4. WeeklyTrendChart 📈
Scrollable line chart showing 7-day calorie trends with smooth curves.

---

## Installation & Dependencies

```bash
npm install react-native-svg
```

For iOS (if using bare React Native):
```bash
cd ios && pod install
```

---

## 1. CalorieProgressRing

### Features
✅ Animated circular progress ring  
✅ Color coding: green (under), yellow (at), red (over target)  
✅ Center text showing consumed/target calories  
✅ Remaining calories calculation  
✅ Customizable size and animation  

### Props
```typescript
interface CalorieProgressRingProps {
  consumed: number;        // Calories consumed
  target: number;          // Daily calorie target
  animated?: boolean;      // Enable animations (default: true)
  size?: number;           // Ring diameter (default: 200)
}
```

### Usage
```tsx
import { CalorieProgressRing } from '../components/charts';

<CalorieProgressRing
  consumed={1650}
  target={2000}
  animated={true}
  size={200}
/>
```

### Color Logic
- **Green (#4CAF50)**: < 90% of target (under target)
- **Orange (#FF9800)**: 90-100% of target (near target)  
- **Red (#F44336)**: > 100% of target (over target)

---

## 2. MacroBreakdownChart

### Features
✅ Three stacked semi-circular progress indicators  
✅ Real-time percentage and gram calculations  
✅ Color-coded macros: protein (red), carbs (blue), fat (green)  
✅ Smooth gradient fills  
✅ Individual macro progress tracking  

### Props
```typescript
interface MacroData {
  protein: number;  // grams
  carbs: number;    // grams  
  fat: number;      // grams
}

interface MacroTargets {
  protein: number;  // target grams
  carbs: number;    // target grams
  fat: number;      // target grams
}

interface MacroBreakdownChartProps {
  macros: MacroData;       // Current intake
  targets: MacroTargets;   // Daily targets
  animated?: boolean;      // Enable animations (default: true)
}
```

### Usage
```tsx
import { MacroBreakdownChart } from '../components/charts';

const currentMacros = { protein: 120, carbs: 200, fat: 65 };
const macroTargets = { protein: 150, carbs: 250, fat: 80 };

<MacroBreakdownChart
  macros={currentMacros}
  targets={macroTargets}
  animated={true}
/>
```

### Color Scheme
- **Protein**: Red gradient (#FF5722 → #FF8A65)
- **Carbs**: Blue gradient (#2196F3 → #64B5F6)
- **Fat**: Green gradient (#4CAF50 → #81C784)

---

## 3. WaterIntakeTracker

### Features
✅ Interactive glass icons (tap to add/remove)  
✅ Animated fill transitions with scale effects  
✅ Customizable daily target (default: 8 glasses)  
✅ Progress percentage display  
✅ Achievement celebration (🎉)  
✅ Add/Remove control buttons  

### Props
```typescript
interface WaterIntakeTrackerProps {
  currentIntake: number;              // glasses consumed
  dailyTarget?: number;               // target glasses (default: 8)
  onUpdate: (glasses: number) => void; // callback when intake changes
}
```

### Usage
```tsx
import { WaterIntakeTracker } from '../components/charts';

const [waterIntake, setWaterIntake] = useState(5);

<WaterIntakeTracker
  currentIntake={waterIntake}
  dailyTarget={8}
  onUpdate={setWaterIntake}
/>
```

### Interactions
- **Tap Glass**: Add water up to that glass number
- **Tap Filled Glass**: Remove water from that glass onward  
- **Add Button**: Add one glass
- **Remove Button**: Remove one glass

---

## 4. WeeklyTrendChart

### Features
✅ Smooth curved line chart with gradient fill  
✅ Scrollable for historical data navigation  
✅ Interactive day selection  
✅ Target vs actual comparison  
✅ Today highlighting  
✅ Grid lines and proper scaling  
✅ Responsive design  

### Props
```typescript
interface DayData {
  date: string;     // YYYY-MM-DD format
  actual: number;   // actual calories
  target: number;   // target calories
  dayName: string;  // Mon, Tue, Wed, etc.
}

interface WeeklyTrendChartProps {
  weeklyData: DayData[];     // 7 days of data
  showTarget?: boolean;      // show target line (default: true)
  interactive?: boolean;     // enable interactions (default: true)
}
```

### Usage
```tsx
import { WeeklyTrendChart } from '../components/charts';

const weeklyData = [
  { date: '2025-07-26', actual: 1850, target: 2000, dayName: 'Mon' },
  { date: '2025-07-27', actual: 2100, target: 2000, dayName: 'Tue' },
  // ... more days
];

<WeeklyTrendChart
  weeklyData={weeklyData}
  showTarget={true}
  interactive={true}
/>
```

### Visual Elements
- **Blue Line**: Actual calorie intake with gradient
- **Orange Dashed Line**: Target calories (if enabled)
- **Dots**: Data points for each day
- **Grid**: Horizontal reference lines
- **Labels**: Day names and calorie values

---

## Animation Performance

All components are optimized for **60fps animations**:

- **Native Driver**: Used where possible for smooth transitions
- **Interpolation**: Smooth value transitions without frame drops
- **SVG Animations**: Hardware-accelerated vector graphics
- **Staged Animations**: Staggered delays prevent overwhelming the UI thread

### Animation Timing
- **CalorieProgressRing**: 1000ms circular fill
- **MacroBreakdownChart**: 1000ms parallel semi-circle fills  
- **WaterIntakeTracker**: 300ms glass fills with 50ms stagger
- **WeeklyTrendChart**: 1500ms smooth curve drawing

---

## Integration Examples

### In DailyLoggingScreen
```tsx
import {
  CalorieProgressRing,
  MacroBreakdownChart,
  WaterIntakeTracker,
  WeeklyTrendChart
} from '../components/charts';

const DailyLoggingScreen = () => {
  const { dailyData, weeklyData, updateWaterIntake } = useCalorieStore();
  
  return (
    <ScrollView>
      {/* Daily overview */}
      <CalorieProgressRing
        consumed={dailyData.consumed}
        target={dailyData.target}
      />
      
      {/* Macro tracking */}
      <MacroBreakdownChart
        macros={dailyData.macros}
        targets={dailyData.macroTargets}
      />
      
      {/* Water tracking */}
      <WaterIntakeTracker
        currentIntake={dailyData.waterGlasses}
        onUpdate={updateWaterIntake}
      />
      
      {/* Weekly trend */}
      <WeeklyTrendChart
        weeklyData={weeklyData}
        showTarget={true}
        interactive={true}
      />
    </ScrollView>
  );
};
```

### Custom Styling
All components accept custom styling through their container views:

```tsx
<View style={{ backgroundColor: '#F0F0F0', borderRadius: 16 }}>
  <CalorieProgressRing consumed={1650} target={2000} />
</View>
```

---

## Accessibility Features

### Screen Reader Support
- Descriptive labels for all interactive elements
- Progress announcements for chart updates
- Semantic role assignments

### High Contrast Mode
- Color combinations tested for accessibility
- Alternative visual indicators beyond color
- Proper text contrast ratios

### Voice Control
- Compatible with voice navigation
- Clear focus indicators
- Logical tab order

---

## Performance Optimization

### Memory Management
- Proper cleanup of animation listeners
- Efficient re-rendering with React.memo potential
- SVG path caching for complex curves

### Data Handling
- Handles empty data gracefully
- Automatic scaling and normalization
- Efficient array operations for large datasets

### Rendering Optimization
- Conditional rendering based on data availability
- Lazy loading for historical chart data
- Debounced updates for rapid state changes

---

## Testing Considerations

### Component Testing
```tsx
// Example test setup
import { render, fireEvent } from '@testing-library/react-native';
import { WaterIntakeTracker } from '../charts';

test('water intake updates correctly', () => {
  const mockUpdate = jest.fn();
  const { getByText } = render(
    <WaterIntakeTracker 
      currentIntake={3} 
      onUpdate={mockUpdate} 
    />
  );
  
  fireEvent.press(getByText('+ Add Glass'));
  expect(mockUpdate).toHaveBeenCalledWith(4);
});
```

### Animation Testing
- Mock animated values for consistent testing
- Test animation completion callbacks
- Verify proper cleanup on unmount

---

## Troubleshooting

### Common Issues

**Charts not rendering:**
- Ensure react-native-svg is properly installed
- Check that SVG components are wrapped in proper containers
- Verify data props are not undefined

**Animations not smooth:**
- Check useNativeDriver usage
- Ensure animation durations are reasonable
- Verify component isn't re-rendering excessively

**TypeScript errors:**
- Import types from the charts index file
- Ensure data structures match expected interfaces
- Check that all required props are provided

### Platform-Specific Notes

**iOS:**
- SVG animations perform better with hardware acceleration
- Consider memory usage with complex gradients

**Android:**
- Some gradient effects may differ slightly
- Test scroll performance on lower-end devices

---

## Future Enhancements

### Planned Features
- 📊 Additional chart types (pie charts, bar charts)
- 🎨 Theme system for custom color schemes  
- 📱 Haptic feedback for interactions
- 🌙 Dark mode support
- 📸 Chart screenshot/sharing capabilities
- 📈 More advanced trend analysis

### Extensibility
All components are designed to be extended:
- Custom color schemes via props
- Additional data fields support
- Plugin architecture for custom animations
- Theme provider integration ready

---

## Support

The chart components are designed to integrate seamlessly with the Weekly Calorie Tracker app's existing architecture and can be easily adapted for other fitness and nutrition tracking applications.
