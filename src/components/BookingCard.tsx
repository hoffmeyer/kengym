import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { DisplayBooking } from "../types";
import { fetchBookingDetail } from "../api";
import { queryKeys } from "../queryKeys";
import { useAuth } from "../context/AuthContext";

const LIST_SCROLL_KEY = 'kengym_list_scroll_y';

interface Props {
  booking: DisplayBooking;
}

export default function BookingCard({ booking }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const startDate = new Date(booking.start);
  const endDate = new Date(booking.end);

  const timeRange = `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`;
  const spotsLabel = `${booking.availableSpots} / ${booking.totalSpots}`;

  const fillPct =
    booking.totalSpots > 0
      ? Math.round(
          ((booking.totalSpots - booking.availableSpots) / booking.totalSpots) *
            100,
        )
      : 100;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    sessionStorage.setItem(LIST_SCROLL_KEY, String(window.scrollY));
    const target = `/booking/${booking.id}`;
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => navigate(target, { state: booking }));
      });
    } else {
      navigate(target, { state: booking });
    }
  }

  return (
    <Link
      to={`/booking/${booking.id}`}
      state={booking}
      onPointerEnter={() =>
        queryClient.prefetchQuery({
          queryKey: queryKeys.bookingDetail(booking.id, user?.token),
          queryFn: () => fetchBookingDetail(booking.id, user?.token),
          staleTime: 30 * 1000,
        })
      }
      onClick={handleClick}
      className={`block bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition-all ${
        booking.isBookedByUser && booking.userOnWaitingList
          ? 'border-amber-300 hover:border-amber-400'
          : booking.isBookedByUser
          ? 'border-indigo-300 hover:border-indigo-400'
          : 'border-gray-100 hover:border-indigo-200'
      }`}
    >
      {/*
        Mobile: 2×2 grid
          [time]        [description]
          [badge+btn]   [bar+spots]

        sm+: single flex row
          [time] [description …flex-1] [bar+spots] [badge+btn]
      */}
      <div className="grid grid-cols-[1fr_5rem] grid-rows-2 gap-x-3 gap-y-2 sm:flex sm:flex-row sm:items-center sm:gap-4">
        {/* Time — col1 row1 on mobile; leftmost on desktop */}
        <p className="text-sm font-semibold text-indigo-600 whitespace-nowrap self-center">
          {timeRange}
        </p>

        {/* Bar + spots — col2 row1 on mobile; second-from-right on desktop */}
        {booking.bookingType === "interval" && (
          <div className="flex items-center gap-2 sm:order-3 sm:w-24 sm:shrink-0 self-center">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  booking.isAvailable ? "bg-emerald-400" : "bg-red-400"
                }`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 shrink-0">{spotsLabel}</span>
          </div>
        )}

        {/* Description — col1 row2 on mobile; grows on desktop */}
        <div className="sm:order-2 sm:flex-1 min-w-0 self-center">
          <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
            {booking.title}
          </p>
        </div>

        {/* Badge — col2 row2 on mobile; rightmost on desktop */}
        {booking.bookingType === "interval" && (
          <div className="flex items-center justify-end sm:order-last sm:shrink-0">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                booking.isBookedByUser && booking.userOnWaitingList
                  ? 'bg-amber-100 text-amber-700'
                  : booking.isBookedByUser
                  ? 'bg-indigo-100 text-indigo-700'
                  : booking.isAvailable
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {booking.isBookedByUser
                ? booking.userOnWaitingList
                  ? `I kø (${booking.userWaitingListPosition != null ? booking.userWaitingListPosition : ""})`.trim()
                  : "Tilmeldt"
                : booking.isAvailable
                  ? "Ledig"
                  : "Optaget"}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
