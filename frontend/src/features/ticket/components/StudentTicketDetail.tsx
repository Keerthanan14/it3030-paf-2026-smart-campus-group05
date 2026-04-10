import { useState } from "react";
import { Button } from "../../../shared/components/ui/Button";
import { Pencil, Trash2 } from "lucide-react";
import type { Ticket, TicketComment } from "../../../types/ticket";
import BaseTicketDetail from "./BaseTicketDetail";

type StudentTicketDetailProps = {
  ticket: Ticket | null;
  detailLoading: boolean;
  detailError: string | null;
  commentError: string | null;
  commentLoading: boolean;
  canAddComment: boolean;
  comments: TicketComment[];
  commentDraft: string;
  editingCommentId: string | null;
  editingCommentValue: string;
  currentUserId?: string;
  onCommentDraftChange: (value: string) => void;
  onAddComment: () => void;
  onStartEditComment: (commentId: string, content: string) => void;
  onCancelEditComment: () => void;
  onEditingCommentValueChange: (value: string) => void;
  onSaveEditedComment: () => void;
  onRemoveComment: (commentId: string) => void;
};

export function StudentTicketDetail({
  ticket,
  detailLoading,
  detailError,
  commentError,
  commentLoading,
  canAddComment,
  comments,
  commentDraft,
  editingCommentId,
  editingCommentValue,
  currentUserId,
  onCommentDraftChange,
  onAddComment,
  onStartEditComment,
  onCancelEditComment,
  onEditingCommentValueChange,
  onSaveEditedComment,
  onRemoveComment,
}: StudentTicketDetailProps) {
  const [deleteTargetCommentId, setDeleteTargetCommentId] = useState<string | null>(null);

  const metaFields = [
    { label: "Category", value: ticket?.category ?? "-" },
    { label: "Status", value: ticket?.status ?? "-" },
    { label: "Priority", value: ticket?.priority ?? "-" },
    { label: "Assigned", value: ticket?.assignedToName ?? "Not assigned" },
  ];

  const confirmDeleteComment = (): void => {
    if (!deleteTargetCommentId) return;
    onRemoveComment(deleteTargetCommentId);
    setDeleteTargetCommentId(null);
  };

  return (
    <BaseTicketDetail
      title="Ticket Detail"
      emptyMessage="Select a ticket to view full details."
      ticket={ticket}
      detailLoading={detailLoading}
      detailError={detailError}
      commentError={commentError}
      commentLoading={commentLoading}
      canAddComment={canAddComment}
      cannotCommentMessage="You do not have permission to add comments for this ticket state."
      commentInputPlaceholder="Add a comment"
      comments={comments}
      commentDraft={commentDraft}
      editingCommentId={editingCommentId}
      editingCommentValue={editingCommentValue}
      metaFields={metaFields}
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

export default StudentTicketDetail;
