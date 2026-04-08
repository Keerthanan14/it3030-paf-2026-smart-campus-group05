import { Link } from 'react-router-dom';
import type { ResourceItem } from '../../../types/resource';

interface ResourceDetailCardProps {
  resource: ResourceItem;
  canManage: boolean;
}

function getLinkHref(resource: ResourceItem, rel: string): string | null {
  return resource._links?.[rel]?.href ?? null;
}

function formatDayLabel(day: string): string {
  return day.charAt(0) + day.slice(1).toLowerCase();
}

function floorSuffix(value: number): string {
  if (value === 0) {
    return '';
  }
  if (value % 100 >= 11 && value % 100 <= 13) {
    return 'th';
  }
  if (value % 10 === 1) return 'st';
  if (value % 10 === 2) return 'nd';
  if (value % 10 === 3) return 'rd';
  return 'th';
}

function formatLocation(resource: ResourceItem): string {
  if (resource.building && typeof resource.floor === 'number') {
    const buildingLabel = resource.building === 'SUB' ? 'Sub Building' : 'Main Building';
    if (resource.floor === 0) {
      return `${buildingLabel} Ground Floor`;
    }
    return `${buildingLabel} ${resource.floor} ${floorSuffix(resource.floor)} Floor`;
  }

  if (resource.location) {
    return resource.location
      .replace(/^MAIN\b/i, 'Main Building')
      .replace(/^SUB\b/i, 'Sub Building')
      .replace(/Floor\s+(\d+)/i, (_, n: string) => {
        const floor = Number(n);
        if (floor === 0) {
          return 'Ground Floor';
        }
        return `${floor} ${floorSuffix(floor)} Floor`;
      })
      .trim();
  }

  return 'N/A';
}

export function ResourceDetailCard({ resource, canManage }: ResourceDetailCardProps) {
  const additionalFacilities = [
    { label: 'AC', enabled: resource.hasAc },
    { label: 'Fan', enabled: resource.hasFan },
    { label: 'Projector', enabled: resource.hasProjector },
    { label: 'Smartboard', enabled: resource.hasSmartboard },
    { label: 'Camera', enabled: resource.hasCamera },
    { label: 'Podium with PC', enabled: resource.hasPodiumWithPc },
    { label: 'Podium', enabled: resource.hasPodium },
    { label: 'Whiteboard', enabled: resource.hasWhiteboard },
    { label: 'Clock', enabled: resource.hasClock },
    { label: 'Lecture chairs', enabled: resource.hasLectureChairs },
    { label: 'Lecture desks', enabled: resource.hasLectureDesks },
    { label: 'Speakers', enabled: resource.hasSpeakers },
    { label: 'Wi-Fi', enabled: resource.hasWifi },
    { label: 'Power outlets / charging ports', enabled: resource.hasPowerOutlets },
  ];

  const enabledAdditionalFacilities = additionalFacilities.filter((item) => item.enabled);

  const locationLabel = formatLocation(resource);

  // Group availability by time
  const groupedAvailability = (() => {
    const grouped: { label: string; open: string; close: string }[] = [];
    
    const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    const weekendDays = ['SATURDAY', 'SUNDAY'];
    
    const weekdayWindows = weekdays.map(day => resource.availabilityWindows?.[day]);
    const weekendWindows = weekendDays.map(day => resource.availabilityWindows?.[day]);
    
    // Check if all weekdays have same time
    if (weekdays.every(day => resource.availabilityWindows?.[day]) && 
        weekdayWindows.every(w => w?.open === weekdayWindows[0]?.open && w?.close === weekdayWindows[0]?.close)) {
      grouped.push({
        label: 'Weekday',
        open: weekdayWindows[0]?.open ?? '-',
        close: weekdayWindows[0]?.close ?? '-',
      });
    } else {
      weekdays.forEach(day => {
        if (resource.availabilityWindows?.[day]) {
          grouped.push({
            label: formatDayLabel(day),
            open: resource.availabilityWindows[day].open,
            close: resource.availabilityWindows[day].close,
          });
        }
      });
    }
    
    // Check if both weekend days have same time
    if (weekendDays.every(day => resource.availabilityWindows?.[day]) &&
        weekendWindows.every(w => w?.open === weekendWindows[0]?.open && w?.close === weekendWindows[0]?.close)) {
      grouped.push({
        label: 'Weekend',
        open: weekendWindows[0]?.open ?? '-',
        close: weekendWindows[0]?.close ?? '-',
      });
    } else {
      weekendDays.forEach(day => {
        if (resource.availabilityWindows?.[day]) {
          grouped.push({
            label: formatDayLabel(day),
            open: resource.availabilityWindows[day].open,
            close: resource.availabilityWindows[day].close,
          });
        }
      });
    }
    
    return grouped;
  })();

  return (
    <div className="w-full rounded-xl border border-border/60 bg-card p-3 sm:p-4">
      <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{resource.name} {resource.type}</h2>
            </div>
              <div className="flex items-center gap-2">
                {getLinkHref(resource, 'update') && canManage ? (
                  <Link to={`/admin/resources/${resource.id}/edit`} className="text-primary hover:text-primary/70 text-lg" title="Edit Resource">
                    ✎
                  </Link>
                ) : null}
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    resource.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {resource.status}
                </span>
              </div>
          </div>

          <div className="rounded-md border border-border/60 p-3">
            <p className="text-xs uppercase tracking-wide text-foreground/60">Resource Overview</p>

            <div className="mt-2 space-y-1 text-sm">
              <p className="whitespace-nowrap"><span className="font-medium">Location</span> - {locationLabel}</p>
              <p className="whitespace-nowrap"><span className="font-medium">Capacity</span> - {resource.capacity ?? 'N/A'}</p>
              <p className="whitespace-nowrap"><span className="font-medium">Chairs</span> - {resource.chairCount ?? 0}</p>
              <p className="whitespace-nowrap"><span className="font-medium">Tables</span> - {resource.tableCount ?? 0}</p>
              {resource.pcCount && resource.pcCount > 0 ? (
                <p className="whitespace-nowrap"><span className="font-medium">PC Count</span> - {resource.pcCount}</p>
              ) : null}
              {resource.equipmentCount && resource.equipmentCount > 0 ? (
                <p className="whitespace-nowrap"><span className="font-medium">Equipment Count</span> - {resource.equipmentCount}</p>
              ) : null}
            </div>

            <div className="mt-2">
              <p className="text-xs uppercase tracking-wide text-foreground/60">Additional Facilities</p>
              {enabledAdditionalFacilities.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {enabledAdditionalFacilities.map((facility) => (
                    <span
                      key={facility.label}
                      className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                    >
                      {facility.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-foreground/70">No additional facilities enabled.</p>
              )}
            </div>

            <div className="mt-2">
              <p className="text-xs uppercase tracking-wide text-foreground/60">Availability Windows</p>
              {groupedAvailability.length > 0 ? (
                <div className="mt-2 space-y-0 text-sm">
                  {groupedAvailability.map((item) => (
                    <div key={item.label} className="flex gap-2">
                      <span className="w-24">{item.label}</span>
                      <span>: {item.open} - {item.close}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-foreground/70">No availability windows configured.</p>
              )}
            </div>
          </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 border-t border-border/60 pt-2">
        {!canManage && getLinkHref(resource, 'book') ? (
          <Link
            to={`/student/booking?resourceId=${resource.id}`}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            Book Now
          </Link>
        ) : null}
        {getLinkHref(resource, 'activate') && canManage ? (
          <button
            type="button"
            className="rounded-md border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700"
            disabled
            title="Resource is out of service. Contact admin to reactivate."
          >
            Activate Resource
          </button>
        ) : null}
      </div>
    </div>
  );
}
