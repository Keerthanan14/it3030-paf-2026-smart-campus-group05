import { Link, useNavigate, useParams } from 'react-router-dom';
import { ResourceAvailabilityCalendar } from '../../features/resources/components/ResourceAvailabilityCalendar';
import { useResourceAvailability } from '../../features/resources/hooks/useResourceAvailability';

export default function ResourceCalendarPage() {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resource Calendar</h1>
          <p className="mt-1 text-sm text-foreground/70">Check date-range availability and blocked booking slots.</p>
        </div>
        <Link to={id ? `/resources/${id}` : '/resources'} className="rounded-md border border-border/70 px-3 py-2 text-sm">
          Back
        </Link>
      </div>
      <hr className="-mx-4 border-border/70 sm:-mx-6 lg:-mx-8" />

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
