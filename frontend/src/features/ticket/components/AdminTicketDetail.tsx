import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import type { Ticket, TicketComment, TicketStatus } from "../../../types/ticket";
import BaseTicketDetail from "./BaseTicketDetail";

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
  const metaFields = [
    { label: "Category", value: ticket?.category ?? "-" },
    { label: "Requester", value: ticket?.userName ?? "-" },
    { label: "Priority", value: ticket?.priority ?? "-" },
    { label: "Assigned", value: ticket?.assignedToName ?? "Unassigned" },
  ];

  const contentActions = (
    <>
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
    </>
  );

  return (
    <BaseTicketDetail
      title="Ticket Detail & Actions"
      emptyMessage="Select a ticket to manage assignment and status."
      ticket={ticket}
      detailLoading={detailLoading}
      detailError={detailError}
      actionError={actionError}
      commentError={commentError}
      commentLoading={commentLoading}
      canAddComment={canAddComment}
      cannotCommentMessage="Comment actions are not available for this ticket."
      commentInputPlaceholder="Add admin note"
      comments={comments}
      commentDraft={commentDraft}
      editingCommentId={editingCommentId}
      editingCommentValue={editingCommentValue}
      metaFields={metaFields}
      contentActions={contentActions}
      currentUserId={currentUserId}
      onCommentDraftChange={onCommentDraftChange}
      onAddComment={onAddComment}
      onCancelEditComment={onCancelEditComment}
      onEditingCommentValueChange={onEditingCommentValueChange}
      onSaveEditedComment={onSaveEditedComment}
      renderCommentActions={(comment) => (
        <>
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
        </>
      )}
    />
  );
}

export default AdminTicketDetail;
