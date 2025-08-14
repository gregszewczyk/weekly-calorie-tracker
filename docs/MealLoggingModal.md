# MealLoggingModal Component

A comprehensive meal logging modal for the Weekly Calorie Tracker app.

## Features

✅ **Modal Structure:**
- Slide-up modal with animated backdrop
- Header with "Log Meal" title and close button
- Scrollable form fields container with keyboard avoidance

✅ **Form Fields:**
- Meal type selector (Breakfast, Lunch, Dinner, Snack, Pre-workout, Post-workout)
- Food name input with validation
- Calorie input with numeric keypad
- Individual macro inputs (protein, carbs, fat in grams)
- Time picker that defaults to current time
- Photo upload button (placeholder implementation)
- Notes field for additional meal information

✅ **Advanced Features:**
- Real-time macro calculation from calories (40% carbs, 30% protein, 30% fat)
- Quick add buttons for common foods (Banana, Apple, Greek Yogurt, etc.)
- Barcode scanner integration placeholder
- Comprehensive form validation with error messages
- "Save & Add Another" and "Save Meal" buttons
- Loading states with activity indicators

✅ **State Management:**
- Uses local state for form data management
- Integrates with `useCalorieStore.logMeal()` method
- Handles loading states and success feedback
- Automatic form reset between entries

## Usage

```tsx
import MealLoggingModal from '../components/MealLoggingModal';

const MyScreen = () => {
  const [showMealModal, setShowMealModal] = useState(false);

  const handleMealSaved = (meal: MealEntry) => {
    console.log('Meal saved:', meal);
    // Additional logic after meal is saved
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setShowMealModal(true)}>
        <Text>Add Meal</Text>
      </TouchableOpacity>

      <MealLoggingModal
        visible={showMealModal}
        onClose={() => setShowMealModal(false)}
        onSave={handleMealSaved}
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
| `onSave` | `(meal: MealEntry) => void` | No | Callback when meal is saved |

## Data Flow

1. User opens modal via "Add Meal" button
2. User fills out meal information
3. Real-time validation and macro calculation
4. User saves meal (either "Save" or "Save & Add Another")
5. Modal calls `useCalorieStore.logMeal()` to persist data
6. Success feedback and modal handling based on user choice
7. Parent component receives callback with saved meal data

## Quick Add Foods

The modal includes 8 common foods for quick entry:
- Banana (89 cal)
- Apple (52 cal)  
- Greek Yogurt 100g (59 cal)
- Oatmeal 40g (158 cal)
- Chicken Breast 100g (165 cal)
- Brown Rice 100g (111 cal)
- Avocado 100g (160 cal)
- Almonds 28g (161 cal)

## Enhanced MealEntry Type

The component uses an enhanced `MealEntry` type that includes:

```typescript
export interface MealEntry {
  id: string;
  name: string;
  calories: number;
  timestamp: Date;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout';
  macros?: {
    protein: number; // grams
    carbohydrates: number; // grams
    fat: number; // grams
  };
  notes?: string;
  photoUri?: string;
}
```

## Integration with DailyLoggingScreen

The modal is fully integrated with the `DailyLoggingScreen`:

- Triggered by "Add Meal" button in nutrition tab
- Triggered by floating action button when on nutrition tab
- Automatically updates the meal list and progress indicators
- Uses actual macro data when available, falls back to estimates

## Styling

- Follows app theme with blue (#339AF0) primary color
- Card-based layout with proper shadows and spacing
- Responsive design for different screen sizes
- Smooth animations for modal transitions
- Proper keyboard avoidance on both iOS and Android

## Future Enhancements

The modal includes placeholder implementations for:
- Barcode scanner integration
- Photo upload functionality
- Food database with autocomplete suggestions
- More sophisticated macro calculations
- Voice input capabilities
