/**
 * Utility functions for formatting data in the application
 */

/**
 * Format a number to have exactly 2 decimal places
 * @param value The number to format
 * @returns The formatted number string with 2 decimal places
 */
export const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00';
  }
  return value.toFixed(2);
};

/**
 * Format a percentage value to have exactly 2 decimal places
 * @param value The percentage value to format
 * @returns The formatted percentage string with 2 decimal places and % symbol
 */
export const formatPercent = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00%';
  }
  return `${value.toFixed(2)}%`;
}; 