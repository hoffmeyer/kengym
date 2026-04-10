# Copilot Instructions

## Git workflow

**Only commit and push when explicitly instructed by the user.** Do not create commits or push to origin as part of implementing a feature or fix — wait for a separate instruction to do so.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # ESLint
npm run preview   # Serve production build locally
```

There is no test suite.

## Architecture

This is a React 19 + TypeScript SPA that wraps the [Conventus](https://www.conventus.dk) gym booking API. It is a thin frontend — there is no backend.

**Key constants** in `src/api.ts`:
- `API_BASE = "https://www.conventus.dk"`
- `ORGANIZATION_ID = 17742` and `RESOURCE_ID = 44493` are hardcoded; all API calls are scoped to this gym and resource.

**Data flow:**
1. `fetchBookings()` fetches the next 28 days of bookings (list view, lightweight).
2. `fetchBookingDetail(id)` fetches full interval data for one booking (participants, waiting list, settings).
3. `fetchMemberBookings(token)` returns a `Map<bookingId, {bookingInIntervalId, onWaitingList}>` used to enrich list-view bookings with user state.

**`DisplayBooking`** (`src/types.ts`) extends `Booking` with computed fields (`availableSpots`, `totalSpots`, `isAvailable`, `isBookedByUser`, `userBookingInIntervalId`, `userOnWaitingList`). These are derived in `toDisplayBooking()` in `api.ts` and re-enriched in `App.tsx` after the member bookings call.

**Routing** (`src/App.tsx`): Two routes — `/` (list) and `/booking/:id` (detail). `BookingCard` passes the full `DisplayBooking` object as router `state` so `BookingDetail` can render immediately without waiting for the list API. If the user navigates directly to `/booking/:id`, `BookingDetail` falls back to fetching the list.

**Auth** (`src/context/AuthContext.tsx`): Auth state lives in `sessionStorage` (keys `kengym_memberId`, `kengym_name`, `kengym_token`). The raw `token` string from Conventus is passed directly as the `Authorization` header. Exposed via `useAuth()`.

## Conventions

- **API timestamps are Unix milliseconds** (not ISO strings). Use `new Date(timestamp)` to convert.
- **Date formatting uses `date-fns`** with Danish locale (`da` from `date-fns/locale`) for display strings; raw date math uses `addDays` etc.
- **UI text is in Danish** — user-facing strings, error messages (`"Booking fejlede"`, `"Annullering fejlede"`), and labels should remain in Danish.
- **Tailwind CSS v4** is integrated via the `@tailwindcss/vite` plugin (no `tailwind.config.js`). Use utility classes directly.
- **No component library** — all UI is hand-crafted with Tailwind. Rounded cards use `rounded-2xl`, primary action colour is `indigo-600`, available = `emerald`, full/error = `red`, waiting list = `amber`.
- **Only `interval` bookings** are surfaced to the user; `ordinary` bookings are filtered out in `fetchBookings()`.
- All API functions throw `Error` with a human-readable (Danish) message on failure; callers set that message into component state and render it inline.
