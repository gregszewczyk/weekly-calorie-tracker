# UK Date Picker Components

This package provides comprehensive date picking components for React Native with UK date format (DD/MM/YYYY) support, calendar popup interface, and proper localization.

## Components

### 1. DatePickerComponent
A full-featured date picker with calendar popup and extensive customization options.

### 2. UKDateInput
A lightweight UK date input with auto-formatting and optional calendar picker.

### 3. UKDateUtils
Utility functions for UK date format handling and validation.

## Installation

The components require the following dependency:

```bash
npm install @react-native-community/datetimepicker
```

For Expo projects, also install:
```bash
expo install @react-native-community/datetimepicker
```

## Usage Examples

### Basic DatePickerComponent

```tsx
import React, { useState } from 'react';
import DatePickerComponent from './components/DatePickerComponent';

const MyComponent = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <DatePickerComponent
      label="Birth Date"
      value={selectedDate}
      onDateChange={setSelectedDate}
      placeholder="Select your birth date"
      required
      displayFormat="dd/MM/yyyy"
    />
  );
};
```

### Basic UKDateInput

```tsx
import React, { useState } from 'react';
import UKDateInput from './components/UKDateInput';

const MyComponent = () => {
  const [dateString, setDateString] = useState<string>('');

  return (
    <UKDateInput
      label="Event Date"
      value={dateString}
      onDateChange={setDateString}
      placeholder="DD/MM/YYYY"
      allowManualInput={true}
      required
    />
  );
};
```

### Using Date Utilities

```tsx
import { 
  formatToUKDate, 
  parseUKDate, 
  validateDateConstraints,
  autoFormatUKDate 
} from './utils/UKDateUtils';

// Format date to UK format
const ukDate = formatToUKDate(new Date()); // "01/08/2025"

// Parse UK date string
const dateObj = parseUKDate("25/12/2024"); // Date object

// Auto-format user input
const formatted = autoFormatUKDate("25122024"); // "25/12/2024"

// Validate date constraints
const validation = validateDateConstraints(new Date(), {
  minimumDate: new Date(),
  allowPast: false
});
```

## Component Props

### DatePickerComponent Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text displayed above the input |
| `value` | `Date \| string` | - | Current date value |
| `onDateChange` | `(date: Date) => void` | - | Callback when date changes |
| `placeholder` | `string` | `'Select date'` | Placeholder text |
| `minimumDate` | `Date` | - | Minimum selectable date |
| `maximumDate` | `Date` | - | Maximum selectable date |
| `disabled` | `boolean` | `false` | Whether the input is disabled |
| `required` | `boolean` | `false` | Whether the field is required |
| `errorMessage` | `string` | - | Error message to display |
| `mode` | `'date' \| 'time' \| 'datetime'` | `'date'` | Picker mode |
| `displayFormat` | `string` | `'dd/MM/yyyy'` | Date display format |

### UKDateInput Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text displayed above the input |
| `value` | `string` | - | Current date value in DD/MM/YYYY format |
| `onDateChange` | `(dateString: string) => void` | - | Callback when date changes |
| `placeholder` | `string` | `'DD/MM/YYYY'` | Placeholder text |
| `minimumDate` | `Date` | - | Minimum selectable date |
| `maximumDate` | `Date` | - | Maximum selectable date |
| `disabled` | `boolean` | `false` | Whether the input is disabled |
| `required` | `boolean` | `false` | Whether the field is required |
| `errorMessage` | `string` | - | Error message to display |
| `allowManualInput` | `boolean` | `true` | Allow typing dates manually |

## Features

### ✅ UK Date Format Support
- Displays dates in DD/MM/YYYY format
- Proper UK locale support with `date-fns`
- Auto-formatting as user types

### ✅ Calendar Popup Interface
- Clean modal design for iOS
- Native picker for Android
- Platform-specific optimizations

### ✅ Form Integration
- Full validation support
- Required field handling
- Error message display
- Clear/reset functionality

### ✅ Accessibility & UX
- Large touch targets
- Visual feedback
- Keyboard support for manual entry
- Proper focus management

### ✅ Customization
- Flexible styling options
- Multiple display formats
- Configurable constraints
- Disabled states

### ✅ Validation & Constraints
- Minimum/maximum date limits
- Future/past date restrictions
- Custom validation rules
- Real-time error feedback

## Styling

Both components support custom styling through style props:

```tsx
<DatePickerComponent
  style={{ borderColor: '#007bff' }}
  containerStyle={{ marginVertical: 10 }}
/>

<UKDateInput
  style={{ backgroundColor: '#f8f9fa' }}
/>
```

## Platform Differences

### iOS
- Shows modal with spinner-style picker
- "Done" button to confirm selection
- Smooth slide animation

### Android
- Shows native date picker dialog
- Automatic confirmation on selection
- Material Design styling

## Date Constraints Examples

### Birth Date Validation
```tsx
const today = new Date();
const minBirthDate = new Date(1900, 0, 1);
const maxBirthDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());

<DatePickerComponent
  label="Birth Date"
  minimumDate={minBirthDate}
  maximumDate={maxBirthDate}
  onDateChange={handleBirthDate}
/>
```

### Future Event Date
```tsx
const today = new Date();
const maxEventDate = new Date(today.getFullYear() + 5, 11, 31);

<UKDateInput
  label="Event Date"
  minimumDate={today}
  maximumDate={maxEventDate}
  onDateChange={handleEventDate}
/>
```

## Error Handling

Both components provide comprehensive error handling:

```tsx
const [error, setError] = useState('');

const handleDateChange = (date: Date) => {
  const validation = validateDateConstraints(date, {
    minimumDate: new Date(),
    allowPast: false
  });
  
  if (!validation.isValid) {
    setError(validation.message || 'Invalid date');
  } else {
    setError('');
    // Process valid date
  }
};

<DatePickerComponent
  errorMessage={error}
  onDateChange={handleDateChange}
/>
```

## Utility Functions

### formatToUKDate(date: Date): string
Formats a Date object to UK format string (DD/MM/YYYY).

### parseUKDate(dateString: string): Date | null
Parses a UK format date string to Date object.

### autoFormatUKDate(input: string): string
Auto-formats user input as they type (adds slashes automatically).

### validateDateConstraints(date: Date, constraints): DateValidationResult
Validates a date against various constraints.

### calculateAge(birthDate: Date | string): number | null
Calculates age from birth date.

### formatDateWithRelative(date: Date | string): string
Formats date with relative information (Today, Tomorrow, etc.).

## Best Practices

1. **Use proper validation**: Always validate dates against your business rules
2. **Provide clear labels**: Use descriptive labels for better UX
3. **Handle errors gracefully**: Show meaningful error messages
4. **Consider constraints**: Set appropriate min/max dates
5. **Test on both platforms**: Ensure consistent behavior on iOS and Android
6. **Use UK locale**: Always use `en-GB` locale for proper formatting

## Integration with Forms

The components work seamlessly with form libraries:

```tsx
// With React Hook Form
import { Controller, useForm } from 'react-hook-form';

const MyForm = () => {
  const { control, handleSubmit } = useForm();

  return (
    <Controller
      control={control}
      name="birthDate"
      rules={{ required: 'Birth date is required' }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <DatePickerComponent
          value={value}
          onDateChange={onChange}
          errorMessage={error?.message}
          required
        />
      )}
    />
  );
};
```

## Troubleshooting

### Common Issues

1. **Date not displaying**: Check that the date value is valid
2. **Picker not opening**: Ensure `@react-native-community/datetimepicker` is properly installed
3. **Wrong format**: Verify you're using UK locale and DD/MM/YYYY format
4. **Validation errors**: Check min/max date constraints

### Platform-Specific Issues

- **iOS**: If modal doesn't appear, check for other modals or overlays
- **Android**: Ensure you have proper permissions if needed
- **Expo**: Make sure the DateTimePicker is compatible with your Expo SDK version

## License

This component is part of the Weekly Calorie Tracker project and follows the same licensing terms.
