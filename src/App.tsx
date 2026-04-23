import { Routes, Route } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { addDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { fetchBookings, fetchMemberBookings, UnauthorizedError } from './api';
import { useAuth } from './context/AuthContext';
import { queryKeys } from './queryKeys';
import type { DisplayBooking } from './types';
import Header from './components/Header';
import BookingList from './components/BookingList';
import BookingDetail from './pages/BookingDetail';

type Filter = 'all' | 'mine';

const LIST_SCROLL_KEY = 'kengym_list_scroll_y';
const LIST_FILTER_KEY = 'kengym_list_filter';

function ListPage() {
  const { user, logout } = useAuth();
  const [filter, setFilter] = useState<Filter>(
    () => (sessionStorage.getItem(LIST_FILTER_KEY) as Filter | null) ?? 'all'
  );

  function applyFilter(f: Filter) {
    sessionStorage.setItem(LIST_FILTER_KEY, f);
    setFilter(f);
  }
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 200); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const today = useMemo(() => new Date(), []);
  const fourWeeksLater = useMemo(() => addDays(today, 28), [today]);

  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookings(),
    queryFn: () => fetchBookings(today, fourWeeksLater),
  });

  const memberBookingsQuery = useQuery({
    queryKey: queryKeys.memberBookings(user?.token ?? ''),
    queryFn: () => fetchMemberBookings(user!.token),
    enabled: !!user,
  });

  useEffect(() => {
    if (memberBookingsQuery.error instanceof UnauthorizedError) {
      logout();
    }
  }, [memberBookingsQuery.error, logout]);

  const loading = bookingsQuery.isLoading || (!!user && memberBookingsQuery.isLoading);
  const error = bookingsQuery.error?.message ?? memberBookingsQuery.error?.message ?? null;

  // Restore saved scroll position after the list has finished loading
  useEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem(LIST_SCROLL_KEY);
    if (!saved) return;
    sessionStorage.removeItem(LIST_SCROLL_KEY);
    const y = parseInt(saved, 10);
    requestAnimationFrame(() => window.scrollTo(0, y));
  }, [loading]);

  const bookings = useMemo<DisplayBooking[]>(() => {
    const all = bookingsQuery.data ?? [];
    const memberMap = memberBookingsQuery.data;
    if (!memberMap) return all;
    return all.map((b) => {
      const entry = memberMap.get(b.id);
      if (!entry) return b;
      return {
        ...b,
        isBookedByUser: true,
        userBookingInIntervalId: entry.bookingInIntervalId,
        userOnWaitingList: entry.onWaitingList,
        userWaitingListPosition: entry.waitingListPosition,
      };
    });
  }, [bookingsQuery.data, memberBookingsQuery.data]);

  const visibleBookings =
    filter === 'mine' ? bookings.filter((b) => b.isBookedByUser) : bookings;

  return (
    <main className="max-w-2xl mx-auto">
      {scrolled && (
        <div className="fixed top-4 left-0 right-0 z-50 pointer-events-none">
          <div className="max-w-2xl mx-auto px-4 flex justify-end">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="pointer-events-auto rounded-full bg-white border border-gray-200 shadow-md px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
            >
              ↑ Top
            </button>
          </div>
        </div>
      )}
      {/* Filter toggle */}
      {user && !loading && (
        <div className="flex gap-2 px-4 pt-4">
          <button
            onClick={() => applyFilter('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => applyFilter('mine')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === 'mine'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            Mine
          </button>
        </div>
      )}
      <BookingList bookings={visibleBookings} loading={loading} error={error} />
    </main>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/booking/:id" element={<BookingDetail />} />
      </Routes>
    </div>
  );
}
