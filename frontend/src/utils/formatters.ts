/**
 * Shared formatting utilities for the Travel Expense Manager frontend.
 */

/**
 * Format a number as GBP currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};

/**
 * Format a number as GBP currency, or return empty string if zero
 */
export const formatCurrencyOrBlank = (amount: number): string => {
  return amount > 0 ? formatCurrency(amount) : '';
};

/**
 * Format a date string using locale date format
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

/**
 * Format a date with day name and ISO date (e.g., "Monday 2024-01-15")
 */
export const formatDateWithDay = (dateString: string): string => {
  const date = new Date(dateString);
  const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const isoDate = date.toISOString().split('T')[0];
  return `${dayName} ${isoDate}`;
};

/**
 * Format a trip name from start and end dates
 * e.g., "Trip: Mon 15 - Fri 19 January"
 */
export const formatTripName = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startDayShort = start.toLocaleDateString('en-GB', { weekday: 'short' });
  const endDayShort = end.toLocaleDateString('en-GB', { weekday: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear()) {
    const startMonthShort = start.toLocaleDateString('en-GB', { month: 'short' });
    const endMonthShort = end.toLocaleDateString('en-GB', { month: 'short' });
    return `Trip: ${startDayShort} ${startDay} ${startMonthShort} - ${endDayShort} ${endDay} ${endMonthShort}`;
  }

  const monthName = start.toLocaleDateString('en-GB', { month: 'long' });
  return `Trip: ${startDayShort} ${startDay} - ${endDayShort} ${endDay} ${monthName}`;
};

/**
 * Format a date range with day names
 * e.g., "Monday 2024-01-15 - Friday 2024-01-19"
 */
export const formatDateRange = (startDate: string, endDate: string): string => {
  return `${formatDateWithDay(startDate)} - ${formatDateWithDay(endDate)}`;
};

/**
 * Format a month number as month name
 */
export const formatMonthName = (month: number): string => {
  return new Date(0, month - 1).toLocaleString('en-GB', { month: 'long' });
};
