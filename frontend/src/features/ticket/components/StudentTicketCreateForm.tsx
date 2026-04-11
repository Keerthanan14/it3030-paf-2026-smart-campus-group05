import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Input } from "../../../shared/components/ui/Input";
import { Button } from "../../../shared/components/ui/Button";
import { MAX_TICKET_IMAGES } from "../utils/ticketUi";
import type { TicketPriority } from "../../../types/ticket";

type StudentTicketCreateFormProps = {
  showTitle?: boolean;
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

const categoryDefaults: Array<{ label: string; defaultPriority: TicketPriority }> = [
  { label: "Wi-Fi and Internet", defaultPriority: "HIGH" },
  { label: "Computer and Lab PC", defaultPriority: "MEDIUM" },
  { label: "Projector and Display", defaultPriority: "MEDIUM" },
  { label: "Printer and Scanner", defaultPriority: "LOW" },
  { label: "LMS and Software Access", defaultPriority: "MEDIUM" },
  { label: "Classroom Equipment", defaultPriority: "MEDIUM" },
  { label: "Electrical and Power", defaultPriority: "CRITICAL" },
  { label: "Air Conditioning and Ventilation", defaultPriority: "MEDIUM" },
  { label: "Furniture and Facility", defaultPriority: "LOW" },
  { label: "Booking and Resource Access", defaultPriority: "MEDIUM" },
  { label: "Account and Login", defaultPriority: "HIGH" },
  { label: "Other", defaultPriority: "LOW" },
];

const knownCategoryLabels = new Set(categoryDefaults.map((item) => item.label));
const SRI_LANKA_PREFIX = "+94";

function extractLocalPhoneDigits(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  let localPart = digitsOnly;
  if (localPart.startsWith("94")) {
    localPart = localPart.slice(2);
  } else if (localPart.startsWith("0")) {
    localPart = localPart.slice(1);
  }

  return localPart.slice(0, 9);
}

export function StudentTicketCreateForm({
  showTitle = true,
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const selectedCategory = knownCategoryLabels.has(category) ? category : "Other";

  const toFileList = (files: File[]): FileList => {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    return dataTransfer.files;
  };

  const handleCategoryChange = (value: string): void => {
    if (value === "Other") {
      onCategoryChange("");
    } else {
      onCategoryChange(value);
    }

    const found = categoryDefaults.find((item) => item.label === value);
    if (found) {
      onPriorityChange(found.defaultPriority);
    }
  };

  const handlePreferredContactChange = (value: string): void => {
    const localDigits = value.replace(/\D/g, "").slice(0, 9);
    onPreferredContactChange(localDigits ? `${SRI_LANKA_PREFIX}${localDigits}` : "");
  };

  const localPhoneDigits = extractLocalPhoneDigits(preferredContact);
  const preferredContactError =
    localPhoneDigits.length > 0 && localPhoneDigits.length < 9 ? "Enter 9 digits only" : null;
  const imagePreviews = useMemo(
    () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [images]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);

  const openFilePicker = (): void => {
    if (images.length >= MAX_TICKET_IMAGES) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handlePickerChange(event.dataTransfer.files);
  };

  const handlePickerChange = (fileList: FileList | null): void => {
    const picked = Array.from(fileList ?? []);
    if (picked.length === 0) {
      return;
    }

    const merged = [...images, ...picked];
    const unique = merged.filter(
      (file, index, all) =>
        all.findIndex((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified) ===
        index
    );

    onFileSelection(toFileList(unique));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFileAt = (indexToRemove: number): void => {
    const updated = images.filter((_, index) => index !== indexToRemove);
    onFileSelection(toFileList(updated));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {showTitle ? <h2 className="text-lg font-semibold">Create Support Ticket</h2> : null}
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select
            className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            {categoryDefaults.map((item) => (
              <option key={item.label} value={item.label}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
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
        <div>
          <label className="mb-1 block text-sm font-medium">Preferred Contact (optional)</label>
          <div className="flex h-10 overflow-hidden rounded-md border border-border/70 bg-background">
            <span className="inline-flex items-center border-r border-border/70 px-3 text-sm text-foreground/80">+94</span>
            <input
              className="w-full bg-transparent px-3 text-sm outline-none"
              value={localPhoneDigits}
              onChange={(e) => handlePreferredContactChange(e.target.value)}
              placeholder="7XXXXXXXX"
              inputMode="numeric"
              pattern="[0-9]{9}"
              maxLength={9}
            />
          </div>
          {preferredContactError ? <p className="mt-1 text-xs text-rose-600">{preferredContactError}</p> : null}
        </div>
      </div>
      {selectedCategory === "Other" ? (
        <Input
          label="Custom Category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          placeholder="Enter your category"
        />
      ) : null}
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          className="min-h-24 w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe the issue clearly so technicians can respond fast"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Attachments (optional)</label>
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          multiple
          accept="image/png,image/jpeg"
          onChange={(e) => handlePickerChange(e.target.files)}
        />
        <div
          className={`rounded-lg border-2 border-dashed p-3 transition ${isDragging ? "border-primary bg-primary/5" : "border-border/80 bg-muted/10"}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget.contains(event.relatedTarget as Node)) return;
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          onClick={openFilePicker}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
        >
          <p className="text-sm font-medium">Drag and drop images here, or click to browse</p>
          <p className="mt-1 text-xs text-foreground/60">JPEG/PNG only, up to 3 files, max 5MB each</p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {imagePreviews.map(({ file, url }, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="relative h-20 overflow-hidden rounded-md border border-border/70 bg-muted/20"
            >
              <img src={url} alt={file.name} className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded bg-background/90 px-1 text-[10px] text-rose-600 hover:bg-rose-50"
                onClick={() => removeFileAt(index)}
              >
                x
              </button>
            </div>
          ))}
          {images.length < MAX_TICKET_IMAGES ? (
            <button
              type="button"
              onClick={openFilePicker}
              aria-label="Add attachment"
              className="flex h-20 items-center justify-center rounded-md border border-dashed border-border/80 bg-muted/10 text-2xl font-light text-foreground/70 transition hover:bg-muted/20"
            >
              +
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-foreground/60">
          {images.length}/{MAX_TICKET_IMAGES} selected (JPEG/PNG, max 5MB each)
        </p>
        {imageError ? <p className="mt-1 text-xs text-rose-600">{imageError}</p> : null}
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
