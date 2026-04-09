import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import type { DisplayBooking } from '../types';

interface Props {
  booking: DisplayBooking;
}

export default function BookingCard({ booking }: Props) {
  const startDate = new Date(booking.start);
  const endDate = new Date(booking.end);

  const timeRange = `${format(startDate, 'HH:mm')} – ${format(endDate, 'HH:mm')}`;
  const spotsLabel = `${booking.availableSpots} / ${booking.totalSpots} pladser`;

  const fillPct =
    booking.totalSpots > 0
      ? Math.round(
          ((booking.totalSpots - booking.availableSpots) / booking.totalSpots) * 100
        )
      : 100;

  return (
    <Link
      to={`/booking/${booking.id}`}
      state={booking}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-md transition-all"
    >
      {/*
        Mobile: 2×2 grid
          [time]        [description]
          [badge+btn]   [bar+spots]

        sm+: single flex row
          [time] [description …flex-1] [bar+spots] [badge+btn]
      */}
      <div className="grid grid-cols-[1fr_auto] grid-rows-2 gap-x-3 gap-y-2 sm:flex sm:flex-row sm:items-center sm:gap-4">

        {/* Time — col1 row1 on mobile; leftmost on desktop */}
        <p className="text-sm font-semibold text-indigo-600 whitespace-nowrap self-center">
          {timeRange}
        </p>

        {/* Badge — col2 row1 on mobile; rightmost on desktop */}
        {booking.bookingType === 'interval' && (
          <div className="flex items-center justify-end sm:order-last sm:shrink-0">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                booking.isAvailable
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {booking.isAvailable ? 'Ledig' : 'Optaget'}
            </span>
          </div>
        )}

        {/* Description — col1 row2 on mobile; grows on desktop */}
        <div className="sm:flex-1 min-w-0 self-center">
          <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
            {booking.title}
          </p>
          {booking.info && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-1 mt-0.5">
              {booking.info}
            </p>
          )}
        </div>

        {/* Bar + spots — col2 row2 on mobile; second-from-right on desktop */}
        {booking.bookingType === 'interval' && (
          <div className="flex items-center gap-2 sm:w-40 sm:shrink-0 self-center">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  booking.isAvailable ? 'bg-emerald-400' : 'bg-red-400'
                }`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 shrink-0">{spotsLabel}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
