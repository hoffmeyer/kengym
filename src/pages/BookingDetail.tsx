import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { addDays } from 'date-fns';
import { fetchBookings } from '../api';
import type { DisplayBooking } from '../types';

const BOOK_BASE = 'https://www.conventus.dk/dataudv/www/booking_v2_interval.php';
const FORENING_ID = 17742;

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<DisplayBooking | null>(
    state as DisplayBooking | null
  );
  const [loading, setLoading] = useState(!state);
  const [error, setError] = useState<string | null>(null);

  // Fallback: fetch all bookings if we arrived via direct URL (no state)
  useEffect(() => {
    if (state) return;

    const today = new Date();
    fetchBookings(today, addDays(today, 28))
      .then((bookings) => {
        const found = bookings.find((b) => String(b.id) === id);
        if (found) {
          setBooking(found);
        } else {
          setError('Booking ikke fundet.');
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, state]);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 pt-6 animate-pulse">
        <div className="h-4 w-20 bg-gray-200 rounded mb-6" />
        <div className="h-8 w-3/4 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-1/3 bg-gray-200 rounded" />
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="max-w-2xl mx-auto px-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-indigo-600 flex items-center gap-1 mb-6"
        >
          ← Tilbage
        </button>
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-600 font-medium">{error ?? 'Booking ikke fundet.'}</p>
        </div>
      </main>
    );
  }

  const startDate = new Date(booking.start);
  const endDate = new Date(booking.end);
  const interval = booking.intervals?.[0];
  const waitingCount = interval?.numberOfWaitingListEntries ?? 0;
  const bookUrl = `${BOOK_BASE}?forening=${FORENING_ID}&booking=${booking.id}`;

  const filledPct =
    booking.totalSpots > 0
      ? Math.round(
          ((booking.totalSpots - booking.availableSpots) / booking.totalSpots) * 100
        )
      : 100;

  return (
    <main className="max-w-2xl mx-auto px-4 pt-4 pb-10">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-indigo-600 flex items-center gap-1 mb-5 hover:text-indigo-800 transition-colors"
      >
        ← Tilbage
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">

        {/* Title + status */}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            {booking.title}
          </h1>
          <span
            className={`shrink-0 mt-0.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              booking.isAvailable
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {booking.isAvailable ? 'Ledig' : 'Optaget'}
          </span>
        </div>

        {/* Date & time */}
        <div className="flex flex-col gap-1">
          <p className="text-base font-medium text-gray-800 capitalize">
            {format(startDate, 'EEEE d. MMMM yyyy', { locale: da })}
          </p>
          <p className="text-sm text-gray-500">
            {format(startDate, 'HH:mm')} – {format(endDate, 'HH:mm')}
          </p>
        </div>

        {/* Spots */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Pladser</span>
            <span className="text-gray-500">
              {booking.availableSpots} ledige af {booking.totalSpots}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                booking.isAvailable ? 'bg-emerald-400' : 'bg-red-400'
              }`}
              style={{ width: `${filledPct}%` }}
            />
          </div>
          {!booking.isAvailable && waitingCount > 0 && (
            <p className="text-xs text-amber-600 font-medium">
              {waitingCount} {waitingCount === 1 ? 'person' : 'personer'} på venteliste
            </p>
          )}
        </div>

        {/* Meta details */}
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm border-t border-gray-50 pt-4">
          <dt className="text-gray-400 font-medium">Lokale</dt>
          <dd className="text-gray-700">{booking.resource.name}</dd>

          {booking.organizationalUnit?.name && (
            <>
              <dt className="text-gray-400 font-medium">Afdeling</dt>
              <dd className="text-gray-700">{booking.organizationalUnit.name}</dd>
            </>
          )}

          {booking.bookingGroups?.length > 0 && (
            <>
              <dt className="text-gray-400 font-medium">Gruppe</dt>
              <dd className="text-gray-700">{booking.bookingGroups[0].name}</dd>
            </>
          )}
        </dl>

        {/* Optional description */}
        {booking.info && (
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Beskrivelse
            </p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {booking.info}
            </p>
          </div>
        )}

        {/* Book / Venteliste button */}
        <a
          href={bookUrl}
          className={`w-full text-center rounded-xl py-3 text-sm font-semibold transition-colors mt-1 ${
            booking.isAvailable
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {booking.isAvailable ? 'Book plads' : 'Tilmeld venteliste'}
        </a>
      </div>
    </main>
  );
}
