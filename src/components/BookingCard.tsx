import { format } from 'date-fns';
import type { DisplayBooking } from '../types';

interface Props {
  booking: DisplayBooking;
}

const BOOK_BASE = 'https://www.conventus.dk/dataudv/www/booking_v2_interval.php';
const FORENING_ID = 17742;

export default function BookingCard({ booking }: Props) {
  const startDate = new Date(booking.start);
  const endDate = new Date(booking.end);

  const timeRange = `${format(startDate, 'HH:mm')} – ${format(endDate, 'HH:mm')}`;
  const spotsLabel = `${booking.availableSpots} / ${booking.totalSpots} pladser`;
  const bookUrl = `${BOOK_BASE}?forening=${FORENING_ID}&booking=${booking.id}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 h-full">
      {/* Top row: time + status chip */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-indigo-600">{timeRange}</p>

        {booking.bookingType === 'interval' && (
          <span
            className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              booking.isAvailable
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {booking.isAvailable ? 'Ledig' : 'Optaget'}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">
        {booking.title}
      </p>

      {/* Info snippet */}
      {booking.info && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {booking.info}
        </p>
      )}

      {/* Footer: spots + book button */}
      {booking.bookingType === 'interval' && (
        <div className="flex flex-col gap-2 pt-1 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  booking.isAvailable ? 'bg-emerald-400' : 'bg-red-400'
                }`}
                style={{
                  width: `${
                    booking.totalSpots > 0
                      ? Math.round(
                          ((booking.totalSpots - booking.availableSpots) /
                            booking.totalSpots) *
                            100
                        )
                      : 100
                  }%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-400 shrink-0">{spotsLabel}</span>
          </div>

          <a
            href={bookUrl}
            className={`w-full text-center rounded-lg py-2 text-xs font-medium transition-colors border ${
              booking.isAvailable
                ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                : 'border-amber-200 text-amber-600 hover:bg-amber-50'
            }`}
          >
            {booking.isAvailable ? 'Book' : 'Venteliste'}
          </a>
        </div>
      )}
    </div>
  );
}
