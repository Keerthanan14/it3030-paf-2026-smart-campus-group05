import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '../../../shared/components/ui/Input';
import type { ResourceItem } from '../../../types/resource';

interface BookingResourcePickerProps {
  resources: ResourceItem[];
  resourceQuery: string;
  selectedResource: ResourceItem | null;
  isLoading: boolean;
  onResourceQueryChange: (value: string) => void;
  onResourceSelect: (resource: ResourceItem) => void;
}

const formatResourceType = (type: string): string => type.replace(/_/g, ' ');
const formatResourceLabel = (resource: ResourceItem): string =>
  resource.type === 'EQUIPMENT' ? resource.name : `${resource.name} ${formatResourceType(resource.type)}`;

const formatResourceLocation = (resource: ResourceItem): string => {
  const building = resource.building === 'MAIN' ? 'Main Building' : resource.building === 'SUB' ? 'Sub Building' : '';

  if (!building) {
    return resource.location;
  }

  if (typeof resource.floor !== 'number') {
    return building;
  }

  if (resource.floor === 0) {
    return `${building} Ground Floor`;
  }

  return `${building} ${resource.floor} th Floor`;
};

export function BookingResourcePicker({
  resources,
  resourceQuery,
  selectedResource,
  isLoading,
  onResourceQueryChange,
  onResourceSelect,
}: BookingResourcePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!pickerRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const filteredResources = useMemo(() => {
    const term = resourceQuery.trim().toLowerCase();
    if (!term) {
      return resources.slice(0, 8);
    }

    return resources
      .filter((item) => {
        const normalizedType = formatResourceType(item.type).toLowerCase();
        return (
          item.name.toLowerCase().includes(term) ||
          item.type.toLowerCase().includes(term) ||
          normalizedType.includes(term) ||
          item.location.toLowerCase().includes(term) ||
          item.id.toLowerCase().includes(term)
        );
      })
      .slice(0, 8);
  }, [resources, resourceQuery]);

  return (
    <div className="relative" ref={pickerRef}>
      <Input
        label="Resource"
        value={resourceQuery}
        onChange={(e) => {
          const nextQuery = e.target.value;
          onResourceQueryChange(nextQuery);
          setIsOpen(true);

          const matched = resources.find((item) => item.id === nextQuery);
          if (matched) {
            onResourceSelect(matched);
          }
        }}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        placeholder="Search by name, type, location, or ID"
        helperText={selectedResource ? `location: ${formatResourceLocation(selectedResource)}` : 'Type to search, then pick a resource below.'}
      />

      {isOpen ? (
        <div className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-border/70 bg-background shadow-lg">
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-foreground/70">Loading resources...</p>
          ) : filteredResources.length === 0 ? (
            <p className="px-3 py-2 text-sm text-foreground/70">No matching resources.</p>
          ) : (
            filteredResources.map((item) => (
              <button
                key={item.id}
                type="button"
                className="block w-full border-b border-border/40 px-3 py-2 text-left text-sm hover:bg-muted/60"
                onClick={() => {
                  onResourceSelect(item);
                  onResourceQueryChange(formatResourceLabel(item));
                  setIsOpen(false);
                }}
              >
                <span className="font-medium">{formatResourceLabel(item)}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
