import { useEffect, useState } from 'react';
import { addDays } from 'date-fns';
import { fetchBookings } from './api';
import type { DisplayBooking } from './types';
import Header from './components/Header';
import BookingList from './components/BookingList';

export default function App() {
  const [bookings, setBookings] = useState<DisplayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const fourWeeksLater = addDays(today, 28);

    fetchBookings(today, fourWeeksLater)
      .then(setBookings)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-2xl mx-auto">
        <BookingList bookings={bookings} loading={loading} error={error} />
      </main>
    </div>
  );
}
