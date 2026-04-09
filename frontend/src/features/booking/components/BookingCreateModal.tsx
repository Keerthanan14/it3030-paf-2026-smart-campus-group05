import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';
import { BookingAttendeesField } from './BookingAttendeesField';
import { BookingResourcePicker } from './BookingResourcePicker';
import { BookingScheduleFields } from './BookingScheduleFields';
import type { ResourceItem } from '../../../types/resource';

interface BookingCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: ResourceItem[];
  isResourcesLoading: boolean;
  resourceQuery: string;
  selectedResource: ResourceItem | null;
  availableSpace: number | null;
  bookingDate: string;
  minBookingDate: string;
  maxBookingDate: string;
  selectedWeekday: string;
  selectedDayWindow: { open: string; close: string } | null;
  startTime: string;
  endTime: string;
  startTimeOptions: string[];
  endTimeOptions: string[];
  attendeesCount: string;
  purpose: string;
  errorMessage: string | null;
  canSubmit: boolean;
  isSubmitting: boolean;
  onResourceQueryChange: (value: string) => void;
  onResourceSelect: (resource: ResourceItem) => void;
  onAttendeesChange: (value: string) => void;
  onBookingDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onPurposeChange: (value: string) => void;
  onSubmit: () => void;
}

export function BookingCreateModal({
  isOpen,
  onClose,
  resources,
  isResourcesLoading,
  resourceQuery,
  selectedResource,
  availableSpace,
  bookingDate,
  minBookingDate,
  maxBookingDate,
  selectedWeekday,
  selectedDayWindow,
  startTime,
  endTime,
  startTimeOptions,
  endTimeOptions,
  attendeesCount,
  purpose,
  errorMessage,
  canSubmit,
  isSubmitting,
  onResourceQueryChange,
  onResourceSelect,
  onAttendeesChange,
  onBookingDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onPurposeChange,
  onSubmit,
}: BookingCreateModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Booking Request" className="max-w-3xl">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <BookingResourcePicker
            resources={resources}
            resourceQuery={resourceQuery}
            selectedResource={selectedResource}
            isLoading={isResourcesLoading}
            onResourceQueryChange={onResourceQueryChange}
            onResourceSelect={onResourceSelect}
          />

          <Input
            type="date"
            label="Booking Date"
            min={minBookingDate}
            max={maxBookingDate}
            value={bookingDate}
            onChange={(e) => onBookingDateChange(e.target.value)}
            helperText={`Allowed range: ${minBookingDate} to ${maxBookingDate}`}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <BookingScheduleFields
            className="grid gap-3 md:col-span-2 md:grid-cols-2"
            selectedWeekday={selectedWeekday}
            selectedDayWindow={selectedDayWindow}
            startTime={startTime}
            endTime={endTime}
            startTimeOptions={startTimeOptions}
            endTimeOptions={endTimeOptions}
            onStartTimeChange={onStartTimeChange}
            onEndTimeChange={onEndTimeChange}
          />

          <BookingAttendeesField
            selectedResource={selectedResource}
            attendeesCount={attendeesCount}
            availableSpace={availableSpace}
            onAttendeesChange={onAttendeesChange}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Purpose</label>
          <textarea
            className="min-h-24 w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
            value={purpose}
            onChange={(e) => onPurposeChange(e.target.value)}
            placeholder="Describe why this resource is needed"
          />
        </div>

        {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} isLoading={isSubmitting} disabled={!canSubmit}>
            Submit Booking
          </Button>
        </div>
      </div>
    </Modal>
  );
}
