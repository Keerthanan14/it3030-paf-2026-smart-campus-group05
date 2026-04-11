import type { Ticket, TicketStatus } from "../../../types/ticket";

export const MAX_TICKET_IMAGES = 3;
export const MAX_TICKET_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const FIRST_RESPONSE_TARGET_HOURS = 4;
const RESOLUTION_TARGET_HOURS = 48;
const SLA_WARNING_RATIO = 0.75;

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

export type SlaTone = "good" | "warning" | "breached";

function getElapsedHours(start: string, end: string = new Date().toISOString()): number {
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60));
}

function isTerminalStatus(status: TicketStatus): boolean {
  return status === "CLOSED" || status === "REJECTED";
}

function getSlaTone(elapsedHours: number, breached: boolean, targetHours: number): SlaTone {
  if (breached) return "breached";
  if (elapsedHours >= targetHours * SLA_WARNING_RATIO) return "warning";
  return "good";
}

export function getFirstResponseSlaTone(ticket: Pick<Ticket, "createdAt" | "firstResponseAt" | "firstResponseBreached">): SlaTone {
  const elapsedHours = getElapsedHours(ticket.createdAt, ticket.firstResponseAt ?? undefined);
  return getSlaTone(elapsedHours, ticket.firstResponseBreached, FIRST_RESPONSE_TARGET_HOURS);
}

export function getResolutionSlaTone(ticket: Pick<Ticket, "createdAt" | "resolvedAt" | "resolutionBreached" | "status">): SlaTone {
  const hasResolved = Boolean(ticket.resolvedAt);
  const terminalWithoutResolution = !hasResolved && isTerminalStatus(ticket.status);
  const elapsedHours = getElapsedHours(ticket.createdAt, ticket.resolvedAt ?? undefined);

  if (terminalWithoutResolution) {
    return ticket.resolutionBreached ? "breached" : "good";
  }

  return getSlaTone(elapsedHours, ticket.resolutionBreached, RESOLUTION_TARGET_HOURS);
}

export function getSlaToneClass(tone: SlaTone): string {
  if (tone === "breached") return "bg-rose-100 text-rose-700";
  if (tone === "warning") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export function getSlaLabel(tone: SlaTone): string {
  if (tone === "breached") return "SLA Breached";
  if (tone === "warning") return "Approaching SLA";
  return "Within SLA";
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
