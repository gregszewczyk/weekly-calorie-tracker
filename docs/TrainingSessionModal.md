# TrainingSessionModal Component

A comprehensive training session logging modal for the Weekly Calorie Tracker app.

## Features

✅ **Modal Structure:**
- Full-screen modal with animated slide-up transition
- Custom header with sport-specific icon and colors
- Header with "Log Workout" title and close/save buttons
- Tabbed interface for different input types with smooth transitions

✅ **Basic Info Tab:**
- Sport type selector (10 sports: running, cycling, swimming, strength, CrossFit, HYROX, triathlon, martial arts, team sports, general fitness)
- Session name/title input with validation
- Duration input (hours and minutes with auto-calculation)
- Start/end time pickers with automatic duration calculation
- Intensity selector (Recovery, Easy, Moderate, Hard, Max) with descriptions

✅ **Performance Tab:**
- Calories burned input with validation
- Distance input (conditional for running, cycling, swimming)
- Heart rate inputs (average and peak) with range validation
- Power data inputs (conditional for cycling/running) - average and peak watts
- RPE scale (1-10 slider with descriptive text)

✅ **Notes Tab:**
- Workout notes text area for detailed feedback
- Equipment used input field
- Location input field
- Weather conditions input (for outdoor activities)
- Mood selector with emoji indicators (terrible to excellent)

✅ **Integration:**
- Saves to useCalorieStore via updateBurnedCalories method
- Updates daily burned calories automatically
- Supports athlete-specific metrics based on sport selection
- Sport-specific conditional fields and colors

## Usage

```tsx
import TrainingSessionModal from '../components/TrainingSessionModal';

const MyScreen = () => {
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  const handleWorkoutSaved = (workout: WorkoutSession) => {
    console.log('Workout saved:', workout);
    // Additional logic after workout is saved
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setShowTrainingModal(true)}>
        <Text>Log Workout</Text>
      </TouchableOpacity>

      <TrainingSessionModal
        visible={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        onSave={handleWorkoutSaved}
      />
    </View>
  );
};
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Callback when modal is closed |
| `onSave` | `(workout: WorkoutSession) => void` | No | Callback when workout is saved |

## Sport-Specific Features

### **Sport Types with Colors and Icons:**
- 🏃 **Running** (Red #FF6B6B) - Shows distance and power fields
- 🚴 **Cycling** (Teal #4ECDC4) - Shows distance and power fields
- 🏊 **Swimming** (Blue #45B7D1) - Shows distance field
- 🏋️ **Strength Training** (Green #96CEB4) - Basic metrics only
- 💪 **CrossFit** (Yellow #FECA57) - Full performance metrics
- 🔥 **HYROX** (Pink #FF9FF3) - Full performance metrics
- 🏊‍♂️ **Triathlon** (Blue #54A0FF) - All endurance metrics
- 🥋 **Martial Arts** (Purple #5F27CD) - Basic + RPE focus
- ⚽ **Team Sports** (Cyan #00D2D3) - Standard metrics
- 💚 **General Fitness** (Green #1DD1A1) - Flexible metrics

### **Conditional Fields:**
- **Distance**: Only shown for running, cycling, swimming
- **Power Data**: Only shown for cycling and running
- **All Sports**: Get calories, heart rate, RPE, duration, intensity

## Enhanced WorkoutSession Type

The component uses a comprehensive `WorkoutSession` type:

```typescript
export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD format
  timestamp: Date;
  sport: SportType;
  name: string;
  duration: number; // minutes
  startTime?: Date;
  endTime?: Date;
  intensity: TrainingIntensity;
  caloriesBurned: number;
  distance?: number; // km
  avgHeartRate?: number; // bpm
  maxHeartRate?: number; // bpm
  avgPower?: number; // watts
  maxPower?: number; // watts
  rpe?: number; // 1-10 scale
  notes?: string;
  equipment?: string;
  location?: string;
  weather?: string;
  mood?: 'terrible' | 'bad' | 'okay' | 'good' | 'excellent';
}
```

## Form Validation

### **Required Fields:**
- Session name (cannot be empty)
- Duration (must be greater than 0)

### **Optional Validation:**
- Calories burned (cannot be negative)
- Distance (cannot be negative)
- Heart rate (30-220 bpm range)
- All other fields are optional

### **Smart Calculations:**
- End time automatically calculated from start time + duration
- Duration inputs (hours + minutes) combined into total minutes
- Form updates in real-time as user types

## Data Flow

1. User opens modal via "Log Workout" button or floating action button
2. User selects sport type (affects available fields and colors)
3. User fills out workout information across three tabs
4. Real-time validation and field updates
5. User saves workout via header save button
6. Modal calls `updateBurnedCalories()` to update daily totals
7. Success feedback and modal closes
8. Parent component receives callback with workout data

## Visual Design

### **Sport-Specific Theming:**
- Header background color changes based on selected sport
- Sport icons displayed prominently in header
- Consistent color scheme throughout the modal

### **Tab Interface:**
- Smooth transitions between Basic Info, Performance, and Notes tabs
- Tab highlighting with app theme color (#339AF0)
- Logical grouping of related fields

### **Form UX:**
- Large, accessible input fields
- Visual intensity selector with color coding
- RPE slider with large number display and descriptions
- Mood selector with emoji feedback
- Conditional field display based on sport selection

## Integration with DailyLoggingScreen

The modal is fully integrated with the `DailyLoggingScreen`:

- Triggered by "Log Workout" button in training tab
- Triggered by floating action button when on training tab
- Automatically updates calories burned in daily progress
- Integrates with existing store management system

## Performance Features

- **Animations**: Smooth slide-up modal transition
- **Keyboard Handling**: Proper keyboard avoidance on both platforms
- **Platform Optimization**: iOS and Android specific time picker handling
- **Memory Efficient**: Local state management with proper cleanup

## Future Enhancements

Placeholder implementations ready for:
- Workout template system for quick logging
- GPS integration for outdoor activities
- Heart rate zone analysis
- Training load calculations (TSS)
- Social sharing capabilities
- Photo/video attachments
- Voice notes integration
