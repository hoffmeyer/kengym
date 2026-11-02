import { format, getISODay } from "date-fns";

export interface BookingFilter {
  /** Inclusive start date as yyyy-MM-dd */
  from: string | null;
  /** Inclusive end date as yyyy-MM-dd */
  to: string | null;
  /** ISO weekdays (1 = Monday, 7 = Sunday). Empty means every weekday. */
  weekdays: number[];
}

export const EMPTY_BOOKING_FILTER: BookingFilter = {
  from: null,
  to: null,
  weekdays: [],
};

export const WEEKDAYS = [
  { day: 1, letter: "M", name: "Mandag" },
  { day: 2, letter: "T", name: "Tirsdag" },
  { day: 3, letter: "O", name: "Onsdag" },
  { day: 4, letter: "T", name: "Torsdag" },
  { day: 5, letter: "F", name: "Fredag" },
  { day: 6, letter: "L", name: "Lørdag" },
  { day: 7, letter: "S", name: "Søndag" },
];

const STORAGE_KEY = "kengym_list_booking_filter";

export function isBookingFilterActive(filter: BookingFilter): boolean {
  return (
    filter.from !== null || filter.to !== null || filter.weekdays.length > 0
  );
}

export function matchesBookingFilter(
  booking: { start: number },
  filter: BookingFilter,
): boolean {
  // yyyy-MM-dd strings sort chronologically and compare by local calendar day
  const day = format(booking.start, "yyyy-MM-dd");
  if (filter.from !== null && day < filter.from) return false;
  if (filter.to !== null && day > filter.to) return false;
  return (
    filter.weekdays.length === 0 ||
    filter.weekdays.includes(getISODay(booking.start))
  );
}

function isDateOrNull(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

export function loadBookingFilter(): BookingFilter {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (
      isDateOrNull(parsed?.from) &&
      isDateOrNull(parsed?.to) &&
      Array.isArray(parsed?.weekdays) &&
      parsed.weekdays.every((d: unknown) => typeof d === "number")
    ) {
      return { from: parsed.from, to: parsed.to, weekdays: parsed.weekdays };
    }
  } catch {
    // Invalid JSON falls through to the empty filter
  }
  return EMPTY_BOOKING_FILTER;
}

export function saveBookingFilter(filter: BookingFilter): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
}
