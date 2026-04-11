import { Fragment, useEffect, useMemo, useRef, type ReactNode } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { formatDurationLabel, getFirstResponseSlaTone, getResolutionSlaTone, getSlaLabel, getSlaToneClass } from "../utils/ticketUi";
import type { Ticket, TicketComment } from "../../../types/ticket";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

function resolveAttachmentUrl(fileUrl: string): string {
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  return `${apiBaseUrl}${fileUrl}`;
}

function getStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "OPEN") return "bg-amber-100 text-amber-800";
  if (normalized === "IN_PROGRESS") return "bg-blue-100 text-blue-800";
  if (normalized === "RESOLVED") return "bg-emerald-100 text-emerald-800";
  if (normalized === "CLOSED") return "bg-slate-200 text-slate-800";
  if (normalized === "REJECTED") return "bg-rose-100 text-rose-800";
  return "bg-muted text-foreground";
}

function getCommentRole(ticket: Ticket, comment: TicketComment): "Student" | "Technician" | "Admin" {
  if (comment.userId === ticket.userId) {
    return "Student";
  }

  if (ticket.assignedToId && comment.userId === ticket.assignedToId) {
    return "Technician";
  }

  return "Admin";
}

function getBubbleClass(role: "Student" | "Technician" | "Admin", isOwn: boolean): string {
  if (isOwn) {
    return "rounded-tr-md border-emerald-200 bg-emerald-100";
  }

  if (role === "Student") return "rounded-tl-md border-slate-200 bg-white";
  if (role === "Technician") return "rounded-tl-md border-slate-200 bg-white";
  return "rounded-tl-md border-slate-200 bg-white";
}

function normalizeId(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const dayDiff = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";

  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
}

export type TicketMetaField = {
  label: string;
  value: ReactNode;
};

type BaseTicketDetailProps = {
  title: string;
  emptyMessage: string;
  ticket: Ticket | null;
  showChat?: boolean;
  contentActionsPosition?: "before" | "beforeStatus" | "after";
  detailLoading: boolean;
  detailError: string | null;
  actionError?: string | null;
  commentError: string | null;
  commentLoading: boolean;
  canAddComment: boolean;
  cannotCommentMessage: string;
  commentInputPlaceholder: string;
  comments: TicketComment[];
  commentDraft: string;
  editingCommentId: string | null;
  editingCommentValue: string;
  metaFields: TicketMetaField[];
  contentActions?: ReactNode;
  currentUserId?: string;
  onCommentDraftChange: (value: string) => void;
  onAddComment: () => void;
  onCancelEditComment: () => void;
  onEditingCommentValueChange: (value: string) => void;
  onSaveEditedComment: () => void;
  renderCommentActions?: (comment: TicketComment) => ReactNode;
};

export function BaseTicketDetail({
  title,
  emptyMessage,
  ticket,
  showChat = true,
  contentActionsPosition = "after",
  detailLoading,
  detailError,
  actionError,
  commentError,
  commentLoading,
  canAddComment,
  cannotCommentMessage,
  commentInputPlaceholder,
  comments,
  commentDraft,
  editingCommentId,
  editingCommentValue,
  metaFields,
  contentActions,
  currentUserId,
  onCommentDraftChange,
  onAddComment,
  onCancelEditComment,
  onEditingCommentValueChange,
  onSaveEditedComment,
  renderCommentActions,
}: BaseTicketDetailProps) {
  const commentsListRef = useRef<HTMLUListElement | null>(null);
  const isEditingComment = Boolean(editingCommentId);
  const activeInputValue = isEditingComment ? editingCommentValue : commentDraft;
  const canSubmitInput = Boolean(activeInputValue.trim()) && canAddComment;

  const timelineItems = useMemo(() => {
    if (!ticket) return [];

    const items: Array<{ title: string; time: string; note: string; tone: "good" | "warning" | "breached" }> = [
      {
        title: "Created",
        time: ticket.createdAt,
        note: "Ticket submitted",
        tone: "good",
      },
    ];

    if (ticket.firstResponseAt) {
      items.push({
        title: "First Response",
        time: ticket.firstResponseAt,
        note: "First action recorded",
        tone: getFirstResponseSlaTone(ticket),
      });
    } else {
      items.push({
        title: "First Response",
        time: ticket.updatedAt,
        note: "Waiting for first action",
        tone: getFirstResponseSlaTone(ticket),
      });
    }

    if (ticket.resolvedAt) {
      items.push({
        title: "Resolved",
        time: ticket.resolvedAt,
        note: ticket.resolutionNotes ?? "Marked as resolved",
        tone: getResolutionSlaTone(ticket),
      });
    } else {
      items.push({
        title: "Resolution",
        time: ticket.updatedAt,
        note: ticket.status === "CLOSED" || ticket.status === "REJECTED" ? `Final status: ${ticket.status}` : "Waiting for resolution",
        tone: getResolutionSlaTone(ticket),
      });
    }

    if (ticket.status === "CLOSED" || ticket.status === "REJECTED") {
      items.push({
        title: ticket.status === "CLOSED" ? "Closed" : "Rejected",
        time: ticket.updatedAt,
        note: ticket.status === "REJECTED" ? ticket.rejectionReason ?? "Rejected by admin" : "Final closure",
        tone: ticket.status === "REJECTED" ? "breached" : "good",
      });
    }

    return items;
  }, [ticket]);

  const handleSubmitFromInput = (): void => {
    if (!canSubmitInput) return;

    if (isEditingComment) {
      onSaveEditedComment();
      return;
    }

    onAddComment();
  };

  const handleInputChange = (value: string): void => {
    if (isEditingComment) {
      onEditingCommentValueChange(value);
      return;
    }

    onCommentDraftChange(value);
  };

  const groupedComments = useMemo(() => {
    const sorted = [...comments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const groups = new Map<string, { label: string; items: TicketComment[] }>();
    for (const comment of sorted) {
      const createdAt = new Date(comment.createdAt);
      const key = toDayKey(createdAt);
      const existing = groups.get(key);

      if (existing) {
        existing.items.push(comment);
      } else {
        groups.set(key, { label: getDayLabel(createdAt), items: [comment] });
      }
    }

    return Array.from(groups.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      items: value.items,
    }));
  }, [comments]);

  useEffect(() => {
    const commentsList = commentsListRef.current;
    if (!commentsList) return;

    commentsList.scrollTop = commentsList.scrollHeight;
  }, [ticket?.id, comments.length]);

  return (
    <>
      {title ? <p className="hidden">{title}</p> : null}
      {detailError ? <p className="text-sm text-rose-600">{detailError}</p> : null}
      {actionError ? <p className="text-sm text-rose-600">{actionError}</p> : null}
      {!ticket && !detailLoading ? <p className="text-sm text-foreground/70">{emptyMessage}</p> : null}

      {ticket ? (
        <div className={`grid gap-2.5 ${showChat ? "lg:grid-cols-2" : "lg:grid-cols-1"} lg:items-stretch`}>
          <div className="space-y-3">
            {contentActionsPosition === "before" && contentActions ? <div className="space-y-2">{contentActions}</div> : null}

            <div className="rounded-2xl border border-border/70 bg-muted/10 p-3 md:p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/60">Ticket Summary</p>
                  <p className="text-xs text-foreground/80">Review the selected ticket details</p>
                </div>
                <div className="flex items-center gap-2">
                  {contentActionsPosition === "beforeStatus" && contentActions ? contentActions : null}
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusBadgeClass(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="border-b border-border/60 pb-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">Ticket ID</p>
                  <p className="mt-1 break-all font-medium">{ticket.id}</p>
                </div>

                <div className="grid gap-2.5 border-b border-border/60 pb-2.5 md:grid-cols-2">
                  {metaFields.map((field) => (
                    <div key={field.label}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">{field.label}</p>
                      <p className="mt-1 font-medium">{field.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-2.5 border-b border-border/60 pb-2.5 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">First Response SLA</p>
                    <p className={`mt-1 inline-flex rounded px-2 py-0.5 text-xs font-semibold ${getSlaToneClass(getFirstResponseSlaTone(ticket))}`}>
                      {getSlaLabel(getFirstResponseSlaTone(ticket))} ({formatDurationLabel(ticket.timeToFirstResponse)})
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">Resolution SLA</p>
                    <p className={`mt-1 inline-flex rounded px-2 py-0.5 text-xs font-semibold ${getSlaToneClass(getResolutionSlaTone(ticket))}`}>
                      {getSlaLabel(getResolutionSlaTone(ticket))} ({formatDurationLabel(ticket.timeToResolution)})
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">Timeline</p>
                  <div className="mt-2 space-y-1.5">
                    {timelineItems.map((item) => (
                      <div key={`${item.title}-${item.time}`} className="rounded-md border border-border/60 bg-background px-2.5 py-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold">{item.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getSlaToneClass(item.tone)}`}>{item.note}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-foreground/60">{new Date(item.time).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">Description</p>
                  <p className="mt-1 rounded-md bg-background px-2.5 py-1.5 text-xs">{ticket.description}</p>
                </div>
              </div>
            </div>

            {ticket.attachments.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-medium">Attachments</h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {ticket.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={resolveAttachmentUrl(attachment.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      title={attachment.fileName}
                      className="group relative block h-20 overflow-hidden rounded-md border border-border/70 bg-muted/20"
                    >
                      <img
                        src={resolveAttachmentUrl(attachment.fileUrl)}
                        alt={attachment.fileName}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {contentActionsPosition === "after" && contentActions ? <div className="space-y-2">{contentActions}</div> : null}
          </div>

          {showChat ? (
          <div className="flex h-full max-h-[82vh] min-h-0 flex-col space-y-2.5 overflow-hidden rounded-2xl border border-border/70 bg-[#efeae2] p-3 md:p-4">
            <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
              <div>
                <h3 className="text-sm font-medium">Chat</h3>
                <p className="text-[11px] text-foreground/65">Ticket conversation</p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/75">
                {comments.length} {comments.length === 1 ? "message" : "messages"}
              </span>
            </div>
            {!canAddComment ? <p className="text-[11px] text-foreground/60">{cannotCommentMessage}</p> : null}
            {commentError ? <p className="text-sm text-rose-600">{commentError}</p> : null}
            <ul ref={commentsListRef} className="scrollbar-hide min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
              {groupedComments.map((group) => (
                <Fragment key={group.key}>
                  <li className="my-0.5 flex justify-center">
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-foreground/70">{group.label}</span>
                  </li>
                  {group.items.map((comment) => {
                    const commentActions = renderCommentActions ? renderCommentActions(comment) : null;
                    const role = getCommentRole(ticket, comment);
                    const normalizedCommentUserId = normalizeId(comment.userId);
                    const normalizedCurrentUserId = normalizeId(currentUserId);
                    const isOwn =
                      normalizedCurrentUserId.length > 0
                        ? normalizedCommentUserId === normalizedCurrentUserId
                        : normalizedCommentUserId === normalizeId(ticket.userId);

                    return (
                      <li key={comment.id} className={`flex w-full items-start gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`w-fit max-w-[82%] rounded-2xl border px-3 py-1.5 text-xs shadow-sm ${getBubbleClass(role, isOwn)}`}>
                          <p className="wrap-break-word whitespace-pre-wrap">{comment.content}</p>
                          <div className="mt-1 flex items-center justify-end gap-1">
                            <p className="text-[11px] text-foreground/55">
                              {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        {editingCommentId !== comment.id && commentActions ? <div className="flex items-center gap-1">{commentActions}</div> : null}
                      </li>
                    );
                  })}
                </Fragment>
              ))}
              {groupedComments.length === 0 ? (
                <li className="rounded-xl border border-dashed border-border/70 bg-background/70 p-4 text-center text-sm text-foreground/60">
                  <p className="font-medium">No comments yet</p>
                  <p className="mt-1 text-xs">Start the conversation for this ticket</p>
                </li>
              ) : null}
            </ul>

            {isEditingComment ? (
              <div className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800">
                <span>Editing selected message</span>
                <Button type="button" size="sm" variant="ghost" onClick={onCancelEditComment}>
                  Cancel
                </Button>
              </div>
            ) : null}

            <div className="sticky bottom-0 flex gap-2 rounded-lg bg-[#efeae2] p-1.5">
              <Input
                value={activeInputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && canSubmitInput) {
                    e.preventDefault();
                    handleSubmitFromInput();
                  }
                }}
                placeholder={commentInputPlaceholder}
                className="text-xs"
              />
              <Button
                type="button"
                onClick={handleSubmitFromInput}
                isLoading={commentLoading}
                disabled={!canSubmitInput}
                className="h-9 w-9 rounded-full p-0"
                aria-label={isEditingComment ? "Save edited comment" : "Send comment"}
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export default BaseTicketDetail;