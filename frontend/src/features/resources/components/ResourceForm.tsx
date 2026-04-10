import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { AvailabilityWindow, ResourceFormValues } from '../../../types/resource';

interface ResourceFormProps {
  values: ResourceFormValues;
  days: readonly string[];
  isEdit: boolean;
  saving: boolean;
  error: string | null;
  onFieldChange: <K extends keyof ResourceFormValues>(field: K, value: ResourceFormValues[K]) => void;
  onWindowChange: (day: string, field: keyof AvailabilityWindow, value: string) => void;
  onSubmit: () => void;
}

const TIME_OPTIONS = Array.from({ length: 28 }, (_, index) => {
  const totalMinutes = 7 * 60 + 30 + index * 30;
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const displayHour = ((hours24 + 11) % 12) + 1;
  const value = `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const label = `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  return { value, label };
});

export function ResourceForm({
  values,
  days,
  isEdit,
  saving,
  error,
  onFieldChange,
  onWindowChange,
  onSubmit,
}: ResourceFormProps) {
  const [expandedWeekday, setExpandedWeekday] = useState(false);
  const [expandedWeekend, setExpandedWeekend] = useState(false);

  const isWeekendDay = (day: string) => {
    const normalizedDay = day.trim().toLowerCase();
    return normalizedDay === 'saturday' || normalizedDay === 'sunday';
  };

  const weekdayDays = days.filter((d) => !isWeekendDay(d));
  const weekendDays = days.filter((d) => isWeekendDay(d));

  const getWindow = (day: string) => values.availabilityWindows?.[day] ?? { open: '08:00', close: '17:00' };

  const handleGroupTimeChange = (groupDays: readonly string[], field: keyof AvailabilityWindow, value: string) => {
    groupDays.forEach((d) => {
      onWindowChange(d, field, value);
    });
  };

  const handleDayTimeChange = (day: string, field: keyof AvailabilityWindow, value: string) => {
    onWindowChange(day, field, value);
  };

  const getGroupFieldValue = (groupDays: readonly string[], field: keyof AvailabilityWindow) => {
    if (groupDays.length === 0) {
      return '';
    }

    const firstValue = getWindow(groupDays[0])[field];
    const isSameAcrossGroup = groupDays.every((day) => getWindow(day)[field] === firstValue);
    return isSameAcrossGroup ? firstValue : '';
  };

  const shouldHideFacility = (
    facility:
      | 'hasProjector'
      | 'hasSmartboard'
      | 'hasPodiumWithPc'
      | 'hasPodium'
      | 'hasWhiteboard'
      | 'hasLectureChairs'
      | 'hasLectureDesks',
  ) => {
    if (values.type === 'STAFF_ROOM') {
      return [
        'hasProjector',
        'hasSmartboard',
        'hasPodiumWithPc',
        'hasPodium',
        'hasWhiteboard',
        'hasLectureChairs',
        'hasLectureDesks',
      ].includes(facility);
    }

    if (values.type === 'BOARD_ROOM' || values.type === 'MEETING_ROOM') {
      return ['hasLectureChairs', 'hasPodiumWithPc', 'hasPodium', 'hasProjector', 'hasWhiteboard', 'hasLectureDesks'].includes(facility);
    }

    if (values.type === 'STUDY_AREA' || values.type === 'LIBRARY') {
      return ['hasLectureChairs', 'hasLectureDesks', 'hasPodiumWithPc', 'hasPodium', 'hasWhiteboard', 'hasProjector'].includes(facility);
    }

    return false;
  };

  const renderStepper = (
    value: number,
    min: number,
    onChange: (nextValue: number) => void,
  ) => (
    <div className="grid h-12 w-full grid-cols-[minmax(0,1fr)_40px] grid-rows-2 rounded-md border border-border/70 bg-background">
      <input
        type="text"
        inputMode="numeric"
        className="col-start-1 row-span-2 h-full w-full bg-transparent px-2 text-center text-sm tabular-nums outline-none"
        value={value}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          onChange(Number.isFinite(parsed) ? Math.max(min, parsed) : min);
        }}
      />
      <button
        type="button"
        className="col-start-2 row-start-1 flex items-center justify-center border-l border-b border-border/70 text-base font-semibold leading-none hover:bg-muted/40"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        -
      </button>
      <button
        type="button"
        className="col-start-2 row-start-2 flex items-center justify-center border-l border-border/70 text-base font-semibold leading-none hover:bg-muted/40"
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-card p-5">
      {error ? <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-3">
              <span className="text-sm font-medium">Building</span>
              <div className="flex h-10 items-center gap-4 px-1 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="building"
                    value="MAIN"
                    checked={values.building === 'MAIN'}
                    onChange={(e) => onFieldChange('building', e.target.value as ResourceFormValues['building'])}
                  />
                  <span>MAIN</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="building"
                    value="SUB"
                    checked={values.building === 'SUB'}
                    onChange={(e) => onFieldChange('building', e.target.value as ResourceFormValues['building'])}
                  />
                  <span>SUB</span>
                </label>
              </div>
            </label>

            <label className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-3">
              <span className="text-sm font-medium">Type</span>
              <select
                className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
                value={values.type}
                onChange={(e) => {
                  const nextType = e.target.value as ResourceFormValues['type'];
                  onFieldChange('type', nextType);
                  if (nextType === 'EQUIPMENT') {
                    onFieldChange('floor', null);
                  }
                }}
              >
                <option value="">Select Type</option>
                <option value="LECTURE_HALL">LECTURE HALL</option>
                <option value="LAB">LAB</option>
                <option value="MEETING_ROOM">MEETING ROOM</option>
                <option value="BOARD_ROOM">BOARD ROOM</option>
                <option value="STAFF_ROOM">STAFF ROOM</option>
                <option value="SMART_CLASSROOM">SMART CLASSROOM</option>
                <option value="EQUIPMENT">EQUIPMENT</option>
                <option value="STUDY_AREA">STUDY AREA</option>
                <option value="LIBRARY">LIBRARY</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>

            {values.type !== 'EQUIPMENT' ? (
              <label className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-3">
                <span className="text-sm font-medium">Floor</span>
                <div className="flex h-10 flex-wrap items-center gap-3 px-1 text-sm">
                  {[0, 1, 2, 3, 4, 5].map((floor) => (
                    <label key={floor} className="inline-flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="floor"
                        value={floor}
                        checked={values.floor === floor}
                        onChange={() => onFieldChange('floor', floor as ResourceFormValues['floor'])}
                      />
                      <span>{floor}</span>
                    </label>
                  ))}
                </div>
              </label>
            ) : null}

            <label className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-3">
              <span className="text-sm font-medium">Name</span>
              <input
                className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
                value={values.name}
                onChange={(e) => onFieldChange('name', e.target.value)}
                placeholder={values.type === 'EQUIPMENT' ? 'Chess Board' : '201'}
              />
            </label>

            {values.type === 'EQUIPMENT' ? (
              <label className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-3">
                <span className="text-sm font-medium">Count</span>
                {renderStepper(values.equipmentCount ?? 0, 0, (nextValue) =>
                  onFieldChange('equipmentCount', nextValue)
                )}
              </label>
            ) : null}

          </div>

          {values.type !== 'EQUIPMENT' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={`col-span-full grid gap-3 ${values.type === 'LAB' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                {values.type === 'LAB' ? (
                  <label className="grid grid-cols-[90px_minmax(0,1fr)] items-center gap-2">
                    <span className="text-sm font-medium">PC</span>
                    {renderStepper(values.pcCount ?? 0, 0, (nextValue) =>
                      onFieldChange('pcCount', nextValue)
                    )}
                  </label>
                ) : null}

                <label className="grid grid-cols-[90px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-sm font-medium">Capacity</span>
                  {renderStepper(values.capacity, 1, (nextValue) => onFieldChange('capacity', nextValue))}
                </label>

                <label className="grid grid-cols-[90px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-sm font-medium">Chair</span>
                  {renderStepper(values.chairCount, 0, (nextValue) => onFieldChange('chairCount', nextValue))}
                </label>

                <label className="grid grid-cols-[90px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-sm font-medium">Table</span>
                  {renderStepper(values.tableCount, 0, (nextValue) => onFieldChange('tableCount', nextValue))}
                </label>
              </div>

              <div className="col-span-full grid grid-cols-2 gap-x-6 gap-y-3 px-1 py-1 text-sm md:grid-cols-3 lg:grid-cols-4">
                <label className="inline-flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(values.hasAc)}
                    onChange={(e) => onFieldChange('hasAc', e.target.checked)}
                  />
                  <span className="font-medium">AC</span>
                </label>

                <label className="inline-flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(values.hasFan)}
                    onChange={(e) => onFieldChange('hasFan', e.target.checked)}
                  />
                  <span className="font-medium">Fan</span>
                </label>

                {!shouldHideFacility('hasProjector') ? (
                  <label className="inline-flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(values.hasProjector)}
                      onChange={(e) => onFieldChange('hasProjector', e.target.checked)}
                    />
                    <span className="font-medium">Projector</span>
                  </label>
                ) : null}

                {!shouldHideFacility('hasSmartboard') ? (
                  <label className="inline-flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(values.hasSmartboard)}
                      onChange={(e) => onFieldChange('hasSmartboard', e.target.checked)}
                    />
                    <span className="font-medium">Smartboard</span>
                  </label>
                ) : null}

                <label className="inline-flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(values.hasCamera)}
                    onChange={(e) => onFieldChange('hasCamera', e.target.checked)}
                  />
                  <span className="font-medium">Camera</span>
                </label>

                {!shouldHideFacility('hasPodiumWithPc') ? (
                  <label className="inline-flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(values.hasPodiumWithPc)}
                      onChange={(e) => onFieldChange('hasPodiumWithPc', e.target.checked)}
                    />
                    <span className="font-medium">Podium with PC</span>
                  </label>
                ) : null}

                {!shouldHideFacility('hasPodium') ? (
                  <label className="inline-flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(values.hasPodium)}
                      onChange={(e) => onFieldChange('hasPodium', e.target.checked)}
                    />
                    <span className="font-medium">Podium</span>
                  </label>
                ) : null}

                {!shouldHideFacility('hasWhiteboard') ? (
                  <label className="inline-flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(values.hasWhiteboard)}
                      onChange={(e) => onFieldChange('hasWhiteboard', e.target.checked)}
                    />
                    <span className="font-medium">Whiteboard</span>
                  </label>
                ) : null}

                <label className="inline-flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(values.hasClock)}
                    onChange={(e) => onFieldChange('hasClock', e.target.checked)}
                  />
                  <span className="font-medium">Clock</span>
                </label>

                {!shouldHideFacility('hasLectureChairs') ? (
                  <label className="inline-flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(values.hasLectureChairs)}
                      onChange={(e) => onFieldChange('hasLectureChairs', e.target.checked)}
                    />
                    <span className="font-medium">Lecture chairs</span>
                  </label>
                ) : null}

                {!shouldHideFacility('hasLectureDesks') ? (
                  <label className="inline-flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(values.hasLectureDesks)}
                      onChange={(e) => onFieldChange('hasLectureDesks', e.target.checked)}
                    />
                    <span className="font-medium">Lecture desks</span>
                  </label>
                ) : null}

                <label className="inline-flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(values.hasSpeakers)}
                    onChange={(e) => onFieldChange('hasSpeakers', e.target.checked)}
                  />
                  <span className="font-medium">Speakers</span>
                </label>

                <label className="inline-flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(values.hasWifi)}
                    onChange={(e) => onFieldChange('hasWifi', e.target.checked)}
                  />
                  <span className="font-medium">Wi-Fi</span>
                </label>

                <label className="inline-flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(values.hasPowerOutlets)}
                    onChange={(e) => onFieldChange('hasPowerOutlets', e.target.checked)}
                  />
                  <span className="font-medium">Power outlets / charging ports</span>
                </label>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-[60%_40%] gap-4">
            {/* Left: Description (60%) */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Description</span>
              <textarea
                className="min-h-24 w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
                value={values.description ?? ''}
                onChange={(e) => onFieldChange('description', e.target.value)}
                placeholder="Optional details for users"
              />
            </label>

            {/* Right: Toggle & Checkboxes (40%) */}
            <div className="flex flex-col gap-3">
              {/* Row 1: Status Radio Buttons */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Status</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      value="ACTIVE"
                      checked={values.status === 'ACTIVE'}
                      onChange={() => onFieldChange('status', 'ACTIVE')}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      value="OUT_OF_SERVICE"
                      checked={values.status === 'OUT_OF_SERVICE'}
                      onChange={() => onFieldChange('status', 'OUT_OF_SERVICE')}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Out of Service</span>
                  </label>
                </div>
              </div>

              {/* Row 2: Booking Checkbox */}
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={Boolean(values.allowBookings)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onFieldChange('allowBookings', true);
                      onFieldChange('allowRequests', false);
                    } else {
                      onFieldChange('allowBookings', false);
                    }
                  }}
                />
                <span className="text-sm font-medium">Allow Bookings</span>
              </label>
            </div>
          </div>
        </div>

         <div className="flex flex-col">
          <div>
            <p className="text-sm font-semibold">Availability Windows</p>
            <p className="mt-1 text-xs text-foreground/60">Set the weekly open and close time for each day.</p>
          </div>

          <div className="mt-3 grid gap-3">
            {/* Weekday Section */}
            <div className="rounded-md border border-border/60 bg-background/50">
              <div className="grid gap-2 p-3 sm:grid-cols-[120px_1fr_1fr_auto] sm:items-center">
                <span className="text-sm font-medium">Weekday</span>
                <label className="space-y-1">
                  <span className="sr-only">Weekday open time</span>
                  <select
                    className="h-9 w-full rounded-md border border-border/70 bg-background px-2 text-sm"
                    value={getGroupFieldValue(weekdayDays, 'open')}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setExpandedWeekday(true);
                        setExpandedWeekend(false);
                      } else {
                        handleGroupTimeChange(weekdayDays, 'open', e.target.value);
                      }
                    }}
                  >
                    <option value="">Custom</option>
                    {TIME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="sr-only">Weekday close time</span>
                  <select
                    className="h-9 w-full rounded-md border border-border/70 bg-background px-2 text-sm"
                    value={getGroupFieldValue(weekdayDays, 'close')}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setExpandedWeekday(true);
                        setExpandedWeekend(false);
                      } else {
                        handleGroupTimeChange(weekdayDays, 'close', e.target.value);
                      }
                    }}
                  >
                    <option value="">Custom</option>
                    {TIME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedWeekday((prev) => {
                      const next = !prev;
                      if (next) {
                        setExpandedWeekend(false);
                      }
                      return next;
                    });
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border/70 px-2 text-foreground/80 hover:bg-background"
                  aria-label={expandedWeekday ? 'Collapse weekday days' : 'Expand weekday days'}
                >
                  {expandedWeekday ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>

              {expandedWeekday && (
                <div className="space-y-2 border-t border-border/60 p-3 pr-2">
                  {weekdayDays.map((day) => {
                    const window = getWindow(day);
                    return (
                      <div key={day} className="grid gap-2 rounded-md p-1 sm:grid-cols-[120px_1fr_1fr] sm:items-center">
                        <span className="text-sm font-medium">{day}</span>
                        <label className="space-y-1">
                          <span className="sr-only">{day} open time</span>
                          <select
                            className="h-9 w-full rounded-md border border-border/70 bg-background px-2 text-sm"
                            value={window.open}
                            onChange={(e) => handleDayTimeChange(day, 'open', e.target.value)}
                          >
                            {TIME_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-1">
                          <span className="sr-only">{day} close time</span>
                          <select
                            className="h-9 w-full rounded-md border border-border/70 bg-background px-2 text-sm"
                            value={window.close}
                            onChange={(e) => handleDayTimeChange(day, 'close', e.target.value)}
                          >
                            {TIME_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Weekend Section */}
            <div className="rounded-md border border-border/60 bg-background/50">
              <div className="grid gap-2 p-3 sm:grid-cols-[120px_1fr_1fr_auto] sm:items-center">
                <span className="text-sm font-medium">Weekend</span>
                <label className="space-y-1">
                  <span className="sr-only">Weekend open time</span>
                  <select
                    className="h-9 w-full rounded-md border border-border/70 bg-background px-2 text-sm"
                    value={getGroupFieldValue(weekendDays, 'open')}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setExpandedWeekend(true);
                        setExpandedWeekday(false);
                      } else {
                        handleGroupTimeChange(weekendDays, 'open', e.target.value);
                      }
                    }}
                  >
                    <option value="">Custom</option>
                    {TIME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="sr-only">Weekend close time</span>
                  <select
                    className="h-9 w-full rounded-md border border-border/70 bg-background px-2 text-sm"
                    value={getGroupFieldValue(weekendDays, 'close')}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setExpandedWeekend(true);
                        setExpandedWeekday(false);
                      } else {
                        handleGroupTimeChange(weekendDays, 'close', e.target.value);
                      }
                    }}
                  >
                    <option value="">Custom</option>
                    {TIME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedWeekend((prev) => {
                      const next = !prev;
                      if (next) {
                        setExpandedWeekday(false);
                      }
                      return next;
                    });
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border/70 px-2 text-foreground/80 hover:bg-background"
                  aria-label={expandedWeekend ? 'Collapse weekend days' : 'Expand weekend days'}
                >
                  {expandedWeekend ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>

              {expandedWeekend && (
                <div className="max-h-44 space-y-2 overflow-y-auto border-t border-border/60 p-3 pr-2">
                  {weekendDays.map((day) => {
                    const window = getWindow(day);
                    return (
                      <div key={day} className="grid gap-2 rounded-md p-1 sm:grid-cols-[120px_1fr_1fr] sm:items-center">
                        <span className="text-sm font-medium">{day}</span>
                        <label className="space-y-1">
                          <span className="sr-only">{day} open time</span>
                          <select
                            className="h-9 w-full rounded-md border border-border/70 bg-background px-2 text-sm"
                            value={window.open}
                            onChange={(e) => handleDayTimeChange(day, 'open', e.target.value)}
                          >
                            {TIME_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-1">
                          <span className="sr-only">{day} close time</span>
                          <select
                            className="h-9 w-full rounded-md border border-border/70 bg-background px-2 text-sm"
                            value={window.close}
                            onChange={(e) => handleDayTimeChange(day, 'close', e.target.value)}
                          >
                            {TIME_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        onClick={onSubmit}
        disabled={saving}
      >
        {saving ? 'Saving...' : isEdit ? 'Update Resource' : 'Create Resource'}
      </button>
    </div>
  );
}
