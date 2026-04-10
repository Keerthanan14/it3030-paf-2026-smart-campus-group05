import type { ResourceItem } from '../../../types/resource';

const STUDY_AREA_MAX_SELECTION = 5;
const EQUIPMENT_MAX_SELECTION = 2;

const buildOptionLabel = (count: number, isEquipment: boolean): string => {
  if (isEquipment) {
    return `${count} item${count === 1 ? '' : 's'}`;
  }

  return `${count} student${count === 1 ? '' : 's'}`;
};

interface BookingAttendeesFieldProps {
  selectedResource: ResourceItem | null;
  attendeesCount: string;
  availableSpace: number | null;
  onAttendeesChange: (value: string) => void;
}

export function BookingAttendeesField({
  selectedResource,
  attendeesCount,
  availableSpace,
  onAttendeesChange,
}: BookingAttendeesFieldProps) {
  const isEquipment = selectedResource?.type === 'EQUIPMENT';
  const hardMax = isEquipment ? EQUIPMENT_MAX_SELECTION : STUDY_AREA_MAX_SELECTION;
  const totalCount = isEquipment
    ? Math.max(1, selectedResource?.equipmentCount ?? selectedResource?.capacity ?? 1)
    : Math.max(1, selectedResource?.capacity ?? STUDY_AREA_MAX_SELECTION);
  const remainingCount = Math.max(0, availableSpace ?? totalCount);
  const maxSelectable = selectedResource ? Math.min(hardMax, remainingCount) : 0;
  const optionValues = Array.from({ length: maxSelectable }, (_, index) => index + 1);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{isEquipment ? 'Count' : 'Attendees'}</label>
      <select
        className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
        value={attendeesCount}
        onChange={(e) => onAttendeesChange(e.target.value)}
        disabled={!selectedResource}
      >
        {!selectedResource ? <option value="">Select a resource first</option> : null}
        {selectedResource && optionValues.length === 0 ? <option value="">No available space</option> : null}
        {optionValues.map((count) => (
          <option key={count} value={String(count)}>
            {buildOptionLabel(count, isEquipment)}
          </option>
        ))}
      </select>

      {selectedResource ? (
        <div className="mt-1 flex items-center justify-between text-xs text-foreground/70">
          <span>{isEquipment ? 'count limit' : 'capacity'}: {totalCount}</span>
          <span>{isEquipment ? 'available count' : 'available space'}: {remainingCount}</span>
        </div>
      ) : null}
    </div>
  );
}
