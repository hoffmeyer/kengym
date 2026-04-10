import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { addDays } from 'date-fns';
import { fetchBookings, fetchMemberBookings } from './api';
import { useAuth } from './context/AuthContext';
import type { DisplayBooking } from './types';
import Header from './components/Header';
import BookingList from './components/BookingList';
import BookingDetail from './pages/BookingDetail';

type Filter = 'all' | 'mine';

function ListPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<DisplayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    const today = new Date();
    const fourWeeksLater = addDays(today, 28);
    setLoading(true);

    const allBookingsPromise = fetchBookings(today, fourWeeksLater);
    const memberBookingsPromise = user
      ? fetchMemberBookings(user.token)
      : Promise.resolve(new Map<number, { bookingInIntervalId: number; onWaitingList: boolean }>());

    Promise.all([allBookingsPromise, memberBookingsPromise])
      .then(([all, memberMap]) => {
        const enriched = all.map((b) => {
          const entry = memberMap.get(b.id);
          if (!entry) return b;
          return {
            ...b,
            isBookedByUser: true,
            userBookingInIntervalId: entry.bookingInIntervalId,
            userOnWaitingList: entry.onWaitingList,
          };
        });
        setBookings(enriched);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const visibleBookings =
    filter === 'mine' ? bookings.filter((b) => b.isBookedByUser) : bookings;

  return (
    <main className="max-w-2xl mx-auto">
      {/* Filter toggle */}
      {user && !loading && (
        <div className="flex gap-2 px-4 pt-4">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setFilter('mine')}
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
