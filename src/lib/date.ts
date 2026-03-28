import { format, isSameMonth, isSameYear, eachDayOfInterval } from 'date-fns';

/**
 * Get user's timezone from browser
 * In a real app, this would first check the user's profile
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format a date range for display
 * Examples:
 * - Same month: "Mar 15 – 18, 2026"
 * - Different months: "Mar 15 – Apr 2, 2026"
 * - Different years: "Dec 28, 2025 – Jan 2, 2026"
 */
export function formatDateRange(start: Date, end: Date): string {
  if (isSameYear(start, end)) {
    if (isSameMonth(start, end)) {
      // Same month: "Mar 15 – 18, 2026"
      return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
    }
    // Different months, same year: "Mar 15 – Apr 2, 2026"
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }
  // Different years: "Dec 28, 2025 – Jan 2, 2026"
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}

/**
 * Format a single date for display
 * Example: "Sun, Mar 15"
 */
export function formatDayLabel(date: Date): string {
  return format(date, 'EEE, MMM d');
}

/**
 * Get all dates in a range (inclusive)
 */
export function getDatesInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

/**
 * Time option for select dropdowns
 */
export interface TimeOption {
  value: string; // "09:00", "09:30", etc.
  label: string; // "9:00 AM", "9:30 AM", etc.
}

/**
 * Generate time options for a select dropdown
 * @param intervalMinutes - Interval between options (default 30)
 * @param startHour - Starting hour (default 6 = 6:00 AM)
 * @param endHour - Ending hour (default 22 = 10:00 PM)
 */
export function generateTimeOptions(
  intervalMinutes: number = 30,
  startHour: number = 6,
  endHour: number = 22
): TimeOption[] {
  const options: TimeOption[] = [];

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      // Skip if we've passed the end hour
      if (hour === endHour && minute > 0) break;

      const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const label = formatTimeValue(value);
      options.push({ value, label });
    }
  }

  return options;
}

/**
 * Format a time value for display
 * "09:00" → "9:00 AM"
 * "14:30" → "2:30 PM"
 */
export function formatTimeValue(time: string): string {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr || '00';

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${displayHour}:${minute} ${period}`;
}

/**
 * Get a short timezone abbreviation from an IANA timezone identifier.
 * "America/Los_Angeles" → "PST" or "PDT" depending on the reference date.
 * Pass the event's date to get the correct DST-aware abbreviation.
 * Works on both server and client (uses Intl API).
 */
export function getTimezoneAbbreviation(timezone: string, referenceDate: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(referenceDate);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Parse a time string to get hours and minutes
 */
export function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Compare two time strings
 * Returns negative if a < b, positive if a > b, 0 if equal
 */
export function compareTime(a: string, b: string): number {
  const timeA = parseTime(a);
  const timeB = parseTime(b);

  const minutesA = timeA.hours * 60 + timeA.minutes;
  const minutesB = timeB.hours * 60 + timeB.minutes;

  return minutesA - minutesB;
}

/**
 * Parse an ISO date-only string ("YYYY-MM-DD") as a local calendar date.
 * Using `new Date("YYYY-MM-DD")` parses as UTC and can shift the displayed day
 * in US timezones.
 */
export function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format an ISO date-only string without timezone drift.
 */
export function formatDateOnly(
  dateString: string,
  options: Intl.DateTimeFormatOptions,
  locale: string = 'en-US'
): string {
  return parseDateOnly(dateString).toLocaleDateString(locale, options);
}

/**
 * True when dateString is on or after the local calendar day of referenceDate.
 */
export function isOnOrAfterLocalDay(
  dateString: string,
  referenceDate: Date = new Date()
): boolean {
  const eventDay = parseDateOnly(dateString).getTime();
  const referenceDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();
  return eventDay >= referenceDay;
}

// ============================================
// STRING-INPUT FORMATTING (for DB / API values)
// ============================================

/**
 * Format a date string for display.
 * Handles both date-only ("YYYY-MM-DD") and timestamp ("YYYY-MM-DDTHH:mm:ss") strings.
 * "2026-03-18" → "Mar 18, 2026"
 */
export function formatDate(dateString: string): string {
  return parseDateOnly(dateString.split('T')[0]).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date range from string inputs.
 * "2026-03-18", "2026-03-20" → "Mar 18 – 20, 2026"
 * Uses parseDateOnly internally, then delegates to formatDateRange.
 */
export function formatDateRangeStr(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return formatDate(startDate);
  }
  return formatDateRange(parseDateOnly(startDate), parseDateOnly(endDate));
}

/**
 * Format a date for schedule display with weekday.
 * "2026-03-18" → "Wed, Mar 18"
 */
export function formatScheduleDate(dateString: string): string {
  return parseDateOnly(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Convert a timestamptz ISO string to a local date string (YYYY-MM-DD)
 * in the given IANA timezone. Ensures the date reflects the event's local
 * calendar day rather than the UTC day (which can differ for early/late times
 * in positive UTC offsets).
 */
export function timestampToLocalDate(isoTimestamp: string, timeZone: string): string {
  return new Date(isoTimestamp).toLocaleDateString('en-CA', { timeZone });
}

/**
 * Format a timestamp as a human-readable relative time.
 * Takes a full ISO timestamp (timestamptz from DB).
 * "2026-03-04T12:00:00Z" → "5m ago", "2h ago", "Yesterday", "3d ago", or "Mar 4"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
