import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format, parse, isValid } from 'date-fns';
import { enGB } from 'date-fns/locale';

export interface UKDateInputProps {
  label?: string;
  value?: string; // DD/MM/YYYY format
  onDateChange: (dateString: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  errorMessage?: string;
  style?: any;
  allowManualInput?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
}

const UKDateInput: React.FC<UKDateInputProps> = ({
  label,
  value = '',
  onDateChange,
  placeholder = 'DD/MM/YYYY',
  disabled = false,
  required = false,
  errorMessage,
  style,
  allowManualInput = true,
  minimumDate,
  maximumDate,
}) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Convert DD/MM/YYYY string to Date object
  const parseUKDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const parsed = parse(dateString, 'dd/MM/yyyy', new Date());
    return isValid(parsed) ? parsed : null;
  };

  // Format Date object to DD/MM/YYYY string
  const formatToUKDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy', { locale: enGB });
  };

  // Get current date for picker
  const getCurrentDate = (): Date => {
    const parsed = parseUKDate(inputValue);
    return parsed || new Date();
  };

  // Handle manual text input
  const handleTextChange = (text: string) => {
    // Allow only numbers and forward slashes
    const cleaned = text.replace(/[^\d/]/g, '');
    
    // Auto-format as user types
    let formatted = cleaned;
    if (cleaned.length >= 2 && cleaned.charAt(2) !== '/') {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (formatted.length >= 5 && formatted.charAt(5) !== '/') {
      formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
    }
    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10);
    }

    setInputValue(formatted);
  };

  // Handle text input blur (validation)
  const handleTextBlur = () => {
    if (!inputValue) {
      onDateChange('');
      return;
    }

    const parsed = parseUKDate(inputValue);
    if (parsed) {
      const formattedDate = formatToUKDate(parsed);
      setInputValue(formattedDate);
      onDateChange(formattedDate);
    } else {
      // Invalid date - revert to previous value or clear
      setInputValue(value);
    }
  };

  // Handle date picker
  const handlePickerChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setIsPickerVisible(false);
    }

    if (selectedDate && event.type !== 'dismissed') {
      const formattedDate = formatToUKDate(selectedDate);
      setInputValue(formattedDate);
      onDateChange(formattedDate);
      
      if (Platform.OS === 'ios') {
        setIsPickerVisible(false);
      }
    } else if (Platform.OS === 'android' && event.type === 'dismissed') {
      // User cancelled on Android
      setIsPickerVisible(false);
    }
  };

  // Open calendar picker
  const openPicker = () => {
    if (disabled) return;
    setIsPickerVisible(true);
  };

  // Clear the input
  const clearInput = () => {
    if (required) return;
    setInputValue('');
    onDateChange('');
  };

  const hasError = !!errorMessage;
  const hasValue = !!inputValue;

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <View style={[styles.inputWrapper, hasError && styles.inputWrapperError]}>
        {allowManualInput ? (
          <TextInput
            style={[
              styles.textInput,
              disabled && styles.textInputDisabled,
              style,
            ]}
            value={inputValue}
            onChangeText={handleTextChange}
            onBlur={handleTextBlur}
            placeholder={placeholder}
            placeholderTextColor="#999"
            editable={!disabled}
            keyboardType="numeric"
            maxLength={10}
            returnKeyType="done"
          />
        ) : (
          <TouchableOpacity
            style={[
              styles.touchableInput,
              disabled && styles.touchableInputDisabled,
              style,
            ]}
            onPress={openPicker}
            disabled={disabled}
          >
            <Text
              style={[
                styles.touchableInputText,
                !hasValue && styles.touchableInputPlaceholder,
                disabled && styles.touchableInputTextDisabled,
              ]}
            >
              {inputValue || placeholder}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.iconContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={openPicker}
            disabled={disabled}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={disabled ? '#ccc' : '#666'}
            />
          </TouchableOpacity>
          
          {hasValue && !required && !disabled && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={clearInput}
            >
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {hasError && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {/* Date Picker Modal for iOS */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={isPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsPickerVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsPickerVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setIsPickerVisible(false)}
                  style={styles.doneButton}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={getCurrentDate()}
                mode="date"
                display="spinner"
                onChange={handlePickerChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale="en-GB"
              />
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Date Picker for Android */}
      {Platform.OS === 'android' && isPickerVisible && (
        <DateTimePicker
          value={getCurrentDate()}
          mode="date"
          display="default"
          onChange={handlePickerChange}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textInputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  touchableInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  touchableInputDisabled: {
    backgroundColor: '#f5f5f5',
  },
  touchableInputText: {
    fontSize: 16,
    color: '#333',
  },
  touchableInputPlaceholder: {
    color: '#999',
    fontStyle: 'italic',
  },
  touchableInputTextDisabled: {
    color: '#999',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iconButton: {
    padding: 8,
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  doneButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
});

export default UKDateInput;
