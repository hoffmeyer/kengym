import { format, startOfWeek, endOfWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import type { DisplayBooking } from '../types';
import BookingCard from './BookingCard';

interface Props {
  weekNumber: number;
  bookings: DisplayBooking[];
}

function groupByDay(bookings: DisplayBooking[]): Map<string, DisplayBooking[]> {
  const map = new Map<string, DisplayBooking[]>();
  for (const booking of bookings) {
    const key = format(new Date(booking.start), 'yyyy-MM-dd');
    const existing = map.get(key) ?? [];
    existing.push(booking);
    map.set(key, existing);
  }
  return map;
}

export default function WeekGroup({ weekNumber, bookings }: Props) {
  const firstStart = new Date(bookings[0].start);
  const weekStart = startOfWeek(firstStart, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(firstStart, { weekStartsOn: 1 });
  const dateRange = `${format(weekStart, 'd. MMM', { locale: da })} – ${format(weekEnd, 'd. MMM', { locale: da })}`;

  const byDay = groupByDay(bookings);

  return (
    <section>
      {/* Week heading — sticky at top of viewport */}
      <div className="sticky top-0 z-20 bg-gray-100 flex items-baseline gap-3 px-4 py-2 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">Uge {weekNumber}</h2>
        <span className="text-sm text-gray-400">{dateRange}</span>
      </div>

      {/* Days */}
      <div className="flex flex-col gap-4 px-4 pt-3">
        {[...byDay.entries()].map(([dateKey, dayBookings]) => (
          <div key={dateKey}>
            {/* Day label — sticky just below the week heading (~41px) */}
            <div className="sticky top-[41px] z-10 bg-gray-100 py-1 -mx-4 px-4 mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider capitalize">
                {format(new Date(dateKey), 'EEEE d. MMM', { locale: da })}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {dayBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
