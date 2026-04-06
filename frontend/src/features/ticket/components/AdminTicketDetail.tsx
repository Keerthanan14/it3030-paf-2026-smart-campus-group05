import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { formatDurationLabel } from "../utils/ticketUi";
import type { Ticket, TicketComment, TicketStatus } from "../../../types/ticket";

type AdminTicketDetailProps = {
  ticket: Ticket | null;
  detailLoading: boolean;
  detailError: string | null;
  actionError: string | null;
  commentError: string | null;
  actionLoading: boolean;
  commentLoading: boolean;
  canAssign: boolean;
  canUpdateStatus: boolean;
  canAddComment: boolean;
  technicianId: string;
  comments: TicketComment[];
  commentDraft: string;
  editingCommentId: string | null;
  editingCommentValue: string;
  currentUserId?: string;
  onTechnicianIdChange: (value: string) => void;
  onAssign: () => void;
  onStatusUpdate: (status: TicketStatus) => void;
  onCommentDraftChange: (value: string) => void;
  onAddComment: () => void;
  onStartEditComment: (commentId: string, content: string) => void;
  onCancelEditComment: () => void;
  onEditingCommentValueChange: (value: string) => void;
  onSaveEditedComment: () => void;
  onRemoveComment: (commentId: string) => void;
};

export function AdminTicketDetail({
  ticket,
  detailLoading,
  detailError,
  actionError,
  commentError,
  actionLoading,
  commentLoading,
  canAssign,
  canUpdateStatus,
  canAddComment,
  technicianId,
  comments,
  commentDraft,
  editingCommentId,
  editingCommentValue,
  currentUserId,
  onTechnicianIdChange,
  onAssign,
  onStatusUpdate,
  onCommentDraftChange,
  onAddComment,
  onStartEditComment,
  onCancelEditComment,
  onEditingCommentValueChange,
  onSaveEditedComment,
  onRemoveComment,
}: AdminTicketDetailProps) {
  return (
    <>
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
              onChange={(e) => onTechnicianIdChange(e.target.value)}
              placeholder="Paste technician user id"
            />
            <div className="flex items-end">
              <Button type="button" onClick={onAssign} isLoading={actionLoading} disabled={!technicianId.trim() || !canAssign}>
                Assign
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => onStatusUpdate("IN_PROGRESS")} isLoading={actionLoading} disabled={!canUpdateStatus}>
              Mark In Progress
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onStatusUpdate("RESOLVED")} isLoading={actionLoading} disabled={!canUpdateStatus}>
              Mark Resolved
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onStatusUpdate("CLOSED")} isLoading={actionLoading} disabled={!canUpdateStatus}>
              Mark Closed
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onStatusUpdate("REJECTED")} isLoading={actionLoading} disabled={!canUpdateStatus}>
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
                        onChange={(e) => onEditingCommentValueChange(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={onSaveEditedComment} isLoading={commentLoading}>
                          Save
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={onCancelEditComment}>
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
                        onClick={() => onStartEditComment(comment.id, comment.content)}
                        disabled={currentUserId !== comment.userId}
                      >
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="danger" onClick={() => onRemoveComment(comment.id)} disabled={!canAddComment}>
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
              {comments.length === 0 ? <li className="text-sm text-foreground/60">No comments yet.</li> : null}
            </ul>
            <div className="flex gap-2">
              <Input value={commentDraft} onChange={(e) => onCommentDraftChange(e.target.value)} placeholder="Add admin note" />
              <Button type="button" onClick={onAddComment} isLoading={commentLoading} disabled={!commentDraft.trim() || !canAddComment}>
                Add
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

export default AdminTicketDetail;
