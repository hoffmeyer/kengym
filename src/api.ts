import { type Booking, type DisplayBooking, type ResourceBookings, type BookingDetailResponse } from './types';

const API_BASE = 'https://www.conventus.dk';
const ORGANIZATION_ID = 17742;
const RESOURCE_ID = 44493;

function toDisplayBooking(booking: Booking): DisplayBooking {
  const interval = booking.intervals?.[0];
  const totalSpots = interval?.maxParticipants ?? booking.maxParticipants ?? 0;
  const bookedCount = interval?.numberOfBookings ?? 0;
  const availableSpots = Math.max(0, totalSpots - bookedCount);
  const isAvailable = availableSpots > 0;
  const hasWaitingList = Array.isArray(interval?.waitingList)
    ? interval.waitingList.length > 0
    : false;

  return { ...booking, availableSpots, totalSpots, isAvailable, hasWaitingList };
}

export async function fetchBookings(
  fromDate: Date,
  toDate: Date
): Promise<DisplayBooking[]> {
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`;
  const fmtEnd = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59:59`;

  const response = await fetch(`${API_BASE}/publicBooking/public/getBookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fmt(fromDate),
      to: fmtEnd(toDate),
      organization: { id: ORGANIZATION_ID },
      resourceList: [{ id: RESOURCE_ID }],
      categoryList: [],
      overlap: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data: ResourceBookings[] = await response.json();
  const allBookings: DisplayBooking[] = [];

  for (const resourceEntry of data) {
    for (const booking of resourceEntry.bookings) {
      // Only include interval (online-bookable) bookings
      if (booking.bookingType === 'interval') {
        allBookings.push(toDisplayBooking(booking));
      }
    }
  }

  // Sort by start time ascending
  allBookings.sort((a, b) => a.start - b.start);

  return allBookings;
}

export async function fetchBookingDetail(id: number | string): Promise<BookingDetailResponse> {
  const response = await fetch(
    `${API_BASE}/publicBooking/public/intervalbooking/${id}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
