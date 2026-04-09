import { getISOWeek } from 'date-fns';
import type { DisplayBooking } from '../types';
import WeekGroup from './WeekGroup';

interface Props {
  bookings: DisplayBooking[];
  loading: boolean;
  error: string | null;
}

function groupByWeek(bookings: DisplayBooking[]): Map<number, DisplayBooking[]> {
  const map = new Map<number, DisplayBooking[]>();
  for (const booking of bookings) {
    const week = getISOWeek(new Date(booking.start));
    const existing = map.get(week) ?? [];
    existing.push(booking);
    map.set(week, existing);
  }
  return map;
}

export default function BookingList({ bookings, loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-28 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 mt-8 rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-600 font-medium">Kunne ikke hente bookinger</p>
        <p className="text-red-400 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="mx-4 mt-8 rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center">
        <p className="text-gray-500 font-medium">Ingen bookinger fundet</p>
        <p className="text-gray-400 text-sm mt-1">
          Der er ingen holdtræning i den valgte periode.
        </p>
      </div>
    );
  }

  const grouped = groupByWeek(bookings);

  return (
    <div className="flex flex-col gap-8 py-6">
      {[...grouped.entries()].map(([week, weekBookings]) => (
        <WeekGroup key={week} weekNumber={week} bookings={weekBookings} />
      ))}
    </div>
  );
}
