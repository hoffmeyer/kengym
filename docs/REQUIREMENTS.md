# KenGym Booking – Requirements & Design Decisions

## Background

Hvidovre Atletik & Motion uses [Conventus](https://www.conventus.dk) to manage facility bookings. The existing booking list at conventus.dk is a desktop-oriented table layout that is poorly suited for mobile use. This project is a standalone frontend that surfaces the same data in a modern, mobile-friendly interface.

The original page this replaces:
```
https://www.conventus.dk/dataudv/www/booking_v2_liste_link.php
  ?forening=17742&vis=27&ressourcer=44493&kategorier=
  &kun_egne=false&skyggebookinger=true&type=2
  &gruppeAfd=afdeling_65499&layout=relativ
  &columns=skygge;dato;tid;titel;ledig;antal_pl;book
  &heads=week
```

---

## Requirements

### Phase 1 (implemented)

| # | Requirement |
|---|-------------|
| 1 | Display upcoming bookings for the CrossFit holdtræning resource (forening 17742, ressource 44493) |
| 2 | Show next **4 weeks** of bookings from today |
| 3 | Group bookings by **ISO week**, with a "Uge XX · date range" heading per week |
| 4 | Within each week, group by **day**, with a day label per group |
| 5 | Within each day, display bookings as **cards laid out horizontally**, wrapping to the next line when space runs out |
| 6 | On **mobile**, cards should stretch to full width (single column) |
| 7 | On **tablet/desktop**, cards should appear in a 2- or 3-column grid; all cards must be equal width, including the last card in an incomplete row |
| 8 | Each card shows: time range, title, optional info snippet, available/total spots with a fill bar, and a status chip (Ledig / Optaget) |
| 9 | Each card has a **Book** button (available sessions) or **Venteliste** button (full sessions) |
| 10 | Booking button navigates in the **same tab** so the user can use browser history to go back |
| 11 | Week and day headings are **sticky** while scrolling so the user always knows their position |
| 12 | The club **logo** and name appear in a persistent header at the top of the page |
| 13 | Loading skeleton, error state, and empty state are all handled |

### Out of scope (Phase 1)

- In-app booking flow (button links out to Conventus)
- Authentication / member login
- Filtering or searching bookings
- Push notifications or reminders

---

## Technical Choices

### Stack

| Choice | Rationale |
|--------|-----------|
| **Vite + React 18 + TypeScript** | Fast dev server, first-class TypeScript support, minimal boilerplate |
| **Tailwind CSS v4** (with `@tailwindcss/vite`) | Utility-first styling with no config file needed in v4; Vite plugin avoids PostCSS setup |
| **date-fns** | Lightweight, tree-shakeable date utilities; used for formatting, ISO week numbers, and week boundary calculation |

### API

The Conventus public booking API is called directly from the browser:

```
POST https://www.conventus.dk/publicBooking/public/getBookings
```

No backend proxy is needed — the API responds with `Access-Control-Allow-Origin: *`.

Only `bookingType === "interval"` entries are shown; these are the online-bookable sessions. The request fetches with `overlap: true` to include shadow bookings.

Available spots are derived from the first interval entry:
```
availableSpots = interval.maxParticipants - interval.numberOfBookings
isAvailable    = availableSpots > 0
```

### Layout

Cards use CSS Grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) rather than `flex-wrap`. This ensures every grid cell is an identical fraction of the container width — including the last card in an incomplete row, which would otherwise expand to fill remaining space under a flex layout.

### Sticky headings

Week headings are `sticky top-0 z-20`. Day headings are `sticky top-[41px] z-10` (offset by the measured height of the week heading). Both use `bg-gray-100` to cover content scrolling underneath.

### Book / Venteliste button

The button uses a ghost/outline style (colored border, transparent fill, subtle hover background) rather than a solid fill. This keeps the card's primary content (title, time, status) visually dominant while the button remains easy to tap. Full sessions show an amber "Venteliste" button that links to the same Conventus booking page, since the platform supports waiting-list sign-up.

Book URL pattern:
```
https://www.conventus.dk/dataudv/www/booking_v2_interval.php
  ?forening=17742&booking={booking.id}
```
