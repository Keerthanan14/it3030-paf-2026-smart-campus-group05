import { Link, useNavigate, useParams } from 'react-router-dom';
import { useResourceAvailability } from '../hooks/useResourceAvailability';
import { StickyPageHeader } from '../../../shared/components/ui/StickyPageHeader';
import { ResourceAvailabilityCalendar } from './ResourceAvailabilityCalendar';

export function ResourceCalendarView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { from, to, setRange, data, loading, error } = useResourceAvailability(id);

  const handleBookSlot = (payload: { resourceId: string; date: string; startTime: string; endTime: string }) => {
    const params = new URLSearchParams({
      resourceId: payload.resourceId,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
    });
    navigate(`/student/booking?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="Resource Calendar"
        description="Check date-range availability and blocked booking slots."
        action={
          <Link to={id ? `/resources/${id}` : '/resources'} className="rounded-md border border-border/70 px-3 py-2 text-sm">
            Back
          </Link>
        }
      />

      <ResourceAvailabilityCalendar
        resourceId={id}
        data={data}
        loading={loading}
        error={error}
        from={from}
        to={to}
        onRangeChange={setRange}
        onBookSlot={handleBookSlot}
      />
    </div>
  );
}