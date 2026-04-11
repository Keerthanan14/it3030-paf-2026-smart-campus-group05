import { useState } from "react";
import { Button } from "../../../shared/components/ui/Button";
import { Pencil, Trash2 } from "lucide-react";
import type { Ticket, TicketComment, TicketStatus } from "../../../types/ticket";
import BaseTicketDetail from "./BaseTicketDetail";

type TechnicianTicketDetailProps = {
  ticket: Ticket | null;
  detailLoading: boolean;
  detailError: string | null;
  actionError: string | null;
  commentError: string | null;
  actionLoading: boolean;
  commentLoading: boolean;
  canUpdateStatus: boolean;
  canAddComment: boolean;
  comments: TicketComment[];
  commentDraft: string;
  editingCommentId: string | null;
  editingCommentValue: string;
  currentUserId?: string;
  onStatusUpdate: (nextStatus: TicketStatus) => void;
  onCommentDraftChange: (value: string) => void;
  onAddComment: () => void;
  onStartEditComment: (commentId: string, content: string) => void;
  onCancelEditComment: () => void;
  onEditingCommentValueChange: (value: string) => void;
  onSaveEditedComment: () => void;
  onRemoveComment: (commentId: string) => void;
};

export function TechnicianTicketDetail({
  ticket,
  detailLoading,
  detailError,
  actionError,
  commentError,
  actionLoading,
  commentLoading,
  canUpdateStatus,
  canAddComment,
  comments,
  commentDraft,
  editingCommentId,
  editingCommentValue,
  currentUserId,
  onStatusUpdate,
  onCommentDraftChange,
  onAddComment,
  onStartEditComment,
  onCancelEditComment,
  onEditingCommentValueChange,
  onSaveEditedComment,
  onRemoveComment,
}: TechnicianTicketDetailProps) {
  const [deleteTargetCommentId, setDeleteTargetCommentId] = useState<string | null>(null);

  const getNextStatus = (status?: TicketStatus): TicketStatus | null => {
    if (status === "OPEN") return "IN_PROGRESS";
    if (status === "IN_PROGRESS") return "RESOLVED";
    return null;
  };

  const getNextStatusLabel = (status: TicketStatus): string => {
    if (status === "IN_PROGRESS") return "Mark In Progress";
    if (status === "RESOLVED") return "Mark Resolved";
    return "Update Status";
  };

  const nextStatus = getNextStatus(ticket?.status);

  const metaFields = [
    { label: "Category", value: ticket?.category ?? "-" },
    { label: "Status", value: ticket?.status ?? "-" },
    { label: "Priority", value: ticket?.priority ?? "-" },
    { label: "Requester", value: ticket?.userName ?? "-" },
  ];

  const confirmDeleteComment = (): void => {
    if (!deleteTargetCommentId) return;
    onRemoveComment(deleteTargetCommentId);
    setDeleteTargetCommentId(null);
  };

  const contentActions = (
    <div className="flex flex-wrap gap-2">
      {nextStatus ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onStatusUpdate(nextStatus)}
          isLoading={actionLoading}
          disabled={!canUpdateStatus}
        >
          {getNextStatusLabel(nextStatus)}
        </Button>
      ) : null}
    </div>
  );

  return (
    <BaseTicketDetail
      title="Ticket Detail"
      emptyMessage="Select a ticket to inspect and update status."
      ticket={ticket}
      contentActionsPosition="beforeStatus"
      detailLoading={detailLoading}
      detailError={detailError}
      actionError={actionError}
      commentError={commentError}
      commentLoading={commentLoading}
      canAddComment={canAddComment}
      cannotCommentMessage="Comment actions are not available for this ticket."
      commentInputPlaceholder="Add technical update"
      comments={comments}
      commentDraft={commentDraft}
      editingCommentId={editingCommentId}
      editingCommentValue={editingCommentValue}
      metaFields={metaFields}
      contentActions={contentActions}
      onCommentDraftChange={onCommentDraftChange}
      onAddComment={onAddComment}
      onCancelEditComment={onCancelEditComment}
      onEditingCommentValueChange={onEditingCommentValueChange}
      onSaveEditedComment={onSaveEditedComment}
      renderCommentActions={(comment) => {
        if (currentUserId !== comment.userId) return null;

        if (deleteTargetCommentId === comment.id) {
          return (
            <div className="flex items-center gap-1 rounded-md border border-border/70 bg-background/95 px-2 py-1 text-xs">
              <span>Delete?</span>
              <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setDeleteTargetCommentId(null)}>
                No
              </Button>
              <Button type="button" size="sm" variant="danger" className="h-6 px-2 text-xs" onClick={confirmDeleteComment}>
                Yes
              </Button>
            </div>
          );
        }

        return (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 border-0 p-0 shadow-none"
              onClick={() => onStartEditComment(comment.id, comment.content)}
              aria-label="Edit comment"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 border-0 p-0 text-rose-600 shadow-none hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setDeleteTargetCommentId(comment.id)}
              aria-label="Delete comment"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        );
      }}
    />
  );
}

export default TechnicianTicketDetail;
