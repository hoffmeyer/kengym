import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { addDays } from 'date-fns';
import { fetchBookings } from './api';
import type { DisplayBooking } from './types';
import Header from './components/Header';
import BookingList from './components/BookingList';
import BookingDetail from './pages/BookingDetail';

function ListPage() {
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
    <main className="max-w-2xl mx-auto">
      <BookingList bookings={bookings} loading={loading} error={error} />
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
