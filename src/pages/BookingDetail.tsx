import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { addDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBookings, fetchBookingDetail, bookSession, cancelBooking } from '../api';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../queryKeys';
import type { DisplayBooking, BookingDetailResponse } from '../types';
import LoginModal from '../components/LoginModal';

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showLogin, setShowLogin] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // If navigated directly (no router state), fall back to the list query
  const listQuery = useQuery({
    queryKey: queryKeys.bookings(),
    queryFn: () => fetchBookings(new Date(), addDays(new Date(), 28)),
    enabled: !state,
  });

  const booking: DisplayBooking | null =
    (state as DisplayBooking | null) ??
    listQuery.data?.find((b) => String(b.id) === id) ??
    null;

  const loading = !state && listQuery.isLoading;
  const error = !state && !booking && !listQuery.isLoading
    ? (listQuery.error?.message ?? 'Booking ikke fundet.')
    : null;

  const detailQuery = useQuery<BookingDetailResponse>({
    queryKey: queryKeys.bookingDetail(id!, user?.token),
    queryFn: () => fetchBookingDetail(id!, user?.token),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  const detail = detailQuery.data ?? null;
  const detailLoading = detailQuery.isLoading;

  const bookMutation = useMutation({
    mutationFn: () => {
      const detailInterval = detail?.booking?.intervals?.[0];
      if (!booking || !user || !detailInterval) throw new Error('Manglende data');
      return bookSession(booking, detailInterval, user.token);
    },
    onSuccess: () => {
      setBookingError(null);
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      setBookingError(err instanceof Error ? err.message : 'Booking fejlede');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!booking || !user || !userEntry) throw new Error('Manglende data');
      return cancelBooking(booking.id, userEntry.id, user.token);
    },
    onSuccess: () => {
      setBookingError(null);
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      setBookingError(err instanceof Error ? err.message : 'Annullering fejlede');
    },
  });

  const bookingInProgress = bookMutation.isPending || cancelMutation.isPending;

  // Trigger a back view transition when the browser's own back button is used.
  // navigate(-1) is async (fires popstate later), so we wait for React to paint.
  useEffect(() => {
    function handlePopState() {
      if (!('startViewTransition' in document)) return;
      document.documentElement.dataset.navDir = 'back';
      const t = (document as any).startViewTransition(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      });
      t.finished.then(() => { delete document.documentElement.dataset.navDir; });
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // navigate('/') is a synchronous push — flushSync makes React commit inside startViewTransition
  function navigateBack() {
    document.documentElement.dataset.navDir = 'back';
    if ('startViewTransition' in document) {
      const t = (document as any).startViewTransition(() => {
        flushSync(() => navigate('/'));
      });
      t.finished.then(() => { delete document.documentElement.dataset.navDir; });
    } else {
      navigate('/');
      delete (document as Document).documentElement.dataset.navDir;
    }
  }

  async function handleBook() {
    setBookingError(null);
    bookMutation.mutate();
  }

  async function handleCancel() {
    setBookingError(null);
    cancelMutation.mutate();
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
          onClick={navigateBack}
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

  // Check if logged-in user is in participants or waiting list by memberId
  const allEntries = [
    ...(detailInterval?.bookings ?? []),
    ...(detailInterval?.waitingList ?? []),
  ];
  const userEntry = user
    ? allEntries.find((e) => e.bookedTo?.id === user.memberId)
    : null;
  const isBooked = !!userEntry;

  const waitingListEntries = detailInterval?.waitingList ?? [];
  const userWaitingIndex = user
    ? waitingListEntries.findIndex((e) => e.bookedTo?.id === user.memberId)
    : -1;
  const userWaitingPosition = userWaitingIndex >= 0 ? userWaitingIndex + 1 : null;

  return (
    <>
    <main className="max-w-2xl mx-auto px-4 pt-4 pb-10">
      {/* Back button */}
      <button
        onClick={navigateBack}
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

        {/* Waiting list position banner */}
        {userWaitingPosition !== null && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-medium text-amber-800">
            Du er nr. {userWaitingPosition} på ventelisten
          </div>
        )}

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

        {/* Book / Cancel / Venteliste button */}
        {user ? (
          <div className="flex flex-col gap-2 mt-1">
            {bookingError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {bookingError}
              </p>
            )}
            {isBooked ? (
              <button
                onClick={handleCancel}
                disabled={bookingInProgress || !detail}
                className="w-full text-center rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-60 border border-red-200 text-red-600 hover:bg-red-50"
              >
                {bookingInProgress ? 'Annullerer…' : 'Annuller'}
              </button>
            ) : (
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
            )}
          </div>
        ) : (
          <p className="text-sm text-center text-gray-400 mt-1">
            <button
              onClick={() => setShowLogin(true)}
              className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
            >
              Log ind
            </button>{' '}
            for at booke en plads
          </p>
        )}
      </div>
    </main>

    {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
