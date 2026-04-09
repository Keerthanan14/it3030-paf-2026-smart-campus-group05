import { Card } from '../../../shared/components/ui/Card';
import type { BookingItem } from '../../../types/booking';

interface BookingDetailPanelProps {
  selectedBooking: BookingItem | null;
  isDetailLoading: boolean;
}

export function BookingDetailPanel({ selectedBooking, isDetailLoading }: BookingDetailPanelProps) {
  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-lg font-semibold">Booking Detail</h2>
      {!selectedBooking && !isDetailLoading ? <p className="text-sm text-foreground/70">Select a booking to view details.</p> : null}

      {selectedBooking ? (
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p>
            <span className="font-medium">Booking ID:</span> {selectedBooking.id}
          </p>
          <p>
            <span className="font-medium">Resource:</span> {selectedBooking.resourceName}
          </p>
          <p>
            <span className="font-medium">Date:</span> {selectedBooking.bookingDate}
          </p>
          <p>
            <span className="font-medium">Time:</span> {selectedBooking.startTime} - {selectedBooking.endTime}
          </p>
          <p>
            <span className="font-medium">Status:</span> {selectedBooking.status}
          </p>
          <p>
            <span className="font-medium">Attendees:</span> {selectedBooking.attendeesCount}
          </p>
          <p className="md:col-span-2">
            <span className="font-medium">Purpose:</span> {selectedBooking.purpose}
          </p>
          {selectedBooking.status === 'REJECTED' ? (
            <p className="md:col-span-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-700">
              <span className="font-medium">Rejection Reason:</span> {selectedBooking.rejectionReason || 'No reason provided'}
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
