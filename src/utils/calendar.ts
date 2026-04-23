import type { DisplayBooking } from '../types';

function toIcsDate(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcsBlob(booking: DisplayBooking): Blob {
  const uid = `${booking.id}-${booking.start}@kengym`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KenGym//KenGym//DA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(Date.now())}`,
    `DTSTART:${toIcsDate(booking.start)}`,
    `DTEND:${toIcsDate(booking.end)}`,
    `SUMMARY:${escapeIcsText(booking.title)}`,
    ...(booking.info ? [`DESCRIPTION:${escapeIcsText(booking.info)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
}
