export interface BookingInInterval {
  id: number;
  organization: { id: number; name: string } | null;
  state: string;
  bookedTo: { id: number; name: string } | null;
  participated: boolean | null;
  remark: string | null;
  remindBySms: boolean | null;
  position: number | null;
  department: number | null;
  pin: string | null;
  attendance: boolean;
}

export interface Interval {
  id: number;
  maxParticipants: number;
  start: number;
  end: number;
  bookings: BookingInInterval[] | null;
  waitingList: boolean | null;
  numberOfBookings: number;
  numberOfWaitingListEntries: number;
  memberBooked: boolean;
  memberReserved: boolean;
  memberAddedToWaitingList: boolean;
  waitingListPosition: number | null;
  bookingInIntervalId: number | null;
}

export interface OrganizationalUnit {
  department: number;
  name: string;
}

export interface BookingGroup {
  group: number;
  name: string;
}

export interface Resource {
  id: number;
  organization: { id: number; name: string };
  name: string;
  bookingCategoryRequired: boolean;
}

export type BookingType = 'interval' | 'ordinary';

export interface Booking {
  id: number;
  organization: { id: number; name: string };
  resource: Resource;
  start: number;
  end: number;
  title: string;
  info?: string;
  organizationalUnit: OrganizationalUnit;
  accessControlUnlock: boolean;
  serie?: number;
  bookingType: BookingType;
  bookingContext: string;
  bookingGroups: BookingGroup[];
  maxParticipants: number;
  getEventEnabled: boolean;
  attendance: boolean;
  participants: unknown[];
  intervals: Interval[];
}

export interface ResourceBookings {
  resource: Resource;
  bookings: Booking[];
}

// Derived, computed fields for display
export interface DisplayBooking extends Booking {
  availableSpots: number;
  totalSpots: number;
  isAvailable: boolean;
  hasWaitingList: boolean;
}
