import { useEffect, useRef, useState } from "react";
import {
  EMPTY_BOOKING_FILTER,
  WEEKDAYS,
  isBookingFilterActive,
  type BookingFilter,
} from "../utils/bookingFilter";

interface Props {
  value: BookingFilter;
  onChange: (filter: BookingFilter) => void;
  /** Earliest selectable date as yyyy-MM-dd */
  minDate: string;
  /** Latest selectable date as yyyy-MM-dd */
  maxDate: string;
}

const DATE_INPUT_CLASS =
  "w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none";

export default function BookingFilterPopover({
  value,
  onChange,
  minDate,
  maxDate,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = isBookingFilterActive(value);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function toggleWeekday(day: number) {
    const weekdays = value.weekdays.includes(day)
      ? value.weekdays.filter((d) => d !== day)
      : [...value.weekdays, day];
    onChange({ ...value, weekdays });
  }

  return (
    // Not positioned, so the panel is placed against the filter row
    <div ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Filter"
        title="Filter"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`flex h-full items-center rounded-full px-3 py-1.5 transition-colors ${
          active
            ? "bg-indigo-600 text-white"
            : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
        }`}
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 5h18l-7 8.5V19l-4 2v-7.5L3 5z" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Filter"
          className="absolute top-full left-4 right-4 z-40 mt-2 flex max-w-sm flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-gray-700">
              Fra
              <input
                type="date"
                value={value.from ?? ""}
                min={minDate}
                max={value.to ?? maxDate}
                onChange={(e) =>
                  onChange({ ...value, from: e.target.value || null })
                }
                className={DATE_INPUT_CLASS}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-gray-700">
              Til
              <input
                type="date"
                value={value.to ?? ""}
                min={value.from ?? minDate}
                max={maxDate}
                onChange={(e) =>
                  onChange({ ...value, to: e.target.value || null })
                }
                className={DATE_INPUT_CLASS}
              />
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Ugedage</span>
            <div className="flex justify-between gap-1">
              {WEEKDAYS.map(({ day, letter, name }) => {
                const pressed = value.weekdays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    title={name}
                    aria-label={name}
                    aria-pressed={pressed}
                    className={`aspect-square max-w-9 min-w-0 flex-1 rounded-full text-sm font-medium transition-colors ${
                      pressed
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>

          {active && (
            <button
              type="button"
              onClick={() => onChange(EMPTY_BOOKING_FILTER)}
              className="self-start text-sm font-medium text-indigo-600 hover:underline"
            >
              Nulstil
            </button>
          )}
        </div>
      )}
    </div>
  );
}
