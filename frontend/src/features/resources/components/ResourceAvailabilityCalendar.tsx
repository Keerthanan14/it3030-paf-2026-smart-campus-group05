import type { BookedSlot, ResourceAvailabilityResponse } from '../../../types/resource';

interface ResourceAvailabilityCalendarProps {
  data: ResourceAvailabilityResponse | null;
  loading: boolean;
  error: string | null;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onShiftRange: (days: number) => void;
  onPresetRange: (days: number) => void;
}

function slotLabel(slot: BookedSlot) {
  return `${slot.date} ${slot.startTime} - ${slot.endTime}${slot.purpose ? ` (${slot.purpose})` : ''}`;
}

export function ResourceAvailabilityCalendar({
  data,
  loading,
  error,
  from,
  to,
  onFromChange,
  onToChange,
  onShiftRange,
  onPresetRange,
}: ResourceAvailabilityCalendarProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-card p-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-border/70 px-3 py-1.5 text-xs"
          onClick={() => onShiftRange(-7)}
        >
          Previous Week
        </button>
        <button
          type="button"
          className="rounded-md border border-border/70 px-3 py-1.5 text-xs"
          onClick={() => onShiftRange(7)}
        >
          Next Week
        </button>
        <button
          type="button"
          className="rounded-md border border-border/70 px-3 py-1.5 text-xs"
          onClick={() => onPresetRange(7)}
        >
          Week View
        </button>
        <button
          type="button"
          className="rounded-md border border-border/70 px-3 py-1.5 text-xs"
          onClick={() => onPresetRange(30)}
        >
          Month View
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">From</span>
          <input
            type="date"
            className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">To</span>
          <input
            type="date"
            className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
          />
        </label>
      </div>

      {loading ? <p className="text-sm text-foreground/70">Loading availability...</p> : null}
      {error ? <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

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

          <div>
            <p className="text-sm font-semibold">Booked Slots</p>
            {data.bookedSlots.length === 0 ? (
              <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                No blocked slots returned for this range.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.bookedSlots.map((slot, index) => (
                  <li key={`${slot.date}-${slot.startTime}-${slot.endTime}-${index}`} className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {slotLabel(slot)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
