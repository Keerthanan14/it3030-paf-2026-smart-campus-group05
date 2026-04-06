import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';
import type { BookedSlot, ResourceAvailabilityResponse } from '../../../types/resource';

interface ResourceAvailabilityCalendarProps {
  resourceId?: string;
  data: ResourceAvailabilityResponse | null;
  loading: boolean;
  error: string | null;
  from: string;
  to: string;
  onRangeChange: (from: string, to: string) => void;
  onBookSlot: (payload: { resourceId: string; date: string; startTime: string; endTime: string }) => void;
}

const DAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toIsoTime(value: Date) {
  return value.toISOString().slice(11, 16);
}

function bookedSlotTitle(slot: BookedSlot) {
  return slot.purpose ? `${slot.purpose} (${slot.startTime}-${slot.endTime})` : `Booked ${slot.startTime}-${slot.endTime}`;
}

export function ResourceAvailabilityCalendar({
  resourceId,
  data,
  loading,
  error,
  from,
  to,
  onRangeChange,
  onBookSlot,
}: ResourceAvailabilityCalendarProps) {
  const [selectedSlot, setSelectedSlot] = useState<BookedSlot | null>(null);

  const businessHours = useMemo(() => {
    if (!data?.availabilityWindows) {
      return [];
    }

    return Object.entries(data.availabilityWindows)
      .map(([day, window]) => {
        const dayIndex = DAY_INDEX[day.toUpperCase()];
        if (dayIndex === undefined) {
          return null;
        }

        return {
          daysOfWeek: [dayIndex],
          startTime: window.open,
          endTime: window.close,
        };
      })
      .filter((value): value is { daysOfWeek: number[]; startTime: string; endTime: string } => value !== null);
  }, [data?.availabilityWindows]);

  const freeWindowBackgroundEvents = useMemo<EventInput[]>(() => {
    if (!data?.availabilityWindows) {
      return [];
    }

    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    const events: EventInput[] = [];

    for (const current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
      const isoDate = toIsoDate(current);
      const weekday = current.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      const window = data.availabilityWindows[weekday];
      if (!window) {
        continue;
      }

      events.push({
        start: `${isoDate}T${window.open}:00`,
        end: `${isoDate}T${window.close}:00`,
        display: 'background',
        color: 'rgba(16, 185, 129, 0.25)',
      });
    }

    return events;
  }, [data?.availabilityWindows, from, to]);

  const blockedEvents = useMemo<EventInput[]>(() => {
    if (!data?.bookedSlots) {
      return [];
    }

    return data.bookedSlots.map((slot) => ({
      title: bookedSlotTitle(slot),
      start: `${slot.date}T${slot.startTime}:00`,
      end: `${slot.date}T${slot.endTime}:00`,
      backgroundColor: '#dc2626',
      borderColor: '#b91c1c',
      textColor: '#ffffff',
      extendedProps: {
        slot,
      },
    }));
  }, [data?.bookedSlots]);

  const calendarEvents = useMemo(() => [...freeWindowBackgroundEvents, ...blockedEvents], [freeWindowBackgroundEvents, blockedEvents]);

  const handleDatesSet = (arg: DatesSetArg) => {
    const start = toIsoDate(arg.start);
    const endExclusive = new Date(arg.end);
    endExclusive.setDate(endExclusive.getDate() - 1);
    const end = toIsoDate(endExclusive);
    if (start !== from || end !== to) {
      onRangeChange(start, end);
    }
  };

  const handleEventClick = (arg: EventClickArg) => {
    const slot = arg.event.extendedProps.slot as BookedSlot | undefined;
    if (slot) {
      setSelectedSlot(slot);
    }
  };

  const handleDateClick = (arg: DateClickArg) => {
    if (!resourceId || !data?.availabilityWindows) {
      return;
    }

    const clickedDate = toIsoDate(arg.date);
    const day = arg.date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const window = data.availabilityWindows[day];
    if (!window) {
      return;
    }

    let startTime = window.open;
    let endTime = window.close;

    if (!arg.allDay) {
      startTime = toIsoTime(arg.date);
      const oneHourAfter = new Date(arg.date);
      oneHourAfter.setHours(oneHourAfter.getHours() + 1);
      endTime = toIsoTime(oneHourAfter);

      if (startTime < window.open || endTime > window.close) {
        return;
      }
    }

    onBookSlot({
      resourceId,
      date: clickedDate,
      startTime,
      endTime,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-card p-5">
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
        Green background indicates free availability windows. Red blocks are approved bookings. Click a free slot to prefill booking details.
      </div>

      <div className="rounded-lg border border-border/60 bg-background p-3">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,dayGridMonth',
          }}
          businessHours={businessHours}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          nowIndicator
          selectable
          dateClick={handleDateClick}
          events={calendarEvents}
          eventClick={handleEventClick}
          eventDidMount={(info) => {
            const slot = info.event.extendedProps.slot as BookedSlot | undefined;
            if (slot) {
              info.el.title = `${slot.purpose || 'Booked'}\n${slot.date} ${slot.startTime}-${slot.endTime}`;
            }
          }}
          datesSet={handleDatesSet}
        />
      </div>

      {loading ? <p className="text-sm text-foreground/70">Loading availability...</p> : null}
      {error ? <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      <p className="text-xs text-foreground/70">
        Visible range: {from} to {to}
      </p>

      {data ? (
        <>
          <div>
            <p className="text-sm font-semibold">Weekly Availability Windows</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(data.availabilityWindows ?? {}).map(([day, window]) => (
                <div key={day} className="rounded-md border border-border/60 p-3">
                  <p className="text-xs uppercase text-foreground/60">{day}</p>
                  <p className="mt-1 text-sm font-medium">
                    {window.open} - {window.close}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {selectedSlot ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <p className="font-semibold">Selected Booked Slot</p>
              <p className="mt-1">Date: {selectedSlot.date}</p>
              <p>Time: {selectedSlot.startTime} - {selectedSlot.endTime}</p>
              <p>Purpose: {selectedSlot.purpose || 'N/A'}</p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
