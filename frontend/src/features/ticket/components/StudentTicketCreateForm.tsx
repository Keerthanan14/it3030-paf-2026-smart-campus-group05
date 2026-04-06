import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { MAX_TICKET_IMAGES } from "../utils/ticketUi";
import type { TicketPriority } from "../../../types/ticket";

type StudentTicketCreateFormProps = {
  category: string;
  description: string;
  priority: TicketPriority;
  preferredContact: string;
  images: File[];
  imageError: string | null;
  canSubmit: boolean;
  actionLoading: boolean;
  actionError: string | null;
  onCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriorityChange: (value: TicketPriority) => void;
  onPreferredContactChange: (value: string) => void;
  onFileSelection: (files: FileList | null) => void;
  onSubmit: () => void;
};

const priorities: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function StudentTicketCreateForm({
  category,
  description,
  priority,
  preferredContact,
  images,
  imageError,
  canSubmit,
  actionLoading,
  actionError,
  onCategoryChange,
  onDescriptionChange,
  onPriorityChange,
  onPreferredContactChange,
  onFileSelection,
  onSubmit,
}: StudentTicketCreateFormProps) {
  return (
    <>
      <h2 className="text-lg font-semibold">Create Support Ticket</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Category" value={category} onChange={(e) => onCategoryChange(e.target.value)} placeholder="Wi-Fi, Projector, Lab PC..." />
        <div>
          <label className="mb-1 block text-sm font-medium">Priority</label>
          <select
            className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as TicketPriority)}
          >
            {priorities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          className="min-h-[96px] w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe the issue clearly so technicians can respond fast"
        />
      </div>
      <Input
        label="Preferred Contact (optional)"
        value={preferredContact}
        onChange={(e) => onPreferredContactChange(e.target.value)}
        placeholder="Email or phone"
      />
      <div>
        <label className="mb-1 block text-sm font-medium">Attachments (optional)</label>
        <p className="mb-2 text-xs text-foreground/60">Up to {MAX_TICKET_IMAGES} images, JPEG/PNG, max 5MB each.</p>
        <input
          className="block w-full text-sm"
          type="file"
          multiple
          accept="image/png,image/jpeg"
          onChange={(e) => onFileSelection(e.target.files)}
        />
        {imageError ? <p className="mt-1 text-xs text-rose-600">{imageError}</p> : null}
        {images.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {images.map((file) => (
              <div key={`${file.name}-${file.size}`} className="rounded-md border border-border/70 bg-muted/20 p-2 text-xs">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-foreground/60">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {actionError ? <p className="text-sm text-rose-600">{actionError}</p> : null}
      <div className="flex justify-end">
        <Button type="button" onClick={onSubmit} disabled={!canSubmit} isLoading={actionLoading}>
          Submit Ticket
        </Button>
      </div>
    </>
  );
}

export default StudentTicketCreateForm;
