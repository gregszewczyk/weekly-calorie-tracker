import { format, parse, isValid, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { enGB } from 'date-fns/locale';

/**
 * UK Date Format Utilities
 * Provides common functions for handling DD/MM/YYYY date format
 */

export const UK_DATE_FORMAT = 'dd/MM/yyyy';
export const UK_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const UK_TIME_FORMAT = 'HH:mm';

/**
 * Format a Date object to UK date string (DD/MM/YYYY)
 */
export const formatToUKDate = (date: Date): string => {
  try {
    return format(date, UK_DATE_FORMAT, { locale: enGB });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return date.toLocaleDateString('en-GB');
  }
};

/**
 * Format a Date object to UK datetime string (DD/MM/YYYY HH:MM)
 */
export const formatToUKDateTime = (date: Date): string => {
  try {
    return format(date, UK_DATETIME_FORMAT, { locale: enGB });
  } catch (error) {
    console.warn('DateTime formatting error:', error);
    return date.toLocaleString('en-GB');
  }
};

/**
 * Parse UK date string (DD/MM/YYYY) to Date object
 */
export const parseUKDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;
  
  try {
    const parsed = parse(dateString, UK_DATE_FORMAT, new Date());
    return isValid(parsed) ? parsed : null;
  } catch (error) {
    console.warn('Date parsing error:', error);
    return null;
  }
};

/**
 * Parse UK datetime string (DD/MM/YYYY HH:MM) to Date object
 */
export const parseUKDateTime = (dateTimeString: string): Date | null => {
  if (!dateTimeString || typeof dateTimeString !== 'string') return null;
  
  try {
    const parsed = parse(dateTimeString, UK_DATETIME_FORMAT, new Date());
    return isValid(parsed) ? parsed : null;
  } catch (error) {
    console.warn('DateTime parsing error:', error);
    return null;
  }
};

/**
 * Validate UK date string format
 */
export const isValidUKDateString = (dateString: string): boolean => {
  const parsed = parseUKDate(dateString);
  return parsed !== null;
};

/**
 * Auto-format date string as user types (DD/MM/YYYY)
 */
export const autoFormatUKDate = (input: string): string => {
  // Remove non-numeric characters except forward slashes
  const cleaned = input.replace(/[^\d/]/g, '');
  
  // Auto-add slashes
  let formatted = cleaned;
  
  // Add first slash after day
  if (cleaned.length >= 2 && cleaned.charAt(2) !== '/') {
    formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
  }
  
  // Add second slash after month
  if (formatted.length >= 5 && formatted.charAt(5) !== '/') {
    formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
  }
  
  // Limit to 10 characters (DD/MM/YYYY)
  if (formatted.length > 10) {
    formatted = formatted.slice(0, 10);
  }
  
  return formatted;
};

/**
 * Validate date against constraints
 */
export interface DateValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateDateConstraints = (
  date: Date,
  constraints: {
    minimumDate?: Date;
    maximumDate?: Date;
    allowFuture?: boolean;
    allowPast?: boolean;
  } = {}
): DateValidationResult => {
  if (!isValid(date)) {
    return { isValid: false, message: 'Invalid date' };
  }

  const { minimumDate, maximumDate, allowFuture = true, allowPast = true } = constraints;
  const today = startOfDay(new Date());
  const dateDay = startOfDay(date);

  // Check future dates
  if (!allowFuture && isAfter(dateDay, today)) {
    return { isValid: false, message: 'Future dates are not allowed' };
  }

  // Check past dates
  if (!allowPast && isBefore(dateDay, today)) {
    return { isValid: false, message: 'Past dates are not allowed' };
  }

  // Check minimum date
  if (minimumDate && isBefore(dateDay, startOfDay(minimumDate))) {
    return {
      isValid: false,
      message: `Date must be after ${formatToUKDate(minimumDate)}`,
    };
  }

  // Check maximum date
  if (maximumDate && isAfter(dateDay, startOfDay(maximumDate))) {
    return {
      isValid: false,
      message: `Date must be before ${formatToUKDate(maximumDate)}`,
    };
  }

  return { isValid: true };
};

/**
 * Get common date constraints for different use cases
 */
export const getDateConstraints = (type: 'birthDate' | 'eventDate' | 'appointment' | 'deadline') => {
  const today = new Date();
  
  switch (type) {
    case 'birthDate':
      return {
        minimumDate: new Date(1900, 0, 1),
        maximumDate: new Date(today.getFullYear() - 13, today.getMonth(), today.getDate()),
        allowFuture: false,
        allowPast: true,
      };
    
    case 'eventDate':
      return {
        minimumDate: today,
        maximumDate: new Date(today.getFullYear() + 5, 11, 31),
        allowFuture: true,
        allowPast: false,
      };
    
    case 'appointment':
      return {
        minimumDate: today,
        maximumDate: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()),
        allowFuture: true,
        allowPast: false,
      };
    
    case 'deadline':
      return {
        minimumDate: today,
        maximumDate: new Date(today.getFullYear() + 10, 11, 31),
        allowFuture: true,
        allowPast: false,
      };
    
    default:
      return {
        allowFuture: true,
        allowPast: true,
      };
  }
};

/**
 * Convert various date inputs to UK format string
 */
export const normalizeToUKDate = (input: Date | string | null | undefined): string => {
  if (!input) return '';
  
  if (typeof input === 'string') {
    // Already in string format - validate and return
    const parsed = parseUKDate(input);
    return parsed ? formatToUKDate(parsed) : '';
  }
  
  if (input instanceof Date) {
    return formatToUKDate(input);
  }
  
  return '';
};

/**
 * Create age calculation from birth date
 */
export const calculateAge = (birthDate: Date | string): number | null => {
  const date = typeof birthDate === 'string' ? parseUKDate(birthDate) : birthDate;
  if (!date || !isValid(date)) return null;
  
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format date for display with relative information
 */
export const formatDateWithRelative = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseUKDate(date) : date;
  if (!dateObj || !isValid(dateObj)) return '';
  
  const ukDate = formatToUKDate(dateObj);
  const today = startOfDay(new Date());
  const inputDate = startOfDay(dateObj);
  
  if (inputDate.getTime() === today.getTime()) {
    return `${ukDate} (Today)`;
  }
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (inputDate.getTime() === tomorrow.getTime()) {
    return `${ukDate} (Tomorrow)`;
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (inputDate.getTime() === yesterday.getTime()) {
    return `${ukDate} (Yesterday)`;
  }
  
  return ukDate;
};

/**
 * Common date format presets
 */
export const DATE_PRESETS = {
  today: () => formatToUKDate(new Date()),
  tomorrow: () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatToUKDate(tomorrow);
  },
  nextWeek: () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return formatToUKDate(nextWeek);
  },
  nextMonth: () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return formatToUKDate(nextMonth);
  },
} as const;
