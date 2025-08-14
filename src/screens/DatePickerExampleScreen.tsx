import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DatePickerComponent from '../components/DatePickerComponent';
import UKDateInput from '../components/UKDateInput';

const DatePickerExampleScreen: React.FC = () => {
  // State for different date examples
  const [birthDate, setBirthDate] = useState<Date>(new Date('1990-01-01'));
  const [eventDate, setEventDate] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<Date>(new Date());
  const [targetDate, setTargetDate] = useState<string>('');
  const [deadlineDate, setDeadlineDate] = useState<Date>(new Date());

  // Error states
  const [birthDateError, setBirthDateError] = useState<string>('');
  const [eventDateError, setEventDateError] = useState<string>('');

  // Date constraints
  const today = new Date();
  const minBirthDate = new Date(1900, 0, 1);
  const maxBirthDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
  const minEventDate = today;
  const maxEventDate = new Date(today.getFullYear() + 5, 11, 31);

  // Validation functions
  const validateBirthDate = (date: Date) => {
    if (date > maxBirthDate) {
      setBirthDateError('Must be at least 13 years old');
    } else if (date < minBirthDate) {
      setBirthDateError('Please enter a valid birth year');
    } else {
      setBirthDateError('');
    }
  };

  const validateEventDate = (dateString: string) => {
    if (dateString) {
      const date = new Date(dateString.split('/').reverse().join('-'));
      if (date < today) {
        setEventDateError('Event date must be in the future');
      } else {
        setEventDateError('');
      }
    } else {
      setEventDateError('');
    }
  };

  // Handle date changes with validation
  const handleBirthDateChange = (date: Date) => {
    setBirthDate(date);
    validateBirthDate(date);
  };

  const handleEventDateChange = (dateString: string) => {
    setEventDate(dateString);
    validateEventDate(dateString);
  };

  const handleFormSubmit = () => {
    let hasErrors = false;

    // Validate all required fields
    if (!birthDate) {
      setBirthDateError('Birth date is required');
      hasErrors = true;
    }

    if (!eventDate) {
      setEventDateError('Event date is required');
      hasErrors = true;
    }

    if (hasErrors) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    // Show success message with all selected dates
    const message = `
Form Data:
• Birth Date: ${birthDate.toLocaleDateString('en-GB')}
• Event Date: ${eventDate}
• Appointment: ${appointmentDate.toLocaleDateString('en-GB')}
• Target Date: ${targetDate || 'Not selected'}
• Deadline: ${deadlineDate.toLocaleDateString('en-GB')}
    `;

    Alert.alert('Form Submitted', message.trim());
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Date Picker Examples</Text>
          <Text style={styles.subtitle}>
            Demonstrating UK date format (DD/MM/YYYY) with calendar popup
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Fields</Text>
          
          {/* Birth Date - Full DatePickerComponent */}
          <DatePickerComponent
            label="Birth Date"
            value={birthDate}
            onDateChange={handleBirthDateChange}
            placeholder="Select your birth date"
            minimumDate={minBirthDate}
            maximumDate={maxBirthDate}
            required
            errorMessage={birthDateError}
            displayFormat="dd/MM/yyyy"
          />

          {/* Event Date - UK Date Input with manual entry */}
          <UKDateInput
            label="Event Date"
            value={eventDate}
            onDateChange={handleEventDateChange}
            placeholder="DD/MM/YYYY"
            minimumDate={minEventDate}
            maximumDate={maxEventDate}
            required
            errorMessage={eventDateError}
            allowManualInput={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Optional Fields</Text>
          
          {/* Appointment Date - Calendar only */}
          <DatePickerComponent
            label="Appointment Date"
            value={appointmentDate}
            onDateChange={setAppointmentDate}
            placeholder="Choose appointment date"
            minimumDate={today}
            displayFormat="dd/MM/yyyy"
          />

          {/* Target Date - Manual input disabled */}
          <UKDateInput
            label="Target Date"
            value={targetDate}
            onDateChange={setTargetDate}
            placeholder="Select target date"
            allowManualInput={false}
            minimumDate={today}
          />

          {/* Deadline Date - With time */}
          <DatePickerComponent
            label="Project Deadline"
            value={deadlineDate}
            onDateChange={setDeadlineDate}
            placeholder="Set deadline"
            minimumDate={today}
            mode="date"
            displayFormat="dd/MM/yyyy"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disabled Example</Text>
          
          <DatePickerComponent
            label="Created Date"
            value={new Date()}
            onDateChange={() => {}}
            disabled
            displayFormat="dd/MM/yyyy"
          />
        </View>

        <View style={styles.submitSection}>
          <Text style={styles.submitButton} onPress={handleFormSubmit}>
            Submit Form
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Features Demonstrated:</Text>
          <Text style={styles.infoText}>
            • UK date format (DD/MM/YYYY) with proper localization{'\n'}
            • Calendar popup with modal design{'\n'}
            • Manual date input with auto-formatting{'\n'}
            • Date validation and constraints{'\n'}
            • Required/optional field handling{'\n'}
            • Error messages and validation{'\n'}
            • Clear/reset functionality{'\n'}
            • Disabled state styling{'\n'}
            • iOS and Android platform differences{'\n'}
            • Form integration and submission
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  submitSection: {
    padding: 20,
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    overflow: 'hidden',
  },
  infoSection: {
    backgroundColor: '#e9f7ff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});

export default DatePickerExampleScreen;
