import { useEffect, useState } from "react";
import { Button } from "../../shared/components/ui/Button";
import { Card } from "../../shared/components/ui/Card";
import { Input } from "../../shared/components/ui/Input";
import { useToast } from "../../shared/components/ui/ToastProvider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../shared/components/ui/Table";
import useTicketActions from "../../features/ticket/hooks/useTicketActions";
import useTicketAuditLogs from "../../features/ticket/hooks/useTicketAuditLogs";
import useTicketAutoRefresh from "../../features/ticket/hooks/useTicketAutoRefresh";
import useTicketComments from "../../features/ticket/hooks/useTicketComments";
import useTicketDetail from "../../features/ticket/hooks/useTicketDetail";
import useTicketsList from "../../features/ticket/hooks/useTicketsList";
import { formatDurationLabel, getApiErrorMessage } from "../../features/ticket/utils/ticketUi";
import { useAuthStore } from "../../core/store/authStore";
import type { TicketPriority, TicketStatus } from "../../types/ticket";

const statusOptions: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];
const priorityOptions: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const statusColor: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-sky-100 text-sky-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-slate-200 text-slate-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

export default function AdminTicketsPage() {
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

  const { loading: actionLoading, error: actionError, updateStatus, assignTechnician } = useTicketActions();
  const { ticket, loading: detailLoading, error: detailError, setSelectedTicketId, refresh: refreshDetail } = useTicketDetail();
  const {
    items: auditItems,
    loading: auditLoading,
    error: auditError,
    filters: auditFilters,
    page: auditPage,
    size: auditSize,
    totalPages: auditTotalPages,
    totalElements: auditTotalElements,
    setPage: setAuditPage,
    setSize: setAuditSize,
    updateFilters: updateAuditFilters,
    refresh: refreshAudit,
  } = useTicketAuditLogs({ defaultEntityType: "TICKET" });

  const [assignedToFilter, setAssignedToFilter] = useState(filters.assignedTo ?? "");
  const [technicianId, setTechnicianId] = useState("");
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

  const handleStatusUpdate = async (nextStatus: TicketStatus): Promise<void> => {
    if (!ticket) return;

    try {
      await updateStatus(ticket.id, { status: nextStatus });
      toast.success("Status updated", `Ticket is now ${nextStatus}.`);
      await Promise.all([refresh(), refreshDetail()]);
    } catch (error) {
      toast.error("Status update failed", getApiErrorMessage(error, "Try again."));
    }
  };

  const handleAssign = async (): Promise<void> => {
    if (!ticket || !technicianId.trim()) return;

    try {
      await assignTechnician(ticket.id, { technicianId: technicianId.trim() });
      setTechnicianId("");
      toast.success("Technician assigned");
      await Promise.all([refresh(), refreshDetail()]);
    } catch (error) {
      toast.error("Assignment failed", getApiErrorMessage(error, "Check technician ID."));
    }
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

  const canAssign = Boolean(ticket?.links?.assign);
  const canUpdateStatus = Boolean(ticket?.links?.updateStatus);
  const canAddComment = Boolean(ticket?.links?.addComment);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ticket Management</h1>
        <p className="mt-1 text-sm text-foreground/70">Review incidents, assignments, and overall ticket performance.</p>
        <hr className="mt-4 -mx-4 border-border/70 sm:-mx-6 lg:-mx-8" />
      </div>

      <Card className="space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
              value={filters.status ?? ""}
              onChange={(e) => updateFilters({ status: (e.target.value || undefined) as TicketStatus | undefined })}
            >
              <option value="">All</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Priority</label>
            <select
              className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
              value={filters.priority ?? ""}
              onChange={(e) => updateFilters({ priority: (e.target.value || undefined) as TicketPriority | undefined })}
            >
              <option value="">All</option>
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Input
              label="Assigned To (ID)"
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              placeholder="technician user id"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" onClick={() => updateFilters({ assignedTo: assignedToFilter.trim() || undefined })}>
              Apply
            </Button>
            <Button type="button" variant="outline" onClick={() => void refresh()} isLoading={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SLA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelectedTicketId(item.id)}>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.userName}</TableCell>
                <TableCell>{item.assignedToName ?? "Unassigned"}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor[item.status] || "bg-muted text-foreground"}`}>
                    {item.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className={`inline-block rounded px-2 py-0.5 text-xs ${item.firstResponseBreached ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      First: {formatDurationLabel(item.timeToFirstResponse)}
                    </p>
                    <p className={`inline-block rounded px-2 py-0.5 text-xs ${item.resolutionBreached ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      Resolve: {formatDurationLabel(item.timeToResolution)}
                    </p>
                  </div>
                </TableCell>
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
        <h2 className="text-lg font-semibold">Ticket Detail & Actions</h2>
        {detailError ? <p className="text-sm text-rose-600">{detailError}</p> : null}
        {actionError ? <p className="text-sm text-rose-600">{actionError}</p> : null}
        {!ticket && !detailLoading ? <p className="text-sm text-foreground/70">Select a ticket to manage assignment and status.</p> : null}

        {ticket ? (
          <>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <p><span className="font-medium">Category:</span> {ticket.category}</p>
              <p><span className="font-medium">Requester:</span> {ticket.userName}</p>
              <p><span className="font-medium">Priority:</span> {ticket.priority}</p>
              <p><span className="font-medium">Assigned:</span> {ticket.assignedToName ?? "Unassigned"}</p>
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

            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <Input
                label="Assign Technician ID"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                placeholder="Paste technician user id"
              />
              <div className="flex items-end">
                <Button type="button" onClick={() => void handleAssign()} isLoading={actionLoading} disabled={!technicianId.trim() || !canAssign}>
                  Assign
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => void handleStatusUpdate("IN_PROGRESS")} isLoading={actionLoading} disabled={!canUpdateStatus}>
                Mark In Progress
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void handleStatusUpdate("RESOLVED")} isLoading={actionLoading} disabled={!canUpdateStatus}>
                Mark Resolved
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void handleStatusUpdate("CLOSED")} isLoading={actionLoading} disabled={!canUpdateStatus}>
                Mark Closed
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void handleStatusUpdate("REJECTED")} isLoading={actionLoading} disabled={!canUpdateStatus}>
                Reject
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Comments</h3>
              {!canAddComment ? <p className="text-xs text-foreground/60">Comment actions are not available for this ticket.</p> : null}
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
                    {editingCommentId !== comment.id ? (
                      <div className="mt-2 flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => startEditComment(comment.id, comment.content)}
                          disabled={currentUser?.id !== comment.userId}
                        >
                          Edit
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => void removeComment(comment.id)} disabled={!canAddComment}>
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
                {comments.length === 0 ? <li className="text-sm text-foreground/60">No comments yet.</li> : null}
              </ul>
              <div className="flex gap-2">
                <Input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} placeholder="Add admin note" />
                <Button type="button" onClick={() => void handleAddComment()} isLoading={commentLoading} disabled={!commentDraft.trim() || !canAddComment}>
                  Add
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">Audit Trail</h2>

        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Entity Type</label>
            <Input
              value={auditFilters.entityType ?? ""}
              onChange={(e) => updateAuditFilters({ entityType: e.target.value || undefined })}
              placeholder="TICKET"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Action</label>
            <Input
              value={auditFilters.action ?? ""}
              onChange={(e) => updateAuditFilters({ action: e.target.value || undefined })}
              placeholder="STATUS_UPDATED"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">User ID</label>
            <Input
              value={auditFilters.userId ?? ""}
              onChange={(e) => updateAuditFilters({ userId: e.target.value || undefined })}
              placeholder="actor user id"
            />
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={() => void refreshAudit()} isLoading={auditLoading}>
              Refresh Logs
            </Button>
          </div>
        </div>

        {auditError ? <p className="text-sm text-rose-600">{auditError}</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.action}</TableCell>
                <TableCell>{item.entityType}:{item.entityId}</TableCell>
                <TableCell>{item.userName ?? item.userEmail ?? "System"}</TableCell>
                <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {auditItems.length === 0 && !auditLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-foreground/60">
                  No audit records found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground/70">
            Showing page {auditPage + 1} of {Math.max(auditTotalPages, 1)} ({auditTotalElements} total logs)
          </p>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm"
              value={auditSize}
              onChange={(e) => setAuditSize(Number(e.target.value))}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
            <Button type="button" variant="outline" size="sm" onClick={() => setAuditPage(auditPage - 1)} disabled={auditPage <= 0 || auditLoading}>
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAuditPage(auditPage + 1)}
              disabled={auditLoading || auditTotalPages === 0 || auditPage >= auditTotalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
