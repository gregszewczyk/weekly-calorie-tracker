/**
 * UK Date Picker Components
 * Export all date picker related components and utilities
 */

// Main Components
export { default as DatePickerComponent } from './DatePickerComponent';
export { default as UKDateInput } from './UKDateInput';

// Types
export type { DatePickerProps } from './DatePickerComponent';
export type { UKDateInputProps } from './UKDateInput';

// Utilities
export * from '../utils/UKDateUtils';

// Re-export for convenience
export {
  formatToUKDate,
  parseUKDate,
  autoFormatUKDate,
  validateDateConstraints,
  getDateConstraints,
  normalizeToUKDate,
  calculateAge,
  formatDateWithRelative,
  DATE_PRESETS,
  UK_DATE_FORMAT,
  UK_DATETIME_FORMAT,
  UK_TIME_FORMAT,
} from '../utils/UKDateUtils';

export type { DateValidationResult } from '../utils/UKDateUtils';
