import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { addDays } from 'date-fns';
import { fetchBookings, fetchBookingDetail, bookSession } from '../api';
import { useAuth } from '../context/AuthContext';
import type { DisplayBooking, BookingDetailResponse } from '../types';

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState<DisplayBooking | null>(
    state as DisplayBooking | null
  );
  const [detail, setDetail] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(!state);
  const [detailLoading, setDetailLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const loadDetail = useCallback(() => {
    if (!id) return;
    setDetailLoading(true);
    fetchBookingDetail(id)
      .then(setDetail)
      .catch(() => {/* silently ignore */})
      .finally(() => setDetailLoading(false));
  }, [id]);

  // Fallback: fetch list if we arrived via direct URL (no router state)
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

  // Fetch detailed data (participants) for this booking
  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  async function handleBook() {
    if (!booking || !user) return;
    const detailInterval = detail?.booking?.intervals?.[0];
    if (!detailInterval) return;

    setBookingInProgress(true);
    setBookingError(null);
    try {
      await bookSession(booking, detailInterval, user.token);
      loadDetail();
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Booking fejlede');
    } finally {
      setBookingInProgress(false);
    }
  }

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

  const filledPct =
    booking.totalSpots > 0
      ? Math.round(
          ((booking.totalSpots - booking.availableSpots) / booking.totalSpots) * 100
        )
      : 100;

  // Participant data from detail API
  const detailInterval = detail?.booking?.intervals?.[0];
  const showNames = detail?.settings?.combinedSettings?.showPersonsName ?? false;
  const showWaitingPublic = detail?.settings?.combinedSettings?.showWaitingListPublic ?? false;
  const participants = showNames ? (detailInterval?.bookings ?? []) : [];
  const waitingList = showWaitingPublic ? (detailInterval?.waitingList ?? []) : [];
  const waitingCount = detailInterval?.numberOfWaitingListEntries ?? 0;

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

        {/* Spots fill bar */}
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
        </div>

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

        {/* Participants */}
        {!detailLoading && showNames && (
          <div className="border-t border-gray-50 pt-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Tilmeldte ({detailInterval?.numberOfBookings ?? 0})
            </p>
            {participants.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {participants.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-5 text-right text-gray-300 text-xs shrink-0">{i + 1}</span>
                    {p.bookedTo?.name ?? '–'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">Ingen tilmeldte</p>
            )}

            {/* Waiting list */}
            {showWaitingPublic && waitingCount > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
                  Venteliste ({waitingCount})
                </p>
                <ul className="flex flex-col gap-1">
                  {waitingList.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 text-sm text-amber-700">
                      <span className="w-5 text-right text-gray-300 text-xs shrink-0">{i + 1}</span>
                      {p.bookedTo?.name ?? '–'}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Book / Venteliste button */}
        {user ? (
          <div className="flex flex-col gap-2 mt-1">
            {bookingError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {bookingError}
              </p>
            )}
            <button
              onClick={handleBook}
              disabled={bookingInProgress || !detail}
              className={`w-full text-center rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
                booking.isAvailable
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {bookingInProgress
                ? 'Booker…'
                : booking.isAvailable
                ? 'Book plads'
                : 'Tilmeld venteliste'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-center text-gray-400 mt-1">
            <span className="text-indigo-600 font-medium">Log ind</span> for at booke en plads
          </p>
        )}
      </div>
    </main>
  );
}
