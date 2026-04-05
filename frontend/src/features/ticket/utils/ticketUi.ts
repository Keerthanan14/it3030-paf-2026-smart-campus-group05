export const MAX_TICKET_IMAGES = 3;
export const MAX_TICKET_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const durationPart = (input: string, regex: RegExp): number => {
  const match = input.match(regex);
  return match ? Number(match[1]) : 0;
};

export function formatDurationLabel(duration: string | null | undefined): string {
  if (!duration) return "N/A";

  if (!duration.startsWith("P")) {
    return duration;
  }

  const timeSection = duration.includes("T") ? duration.split("T")[1] : "";
  const days = durationPart(duration, /(\d+)D/);
  const hours = durationPart(timeSection, /(\d+)H/);
  const minutes = durationPart(timeSection, /(\d+)M/);
  const seconds = durationPart(timeSection, /(\d+)S/);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && parts.length === 0) parts.push(`${seconds}s`);

  return parts.length > 0 ? parts.join(" ") : "0m";
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosLikeError = error as {
    response?: {
      data?: {
        message?: string;
        error?: string;
      };
      statusText?: string;
    };
    message?: string;
  };

  return (
    axiosLikeError?.response?.data?.message ||
    axiosLikeError?.response?.data?.error ||
    axiosLikeError?.response?.statusText ||
    axiosLikeError?.message ||
    fallback
  );
}

export function validateTicketImages(files: File[]): string | null {
  if (files.length > MAX_TICKET_IMAGES) {
    return `You can upload up to ${MAX_TICKET_IMAGES} images.`;
  }

  for (const file of files) {
    if (!(file.type === "image/jpeg" || file.type === "image/png")) {
      return "Only JPEG and PNG images are allowed.";
    }

    if (file.size > MAX_TICKET_IMAGE_SIZE_BYTES) {
      return "Each image must be 5MB or smaller.";
    }
  }

  return null;
}
