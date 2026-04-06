import type { AvailabilityWindow, ResourceFormValues, ResourceStatus, ResourceType } from '../../../types/resource';

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
  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-card p-5">
      {error ? <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">Name</span>
          <input
            className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
            value={values.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder="Engineering Lab 1"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium">Location</span>
          <input
            className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
            value={values.location}
            onChange={(e) => onFieldChange('location', e.target.value)}
            placeholder="Block B - Floor 2"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium">Type</span>
          <select
            className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
            value={values.type}
            onChange={(e) => onFieldChange('type', e.target.value as ResourceType)}
          >
            <option value="ROOM">ROOM</option>
            <option value="LAB">LAB</option>
            <option value="EQUIPMENT">EQUIPMENT</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium">Capacity</span>
          <input
            type="number"
            min={1}
            className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
            value={values.capacity}
            onChange={(e) => onFieldChange('capacity', Number(e.target.value || 1))}
          />
        </label>

        {isEdit ? (
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium">Status</span>
            <select
              className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
              value={values.status ?? 'ACTIVE'}
              onChange={(e) => onFieldChange('status', e.target.value as ResourceStatus)}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
            </select>
          </label>
        ) : null}

        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium">Description</span>
          <textarea
            className="min-h-24 w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
            value={values.description ?? ''}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder="Optional details for users"
          />
        </label>
      </div>

      <div>
        <p className="text-sm font-semibold">Availability Windows</p>
        <div className="mt-2 grid gap-2">
          {days.map((day) => {
            const window = values.availabilityWindows?.[day] ?? { open: '08:00', close: '17:00' };
            return (
              <div key={day} className="grid items-center gap-2 rounded-md border border-border/60 p-2 sm:grid-cols-[140px_1fr_1fr]">
                <span className="text-sm font-medium">{day}</span>
                <input
                  type="time"
                  className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm"
                  value={window.open}
                  onChange={(e) => onWindowChange(day, 'open', e.target.value)}
                />
                <input
                  type="time"
                  className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm"
                  value={window.close}
                  onChange={(e) => onWindowChange(day, 'close', e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        onClick={onSubmit}
        disabled={saving}
      >
        {saving ? 'Saving...' : isEdit ? 'Update Resource' : 'Create Resource'}
      </button>
    </div>
  );
}
