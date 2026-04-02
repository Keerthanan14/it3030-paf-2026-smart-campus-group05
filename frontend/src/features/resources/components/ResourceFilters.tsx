import { useEffect, useState } from 'react';
import type { ResourceFilters as ResourceFiltersType, ResourceStatus, ResourceType } from '../../../types/resource';

interface ResourceFiltersProps {
  initialFilters: ResourceFiltersType;
  onApply: (filters: ResourceFiltersType) => void;
}

export function ResourceFilters({ initialFilters, onApply }: ResourceFiltersProps) {
  const [keyword, setKeyword] = useState(initialFilters.keyword);
  const [location, setLocation] = useState(initialFilters.location);
  const [capacity, setCapacity] = useState<string>(initialFilters.capacity?.toString() ?? '');
  const [type, setType] = useState<ResourceType | ''>(initialFilters.type ?? '');
  const [status, setStatus] = useState<ResourceStatus | ''>(initialFilters.status ?? '');

  useEffect(() => {
    setKeyword(initialFilters.keyword);
    setLocation(initialFilters.location);
    setCapacity(initialFilters.capacity?.toString() ?? '');
    setType(initialFilters.type ?? '');
    setStatus(initialFilters.status ?? '');
  }, [initialFilters]);

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="grid gap-3 md:grid-cols-5">
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

        <input
          type="number"
          min={1}
          className="h-10 rounded-md border border-border/70 bg-background px-3 text-sm"
          placeholder="Min capacity"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />

        <select
          className="h-10 rounded-md border border-border/70 bg-background px-3 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as ResourceType | '')}
        >
          <option value="">All types</option>
          <option value="ROOM">ROOM</option>
          <option value="LAB">LAB</option>
          <option value="EQUIPMENT">EQUIPMENT</option>
        </select>

        <select
          className="h-10 rounded-md border border-border/70 bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as ResourceStatus | '')}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
        </select>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          onClick={() => {
            onApply({
              keyword,
              location,
              capacity: capacity ? Number(capacity) : undefined,
              type: type || undefined,
              status: status || undefined,
            });
          }}
        >
          Apply Filters
        </button>
        <button
          type="button"
          className="rounded-md border border-border/70 px-4 py-2 text-sm font-medium"
          onClick={() => {
            setKeyword('');
            setLocation('');
            setCapacity('');
            setType('');
            setStatus('');
            onApply({ keyword: '', location: '' });
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}