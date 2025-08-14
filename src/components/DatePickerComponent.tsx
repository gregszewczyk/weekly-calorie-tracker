import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format, parse, isValid, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { enGB } from 'date-fns/locale';

export interface DatePickerProps {
  label?: string;
  value?: Date | string;
  onDateChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  required?: boolean;
  errorMessage?: string;
  style?: any;
  mode?: 'date' | 'time' | 'datetime';
  displayFormat?: string;
  containerStyle?: any;
}

const DatePickerComponent: React.FC<DatePickerProps> = ({
  label,
  value,
  onDateChange,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
  disabled = false,
  required = false,
  errorMessage,
  style,
  mode = 'date',
  displayFormat = 'dd/MM/yyyy',
  containerStyle,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (value) {
      if (typeof value === 'string') {
        // Try to parse string in DD/MM/YYYY format
        const parsed = parse(value, 'dd/MM/yyyy', new Date());
        return isValid(parsed) ? parsed : new Date();
      }
      return value instanceof Date ? value : new Date();
    }
    return new Date();
  });
  const [tempDate, setTempDate] = useState<Date>(selectedDate);

  // Format date for display
  const formatDisplayDate = useCallback((date: Date): string => {
    try {
      return format(date, displayFormat, { locale: enGB });
    } catch (error) {
      console.warn('Date formatting error:', error);
      return date.toLocaleDateString('en-GB');
    }
  }, [displayFormat]);

  // Get current display value
  const getDisplayValue = (): string => {
    if (value) {
      if (typeof value === 'string') {
        // Parse string date
        const parsed = parse(value, 'dd/MM/yyyy', new Date());
        return isValid(parsed) ? formatDisplayDate(parsed) : value;
      }
      return formatDisplayDate(value);
    }
    return '';
  };

  // Validate date against constraints
  const validateDate = (date: Date): { isValid: boolean; message?: string } => {
    if (!isValid(date)) {
      return { isValid: false, message: 'Invalid date' };
    }

    if (minimumDate && isBefore(startOfDay(date), startOfDay(minimumDate))) {
      return {
        isValid: false,
        message: `Date must be after ${formatDisplayDate(minimumDate)}`,
      };
    }

    if (maximumDate && isAfter(startOfDay(date), startOfDay(maximumDate))) {
      return {
        isValid: false,
        message: `Date must be before ${formatDisplayDate(maximumDate)}`,
      };
    }

    return { isValid: true };
  };

  // Handle opening the picker
  const openPicker = () => {
    if (disabled) return;
    
    if (Platform.OS === 'ios') {
      setIsModalVisible(true);
    } else {
      // Android: Show picker directly
      setIsModalVisible(true);
    }
  };

  // Handle date change from picker
  const handleDateChange = (event: any, newDate?: Date) => {
    if (Platform.OS === 'android') {
      setIsModalVisible(false);
      
      if (event.type === 'dismissed') {
        return;
      }
    }

    if (newDate) {
      const validation = validateDate(newDate);
      
      if (!validation.isValid) {
        Alert.alert('Invalid Date', validation.message || 'Please select a valid date');
        return;
      }

      setTempDate(newDate);
      
      if (Platform.OS === 'android') {
        // On Android, apply the date immediately
        setSelectedDate(newDate);
        onDateChange(newDate);
      }
    }
  };

  // Handle confirming date on iOS
  const handleConfirm = () => {
    const validation = validateDate(tempDate);
    
    if (!validation.isValid) {
      Alert.alert('Invalid Date', validation.message || 'Please select a valid date');
      return;
    }

    setSelectedDate(tempDate);
    onDateChange(tempDate);
    setIsModalVisible(false);
  };

  // Handle canceling on iOS
  const handleCancel = () => {
    setTempDate(selectedDate);
    setIsModalVisible(false);
  };

  // Clear the date
  const clearDate = () => {
    if (required) {
      Alert.alert('Required Field', 'This date field is required and cannot be cleared.');
      return;
    }
    // Reset to today's date as default
    const today = new Date();
    setSelectedDate(today);
    setTempDate(today);
    onDateChange(today);
  };

  const displayValue = getDisplayValue();
  const hasError = !!errorMessage;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.inputContainer,
          disabled && styles.inputDisabled,
          hasError && styles.inputError,
          style,
        ]}
        onPress={openPicker}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.inputContent}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={disabled ? '#999' : '#666'}
            style={styles.icon}
          />
          <Text
            style={[
              styles.inputText,
              !displayValue && styles.placeholderText,
              disabled && styles.disabledText,
            ]}
          >
            {displayValue || placeholder}
          </Text>
          {displayValue && !required && !disabled && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearDate}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {hasError && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {/* iOS Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={isModalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleCancel}
        >
          <Pressable style={styles.modalOverlay} onPress={handleCancel}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel} style={styles.modalButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {label || 'Select Date'}
                </Text>
                <TouchableOpacity onPress={handleConfirm} style={styles.modalButton}>
                  <Text style={styles.confirmButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={tempDate}
                mode={mode}
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale="en-GB"
                style={styles.picker}
              />
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Android Modal */}
      {Platform.OS === 'android' && isModalVisible && (
        <DateTimePicker
          value={tempDate}
          mode={mode}
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  icon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
  disabledText: {
    color: '#999',
  },
  clearButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 4,
    marginLeft: 4,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  picker: {
    height: 200,
    marginHorizontal: 16,
  },
});

export default DatePickerComponent;
