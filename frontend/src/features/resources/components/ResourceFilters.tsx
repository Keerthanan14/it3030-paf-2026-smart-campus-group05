import { useEffect, useState } from 'react';
import type { ResourceFilters as ResourceFiltersType, ResourceStatus, ResourceType } from '../../../types/resource';

interface ResourceFiltersProps {
  initialFilters: ResourceFiltersType;
  onApply: (filters: ResourceFiltersType) => void;
}

export function ResourceFilters({ initialFilters, onApply }: ResourceFiltersProps) {
  const [keyword, setKeyword] = useState(initialFilters.keyword);
  const [location, setLocation] = useState(initialFilters.location);
  const [type, setType] = useState<ResourceType | ''>(initialFilters.type ?? '');
  const [status, setStatus] = useState<ResourceStatus | ''>(initialFilters.status ?? '');
  const [allowBookings, setAllowBookings] = useState(Boolean(initialFilters.allowBookings));

  useEffect(() => {
    setKeyword(initialFilters.keyword);
    setLocation(initialFilters.location);
    setType(initialFilters.type ?? '');
    setStatus(initialFilters.status ?? '');
    setAllowBookings(Boolean(initialFilters.allowBookings));
  }, [initialFilters]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onApply({
        keyword,
        location,
        type: type || undefined,
        status: status || undefined,
        allowBookings: allowBookings ? true : undefined,
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [keyword, location, type, status, allowBookings, onApply]);

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(280px,1.8fr)_minmax(180px,1fr)_minmax(180px,0.9fr)_max-content_max-content] lg:items-center">
        <input
          className="h-10 rounded-md border border-border/70 bg-background px-3 text-sm"
          placeholder="Search by name or description"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <input
          className="h-10 rounded-md border border-border/70 bg-background px-3 text-sm"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <select
          className="h-10 rounded-md border border-border/70 bg-background px-3 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as ResourceType | '')}
        >
          <option value="">All types</option>
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

        <div className="flex items-center gap-3 text-sm whitespace-nowrap min-w-0">
          <span className="font-medium">Status</span>
          <label className="inline-flex items-center gap-1.5">
            <input type="radio" name="status-filter" value="" checked={status === ''} onChange={() => setStatus('')} />
            <span>All</span>
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input type="radio" name="status-filter" value="ACTIVE" checked={status === 'ACTIVE'} onChange={() => setStatus('ACTIVE')} />
            <span>Active</span>
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input type="radio" name="status-filter" value="OUT_OF_SERVICE" checked={status === 'OUT_OF_SERVICE'} onChange={() => setStatus('OUT_OF_SERVICE')} />
            <span>Out of Service</span>
          </label>
        </div>

        <label className="inline-flex h-10 items-center gap-2 text-sm justify-self-start">
          <input
            type="checkbox"
            checked={allowBookings}
            onChange={(e) => setAllowBookings(e.target.checked)}
          />
          <span>Booking</span>
        </label>
      </div>

    </div>
  );
}