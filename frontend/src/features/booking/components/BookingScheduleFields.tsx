interface BookingScheduleFieldsProps {
  selectedWeekday: string;
  selectedDayWindow: { open: string; close: string } | null;
  startTime: string;
  endTime: string;
  startTimeOptions: string[];
  endTimeOptions: string[];
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  className?: string;
}

export function BookingScheduleFields({
  selectedWeekday,
  selectedDayWindow,
  startTime,
  endTime,
  startTimeOptions,
  endTimeOptions,
  onStartTimeChange,
  onEndTimeChange,
  className,
}: BookingScheduleFieldsProps) {
  return (
    <div className={className ?? 'grid gap-3 md:grid-cols-2'}>
      <div>
        <label className="mb-1 block text-sm font-medium">Start Time</label>
        <select
          className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
          disabled={!selectedDayWindow || startTimeOptions.length === 0}
        >
          {startTimeOptions.length === 0 ? <option value="">No slot</option> : null}
          {startTimeOptions.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>

        {selectedResourceWindowLabel(selectedWeekday, selectedDayWindow)}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">End Time</label>
        <select
          className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
          value={endTime}
          onChange={(e) => onEndTimeChange(e.target.value)}
          disabled={!selectedDayWindow || endTimeOptions.length === 0}
        >
          {endTimeOptions.length === 0 ? <option value="">No slot</option> : null}
          {endTimeOptions.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-foreground/70">Max duration: 3 hours</p>
      </div>
    </div>
  );
}

function selectedResourceWindowLabel(
  selectedWeekday: string,
  selectedDayWindow: { open: string; close: string } | null
) {
  if (!selectedDayWindow) {
    return null;
  }

  return (
    <p className="mt-1 text-xs text-foreground/70">
      {selectedWeekday}: {selectedDayWindow.open} - {selectedDayWindow.close}
    </p>
  );
}
