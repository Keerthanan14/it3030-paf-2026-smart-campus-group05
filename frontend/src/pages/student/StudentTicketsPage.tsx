import { useEffect, useMemo, useState } from "react";
import { Button } from "../../shared/components/ui/Button";
import { Card } from "../../shared/components/ui/Card";
import { Input } from "../../shared/components/ui/Input";
import { useToast } from "../../shared/components/ui/ToastProvider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../shared/components/ui/Table";
import useTicketActions from "../../features/ticket/hooks/useTicketActions";
import useTicketAutoRefresh from "../../features/ticket/hooks/useTicketAutoRefresh";
import useTicketComments from "../../features/ticket/hooks/useTicketComments";
import useTicketDetail from "../../features/ticket/hooks/useTicketDetail";
import useTicketsList from "../../features/ticket/hooks/useTicketsList";
import { formatDurationLabel, getApiErrorMessage, MAX_TICKET_IMAGES, validateTicketImages } from "../../features/ticket/utils/ticketUi";
import { useAuthStore } from "../../core/store/authStore";
import type { TicketPriority } from "../../types/ticket";

const priorities: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const badgeTone: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-sky-100 text-sky-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-slate-200 text-slate-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

export default function StudentTicketsPage() {
  const toast = useToast();
  const currentUser = useAuthStore((state) => state.user);

  const {
    tickets,
    loading,
    error,
    filters,
    page,
    size,
    totalPages,
    totalElements,
    setPage,
    setSize,
    updateFilters,
    refresh,
  } = useTicketsList();

  const { loading: actionLoading, error: actionError, createTicket, createTicketWithImages } = useTicketActions();
  const { ticket, loading: detailLoading, error: detailError, setSelectedTicketId, refresh: refreshDetail } = useTicketDetail();

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [preferredContact, setPreferredContact] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentValue, setEditingCommentValue] = useState("");

  const {
    comments,
    loading: commentLoading,
    error: commentError,
    addComment,
    updateComment,
    deleteComment,
    setCommentList,
  } = useTicketComments(ticket?.comments ?? []);

  useEffect(() => {
    setCommentList(ticket?.comments ?? []);
  }, [setCommentList, ticket]);

  useTicketAutoRefresh({
    enabled: Boolean(ticket?.id),
    onRefresh: async () => {
      await Promise.all([refresh(), refreshDetail()]);
    },
  });

  const canSubmit = useMemo(
    () => category.trim().length > 1 && description.trim().length > 5,
    [category, description]
  );

  const handleCreateTicket = async (): Promise<void> => {
    if (!canSubmit) return;

    const payload = {
      category: category.trim(),
      description: description.trim(),
      priority,
      preferredContact: preferredContact.trim() || undefined,
    };

    try {
      if (images.length > 0) {
        await createTicketWithImages(payload, images);
      } else {
        await createTicket(payload);
      }

      toast.success("Ticket created", "Your support request has been submitted.");
    } catch (error) {
      toast.error("Ticket creation failed", getApiErrorMessage(error, "Please check your inputs and try again."));
      return;
    }

    setCategory("");
    setDescription("");
    setPriority("MEDIUM");
    setPreferredContact("");
    setImages([]);
    await refresh();
  };

  const handleAddComment = async (): Promise<void> => {
    if (!ticket || !commentDraft.trim()) return;

    try {
      await addComment(ticket.id, commentDraft.trim());
      setCommentDraft("");
      toast.success("Comment added");
      await refreshDetail();
    } catch (error) {
      toast.error("Could not add comment", getApiErrorMessage(error, "Try again."));
    }
  };

  const handleFileSelection = (fileList: FileList | null): void => {
    const selected = Array.from(fileList ?? []);
    const validationError = validateTicketImages(selected);

    if (validationError) {
      setImageError(validationError);
      toast.warning("Attachment validation", validationError);
      return;
    }

    setImageError(null);
    setImages(selected);
  };

  const startEditComment = (commentId: string, content: string): void => {
    setEditingCommentId(commentId);
    setEditingCommentValue(content);
  };

  const cancelEditComment = (): void => {
    setEditingCommentId(null);
    setEditingCommentValue("");
  };

  const saveEditedComment = async (): Promise<void> => {
    if (!ticket || !editingCommentId || !editingCommentValue.trim()) return;

    try {
      await updateComment(ticket.id, editingCommentId, editingCommentValue.trim());
      toast.success("Comment updated");
      cancelEditComment();
      await refreshDetail();
    } catch (error) {
      toast.error("Could not update comment", getApiErrorMessage(error, "Try again."));
    }
  };

  const removeComment = async (commentId: string): Promise<void> => {
    if (!ticket) return;
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;

    try {
      await deleteComment(ticket.id, commentId);
      toast.success("Comment deleted");
      await refreshDetail();
    } catch (error) {
      toast.error("Could not delete comment", getApiErrorMessage(error, "Try again."));
    }
  };

  const canAddComment = Boolean(ticket?.links?.addComment);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Tickets</h1>
        <p className="mt-1 text-sm text-foreground/70">Monitor your support requests and their latest status updates.</p>
        <hr className="mt-4 -mx-4 border-border/70 sm:-mx-6 lg:-mx-8" />
      </div>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">Create Support Ticket</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Wi-Fi, Projector, Lab PC..." />
          <div>
            <label className="mb-1 block text-sm font-medium">Priority</label>
            <select
              className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
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
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue clearly so technicians can respond fast"
          />
        </div>
        <Input
          label="Preferred Contact (optional)"
          value={preferredContact}
          onChange={(e) => setPreferredContact(e.target.value)}
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
            onChange={(e) => handleFileSelection(e.target.files)}
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
          <Button type="button" onClick={() => void handleCreateTicket()} disabled={!canSubmit} isLoading={actionLoading}>
            Submit Ticket
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
              value={filters.status ?? ""}
              onChange={(e) => updateFilters({ status: (e.target.value || undefined) as typeof filters.status })}
            >
              <option value="">All</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div className="min-w-40 flex-1">
            <label className="mb-1 block text-sm font-medium">Priority</label>
            <select
              className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
              value={filters.priority ?? ""}
              onChange={(e) => updateFilters({ priority: (e.target.value || undefined) as typeof filters.priority })}
            >
              <option value="">All</option>
              {priorities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="outline" onClick={() => void refresh()} isLoading={loading}>
            Refresh
          </Button>
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelectedTicketId(item.id)}>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.priority}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeTone[item.status] || "bg-muted text-foreground"}`}>
                    {item.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className={`inline-block rounded px-2 py-0.5 text-xs ${item.firstResponseBreached ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      First response: {formatDurationLabel(item.timeToFirstResponse)}
                    </p>
                    <p className={`inline-block rounded px-2 py-0.5 text-xs ${item.resolutionBreached ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      Resolution: {formatDurationLabel(item.timeToResolution)}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {tickets.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-foreground/60">
                  No tickets found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground/70">
            Showing page {page + 1} of {Math.max(totalPages, 1)} ({totalElements} total)
          </p>
          <div className="flex items-center gap-2">
            <select className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm" value={size} onChange={(e) => setSize(Number(e.target.value))}>
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
            <Button type="button" variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 0 || loading}>
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={loading || totalPages === 0 || page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">Ticket Detail</h2>
        {detailError ? <p className="text-sm text-rose-600">{detailError}</p> : null}
        {!ticket && !detailLoading ? <p className="text-sm text-foreground/70">Select a ticket to view full details.</p> : null}

        {ticket ? (
          <>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <p><span className="font-medium">Category:</span> {ticket.category}</p>
              <p><span className="font-medium">Status:</span> {ticket.status}</p>
              <p><span className="font-medium">Priority:</span> {ticket.priority}</p>
              <p><span className="font-medium">Assigned:</span> {ticket.assignedToName ?? "Not assigned"}</p>
              <p>
                <span className="font-medium">First Response SLA:</span>{" "}
                <span className={ticket.firstResponseBreached ? "text-rose-700" : "text-emerald-700"}>
                  {ticket.firstResponseBreached ? "Breached" : "Within SLA"} ({formatDurationLabel(ticket.timeToFirstResponse)})
                </span>
              </p>
              <p>
                <span className="font-medium">Resolution SLA:</span>{" "}
                <span className={ticket.resolutionBreached ? "text-rose-700" : "text-emerald-700"}>
                  {ticket.resolutionBreached ? "Breached" : "Within SLA"} ({formatDurationLabel(ticket.timeToResolution)})
                </span>
              </p>
            </div>
            <p className="rounded-md bg-muted/30 p-3 text-sm">{ticket.description}</p>

            <div className="space-y-2">
              <h3 className="font-medium">Comments</h3>
              {!canAddComment ? <p className="text-xs text-foreground/60">You do not have permission to add comments for this ticket state.</p> : null}
              {commentError ? <p className="text-sm text-rose-600">{commentError}</p> : null}
              <ul className="space-y-2">
                {comments.map((comment) => (
                  <li key={comment.id} className="rounded-md border border-border/60 bg-background p-3 text-sm">
                    <p className="font-medium">{comment.userName}</p>
                    {editingCommentId === comment.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          className="min-h-[80px] w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
                          value={editingCommentValue}
                          onChange={(e) => setEditingCommentValue(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button type="button" size="sm" onClick={() => void saveEditedComment()} isLoading={commentLoading}>
                            Save
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={cancelEditComment}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1">{comment.content}</p>
                    )}
                    <p className="mt-1 text-xs text-foreground/60">{new Date(comment.createdAt).toLocaleString()}</p>
                    {editingCommentId !== comment.id && currentUser?.id === comment.userId ? (
                      <div className="mt-2 flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEditComment(comment.id, comment.content)}>
                          Edit
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => void removeComment(comment.id)}>
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
                {comments.length === 0 ? <li className="text-sm text-foreground/60">No comments yet.</li> : null}
              </ul>
              <div className="flex gap-2">
                <Input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} placeholder="Add a comment" />
                <Button type="button" onClick={() => void handleAddComment()} isLoading={commentLoading} disabled={!commentDraft.trim() || !canAddComment}>
                  Add
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </Card>
    </div>
  );
}
