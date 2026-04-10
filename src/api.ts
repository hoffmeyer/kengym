import {
  type Booking,
  type BookingInInterval,
  type DisplayBooking,
  type ResourceBookings,
  type BookingDetailResponse,
  type AuthProfile,
  type IntervalDetail,
} from "./types";

const API_BASE = "https://www.conventus.dk";
const ORGANIZATION_ID = 17742;
const RESOURCE_ID = 44493;

function toDisplayBooking(booking: Booking): DisplayBooking {
  const interval = booking.intervals?.[0];
  const totalSpots = interval?.maxParticipants ?? booking.maxParticipants ?? 0;
  const bookedCount = interval?.numberOfBookings ?? 0;
  const availableSpots = Math.max(0, totalSpots - bookedCount);
  const isAvailable = availableSpots > 0;
  const hasWaitingList = Array.isArray(interval?.waitingList)
    ? interval.waitingList.length > 0
    : false;

  return {
    ...booking,
    availableSpots,
    totalSpots,
    isAvailable,
    hasWaitingList,
    isBookedByUser: false,
    userBookingInIntervalId: null,
    userOnWaitingList: false,
  };
}

export async function fetchBookings(
  fromDate: Date,
  toDate: Date,
): Promise<DisplayBooking[]> {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`;
  const fmtEnd = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59:59`;

  const response = await fetch(`${API_BASE}/publicBooking/public/getBookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fmt(fromDate),
      to: fmtEnd(toDate),
      organization: { id: ORGANIZATION_ID },
      resourceList: [{ id: RESOURCE_ID }],
      categoryList: [],
      overlap: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data: ResourceBookings[] = await response.json();
  const allBookings: DisplayBooking[] = [];

  for (const resourceEntry of data) {
    for (const booking of resourceEntry.bookings) {
      // Only include interval (online-bookable) bookings
      if (booking.bookingType === "interval") {
        allBookings.push(toDisplayBooking(booking));
      }
    }
  }

  // Sort by start time ascending
  allBookings.sort((a, b) => a.start - b.start);

  return allBookings;
}

export async function fetchBookingDetail(
  id: number | string,
  token?: string,
): Promise<BookingDetailResponse> {
  const response = await fetch(
    `${API_BASE}/publicBooking/public/intervalbooking/${id}`,
    token ? { headers: { Authorization: token } } : undefined,
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function login(
  email: string,
  password: string,
): Promise<AuthProfile[]> {
  const response = await fetch(`${API_BASE}/heimdall/rest/auth/member`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      country: null,
      phoneNumber: null,
      email,
      password,
      passwordHashed: false,
      organization: ORGANIZATION_ID,
    }),
  });

  if (!response.ok) {
    throw new Error("Forkert e-mail eller adgangskode");
  }

  const data = await response.json();
  const profiles: AuthProfile[] = data.profiles;

  if (!profiles || profiles.length === 0) {
    throw new Error("Ingen profiler fundet");
  }

  return profiles;
}

export async function fetchMemberBookings(
  token: string,
): Promise<
  Map<number, { bookingInIntervalId: number; onWaitingList: boolean }>
> {
  const response = await fetch(
    `${API_BASE}/publicBooking/online/listMemberBookings?_=${Date.now()}`,
    { headers: { Authorization: token } },
  );

  if (!response.ok) return new Map();

  const data: Booking[] = await response.json();
  const map = new Map<
    number,
    { bookingInIntervalId: number; onWaitingList: boolean }
  >();

  for (const booking of data) {
    const interval = booking.intervals?.[0];
    if (!interval) continue;

    const bookedEntry = interval.bookings?.[0];
    if (bookedEntry) {
      map.set(booking.id, {
        bookingInIntervalId: bookedEntry.id,
        onWaitingList: false,
      });
      continue;
    }
    const waitingEntry = (
      interval.waitingList as BookingInInterval[] | null
    )?.[0];
    if (waitingEntry) {
      map.set(booking.id, {
        bookingInIntervalId: waitingEntry.id,
        onWaitingList: true,
      });
    }
  }

  return map;
}

export async function bookSession(
  booking: Booking,
  detailInterval: IntervalDetail,
  token: string,
): Promise<void> {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmtDT = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const listInterval = booking.intervals?.[0];
  const namesOfParticipants = (detailInterval.bookings ?? [])
    .map((b) => b.bookedTo?.name)
    .filter((n): n is string => !!n);
  const waitingListIsActive =
    (detailInterval.numberOfWaitingListEntries ?? 0) > 0;

  const payload = {
    bookingTime: {
      start: fmtDT(booking.start),
      end: fmtDT(booking.end),
      paymentOptions: { creditCard: false, account: false },
      resource: booking.resource,
      interval: {
        serieId: booking.serie ?? null,
        bookingId: booking.id,
        intervalId: listInterval?.id ?? detailInterval.id,
        maxParticipants: detailInterval.maxParticipants,
        numberOfParticipants: detailInterval.numberOfBookings,
        namesOfParticipants,
        waitingList: waitingListIsActive,
        membersOnwaitingList: detailInterval.numberOfWaitingListEntries ?? 0,
        namesOfMembersOnWaitingList: null,
        onlineSettings: detailInterval.onlineSettings ?? null,
        comments: null,
        waitingListEnabled: detailInterval.waitingListEnabled ?? true,
        commentsAllowed: detailInterval.commentsAllowed ?? false,
        departmentRequired: detailInterval.departmentRequired ?? false,
      },
      participants: [],
    },
    creditCard: false,
    account: false,
    comment: null,
    department: null,
    sendEmailReceipt: false,
  };

  const response = await fetch(`${API_BASE}/publicBooking/online/book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Booking fejlede";
    try {
      const err = await response.json();
      if (err?.message) message = err.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
}

export async function cancelBooking(
  bookingId: number,
  bookingInIntervalId: number,
  token: string,
): Promise<void> {
  const url = `${API_BASE}/publicBooking/online/cancelMemberBooking?bookingId=${bookingId}&bookingInIntervalId=${bookingInIntervalId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    let message = "Annullering fejlede";
    try {
      const err = await response.json();
      if (err?.message) message = err.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
}
