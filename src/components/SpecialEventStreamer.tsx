import { format } from "date-fns";
import { da } from "date-fns/locale";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";
import type { DisplayBooking } from "../types";

interface Props {
  events: DisplayBooking[];
}

const SWIPE_THRESHOLD = 50; // pixels

export default function SpecialEventStreamer({ events }: Props) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);

  // Auto-rotate events every 5 seconds if there are multiple events
  useEffect(() => {
    if (events.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [events.length]);

  const currentEvent = events[currentIndex];
  const target = `/booking/${currentEvent.id}`;

  function openEvent(e: React.MouseEvent) {
    e.preventDefault();
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => navigate(target));
      });
    } else {
      navigate(target);
    }
  }

  function goToEvent(index: number) {
    setCurrentIndex(index);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartTime.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const distance = touchStartX.current - touchEndX;
    const duration = Date.now() - touchStartTime.current;

    // Swipe is valid if it's faster than 200ms and moves more than threshold
    if (duration < 200 && Math.abs(distance) > SWIPE_THRESHOLD) {
      if (distance > 0) {
        // Swiped left - go to next event
        setCurrentIndex((prev) => (prev + 1) % events.length);
      } else {
        // Swiped right - go to previous event
        setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
      }
    }

    touchStartX.current = null;
    touchStartTime.current = null;
  }

  return (
    <div className="px-4 pt-4">
      <div className="relative">
        <button
          type="button"
          onClick={openEvent}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="special-event-card relative w-full overflow-hidden rounded-2xl px-3 py-2 text-left transition-shadow touch-pan-y"
        >
          <span className="special-event-shimmer" aria-hidden="true" />
          <span className="relative z-10 flex items-center gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 shrink-0">
              Særligt
            </span>
            <span className="special-event-title min-w-0 flex-1 truncate text-sm font-semibold">
              {currentEvent.title}
            </span>
            <span className="text-xs font-medium text-gray-500 capitalize shrink-0">
              {format(new Date(currentEvent.start), "EEE d. MMM", {
                locale: da,
              })}
            </span>
          </span>
        </button>

        {/* Carousel indicators */}
        {events.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {events.map((_, index) => (
              <button
                key={index}
                onClick={() => goToEvent(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-indigo-600 w-6"
                    : "bg-gray-300 w-1.5 hover:bg-gray-400"
                }`}
                aria-label={`Go to event ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
