import { http, HttpResponse } from "msw";
import getBookingsFixture from "./fixtures/getBookings.json";
import intervalbookingFixture from "./fixtures/intervalbooking.json";
import listMemberBookingsFixture from "./fixtures/listMemberBookings.json";

const API_BASE = "https://www.conventus.dk";

export const handlers = [
  http.post(`${API_BASE}/publicBooking/public/getBookings`, () => {
    return HttpResponse.json(getBookingsFixture);
  }),

  http.get(`${API_BASE}/publicBooking/public/intervalbooking/:id`, () => {
    return HttpResponse.json(intervalbookingFixture);
  }),

  http.post(`${API_BASE}/heimdall/rest/auth/member`, () => {
    return HttpResponse.json({
      organizationName: "Hvidovre Atletik & Motion",
      profiles: [
        {
          memberId: 1234567,
          name: "Mock Bruger",
          token: "mock-token-abc123",
        },
      ],
    });
  }),

  http.get(`${API_BASE}/publicBooking/online/listMemberBookings`, () => {
    return HttpResponse.json(listMemberBookingsFixture);
  }),

  // POST /publicBooking/online/book
  http.post(
    `${API_BASE}/publicBooking/online/book`,
    () => new HttpResponse(null, { status: 200 }),
  ),

  // POST /publicBooking/online/bookWaitingList
  http.post(
    `${API_BASE}/publicBooking/online/bookWaitingList`,
    () => new HttpResponse(null, { status: 200 }),
  ),

  // DELETE /publicBooking/online/cancelMemberBooking
  http.delete(
    `${API_BASE}/publicBooking/online/cancelMemberBooking`,
    () => new HttpResponse(null, { status: 200 }),
  ),
];
