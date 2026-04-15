export const queryKeys = {
  bookings: () => ['bookings'] as const,
  memberBookings: (token: string) => ['memberBookings', token] as const,
  bookingDetail: (id: string | number, token?: string) =>
    ['bookingDetail', String(id), token ?? ''] as const,
};
