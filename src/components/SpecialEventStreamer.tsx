import { format } from "date-fns";
import { da } from "date-fns/locale";
import type { DisplayBooking } from "../types";

interface Props {
  event: DisplayBooking;
}

export default function SpecialEventStreamer({ event }: Props) {
  function scrollToEvent() {
    const el = document.getElementById(`booking-${event.id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="px-4 pt-4">
      <button
        type="button"
        onClick={scrollToEvent}
        className="special-event-card relative w-full overflow-hidden rounded-2xl px-3 py-2 text-left transition-shadow"
      >
        <span className="special-event-shimmer" aria-hidden="true" />
        <span className="relative z-10 flex items-center gap-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 shrink-0">
            Særligt
          </span>
          <span className="special-event-title min-w-0 flex-1 truncate text-sm font-semibold">
            {event.title}
          </span>
          <span className="text-xs font-medium text-gray-500 capitalize shrink-0">
            {format(new Date(event.start), "EEE d. MMM", {
              locale: da,
            })}
          </span>
          <span className="shrink-0 text-indigo-400" aria-hidden="true">
            →
          </span>
        </span>
      </button>
    </div>
  );
}
